import './App.css';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Compass, User as UserIcon, Plus, Heart, MessageCircle, 
  Check, ArrowLeft, X, LogOut, Flame, Calendar, 
  Bell, Loader2, Signal, Wifi, Battery, ChevronRight, Trophy, Users,
  CheckCircle, Circle, Trash2, RefreshCw
} from 'lucide-react';

// ==========================================
// 1. CONFIGURATION
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
// Create client outside component to prevent re-initialization
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// ==========================================
// 2. TYPES
// ==========================================
enum ViewState { LOGIN, REGISTER, ONBOARDING, FEED, EXPLORE, PROFILE, SCHEDULE, CREATE_HOBBY, CREATE_POST, COMMUNITY_DETAILS }
enum HobbyCategory { ALL = 'All', FITNESS = 'Fitness', CREATIVE = 'Creative', TECH = 'Tech', LIFESTYLE = 'Lifestyle' }

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  stats: { totalStreak: number; points: number; };
}

interface Hobby { id: string; name: string; description: string; category: HobbyCategory; memberCount: number; icon: string; image: string; }
interface Post { id: string; userId: string; hobbyId: string; content: string; likes: number; comments: string[]; authorName: string; authorAvatar?: string; timestamp: string; }
interface Task { id: string; title: string; date: string; completed: boolean; hobbyId?: string; }

