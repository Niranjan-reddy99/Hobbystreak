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

// MEMORY STORAGE with better persistence
const memoryStorage = {
  store: {} as Record<string, string>,
  
  getItem: (key: string) => {
    // Try memory first, then sessionStorage as fallback
    if (memoryStorage.store[key]) {
      return memoryStorage.store[key];
    }
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem: (key: string, value: string) => { 
    memoryStorage.store[key] = value;
    // Also store in sessionStorage for better persistence
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn("sessionStorage blocked, using memory only");
    }
  },
  
  removeItem: (key: string) => { 
    delete memoryStorage.store[key];
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }
};

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: memoryStorage,
        persistSession: true, // Changed to true for better persistence
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
  hobbyId: string | null; 
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

// ==========================================
// 3. CONSTANTS & COMPONENTS
// ==========================================
const INITIAL_TASKS: Task[] = [{ id: 't1', title: 'Complete 15 min flow', date: new Date().toISOString().split('T')[0], completed: false, hobbyId: 'h1' }];
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Data
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HobbyCategory>(HobbyCategory.ALL);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initApp = async () => {
        if (!supabase) {
            console.error("Supabase not configured");
            setIsAppLoading(false);
            return;
        }
        
        // Check for existing session FIRST
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error("Session error:", error);
                setView(ViewState.LOGIN);
            } else if (session?.user) {
                console.log("Session found for user:", session.user.id);
                await loadUserProfile(session.user.id);
                setView(ViewState.FEED);
            } else {
                console.log("No session found");
                setView(ViewState.LOGIN);
            }
        } catch (error) {
            console.error("Session check error:", error);
            setView(ViewState.LOGIN);
        }
        
        // Load public data
        await fetchHobbiesAndPosts();
        await fetchLeaderboard();
        
        // Mock Tasks
        setTasks(INITIAL_TASKS);
        setIsAppLoading(false);
    };
    initApp();
  }, []);

  // --- DATA FETCHING FUNCTIONS ---
  const loadUserProfile = async (userId: string) => {
      if (!supabase) return;
      
      try {
          const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
          
          if (error) {
              console.error("Error loading profile:", error);
              // Create profile if it doesn't exist
              const { data: session } = await supabase.auth.getSession();
              if (session?.user) {
                  const { data: newProfile, error: createError } = await supabase
                      .from('profiles')
                      .insert({
                          id: userId,
                          name: name || session.user.email?.split('@')[0] || 'User',
                          email: session.user.email,
                          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                          stats: { totalStreak: 0, points: 0 }
                      })
                      .select()
                      .single();
                  
                  if (!createError && newProfile) {
                      setCurrentUser({
                          id: userId,
                          name: newProfile.name,
                          email: newProfile.email,
                          avatar: newProfile.avatar,
                          stats: newProfile.stats || { totalStreak: 0, points: 0 }
                      });
                  }
              }
          } else if (profile) {
              setCurrentUser({
                  id: userId,
                  name: profile.name,
                  email: profile.email,
                  avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                  stats: profile.stats || { totalStreak: 0, points: 0 }
              });
          }
      } catch (error) {
          console.error("Error in loadUserProfile:", error);
      }
  };

  const fetchHobbiesAndPosts = async () => {
      if (!supabase) return;
      
      try {
          // Fetch Hobbies
          const { data: hobbiesData } = await supabase.from('hobbies').select('*');
          if (hobbiesData) {
              setHobbies(hobbiesData.map((h: any) => ({
                  id: h.id, 
                  name: h.name, 
                  description: h.description, 
                  category: h.category,
                  memberCount: h.member_count || 0, 
                  icon: h.icon || '✨', 
                  image: h.image_url
              })));
          }

          // Fetch Posts with author info
          const { data: postsData } = await supabase.from('posts')
              .select('*')
              .order('created_at', { ascending: false });
          
          if (postsData) {
              setPosts(postsData.map((p: any) => ({
                  id: p.id, 
                  userId: p.user_id, 
                  hobbyId: p.hobby_id, 
                  content: p.content,
                  likes: p.likes || 0, 
                  comments: [],
                  authorName: p.author_name || 'User',
                  authorAvatar: p.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id || 'unknown'}`,
                  timestamp: new Date(p.created_at).toLocaleDateString()
              })));
          }
      } catch (error) {
          console.error("Error fetching data:", error);
      }
  };

  const fetchLeaderboard = async () => {
      if (!supabase) return;
      
      try {
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
              setLeaderboard(sorted as UserProfile[]);
          }
      } catch (error) {
          console.error("Error fetching leaderboard:", error);
      }
  };

  // --- UI HELPERS ---
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
    
    if (!supabase) { 
        showToast("Database not configured", "error");
        setIsLoading(false);
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            showToast(error.message, 'error');
        } else if (data.session?.user) {
            // IMPORTANT: Load the user profile immediately
            await loadUserProfile(data.session.user.id);
            
            // CLEAR FORM DATA
            setEmail('');
            setPassword('');
            
            setView(ViewState.FEED);
            showToast("Welcome back!");
            console.log("Logged in as:", data.session.user.id);
        } else {
            showToast("Login failed", 'error');
        }
    } catch (error) {
        console.error("Login error:", error);
        showToast("Login error occurred", 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async () => {
      setIsLoading(true);
      
      if (!supabase) {
          showToast("Database not configured", "error");
          setIsLoading(false);
          return;
      }

      try {
          const { data, error } = await supabase.auth.signUp({ email, password });
          
          if (error) {
              showToast(error.message, 'error');
          } else if (data.user) {
              // Create user profile
              await supabase.from('profiles').insert({
                  id: data.user.id, 
                  name: name, 
                  email: email,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                  stats: { points: 0, totalStreak: 0 }
              });
              
              showToast("Account created! Log in.");
              
              // CLEAR FORM
              setEmail('');
              setPassword('');
              setName('');
              
              setView(ViewState.LOGIN);
          }
      } catch (error) {
          console.error("Register error:", error);
          showToast("Registration error occurred", 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const handleLogout = async () => {
      if (supabase) {
          await supabase.auth.signOut();
      }
      
      setCurrentUser(null);
      
      // CLEAR ALL INPUT STATES
      setEmail('');
      setPassword('');
      setName('');
      
      setView(ViewState.LOGIN);
      showToast("Logged out successfully");
  };

  // --- POST CREATION WITH USER VERIFICATION ---
  const handleCreatePost = async (content: string) => {
      if (!supabase) {
          showToast("Database not connected", "error");
          return;
      }
      
      // Check if user is logged in
      if (!currentUser?.id) {
          showToast("Please login to post", "error");
          setView(ViewState.LOGIN);
          return;
      }
      
      // Verify session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
          showToast("Session expired. Please login again.", "error");
          setView(ViewState.LOGIN);
          return;
      }
      
      console.log("Creating post as user:", currentUser.id);
      
      try {
          const { error } = await supabase.from('posts').insert({
              user_id: currentUser.id,
              hobby_id: null,
              content,
              author_name: currentUser.name,
              author_avatar: currentUser.avatar
          });

          if (error) {
              console.error("Post error:", error);
              showToast("Error posting: " + error.message, 'error');
              return;
          }
          
          // Update user stats
          const newStats = { 
              points: currentUser.stats.points + 20, 
              totalStreak: currentUser.stats.totalStreak + 1 
          };
          
          await supabase.from('profiles')
              .update({ stats: newStats })
              .eq('id', currentUser.id);
          
          // Update local user state
          setCurrentUser({ 
              ...currentUser, 
              stats: newStats 
          });
          
          // Refresh posts
          await fetchHobbiesAndPosts();
          
          setView(ViewState.FEED);
          triggerConfetti();
          showToast("Posted! +20 XP");
      } catch (error) {
          console.error("Create post error:", error);
          showToast("Error creating post", 'error');
      }
  };

  const handleCreateHobby = async (n: string, d: string, c: HobbyCategory) => {
      setIsLoading(true);
      
      if (!currentUser || !supabase) {
          showToast("Please login first", "error");
          setIsLoading(false);
          return;
      }

      try {
          const { data, error } = await supabase.from('hobbies').insert({
              name: n, 
              description: d, 
              category: c, 
              icon: '🌟', 
              member_count: 1, 
              image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f'
          }).select().single();

          if (data && !error) {
              await fetchHobbiesAndPosts();
              setView(ViewState.EXPLORE);
              showToast("Community created!");
          } else {
              showToast(error?.message || "Creation failed", 'error');
          }
      } catch (error) {
          console.error("Create hobby error:", error);
          showToast("Error creating community", 'error');
      } finally {
          setIsLoading(false);
      }
  };

  // --- RENDER ---
  if (isAppLoading) {
      return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
            <Loader2 className="text-white animate-spin w-8 h-8"/>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans p-0 sm:p-8">
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-slate-50 sm:rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-[8px] border-neutral-800 ring-1 ring-white/10">
        
        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 py-3 bg-slate-50 text-slate-900 text-xs font-bold sticky top-0 z-20">
            <span>9:41</span>
            <div className="flex gap-2">
                <Signal className="w-4 h-4" />
                <Wifi className="w-4 h-4" />
                <Battery className="w-4 h-4" />
            </div>
        </div>
        
        {toast && <Toast message={toast.message} type={toast.type} />}
        {showConfetti && <Confetti />}

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
            
            {view === ViewState.LOGIN && (
                <div className="h-full flex flex-col justify-center px-8">
                    <h1 className="text-3xl font-bold text-center mb-10">Hobbystreak</h1>
                    
                    {!supabase && (
                        <div className="p-3 bg-red-100 text-red-700 text-xs mb-4 rounded text-center">
                            Supabase keys missing. Check your .env file
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <input 
                            className="w-full p-4 bg-white rounded-2xl" 
                            placeholder="Email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                        />
                        <input 
                            className="w-full p-4 bg-white rounded-2xl" 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        <Button 
                            className="w-full" 
                            onClick={handleLogin} 
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </div>
                    
                    <button 
                        onClick={() => setView(ViewState.REGISTER)} 
                        className="mt-6 text-sm text-slate-400 w-full"
                    >
                        Create Account
                    </button>
                </div>
            )}

            {view === ViewState.REGISTER && (
                <div className="h-full flex flex-col justify-center px-8">
                    <h1 className="text-2xl font-bold mb-6">Join Us</h1>
                    
                    <div className="space-y-4">
                        <input 
                            className="w-full p-4 bg-white rounded-2xl" 
                            placeholder="Name" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                        />
                        <input 
                            className="w-full p-4 bg-white rounded-2xl" 
                            placeholder="Email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                        />
                        <input 
                            className="w-full p-4 bg-white rounded-2xl" 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                        <Button 
                            className="w-full" 
                            onClick={handleRegister} 
                            isLoading={isLoading}
                        >
                            Sign Up
                        </Button>
                    </div>
                    
                    <button 
                        onClick={() => setView(ViewState.LOGIN)} 
                        className="mt-4 text-sm text-slate-400 w-full"
                    >
                        Back to Login
                    </button>
                </div>
            )}

            {view === ViewState.FEED && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-bold">Home</h1>
                        <Bell className="w-5 h-5" />
                    </div>
                    
                    {/* User Stats */}
                    <div className="bg-slate-900 text-white p-4 rounded-3xl mb-6 flex justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <Flame className="w-8 h-8 text-orange-400" />
                            <div>
                                <p className="text-xs text-slate-400">Streak</p>
                                <p className="text-lg font-bold">{currentUser?.stats.totalStreak || 0}</p>
                            </div>
                        </div>
                        <div className="h-10 w-[1px] bg-white/20"></div>
                        <div className="flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-yellow-400" />
                            <div>
                                <p className="text-xs text-slate-400">Points</p>
                                <p className="text-lg font-bold">{currentUser?.stats.points || 0}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Posts Feed */}
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <img 
                                        src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} 
                                        className="w-8 h-8 rounded-full" 
                                        alt={post.authorName}
                                    />
                                    <div>
                                        <span className="text-sm font-bold">{post.authorName}</span>
                                        <p className="text-xs text-slate-400">{post.timestamp}</p>
                                    </div>
                                </div>
                                <p className="text-sm mb-3">{post.content}</p>
                                <div className="flex gap-4 text-slate-400 text-xs">
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-4 h-4"/> 
                                        {post.likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageCircle className="w-4 h-4"/> 
                                        {post.comments.length}
                                    </span>
                                </div>
                            </div>
                        ))}
                        
                        {posts.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-slate-400 text-sm">No posts yet. Be the first to post!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === ViewState.CREATE_POST && (
                <div className="px-6 pt-12 h-full bg-white">
                    <div className="flex justify-between mb-6">
                        <h1 className="text-xl font-bold">New Post</h1>
                        <button onClick={() => setView(ViewState.FEED)}>
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    {/* Current User Info */}
                    {currentUser && (
                        <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                            <img 
                                src={currentUser.avatar} 
                                className="w-8 h-8 rounded-full" 
                                alt={currentUser.name}
                            />
                            <div>
                                <p className="text-sm font-bold">{currentUser.name}</p>
                                <p className="text-xs text-slate-400">Posting as you</p>
                            </div>
                        </div>
                    )}
                    
                    <textarea 
                        id="post-input" 
                        className="w-full h-32 bg-slate-50 p-4 rounded-2xl resize-none text-sm outline-none" 
                        placeholder="Share your progress..." 
                    />
                    
                    <div className="mt-4 mb-6">
                        <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                           📝 Posting to <b>General Feed</b>
                        </p>
                    </div>

                    <Button 
                        className="w-full mt-8" 
                        onClick={() => {
                            const content = (document.getElementById('post-input') as HTMLTextAreaElement).value;
                            if (!content.trim()) {
                                showToast("Please write something!", "error");
                                return;
                            }
                            handleCreatePost(content);
                        }}
                        isLoading={isLoading}
                    >
                        Post Now
                    </Button>
                    
                    <button 
                        onClick={() => setView(ViewState.FEED)} 
                        className="w-full text-center text-slate-400 text-sm mt-4"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {view === ViewState.EXPLORE && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-bold">Explore Communities</h1>
                        <button 
                            onClick={() => setView(ViewState.CREATE_HOBBY)}
                            className="p-2 bg-slate-900 text-white rounded-full"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {hobbies.map(hobby => (
                            <div 
                                key={hobby.id} 
                                className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm"
                            >
                                <div className="text-2xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center">
                                    {hobby.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm">{hobby.name}</h3>
                                    <p className="text-xs text-slate-400">{hobby.memberCount} members</p>
                                </div>
                                <button className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">
                                    Join
                                </button>
                            </div>
                        ))}
                        
                        {hobbies.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-slate-400 text-sm">No communities yet. Create one!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === ViewState.PROFILE && (
                <div className="px-6 pt-4">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-xl font-bold">Profile</h1>
                        <button onClick={handleLogout}>
                            <LogOut className="w-5 h-5 text-red-500" />
                        </button>
                    </div>
                    
                    <div className="text-center mb-8">
                        <img 
                            src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'} 
                            className="w-20 h-20 rounded-full mx-auto mb-4"
                            alt="Profile"
                        />
                        <h2 className="text-xl font-bold">{currentUser?.name || "Guest"}</h2>
                        <p className="text-sm text-slate-400">{currentUser?.email}</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-2xl text-center">
                            <p className="text-xs text-slate-400">Posts</p>
                            <p className="text-lg font-bold">
                                {posts.filter(p => p.userId === currentUser?.id).length}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl text-center">
                            <p className="text-xs text-slate-400">Points</p>
                            <p className="text-lg font-bold">{currentUser?.stats.points || 0}</p>
                        </div>
                    </div>
                    
                    {/* Debug Info (Optional) */}
                    <div className="bg-gray-100 p-4 rounded-xl text-xs mb-6">
                        <p><strong>User ID:</strong> {currentUser?.id ? currentUser.id.substring(0, 8) + '...' : 'Not logged in'}</p>
                        <p><strong>Streak:</strong> {currentUser?.stats.totalStreak || 0} days</p>
                    </div>
                </div>
            )}

            {view === ViewState.SCHEDULE && (
                <div className="px-6 pt-4">
                    <h1 className="text-xl font-bold mb-6">Schedule</h1>
                    
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div 
                                key={task.id} 
                                className="bg-white p-4 rounded-xl flex items-center gap-3 shadow-sm"
                            >
                                <button onClick={() => {}}>
                                    {task.completed ? 
                                        <CheckCircle className="w-6 h-6 text-green-500" /> : 
                                        <Circle className="w-6 h-6 text-slate-300" />
                                    }
                                </button>
                                <span className={task.completed ? 'line-through text-slate-400' : ''}>
                                    {task.title}
                                </span>
                            </div>
                        ))}
                        
                        {tasks.length === 0 && (
                            <p className="text-center text-slate-400 text-sm py-10">
                                No tasks scheduled
                            </p>
                        )}
                    </div>
                </div>
            )}

            {view === ViewState.CREATE_HOBBY && (
                <div className="px-6 pt-12 h-full bg-white">
                    <div className="flex justify-between mb-6">
                        <h1 className="text-xl font-bold">Create Community</h1>
                        <button onClick={() => setView(ViewState.EXPLORE)}>
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <input 
                            id="h-name" 
                            className="w-full p-4 bg-slate-50 rounded-2xl" 
                            placeholder="Community Name" 
                        />
                        <textarea 
                            id="h-desc" 
                            className="w-full p-4 h-24 bg-slate-50 rounded-2xl" 
                            placeholder="Description" 
                        />
                        <select 
                            id="h-cat" 
                            className="w-full p-4 bg-slate-50 rounded-2xl"
                        >
                            {Object.values(HobbyCategory).filter(c => c !== 'All').map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        
                        <Button 
                            className="w-full mt-4" 
                            onClick={() => {
                                const n = (document.getElementById('h-name') as HTMLInputElement).value;
                                const d = (document.getElementById('h-desc') as HTMLTextAreaElement).value;
                                const c = (document.getElementById('h-cat') as HTMLSelectElement).value as HobbyCategory;
                                
                                if (!n.trim() || !d.trim()) {
                                    showToast("Please fill all fields", "error");
                                    return;
                                }
                                
                                handleCreateHobby(n, d, c);
                            }} 
                            isLoading={isLoading}
                        >
                            Create Community
                        </Button>
                        
                        <button 
                            onClick={() => setView(ViewState.EXPLORE)} 
                            className="w-full text-center text-slate-400 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

        </div>

        {/* NAV BAR */}
        {![ViewState.LOGIN, ViewState.REGISTER].includes(view) && (
            <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-4 flex items-center justify-between border border-white/50">
                    <button onClick={() => setView(ViewState.FEED)}>
                        <Home className={`w-6 h-6 ${view === ViewState.FEED ? 'text-slate-900' : 'text-slate-400'}`} />
                    </button>
                    <button onClick={() => setView(ViewState.EXPLORE)}>
                        <Compass className={`w-6 h-6 ${view === ViewState.EXPLORE ? 'text-slate-900' : 'text-slate-400'}`} />
                    </button>
                    <button onClick={() => setView(ViewState.CREATE_POST)}>
                        <Plus className="bg-slate-900 text-white p-2 rounded-full w-10 h-10 -mt-8 border-4 border-white shadow-lg" />
                    </button>
                    <button onClick={() => setView(ViewState.PROFILE)}>
                        <UserIcon className={`w-6 h-6 ${view === ViewState.PROFILE ? 'text-slate-900' : 'text-slate-400'}`} />
                    </button>
                    <button onClick={() => setView(ViewState.SCHEDULE)}>
                        <Calendar className={`w-6 h-6 ${view === ViewState.SCHEDULE ? 'text-slate-900' : 'text-slate-400'}`} />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
