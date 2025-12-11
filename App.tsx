import './App.css';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Compass, User as UserIcon, Plus, Heart, MessageCircle, 
  Check, ArrowLeft, X, LogOut, Flame, Calendar, 
  Bell, Loader2, Signal, Wifi, Battery, ChevronRight, Trophy, Users,
  CheckCircle, Circle, Trash2, Send
} from 'lucide-react';

// ==========================================
// 1. CONFIGURATION
// ==========================================
// Using Vite env vars as per your previous stable versions
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

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedHobbies: string[];
  stats: {
    totalStreak: number;
    points: number;
  };
}

interface Hobby {
  id: string;
  name: string;
  description: string;
  category: HobbyCategory;
  memberCount: number;
  icon: string;
  image: string;
}

interface Post {
  id: string;
  userId: string;
  hobbyId: string;
  content: string;
  likes: number;
  isLiked?: boolean; // Optional for now
  comments: string[]; // Simple string array for now to match your stable version
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
}

interface Task {
  id: string;
  title: string;
  date: string; 
  completed: boolean;
  hobbyId?: string; 
}

// ==========================================
// 3. CONSTANTS & COMPONENTS
// ==========================================
const INITIAL_TASKS: Task[] = [
    { id: 't1', title: 'Complete 15 min flow', date: new Date().toISOString().split('T')[0], completed: false, hobbyId: 'h1' },
];

