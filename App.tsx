// App.tsx — CLEAN VERSION (single file)
import './App.css';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Home, Compass, User as UserIcon, Plus, Heart, MessageCircle,
  Check, ArrowLeft, X, LogOut, Flame, Calendar,
  Bell, Loader2, Signal, Wifi, Battery, ChevronRight, Trophy, Users,
  CheckCircle, Circle, Trash2, Send
} from 'lucide-react';

// ========== CONFIG ==========
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const memoryStorage = {
  store: {} as Record<string, string>,
  getItem: (k: string) => memoryStorage.store[k] ?? null,
  setItem: (k: string, v: string) => { memoryStorage.store[k] = v; },
  removeItem: (k: string) => { delete memoryStorage.store[k]; }
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

// ========== TYPES & ENUMS ==========
enum ViewState { 
  LOGIN, REGISTER, ONBOARDING, FEED, EXPLORE, PROFILE, 
  SCHEDULE, CREATE_HOBBY, CREATE_POST, COMMUNITY_DETAILS   // ✅ ADD THIS
}

enum HobbyCategory { ALL = 'All', FITNESS = 'Fitness', CREATIVE = 'Creative', TECH = 'Tech', LIFESTYLE = 'Lifestyle' }

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedHobbies: string[];
  stats: { totalStreak: number; points: number; };
}

interface Hobby {
  id: string;
  name: string;
  description: string;
  category: HobbyCategory | string;
  memberCount: number;
  icon: string;
  image: string;
}

interface PostComment {
  id: string;
  userId: string;
  content: string;
  authorName: string;
}

interface Post {
  id: string;
  userId: string;
  hobbyId: string | null;
  content: string;
  likes: number;
  isLiked?: boolean;
  comments: PostComment[];
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

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read?: boolean;
  created_at?: string;
}

