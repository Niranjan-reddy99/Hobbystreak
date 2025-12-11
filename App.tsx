import './App.css';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Compass, User as UserIcon, Plus, Heart, MessageCircle,
  Check, ArrowLeft, X, LogOut, Flame, Calendar,
  Bell, Loader2, Signal, Wifi, Battery, ChevronRight, Trophy, Users,
  CheckCircle, Circle, Trash2, Send
} from 'lucide-react';

// =====================================================
// 1. CONFIG
// =====================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const memoryStorage = {
  store: {} as Record<string, string>,
  getItem: (k) => memoryStorage.store[k] || null,
  setItem: (k, v) => memoryStorage.store[k] = v,
  removeItem: (k) => delete memoryStorage.store[k]
};

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: memoryStorage,
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : null;

// =====================================================
// 2. TYPES
// =====================================================
enum ViewState { LOGIN, REGISTER, ONBOARDING, FEED, EXPLORE, PROFILE, SCHEDULE, CREATE_HOBBY, CREATE_POST, COMMUNITY_DETAILS }
enum HobbyCategory { ALL = "All", FITNESS = "Fitness", CREATIVE = "Creative", TECH = "Tech", LIFESTYLE = "Lifestyle" }

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedHobbies: string[];
  stats: { totalStreak: number; points: number };
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

// ⭐ UPDATED POST TYPE with likes + comments
interface PostComment {
  id: string;
  userId: string;
  content: string;
  authorName: string;
}

interface Post {
  id: string;
  userId: string;
  hobbyId: string;
  content: string;
  likes: number;
  isLiked?: boolean;
  comments: PostComment[];
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
}

// =====================================================
// 3. CONSTANTS
// =====================================================
const INITIAL_TASKS = [
  { id: "t1", title: "Complete 15 min flow", date: new Date().toISOString().split("T")[0], completed: false }
];

