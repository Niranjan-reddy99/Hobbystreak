
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Hobby, Post, User, HobbyCategory, Conversation, DirectMessage, Achievement, DailyChallenge, Reminder } from './types';
import { MOCK_HOBBIES, MOCK_POSTS, CURRENT_USER, MOCK_USERS, MOCK_CONVERSATIONS, MOCK_DIRECT_MESSAGES, MOCK_ACHIEVEMENTS, MOCK_REMINDERS, CHALLENGE_REPOSITORY } from './constants';
import { 
  HomeIcon, CompassIcon, UserIcon, PlusIcon, HeartIcon, 
  MessageCircleIcon, SparklesIcon, SendIcon, CheckIcon, ArrowLeftIcon, MicIcon, XIcon, WaveformIcon, PhoneIcon, ImageIcon, LogOutIcon, GoogleIcon, AppleIcon, LockIcon, GlobeIcon, SearchIcon, UsersIcon, TrophyIcon, FlameIcon, AwardIcon, StarIcon, ClockIcon, CalendarIcon, TrashIcon, LightningIcon, LoaderIcon, MoreHorizontalIcon, FlagIcon, SettingsIcon, ShieldIcon, HelpCircleIcon, BellIcon, ChevronRightIcon
} from './components/Icons';
import { supabase, mapSupabaseUserToAppUser, isKeyValid, isKeyFormatCorrect } from './services/supabaseClient';

// --- Helper Components ---

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl z-[100] flex items-center gap-3 animate-slide-up">
      <CheckIcon className="w-5 h-5 text-green-400" />
      <span className="font-semibold text-sm">{message}</span>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, fullWidth = false, isLoading = false }: any) => {
  const baseStyle = `px-6 py-3.5 rounded-2xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''}`;
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    black: "bg-black text-white hover:bg-slate-900",
    accent: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg"
  };
  return (
    <button 
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}`}
    >
      {isLoading ? <LoaderIcon className="w-5 h-5" /> : children}
    </button>
  );
};

const Input = ({ label, type = "text", placeholder, value, onChange, className = "", id, error }: any) => (
  <div className={`space-y-2 ${className}`}>
    {label && <label className="block text-sm font-semibold text-slate-700 ml-1">{label}</label>}
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-5 py-3.5 bg-white border rounded-2xl focus:ring-0 outline-none transition-all placeholder:text-slate-400 shadow-sm text-slate-900 ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-slate-500'}`}
    />
    {error && <p className="text-red-500 text-xs font-medium ml-1">{error}</p>}
  </div>
);