const LEADERBOARD_USERS = [
    { name: 'Priya C.', streak: 45, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
    { name: 'Jordan B.', streak: 32, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
];

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Data
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); 
  
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HobbyCategory>(HobbyCategory.ALL);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // UI
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initApp = async () => {
        if (!supabase) return;
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Reconstruct user object
                setCurrentUser({
                    id: session.user.id,
                    name: session.user.user_metadata.full_name || 'User',
                    email: session.user.email || '',
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
                    joinedHobbies: [], // Will fetch below
                    stats: { totalStreak: 0, points: 0 }
                });
                setView(ViewState.FEED);
                fetchData(session.user.id);
            }
        } catch (e) { console.log("Session check failed", e); }
        
        // Load tasks from database if possible, otherwise initial tasks
        setTasks(INITIAL_TASKS);
        
        // Fetch public data anyway
        await fetchHobbiesAndPosts();
        
        setIsAppLoading(false);
    };
    initApp();
  }, []);

  const fetchData = async (userId: string) => {
      if (!supabase) return;
      // Fetch Joined Hobbies
      const { data: joinedData } = await supabase.from('user_hobbies').select('hobby_id').eq('user_id', userId);
      const joinedIds = joinedData ? joinedData.map((d: any) => d.hobby_id) : [];
      
      setCurrentUser(prev => prev ? { ...prev, joinedHobbies: joinedIds } : null);

      // Fetch Tasks from DB
      const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', userId);
      if (tasksData) setTasks(tasksData);
  };

  const fetchHobbiesAndPosts = async () => {
      if (!supabase) return;
      
      // 1. Fetch Hobbies
      const { data: hobbiesData } = await supabase.from('hobbies').select('*');
      if (hobbiesData) {
          const formattedHobbies = hobbiesData.map((h: any) => ({
              ...h,
              memberCount: h.member_count || 0,
              image: h.image_url || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
              icon: h.icon || '✨'
          }));
          setHobbies(formattedHobbies);
      }

      // 2. Fetch Posts
      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (postsData) {
          const formattedPosts = postsData.map((p: any) => ({
              id: p.id,
              userId: p.user_id,
              hobbyId: p.hobby_id,
              content: p.content,
              likes: p.likes || 0,
              comments: [], // Simple array for now
              authorName: 'Community Member', 
              authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
              timestamp: new Date(p.created_at).toLocaleDateString()
          }));
          setPosts(formattedPosts);
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

  // --- HANDLERS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!supabase) {
        showToast("Supabase not connected", "error");
        setIsLoading(false);
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        showToast(error.message, 'error');
    } else if (data.session) {
        // Upsert Profile Logic (Fix for missing profiles)
        await supabase.from('profiles').upsert({
            id: data.session.user.id,
            email: email,
            name: email.split('@')[0],
            stats: { points: 0, totalStreak: 0 }
        });

        setCurrentUser({
            id: data.session.user.id,
            name: 'User',
            email: email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.session.user.id}`,
            joinedHobbies: [],
            stats: { totalStreak: 0, points: 0 }
        });
        await fetchData(data.session.user.id);
        setView(ViewState.FEED);
        showToast("Welcome back!");
    }
    setIsLoading(false);
  };

  const handleRegister = async () => {
      if (!supabase) return;
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
      });

      if (error) {
          showToast(error.message, 'error');
      } else {
          showToast("Account created! You can now log in.");
          setView(ViewState.LOGIN);
      }
      setIsLoading(false);
  };
  
  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      setCurrentUser(null);
      setEmail(''); setPassword(''); setName(''); // Clear inputs
      setView(ViewState.LOGIN);
  };

  const handleCreateHobby = async (name: string, description: string, category: HobbyCategory) => {
    if (!supabase || !currentUser) return;
    setIsLoading(true);
    
    const { data, error } = await supabase.from('hobbies').insert({
        name,
        description,
        category,
        icon: '🌟',
        member_count: 1
    }).select().single();

    if (error) {
        showToast("Failed to create", 'error');
    } else {
        await supabase.from('user_hobbies').insert({
            user_id: currentUser.id,
            hobby_id: data.id
        });
        
        await fetchHobbiesAndPosts();
        await fetchData(currentUser.id);
        setView(ViewState.EXPLORE);
        showToast("Community Created!");
    }
    setIsLoading(false);
  };

  const handleJoinCommunity = async (e: React.MouseEvent, hobbyId: string) => {
    e.stopPropagation();
    if (!supabase || !currentUser) return showToast("Please log in");
    if (currentUser.joinedHobbies.includes(hobbyId)) return showToast("Already joined!");
    
    const { error } = await supabase.from('user_hobbies').insert({
        user_id: currentUser.id,
        hobby_id: hobbyId
    });

    if (!error) {
        // Increment Count
        const current = hobbies.find(h => h.id === hobbyId);
        await supabase.from('hobbies').update({ member_count: (current?.memberCount || 0) + 1 }).eq('id', hobbyId);

        setCurrentUser(prev => prev ? { ...prev, joinedHobbies: [...prev.joinedHobbies, hobbyId] } : null);
        await fetchHobbiesAndPosts();
        showToast("Joined Community!");
    } else {
        showToast("Error joining", 'error');
    }
  };

  const handleViewCommunity = (hobby: Hobby) => {
      setSelectedHobby(hobby);
      setView(ViewState.COMMUNITY_DETAILS);
  };

  const handleCreatePost = async (content: string, hobbyId: string) => {
    if (!supabase || !currentUser) return;
    
    const { error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        hobby_id: hobbyId,
        content: content
    });

    if (!error) {
        if (currentUser) {
            setCurrentUser({
                ...currentUser,
                stats: { ...currentUser.stats, totalStreak: currentUser.stats.totalStreak + 1, points: currentUser.stats.points + 20 }
            });
        }
        await fetchHobbiesAndPosts();
        setView(ViewState.FEED);
        showToast("Posted! +20 XP 🔥");
        triggerConfetti();
    } else {
        showToast("Failed to post", 'error');
    }
  };

  // --- SCHEDULE FUNCTIONS (UPDATED FOR DB) ---
  const handleToggleTask = async (taskId: string) => {
      // Optimistic Update
      const task = tasks.find(t => t.id === taskId);
      const isCompleting = !task?.completed;
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: isCompleting } : t);
      setTasks(updatedTasks);
      
      if (isCompleting) {
          triggerConfetti();
          if (currentUser) {
              setCurrentUser({ ...currentUser, stats: { ...currentUser.stats, points: currentUser.stats.points + 50 } });
              showToast("Task Complete! +50 XP");
          }
      }

      // DB Sync
      if (supabase && currentUser) {
          await supabase.from('tasks').update({ completed: isCompleting }).eq('id', taskId);
      }
  };

  const handleAddTask = async (title: string, hobbyId?: string) => {
      if (!supabase || !currentUser) return showToast("Login to add tasks");
      
      const { data, error } = await supabase.from('tasks').insert({
          user_id: currentUser.id,
          title: title,
          date: selectedDate,
          completed: false
      }).select().single();

      if (data && !error) {
          setTasks([...tasks, data]);
          showToast("Task added");
      }
  };

  const handleDeleteTask = async (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (supabase) {
          await supabase.from('tasks').delete().eq('id', taskId);
      }
  };

  const getWeekDays = () => {
      const days = [];
      const today = new Date();
      for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          days.push(d);
      }
      return days;
  };

  // --- RENDER HELPERS ---

  const StatusBar = () => (
    <div className="flex justify-between items-center px-6 py-3 bg-slate-50 text-slate-900 text-xs font-bold sticky top-0 z-20">
        <span>9:41</span>
        <div className="flex gap-2"><Signal className="w-4 h-4" /><Wifi className="w-4 h-4" /><Battery className="w-4 h-4" /></div>
    </div>
  );

  if (isAppLoading) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center"><Loader2 className="text-white animate-spin w-8 h-8"/></div>;

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans p-0 sm:p-8">
      
      {/* PHONE FRAME */}
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-slate-50 sm:rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-[8px] border-neutral-800 ring-1 ring-white/10">
        
        <StatusBar />
        {toast && <Toast message={toast.message} type={toast.type} />}
        {showConfetti && <Confetti />}

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
            
            {view === ViewState.LOGIN && (
                <div className="h-full flex flex-col justify-center px-8">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-3xl mb-4 shadow-xl">
                            <Flame className="w-8 h-8 text-white" fill="currentColor" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Hobbystreak</h1>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input className="w-full p-4 bg-white rounded-2xl border-none shadow-sm" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl border-none shadow-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
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
                        <input className="w-full p-4 bg-white rounded-2xl shadow-sm" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl shadow-sm" placeholder="Email" />
                        <input className="w-full p-4 bg-white rounded-2xl shadow-sm" type="password" placeholder="Password" />
                        <Button className="w-full" onClick={handleRegister}>Sign Up</Button>
                    </div>
                </div>
            )}

            {view === ViewState.ONBOARDING && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <h1 className="text-2xl font-bold mb-2">Welcome! 🎉</h1>
                    <p className="text-slate-500 mb-8">Let's find your new hobby.</p>
                    <Button onClick={() => setView(ViewState.EXPLORE)}>Start Exploring</Button>
                </div>
            )}

            {view === ViewState.FEED && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-bold">Home</h1>
                        <button className="p-2 bg-white rounded-full shadow-sm"><Bell className="w-5 h-5" /></button>
                    </div>
                    
                    {/* User Stats Summary */}
                    <div className="bg-slate-900 text-white p-4 rounded-3xl mb-6 flex justify-between items-center shadow-lg shadow-slate-900/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-full"><Flame className="w-5 h-5 text-orange-400" fill="currentColor" /></div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Streak</p>
                                <p className="text-lg font-bold">{currentUser?.stats.totalStreak} Days</p>
                            </div>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                         <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-full"><Trophy className="w-5 h-5 text-yellow-400" /></div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Points</p>
                                <p className="text-lg font-bold">{currentUser?.stats.points}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {posts.map(post => {
                             const postHobby = hobbies.find(h => h.id === post.hobbyId);
                             return (
                                <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <img src={post.authorAvatar} className="w-10 h-10 rounded-full" />
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{post.authorName}</p>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                {post.timestamp} • {postHobby?.icon} {postHobby?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-800 mb-3 leading-relaxed">{post.content}</p>
                                    <div className="flex gap-4 text-slate-400 border-t border-slate-50 pt-3">
                                            <div className="flex items-center gap-1 text-xs"><Heart className="w-4 h-4" /> {post.likes}</div>
                                            <div className="flex items-center gap-1 text-xs"><MessageCircle className="w-4 h-4" /> {post.comments.length}</div>
                                    </div>
                                </div>
                             );
                        })}
                        {posts.length === 0 && <div className="text-center text-slate-400 mt-10">No posts yet. Join a community and start posting!</div>}
                    </div>
                </div>
            )}

            {view === ViewState.EXPLORE && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold">Explore</h1>
                        <button onClick={() => setView(ViewState.CREATE_HOBBY)} className="bg-slate-900 text-white p-2 rounded-full shadow-md"><Plus className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                        {Object.values(HobbyCategory).map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-100'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Leaderboard Section */}
                    <div className="mb-8">
                        <h2 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider">Top Streakers</h2>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {LEADERBOARD_USERS.map((user, i) => (
                                <div key={i} className="bg-white p-3 rounded-2xl shadow-sm min-w-[120px] flex flex-col items-center border border-slate-100 relative">
                                    {i === 0 && <div className="absolute -top-3"><Trophy className="w-6 h-6 text-yellow-400 fill-current" /></div>}
                                    <img src={user.avatar} className="w-12 h-12 rounded-full mb-2 bg-slate-100" />
                                    <p className="font-bold text-xs">{user.name}</p>
                                    <p className="text-[10px] text-orange-500 font-bold">🔥 {user.streak} days</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <h2 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider">Communities</h2>
                    <div className="space-y-4">
                        {hobbies
                            .filter(h => selectedCategory === HobbyCategory.ALL || h.category === selectedCategory)
                            .map(h => (
                            <div key={h.id} onClick={() => handleViewCommunity(h)} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm active:scale-95 transition-transform cursor-pointer">
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
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Community Name</label>
                            <input id="hobby-name" className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none" placeholder="e.g., Night Owls" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                            <textarea id="hobby-desc" className="w-full p-4 h-32 bg-slate-50 rounded-2xl mt-1 resize-none outline-none" placeholder="What is this community about?" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                            <select id="hobby-cat" className="w-full p-4 bg-slate-50 rounded-2xl mt-1 outline-none">
                                {Object.values(HobbyCategory).filter(c => c !== 'All').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <Button className="w-full mt-4" onClick={() => {
                            const name = (document.getElementById('hobby-name') as HTMLInputElement).value;
                            const desc = (document.getElementById('hobby-desc') as HTMLTextAreaElement).value;
                            const cat = (document.getElementById('hobby-cat') as HTMLSelectElement).value as HobbyCategory;
                            
                            if(name && desc) handleCreateHobby(name, desc, cat);
                            else showToast("Please fill all fields", "error");
                        }}>Create Community</Button>
                    </div>
                </div>
            )}

            {view === ViewState.CREATE_POST && (
                <div className="h-full bg-white p-6 pt-12">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">New Post</h2>
                        <button onClick={() => setView(ViewState.FEED)}><X className="w-6 h-6" /></button>
                    </div>
                    <textarea 
                        className="w-full h-40 bg-slate-50 p-4 rounded-2xl resize-none outline-none text-sm" 
                        placeholder="What did you achieve today?"
                        id="post-content"
                    />
                    <div className="mt-4">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Select Community</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                             {hobbies.filter(h => currentUser?.joinedHobbies.includes(h.id)).map(h => (
                                 <button key={h.id} className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap">
                                     <span>{h.icon}</span> {h.name}
                                 </button>
                             ))}
                        </div>
                    </div>
                    <Button className="w-full mt-8" onClick={() => {
                        const content = (document.getElementById('post-content') as HTMLTextAreaElement).value;
                        const firstHobby = currentUser?.joinedHobbies[0];
                        if (firstHobby) handleCreatePost(content, firstHobby);
                        else showToast("Please join a community first!", "error");
                    }}>Post Update (+20 XP)</Button>
                </div>
            )}

            {view === ViewState.COMMUNITY_DETAILS && selectedHobby && (
                <div className="bg-white min-h-full">
                     <div className="h-48 relative">
                         <img src={selectedHobby.image} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                         <button onClick={() => setView(ViewState.EXPLORE)} className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white"><ArrowLeft className="w-5 h-5" /></button>
                         <div className="absolute bottom-4 left-4 text-white">
                             <div className="flex items-center gap-2 mb-1">
                                 <span className="text-2xl">{selectedHobby.icon}</span>
                                 <h1 className="text-xl font-bold">{selectedHobby.name}</h1>
                             </div>
                             <p className="text-xs opacity-80">{selectedHobby.memberCount} members • {selectedHobby.category}</p>
                         </div>
                     </div>
                     <div className="p-6">
                         <p className="text-sm text-slate-600 mb-6 leading-relaxed">{selectedHobby.description}</p>
                         <Button className="w-full mb-8" onClick={(e: React.MouseEvent) => handleJoinCommunity(e, selectedHobby.id)} variant={currentUser?.joinedHobbies.includes(selectedHobby.id) ? 'secondary' : 'primary'}>
                             {currentUser?.joinedHobbies.includes(selectedHobby.id) ? 'Already Joined' : 'Join Community'}
                         </Button>
                         <h3 className="font-bold text-sm mb-4">Community Posts</h3>
                         <div className="space-y-4">
                             {posts.filter(p => p.hobbyId === selectedHobby.id).map(post => (
                                 <div key={post.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                     <div className="flex items-center gap-2 mb-2"><img src={post.authorAvatar} className="w-6 h-6 rounded-full" /><span className="text-xs font-bold">{post.authorName}</span></div>
                                     <p className="text-sm text-slate-700">{post.content}</p>
                                 </div>
                             ))}
                             {posts.filter(p => p.hobbyId === selectedHobby.id).length === 0 && (
                                 <p className="text-center text-sm text-slate-400 py-4">No posts yet. Be the first!</p>
                             )}
                         </div>
                     </div>
                </div>
            )}

            {view === ViewState.PROFILE && (
                <div className="px-6 pt-4">
                     <div className="flex justify-between items-center mb-8">
                        <h1 className="text-xl font-bold">Profile</h1>
                        <button onClick={handleLogout} className="text-red-500"><LogOut className="w-5 h-5" /></button>
                     </div>
                     <div className="text-center mb-8">
                         <div className="relative w-24 h-24 mx-auto mb-4">
                             <div className="w-full h-full rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg">
                                 <img src={currentUser?.avatar} className="w-full h-full object-cover" />
                             </div>
                             <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-slate-50">
                                 Lvl {Math.floor((currentUser?.stats.points || 0) / 100) + 1}
                             </div>
                         </div>
                         <h2 className="text-xl font-bold">{currentUser?.name}</h2>
                         <p className="text-sm text-slate-400">{currentUser?.email}</p>
                     </div>

                     {/* XP Progress Bar */}
                     <div className="bg-white p-6 rounded-3xl shadow-sm mb-6 border border-slate-100">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold text-slate-400 uppercase">XP Progress</span>
                             <span className="text-xs font-bold text-slate-900">{(currentUser?.stats.points || 0) % 100} / 100</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                             <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${(currentUser?.stats.points || 0) % 100}%` }}></div>
                         </div>
                         <p className="text-[10px] text-slate-400 mt-2 text-center">
                             {100 - ((currentUser?.stats.points || 0) % 100)} XP to next level
                         </p>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="bg-white p-4 rounded-3xl shadow-sm text-center">
                             <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-2"><Flame className="w-5 h-5" fill="currentColor" /></div>
                             <p className="text-2xl font-bold">{currentUser?.stats.totalStreak}</p>
                             <p className="text-[10px] uppercase font-bold text-slate-400">Streak</p>
                         </div>
                         <div className="bg-white p-4 rounded-3xl shadow-sm text-center">
                             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-2"><Users className="w-5 h-5" /></div>
                             <p className="text-2xl font-bold">{currentUser?.joinedHobbies.length}</p>
                             <p className="text-[10px] uppercase font-bold text-slate-400">Hobbies</p>
                         </div>
                     </div>

                     <h3 className="font-bold text-sm mb-4">My Hobbies</h3>
                     <div className="space-y-3">
                         {hobbies.filter(h => currentUser?.joinedHobbies.includes(h.id)).map(h => (
                             <div key={h.id} className="bg-white p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                                 <span className="text-2xl">{h.icon}</span>
                                 <div className="flex-1">
                                     <p className="font-bold text-sm">{h.name}</p>
                                     <p className="text-xs text-slate-400">{h.memberCount} members</p>
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-slate-300" />
                             </div>
                         ))}
                     </div>
                </div>
            )}

            {view === ViewState.SCHEDULE && (
                <div className="px-6 pt-4 h-full flex flex-col">
                    <h1 className="text-xl font-bold mb-6">Schedule</h1>
                    
                    {/* Weekly Calendar Strip */}
                    <div className="flex justify-between mb-8 overflow-x-auto no-scrollbar pb-2">
                        {getWeekDays().map((date, index) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = dateStr === selectedDate;
                            const isToday = dateStr === new Date().toISOString().split('T')[0];
                            
                            return (
                                <button key={index} onClick={() => setSelectedDate(dateStr)} className={`flex flex-col items-center justify-center min-w-[50px] h-[70px] rounded-2xl transition-all ${isSelected ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30 scale-105' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                    <span className="text-[10px] font-bold uppercase">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]}</span>
                                    <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{date.getDate()}</span>
                                    {isToday && !isSelected && <div className="w-1 h-1 bg-red-500 rounded-full mt-1"></div>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h2 className="font-bold text-lg">Your Tasks</h2>
                            <p className="text-xs text-slate-400">
                                {tasks.filter(t => t.date === selectedDate).length} tasks for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="flex-1 overflow-y-auto space-y-3 pb-24 pr-2">
                        {tasks.filter(t => t.date === selectedDate).map(task => {
                                const taskHobby = hobbies.find(h => h.id === task.hobbyId);
                                return (
                                    <div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-3 group">
                                            <button onClick={() => handleToggleTask(task.id)} className={`transition-colors ${task.completed ? 'text-green-500' : 'text-slate-200 hover:text-slate-300'}`}>
                                                {task.completed ? <CheckCircle className="w-6 h-6 text-green-100" fill="currentColor" /> : <Circle className="w-6 h-6" />}
                                            </button>
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</p>
                                                {taskHobby && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className="text-xs">{taskHobby.icon}</span>
                                                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{taskHobby.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                    </div>
                                );
                        })}
                        {tasks.filter(t => t.date === selectedDate).length === 0 && (
                            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                                <p>No tasks for this day.</p>
                                <p className="text-sm">Enjoy your free time!</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Add Task */}
                    <div className="absolute bottom-24 left-6 right-6">
                        <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 flex gap-2">
                            <input id="new-task-input" className="flex-1 pl-4 outline-none text-sm" placeholder="Add a new task..." onKeyDown={(e) => { if(e.key === 'Enter') { const input = e.currentTarget; handleAddTask(input.value, currentUser?.joinedHobbies[0]); input.value = ''; }}} />
                            <Button className="w-10 h-10 p-0 rounded-xl" onClick={() => { const input = document.getElementById('new-task-input') as HTMLInputElement; if(input.value) { handleAddTask(input.value, currentUser?.joinedHobbies[0]); input.value = ''; }}}>
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* BOTTOM NAVIGATION */}
        {![ViewState.LOGIN, ViewState.REGISTER, ViewState.ONBOARDING, ViewState.COMMUNITY_DETAILS].includes(view) && (
            <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-4 flex items-center justify-between border border-white/50">
                    <button onClick={() => setView(ViewState.FEED)} className={view === ViewState.FEED ? 'text-slate-900' : 'text-slate-300'}><Home className="w-6 h-6" /></button>
                    <button onClick={() => setView(ViewState.EXPLORE)} className={view === ViewState.EXPLORE ? 'text-slate-900' : 'text-slate-300'}><Compass className="w-6 h-6" /></button>
                    <button onClick={() => setView(ViewState.CREATE_POST)} className="bg-slate-900 text-white p-3 rounded-full shadow-lg -mt-8 border-4 border-slate-50"><Plus className="w-6 h-6" /></button>
                    <button onClick={() => setView(ViewState.PROFILE)} className={view === ViewState.PROFILE ? 'text-slate-900' : 'text-slate-300'}><UserIcon className="w-6 h-6" /></button>
                    <button onClick={() => setView(ViewState.SCHEDULE)} className={view === ViewState.SCHEDULE ? 'text-slate-900' : 'text-slate-300'}><Calendar className="w-6 h-6" /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