// ========== UI helpers ==========
const Toast = ({ message, type = 'success' }: { message: string, type?: 'success' | 'error' }) => (
  <div className={`absolute top-12 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 w-max ${type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}`}>
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
  const variants: Record<string,string> = {
    primary: "bg-slate-900 text-white shadow-lg shadow-slate-900/20",
    secondary: "bg-white text-slate-900 border border-slate-200",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100",
    danger: "bg-red-50 text-red-500 border border-red-100 hover:bg-red-100"
  };
  return (
    <button onClick={onClick} disabled={disabled || isLoading} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// ========== APP ==========
export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // auth inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // data
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [selectedHobbyId, setSelectedHobbyId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HobbyCategory | string>(HobbyCategory.ALL);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // UI
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // likes + comments
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  



  // --- INITIALIZE ---
  useEffect(() => {
    const initApp = async () => {
      if (!supabase) {
        setTasks([]);
        setIsAppLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;

        if (session && session.user) {
          // create base current user object immediately (will enrich)
          setCurrentUser({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || 'User',
            email: session.user.email || '',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
            joinedHobbies: [],
            stats: { totalStreak: 0, points: 0 }
          });
          setView(ViewState.FEED);
          await fetchData(session.user.id);
          await fetchHobbiesAndPosts(session.user.id);
        } else {
          await fetchHobbiesAndPosts(null);
        }
      } catch (err) {
        console.error('initApp error', err);
      } finally {
        setTasks(prev => prev.length ? prev : []); // keep empty or existing
        setIsAppLoading(false);
      }
    };
    initApp();
  }, []);

  // ---------- AUTO ICON ----------
  const getAutoIcon = (hobbyName: string, category?: string): string => {
    const name = (hobbyName || '').toLowerCase();
    if (name.includes("garden") || name.includes("plant") || name.includes("farm")) return "🌱";
    if (name.includes("cricket")) return "🏏";
    if (name.includes("football") || name.includes("soccer")) return "⚽";
    if (name.includes("run") || name.includes("jog")) return "🏃‍♂️";
    if (name.includes("yoga")) return "🧘‍♀️";
    if (name.includes("cook") || name.includes("food")) return "🍳";
    if (name.includes("art") || name.includes("draw") || name.includes("paint")) return "🎨";
    if (name.includes("music") || name.includes("guitar")) return "🎸";
    if (name.includes("tech") || name.includes("code") || name.includes("program")) return "💻";
    if (name.includes("book") || name.includes("read")) return "📚";
    switch (category) {
      case "Fitness": return "💪";
      case "Creative": return "✨";
      case "Tech": return "💻";
      case "Lifestyle": return "🌟";
    }
    return "⭐";
  };

  // ---------- FETCH HOBBIES & POSTS ----------
  const fetchHobbiesAndPosts = async (currentUserId?: string | null) => {
    if (!supabase) return;
    try {
      // 1. hobbies
      const { data: hobbiesData } = await supabase.from('hobbies').select('*');
      if (hobbiesData) {
        const formattedHobbies = hobbiesData.map((h: any) => ({
          ...h,
          memberCount: h.member_count || 0,
          image: h.image_url || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
          icon: h.icon || getAutoIcon(h.name, h.category)
        }));
        setHobbies(formattedHobbies);
      }

      // 2. posts
      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });

      // 3. comments
      const { data: commentsData } = await supabase.from('comments').select('*');

      // 4. likes for current user
      let myLikedPostIds: string[] = [];
      if (currentUserId) {
        const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', currentUserId);
        if (Array.isArray(likes)) myLikedPostIds = likes.map((l:any) => l.post_id);
      }

      // 5. profiles lookup
      const { data: profiles } = await supabase.from('profiles').select('id, name');

      const getName = (uid: string) => profiles?.find((p:any) => p.id === uid)?.name || 'User';

      if (postsData) {
        const formattedPosts: Post[] = postsData.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          hobbyId: p.hobby_id,
          content: p.content,
          likes: p.likes || 0,
          comments: (commentsData?.filter((c: any) => c.post_id === p.id) || []).map((c:any) => ({
            id: c.id,
            userId: c.user_id,
            content: c.content,
            authorName: getName(c.user_id)
          })),
          isLiked: myLikedPostIds.includes(p.id),
          authorName: getName(p.user_id),
          authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
          timestamp: new Date(p.created_at).toLocaleDateString()
        }));
        setPosts(formattedPosts);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('fetchHobbiesAndPosts error', err);
    }
  };

  // ---------- fetchData (joined hobbies, tasks, notifications) ----------
  const fetchData = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data: joinedData } = await supabase.from('user_hobbies').select('hobby_id').eq('user_id', userId);
      const joinedIds = Array.isArray(joinedData) ? joinedData.map((d:any) => d.hobby_id) : [];
      setCurrentUser(prev => prev ? { ...prev, joinedHobbies: joinedIds } : prev);

      // tasks
      const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', userId);
      if (tasksData) setTasks(tasksData);

      // notifications
      const { data: notifData } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      setNotifications(notifData || []);
      setUnreadCount((notifData || []).filter(n => !n.is_read).length);
    } catch (err) {
      console.error('fetchData error', err);
    }
  };

  // ---------- TOAST / CONFETTI ----------
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  // ---------- AUTH HANDLERS ----------
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    if (!supabase) { showToast('Supabase not connected', 'error'); setIsLoading(false); return; }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { showToast(error.message, 'error'); setIsLoading(false); return; }

      const user = data.user;
      // fetch profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setCurrentUser({
        id: user.id,
        name: profile?.name || user.user_metadata?.full_name || 'User',
        email: user.email ?? '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        joinedHobbies: [],
        stats: profile?.stats || { totalStreak: 0, points: 0 }
      });

      await fetchData(user.id);
      await fetchHobbiesAndPosts(user.id);
      setView(ViewState.FEED);
      showToast('Welcome back!');
    } catch (err: any) {
      console.error('login error', err);
      showToast(err?.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // paste this function (it was missing for you)
  const handleRegister = async () => {
    if (!supabase) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });

      if (error) {
        showToast(error.message, 'error');
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        const p = {
          id: data.user.id,
          name: name || (data.user.email ? data.user.email.split('@')[0] : 'User'),
          email: data.user.email || '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
          stats: { points: 0, totalStreak: 0 }
        };
        // upsert profile (insert or update)
        const { error: pErr } = await supabase.from('profiles').upsert(p, { returning: 'minimal' });
        if (pErr) console.warn('profile upsert failed', pErr);
      }

      showToast('Account created! You can now log in.');
      setView(ViewState.LOGIN);
    } catch (err: any) {
      console.error('register error', err);
      showToast(err?.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setEmail(''); setPassword(''); setName('');
    setView(ViewState.LOGIN);
  };
  

  // ---------- COMMUNITY / POSTS ----------
  const handleCreateHobby = async (nameStr: string, description: string, category: HobbyCategory | string) => {
    if (!supabase || !currentUser) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('hobbies').insert({
        name: nameStr,
        description,
        category,
        icon: '🌟',
        member_count: 1
      }).select().single();

      if (error || !data) {
        showToast('Failed to create', 'error');
      } else {
        await supabase.from('user_hobbies').insert({ user_id: currentUser.id, hobby_id: data.id });
        await fetchHobbiesAndPosts(currentUser.id);
        await fetchData(currentUser.id);
        setView(ViewState.EXPLORE);
        showToast('Community Created!');
      }
    } catch (err) {
      console.error('create hobby', err);
      showToast('Create failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async (e: React.MouseEvent | null, hobbyId: string) => {
    if (e) e.stopPropagation();
    if (!supabase || !currentUser) return showToast('Please log in', 'error');
    if (currentUser.joinedHobbies.includes(hobbyId)) return showToast('Already joined!');

    try {
      const { error } = await supabase.from('user_hobbies').insert({ user_id: currentUser.id, hobby_id: hobbyId });
      if (!error) {
        // increment member_count
        const current = hobbies.find(h => h.id === hobbyId);
        await supabase.from('hobbies').update({ member_count: (current?.memberCount || 0) + 1 }).eq('id', hobbyId);
        setCurrentUser(prev => prev ? { ...prev, joinedHobbies: [...prev.joinedHobbies, hobbyId] } : prev);
        await fetchHobbiesAndPosts(currentUser.id);
        showToast('Joined Community!');
      } else showToast('Error joining', 'error');
    } catch (err) {
      console.error('join error', err);
      showToast('Join failed', 'error');
    }
  };

  const handleLeaveCommunity = async (hobbyId: string) => {
    if (!supabase || !currentUser) return showToast('Login required', 'error');
    if (!currentUser.joinedHobbies.includes(hobbyId)) return showToast('You are not a member', 'error');

    try {
      const { error } = await supabase.from('user_hobbies').delete().match({ user_id: currentUser.id, hobby_id: hobbyId });
      if (error) { showToast('Failed to leave', 'error'); return; }
      const h = hobbies.find(h => h.id === hobbyId);
      await supabase.from('hobbies').update({ member_count: Math.max(0, (h?.memberCount || 1) - 1) }).eq('id', hobbyId);
      setCurrentUser(prev => prev ? { ...prev, joinedHobbies: prev.joinedHobbies.filter(id => id !== hobbyId) } : prev);
      await fetchHobbiesAndPosts(currentUser.id);
      showToast('Community left');
    } catch (err) {
      console.error('leave error', err);
      showToast('Leave failed', 'error');
    }
  };

  const handleReportCommunity = async (hobbyId: string, reason: string) => {
    // Minimal report record — create a simple notifications/report row for admins (you can extend)
    if (!supabase || !currentUser) return showToast('Login required', 'error');
    try {
      await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        hobby_id,
        reason
      });
      showToast('Reported. Thank you.');
    } catch (err) {
      console.error('report error', err);
      showToast('Report failed', 'error');
    }
  };

  const handleCreatePost = async (content: string, hobbyId?: string) => {
    if (!supabase || !currentUser) return showToast('Login to post', 'error');
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        hobby_id: hobbyId || null,
        content
      });
      if (!error) {
        // update local stats
        setCurrentUser(prev => prev ? { ...prev, stats: { ...prev.stats, totalStreak: prev.stats.totalStreak + 1, points: prev.stats.points + 20 } } : prev);
        await fetchHobbiesAndPosts(currentUser.id);
        setView(ViewState.FEED);
        showToast('Posted! +20 XP');
        triggerConfetti();
      } else showToast('Failed to post', 'error');
    } catch (err) {
      console.error('create post error', err);
      showToast('Failed to post', 'error');
    }
  };

  // ---------- TASKS ----------
  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const isCompleting = !task?.completed;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: isCompleting } : t));
    if (isCompleting) {
      triggerConfetti();
      if (currentUser) {
        setCurrentUser(prev => prev ? { ...prev, stats: { ...prev.stats, points: prev.stats.points + 50 } } : prev);
        showToast('Task Complete! +50 XP');
      }
    }
    if (supabase) await supabase.from('tasks').update({ completed: isCompleting }).eq('id', taskId);
  };

  const handleAddTask = async (title: string, hobbyId?: string) => {
    if (!supabase || !currentUser) return showToast('Login to add tasks', 'error');
    try {
      const { data, error } = await supabase.from('tasks').insert({
        user_id: currentUser.id,
        title,
        date: selectedDate,
        completed: false,
        hobby_id: hobbyId || null
      }).select().single();
      if (data && !error) setTasks(prev => [...prev, data]);
      showToast('Task added');
    } catch (err) {
      console.error('add task error', err);
      showToast('Add task failed', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (supabase) await supabase.from('tasks').delete().eq('id', taskId);
  };

  // ---------- LIKES & COMMENTS ----------
  const handleLike = async (post: Post) => {
    if (!supabase || !currentUser) return showToast('Login to like!', 'error');
    // optimistic update:
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.isLiked ? Math.max(0, p.likes - 1) : p.likes + 1, isLiked: !p.isLiked } : p));

    try {
      if (post.isLiked) {
        await supabase.from('post_likes').delete().match({ user_id: currentUser.id, post_id: post.id });
        await supabase.from('posts').update({ likes: Math.max(0, post.likes - 1) }).eq('id', post.id);
      } else {
        await supabase.from('post_likes').insert({ user_id: currentUser.id, post_id: post.id });
        await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', post.id);
      }
    } catch (err) {
      console.error('like error', err);
      await fetchHobbiesAndPosts(currentUser.id);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    if (!currentUser) return showToast('Login to comment', 'error');
    if (!content.trim()) return;
    const newComment = { id: `temp-${Date.now()}`, userId: currentUser.id, content, authorName: currentUser.name };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    try {
      const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: currentUser.id, content });
      if (error) {
        showToast('Failed to comment', 'error');
        await fetchHobbiesAndPosts(currentUser.id);
      }
    } catch (err) {
      console.error('comment error', err);
      await fetchHobbiesAndPosts(currentUser.id);
    }
  };

  // ---------- NOTIFICATIONS ----------
  const markNotificationsRead = async () => {
    if (!supabase || !currentUser) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).match({ is_read: false });
      await fetchData(currentUser.id);
      setUnreadCount(0);
    } catch (err) {
      console.error('mark read error', err);
    }
  };

  // ---------- UTIL -----------
  const getWeekDays = () => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans p-0 sm:p-8">
      <div className="w-full max-w-[400px] h-[100dvh] sm:h-[850px] bg-slate-50 sm:rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-0 sm:border-[8px] border-neutral-800 ring-1 ring-white/10">

        {toast && <Toast message={toast.message} type={toast.type} />}
        {showConfetti && <Confetti />}

        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">

          {/* LOGIN */}
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
              <div className="mt-6 flex justify-between items-center">
                <button onClick={() => setView(ViewState.REGISTER)} className="text-sm text-slate-400">Create Account</button>
                <button onClick={() => setView(ViewState.ONBOARDING)} className="text-sm text-slate-400">Skip</button>
              </div>
            </div>
          )}

          {/* REGISTER */}
          {view === ViewState.REGISTER && (
            <div className="h-full flex flex-col justify-center px-8">
              <button onClick={() => setView(ViewState.LOGIN)} className="absolute top-12 left-6 p-2 bg-white rounded-full"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-2xl font-bold mb-6">Join Us</h1>
              <div className="space-y-4">
                <input className="w-full p-4 bg-white rounded-2xl shadow-sm" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                <input className="w-full p-4 bg-white rounded-2xl shadow-sm" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="w-full p-4 bg-white rounded-2xl shadow-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <Button className="w-full" onClick={handleRegister} isLoading={isLoading}>Sign Up</Button>
              </div>
            </div>
          )}

          {/* ONBOARDING */}
          {view === ViewState.ONBOARDING && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Welcome! 🎉</h1>
              <p className="text-slate-500 mb-8">Let's find your new hobby.</p>
              <Button onClick={() => setView(ViewState.EXPLORE)}>Start Exploring</Button>
            </div>
          )}

          {/* FEED */}
          {view === ViewState.FEED && (
            <div className="px-6 pt-4">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Home</h1>

                <button className="p-2 bg-white rounded-full shadow-sm relative" onClick={() => { setView(ViewState.NOTIFICATIONS); markNotificationsRead(); }}>
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (<span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>)}
                </button>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-3xl mb-6 flex justify-between items-center shadow-lg">
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
                        <div className="flex items-center gap-1 text-xs">
                          <button onClick={() => handleLike(post)} className={`flex items-center gap-1 ${post.isLiked ? 'text-red-500' : ''}`}>
                            <Heart className="w-4 h-4" /> {post.likes}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <button onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {post.comments.length}</button>
                        </div>
                      </div>

                      {expandedPostId === post.id && (
                        <div className="mt-4 pt-4 border-t border-slate-50 animate-in slide-in-from-top-2">
                          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                            {post.comments.map(c => (
                              <div key={c.id} className="text-xs bg-slate-50 p-2 rounded">
                                <span className="font-bold text-slate-700">{c.authorName}:</span> {c.content}
                              </div>
                            ))}
                            {post.comments.length === 0 && <p className="text-xs text-slate-300">No comments yet.</p>}
                          </div>
                          <div className="flex gap-2">
                            <input id={`comment-${post.id}`} className="flex-1 bg-slate-100 rounded px-3 py-2 text-xs outline-none focus:ring-1 ring-slate-200" placeholder="Write a reply..." onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const target = e.target as HTMLInputElement;
                                handleComment(post.id, target.value);
                                target.value = '';
                              }
                            }} />
                            <button onClick={() => {
                              const input = document.getElementById(`comment-${post.id}`) as HTMLInputElement;
                              if (input?.value) { handleComment(post.id, input.value); input.value = ''; }
                            }} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700">
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {posts.length === 0 && <div className="text-center text-slate-400 mt-10">No posts yet. Join a community and start posting!</div>}
              </div>
            </div>
          )}

          {/* EXPLORE */}
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

              <h2 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider">Communities</h2>
              <div className="space-y-4">
                {hobbies.filter(h => selectedCategory === HobbyCategory.ALL || h.category === selectedCategory).map(h => (
                  <div key={h.id} onClick={() => { setSelectedHobby(h); setView(ViewState.COMMUNITY_DETAILS); }} className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm active:scale-95 transition-transform cursor-pointer">
                    <div className="text-3xl bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center">{h.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">{h.name}</h3>
                      <p className="text-xs text-slate-400">{h.memberCount} members</p>
                    </div>
                    <Button
  variant={
    currentUser?.joinedHobbies.includes(h.id)
      ? "danger"
      : "secondary"
  }
  className="text-xs py-2 px-3 h-auto"
  onClick={(e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser?.joinedHobbies.includes(h.id)) {
      handleLeaveCommunity(h.id);   // 👈 leave
    } else {
      handleJoinCommunity(e, h.id); // 👈 join
    }
  }}
>
  {currentUser?.joinedHobbies.includes(h.id) ? "Leave" : "Join"}
</Button>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CREATE_HOBBY */}
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
                    {Object.values(HobbyCategory).filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Button className="w-full mt-4" onClick={() => {
                  const nameVal = (document.getElementById('hobby-name') as HTMLInputElement).value;
                  const desc = (document.getElementById('hobby-desc') as HTMLTextAreaElement).value;
                  const cat = (document.getElementById('hobby-cat') as HTMLSelectElement).value;
                  if (nameVal && desc) handleCreateHobby(nameVal, desc, cat);
                  else showToast('Please fill all fields', 'error');
                }}>Create Community</Button>
              </div>
            </div>
          )}

          {/* CREATE_POST */}
          {view === ViewState.CREATE_POST && (
            <div className="h-full bg-white p-6 pt-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">New Post</h2>
                <button onClick={() => setView(ViewState.FEED)}><X className="w-6 h-6" /></button>
              </div>

              <textarea id="post-content" className="w-full h-40 bg-slate-50 p-4 rounded-2xl resize-none outline-none text-sm" placeholder="What did you achieve today?" />

              <div className="mt-4">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Select Community</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(hobbies.filter(h => (currentUser?.joinedHobbies || []).includes(h.id))).map(h => (
                    <button key={h.id} onClick={() => { setSelectedHobbyId(h.id); setSelectedHobby(h); }} className={`px-4 py-2 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap border transition-all ${selectedHobbyId === h.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                      <span>{h.icon}</span> {h.name}
                    </button>
                  ))}
                  {(!hobbies || hobbies.length === 0) && <p className="text-xs text-slate-400">Join a community first</p>}
                </div>
              </div>

              <Button className="w-full mt-8" onClick={() => {
                const content = (document.getElementById('post-content') as HTMLTextAreaElement).value;
                if (!content.trim()) { showToast('Post cannot be empty', 'error'); return; }
                handleCreatePost(content, selectedHobbyId || undefined);
              }}>Post Update (+20 XP)</Button>
            </div>
          )}

          {/* COMMUNITY_DETAILS */}
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

                <Button className="w-full mb-4" onClick={(e: React.MouseEvent) => {
                  if ((currentUser?.joinedHobbies || []).includes(selectedHobby.id)) handleLeaveCommunity(selectedHobby.id);
                  else handleJoinCommunity(e, selectedHobby.id);
                }} variant={(currentUser?.joinedHobbies || []).includes(selectedHobby.id) ? 'danger' : 'primary'}>
                  {(currentUser?.joinedHobbies || []).includes(selectedHobby.id) ? 'Leave Community' : 'Join Community'}
                </Button>

                <div className="flex gap-2 mb-6">
                  <button onClick={() => {
                    const reason = prompt('Report community — please provide a short reason:');
                    if (reason) handleReportCommunity(selectedHobby.id, reason);
                  }} className="flex-1 bg-white text-slate-700 p-3 rounded-2xl border">Report</button>
                </div>

                <h3 className="font-bold text-sm mb-4">Community Posts</h3>

                {!(currentUser?.joinedHobbies || []).includes(selectedHobby.id) ? (
                  <div className="text-center text-slate-400 text-sm py-6 border rounded-2xl bg-slate-50">Join this community to see member posts.</div>
                ) : (
                  <div className="space-y-4">
                    {posts.filter(p => p.hobbyId === selectedHobby.id).map(post => (
                      <div key={post.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <img src={post.authorAvatar} className="w-6 h-6 rounded-full" />
                          <span className="text-xs font-bold">{post.authorName}</span>
                        </div>
                        <p className="text-sm text-slate-700">{post.content}</p>
                        <div className="flex gap-4 text-slate-400 text-xs border-t pt-3 mt-3">
                          <button onClick={() => handleLike(post)} className={`flex items-center gap-1 transition-colors ${post.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} /> {post.likes}
                          </button>
                          <button onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} className="flex items-center gap-1 hover:text-blue-500">
                            <MessageCircle className="w-4 h-4" /> {post.comments.length}
                          </button>
                        </div>

                        {expandedPostId === post.id && (
                          <div className="mt-4 pt-4 border-t border-slate-50">
                            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                              {post.comments.map(c => (
                                <div key={c.id} className="text-xs bg-slate-50 p-2 rounded">
                                  <span className="font-bold">{c.authorName}:</span> {c.content}
                                </div>
                              ))}
                              {post.comments.length === 0 && <p className="text-xs text-slate-300">No comments yet.</p>}
                            </div>

                            <div className="flex gap-2">
                              <input id={`comm-comm-${post.id}`} className="flex-1 bg-slate-100 rounded px-3 py-2 text-xs outline-none focus:ring-1 ring-slate-200" placeholder="Write a reply..." onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.target as HTMLInputElement;
                                  if (input.value) {
                                    handleComment(post.id, input.value);
                                    input.value = '';
                                  }
                                }
                              }} />
                              <button onClick={() => {
                                const input = document.getElementById(`comm-comm-${post.id}`) as HTMLInputElement;
                                if (input?.value) { handleComment(post.id, input.value); input.value = ''; }
                              }} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700"><Send className="w-3 h-3" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {posts.filter(p => p.hobbyId === selectedHobby.id).length === 0 && (
                      <p className="text-center text-sm text-slate-400 py-4">No posts yet. Be the first!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFILE */}
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
              


              <div className="bg-white p-6 rounded-3xl shadow-sm mb-6 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">XP Progress</span>
                  <span className="text-xs font-bold text-slate-900">{(currentUser?.stats.points || 0) % 100} / 100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${(currentUser?.stats.points || 0) % 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  {100 - ((currentUser?.stats.points || 0) % 100)} XP to next level
                </p>
              </div>

              <h3 className="font-bold text-sm mb-4">My Hobbies</h3>
              <div className="space-y-3">
                {(hobbies.filter(h => (currentUser?.joinedHobbies || []).includes(h.id))).map(h => (
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

          {/* SCHEDULE */}
          {view === ViewState.SCHEDULE && (
            <div className="px-6 pt-4 h-full flex flex-col">
              <h1 className="text-xl font-bold mb-6">Schedule</h1>

              <div className="flex justify-between mb-8 overflow-x-auto no-scrollbar pb-2">
                {getWeekDays().map((date, index) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <button key={index} onClick={() => setSelectedDate(dateStr)} className={`flex flex-col items-center justify-center min-w-[50px] h-[70px] rounded-2xl transition-all ${isSelected ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-100'}`}>
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
                  <input id="new-task-input" className="flex-1 pl-4 outline-none text-sm" placeholder="Add a new task..." onKeyDown={(e) => { if (e.key === 'Enter') { const input = e.currentTarget as HTMLInputElement; if(input.value) { handleAddTask(input.value, currentUser?.joinedHobbies[0]); input.value = ''; } } }} />
                  <Button className="w-10 h-10 p-0 rounded-xl" onClick={() => { const input = document.getElementById('new-task-input') as HTMLInputElement; if (input?.value) { handleAddTask(input.value, currentUser?.joinedHobbies[0]); input.value = ''; } }}>
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {view === ViewState.NOTIFICATIONS && (
            <div className="px-6 pt-4">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Notifications</h1>
                <button onClick={() => setView(ViewState.FEED)}><ArrowLeft className="w-6 h-6" /></button>
              </div>

              {notifications.length === 0 && (<p className="text-center text-slate-400 mt-10">No notifications yet.</p>)}

              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="bg-white p-4 rounded-2xl shadow-sm border">
                    <p className="font-bold text-sm">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.body}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at || '').toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM NAV */}
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