const PostCard: React.FC<{ 
  post: Post, 
  hobbies: Hobby[], 
  currentUserId: string,
  onViewProfile: (userId: string) => void,
  onAddComment: (postId: string, content: string) => void,
  onReport: (type: 'post' | 'user', id: string) => void
}> = ({ post, hobbies, currentUserId, onViewProfile, onAddComment, onReport }) => {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [animateLike, setAnimateLike] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const author = MOCK_USERS[post.userId] || { name: 'Community Member', avatar: 'https://picsum.photos/150/150' };
  const hobby = hobbies.find(h => h.id === post.hobbyId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLike = () => {
    setLiked(!liked);
    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 300);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentInput.trim()) {
      onAddComment(post.id, commentInput);
      setCommentInput('');
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-visible mb-5 transition-all hover:shadow-md relative">
      <div className="p-5 flex items-center gap-4">
        <button onClick={() => onViewProfile(post.userId)}>
          <img src={author.avatar} alt={author.name} className="w-12 h-12 rounded-full object-cover border border-slate-100" />
        </button>
        <div className="flex-1">
          <button onClick={() => onViewProfile(post.userId)} className="text-base font-bold text-slate-900 hover:underline text-left block">
            {author.name}
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            {hobby && (
              <span className="flex items-center gap-1 text-slate-500">
                {hobby.icon} {hobby.name}
              </span>
            )}
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>{new Date(post.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600">
                <MoreHorizontalIcon className="w-5 h-5" />
            </button>
            {showMenu && (
                <div className="absolute right-0 top-10 bg-white shadow-xl rounded-xl border border-slate-100 w-40 z-20 overflow-hidden">
                    <button 
                        onClick={() => { setShowMenu(false); onReport('post', post.id); }} 
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <FlagIcon className="w-4 h-4" /> Report Post
                    </button>
                    <button 
                        onClick={() => { setShowMenu(false); onReport('user', post.userId); }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                         <UserIcon className="w-4 h-4" /> Report User
                    </button>
                </div>
            )}
        </div>
      </div>
      
      <div className="px-5 pb-2">
        <p className="text-slate-700 leading-relaxed text-[15px]">{post.content}</p>
      </div>

      {post.imageUrl && (
        <div className="w-full h-64 overflow-hidden mt-3">
          <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex gap-6">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${liked ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <HeartIcon className={`w-6 h-6 ${animateLike ? 'animate-pop' : ''}`} filled={liked} />
            {post.likes + (liked ? 1 : 0)}
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 text-sm font-semibold hover:text-slate-600 ${showComments ? 'text-slate-900' : 'text-slate-400'}`}
          >
            <MessageCircleIcon className="w-6 h-6" />
            {post.comments.length}
          </button>
        </div>
      </div>

      {showComments && (
        <div className="bg-slate-50/50 p-5 border-t border-slate-100 animate-fade-in rounded-b-[2rem]">
          <div className="space-y-4 mb-4">
            {post.comments.map(c => {
               return (
                 <div key={c.id} className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                   <div className="flex-1">
                      <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-none border border-slate-200 text-sm shadow-sm inline-block">
                        <span className="font-bold text-xs block mb-1 text-slate-900">User</span>
                        <span className="text-slate-600">{c.content}</span>
                      </div>
                   </div>
                 </div>
               )
            })}
            {post.comments.length === 0 && <p className="text-xs text-slate-400 text-center font-medium">No comments yet.</p>}
          </div>
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-3 text-sm rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-slate-200 outline-none"
            />
            <button disabled={!commentInput.trim()} className="text-slate-900 font-bold disabled:opacity-30 px-2">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const CreatePostModal = ({ 
  user, 
  hobbies, 
  newPostContent, 
  setNewPostContent, 
  selectedHobbyId, 
  setSelectedHobbyId, 
  onPost, 
  isPosting, 
  onCancel 
}: {
  user: User | null,
  hobbies: Hobby[],
  newPostContent: string,
  setNewPostContent: (s: string) => void,
  selectedHobbyId: string,
  setSelectedHobbyId: (s: string) => void,
  onPost: () => void,
  isPosting: boolean,
  onCancel: () => void
}) => {
  const userHobbies = hobbies.filter(h => user?.joinedHobbies?.includes(h.id));
  
  useEffect(() => {
    if (!selectedHobbyId && userHobbies.length > 0) {
        setSelectedHobbyId(userHobbies[0].id);
    }
  }, [selectedHobbyId, userHobbies.length]);

  return (
     <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-slide-up">
         <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
             <button onClick={onCancel} className="text-slate-600 font-medium">Cancel</button>
             <h2 className="font-bold text-lg">New Post</h2>
             <button 
                disabled={isPosting || !newPostContent.trim()} 
                onClick={onPost}
                className="bg-slate-900 text-white px-5 py-2 rounded-full font-bold text-sm disabled:opacity-50 transition-all"
              >
                {isPosting ? 'Posting...' : 'Post'}
             </button>
         </div>
         <div className="p-6">
             <div className="flex gap-4 mb-4">
                <img src={user?.avatar} className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                <div>
                    <span className="block font-bold text-sm">{user?.name}</span>
                    <select
                      value={selectedHobbyId}
                      onChange={(e) => setSelectedHobbyId(e.target.value)}
                      className="text-xs text-slate-500 bg-transparent border-none outline-none p-0 cursor-pointer hover:text-indigo-600"
                    >
                        {userHobbies.map(h => (
                            <option key={h.id} value={h.id}>in {h.name}</option>
                        ))}
                    </select>
                </div>
             </div>
             <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your progress, a photo, or a thought..."
                className="w-full h-48 text-lg placeholder:text-slate-300 outline-none resize-none"
                autoFocus
             />
         </div>
     </div>
  );
};

const CreateHobbyModal = ({ onClose, onCreate, isLoading }: { onClose: () => void, onCreate: (data: any) => void, isLoading: boolean }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HobbyCategory>(HobbyCategory.FITNESS);

  return (
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center animate-fade-in p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Create Community</h2>
                  <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400" /></button>
              </div>
              
              <div className="space-y-4">
                  <Input 
                    label="Community Name" 
                    placeholder="e.g. Sunday Cyclists" 
                    value={name} 
                    onChange={(e: any) => setName(e.target.value)} 
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 ml-1">Category</label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value as HobbyCategory)}
                      className="w-full px-5 py-3.5 bg-white border border-slate-300 rounded-2xl outline-none focus:border-slate-500"
                    >
                        {Object.values(HobbyCategory).map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 ml-1">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What is this community about?"
                        className="w-full px-5 py-3.5 bg-white border border-slate-300 rounded-2xl outline-none focus:border-slate-500 resize-none h-24"
                      />
                  </div>
                  
                  <Button 
                    fullWidth 
                    type="button"
                    onClick={() => onCreate({ name, description, category })}
                    disabled={!name.trim() || !description.trim()}
                    isLoading={isLoading}
                  >
                      Create Community
                  </Button>
              </div>
          </div>
      </div>
  )
}

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [hobbies, setHobbies] = useState<Hobby[]>(MOCK_HOBBIES);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Safe Mode / Mock Data Fallback
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionErrorMsg, setConnectionErrorMsg] = useState('');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  // App States
  const [activeTab, setActiveTab] = useState<'home' | 'communities' | 'schedule' | 'profile'>('home');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedHobbyId, setSelectedHobbyId] = useState('');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedUserProfileId, setSelectedUserProfileId] = useState<string | null>(null);
  
  // Data States
  const [myHobbies, setMyHobbies] = useState<Hobby[]>([]);
  const [feedFilter, setFeedFilter] = useState<'all' | 'my_hobbies' | 'following'>('all');
  const [reminders, setReminders] = useState<Reminder[]>(MOCK_REMINDERS);

  // --- Initial Data Fetch ---
  useEffect(() => {
    // Check key format immediately
    if (!isKeyFormatCorrect()) {
        console.warn("Invalid API Key format for Supabase Client");
        setIsSafeMode(true);
        setConnectionStatus('error');
        setConnectionErrorMsg("Invalid Key Format. Use the 'anon' key starting with 'ey...'.");
        return;
    }

    // PERSIST SESSION CHECK - IMPROVED (BULLETPROOF VERSION)
    const checkSession = async () => {
        const { data, error } = await supabase.auth.getSession();
        
        console.log("SESSION CHECK:", data?.session);
        
        if (error) {
            console.error("Session error:", error);
            return;
        }

        if (data?.session?.user) {
            await fetchUserData(data.session.user);
        }
    };
    checkSession();

    // AUTH LISTENER - IMPROVED (BULLETPROOF VERSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log("AUTH EVENT:", _event);

        if (session?.user) {
            await fetchUserData(session.user);
        } else {
            setCurrentUser(null);
        }
    });

    const fetchInitial = async () => {
        try {
            const { data, error } = await supabase.from('hobbies').select('*');
            if (error) throw error;
            setConnectionStatus('connected');
            if (data) {
                 const mappedHobbies: Hobby[] = data.map((h: any) => ({
                    id: h.id,
                    name: h.name,
                    description: h.description,
                    category: h.category as HobbyCategory,
                    memberCount: h.member_count,
                    image: h.image_url || `https://picsum.photos/800/400?random=${Math.floor(Math.random() * 100)}`,
                    icon: h.icon || '✨',
                    rules: h.rules || []
                 }));
                 // IMPORTANT: Use Real Data if connected, fallback to MOCK only if Safe Mode active elsewhere
                 setHobbies(mappedHobbies);
            }
        } catch (e: any) {
            console.error("Supabase Error:", e);
            // Only switch to Safe Mode if it's a critical failure, otherwise keep trying
            if (e.message === 'Failed to fetch') {
                setIsSafeMode(true);
                setConnectionStatus('error');
                setConnectionErrorMsg("Network Error. Check your internet or Project URL.");
            }
        }
    };
    fetchInitial();

    return () => subscription.unsubscribe();
  }, []); // Run once on mount

  const fetchUserData = async (sbUser: any) => {
      try {
          // Use maybeSingle() to avoid error if profile doesn't exist yet
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', sbUser.id).maybeSingle();
          
          const user = mapSupabaseUserToAppUser(sbUser, profile);
          
          // Fetch joined hobbies
          const { data: joined } = await supabase.from('user_hobbies').select('hobby_id, streak').eq('user_id', user.id);
          
          if (joined) {
              user.joinedHobbies = joined.map((j: any) => j.hobby_id);
              user.hobbyStreaks = joined.reduce((acc: any, curr: any) => ({...acc, [curr.hobby_id]: curr.streak}), {});
          }
          
          setCurrentUser(user);
          // Wait for hobbies state to be populated or fetch fresh to set myHobbies
          // For now, we update it when hobbies changes or right here if hobbies already has data
          setMyHobbies(hobbies.filter(h => user.joinedHobbies.includes(h.id)));
          
          if (view === ViewState.LOGIN || view === ViewState.REGISTER) {
              setView(ViewState.FEED);
          }
      } catch (error) {
          console.error("Error fetching user data", error);
      }
  };

  // Update myHobbies when hobbies or currentUser changes
  useEffect(() => {
      if (currentUser && hobbies.length > 0) {
          setMyHobbies(hobbies.filter(h => currentUser.joinedHobbies.includes(h.id)));
      }
  }, [currentUser, hobbies]);


  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleLogin = async () => {
    setFormError('');
    if (!email.includes('@')) {
        setFormError("Please enter a valid email.");
        return;
    }
    if (password.length < 6) {
        setFormError("Password must be at least 6 characters.");
        return;
    }

    setLoading(true);
    
    // MOCK MODE or SAFE MODE
    if (isSafeMode) {
        setTimeout(() => {
            setCurrentUser(CURRENT_USER);
            setMyHobbies(MOCK_HOBBIES.filter(h => CURRENT_USER.joinedHobbies.includes(h.id)));
            setView(ViewState.FEED);
            setLoading(false);
            showToast("Logged in (Safe Mode)");
        }, 1000);
        return;
    }

    // REAL SUPABASE LOGIN
    try {
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (authError) throw authError;
        // Logic handled by onAuthStateChange

    } catch (e: any) {
        console.error("Login failed", e);
        if (e.message === 'Failed to fetch') {
             setIsSafeMode(true);
             showToast("Connection error. Switching to Safe Mode.");
        } else {
             setFormError("Invalid email or password.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleRegister = async () => {
      setFormError('');
      if (!name) { setFormError("Name is required."); return; }
      if (!email.includes('@')) { setFormError("Invalid email."); return; }
      if (password.length < 6) { setFormError("Password too short."); return; }

      setLoading(true);

      if (isSafeMode) {
        setTimeout(() => {
            const newUser = { ...CURRENT_USER, id: 'new_user', name: name, email };
            setCurrentUser(newUser);
            setView(ViewState.ONBOARDING);
            setLoading(false);
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
          
          if (data.user) {
             // Create Profile Row
             await supabase.from('profiles').insert([{ id: data.user.id, email: data.user.email, full_name: name }]);
             
             // Auth listener will handle the rest
             setView(ViewState.ONBOARDING);
          }
      } catch (e: any) {
          setFormError(e.message || "Registration failed");
      } finally {
          setLoading(false);
      }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
      if (isSafeMode) {
          setIsSocialLoading(true);
          setTimeout(() => {
               setCurrentUser(CURRENT_USER);
               setMyHobbies(MOCK_HOBBIES.filter(h => CURRENT_USER.joinedHobbies.includes(h.id)));
               setView(ViewState.FEED);
               setIsSocialLoading(false);
               showToast(`Welcome back via ${provider}!`);
          }, 1000);
          return;
      }

      try {
          // Note: This requires OAuth to be configured in Supabase Dashboard
          const { error } = await supabase.auth.signInWithOAuth({ 
              provider,
              options: {
                  redirectTo: window.location.origin
              }
          });
          if (error) throw error;
      } catch (e: any) {
          console.error(e);
          setFormError(`Social login failed: ${e.message}. Please use email/password for now.`);
      }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedHobbyId || !currentUser) return;
    setLoading(true);
    
    // SAFE MODE
    if (isSafeMode) {
        const newPost: Post = {
            id: `new_${Date.now()}`,
            userId: currentUser.id,
            hobbyId: selectedHobbyId,
            content: newPostContent,
            likes: 0,
            comments: [],
            timestamp: new Date().toISOString()
        };
        setPosts([newPost, ...posts]);
         setTimeout(() => {
            setLoading(false);
            setView(ViewState.FEED);
            setNewPostContent('');
            showToast("Activity Posted! (Saved Locally)");
        }, 800);
        return;
    }

    // SUPABASE
    try {
        const { error } = await supabase.from('posts').insert([{
            user_id: currentUser.id,
            hobby_id: selectedHobbyId,
            content: newPostContent
        }]);

        if (error) throw error;
        
        showToast("Activity Posted! Streak Updated 🔥");
        setView(ViewState.FEED);
        setNewPostContent('');

    } catch (e: any) {
        console.error(e);
        if (e.code === '42501' || e.message?.includes('row-level security')) {
            showToast("Permission denied. Database Policy missing.");
        } else {
            showToast("Failed to post: " + e.message);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleCreateHobby = async (data: any) => {
      if (!currentUser) {
          showToast("Please log in to create a community.");
          return;
      }
      setLoading(true);
      
      const icons: Record<string, string> = {
          [HobbyCategory.FITNESS]: '🏃',
          [HobbyCategory.CREATIVE]: '🎨',
          [HobbyCategory.INTELLECTUAL]: '🧠',
          [HobbyCategory.TECH]: '💻',
          [HobbyCategory.OUTDOORS]: '🌲'
      };

      const newHobbyPayload = {
          name: data.name,
          description: data.description,
          category: data.category,
          member_count: 1,
          icon: icons[data.category] || '✨',
          image_url: `https://picsum.photos/800/400?random=${Math.floor(Math.random() * 1000)}`
      };

      if (isSafeMode) {
          const mockHobby: Hobby = {
              id: `h_new_${Date.now()}`,
              ...newHobbyPayload,
              image: newHobbyPayload.image_url,
              memberCount: 1
          };
          setHobbies([...hobbies, mockHobby]);
          setMyHobbies([...myHobbies, mockHobby]);
          setCurrentUser({
              ...currentUser,
              joinedHobbies: [...currentUser.joinedHobbies, mockHobby.id]
          });
          setLoading(false);
          setView(ViewState.FEED); 
          showToast("Community Created (Local)!");
          return;
      }

      try {
          // 1. Insert Hobby
          const { data: inserted, error } = await supabase.from('hobbies').insert([newHobbyPayload]).select().single();
          if (error) {
              console.error("Hobby Insert Error:", error);
              if (error.code === '42501') throw new Error("Permission denied. Run schema.sql to fix RLS.");
              throw error;
          }

          if (inserted) {
              const realHobby: Hobby = {
                  id: inserted.id,
                  name: inserted.name,
                  description: inserted.description,
                  category: inserted.category as HobbyCategory,
                  memberCount: inserted.member_count,
                  image: inserted.image_url,
                  icon: inserted.icon,
                  rules: []
              };
              
              setHobbies(prev => [...prev, realHobby]);
              
              // 2. Insert Join Record
              const { error: joinError } = await supabase.from('user_hobbies').insert([{
                  user_id: currentUser.id,
                  hobby_id: realHobby.id,
                  streak: 0
              }]);
              
              if (joinError) {
                   console.error("Join Error:", joinError);
                   showToast("Community created, but failed to auto-join.");
              } else {
                   // 3. Update Local User State
                   setCurrentUser(prev => prev ? ({
                      ...prev,
                      joinedHobbies: [...prev.joinedHobbies, realHobby.id],
                      hobbyStreaks: { ...prev.hobbyStreaks, [realHobby.id]: 0 }
                   }) : null);

                   setView(ViewState.COMMUNITY_DETAILS);
                   setSelectedCommunityId(realHobby.id);
                   showToast("Community Created!");
              }
          }
      } catch (e: any) {
          console.error(e);
          showToast("Failed: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleJoinCommunity = async (hobbyId: string) => {
      if (!currentUser) return;
      if (currentUser.joinedHobbies.includes(hobbyId)) {
          showToast("Already a member!");
          return;
      }
      
      if (isSafeMode) {
        const updatedUser = {
            ...currentUser,
            joinedHobbies: [...currentUser.joinedHobbies, hobbyId],
            hobbyStreaks: { ...currentUser.hobbyStreaks, [hobbyId]: 0 }
        };
        setCurrentUser(updatedUser);
        const newHobby = hobbies.find(h => h.id === hobbyId);
        if (newHobby) setMyHobbies([...myHobbies, newHobby]);
        showToast("Joined Community!");
        return;
      }

      try {
          const { error } = await supabase.from('user_hobbies').insert([{
              user_id: currentUser.id,
              hobby_id: hobbyId,
              streak: 0
          }]);
          
          if (error) {
              if (error.code === '23503') { // Foreign Key Violation
                  throw new Error("Community not found in database.");
              }
              if (error.code === '42501') {
                   throw new Error("Permission denied. Database policy blocks joining.");
              }
              throw error;
          }
          
          // Update Local State
          setCurrentUser(prev => prev ? ({
              ...prev,
              joinedHobbies: [...prev.joinedHobbies, hobbyId]
          }) : null);
          
          // myHobbies will update via useEffect
          showToast("Joined Successfully!");

      } catch (e: any) {
          console.error(e);
          showToast(e.message || "Failed to join");
      }
  };

  const handleViewCommunity = (hobbyId: string) => {
      setSelectedCommunityId(hobbyId);
      setView(ViewState.COMMUNITY_DETAILS);
  };

  const toggleReminder = (id: string) => {
      setReminders(reminders.map(r => 
          r.id === id ? { ...r, completed: !r.completed } : r
      ));
  };

  // Views
  if (view === ViewState.LOGIN) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-8 relative overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 rounded-b-[4rem] z-0"></div>
        
        <div className="z-10 bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200">
          <div className="flex justify-center mb-6">
             <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-300 transform -rotate-6">
                <FlameIcon filled className="w-8 h-8 text-white" />
             </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2 tracking-tight">Hobbystreak</h1>
          <p className="text-center text-slate-500 mb-8 font-medium">Ignite your passions.</p>
          
          {isSafeMode && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl text-center">
                  <p className="text-xs text-orange-600 font-bold mb-2 uppercase tracking-wide">⚠️ Safe Mode Active</p>
                  <p className="text-[11px] text-orange-500 leading-relaxed">
                     {connectionErrorMsg || "Database Connection Failed"}
                  </p>
              </div>
          )}

          <div className="space-y-4">
            <Input 
                label="Email" 
                value={email} 
                onChange={(e: any) => setEmail(e.target.value)} 
                placeholder="you@example.com"
                error={formError && !email.includes('@') ? 'Invalid email' : ''}
            />
            <Input 
                label="Password" 
                type="password" 
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)} 
                placeholder="••••••••" 
            />
            
            {formError && <p className="text-red-500 text-sm font-medium text-center">{formError}</p>}

            <Button fullWidth onClick={handleLogin} isLoading={loading}>Log In</Button>
            
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase">Or continue with</span>
                <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <GoogleIcon className="w-5 h-5" />
                </button>
                <button onClick={() => handleSocialLogin('apple')} className="flex items-center justify-center py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <AppleIcon className="w-5 h-5" />
                </button>
            </div>

            <p className="text-center text-slate-500 text-sm mt-4 font-medium">
              New here? <button onClick={() => setView(ViewState.REGISTER)} className="text-slate-900 font-bold hover:underline">Create Account</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ... (Rest of the App component remains the same)
  if (view === ViewState.REGISTER) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-8 relative">
         <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-100 -skew-y-6 transform origin-top-left z-0"></div>
         
         <div className="z-10 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
           <div className="mb-8">
             <button onClick={() => setView(ViewState.LOGIN)} className="p-2 -ml-2 hover:bg-slate-50 rounded-full w-fit mb-4">
               <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
             </button>
             <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
             <p className="text-slate-500 font-medium">Join the community today.</p>
           </div>
           
           <div className="space-y-4">
             <Input 
                label="Full Name" 
                value={name} 
                onChange={(e: any) => setName(e.target.value)} 
                placeholder="John Doe" 
             />
             <Input 
                label="Email" 
                value={email} 
                onChange={(e: any) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
             />
             <Input 
                label="Password" 
                type="password" 
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)} 
                placeholder="Min 6 chars" 
             />
             
             {formError && <p className="text-red-500 text-sm text-center font-medium">{formError}</p>}

             <Button fullWidth onClick={handleRegister} isLoading={loading}>Sign Up</Button>

             <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase">Or</span>
                <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <GoogleIcon className="w-5 h-5" />
                </button>
                <button onClick={() => handleSocialLogin('apple')} className="flex items-center justify-center py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <AppleIcon className="w-5 h-5" />
                </button>
            </div>
           </div>
         </div>
      </div>
    );
  }

  if (view === ViewState.ONBOARDING) {
      return (
          <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 animate-pop">
                  <CheckIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You're In!</h2>
              <p className="text-slate-500 mb-8 max-w-xs">Welcome to Hobbystreak. Let's find your first community.</p>
              <Button onClick={() => setView(ViewState.TUTORIAL)} fullWidth>Get Started</Button>
          </div>
      )
  }

  if (view === ViewState.TUTORIAL) {
      return (
          <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col justify-between">
              <div className="mt-12">
                  <div className="w-16 h-1 bg-white/20 rounded-full mb-8">
                      <div className="w-1/3 h-full bg-white rounded-full"></div>
                  </div>
                  <h1 className="text-4xl font-bold mb-6 leading-tight">Track what <br/><span className="text-slate-400">matters.</span></h1>
                  <p className="text-lg text-slate-300">Consistency is the key to mastery. Log your daily progress and watch your streaks grow.</p>
              </div>
              <div className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-2xl flex items-center gap-4">
                      <FlameIcon filled className="w-8 h-8 text-orange-400" />
                      <div className="text-left">
                          <h3 className="font-bold">Build Streaks</h3>
                          <p className="text-sm text-slate-400">Don't break the chain.</p>
                      </div>
                  </div>
                  <Button variant="secondary" fullWidth onClick={() => setView(ViewState.FEED)}>Start Exploring</Button>
              </div>
          </div>
      )
  }

  if (view === ViewState.CREATE_POST) {
      return (
          <CreatePostModal 
            user={currentUser}
            hobbies={hobbies}
            newPostContent={newPostContent}
            setNewPostContent={setNewPostContent}
            selectedHobbyId={selectedHobbyId}
            setSelectedHobbyId={setSelectedHobbyId}
            onPost={handleCreatePost}
            isPosting={loading}
            onCancel={() => setView(ViewState.FEED)}
          />
      )
  }

  if (view === ViewState.CREATE_HOBBY) {
      return (
          <CreateHobbyModal 
            onClose={() => setView(ViewState.FEED)} 
            onCreate={handleCreateHobby} 
            isLoading={loading} 
          />
      )
  }

  if (view === ViewState.COMMUNITY_DETAILS && selectedCommunityId) {
      const community = hobbies.find(h => h.id === selectedCommunityId);
      const communityPosts = posts.filter(p => p.hobbyId === selectedCommunityId);
      const isJoined = currentUser?.joinedHobbies.includes(selectedCommunityId);

      if (!community) return <div>Community not found</div>;

      return (
          <div className="min-h-screen bg-slate-50 pb-20">
              <div className="relative h-48">
                  <img src={community.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                  <button 
                    onClick={() => { setView(ViewState.FEED); setActiveTab('communities'); }}
                    className="absolute top-6 left-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30"
                  >
                      <ArrowLeftIcon className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => showToast("Community reported to admins.")}
                    className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30"
                  >
                      <FlagIcon className="w-6 h-6" />
                  </button>
              </div>
              <div className="px-6 -mt-12 relative z-10">
                  <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200">
                      <div className="flex justify-between items-start mb-4">
                          <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 shadow-sm">
                              {community.icon}
                          </div>
                          <button 
                            onClick={() => handleJoinCommunity(community.id)}
                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${isJoined ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-lg'}`}
                          >
                              {isJoined ? 'Joined' : 'Join Community'}
                          </button>
                      </div>
                      <h1 className="text-2xl font-bold text-slate-900 mb-1">{community.name}</h1>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-4">
                          <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-500 uppercase">{community.category}</span>
                          <span>•</span>
                          <UsersIcon className="w-3 h-3" /> {community.memberCount} Members
                      </div>
                      <p className="text-slate-600 leading-relaxed text-sm">{community.description}</p>
                      
                      {/* Community Rules Section */}
                      <div className="mt-6 pt-6 border-t border-slate-100">
                          <h3 className="font-bold text-lg text-slate-900 mb-3">Community Rules</h3>
                          <ul className="space-y-3">
                              {community.rules && community.rules.length > 0 ? (
                                  community.rules.map((rule, index) => (
                                      <li key={index} className="flex gap-3 items-start text-sm text-slate-600">
                                          <span className="bg-slate-100 text-slate-500 font-bold w-5 h-5 flex items-center justify-center rounded-full text-xs flex-shrink-0 mt-0.5">{index + 1}</span>
                                          <span className="leading-snug">{rule}</span>
                                      </li>
                                  ))
                              ) : (
                                  <li className="text-slate-400 text-sm italic">No specific rules listed. Be kind and respectful.</li>
                              )}
                          </ul>
                      </div>
                  </div>
                  
                  <div className="mt-8 space-y-6">
                      <h3 className="font-bold text-lg text-slate-900 px-2">Community Feed</h3>
                      {communityPosts.length > 0 ? (
                          communityPosts.map(post => (
                              <PostCard 
                                key={post.id} 
                                post={post} 
                                hobbies={hobbies}
                                currentUserId={currentUser?.id || ''}
                                onViewProfile={(id) => { setSelectedUserProfileId(id); setView(ViewState.VIEW_USER_PROFILE); }}
                                onAddComment={(pid, c) => console.log(pid, c)}
                                onReport={(t, id) => showToast(`Reported ${t} successfully`)}
                              />
                          ))
                      ) : (
                          <div className="text-center py-12 text-slate-400">
                              <p>No posts yet. Be the first!</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // Common Layout for Logged In Views
  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 relative">
       {/* Toast */}
       {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

       {/* Top Navigation */}
       <div className="fixed top-0 w-full bg-slate-50/90 backdrop-blur-md z-40 px-6 py-4 flex justify-between items-center border-b border-slate-100">
           {activeTab === 'home' && (
               <div>
                   <h1 className="text-2xl font-extrabold tracking-tight">Hobbystreak</h1>
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                       {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                   </p>
               </div>
           )}
           {activeTab !== 'home' && (
               <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
           )}
           <div className="flex gap-3">
             <button className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-600">
                 <BellIcon className="w-5 h-5" />
             </button>
             <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                 <img src={currentUser?.avatar} alt="Profile" className="w-full h-full object-cover" />
             </button>
           </div>
       </div>
       
       {/* Content Area */}
       <div className="pt-24 px-6 max-w-lg mx-auto">
          
          {/* DASHBOARD */}
          {activeTab === 'home' && (
             <div className="space-y-8 animate-fade-in">
                 
                 {/* Daily Snapshot */}
                 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                     <div className="min-w-[140px] bg-slate-900 text-white p-4 rounded-3xl flex flex-col justify-between h-32 shadow-lg shadow-slate-200">
                         <FlameIcon filled className="w-6 h-6 text-orange-400" />
                         <div>
                             <span className="text-3xl font-bold block">{currentUser?.stats.streak}</span>
                             <span className="text-xs text-slate-400 font-medium">Day Streak</span>
                         </div>
                     </div>
                     <div className="min-w-[140px] bg-white text-slate-900 border border-slate-100 p-4 rounded-3xl flex flex-col justify-between h-32">
                         <CheckIcon className="w-6 h-6 text-green-500" />
                         <div>
                             <span className="text-3xl font-bold block">3</span>
                             <span className="text-xs text-slate-400 font-medium">Tasks Left</span>
                         </div>
                     </div>
                     <div className="min-w-[140px] bg-white text-slate-900 border border-slate-100 p-4 rounded-3xl flex flex-col justify-between h-32">
                         <StarIcon filled className="w-6 h-6 text-yellow-400" />
                         <div>
                             <span className="text-3xl font-bold block">{currentUser?.stats.totalPoints}</span>
                             <span className="text-xs text-slate-400 font-medium">Points</span>
                         </div>
                     </div>
                 </div>

                 {/* Filters */}
                 <div className="flex gap-2">
                     {['all', 'my_hobbies', 'following'].map((f) => (
                         <button 
                            key={f}
                            onClick={() => setFeedFilter(f as any)}
                            className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-colors ${feedFilter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
                         >
                             {f.replace('_', ' ')}
                         </button>
                     ))}
                 </div>

                 {/* Feed */}
                 <div>
                     {posts.length > 0 ? (
                         posts.map(post => (
                             <PostCard 
                                key={post.id} 
                                post={post} 
                                hobbies={hobbies}
                                currentUserId={currentUser?.id || ''}
                                onViewProfile={(id) => { setSelectedUserProfileId(id); setView(ViewState.VIEW_USER_PROFILE); }}
                                onAddComment={(pid, c) => console.log(pid, c)}
                                onReport={(t, id) => showToast(`Reported ${t} successfully`)}
                              />
                         ))
                     ) : (
                         <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <ImageIcon className="w-6 h-6 text-slate-300" />
                             </div>
                             <p className="text-slate-400 font-medium">No posts yet.</p>
                             <button onClick={() => setActiveTab('communities')} className="text-slate-900 font-bold text-sm mt-2 hover:underline">Find a community</button>
                         </div>
                     )}
                 </div>
             </div>
          )}

          {/* COMMUNITIES / EXPLORE */}
          {activeTab === 'communities' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold">Discover</h2>
                      <button 
                        onClick={() => setView(ViewState.CREATE_HOBBY)}
                        className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1"
                      >
                          <PlusIcon className="w-3 h-3" /> Create
                      </button>
                  </div>
                  <div className="relative">
                      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search hobbies..." 
                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-none shadow-sm outline-none font-medium placeholder:text-slate-400"
                      />
                  </div>

                  <h3 className="font-bold text-lg px-2">Popular Categories</h3>
                  <div className="grid grid-cols-2 gap-3">
                      {Object.values(HobbyCategory).slice(0, 4).map(cat => (
                          <div key={cat} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                              <span className="font-semibold text-sm">{cat}</span>
                              <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                          </div>
                      ))}
                  </div>

                  <h3 className="font-bold text-lg px-2 mt-6">All Communities</h3>
                  <div className="space-y-4">
                      {hobbies.length > 0 ? hobbies.map(hobby => (
                          <div 
                            key={hobby.id} 
                            onClick={() => handleViewCommunity(hobby.id)}
                            className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                          >
                              <img src={hobby.image} className="w-16 h-16 rounded-2xl object-cover bg-slate-100" />
                              <div className="flex-1">
                                  <h4 className="font-bold text-slate-900">{hobby.name}</h4>
                                  <p className="text-xs text-slate-500 line-clamp-1">{hobby.description}</p>
                                  <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-slate-400">
                                      <UsersIcon className="w-3 h-3" />
                                      {hobby.memberCount} members
                                  </div>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleJoinCommunity(hobby.id); }}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${currentUser?.joinedHobbies.includes(hobby.id) ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'}`}
                              >
                                  {currentUser?.joinedHobbies.includes(hobby.id) ? 'Joined' : 'Join'}
                              </button>
                          </div>
                      )) : (
                          <div className="text-center py-8 text-slate-400">
                              <p className="text-sm">No communities found.</p>
                              <p className="text-xs mt-1">Create the first one!</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

           {/* SCHEDULE / TASKS */}
           {activeTab === 'schedule' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex items-center justify-between px-2">
                      <h3 className="font-bold text-lg">Today's Schedule</h3>
                      <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                  </div>

                  {/* Date Strip - Minimalist */}
                  <div className="flex justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                      {Array.from({ length: 5 }).map((_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() + i - 2);
                          const isToday = i === 2;
                          return (
                              <div key={i} className={`flex flex-col items-center justify-center w-12 h-16 rounded-2xl ${isToday ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
                                  <span className="text-[10px] font-bold uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</span>
                                  <span className="text-lg font-bold">{date.getDate()}</span>
                                  {isToday && <div className="w-1 h-1 bg-orange-400 rounded-full mt-1"></div>}
                              </div>
                          )
                      })}
                  </div>

                  {/* Task List */}
                  <div className="space-y-3">
                      {reminders.map(reminder => (
                          <div 
                            key={reminder.id} 
                            onClick={() => toggleReminder(reminder.id)}
                            className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${reminder.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}
                          >
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${reminder.completed ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                                  {reminder.completed && <CheckIcon className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1">
                                  <h4 className={`font-bold text-sm ${reminder.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>{reminder.text}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                      <ClockIcon className="w-3 h-3 text-slate-400" />
                                      <span className="text-xs text-slate-400">{reminder.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {/* Add Task Button (Visual Only) */}
                      <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                          <PlusIcon className="w-4 h-4" /> Add Task
                      </button>
                  </div>
              </div>
          )}
          
          {/* PROFILE */}
          {activeTab === 'profile' && currentUser && (
              <div className="animate-fade-in pb-10">
                  <div className="text-center mb-8">
                      <div className="w-24 h-24 mx-auto rounded-full p-1 border-2 border-slate-200 mb-4">
                          <img src={currentUser.avatar} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{currentUser.name}</h2>
                      <p className="text-slate-500 text-sm font-medium">{currentUser.bio || 'No bio yet.'}</p>
                      
                      <div className="flex justify-center gap-6 mt-6">
                          <div className="text-center">
                              <span className="block font-bold text-xl">{currentUser.stats.streak}</span>
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Streak</span>
                          </div>
                          <div className="text-center">
                              <span className="block font-bold text-xl">{currentUser.stats.totalPoints}</span>
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Points</span>
                          </div>
                          <div className="text-center">
                              <span className="block font-bold text-xl">{currentUser.joinedHobbies.length}</span>
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hobbies</span>
                          </div>
                      </div>
                  </div>
                  
                  {/* Hobby Streaks */}
                  <h3 className="font-bold text-lg mb-4 px-2">Active Streaks</h3>
                  <div className="space-y-3 mb-8">
                      {myHobbies.map(h => (
                          <div key={h.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                              <div className="flex items-center gap-3">
                                  <span className="text-2xl">{h.icon}</span>
                                  <span className="font-bold text-sm">{h.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg">{currentUser.hobbyStreaks[h.id] || 0}</span>
                                  <FlameIcon filled className="w-5 h-5 text-orange-500" />
                              </div>
                          </div>
                      ))}
                      {myHobbies.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Join a hobby to start a streak!</p>}
                  </div>

                  {/* Settings / Logout */}
                  <div className="space-y-3">
                      <button className="w-full p-4 bg-white rounded-2xl flex items-center justify-between font-semibold text-slate-700 hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                              <SettingsIcon className="w-5 h-5" /> Settings
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                      </button>
                      <button 
                        onClick={() => setView(ViewState.LOGIN)}
                        className="w-full p-4 bg-red-50 rounded-2xl flex items-center justify-center gap-2 font-bold text-red-600 hover:bg-red-100 transition-colors"
                      >
                          <LogOutIcon className="w-5 h-5" /> Log Out
                      </button>
                  </div>
              </div>
          )}

       </div>

       {/* Bottom Nav */}
       <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-slate-300 rounded-full px-2 py-2 flex items-center gap-1 z-50">
           <button 
             onClick={() => setActiveTab('home')} 
             className={`p-3 rounded-full transition-all ${activeTab === 'home' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
           >
               <HomeIcon className="w-6 h-6" />
           </button>
           <button 
             onClick={() => setActiveTab('communities')} 
             className={`p-3 rounded-full transition-all ${activeTab === 'communities' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
           >
               <CompassIcon className="w-6 h-6" />
           </button>
           
           <button 
              onClick={() => setView(ViewState.CREATE_POST)}
              className="bg-slate-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all mx-2"
           >
               <PlusIcon className="w-6 h-6" />
           </button>
           
           <button 
             onClick={() => setActiveTab('schedule')} 
             className={`p-3 rounded-full transition-all ${activeTab === 'schedule' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
           >
               <CalendarIcon className="w-6 h-6" />
           </button>
           <button 
             onClick={() => setActiveTab('profile')} 
             className={`p-3 rounded-full transition-all ${activeTab === 'profile' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
           >
               <UserIcon className="w-6 h-6" />
           </button>
       </div>
    </div>
  );
}
