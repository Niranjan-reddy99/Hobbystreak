import './App.css';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Compass, User as UserIcon, Plus, Heart, MessageCircle, 
  Check, ArrowLeft, X, LogOut, Flame, Calendar, 
  Bell, Loader2, Signal, Wifi, Battery, ChevronRight, Trophy, Users,
  CheckCircle, Circle, Trash2, RefreshCw
} from 'lucide-react';

// --- CONFIGURATION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPES ---
enum ViewState { LOGIN, REGISTER, ONBOARDING, FEED, EXPLORE, PROFILE, SCHEDULE, CREATE_HOBBY, CREATE_POST, COMMUNITY_DETAILS }
enum HobbyCategory { ALL = 'All', FITNESS = 'Fitness', CREATIVE = 'Creative', TECH = 'Tech', LIFESTYLE = 'Lifestyle' }

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedHobbies: string[]; 
  stats: { totalStreak: number; points: number; };
}

interface Hobby { id: string; name: string; description: string; category: HobbyCategory; memberCount: number; icon: string; image: string; }
interface Post { id: string; userId: string; hobbyId: string; content: string; likes: number; comments: string[]; authorName: string; authorAvatar?: string; timestamp: string; }
interface Task { id: string; title: string; date: string; completed: boolean; hobbyId?: string; }