const Toast = ({ message, type = "success" }) => (
  <div className={`absolute top-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 w-max ${
      type === "success" ? "bg-slate-900 text-white" : "bg-red-500 text-white"
  }`}>
    {type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
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

const Button = ({ children, onClick, className = "", icon: Icon, isLoading, disabled, variant = "primary" }) => {
  const base = "px-4 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-slate-900 text-white shadow-lg",
    secondary: "bg-white text-slate-900 border",
    ghost: "bg-transparent text-slate-500",
    danger: "bg-red-50 text-red-500"
  };
  return (
    <button onClick={onClick} disabled={isLoading || disabled} className={`${base} ${variants[variant]} ${className}`}>
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// =====================================================
// 4. MAIN APP
// =====================================================
export default function App() {

  // ====== Original Base Code States ======
  const [view, setView] = useState(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(HobbyCategory.ALL);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // ====== NEW States (Likes + Comments) ======
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // ====== UI States ======
  const [toast, setToast] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // ====== AUTH INPUT ======
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // =====================================================
  // INIT
  // =====================================================
  useEffect(() => {
    const init = async () => {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        setCurrentUser({
          id: user.id,
          name: user.user_metadata.full_name || user.email.split("@")[0],
          email: user.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          joinedHobbies: [],
          stats: { totalStreak: 0, points: 0 }
        });

        await fetchHobbiesAndPosts(user.id);
        setView(ViewState.FEED);
      } else {
        await fetchHobbiesAndPosts(null);
      }

      setIsAppLoading(false);
    };

    init();
  }, []);
  // =====================================================
  // FETCH HOBBIES + POSTS (with Likes & Comments)
  // =====================================================
  const fetchHobbiesAndPosts = async (currentUserId: string | null) => {
    if (!supabase) return;

    // Fetch hobbies
    const { data: hobbiesData } = await supabase.from("hobbies").select("*");
    if (hobbiesData) {
      setHobbies(
        hobbiesData.map((h: any) => ({
          id: h.id,
          name: h.name,
          description: h.description,
          category: h.category,
          memberCount: h.member_count || 0,
          icon: h.icon || "✨",
          image: h.image_url || "https://images.unsplash.com/photo-1550684848-fac1c5b4e853"
        }))
      );
    }

    // Fetch posts
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch comments
    const { data: commentsData } = await supabase.from("comments").select("*");

    // Fetch likes of current user
    let myLikedPostIds: string[] = [];
    if (currentUserId) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", currentUserId);

      if (likes) myLikedPostIds = likes.map((l: any) => l.post_id);
    }

    if (postsData) {
      setPosts(
        postsData.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          hobbyId: p.hobby_id,
          content: p.content,
          likes: p.likes || 0,
          isLiked: myLikedPostIds.includes(p.id),
          comments:
            commentsData
              ?.filter((c: any) => c.post_id === p.id)
              ?.map((c: any) => ({
                id: c.id,
                userId: c.user_id,
                content: c.content,
                authorName: "User"
              })) || [],
          authorName: "Community Member",
          authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
          timestamp: new Date(p.created_at).toLocaleDateString()
        }))
      );
    }
  };

  // =====================================================
  // TOAST + CONFETTI
  // =====================================================
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  // =====================================================
  // LOGIN
  // =====================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return showToast("Supabase not connected", "error");
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showToast(error.message, "error");
    } else if (data.session) {
      const user = data.session.user;

      // Ensure profile exists
      await supabase.from("profiles").upsert({
        id: user.id,
        email,
        name: email.split("@")[0],
        stats: { points: 0, totalStreak: 0 }
      });

      setCurrentUser({
        id: user.id,
        name: email.split("@")[0],
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        joinedHobbies: [],
        stats: { totalStreak: 0, points: 0 }
      });

      await fetchHobbiesAndPosts(user.id);
      setView(ViewState.FEED);
      showToast("Welcome back!");
    }

    setIsLoading(false);
  };

  // =====================================================
  // REGISTER
  // =====================================================
  const handleRegister = async () => {
    if (!supabase) return;
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Account created! Please log in.");
      setView(ViewState.LOGIN);
    }

    setIsLoading(false);
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setEmail("");
    setPassword("");
    setView(ViewState.LOGIN);
  };

  // =====================================================
  // CREATE POST (unchanged except confetti)
  // =====================================================
  const handleCreatePost = async (content: string, hobbyId: string) => {
    if (!supabase || !currentUser) return showToast("Login first", "error");

    const { error } = await supabase.from("posts").insert({
      user_id: currentUser.id,
      hobby_id: hobbyId,
      content
    });

    if (error) {
      showToast("Failed to post", "error");
    } else {
      // Give XP & update UI
      setCurrentUser({
        ...currentUser,
        stats: {
          points: currentUser.stats.points + 20,
          totalStreak: currentUser.stats.totalStreak + 1
        }
      });

      await fetchHobbiesAndPosts(currentUser.id);
      setView(ViewState.FEED);
      triggerConfetti();
      showToast("Posted! +20 XP");
    }
  };

  // =====================================================
  // LIKE / UNLIKE POST
  // =====================================================
  const handleLike = async (post: Post) => {
    if (!supabase || !currentUser)
      return showToast("Please log in first", "error");

    const isLiking = !post.isLiked;

    // OPTIMISTIC UI UPDATE
    setPosts(prev =>
      prev.map(p =>
        p.id === post.id
          ? { ...p, isLiked: isLiking, likes: p.likes + (isLiking ? 1 : -1) }
          : p
      )
    );

    if (isLiking) {
      // ADD LIKE
      await supabase.from("post_likes").insert({
        user_id: currentUser.id,
        post_id: post.id
      });
      await supabase
        .from("posts")
        .update({ likes: post.likes + 1 })
        .eq("id", post.id);
    } else {
      // REMOVE LIKE
      await supabase
        .from("post_likes")
        .delete()
        .match({ user_id: currentUser.id, post_id: post.id });
      await supabase
        .from("posts")
        .update({ likes: post.likes - 1 })
        .eq("id", post.id);
    }
  };

  // =====================================================
  // COMMENT ON POST
  // =====================================================
  const handleComment = async (postId: string, content: string) => {
    if (!currentUser) return showToast("Login to comment", "error");
    if (!content.trim()) return;

    // Optimistic local add
    const tempComment = {
      id: "temp-" + Date.now(),
      userId: currentUser.id,
      content,
      authorName: currentUser.name
    };

    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, comments: [...p.comments, tempComment] }
          : p
      )
    );

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: currentUser.id,
      content
    });

    if (error) {
      showToast("Failed to comment", "error");
      await fetchHobbiesAndPosts(currentUser.id);
    }
  };
  // =====================================================
  // RENDER
  // =====================================================
  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <Loader2 className="text-white animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-0 sm:p-8">
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-slate-50 sm:rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-[8px] border-neutral-800">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-3 bg-slate-50 text-slate-900 text-xs font-bold sticky top-0 z-20">
          <span>9:41</span>
          <div className="flex gap-2">
            <Signal className="w-4 h-4" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} />}
        {showConfetti && <Confetti />}

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">

          {/* ================= LOGIN ================= */}
          {view === ViewState.LOGIN && (
            <div className="h-full flex flex-col justify-center px-8">
              <h1 className="text-3xl font-bold text-center mb-10">Hobbystreak</h1>

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

                <Button onClick={handleLogin} isLoading={isLoading} className="w-full">
                  Sign In
                </Button>
              </div>

              <button onClick={() => setView(ViewState.REGISTER)} className="mt-6 text-sm text-slate-400 w-full">
                Create Account
              </button>
            </div>
          )}

          {/* ================ REGISTER ================= */}
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

                <Button onClick={handleRegister} isLoading={isLoading} className="w-full">
                  Sign Up
                </Button>
              </div>

              <button onClick={() => setView(ViewState.LOGIN)} className="mt-4 text-sm text-slate-400 w-full">
                Back to Login
              </button>
            </div>
          )}

          {/* =================== FEED =================== */}
          {view === ViewState.FEED && (
            <div className="px-6 pt-4">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Home</h1>
                <Bell className="w-5 h-5" />
              </div>

              <div className="space-y-4">

                {posts.map(post => {
                  const hobby = hobbies.find(h => h.id === post.hobbyId);

                  return (
                    <div key={post.id} className="bg-white p-5 rounded-3xl shadow-sm">

                      {/* POST HEADER */}
                      <div className="flex items-center gap-3 mb-3">
                        <img src={post.authorAvatar} className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                          <span className="text-sm font-bold block">{post.authorName}</span>
                          {hobby && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              {hobby.icon} {hobby.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* POST CONTENT */}
                      <p className="text-sm mb-3">{post.content}</p>

                      {/* LIKE + COMMENT BUTTONS */}
                      <div className="flex gap-4 text-slate-400 text-xs border-t pt-3">

                        <button
                          onClick={() => handleLike(post)}
                          className={`flex items-center gap-1 ${post.isLiked ? "text-red-500" : "hover:text-red-500"}`}
                        >
                          <Heart className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`} />
                          {post.likes}
                        </button>

                        <button
                          onClick={() =>
                            setExpandedPostId(expandedPostId === post.id ? null : post.id)
                          }
                          className="flex items-center gap-1 hover:text-blue-500"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {post.comments.length}
                        </button>

                      </div>

                      {/* EXPANDED COMMENTS SECTION */}
                      {expandedPostId === post.id && (
                        <div className="mt-4 pt-4 border-t border-slate-50">

                          {/* COMMENTS LIST */}
                          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                            {post.comments.map(c => (
                              <div key={c.id} className="text-xs bg-slate-50 p-2 rounded">
                                <span className="font-bold text-slate-700">{c.authorName}: </span>
                                {c.content}
                              </div>
                            ))}
                            {post.comments.length === 0 && (
                              <p className="text-xs text-slate-300">No comments yet.</p>
                            )}
                          </div>

                          {/* COMMENT INPUT */}
                          <div className="flex gap-2">
                            <input
                              id={`comment-${post.id}`}
                              className="flex-1 bg-slate-100 rounded px-3 py-2 text-xs outline-none"
                              placeholder="Write a reply..."
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  const input = e.target as HTMLInputElement;
                                  handleComment(post.id, input.value);
                                  input.value = "";
                                }
                              }}
                            />

                            <button
                              onClick={() => {
                                const input = document.getElementById(`comment-${post.id}`) as HTMLInputElement;
                                if (input.value) handleComment(post.id, input.value);
                                input.value = "";
                              }}
                              className="p-2 bg-slate-900 text-white rounded-lg"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}

                {posts.length === 0 && (
                  <p className="text-center text-slate-400 text-sm mt-10">No posts yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ===================== EXPLORE ===================== */}
          {view === ViewState.EXPLORE && (
            <div className="px-6 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Explore</h1>

                <button onClick={() => setView(ViewState.CREATE_HOBBY)}>
                  <Plus className="bg-slate-900 text-white p-2 rounded-full w-8 h-8" />
                </button>
              </div>

              {/* CATEGORY FILTER */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                {Object.values(HobbyCategory).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold ${
                      selectedCategory === cat ? "bg-slate-900 text-white" : "bg-white border"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* COMMUNITY LIST */}
              <div className="space-y-3">
                {hobbies
                  .filter(
                    h => selectedCategory === HobbyCategory.ALL || h.category === selectedCategory
                  )
                  .map(h => (
                    <div
                      key={h.id}
                      className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm"
                      onClick={() => {
                        setSelectedHobby(h);
                        setView(ViewState.COMMUNITY_DETAILS);
                      }}
                    >
                      <div className="text-2xl bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center">
                        {h.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{h.name}</h3>
                        <p className="text-xs text-slate-400">{h.memberCount} members</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ===================== PROFILE ===================== */}
          {view === ViewState.PROFILE && (
            <div className="px-6 pt-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-xl font-bold">Profile</h1>
                <button onClick={handleLogout}>
                  <LogOut className="w-5 h-5 text-red-500" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-center">
                {currentUser?.name || "Guest"}
              </h2>

              <h3 className="font-bold text-sm mb-4 mt-8">Joined Communities</h3>

              <div className="space-y-3">
                {currentUser?.joinedHobbies.length ? (
                  currentUser.joinedHobbies.map(id => {
                    const hobby = hobbies.find(h => h.id === id);
                    if (!hobby) return null;

                    return (
                      <div
                        key={id}
                        className="bg-white p-4 rounded-2xl flex gap-3 shadow-sm"
                      >
                        <span className="text-2xl">{hobby.icon}</span>
                        <p className="font-bold text-sm my-auto">{hobby.name}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 text-sm">None yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ===================== SCHEDULE ===================== */}
          {view === ViewState.SCHEDULE && (
            <div className="px-6 pt-4">
              <h1 className="text-xl font-bold mb-6">Schedule</h1>
              <p className="text-sm text-slate-500">Tasks (Mocked)</p>
            </div>
          )}

        </div>

        {/* =============== NAVIGATION =============== */}
        {![ViewState.LOGIN, ViewState.REGISTER].includes(view) && (
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-6 py-4 flex items-center justify-between border border-white/50">

              <button onClick={() => setView(ViewState.FEED)}>
                <Home className={`w-6 h-6 ${view === ViewState.FEED ? "text-slate-900" : "text-slate-400"}`} />
              </button>

              <button onClick={() => setView(ViewState.EXPLORE)}>
                <Compass className={`w-6 h-6 ${view === ViewState.EXPLORE ? "text-slate-900" : "text-slate-400"}`} />
              </button>

              <button onClick={() => setView(ViewState.CREATE_POST)}>
                <Plus className="bg-slate-900 text-white p-2 rounded-full w-10 h-10 -mt-8 border-4 border-white shadow-lg" />
              </button>

              <button onClick={() => setView(ViewState.PROFILE)}>
                <UserIcon className={`w-6 h-6 ${view === ViewState.PROFILE ? "text-slate-900" : "text-slate-400"}`} />
              </button>

              <button onClick={() => setView(ViewState.SCHEDULE)}>
                <Calendar className={`w-6 h-6 ${view === ViewState.SCHEDULE ? "text-slate-900" : "text-slate-400"}`} />
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
