import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Compass, User as UserIcon, Plus, Heart, MessageCircle, 
  Sparkles, Send, Check, ArrowLeft, X, LogOut, Lock, 
  Globe, Search, Flame, Calendar, Bell, Settings, 
  Flag, MoreHorizontal, Loader2, Image as ImageIcon
} from 'lucide-react';

// --- CONFIGURATION & TYPES ---

// Initialize Supabase (Safe Mode)
// If variables are missing, the app will default to Mock Mode without crashing.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl && supabaseKey;

const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Types
enum ViewState {
  LOGIN, REGISTER, ONBOARDING, FEED, EXPLORE, PROFILE, SCHEDULE, 
  CREATE_HOBBY, CREATE_POST, COMMUNITY_DETAILS
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
  bio: string;
  joinedHobbies: string[];
  hobbyStreaks: Record<string, number>;
  stats: {
    streak: number;
    totalPoints: number;
  };
}

interface Hobby {
  id: string;
  name: string;
  description: string;
  category: HobbyCategory;
  memberCount: number;
  image: string;
  icon: string;
  rules?: string[];
}

interface Post {
  id: string;
  userId: string;
  hobbyId: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: string[];
  timestamp: string;
  authorName: string;
  authorAvatar?: string;
}

// --- CONSTANTS (MOCK DATA) ---

const MOCK_HOBBIES: Hobby[] = [
  {
    id: 'h1',
    name: 'Morning Yoga',
    description: 'Start your day with mindfulness and movement.',
    category: HobbyCategory.FITNESS,
    memberCount: 1240,
    image: 'https://images.unsplash.com/photo-1544367563-12123d895951?auto=format&fit=crop&w=800&q=80',
    icon: '🧘‍♀️',
    rules: ['Be kind', 'Post daily']
  },
  {
    id: 'h2',
    name: 'Pixel Art',
    description: 'Creating retro-style digital art.',
    category: HobbyCategory.CREATIVE,
    memberCount: 850,
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80',
    icon: '👾'
  }
];

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u2',
    hobbyId: 'h1',
    content: 'Finally held the crow pose for 10 seconds! Progress is slow but steady.',
    likes: 42,
    comments: ['Great job!', 'Keep going!'],
    timestamp: new Date().toISOString(),
    authorName: 'Sarah J.',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  }
];

const MOCK_USER: User = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
  bio: 'Just here to build good habits.',
  joinedHobbies: ['h1'],
  hobbyStreaks: { 'h1': 5 },
  stats: { streak: 5, totalPoints: 120 }
};

// --- COMPONENTS ---

