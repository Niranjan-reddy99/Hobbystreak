import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Compass, User as UserIcon, Plus, Heart, MessageCircle, 
  Send, Check, ArrowLeft, X, LogOut, Flame, Calendar, 
  Bell, Loader2, Signal, Wifi, Battery
} from 'lucide-react';

// --- CONFIGURATION ---

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl && supabaseKey;

const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- TYPES ---
enum ViewState {
  LOGIN, REGISTER, ONBOARDING, FEED, EXPLORE, PROFILE, SCHEDULE, 
  CREATE_HOBBY, CREATE_POST
}

enum HobbyCategory {
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
}

interface Hobby {
  id: string;
  name: string;
  description: string;
  category: HobbyCategory;
  memberCount: number;
  icon: string;
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
}

// --- MOCK DATA ---
const MOCK_HOBBIES: Hobby[] = [
  {
    id: 'h1',
    name: 'Morning Yoga',
    description: 'Start your day with mindfulness.',
    category: HobbyCategory.FITNESS,
    memberCount: 1240,
    icon: '🧘‍♀️'
  },
  {
    id: 'h2',
    name: 'Pixel Art',
    description: 'Creating retro-style digital art.',
    category: HobbyCategory.CREATIVE,
    memberCount: 850,
    icon: '👾'
  }
];

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u2',
    hobbyId: 'h1',
    content: 'Held the crow pose for 10 seconds! Progress.',
    likes: 42,
    comments: ['Great job!'],
    authorName: 'Sarah J.',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  }
];

const MOCK_USER: User = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
  joinedHobbies: ['h1']
};

// --- COMPONENTS ---

const Toast = ({ message, type = 'success' }: { message: string, type?: 'success' | 'error' }) => (
  <div className={`absolute top-12 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-bounce w-max ${type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}`}>
    {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    <span className="text-sm font-medium">{message}</span>
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled, isLoading }: any) => {
  const baseStyle = "px-4 py-3 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-slate-900 text-white shadow-lg shadow-slate-900/20",
    secondary: "bg-white text-slate-900 border border-slate-200",
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Init Logic
    setHobbies(MOCK_HOBBIES);
    setPosts(MOCK_POSTS);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setCurrentUser({ ...MOCK_USER, email });
      setView(ViewState.FEED);
      setIsLoading(false);
      showToast("Welcome back!");
    }, 800);
  };

  const handleCreatePost = (content: string, hobbyId: string) => {
    const newPost = {
        id: `p${Date.now()}`,
        userId: currentUser!.id,
        hobbyId,
        content,
        likes: 0,
        comments: [],
        authorName: currentUser!.name,
        authorAvatar: currentUser!.avatar
    };
    setPosts([newPost, ...posts]);
    setView(ViewState.FEED);
    showToast("Posted!");
  };

  // --- RENDER HELPERS ---

  // Status Bar (Visual only)
  const StatusBar = () => (
    <div className="flex justify-between items-center px-6 py-3 bg-slate-50 text-slate-900 text-xs font-bold sticky top-0 z-20">
        <span>9:41</span>
        <div className="flex gap-2">
            <Signal className="w-4 h-4" />
            <Wifi className="w-4 h-4" />
            <Battery className="w-4 h-4" />
        </div>
    </div>
  );

  return (
    // OUTER BACKGROUND (Desktop Context)
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans p-0 sm:p-8">
      
      {/* PHONE FRAME */}
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-slate-50 sm:rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-[8px] border-neutral-800 ring-1 ring-white/10">
        
        <StatusBar />
        
        {toast && <Toast message={toast.message} type={toast.type} />}

        {/* CONTENT AREA (Scrollable) */}
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
                        <Button className="w-full" onClick={() => { showToast("Account Created"); setView(ViewState.ONBOARDING); }}>Sign Up</Button>
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
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={post.authorAvatar} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-bold text-sm">{post.authorName}</p>
                                        <p className="text-xs text-slate-400">2h ago</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-800 mb-3">{post.content}</p>
                                <div className="flex gap-4 text-slate-400">
                                    <div className="flex items-center gap-1 text-xs"><Heart className="w-4 h-4" /> {post.likes}</div>
                                    <div className="flex items-center gap-1 text-xs"><MessageCircle className="w-4 h-4" /> {post.comments.length}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === ViewState.EXPLORE && (
                <div className="px-6 pt-4">
                    <h1 className="text-xl font-bold mb-6">Explore</h1>
                    <div className="space-y-4">
                        {hobbies.map(h => (
                            <div key={h.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                                <div className="text-3xl">{h.icon}</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm">{h.name}</h3>
                                    <p className="text-xs text-slate-500">{h.memberCount} members</p>
                                </div>
                                <Button variant="secondary" className="text-xs py-2 h-auto" onClick={() => showToast("Joined!")}>Join</Button>
                            </div>
                        ))}
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
                        className="w-full h-40 bg-slate-50 p-4 rounded-2xl resize-none outline-none" 
                        placeholder="What did you achieve today?"
                        id="post-content"
                    />
                    <Button className="w-full mt-4" onClick={() => {
                        const content = (document.getElementById('post-content') as HTMLTextAreaElement).value;
                        handleCreatePost(content, 'h1');
                    }}>Post</Button>
                </div>
            )}

            {view === ViewState.SCHEDULE && (
                <div className="h-full flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Schedule coming soon</p>
                    </div>
                </div>
            )}
        </div>

        {/* BOTTOM NAVIGATION (Absolute within Phone Frame) */}
        {![ViewState.LOGIN, ViewState.REGISTER, ViewState.ONBOARDING].includes(view) && (
            <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-4 flex items-center justify-between border border-white/50">
                    <button onClick={() => setView(ViewState.FEED)} className={view === ViewState.FEED ? 'text-slate-900' : 'text-slate-300'}><Home className="w-6 h-6" /></button>
                    <button onClick={() => setView(ViewState.EXPLORE)} className={view === ViewState.EXPLORE ? 'text-slate-900' : 'text-slate-300'}><Compass className="w-6 h-6" /></button>
                    <button onClick={() => setView(ViewState.CREATE_POST)} className="bg-slate-900 text-white p-3 rounded-full shadow-lg -mt-8 border-4 border-slate-50"><Plus className="w-6 h-6" /></button>
                    <button onClick={() => setView(ViewState.SCHEDULE)} className={view === ViewState.SCHEDULE ? 'text-slate-900' : 'text-slate-300'}><Calendar className="w-6 h-6" /></button>
                    <button onClick={() => setView(ViewState.LOGIN)} className="text-slate-300 hover:text-red-500"><LogOut className="w-6 h-6" /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