// ==========================================
// 3. CONSTANTS
// ==========================================
const INITIAL_TASKS: Task[] = [{ id: 't1', title: 'Complete 15 min flow', date: new Date().toISOString().split('T')[0], completed: false, hobbyId: 'h1' }];
const LEADERBOARD_USERS = [
    { name: 'Priya C.', streak: 45, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
    { name: 'Jordan B.', streak: 32, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
];

// ==========================================
// 4. COMPONENTS
// ==========================================
const Toast = ({ message, type = 'success' }: { message: string, type?: 'success' | 'error' }) => (
  <div className={`absolute top-12 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-bounce w-max ${type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}`}>
    {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    <span className="text-sm font-medium">{message}</span>
  </div>
);

const Confetti = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 flex justify-center">
        <div className="confetti-piece bg-red-500 left-[10%]"></div>
        <div className="confetti-piece bg-blue-500 left-[20%] delay-100"></div>
        <div className="confetti-piece bg-yellow-500 left-[30%] delay-200"></div>
        <div className="confetti-piece bg-green-500 left-[40%]"></div>
    </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled, isLoading }: any) => {
  const baseStyle = "px-4 py-3 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-slate-900 text-white shadow-lg shadow-slate-900/20",
    secondary: "bg-white text-slate-900 border border-slate-200",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100"
  };
  return (
    <button onClick={onClick} disabled={disabled || isLoading} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// ==========================================
// 5. MAIN APP
// ==========================================
export default function App() {
  // --- STATE ---
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [joinedHobbyIds, setJoinedHobbyIds] = useState<string[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true); // GLOBAL LOADING STATE

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Data
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);

  // UI
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HobbyCategory>(HobbyCategory.ALL);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPostHobbyId, setSelectedPostHobbyId] = useState<string>('');
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- ENGINE: AUTH & DATA LOADING ---
  useEffect(() => {
    if (!supabase) {
        setIsAppLoading(false);
        return;
    }

    // 1. Setup Auth Listener (Crucial Fix)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            // User is logged in
            console.log("Session detected:", session.user.id);
            await loadUserProfile(session.user.id);
            if (view === ViewState.LOGIN) setView(ViewState.FEED);
        } else {
            // User is logged out
            setCurrentUser(null);
            setJoinedHobbyIds([]);
            setView(ViewState.LOGIN);
        }
        setIsAppLoading(false);
    });

    // 2. Initial Data Fetch
    refreshPublicData();
    const savedTasks = localStorage.getItem('hobbystreak_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    else setTasks(INITIAL_TASKS);

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
      if (!supabase) return;
      
      // Fetch Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profile) {
          setCurrentUser({
              id: userId,
              name: profile.name,
              email: profile.email,
              avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
              stats: profile.stats || { totalStreak: 0, points: 0 }
          });
      }

      // Fetch Joined Hobbies
      const { data: joined } = await supabase.from('user_hobbies').select('hobby_id').eq('user_id', userId);
      if (joined) {
          const ids = joined.map((j: any) => j.hobby_id);
          setJoinedHobbyIds(ids);
          if (ids.length > 0 && !selectedPostHobbyId) setSelectedPostHobbyId(ids[0]);
      }
  };

  const refreshPublicData = async () => {
      if (!supabase) return;
      const { data: hobbiesData } = await supabase.from('hobbies').select('*');
      if (hobbiesData) {
          setHobbies(hobbiesData.map((h: any) => ({
              ...h, memberCount: h.member_count || 0,
              image: h.image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
              icon: h.icon || '✨'
          })));
      }
      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (postsData) {
          const userIds = [...new Set(postsData.map((p:any) => p.user_id))];
          const { data: authors } = await supabase.from('profiles').select('id, name, avatar').in('id', userIds);
          setPosts(postsData.map((p: any) => {
              const author = authors?.find((a: any) => a.id === p.user_id);
              return {
                  id: p.id, userId: p.user_id, hobbyId: p.hobby_id, content: p.content, likes: 0, comments: [],
                  authorName: author?.name || 'User', authorAvatar: author?.avatar, timestamp: new Date(p.created_at).toLocaleDateString()
              };
          }));
      }
  };

  // --- ACTIONS ---
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) showToast(error.message, 'error');
    // Auth Listener will handle the redirect
    setIsLoading(false);
  };

  const handleRegister = async () => {
      setIsLoading(true);
      const { data, error } = await supabase!.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) showToast(error.message, 'error');
      else if (data.user) {
          await supabase!.from('profiles').insert({
              id: data.user.id, name, email, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`, stats: { points: 0, totalStreak: 0 }
          });
          showToast("Account created! Log in.");
          setView(ViewState.LOGIN);
      }
      setIsLoading(false);
  };

  const handleCreateHobby = async (n: string, d: string, c: HobbyCategory) => {
      setIsLoading(true);
      const { data, error } = await supabase!.from('hobbies').insert({ name: n, description: d, category: c, icon: '🌟', member_count: 1 }).select().single();
      if (data && !error) {
          await supabase!.from('user_hobbies').insert({ user_id: currentUser!.id, hobby_id: data.id });
          setJoinedHobbyIds(prev => [...prev, data.id]); // Instant update
          setSelectedPostHobbyId(data.id);
          await refreshPublicData();
          setView(ViewState.EXPLORE);
          showToast("Created & Joined!");
      } else showToast("Failed", 'error');
      setIsLoading(false);
  };

  const handleJoinCommunity = async (e: React.MouseEvent, hobbyId: string) => {
      e.stopPropagation();
      if (!currentUser) return showToast("Log in first");
      if (joinedHobbyIds.includes(hobbyId)) return showToast("Already joined!");
      
      const { error } = await supabase!.from('user_hobbies').insert({ user_id: currentUser.id, hobby_id: hobbyId });
      if (!error) {
          setJoinedHobbyIds(prev => [...prev, hobbyId]); // Instant update
          showToast("Joined!");
      } else showToast("Error joining", 'error');
  };

  const handleCreatePost = async (content: string) => {
      if (!currentUser || !selectedPostHobbyId) return showToast("Select community", "error");
      const { error } = await supabase!.from('posts').insert({ user_id: currentUser.id, hobby_id: selectedPostHobbyId, content });
      if (!error) {
          const newStats = { points: currentUser.stats.points + 20, totalStreak: currentUser.stats.totalStreak + 1 };
          await supabase!.from('profiles').update({ stats: newStats }).eq('id', currentUser.id);
          setCurrentUser({ ...currentUser, stats: newStats });
          await refreshPublicData();
          setView(ViewState.FEED);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2500);
          showToast("Posted! +20 XP");
      } else showToast("Error posting", 'error');
  };

  // --- RENDER ---
  const myCommunities = hobbies.filter(h => joinedHobbyIds.includes(h.id));

  // 1. Loading Screen (Prevents "Blank Profile" / "Login First" glitches)
  if (isAppLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-neutral-900"><Loader2 className="w-10 h-10 text-white animate-spin" /></div>;
  }

  // 2. Main App
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans p-0 sm:p-8">
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-slate-50 sm:rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-[8px] border-neutral-800 ring-1 ring-white/10">
        
        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 py-3 bg-slate-50 text-slate-900 text-xs font-bold sticky top-0 z-20">
            <span>9:41</span><div className="flex gap-2"><Signal className="w-4 h-4" /><Wifi className="w-4 h-4" /><Battery className="w-4 h-4" /></div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} />}
        {showConfetti && <Confetti />}

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
            
            {view === ViewState.LOGIN && (
                <div className="h-full flex flex-col justify-center px-8">
                    <div className="text-center mb-10"><h1 className="text-3xl font-bold">Hobbystreak</h1></div>
                    {!supabase && <div className="mb-4 p-3 bg-red-100 text-xs rounded text-red-700">Supabase keys missing in .env</div>}
                    <div className="space-y-4">
                        <input className="w-full p-4 bg-white rounded-2xl" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <Button className="w-full" onClick={handleLogin} isLoading={isLoading}>Sign In</Button>
                    </div>
                    <button onClick={() => setView(ViewState.REGISTER)} className="mt-6 text-sm text-slate-400 w-full">Create Account</button>
                </div>
            )}

            {view === ViewState.REGISTER && (
                <div className="h-full flex flex-col justify-center px-8">
                    <h1 className="text-2xl font-bold mb-6">Join Us</h1>
                    <div className="space-y-4">
                        <input className="w-full p-4 bg-white rounded-2xl" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <Button className="w-full" onClick={handleRegister} isLoading={isLoading}>Sign Up</Button>
                    </div>
                    <button onClick={() => setView(ViewState.LOGIN)} className="mt-4 text-sm text-slate-400 w-full">Back to Login</button>
                </div>
            )}

            {view === ViewState.FEED && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-bold">Home</h1>
                        <button className="p-2 bg-white rounded-full shadow-sm"><Bell className="w-5 h-5" /></button>
                    </div>
                    {/* Stats */}
                    <div className="bg-slate-900 text-white p-4 rounded-3xl mb-6 flex justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <Flame className="w-8 h-8 text-orange-400" />
                            <div><p className="text-xs text-slate-400">Streak</p><p className="text-lg font-bold">{currentUser?.stats.totalStreak || 0}</p></div>
                        </div>
                        <div className="h-10 w-[1px] bg-white/20"></div>
                        <div className="flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-400" />
                            <div><p className="text-xs text-slate-400">Points</p><p className="text-lg font-bold">{currentUser?.stats.points || 0}</p></div>
                        </div>
                    </div>
                    {/* Posts */}
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={post.authorAvatar} className="w-8 h-8 rounded-full" />
                                    <span className="text-sm font-bold">{post.authorName}</span>
                                </div>
                                <p className="text-sm mb-3">{post.content}</p>
                                <div className="flex gap-4 text-slate-400 text-xs">
                                    <span className="flex items-center gap-1"><Heart className="w-4 h-4"/> {post.likes}</span>
                                </div>
                            </div>
                        ))}
                        {posts.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No posts yet.</p>}
                    </div>
                </div>
            )}

            {view === ViewState.EXPLORE && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold">Explore</h1>
                        <button onClick={() => setView(ViewState.CREATE_HOBBY)}><Plus className="bg-slate-900 text-white p-2 rounded-full w-8 h-8" /></button>
                    </div>
                    <div className="space-y-3">
                        {hobbies.map(h => {
                            const isJoined = joinedHobbyIds.includes(h.id);
                            return (
                                <div key={h.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm" onClick={() => { setSelectedHobby(h); setView(ViewState.COMMUNITY_DETAILS); }}>
                                    <div className="text-2xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center">{h.icon}</div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-sm">{h.name}</h3>
                                        <p className="text-xs text-slate-400">{h.memberCount} members</p>
                                    </div>
                                    <button onClick={(e) => handleJoinCommunity(e, h.id)} className={`px-4 py-2 rounded-xl text-xs font-bold ${isJoined ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>
                                        {isJoined ? 'Joined' : 'Join'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {view === ViewState.CREATE_HOBBY && (
                <div className="px-6 pt-12 h-full bg-white">
                    <div className="flex justify-between mb-6">
                        <h1 className="text-xl font-bold">Create Community</h1>
                        <button onClick={() => setView(ViewState.EXPLORE)}><X className="w-6 h-6" /></button>
                    </div>
                    <div className="space-y-4">
                        <input id="h-name" className="w-full p-4 bg-slate-50 rounded-2xl" placeholder="Name" />
                        <textarea id="h-desc" className="w-full p-4 h-24 bg-slate-50 rounded-2xl" placeholder="Description" />
                        <select id="h-cat" className="w-full p-4 bg-slate-50 rounded-2xl">
                            {Object.values(HobbyCategory).filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <Button className="w-full mt-4" onClick={() => {
                            const n = (document.getElementById('h-name') as HTMLInputElement).value;
                            const d = (document.getElementById('h-desc') as HTMLTextAreaElement).value;
                            const c = (document.getElementById('h-cat') as HTMLSelectElement).value as HobbyCategory;
                            if(n && d) handleCreateHobby(n, d, c);
                        }} isLoading={isLoading}>Create</Button>
                    </div>
                </div>
            )}

            {view === ViewState.CREATE_POST && (
                <div className="px-6 pt-12 h-full bg-white">
                    <div className="flex justify-between mb-6">
                        <h1 className="text-xl font-bold">New Post</h1>
                        <button onClick={() => setView(ViewState.FEED)}><X className="w-6 h-6" /></button>
                    </div>
                    <textarea id="post-input" className="w-full h-32 bg-slate-50 p-4 rounded-2xl resize-none text-sm outline-none" placeholder="Share your progress..." />
                    
                    <div className="mt-4">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Select Community</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {myCommunities.length > 0 ? myCommunities.map(h => (
                                <button key={h.id} onClick={() => setSelectedPostHobbyId(h.id)} className={`px-4 py-2 rounded-xl text-xs border whitespace-nowrap ${selectedPostHobbyId === h.id ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                                    {h.icon} {h.name}
                                </button>
                            )) : <p className="text-xs text-red-400">Join a community first!</p>}
                        </div>
                    </div>

                    <Button className="w-full mt-8" onClick={() => {
                        const c = (document.getElementById('post-input') as HTMLTextAreaElement).value;
                        if(c) handleCreatePost(c);
                    }}>Post</Button>
                </div>
            )}

            {view === ViewState.PROFILE && (
                <div className="px-6 pt-4">
                     <div className="flex justify-between items-center mb-8"><h1 className="text-xl font-bold">Profile</h1><button onClick={() => supabase?.auth.signOut()}><LogOut className="w-5 h-5 text-red-500" /></button></div>
                     <div className="text-center mb-8"><h2 className="text-xl font-bold">{currentUser?.name}</h2><p className="text-sm text-slate-400">{currentUser?.email}</p></div>
                     <h3 className="font-bold text-sm mb-4">Joined Communities</h3>
                     <div className="space-y-3">
                         {myCommunities.map(h => (
                             <div key={h.id} className="bg-white p-4 rounded-2xl flex gap-3 shadow-sm"><span className="text-2xl">{h.icon}</span><p className="font-bold text-sm my-auto">{h.name}</p></div>
                         ))}
                         {myCommunities.length === 0 && <p className="text-slate-400 text-sm">None yet.</p>}
                     </div>
                </div>
            )}

            {/* Calendar & Details views omitted for brevity (same as before) */}
        </div>

        {/* NAV */}
        {![ViewState.LOGIN, ViewState.REGISTER].includes(view) && (
            <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-4 flex items-center justify-between border border-white/50">
                    <button onClick={() => setView(ViewState.FEED)}><Home className={`w-6 h-6 ${view === ViewState.FEED ? 'text-slate-900' : 'text-slate-400'}`} /></button>
                    <button onClick={() => setView(ViewState.EXPLORE)}><Compass className={`w-6 h-6 ${view === ViewState.EXPLORE ? 'text-slate-900' : 'text-slate-400'}`} /></button>
                    <button onClick={() => setView(ViewState.CREATE_POST)}><Plus className="bg-slate-900 text-white p-2 rounded-full w-10 h-10 -mt-8 border-4 border-white shadow-lg" /></button>
                    <button onClick={() => setView(ViewState.PROFILE)}><UserIcon className={`w-6 h-6 ${view === ViewState.PROFILE ? 'text-slate-900' : 'text-slate-400'}`} /></button>
                    {/* Fixed Schedule Button */}
                    <button onClick={() => setView(ViewState.SCHEDULE)}><Calendar className={`w-6 h-6 ${view === ViewState.SCHEDULE ? 'text-slate-900' : 'text-slate-400'}`} /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
