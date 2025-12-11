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

const memoryStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => memoryStorage.store[key] || null,
  setItem: (key: string, value: string) => { memoryStorage.store[key] = value; },
  removeItem: (key: string) => { delete memoryStorage.store[key]; }
};

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: memoryStorage,
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }) 
  : null;

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
interface Post { id: string; userId: string; hobbyId: string | null; content: string; likes: number; comments: string[]; authorName: string; authorAvatar?: string; timestamp: string; }
interface Task { id: string; title: string; date: string; completed: boolean; hobbyId?: string; }

// ==========================================
// 3. CONSTANTS & COMPONENTS
// ==========================================
const INITIAL_TASKS: Task[] = [{ id: 't1', title: 'Complete 15 min flow', date: new Date().toISOString().split('T')[0], completed: false, hobbyId: 'h1' }];

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
// 4. MAIN APP
// ==========================================
export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Data
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [joinedHobbyIds, setJoinedHobbyIds] = useState<string[]>([]);

  // Inputs
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
        
        await fetchHobbiesAndPosts();
        
        const savedTasks = localStorage.getItem('hobbystreak_tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        else setTasks(INITIAL_TASKS);

        setIsAppLoading(false);
    };
    initApp();
  }, []);

  const loadUserProfile = async (user: any) => {
      if (!supabase) return;
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      setCurrentUser({
          id: user.id,
          name: profile?.name || user.email?.split('@')[0],
          email: user.email || '',
          avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          stats: profile?.stats || { totalStreak: 0, points: 0 }
      });

      const { data: joined } = await supabase.from('user_hobbies').select('hobby_id').eq('user_id', user.id);
      if (joined) {
          const ids = joined.map((j: any) => j.hobby_id);
          setJoinedHobbyIds(ids);
          if (ids.length > 0) setSelectedPostHobbyId(ids[0]);
      }
  };

  const fetchHobbiesAndPosts = async () => {
      if (!supabase) return;
      
      const { data: hobbiesData } = await supabase.from('hobbies').select('*');
      if (hobbiesData) {
          setHobbies(hobbiesData.map((h: any) => ({
              id: h.id, name: h.name, description: h.description, category: h.category,
              memberCount: h.member_count || 0, icon: h.icon || '✨', image: h.image_url
          })));
      }

      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (postsData) {
          const userIds = [...new Set(postsData.map((p:any) => p.user_id).filter(Boolean))];
          let authors: any[] = [];
          if (userIds.length > 0) {
              const { data } = await supabase.from('profiles').select('id, name, avatar').in('id', userIds);
              authors = data || [];
          }

          setPosts(postsData.map((p: any) => {
              const author = authors.find((a: any) => a.id === p.user_id);
              return {
                  id: p.id, userId: p.user_id, hobbyId: p.hobby_id, content: p.content,
                  likes: p.likes || 0, comments: [],
                  authorName: author?.name || 'Anonymous', 
                  authorAvatar: author?.avatar,
                  timestamp: new Date(p.created_at).toLocaleDateString()
              };
          }));
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

  // --- ACTIONS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!supabase) { setIsLoading(false); return; }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        showToast(error.message, 'error');
    } else if (data.session) {
        await supabase.from('profiles').upsert({
            id: data.session.user.id, email: email, name: email.split('@')[0], stats: { points: 0, totalStreak: 0 }
        });
        await loadUserProfile(data.session.user);
        setEmail(''); setPassword('');
        setView(ViewState.FEED);
        showToast("Welcome back!");
    }
    setIsLoading(false);
  };

  const handleRegister = async () => {
      setIsLoading(true);
      if (!supabase) return;
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) showToast(error.message, 'error');
      else if (data.user) {
          await supabase.from('profiles').insert({
              id: data.user.id, name: name, email: email,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`, stats: { points: 0, totalStreak: 0 }
          });
          if (data.session) { await loadUserProfile(data.user); setView(ViewState.FEED); } 
          else { showToast("Account created! Log in."); setView(ViewState.LOGIN); }
      }
      setIsLoading(false);
  };

  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      setCurrentUser(null);
      setJoinedHobbyIds([]);
      setEmail(''); setPassword(''); setName('');
      setView(ViewState.LOGIN);
  };

  const handleCreatePost = async (content: string) => {
      if (!supabase) return showToast("DB Error", "error");
      
      const uid = currentUser?.id;
      const targetHobbyId = selectedPostHobbyId || null; 

      const { error } = await supabase.from('posts').insert({
          user_id: uid || null, hobby_id: targetHobbyId, content
      });

      if (!error) {
          if (uid && currentUser) {
              const newStats = { points: currentUser.stats.points + 20, totalStreak: currentUser.stats.totalStreak + 1 };
              await supabase.from('profiles').update({ stats: newStats }).eq('id', uid);
              setCurrentUser({ ...currentUser, stats: newStats });
          }
          await fetchHobbiesAndPosts();
          if (view !== ViewState.COMMUNITY_DETAILS) setView(ViewState.FEED);
          triggerConfetti();
          showToast("Posted!");
      } else {
          showToast("Error: " + error.message, 'error');
      }
  };
  // --- PASTE THIS NEW FUNCTION ---
  const handleLike = async (postId: string, currentLikes: number) => {
      if (!supabase) return;
      
      // 1. Optimistic Update (Updates the number on screen immediately)
      setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes: currentLikes + 1 } : p
      ));

      // 2. Update Database in background
      const { error } = await supabase
        .from('posts')
        .update({ likes: currentLikes + 1 })
        .eq('id', postId);

      if (error) {
          console.error("Like failed:", error);
          showToast("Failed to update like", "error");
      }
  };
  // -----------------------------

  // --- FIXED: Create Hobby now sets member_count to 1 in DB ---
  const handleCreateHobby = async (n: string, d: string, c: HobbyCategory) => {
      setIsLoading(true);
      if (!currentUser || !supabase) return;

      const { data, error } = await supabase.from('hobbies').insert({
          name: n, description: d, category: c, icon: '🌟', 
          member_count: 1, // Set initial DB count
          image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f'
      }).select().single();

      if (data && !error) {
          await supabase.from('user_hobbies').insert({ user_id: currentUser.id, hobby_id: data.id });
          setJoinedHobbyIds(prev => [...prev, data.id]);
          
          await fetchHobbiesAndPosts(); // Refresh list to get accurate data
          
          const newHobby = { ...data, memberCount: 1, icon: '🌟', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f' };
          setSelectedHobby(newHobby);
          setView(ViewState.COMMUNITY_DETAILS);
          
          showToast("Created!");
      } else {
          showToast(error?.message || "Failed", 'error');
      }
      setIsLoading(false);
  };

  // --- FIXED: Join Community now increments DB count ---
  const handleJoinCommunity = async (e: React.MouseEvent, hobbyId: string) => {
      e.stopPropagation();
      if (!currentUser || !supabase) return showToast("Log in first");
      if (joinedHobbyIds.includes(hobbyId)) return showToast("Already joined!");
      
      // 1. Insert into Join Table
      const { error } = await supabase.from('user_hobbies').insert({ user_id: currentUser.id, hobby_id: hobbyId });
      
      if (!error) {
          // 2. Local Update
          setJoinedHobbyIds(prev => [...prev, hobbyId]);
          
          // 3. Database Increment (The Critical Fix)
          const currentHobby = hobbies.find(h => h.id === hobbyId);
          const newCount = (currentHobby?.memberCount || 0) + 1;
          
          await supabase.from('hobbies').update({ member_count: newCount }).eq('id', hobbyId);
          
          // 4. Update UI List
          setHobbies(prev => prev.map(h => h.id === hobbyId ? { ...h, memberCount: newCount } : h));
          
          showToast("Joined!");
      } else {
          showToast("Error joining", 'error');
      }
  };

  // --- RENDER ---
  const myCommunities = hobbies.filter(h => joinedHobbyIds.includes(h.id));

  if (isAppLoading) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center"><Loader2 className="text-white animate-spin w-8 h-8"/></div>;

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
                    <h1 className="text-3xl font-bold text-center mb-10">Hobbystreak</h1>
                    {!supabase && <div className="p-3 bg-red-100 text-red-700 text-xs mb-4 rounded">Supabase keys missing</div>}
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
                    <div className="flex justify-between items-center mb-6"><h1 className="text-xl font-bold">Home</h1><Bell className="w-5 h-5" /></div>
                    <div className="bg-slate-900 text-white p-4 rounded-3xl mb-6 flex justify-between shadow-lg">
                        <div className="flex items-center gap-3"><Flame className="w-8 h-8 text-orange-400" /><div><p className="text-xs text-slate-400">Streak</p><p className="text-lg font-bold">{currentUser?.stats.totalStreak || 0}</p></div></div>
                        <div className="h-10 w-[1px] bg-white/20"></div>
                        <div className="flex items-center gap-3"><Trophy className="w-8 h-8 text-yellow-400" /><div><p className="text-xs text-slate-400">Points</p><p className="text-lg font-bold">{currentUser?.stats.points || 0}</p></div></div>
                    </div>
                    <div className="space-y-4">
                        {posts.map(post => {
                            const postHobby = hobbies.find(h => h.id === post.hobbyId);
                            return (
                            <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} className="w-8 h-8 rounded-full" />
                                    <div className="flex-1">
                                        <span className="text-sm font-bold block">{post.authorName}</span>
                                        {postHobby && <span className="text-xs text-slate-400 flex items-center gap-1">{postHobby.icon} {postHobby.name}</span>}
                                    </div>
                                </div>
                                <p className="text-sm mb-3">{post.content}</p>
                                
                                {/* --- THIS IS THE NEW LIKE BUTTON --- */}
                                <div className="flex gap-4 text-slate-400 text-xs border-t pt-3">
                                    <button 
                                        onClick={() => handleLike(post.id, post.likes)} 
                                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                                    >
                                        <Heart className="w-4 h-4" /> {post.likes}
                                    </button>
                                </div>
                                {/* ----------------------------------- */}
                            </div>
                        )})}
                        {posts.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No posts yet.</p>}
                    </div>
                </div>
            )}

            {view === ViewState.EXPLORE && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-4"><h1 className="text-xl font-bold">Explore</h1><button onClick={() => setView(ViewState.CREATE_HOBBY)}><Plus className="bg-slate-900 text-white p-2 rounded-full w-8 h-8" /></button></div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                        {Object.values(HobbyCategory).map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-white border'}`}>{cat}</button>)}
                    </div>
                    <div className="space-y-3">
                        {hobbies.filter(h => selectedCategory === HobbyCategory.ALL || h.category === selectedCategory).map(h => {
                            const isJoined = joinedHobbyIds.includes(h.id);
                            return (
                                <div key={h.id} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm" onClick={() => { setSelectedHobby(h); setView(ViewState.COMMUNITY_DETAILS); }}>
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
                    <div className="flex justify-between mb-6"><h1 className="text-xl font-bold">Create Community</h1><button onClick={() => setView(ViewState.EXPLORE)}><X className="w-6 h-6" /></button></div>
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
                    <div className="flex justify-between mb-6"><h1 className="text-xl font-bold">New Post</h1><button onClick={() => setView(ViewState.FEED)}><X className="w-6 h-6" /></button></div>
                    <textarea id="post-input" className="w-full h-32 bg-slate-50 p-4 rounded-2xl resize-none text-sm outline-none" placeholder="Share your progress..." />
                    
                    <div className="mt-4">
                        <label className="text-xs font-bold text-slate-400 uppercase">Select Community</label>
                        <div className="flex gap-2 overflow-x-auto pb-4 mt-2">
                            {myCommunities.map(h => (
                                <button 
                                    key={h.id} 
                                    onClick={() => setSelectedPostHobbyId(h.id)}
                                    className={`px-4 py-2 rounded-xl text-xs border whitespace-nowrap transition-colors ${selectedPostHobbyId === h.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
                                >
                                    {h.icon} {h.name}
                                </button>
                            ))}
                            {myCommunities.length === 0 && <p className="text-xs text-slate-400 p-2 border border-dashed rounded w-full">Join a community or post globally.</p>}
                        </div>
                    </div>

                    <Button className="w-full mt-8" onClick={() => {
                        const c = (document.getElementById('post-input') as HTMLTextAreaElement).value;
                        if(c) handleCreatePost(c);
                    }}>Post Now</Button>
                </div>
            )}

            {view === ViewState.COMMUNITY_DETAILS && selectedHobby && (
                <div className="bg-white min-h-full">
                     <div className="h-48 relative">
                         <img src={selectedHobby.image} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                         <button onClick={() => setView(ViewState.EXPLORE)} className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white"><ArrowLeft className="w-5 h-5" /></button>
                         <div className="absolute bottom-4 left-4 text-white"><div className="flex items-center gap-2 mb-1"><span className="text-2xl">{selectedHobby.icon}</span><h1 className="text-xl font-bold">{selectedHobby.name}</h1></div><p className="text-xs opacity-80">{selectedHobby.memberCount} members</p></div>
                     </div>
                     <div className="p-6">
                         <p className="text-sm text-slate-600 mb-6">{selectedHobby.description}</p>
                         
                         {joinedHobbyIds.includes(selectedHobby.id) ? (
                            <Button className="w-full mb-8" onClick={() => {
                                setSelectedPostHobbyId(selectedHobby.id); // Pre-select
                                setView(ViewState.CREATE_POST); // Go to post screen
                            }}>Write a Post</Button>
                         ) : (
                            <Button className="w-full mb-8" onClick={(e: React.MouseEvent) => handleJoinCommunity(e, selectedHobby.id)}>Join Community</Button>
                         )}

                         <h3 className="font-bold text-sm mb-4">Community Posts</h3>
                         <div className="space-y-4">
                             {posts.filter(p => p.hobbyId === selectedHobby.id).map(post => (
                                 <div key={post.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                     <div className="flex items-center gap-2 mb-2"><img src={post.authorAvatar} className="w-6 h-6 rounded-full" /><span className="text-xs font-bold">{post.authorName}</span></div>
                                     <p className="text-sm text-slate-700">{post.content}</p>
                                 </div>
                             ))}
                             {posts.filter(p => p.hobbyId === selectedHobby.id).length === 0 && <p className="text-center text-sm text-slate-400 py-4">No posts yet. Be the first!</p>}
                         </div>
                     </div>
                </div>
            )}

            {view === ViewState.PROFILE && (
                 <div className="px-6 pt-4"><div className="flex justify-between items-center mb-8"><h1 className="text-xl font-bold">Profile</h1><button onClick={handleLogout}><LogOut className="w-5 h-5 text-red-500" /></button></div><h2 className="text-xl font-bold text-center">{currentUser?.name || "Guest"}</h2>
                 <h3 className="font-bold text-sm mb-4 mt-8">Joined Communities</h3>
                 <div className="space-y-3">
                     {myCommunities.map(h => (
                         <div key={h.id} className="bg-white p-4 rounded-2xl flex gap-3 shadow-sm"><span className="text-2xl">{h.icon}</span><p className="font-bold text-sm my-auto">{h.name}</p></div>
                     ))}
                     {myCommunities.length === 0 && <p className="text-slate-400 text-sm">None yet.</p>}
                 </div>
                 </div>
            )}

            {view === ViewState.SCHEDULE && (
                 <div className="px-6 pt-4"><h1 className="text-xl font-bold mb-6">Schedule</h1><p className="text-sm text-slate-500">Tasks</p></div>
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

