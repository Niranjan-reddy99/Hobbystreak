import './App.css';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Compass, User as UserIcon, Plus, Heart, MessageCircle, 
  Check, ArrowLeft, X, LogOut, Flame, Calendar, 
  Bell, Loader2, Signal, Wifi, Battery, ChevronRight, Trophy, Users,
  CheckCircle, Circle, Trash2
} from 'lucide-react';

// --- CONFIGURATION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// --- TYPES ---
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

// --- MAIN APP ---
export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // CORE STATE
  const [joinedHobbyIds, setJoinedHobbyIds] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);

  // UI STATE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HobbyCategory>(HobbyCategory.ALL);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPostHobbyId, setSelectedPostHobbyId] = useState<string>('');
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initApp = async () => {
        if (!supabase) return;

        // 1. Check Session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
             // Load Profile
             const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
             setCurrentUser({
                id: session.user.id,
                name: profile?.name || session.user.email,
                email: session.user.email || '',
                avatar: profile?.avatar,
                stats: profile?.stats || { totalStreak: 0, points: 0 }
             });
             setView(ViewState.FEED);
             
             // Load Joined Hobbies
             fetchJoinedHobbies(session.user.id);
        }

        // 2. Load Data
        fetchHobbiesAndPosts();
        
        // 3. Local Tasks
        const savedTasks = localStorage.getItem('hobbystreak_tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        else setTasks(INITIAL_TASKS);
        
        setIsAppLoading(false);
    };
    initApp();
  }, []);

  // --- DATA FETCHING ---
  const fetchJoinedHobbies = async (userId: string) => {
      if (!supabase) return;
      const { data } = await supabase.from('user_hobbies').select('hobby_id').eq('user_id', userId);
      const ids = data ? data.map((x: any) => x.hobby_id) : [];
      setJoinedHobbyIds(ids);
      if (ids.length > 0) setSelectedPostHobbyId(ids[0]); // Auto-select first hobby for posting
  };

  const fetchHobbiesAndPosts = async () => {
      if (!supabase) return;
      // Fetch Hobbies
      const { data: hData } = await supabase.from('hobbies').select('*');
      if (hData) {
          setHobbies(hData.map((h: any) => ({
              id: h.id, name: h.name, description: h.description, category: h.category,
              memberCount: h.member_count, icon: h.icon, image: h.image_url
          })));
      }
      // Fetch Posts
      const { data: pData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (pData) {
           // Basic mapping (skipping author join for simplicity in this fix)
           setPosts(pData.map((p: any) => ({
               id: p.id, userId: p.user_id, hobbyId: p.hobby_id, content: p.content,
               likes: p.likes, comments: [], authorName: 'User', authorAvatar: '', timestamp: 'Just now'
           })));
      }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) showToast(error.message, 'error');
    else if (data.session) window.location.reload();
    setIsLoading(false);
  };

  const handleRegister = async () => {
      setIsLoading(true);
      const { data, error } = await supabase!.auth.signUp({ email, password });
      if (error) showToast(error.message, 'error');
      else if (data.user) {
          await supabase!.from('profiles').insert({ id: data.user.id, name, email, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` });
          showToast("Created! Log in now.");
          setView(ViewState.LOGIN);
      }
      setIsLoading(false);
  };

  const handleCreateHobby = async (name: string, description: string, category: HobbyCategory) => {
      if (!currentUser) return;
      setIsLoading(true);
      
      // 1. Insert Hobby
      const { data, error } = await supabase!.from('hobbies').insert({
          name, description, category, icon: '🌟', member_count: 1, image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f'
      }).select().single();

      if (data && !error) {
          // 2. Insert Join
          await supabase!.from('user_hobbies').insert({ user_id: currentUser.id, hobby_id: data.id });
          
          // 3. Force Local Update
          setJoinedHobbyIds(prev => [...prev, data.id]); 
          setSelectedPostHobbyId(data.id);
          
          await fetchHobbiesAndPosts(); // Get new hobby list
          setView(ViewState.EXPLORE);
          showToast("Created & Joined!");
      } else {
          showToast("Failed to create", 'error');
      }
      setIsLoading(false);
  };

  const handleJoinCommunity = async (e: React.MouseEvent, hobbyId: string) => {
      e.stopPropagation();
      if (!currentUser) return showToast("Log in first");
      if (joinedHobbyIds.includes(hobbyId)) return showToast("Already joined!");
      
      const { error } = await supabase!.from('user_hobbies').insert({ user_id: currentUser.id, hobby_id: hobbyId });
      
      if (!error) {
          setJoinedHobbyIds(prev => [...prev, hobbyId]);
          setSelectedPostHobbyId(hobbyId);
          showToast("Joined!");
      } else {
          showToast("Error joining", 'error');
      }
  };

  const handleCreatePost = async (content: string) => {
      if (!currentUser || !selectedPostHobbyId) return showToast("Select a community", "error");
      
      const { error } = await supabase!.from('posts').insert({
          user_id: currentUser.id,
          hobby_id: selectedPostHobbyId,
          content
      });

      if (!error) {
          await fetchHobbiesAndPosts();
          setView(ViewState.FEED);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
          showToast("Posted!");
      } else {
          showToast("Error posting", 'error');
      }
  };

  // --- RENDER HELPERS ---
  const myCommunities = hobbies.filter(h => joinedHobbyIds.includes(h.id));

  if (isAppLoading) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center"><Loader2 className="text-white animate-spin w-8 h-8"/></div>;

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans p-0 sm:p-8">
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-slate-50 sm:rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-[8px] border-neutral-800 ring-1 ring-white/10">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center px-6 py-3 bg-slate-50 text-slate-900 text-xs font-bold sticky top-0 z-20">
            <span>9:41</span><div className="flex gap-2"><Signal className="w-4 h-4" /><Wifi className="w-4 h-4" /><Battery className="w-4 h-4" /></div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} />}
        {showConfetti && <Confetti />}

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
            
            {view === ViewState.LOGIN && (
                <div className="h-full flex flex-col justify-center px-8">
                    <h1 className="text-3xl font-bold text-center mb-10">Hobbystreak</h1>
                    {!supabase && <div className="p-3 bg-red-100 text-red-700 text-xs mb-4">Supabase Not Connected</div>}
                    <input className="w-full p-4 bg-white rounded-2xl mb-4" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    <input className="w-full p-4 bg-white rounded-2xl mb-4" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    <Button className="w-full" onClick={handleLogin} isLoading={isLoading}>Sign In</Button>
                    <button onClick={() => setView(ViewState.REGISTER)} className="mt-6 text-sm text-slate-400 w-full">Create Account</button>
                </div>
            )}

            {view === ViewState.REGISTER && (
                <div className="h-full flex flex-col justify-center px-8">
                    <h1 className="text-2xl font-bold mb-6">Join Us</h1>
                    <input className="w-full p-4 bg-white rounded-2xl mb-4" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    <input className="w-full p-4 bg-white rounded-2xl mb-4" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    <input className="w-full p-4 bg-white rounded-2xl mb-4" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    <Button className="w-full" onClick={handleRegister} isLoading={isLoading}>Sign Up</Button>
                    <button onClick={() => setView(ViewState.LOGIN)} className="mt-4 text-sm text-slate-400 w-full">Back to Login</button>
                </div>
            )}

            {view === ViewState.FEED && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-6"><h1 className="text-xl font-bold">Home</h1><Bell className="w-5 h-5" /></div>
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm">
                                <p className="text-sm mb-3">{post.content}</p>
                                <div className="flex gap-4 text-slate-400 text-xs"><span className="flex items-center gap-1"><Heart className="w-4 h-4"/> {post.likes}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === ViewState.EXPLORE && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-4"><h1 className="text-xl font-bold">Explore</h1><button onClick={() => setView(ViewState.CREATE_HOBBY)}><Plus className="bg-slate-900 text-white p-2 rounded-full w-8 h-8" /></button></div>
                    <div className="space-y-3">
                        {hobbies.map(h => {
                            const isJoined = joinedHobbyIds.includes(h.id);
                            return (
                                <div key={h.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm">
                                    <div className="text-2xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center">{h.icon}</div>
                                    <div className="flex-1"><h3 className="font-bold text-sm">{h.name}</h3><p className="text-xs text-slate-400">{h.memberCount} members</p></div>
                                    <button onClick={(e) => handleJoinCommunity(e, h.id)} className={`px-4 py-2 rounded-xl text-xs font-bold ${isJoined ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>{isJoined ? 'Joined' : 'Join'}</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {view === ViewState.CREATE_HOBBY && (
                <div className="px-6 pt-12 h-full bg-white">
                    <h1 className="text-xl font-bold mb-6">Create Community</h1>
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
                        <button onClick={() => setView(ViewState.EXPLORE)} className="w-full text-center text-slate-400 text-sm">Cancel</button>
                    </div>
                </div>
            )}

            {view === ViewState.CREATE_POST && (
                <div className="px-6 pt-12 h-full bg-white">
                    <h1 className="text-xl font-bold mb-6">New Post</h1>
                    <textarea id="post-input" className="w-full h-32 bg-slate-50 p-4 rounded-2xl resize-none text-sm outline-none" placeholder="Share your progress..." />
                    <div className="mt-4">
                        <div className="flex justify-between mb-2"><label className="text-xs font-bold text-slate-400 uppercase">Select Community</label></div>
                        <div className="flex gap-2 overflow-x-auto pb-4">
                            {myCommunities.length > 0 ? myCommunities.map(h => (
                                <button key={h.id} onClick={() => setSelectedPostHobbyId(h.id)} className={`px-4 py-2 rounded-xl text-xs border whitespace-nowrap transition-colors ${selectedPostHobbyId === h.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>{h.icon} {h.name}</button>
                            )) : <p className="text-xs text-red-400">Join a community first!</p>}
                        </div>
                    </div>
                    <Button className="w-full mt-8" onClick={() => {
                        const c = (document.getElementById('post-input') as HTMLTextAreaElement).value;
                        if(c) handleCreatePost(c);
                    }}>Post</Button>
                    <button onClick={() => setView(ViewState.FEED)} className="w-full text-center text-slate-400 text-sm mt-4">Cancel</button>
                </div>
            )}

            {view === ViewState.PROFILE && (
                <div className="px-6 pt-4">
                     <div className="flex justify-between items-center mb-8"><h1 className="text-xl font-bold">Profile</h1><button onClick={() => supabase?.auth.signOut().then(() => window.location.reload())}><LogOut className="w-5 h-5 text-red-500" /></button></div>
                     <div className="text-center mb-8"><h2 className="text-xl font-bold">{currentUser?.name}</h2></div>
                     <h3 className="font-bold text-sm mb-4">Joined Communities</h3>
                     <div className="space-y-3">
                         {myCommunities.map(h => (
                             <div key={h.id} className="bg-white p-4 rounded-2xl flex gap-3 shadow-sm"><span className="text-2xl">{h.icon}</span><p className="font-bold text-sm my-auto">{h.name}</p></div>
                         ))}
                         {myCommunities.length === 0 && <p className="text-slate-400 text-sm">None yet.</p>}
                     </div>
                </div>
            )}
        </div>

        {/* NAV */}
        {![ViewState.LOGIN, ViewState.REGISTER].includes(view) && (
            <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-4 flex items-center justify-between border border-white/50">
                    <button onClick={() => setView(ViewState.FEED)}><Home className={`w-6 h-6 ${view === ViewState.FEED ? 'text-slate-900' : 'text-slate-400'}`} /></button>
                    <button onClick={() => setView(ViewState.EXPLORE)}><Compass className={`w-6 h-6 ${view === ViewState.EXPLORE ? 'text-slate-900' : 'text-slate-400'}`} /></button>
                    <button onClick={() => setView(ViewState.CREATE_POST)}><Plus className="bg-slate-900 text-white p-2 rounded-full w-10 h-10 -mt-8 border-4 border-white shadow-lg" /></button>
                    <button onClick={() => setView(ViewState.PROFILE)}><UserIcon className={`w-6 h-6 ${view === ViewState.PROFILE ? 'text-slate-900' : 'text-slate-400'}`} /></button>
                    <button onClick={() => setView(ViewState.SCHEDULE)}><Calendar className={`w-6 h-6 ${view === ViewState.SCHEDULE ? 'text-slate-900' : 'text-slate-400'}`} /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
