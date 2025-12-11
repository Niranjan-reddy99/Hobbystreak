import './App.css';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Compass, User as UserIcon, Plus, Heart, 
  Check, X, LogOut, Flame, Calendar, 
  Bell, Loader2, Signal, Wifi, Battery, Trophy
} from 'lucide-react';

// ==========================================
// 1. CONFIGURATION
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// ==========================================
// 2. TYPES
// ==========================================
enum ViewState { LOGIN, REGISTER, FEED, EXPLORE, PROFILE, SCHEDULE, CREATE_POST }

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  stats: { totalStreak: number; points: number; };
}

interface Post { 
  id: string; 
  userId: string; 
  content: string; 
  likes: number; 
  authorName: string; 
  authorAvatar?: string; 
  timestamp: string; 
}

// ==========================================
// 3. COMPONENTS
// ==========================================
const Toast = ({ message, type = 'success' }: { message: string, type?: 'success' | 'error' }) => (
  <div className={`absolute top-12 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-bounce w-max ${type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}`}>
    {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    <span className="text-sm font-medium">{message}</span>
  </div>
);

const Button = ({ children, onClick, className = '', isLoading }: any) => {
  return (
    <button 
      onClick={onClick} 
      disabled={isLoading} 
      className={`px-4 py-3 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 bg-slate-900 text-white shadow-lg shadow-slate-900/20 ${className}`}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
      {children}
    </button>
  );
};

// ==========================================
// 4. MAIN APP - SIMPLE VERSION THAT WORKS
// ==========================================
export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // --- SIMPLE INITIALIZATION ---
  useEffect(() => {
    const initApp = async () => {
      if (!supabase) {
        setIsAppLoading(false);
        return;
      }

      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Load user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setCurrentUser({
            id: session.user.id,
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
            stats: profile.stats || { totalStreak: 0, points: 0 }
          });
        }
        setView(ViewState.FEED);
      } else {
        setView(ViewState.LOGIN);
      }

      // Load posts
      await fetchPosts();
      setIsAppLoading(false);
    };

    initApp();
  }, []);

  const fetchPosts = async () => {
    if (!supabase) return;
    
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setPosts(data.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        content: p.content,
        likes: p.likes || 0,
        authorName: p.author_name || 'User',
        authorAvatar: p.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id || 'anonymous'}`,
        timestamp: new Date(p.created_at).toLocaleDateString()
      })));
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- SIMPLE LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      showToast(error.message, 'error');
    } else if (data.session?.user) {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      
      if (profile) {
        setCurrentUser({
          id: data.session.user.id,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.session.user.id}`,
          stats: profile.stats || { totalStreak: 0, points: 0 }
        });
      }
      
      setEmail('');
      setPassword('');
      setView(ViewState.FEED);
      await fetchPosts();
      showToast("Welcome!");
    }
    setIsLoading(false);
  };

  // --- SIMPLE REGISTER ---
  const handleRegister = async () => {
    if (!supabase) return;
    
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      showToast(error.message, 'error');
    } else if (data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        name: name,
        email: email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        stats: { points: 0, totalStreak: 0 }
      });
      
      setName('');
      setEmail('');
      setPassword('');
      setView(ViewState.LOGIN);
      showToast("Account created! Please login.");
    }
    setIsLoading(false);
  };

  // --- SIMPLE POST CREATION ---
  const handleCreatePost = async (content: string) => {
    if (!supabase) return showToast("Database error", "error");
    
    // Check if user is logged in
    if (!currentUser?.id) {
      showToast("Please login first", "error");
      setView(ViewState.LOGIN);
      return;
    }
    
    // Create post with user info
    const { error } = await supabase.from('posts').insert({
      user_id: currentUser.id,
      content: content,
      author_name: currentUser.name,
      author_avatar: currentUser.avatar
    });

    if (error) {
      showToast("Error: " + error.message, 'error');
    } else {
      // Update user points
      const newStats = { 
        points: (currentUser.stats.points || 0) + 10, 
        totalStreak: (currentUser.stats.totalStreak || 0) + 1 
      };
      
      await supabase.from('profiles')
        .update({ stats: newStats })
        .eq('id', currentUser.id);
      
      // Update local state
      setCurrentUser({
        ...currentUser,
        stats: newStats
      });
      
      // Refresh posts
      await fetchPosts();
      setView(ViewState.FEED);
      showToast("Posted! +10 points");
    }
  };

  // --- SIMPLE LOGOUT ---
  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setView(ViewState.LOGIN);
    showToast("Logged out");
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
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] h-[100dvh] bg-slate-50 rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 py-3 bg-slate-50 text-slate-900 text-xs font-bold">
          <span>9:41</span>
          <div className="flex gap-2">
            <Signal className="w-4 h-4" />
            <Wifi className="w-4 h-4" />
            <Battery className="w-4 h-4" />
          </div>
        </div>
        
        {toast && <Toast message={toast.message} type={toast.type} />}

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24">
          
          {/* LOGIN VIEW */}
          {view === ViewState.LOGIN && (
            <div className="h-full flex flex-col justify-center px-8">
              <h1 className="text-3xl font-bold text-center mb-10">Hobbystreak</h1>
              
              {!supabase && (
                <div className="p-3 bg-red-100 text-red-700 text-xs mb-4 rounded">
                  Check your .env file for Supabase keys
                </div>
              )}
              
              <form onSubmit={handleLogin} className="space-y-4">
                <input 
                  className="w-full p-4 bg-white rounded-2xl" 
                  placeholder="Email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                />
                <input 
                  className="w-full p-4 bg-white rounded-2xl" 
                  type="password" 
                  placeholder="Password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required
                />
                <Button type="submit" isLoading={isLoading}>
                  Sign In
                </Button>
              </form>
              
              <button 
                onClick={() => setView(ViewState.REGISTER)} 
                className="mt-6 text-sm text-slate-400 w-full"
              >
                Create Account
              </button>
            </div>
          )}

          {/* REGISTER VIEW */}
          {view === ViewState.REGISTER && (
            <div className="h-full flex flex-col justify-center px-8">
              <h1 className="text-2xl font-bold mb-6">Join Us</h1>
              
              <div className="space-y-4">
                <input 
                  className="w-full p-4 bg-white rounded-2xl" 
                  placeholder="Name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                />
                <input 
                  className="w-full p-4 bg-white rounded-2xl" 
                  placeholder="Email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                />
                <input 
                  className="w-full p-4 bg-white rounded-2xl" 
                  type="password" 
                  placeholder="Password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required
                />
                <Button onClick={handleRegister} isLoading={isLoading}>
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

          {/* FEED VIEW */}
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
              
              {/* Posts */}
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={post.authorAvatar} 
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
                    </div>
                  </div>
                ))}
                
                {posts.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-slate-400 text-sm">No posts yet. Be the first!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CREATE POST VIEW */}
          {view === ViewState.CREATE_POST && (
            <div className="px-6 pt-12 h-full bg-white">
              <div className="flex justify-between mb-6">
                <h1 className="text-xl font-bold">New Post</h1>
                <button onClick={() => setView(ViewState.FEED)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Show who's posting */}
              {currentUser && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                  <img 
                    src={currentUser.avatar} 
                    className="w-8 h-8 rounded-full" 
                    alt={currentUser.name}
                  />
                  <div>
                    <p className="text-sm font-bold">Posting as: {currentUser.name}</p>
                  </div>
                </div>
              )}
              
              <textarea 
                id="post-input" 
                className="w-full h-32 bg-slate-50 p-4 rounded-2xl resize-none text-sm outline-none mb-4" 
                placeholder="What's on your mind?" 
              />
              
              <Button 
                className="w-full" 
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
            </div>
          )}

          {/* PROFILE VIEW */}
          {view === ViewState.PROFILE && currentUser && (
            <div className="px-6 pt-4">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-xl font-bold">Profile</h1>
                <button onClick={handleLogout}>
                  <LogOut className="w-5 h-5 text-red-500" />
                </button>
              </div>
              
              <div className="text-center mb-8">
                <img 
                  src={currentUser.avatar} 
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                  alt="Profile"
                />
                <h2 className="text-xl font-bold">{currentUser.name}</h2>
                <p className="text-sm text-slate-400">{currentUser.email}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl text-center">
                  <p className="text-xs text-slate-400">Points</p>
                  <p className="text-lg font-bold">{currentUser.stats.points}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl text-center">
                  <p className="text-xs text-slate-400">Streak</p>
                  <p className="text-lg font-bold">{currentUser.stats.totalStreak} days</p>
                </div>
              </div>
              
              {/* User ID for debugging */}
              <div className="mt-6 p-3 bg-gray-100 rounded-xl">
                <p className="text-xs text-gray-500">User ID:</p>
                <p className="text-xs font-mono">{currentUser.id.substring(0, 20)}...</p>
              </div>
            </div>
          )}

          {/* SIMPLIFIED OTHER VIEWS */}
          {view === ViewState.EXPLORE && (
            <div className="px-6 pt-4">
              <h1 className="text-xl font-bold mb-6">Explore</h1>
              <p className="text-slate-500">Communities feature coming soon!</p>
            </div>
          )}
          
          {view === ViewState.SCHEDULE && (
            <div className="px-6 pt-4">
              <h1 className="text-xl font-bold mb-6">Schedule</h1>
              <p className="text-slate-500">Schedule feature coming soon!</p>
            </div>
          )}
        </div>

        {/* SIMPLE NAV BAR */}
        {view !== ViewState.LOGIN && view !== ViewState.REGISTER && (
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-4 flex items-center justify-between border">
              <button onClick={() => setView(ViewState.FEED)}>
                <Home className={`w-6 h-6 ${view === ViewState.FEED ? 'text-slate-900' : 'text-slate-400'}`} />
              </button>
              <button onClick={() => setView(ViewState.EXPLORE)}>
                <Compass className={`w-6 h-6 ${view === ViewState.EXPLORE ? 'text-slate-900' : 'text-slate-400'}`} />
              </button>
              <button onClick={() => setView(ViewState.CREATE_POST)}>
                <Plus className="bg-slate-900 text-white p-2 rounded-full w-10 h-10 -mt-8 border-4 border-white" />
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