// --- CONSTANTS ---
const INITIAL_TASKS: Task[] = [{ id: 't1', title: 'Complete 15 min flow', date: new Date().toISOString().split('T')[0], completed: false, hobbyId: 'h1' }];
const LEADERBOARD_USERS = [
    { name: 'Priya C.', streak: 45, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
    { name: 'Jordan B.', streak: 32, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
];

// --- COMPONENTS ---
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

// --- MAIN APP ---
export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Data
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  
  // UI State
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HobbyCategory>(HobbyCategory.ALL);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPostHobbyId, setSelectedPostHobbyId] = useState<string>('');
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- INIT ---
  useEffect(() => {
    const initData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await fetchHobbiesAndPosts();
        await fetchLeaderboard();

        if (session) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            const { data: joinedData } = await supabase.from('user_hobbies').select('hobby_id').eq('user_id', session.user.id);
            const joinedIds = joinedData ? joinedData.map((d: any) => d.hobby_id) : [];

            setCurrentUser({
                id: session.user.id,
                name: profile?.name || 'User',
                email: session.user.email || '',
                avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
                joinedHobbies: joinedIds, 
                stats: profile?.stats || { totalStreak: 0, points: 0 }
            });
            setView(ViewState.FEED);
        }
        
        const savedTasks = localStorage.getItem('hobbystreak_tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        else setTasks(INITIAL_TASKS);
    };
    initData();
  }, []);

  // --- HELPERS ---
  const refreshUserData = async () => {
      if (!currentUser) return;
      const { data: joinedData } = await supabase.from('user_hobbies').select('hobby_id').eq('user_id', currentUser.id);
      const joinedIds = joinedData ? joinedData.map((d: any) => d.hobby_id) : [];
      setCurrentUser(prev => prev ? { ...prev, joinedHobbies: joinedIds } : null);
      console.log("Refreshed Joined IDs:", joinedIds);
  };

  const fetchHobbiesAndPosts = async () => {
      const { data: hobbiesData } = await supabase.from('hobbies').select('*');
      if (hobbiesData) {
          setHobbies(hobbiesData.map((h: any) => ({
              ...h, memberCount: h.member_count || 0,
              image: h.image_url || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853',
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

  const fetchLeaderboard = async () => {
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles) {
          const sorted = profiles.map((p: any) => ({
              id: p.id, name: p.name, avatar: p.avatar, stats: p.stats || { points: 0, totalStreak: 0 }
          })).sort((a: any, b: any) => b.stats.points - a.stats.points).slice(0, 5);
          setLeaderboard(sorted as User[]);
      }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerConfetti = () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
  };

  // --- ACTION HANDLERS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showToast(error.message, 'error');
    else if (data.session) window.location.reload();
    setIsLoading(false);
  };

  const handleRegister = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) showToast(error.message, 'error');
      else if (data.user) {
          await supabase.from('profiles').insert({ id: data.user.id, name: name, email: email, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`, stats: { points: 0, totalStreak: 0 } });
          showToast("Account created! Log in.");
          setView(ViewState.LOGIN);
      }
      setIsLoading(false);
  };

  const handleCreateHobby = async (name: string, description: string, category: HobbyCategory) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('hobbies').insert({ name, description, category, icon: '🌟', member_count: 1 }).select().single();
    if (!error && data) {
        await supabase.from('user_hobbies').insert({ user_id: currentUser!.id, hobby_id: data.id });
        await refreshUserData();
        await fetchHobbiesAndPosts();
        setView(ViewState.EXPLORE);
        showToast("Created & Joined!");
    } else showToast("Failed to create", 'error');
    setIsLoading(false);
  };

  const handleJoinCommunity = async (e: React.MouseEvent, hobbyId: string) => {
    e.stopPropagation();
    if (!currentUser) return showToast("Log in first");
    if (currentUser.joinedHobbies.includes(hobbyId)) return showToast("Already joined!");
    
    const { error } = await supabase.from('user_hobbies').insert({ user_id: currentUser.id, hobby_id: hobbyId });
    if (!error) {
        await refreshUserData(); // Force sync
        showToast("Joined!");
    } else showToast("Error joining", 'error');
  };

  const handleCreatePost = async (content: string, hobbyId: string) => {
    if (!hobbyId) return showToast("Select a community", "error");
    const { error } = await supabase.from('posts').insert({ user_id: currentUser!.id, hobby_id: hobbyId, content });
    if (!error) {
        const newStats = { points: currentUser!.stats.points + 20, totalStreak: currentUser!.stats.totalStreak + 1 };
        await supabase.from('profiles').update({ stats: newStats }).eq('id', currentUser!.id);
        setCurrentUser({ ...currentUser!, stats: newStats });
        await fetchHobbiesAndPosts();
        setView(ViewState.FEED);
        showToast("Posted! +20 XP 🔥");
        triggerConfetti();
    } else showToast("Failed to post", 'error');
  };

  // --- RENDER ---
  const myCommunities = hobbies.filter(h => currentUser?.joinedHobbies.includes(h.id));

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans p-0 sm:p-8">
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-slate-50 sm:rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-[8px] border-neutral-800 ring-1 ring-white/10">
        
        {/* STATUS BAR */}
        <div className="flex justify-between items-center px-6 py-3 bg-slate-50 text-slate-900 text-xs font-bold sticky top-0 z-20">
            <span>9:41</span><div className="flex gap-2"><Signal className="w-4 h-4" /><Wifi className="w-4 h-4" /><Battery className="w-4 h-4" /></div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} />}
        {showConfetti && <Confetti />}

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
            
            {view === ViewState.LOGIN && (
                <div className="h-full flex flex-col justify-center px-8">
                    <div className="text-center mb-10"><h1 className="text-2xl font-bold">Hobbystreak</h1></div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input className="w-full p-4 bg-white rounded-2xl shadow-sm" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl shadow-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <Button type="submit" className="w-full" isLoading={isLoading}>Sign In</Button>
                    </form>
                    <button onClick={() => setView(ViewState.REGISTER)} className="mt-6 text-sm text-slate-400">Create Account</button>
                </div>
            )}

            {view === ViewState.REGISTER && (
                <div className="h-full flex flex-col justify-center px-8">
                    <button onClick={() => setView(ViewState.LOGIN)} className="absolute top-12 left-6 p-2 bg-white rounded-full"><ArrowLeft className="w-5 h-5" /></button>
                    <h1 className="text-2xl font-bold mb-6">Join Us</h1>
                    <div className="space-y-4">
                        <input className="w-full p-4 bg-white rounded-2xl" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <Button className="w-full" onClick={handleRegister}>Sign Up</Button>
                    </div>
                </div>
            )}

            {view === ViewState.FEED && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-bold">Home</h1>
                        <button className="p-2 bg-white rounded-full shadow-sm"><Bell className="w-5 h-5" /></button>
                    </div>
                    {/* Stats Card */}
                    <div className="bg-slate-900 text-white p-4 rounded-3xl mb-6 flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-full"><Flame className="w-5 h-5 text-orange-400" fill="currentColor" /></div>
                            <div><p className="text-xs text-slate-400 font-bold uppercase">Streak</p><p className="text-lg font-bold">{currentUser?.stats.totalStreak} Days</p></div>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                         <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-full"><Trophy className="w-5 h-5 text-yellow-400" /></div>
                            <div><p className="text-xs text-slate-400 font-bold uppercase">Points</p><p className="text-lg font-bold">{currentUser?.stats.points}</p></div>
                        </div>
                    </div>
                    {/* Posts */}
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={post.authorAvatar} className="w-10 h-10 rounded-full" />
                                    <div className="flex-1"><p className="font-bold text-sm">{post.authorName}</p><p className="text-[10px] text-slate-400">{post.timestamp}</p></div>
                                </div>
                                <p className="text-sm text-slate-800 mb-3">{post.content}</p>
                                <div className="flex gap-4 text-slate-400 border-t border-slate-50 pt-3">
                                    <div className="flex items-center gap-1 text-xs"><Heart className="w-4 h-4" /> {post.likes}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === ViewState.EXPLORE && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold">Explore</h1>
                        <button onClick={() => setView(ViewState.CREATE_HOBBY)} className="bg-slate-900 text-white p-2 rounded-full shadow-md"><Plus className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                        {hobbies.map(h => (
                            <div key={h.id} onClick={() => { setSelectedHobby(h); setView(ViewState.COMMUNITY_DETAILS); }} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm cursor-pointer">
                                <div className="text-3xl bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center">{h.icon}</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm">{h.name}</h3>
                                    <p className="text-xs text-slate-400">{h.memberCount} members</p>
                                </div>
                                <Button variant={currentUser?.joinedHobbies.includes(h.id) ? 'ghost' : 'secondary'} className="text-xs py-2 px-3 h-auto" onClick={(e: React.MouseEvent) => handleJoinCommunity(e, h.id)}>
                                    {currentUser?.joinedHobbies.includes(h.id) ? 'Joined' : 'Join'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === ViewState.CREATE_HOBBY && (
                <div className="h-full bg-white p-6 pt-12">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">New Community</h2>
                        <button onClick={() => setView(ViewState.EXPLORE)}><X className="w-6 h-6" /></button>
                    </div>
                    <div className="space-y-4">
                        <input id="hobby-name" className="w-full p-4 bg-slate-50 rounded-2xl" placeholder="Name" />
                        <textarea id="hobby-desc" className="w-full p-4 h-32 bg-slate-50 rounded-2xl" placeholder="Description" />
                        <select id="hobby-cat" className="w-full p-4 bg-slate-50 rounded-2xl">
                            {Object.values(HobbyCategory).filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <Button className="w-full mt-4" onClick={() => {
                            const name = (document.getElementById('hobby-name') as HTMLInputElement).value;
                            const desc = (document.getElementById('hobby-desc') as HTMLTextAreaElement).value;
                            const cat = (document.getElementById('hobby-cat') as HTMLSelectElement).value as HobbyCategory;
                            if(name && desc) handleCreateHobby(name, desc, cat);
                        }}>Create</Button>
                    </div>
                </div>
            )}

            {view === ViewState.CREATE_POST && (
                <div className="h-full bg-white p-6 pt-12">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">New Post</h2>
                        <button onClick={() => setView(ViewState.FEED)}><X className="w-6 h-6" /></button>
                    </div>
                    <textarea className="w-full h-40 bg-slate-50 p-4 rounded-2xl resize-none outline-none text-sm" placeholder="What's happening?" id="post-content" />
                    
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase">Select Community</p>
                            <button onClick={refreshUserData} className="text-xs text-blue-500 flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Refresh List</button>
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto pb-2">
                             {myCommunities.length > 0 ? myCommunities.map(h => (
                                 <button key={h.id} onClick={() => setSelectedPostHobbyId(h.id)} className={`border px-3 py-2 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap transition-colors ${selectedPostHobbyId === h.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}>
                                     <span>{h.icon}</span> {h.name}
                                 </button>
                             )) : <p className="text-xs text-slate-400 p-2 border border-dashed rounded-xl w-full text-center">You haven't joined any communities yet.</p>}
                        </div>
                        {/* DEBUG INFO */}
                        <small className="text-[10px] text-slate-300 mt-2 block">Joined IDs: {currentUser?.joinedHobbies.length}</small>
                    </div>
                    
                    <Button className="w-full mt-8" onClick={() => {
                        const content = (document.getElementById('post-content') as HTMLTextAreaElement).value;
                        if (!content) return showToast("Write something!", "error");
                        // Fallback: If no button clicked, use first available
                        const targetId = selectedPostHobbyId || myCommunities[0]?.id;
                        handleCreatePost(content, targetId);
                    }}>Post Update</Button>
                </div>
            )}

            {/* PROFILE, SCHEDULE, DETAILS Views omitted for brevity but logic is identical to previous */}
            {view === ViewState.PROFILE && (
                <div className="px-6 pt-4">
                     <div className="flex justify-between items-center mb-8"><h1 className="text-xl font-bold">Profile</h1><button onClick={() => supabase?.auth.signOut().then(() => window.location.reload())}><LogOut className="w-5 h-5 text-red-500" /></button></div>
                     <div className="text-center mb-8"><h2 className="text-xl font-bold">{currentUser?.name}</h2></div>
                     <div className="space-y-3">
                         {myCommunities.map(h => (
                             <div key={h.id} className="bg-white p-4 rounded-2xl flex items-center gap-3 shadow-sm"><span className="text-2xl">{h.icon}</span><p className="font-bold text-sm flex-1">{h.name}</p></div>
                         ))}
                     </div>
                </div>
            )}
        </div>

        {/* NAV */}
        {![ViewState.LOGIN, ViewState.REGISTER].includes(view) && (
            <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-4 flex items-center justify-between border border-white/50">
                    <button onClick={() => setView(ViewState.FEED)}><Home className="w-6 h-6 text-slate-900" /></button>
                    <button onClick={() => setView(ViewState.EXPLORE)}><Compass className="w-6 h-6 text-slate-900" /></button>
                    <button onClick={() => setView(ViewState.CREATE_POST)}><Plus className="w-6 h-6 text-slate-900" /></button>
                    <button onClick={() => setView(ViewState.PROFILE)}><UserIcon className="w-6 h-6 text-slate-900" /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
