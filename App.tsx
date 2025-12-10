import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Compass, User as UserIcon, Plus, Heart, MessageCircle, 
  Send, Check, ArrowLeft, X, LogOut, Flame, Calendar, 
  Bell, Loader2, Signal, Wifi, Battery, ChevronRight, Trophy, Users
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
  image: string; // Added for banner
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

// --- MOCK DATA ---
const MOCK_HOBBIES: Hobby[] = [
  {
    id: 'h1',
    name: 'Morning Yoga',
    description: 'Start your day with mindfulness and movement.',
    category: HobbyCategory.FITNESS,
    memberCount: 1240,
    icon: '🧘‍♀️',
    image: 'https://images.unsplash.com/photo-1544367563-12123d895951?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'h2',
    name: 'Pixel Art',
    description: 'Creating retro-style digital art and sprites.',
    category: HobbyCategory.CREATIVE,
    memberCount: 850,
    icon: '👾',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'h3',
    name: 'Coding Daily',
    description: 'Commit code every single day.',
    category: HobbyCategory.TECH,
    memberCount: 5300,
    icon: '💻',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80'
  }
];

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u2',
    hobbyId: 'h1',
    content: 'Held the crow pose for 10 seconds! Progress is slow but steady.',
    likes: 42,
    comments: ['Great job!'],
    authorName: 'Sarah J.',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    timestamp: '2h ago'
  }
];

const MOCK_USER: User = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
  joinedHobbies: ['h1'],
  stats: {
      totalStreak: 12,
      points: 450
  }
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
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HobbyCategory>(HobbyCategory.ALL);

  // UI
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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

  const handleJoinCommunity = (e: React.MouseEvent, hobbyId: string) => {
    e.stopPropagation();
    if (currentUser?.joinedHobbies.includes(hobbyId)) return showToast("Already joined!");
    
    setCurrentUser(prev => prev ? {
        ...prev,
        joinedHobbies: [...prev.joinedHobbies, hobbyId]
    } : null);
    
    // Update local member count for display
    setHobbies(prev => prev.map(h => h.id === hobbyId ? { ...h, memberCount: h.memberCount + 1 } : h));
    showToast("Joined Community!");
  };

  const handleViewCommunity = (hobby: Hobby) => {
      setSelectedHobby(hobby);
      setView(ViewState.COMMUNITY_DETAILS);
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
        authorAvatar: currentUser!.avatar,
        timestamp: 'Just now'
    };
    
    setPosts([newPost, ...posts]);
    
    // Increment Streak (Simple Logic)
    setCurrentUser(prev => prev ? {
        ...prev,
        stats: {
            ...prev.stats,
            totalStreak: prev.stats.totalStreak + 1,
            points: prev.stats.points + 10
        }
    } : null);

    setView(ViewState.FEED);
    showToast("Posted! Streak +1 🔥");
  };

  // --- RENDER HELPERS ---

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
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans p-0 sm:p-8">
      
      {/* PHONE FRAME */}
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-slate-50 sm:rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-[8px] border-neutral-800 ring-1 ring-white/10">
        
        <StatusBar />
        {toast && <Toast message={toast.message} type={toast.type} />}

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
                    </div>
                </div>
            )}

            {view === ViewState.EXPLORE && (
                <div className="px-6 pt-4">
                    <h1 className="text-xl font-bold mb-4">Explore</h1>
                    
                    {/* Category Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                        {Object.values(HobbyCategory).map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-100'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

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
                                <Button 
                                    variant={currentUser?.joinedHobbies.includes(h.id) ? 'ghost' : 'secondary'} 
                                    className="text-xs py-2 px-3 h-auto" 
                                    onClick={(e: React.MouseEvent) => handleJoinCommunity(e, h.id)}
                                >
                                    {currentUser?.joinedHobbies.includes(h.id) ? 'Joined' : 'Join'}
                                </Button>
                            </div>
                        ))}
                    </div>
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
                         <Button 
                            className="w-full mb-8"
                            onClick={(e: React.MouseEvent) => handleJoinCommunity(e, selectedHobby.id)}
                            variant={currentUser?.joinedHobbies.includes(selectedHobby.id) ? 'secondary' : 'primary'}
                         >
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

            {view === ViewState.PROFILE && (
                <div className="px-6 pt-4">
                     <div className="flex justify-between items-center mb-8">
                        <h1 className="text-xl font-bold">Profile</h1>
                        <button onClick={() => setView(ViewState.LOGIN)} className="text-red-500"><LogOut className="w-5 h-5" /></button>
                     </div>
                     <div className="text-center mb-8">
                         <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                             <img src={currentUser?.avatar} className="w-full h-full object-cover" />
                         </div>
                         <h2 className="text-xl font-bold">{currentUser?.name}</h2>
                         <p className="text-sm text-slate-400">{currentUser?.email}</p>
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
                        const firstHobby = currentUser?.joinedHobbies[0] || 'h1';
                        handleCreatePost(content, firstHobby);
                    }}>Post Update</Button>
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
