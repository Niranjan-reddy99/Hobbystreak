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
const isSupabaseConfigured = supabaseUrl && supabaseKey;

const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- TYPES ---
enum ViewState {
  LOGIN, REGISTER, ONBOARDING, FEED, EXPLORE, PROFILE, SCHEDULE, 
  CREATE_HOBBY, CREATE_POST, COMMUNITY_DETAILS
}

enum HobbyCategory {
  ALL = 'All',
  FITNESS = 'Fitness',
  CREATIVE = 'Creative',
  TECH = 'Tech',
  LIFESTYLE = 'Lifestyle'
}

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
  comments: string[];
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

// --- CONSTANTS ---
const INITIAL_TASKS: Task[] = [
    { id: 't1', title: 'Complete 15 min flow', date: new Date().toISOString().split('T')[0], completed: false, hobbyId: 'h1' },
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Data
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HobbyCategory>(HobbyCategory.ALL);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // NEW: State for selected community in "Create Post"
  const [selectedPostHobbyId, setSelectedPostHobbyId] = useState<string>('');

  // UI
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initData = async () => {
        if (!supabase) return;
        
        // 1. Session Check
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            
            // Clean slate: Don't load hobbies from local storage to avoid "Ghost" mock data
            setCurrentUser({
                id: session.user.id,
                name: profile?.name || session.user.user_metadata.full_name || 'User',
                email: session.user.email || '',
                avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
                joinedHobbies: [], // Will be filled by fetchUserHobbies
                stats: profile?.stats || { totalStreak: 0, points: 0 }
            });
            setView(ViewState.FEED);
            fetchUserHobbies(session.user.id);
        }

        await fetchHobbiesAndPosts();
        await fetchLeaderboard();
        
        const savedTasks = localStorage.getItem('hobbystreak_tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        else setTasks(INITIAL_TASKS);
    };

    initData();
  }, []);

  // --- AUTO-SELECT COMMUNITY FOR POSTING ---
  useEffect(() => {
      // If we are on Create Post screen AND user has joined hobbies
      if (view === ViewState.CREATE_POST && currentUser?.joinedHobbies?.length) {
          // If nothing selected yet, OR the current selection is not in the joined list
          if (!selectedPostHobbyId || !currentUser.joinedHobbies.includes(selectedPostHobbyId)) {
              // Default to the first one in the list
              setSelectedPostHobbyId(currentUser.joinedHobbies[0]);
          }
      }
  }, [view, currentUser?.joinedHobbies]);

  const fetchUserHobbies = async (userId: string) => {
      if (!supabase) return;
      const { data: joinedData } = await supabase.from('user_hobbies').select('hobby_id').eq('user_id', userId);
      // Ensure we map strictly to strings
      const joinedIds = joinedData ? joinedData.map((d: any) => d.hobby_id) : [];
      
      setCurrentUser(prev => prev ? { ...prev, joinedHobbies: joinedIds } : null);
  };

  const fetchLeaderboard = async () => {
      if (!supabase) return;
      const { data: profiles } = await supabase.from('profiles').select('*');
      
      if (profiles) {
          const sorted = profiles
            .map((p: any) => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                stats: p.stats || { points: 0, totalStreak: 0 }
            }))
            .sort((a: any, b: any) => b.stats.points - a.stats.points)
            .slice(0, 5);
          
          setLeaderboard(sorted as User[]);
      }
  };

  const fetchHobbiesAndPosts = async () => {
      if (!supabase) return;
      
      const { data: hobbiesData } = await supabase.from('hobbies').select('*');
      if (hobbiesData) {
          setHobbies(hobbiesData.map((h: any) => ({
              ...h,
              memberCount: h.member_count || 0,
              image: h.image_url || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
              icon: h.icon || '✨'
          })));
      }

      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      
      if (postsData) {
          const userIds = [...new Set(postsData.map((p:any) => p.user_id))];
          const { data: authors } = await supabase.from('profiles').select('id, name, avatar').in('id', userIds);
          
          const formattedPosts = postsData.map((p: any) => {
              const author = authors?.find((a: any) => a.id === p.user_id);
              return {
                  id: p.id,
                  userId: p.user_id,
                  hobbyId: p.hobby_id,
                  content: p.content,
                  likes: 0,
                  comments: [],
                  authorName: author?.name || 'User',
                  authorAvatar: author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
                  timestamp: new Date(p.created_at).toLocaleDateString()
              };
          });
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
    if (!supabase) return;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        showToast(error.message, 'error');
    } else if (data.session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
        
        setCurrentUser({
            id: data.session.user.id,
            name: profile?.name || 'User',
            email: email,
            avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.session.user.id}`,
            joinedHobbies: [],
            stats: profile?.stats || { totalStreak: 0, points: 0 }
        });
        await fetchUserHobbies(data.session.user.id);
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
      } else if (data.user) {
          await supabase.from('profiles').insert({
              id: data.user.id,
              name: name,
              email: email,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
              stats: { points: 0, totalStreak: 0 }
          });
          
          showToast("Account created! Please log in.");
          setView(ViewState.LOGIN);
      }
      setIsLoading(false);
  };
  
  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      setCurrentUser(null);
      setView(ViewState.LOGIN);
  };

  const handleCreateHobby = async (name: string, description: string, category: HobbyCategory) => {
    if (!supabase || !currentUser) return;
    setIsLoading(true);
    
    const { data, error } = await supabase.from('hobbies').insert({
        name, description, category, icon: '🌟', member_count: 1
    }).select().single();

    if (!error && data) {
        await supabase.from('user_hobbies').insert({ user_id: currentUser.id, hobby_id: data.id });
        
        // Optimistic Update
        const newJoinedList = [...currentUser.joinedHobbies, data.id];
        const newHobbyObj: Hobby = {
            ...data,
            memberCount: 1,
            image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
            icon: '🌟'
        };
        setHobbies(prev => [...prev, newHobbyObj]);
        setCurrentUser(prev => prev ? { ...prev, joinedHobbies: newJoinedList } : null);
        setSelectedPostHobbyId(data.id);

        setView(ViewState.EXPLORE);
        showToast("Community Created & Joined!");
    } else {
        showToast("Failed to create", 'error');
    }
    setIsLoading(false);
  };

  const handleJoinCommunity = async (e: React.MouseEvent, hobbyId: string) => {
    e.stopPropagation();
    if (!supabase || !currentUser) return showToast("Please log in");
    if (currentUser.joinedHobbies.includes(hobbyId)) return showToast("Already joined!");
    
    const { error } = await supabase.from('user_hobbies').insert({ user_id: currentUser.id, hobby_id: hobbyId });

    if (!error) {
        const newJoinedList = [...currentUser.joinedHobbies, hobbyId];
        setCurrentUser(prev => prev ? { ...prev, joinedHobbies: newJoinedList } : null);
        setSelectedPostHobbyId(hobbyId);
        showToast("Joined Community!");
    } else {
        if (error.code === '23505') { 
             showToast("Already joined (synced)");
             if (!currentUser.joinedHobbies.includes(hobbyId)) {
                 setCurrentUser(prev => prev ? { ...prev, joinedHobbies: [...prev.joinedHobbies, hobbyId] } : null);
             }
        } else {
             showToast("Error joining", 'error');
        }
    }
  };

  const handleViewCommunity = (hobby: Hobby) => {
      setSelectedHobby(hobby);
      setView(ViewState.COMMUNITY_DETAILS);
  };

  const handleCreatePost = async (content: string, hobbyId: string) => {
    if (!supabase || !currentUser) return;
    if (!hobbyId) return showToast("Please select a community", "error");
    
    const { error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        hobby_id: hobbyId,
        content: content
    });

    if (!error) {
        const newStats = { 
            points: currentUser.stats.points + 20, 
            totalStreak: currentUser.stats.totalStreak + 1 
        };
        await supabase.from('profiles').update({ stats: newStats }).eq('id', currentUser.id);
        setCurrentUser({ ...currentUser, stats: newStats });
        
        await fetchHobbiesAndPosts();
        await fetchLeaderboard();
        
        setView(ViewState.FEED);
        showToast("Posted! +20 XP 🔥");
        triggerConfetti();
    } else {
        showToast("Failed to post", 'error');
    }
  };

  // Schedule Functions
  const handleToggleTask = (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      const isCompleting = !task?.completed;
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      setTasks(updatedTasks);
      localStorage.setItem('hobbystreak_tasks', JSON.stringify(updatedTasks));

      if (isCompleting && currentUser && supabase) {
          triggerConfetti();
          const newStats = { ...currentUser.stats, points: currentUser.stats.points + 50 };
          supabase.from('profiles').update({ stats: newStats }).eq('id', currentUser.id).then(() => {
              setCurrentUser({ ...currentUser, stats: newStats });
              fetchLeaderboard(); 
          });
          showToast("Task Complete! +50 XP");
      }
  };

  const handleAddTask = (title: string, hobbyId?: string) => {
      const newTask: Task = { id: `t${Date.now()}`, title, date: selectedDate, completed: false, hobbyId };
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      localStorage.setItem('hobbystreak_tasks', JSON.stringify(updatedTasks));
      showToast("Task added");
  };

  const handleDeleteTask = (taskId: string) => {
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      setTasks(updatedTasks);
      localStorage.setItem('hobbystreak_tasks', JSON.stringify(updatedTasks));
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
                    
                    {!supabase && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 text-xs rounded-xl border border-red-200">
                            <b>Setup Needed:</b> Create .env file with VITE_SUPABASE_URL
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input className="w-full p-4 bg-white rounded-2xl border-none shadow-sm" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl border-none shadow-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <Button type="submit" className="w-full" isLoading={isLoading}>Sign In</Button>
                    </form>
                    <button onClick={() => setView(ViewState.REGISTER)} className="mt-6 text-sm text-slate-400">Create Account</button>
                </div>
            )}

            {/* REGISTER VIEW */}
            {view === ViewState.REGISTER && (
                <div className="h-full flex flex-col justify-center px-8">
                    <button onClick={() => setView(ViewState.LOGIN)} className="absolute top-12 left-6 p-2 bg-white rounded-full"><ArrowLeft className="w-5 h-5" /></button>
                    <h1 className="text-2xl font-bold mb-6">Join Us</h1>
                    <div className="space-y-4">
                        <input className="w-full p-4 bg-white rounded-2xl shadow-sm" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl shadow-sm" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-2xl shadow-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <Button className="w-full" onClick={handleRegister}>Sign Up</Button>
                    </div>
                </div>
            )}

            {/* ONBOARDING VIEW */}
            {view === ViewState.ONBOARDING && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <h1 className="text-2xl font-bold mb-2">Welcome! 🎉</h1>
                    <p className="text-slate-500 mb-8">Let's find your new hobby.</p>
                    <Button onClick={() => setView(ViewState.EXPLORE)}>Start Exploring</Button>
                </div>
            )}

            {/* FEED VIEW */}
            {view === ViewState.FEED && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-bold">Home</h1>
                        <button className="p-2 bg-white rounded-full shadow-sm"><Bell className="w-5 h-5" /></button>
                    </div>
                    
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

            {/* EXPLORE VIEW */}
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

                    <div className="mb-8">
                        <h2 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider">Top Streakers</h2>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {leaderboard.length > 0 ? leaderboard.map((user, i) => (
                                <div key={i} className="bg-white p-3 rounded-2xl shadow-sm min-w-[120px] flex flex-col items-center border border-slate-100 relative">
                                    {i === 0 && <div className="absolute -top-3"><Trophy className="w-6 h-6 text-yellow-400 fill-current" /></div>}
                                    <img src={user.avatar} className="w-12 h-12 rounded-full mb-2 bg-slate-100" />
                                    <p className="font-bold text-xs">{user.name}</p>
                                    <p className="text-[10px] text-orange-500 font-bold">🔥 {user.stats.totalStreak} days</p>
                                    <p className="text-[10px] text-slate-400">{user.stats.points} XP</p>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-400">No users yet.</p>
                            )}
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

            {/* CREATE HOBBY VIEW */}
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

            {/* COMMUNITY DETAILS VIEW */}
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
                                     <div className="flex items-center gap-2 mb-2">
                                         <img src={post.authorAvatar} className="w-6 h-6 rounded-full" />
                                         <span className="text-xs font-bold">{post.authorName}</span>
                                         <span className="text-[10px] text-slate-400 ml-auto">{post.timestamp}</span>
                                     </div>
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

            {/* PROFILE VIEW */}
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

            {/* CREATE POST VIEW */}
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
                                 <button 
                                    key={h.id} 
                                    type="button" // Force button type to prevent form submit issues
                                    onClick={() => setSelectedPostHobbyId(h.id)}
                                    className={`border px-3 py-2 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap transition-colors duration-200 active:scale-95 ${selectedPostHobbyId === h.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                 >
                                     <span>{h.icon}</span> {h.name}
                                 </button>
                             ))}
                             {hobbies.filter(h => currentUser?.joinedHobbies.includes(h.id)).length === 0 && (
                                 <p className="text-xs text-slate-400 p-2 border border-dashed rounded-xl w-full text-center">You haven't joined any communities yet.</p>
                             )}
                        </div>
                    </div>
                    <Button className="w-full mt-8" onClick={() => {
                        const content = (document.getElementById('post-content') as HTMLTextAreaElement).value;
                        if (!content) return showToast("Please write something", "error");
                        if (!selectedPostHobbyId) return showToast("Please select a community", "error");
                        
                        handleCreatePost(content, selectedPostHobbyId);
                    }}>Post Update (+20 XP)</Button>
                </div>
            )}

            {/* SCHEDULE VIEW */}
            {view === ViewState.SCHEDULE && (
                <div className="px-6 pt-4 h-full flex flex-col">
                    <h1 className="text-xl font-bold mb-6">Schedule</h1>
                    
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