const Toast = ({ message, type = 'success', onClose }: { message: string, type?: 'success' | 'error', onClose: () => void }) => (
  <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-bounce ${type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}`}>
    {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    <span className="text-sm font-medium">{message}</span>
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled, isLoading, type = 'button' }: any) => {
  const baseStyle = "px-4 py-3 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20",
    secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// --- MAIN APP ---

export default function App() {
  // --- State ---
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Data State
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  
  // UI State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Initialize Data
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      
      // If Supabase is configured, try to fetch real data
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
             setIsDbConnected(true);
             // In a real app, you would fetch the user profile here
             // For this fix, we will simulate a profile load
             setCurrentUser({ ...MOCK_USER, id: session.user.id, email: session.user.email || '' });
             setView(ViewState.FEED);
          }
          await fetchPublicData();
        } catch (error) {
          console.warn("Supabase connection failed, using mock data");
          useMockData();
        }
      } else {
        useMockData();
      }
      
      setIsLoading(false);
    };

    initApp();
  }, []);

  const useMockData = () => {
    setHobbies(MOCK_HOBBIES);
    setPosts(MOCK_POSTS);
    setIsDbConnected(false);
  };

  const fetchPublicData = async () => {
    if (!supabase) return;
    try {
      const { data: hobbiesData } = await supabase.from('hobbies').select('*');
      if (hobbiesData) setHobbies(hobbiesData as any);

      const { data: postsData } = await supabase
        .from('posts')
        .select(`*, profiles:user_id(full_name, avatar_url)`)
        .order('created_at', { ascending: false });
        
      if (postsData) {
         // Map Supabase posts to App posts
         const mappedPosts: Post[] = postsData.map((p: any) => ({
             id: p.id,
             userId: p.user_id,
             hobbyId: p.hobby_id,
             content: p.content,
             imageUrl: p.image_url,
             likes: p.likes_count || 0,
             comments: [],
             timestamp: p.created_at,
             authorName: p.profiles?.full_name || 'Unknown',
             authorAvatar: p.profiles?.avatar_url
         }));
         setPosts(mappedPosts);
      }
    } catch (e) {
      console.warn("Using local state/mock");
      useMockData();
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!isDbConnected || !supabase) {
      setTimeout(() => {
        setIsLoading(false);
        setCurrentUser(MOCK_USER);
        setView(ViewState.FEED);
        showToast(`Welcome back, ${MOCK_USER.name}!`);
      }, 1000);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast("Logged in successfully!");
      // The session listener would typically catch this, but for simplicity:
      setCurrentUser({ ...MOCK_USER, email }); 
      setView(ViewState.FEED);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email.includes('@')) {
       showToast("Please enter a valid email.", 'error');
       setIsLoading(false);
       return;
    }
    
    if (!isDbConnected || !supabase) {
       setTimeout(() => {
         setIsLoading(false);
         setView(ViewState.ONBOARDING);
         showToast("Mock Account Created");
       }, 1000);
       return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      if (error) throw error;
      showToast("Account created!");
      if (data.session) setView(ViewState.ONBOARDING);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHobby = async (hobbyName: string, description: string, category: string) => {
    setIsLoading(true);
    
    const newHobby: Hobby = {
        id: `h${Date.now()}`,
        name: hobbyName,
        description,
        category: category as HobbyCategory,
        memberCount: 1,
        image: `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80`,
        icon: '🌟'
    };

    // Update Local State
    setHobbies([...hobbies, newHobby]);
    if (currentUser) {
        setCurrentUser({ 
            ...currentUser, 
            joinedHobbies: [...currentUser.joinedHobbies, newHobby.id] 
        });
    }

    showToast("Community created!");
    setIsLoading(false);
    setView(ViewState.EXPLORE);
  };

  const handleJoinCommunity = async (hobbyId: string) => {
     if (!currentUser) {
         showToast("Please log in to join.", 'error');
         return;
     }
     if (currentUser.joinedHobbies.includes(hobbyId)) {
         showToast("Already a member!");
         return;
     }

     const updatedUser = { ...currentUser, joinedHobbies: [...currentUser.joinedHobbies, hobbyId] };
     setCurrentUser(updatedUser);
     setHobbies(prev => prev.map(h => 
        h.id === hobbyId ? { ...h, memberCount: h.memberCount + 1 } : h
     ));
     showToast("Joined successfully!");
  };

  const handleCreatePost = async (content: string, hobbyId: string) => {
      if (!currentUser) return;
      setIsLoading(true);

      const newPost: Post = {
        id: `p${Date.now()}`,
        userId: currentUser.id,
        hobbyId,
        content,
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString(),
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar
      };

      // Simulate network delay
      setTimeout(() => {
        setPosts([newPost, ...posts]);
        showToast("Posted successfully!");
        setIsLoading(false);
        setView(ViewState.FEED);
      }, 800);
  };

  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      setCurrentUser(null);
      setView(ViewState.LOGIN);
      showToast("Logged out.");
  };

  // --- Views ---

  const LoginView = () => (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-slate-50">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-3xl mb-4 shadow-xl shadow-slate-900/20">
          <Flame className="w-8 h-8 text-white" fill="currentColor" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Hobbystreak</h1>
        <p className="text-slate-500">Track habits. Join communities.</p>
      </div>
      
      {!isDbConnected && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800 flex items-start gap-3">
              <span className="text-xl">ℹ️</span>
              <div>
                  <p className="font-bold">Demo Mode Active</p>
                  <p>Database not connected. Changes are local only.</p>
              </div>
          </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl"
        />
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl"
        />
        <Button type="submit" className="w-full mt-4" isLoading={isLoading}>Sign In</Button>
      </form>
      <p className="text-center mt-8 text-slate-500 text-sm">
        New here? <button onClick={() => setView(ViewState.REGISTER)} className="font-bold text-slate-900">Create an account</button>
      </p>
    </div>
  );

  const RegisterView = () => (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-slate-50">
      <button onClick={() => setView(ViewState.LOGIN)} className="absolute top-8 left-8 p-2 bg-white rounded-full shadow-sm">
        <ArrowLeft className="w-6 h-6 text-slate-900" />
      </button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl"
        />
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl"
        />
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-4 bg-white border border-slate-200 rounded-2xl"
        />
        <Button type="submit" className="w-full mt-4" isLoading={isLoading}>Create Account</Button>
      </form>
    </div>
  );

  const CreatePostModal = () => {
    const [content, setContent] = useState('');
    const [selectedHobbyId, setSelectedHobbyId] = useState(currentUser?.joinedHobbies[0] || '');
    if (!currentUser) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-3xl p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">New Post</h2>
            <button onClick={() => setView(ViewState.FEED)}><X className="w-6 h-6 text-slate-400" /></button>
          </div>
          <div className="mb-4">
              <select 
                value={selectedHobbyId}
                onChange={(e) => setSelectedHobbyId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
              >
                  {hobbies.filter(h => currentUser.joinedHobbies.includes(h.id)).map(h => (
                      <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                  ))}
              </select>
          </div>
          <textarea 
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none mb-4"
            placeholder="Share your progress..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
          <Button onClick={() => handleCreatePost(content, selectedHobbyId)} isLoading={isLoading}>
              Post <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const FeedView = () => (
      <div className="pb-24 pt-8 px-6 bg-slate-50 min-h-screen">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h1 className="text-xl font-bold text-slate-900">Hello, {currentUser?.name.split(' ')[0]}</h1>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 bg-white rounded-full shadow-sm"><Bell className="w-5 h-5" /></button>
              </div>
          </div>
          <div className="space-y-6">
             {posts.map(post => {
                 const hobby = hobbies.find(h => h.id === post.hobbyId);
                 return (
                     <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                <img src={post.authorAvatar} alt="avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm">{post.authorName}</p>
                                <p className="text-xs text-slate-400">{hobby?.icon} {hobby?.name}</p>
                            </div>
                         </div>
                         <p className="text-slate-800 mb-4">{post.content}</p>
                         <div className="flex items-center gap-6 pt-2 border-t border-slate-50">
                             <button className="flex items-center gap-2 text-slate-400">
                                 <Heart className="w-5 h-5" /> <span className="text-xs">{post.likes}</span>
                             </button>
                             <button className="flex items-center gap-2 text-slate-400">
                                 <MessageCircle className="w-5 h-5" /> <span className="text-xs">{post.comments.length}</span>
                             </button>
                         </div>
                     </div>
                 );
             })}
          </div>
      </div>
  );

  const ExploreView = () => (
      <div className="pb-24 pt-8 px-6 bg-slate-50 min-h-screen">
          <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Explore</h1>
              <Button onClick={() => setView(ViewState.CREATE_HOBBY)} icon={Plus}>Create</Button>
          </div>
          <div className="grid gap-4">
              {hobbies.map(hobby => (
                  <div key={hobby.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className="text-3xl">{hobby.icon}</div>
                      <div className="flex-1">
                          <h3 className="font-bold">{hobby.name}</h3>
                          <p className="text-xs text-slate-500">{hobby.memberCount} members</p>
                      </div>
                      <Button 
                        variant="secondary" 
                        className="text-xs py-2 px-3"
                        onClick={() => handleJoinCommunity(hobby.id)}
                      >
                          {currentUser?.joinedHobbies.includes(hobby.id) ? 'Joined' : 'Join'}
                      </Button>
                  </div>
              ))}
          </div>
      </div>
  );

  const CreateHobbyModal = () => {
      const [name, setName] = useState('');
      const [desc, setDesc] = useState('');
      const [cat, setCat] = useState<HobbyCategory>(HobbyCategory.FITNESS);

      return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Create Community</h3>
                      <button onClick={() => setView(ViewState.EXPLORE)}><X className="w-6 h-6" /></button>
                  </div>
                  <div className="space-y-4">
                      <input className="w-full p-3 border rounded-xl" placeholder="Community Name" value={name} onChange={e => setName(e.target.value)} />
                      <textarea className="w-full p-3 border rounded-xl" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
                      <select className="w-full p-3 border rounded-xl" value={cat} onChange={e => setCat(e.target.value as HobbyCategory)}>
                          {Object.values(HobbyCategory).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Button className="w-full" isLoading={isLoading} onClick={() => handleCreateHobby(name, desc, cat)}>Create</Button>
                  </div>
              </div>
          </div>
      );
  };

  const Navigation = () => {
    if ([ViewState.LOGIN, ViewState.REGISTER].includes(view)) return null;
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-full px-6 py-4 flex items-center gap-8 z-40">
        <button onClick={() => setView(ViewState.FEED)} className={view === ViewState.FEED ? 'text-slate-900' : 'text-slate-300'}><Home /></button>
        <button onClick={() => setView(ViewState.EXPLORE)} className={view === ViewState.EXPLORE ? 'text-slate-900' : 'text-slate-300'}><Compass /></button>
        <div className="relative -top-6">
            <button onClick={() => setView(ViewState.CREATE_POST)} className="w-14 h-14 bg-slate-900 rounded-full shadow-lg flex items-center justify-center text-white">
                <Plus />
            </button>
        </div>
        <button onClick={() => setView(ViewState.SCHEDULE)} className={view === ViewState.SCHEDULE ? 'text-slate-900' : 'text-slate-300'}><Calendar /></button>
        <button onClick={() => handleLogout()} className="text-slate-300 hover:text-red-500"><LogOut /></button>
      </div>
    );
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {view === ViewState.LOGIN && <LoginView />}
      {view === ViewState.REGISTER && <RegisterView />}
      {view === ViewState.ONBOARDING && <div className="p-10 text-center"><h1 className="text-2xl font-bold mb-4">Welcome!</h1><Button onClick={() => setView(ViewState.EXPLORE)}>Start</Button></div>}
      {view === ViewState.FEED && <FeedView />}
      {view === ViewState.EXPLORE && <ExploreView />}
      {view === ViewState.CREATE_HOBBY && <CreateHobbyModal />}
      {view === ViewState.CREATE_POST && <CreatePostModal />}
      {view === ViewState.SCHEDULE && <div className="min-h-screen pt-10 text-center bg-slate-50">Schedule Feature Coming Soon</div>}
      <Navigation />
    </>
  );
}
