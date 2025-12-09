import React, { useState, useEffect } from "react";
import {
  HomeIcon,
  CompassIcon,
  UserIcon,
  PlusIcon,
  HeartIcon,
  MessageCircleIcon,
  SparklesIcon,
  SendIcon,
  CheckIcon,
  ArrowLeftIcon,
  MicIcon,
  PhoneIcon,
  XIcon,
  WaveformIcon,
  ImageIcon,
  LogOutIcon,
  GoogleIcon,
  AppleIcon,
  LockIcon,
  GlobeIcon,
  SearchIcon,
  UsersIcon,
  TrophyIcon,
  FlameIcon,
  AwardIcon,
  StarIcon,
  ClockIcon,
  CalendarIcon,
  TrashIcon,
  LightningIcon,
  LoaderIcon,
  SettingsIcon,
  BellIcon,
  ShieldIcon,
  HelpCircleIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  FlagIcon,
} from "./components/Icons";
 // 👈 NOTE: icons.tsx in root

import {
  ViewState,
  HobbyCategory,
  User,
  Hobby,
  Post,
} from "./types";
import {
  MOCK_HOBBIES,
  MOCK_POSTS,
  MOCK_USERS,
} from "./constants";
import {
  supabase,
  isKeyValid,
  isKeyFormatCorrect,
  mapSupabaseUserToAppUser,
} from "./supabaseClient"; // 👈 NOTE: supabaseClient.ts in root

// --- Toast Notification Component ---
const Toast = ({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}) => (
  <div
    className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-slide-up ${
      type === "success"
        ? "bg-slate-900 text-white"
        : "bg-red-500 text-white"
    }`}
  >
    {type === "success" ? (
      <CheckIcon className="w-4 h-4" />
    ) : (
      <XIcon className="w-4 h-4" />
    )}
    <span className="text-sm font-medium">{message}</span>
  </div>
);

// --- Button Component ---
const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  icon: Icon,
  disabled,
  isLoading,
  type = "button",
}: any) => {
  const baseStyle =
    "px-4 py-3 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20",
    secondary:
      "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${
        variants[variant as keyof typeof variants]
      } ${className}`}
    >
      {isLoading ? (
        <LoaderIcon className="w-5 h-5 animate-spin" />
      ) : (
        Icon && <Icon className="w-5 h-5" />
      )}
      {children}
    </button>
  );
};

export default function App() {
  // --- State ---
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Data State
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // UI State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      // If env keys are wrong → use mock mode
    if (!isKeyValid() || !isKeyFormatCorrect()) {
   // Set error only ONCE — this prevents infinite focus loss
   setDbError(prev =>
     prev ? prev : "Invalid API Key format. Using Mock Mode."
   );

   setHobbies(MOCK_HOBBIES);
   setPosts(MOCK_POSTS);
   setIsLoading(false);
   return;
}


      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session?.user) {
          setIsDbConnected(true);
          await fetchUserData(data.session.user);
          setView(ViewState.FEED);
        } else {
          // Just check DB connectivity
          const { error: healthError } = await supabase
            .from("hobbies")
            .select("id")
            .limit(1);
          if (!healthError) {
            setIsDbConnected(true);
          } else {
            setDbError(healthError.message);
          }
        }

        await fetchPublicData();
      } catch (err: any) {
        console.error("Initialization error:", err);
        setDbError(err.message || "Failed to connect");
        setHobbies(MOCK_HOBBIES);
        setPosts(MOCK_POSTS);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserData(session.user);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setView(ViewState.LOGIN);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // -----------------------------
  // FETCH HELPERS
  // -----------------------------
  const fetchPublicData = async () => {
    try {
      const { data: hobbiesData } = await supabase
        .from("hobbies")
        .select("*");
      if (hobbiesData) {
        const mapped: Hobby[] = hobbiesData.map((h: any) => ({
          id: h.id,
          name: h.name,
          description: h.description,
          category: h.category as HobbyCategory,
          memberCount: h.member_count ?? 0,
          image: h.image_url,
          icon: h.icon ?? "✨",
        }));
        setHobbies(mapped);
      }

      const { data: postsData } = await supabase
        .from("posts")
        .select(`*, profiles:user_id(full_name, avatar_url)`)
        .order("created_at", { ascending: false });

      if (postsData) {
        const mappedPosts: Post[] = postsData.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          hobbyId: p.hobby_id,
          content: p.content,
          imageUrl: p.image_url,
          likes: p.likes_count || 0,
          comments: [],
          timestamp: p.created_at,
        }));
        setPosts(mappedPosts);
      }
    } catch (e) {
      console.warn("Could not fetch public data, using mock.");
    }
  };

  const fetchUserData = async (sbUser: any) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sbUser.id)
        .single();

      const appUser = mapSupabaseUserToAppUser(sbUser, profile);

      const { data: userHobbies } = await supabase
        .from("user_hobbies")
        .select("hobby_id, streak")
        .eq("user_id", sbUser.id);

      if (userHobbies) {
        appUser.joinedHobbies = userHobbies.map(
          (uh: any) => uh.hobby_id
        );
        userHobbies.forEach((uh: any) => {
          appUser.hobbyStreaks[uh.hobby_id] = uh.streak;
        });
      }

      setCurrentUser(appUser);
    } catch (e) {
      console.error("Error fetching user profile", e);
    }
  };

  // -----------------------------
  // UTILS
  // -----------------------------
  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // -----------------------------
  // AUTH HANDLERS
  // -----------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock mode
    if (!isDbConnected && dbError) {
      setTimeout(() => {
        setIsLoading(false);
        const mockUser = MOCK_USERS["u1"];
        setCurrentUser(mockUser);
        setView(ViewState.FEED);
        showToast(`Welcome back, ${mockUser.name}!`);
      }, 800);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      showToast("Logged in successfully!");
      // auth listener fills currentUser
    } catch (err: any) {
      showToast(err.message || "Login failed", "error");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email.includes("@")) {
      showToast("Please enter a valid email.", "error");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      setIsLoading(false);
      return;
    }

    if (!isDbConnected && dbError) {
      setTimeout(() => {
        setIsLoading(false);
        setView(ViewState.ONBOARDING);
      }, 800);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split("@")[0],
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          },
        },
      });

      if (error) throw error;

      showToast("Account created! Check your email.");
      setTimeout(() => {
        if (data.session) {
          setView(ViewState.ONBOARDING);
        } else {
          setView(ViewState.LOGIN);
        }
        setIsLoading(false);
      }, 1200);
    } catch (err: any) {
      showToast(err.message || "Sign up failed", "error");
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setIsLoading(true);
    if (!isDbConnected) {
      showToast("Social login unavailable in Mock Mode", "error");
      setIsLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      showToast(
        err.message || "Social login failed. Check Supabase config.",
        "error"
      );
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView(ViewState.LOGIN);
    showToast("Logged out.");
  };

  // -----------------------------
  // COMMUNITY HANDLERS
  // -----------------------------
  const handleCreateHobby = async (
    hobbyName: string,
    description: string,
    category: HobbyCategory
  ) => {
    setIsLoading(true);

    if (!currentUser) {
      showToast("Please log in to create a community", "error");
      setIsLoading(false);
      return;
    }

    // Mock mode
    if (!isDbConnected) {
      const newHobby: Hobby = {
        id: `h${Date.now()}`,
        name: hobbyName,
        description,
        category,
        memberCount: 1,
        image: `https://picsum.photos/800/400?random=${Date.now()}`,
        icon: "🌟",
      };
      setHobbies([...hobbies, newHobby]);
      const updatedUser = {
        ...currentUser,
        joinedHobbies: [...currentUser.joinedHobbies, newHobby.id],
      };
      setCurrentUser(updatedUser);
      showToast("Community created!");
      setIsLoading(false);
      setView(ViewState.EXPLORE);
      return;
    }

    try {
      const { data: hobbyData, error: hobbyError } = await supabase
        .from("hobbies")
        .insert({
          name: hobbyName,
          description,
          category,
          image_url: `https://picsum.photos/800/400?random=${Date.now()}`,
          icon: "🌟",
          member_count: 1,
        })
        .select()
        .single();

      if (hobbyError) throw hobbyError;

      const newHobby: Hobby = {
        id: hobbyData.id,
        name: hobbyData.name,
        description: hobbyData.description,
        category: hobbyData.category as HobbyCategory,
        memberCount: hobbyData.member_count ?? 1,
        image: hobbyData.image_url,
        icon: hobbyData.icon ?? "🌟",
      };
      setHobbies((prev) => [...prev, newHobby]);

      const { error: joinError } = await supabase
        .from("user_hobbies")
        .insert({
          user_id: currentUser.id,
          hobby_id: newHobby.id,
        });

      if (joinError) {
        console.error("Auto-join failed:", joinError);
        showToast("Community created, but join failed.", "error");
      } else {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                joinedHobbies: [...prev.joinedHobbies, newHobby.id],
              }
            : null
        );
        showToast("Community created!");
      }

      setView(ViewState.EXPLORE);
    } catch (err: any) {
      console.error(err);
      if (err.code === "42501") {
        showToast(
          "Permission denied. Database RLS policy blocks creation.",
          "error"
        );
      } else {
        showToast(
          err.message || "Failed to create community",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCommunity = async (hobbyId: string) => {
    if (!currentUser) {
      showToast("Please log in to join.", "error");
      return;
    }

    const isJoined = currentUser.joinedHobbies.includes(hobbyId);
    if (isJoined) {
      showToast("Already a member!");
      return;
    }

    if (!isDbConnected) {
      const updatedUser = {
        ...currentUser,
        joinedHobbies: [...currentUser.joinedHobbies, hobbyId],
      };
      setCurrentUser(updatedUser);
      showToast("Joined successfully (Local)!");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_hobbies")
        .insert({
          user_id: currentUser.id,
          hobby_id: hobbyId,
        });

      if (error) throw error;

      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              joinedHobbies: [...prev.joinedHobbies, hobbyId],
            }
          : null
      );

      setHobbies((prev) =>
        prev.map((h) =>
          h.id === hobbyId
            ? { ...h, memberCount: h.memberCount + 1 }
            : h
        )
      );

      showToast("Joined successfully!");
    } catch (err: any) {
      console.error(err);
      if (err.code === "42501") {
        showToast("Permission denied. Check RLS policies.", "error");
      } else {
        showToast("Failed to join community.", "error");
      }
    }
  };

  const handleCreatePost = async (
    content: string,
    hobbyId: string
  ) => {
    if (!currentUser) return;
    if (!content.trim()) return;

    setIsLoading(true);

    if (!isDbConnected) {
      const newPost: Post = {
        id: `p${Date.now()}`,
        userId: currentUser.id,
        hobbyId,
        content,
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString(),
      };
      setPosts([newPost, ...posts]);
      showToast("Posted successfully!");
      setIsLoading(false);
      setView(ViewState.FEED);
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: currentUser.id,
          hobby_id: hobbyId,
          content,
        });

      if (error) throw error;

      await fetchPublicData();
      showToast("Posted successfully!");
      setView(ViewState.FEED);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to post", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // VIEWS
  // -----------------------------
  const LoginView = () => (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-slate-50">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-3xl mb-4 shadow-xl shadow-slate-900/20">
          <FlameIcon className="w-8 h-8 text-white" filled />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Hobbystreak
        </h1>
        <p className="text-slate-500">
          Track habits. Join communities. Level up.
        </p>
      </div>

      {dbError && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl text-sm text-orange-800 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold">Safe Mode Active</p>
            <p>{dbError}</p>
            <p className="mt-1 text-xs opacity-75">
              Using Mock Data. Changes won't be saved to cloud.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
        </div>
        <Button
          type="submit"
          className="w-full mt-4"
          isLoading={isLoading}
        >
          Sign In
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-50 text-slate-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="secondary"
          onClick={() => handleSocialLogin("google")}
        >
          <GoogleIcon className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSocialLogin("apple")}
        >
          <AppleIcon className="w-5 h-5" />
        </Button>
      </div>

      <p className="text-center mt-8 text-slate-500 text-sm">
        New here?{" "}
        <button
          onClick={() => setView(ViewState.REGISTER)}
          className="font-bold text-slate-900 hover:underline"
        >
          Create an account
        </button>
      </p>
    </div>
  );

  const RegisterView = () => (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-slate-50">
      <button
        onClick={() => setView(ViewState.LOGIN)}
        className="absolute top-8 left-8 p-2 bg-white rounded-full shadow-sm"
      >
        <ArrowLeftIcon className="w-6 h-6 text-slate-900" />
      </button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Create Account
        </h1>
        <p className="text-slate-500">Join the movement today.</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Builder"
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </div>
        <Button
          type="submit"
          className="w-full mt-4"
          isLoading={isLoading}
        >
          Create Account
        </Button>
      </form>

      <p className="text-center mt-8 text-slate-500 text-sm">
        Already have an account?{" "}
        <button
          onClick={() => setView(ViewState.LOGIN)}
          className="font-bold text-slate-900 hover:underline"
        >
          Sign In
        </button>
      </p>
    </div>
  );

  const CreateHobbyModal = () => {
    const [hName, setHName] = useState("");
    const [desc, setDesc] = useState("");
    const [cat, setCat] = useState<HobbyCategory>(
      HobbyCategory.FITNESS
    );

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 w-full max-w-md animate-pop">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Create Community</h3>
            <button onClick={() => setView(ViewState.EXPLORE)}>
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <input
              className="w-full p-3 border rounded-xl"
              placeholder="Community Name"
              value={hName}
              onChange={(e) => setHName(e.target.value)}
            />
            <textarea
              className="w-full p-3 border rounded-xl"
              placeholder="Description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <select
              className="w-full p-3 border rounded-xl"
              value={cat}
              onChange={(e) =>
                setCat(e.target.value as HobbyCategory)
              }
            >
              {Object.values(HobbyCategory).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Button
              className="w-full"
              isLoading={isLoading}
              onClick={() =>
                handleCreateHobby(hName, desc, cat)
              }
              disabled={!hName.trim() || !desc.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const CreatePostModal = () => {
    const [content, setContent] = useState("");
    const joined = currentUser?.joinedHobbies || [];
    const defaultHobbyId =
      joined.length > 0 ? joined[0] : hobbies[0]?.id || "";
    const [selectedHobbyId, setSelectedHobbyId] =
      useState(defaultHobbyId);

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-3xl p-6 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">New Post</h2>
            <button onClick={() => setView(ViewState.FEED)}>
              <XIcon className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Post to
            </label>
            <select
              value={selectedHobbyId}
              onChange={(e) =>
                setSelectedHobbyId(e.target.value)
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
            >
              {hobbies
                .filter((h) =>
                  (currentUser?.joinedHobbies || []).includes(h.id)
                )
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.icon} {h.name}
                  </option>
                ))}
            </select>
          </div>

          <textarea
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 mb-4"
            placeholder="Share your progress..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>

          <div className="flex justify-between items-center">
            <div className="flex gap-2 text-slate-400">
              <button className="p-2 hover:bg-slate-100 rounded-full">
                <ImageIcon className="w-6 h-6" />
              </button>
            </div>
            <Button
              onClick={() =>
                handleCreatePost(content, selectedHobbyId)
              }
              isLoading={isLoading}
              disabled={!content.trim() || !selectedHobbyId}
            >
              Post <SendIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const ExploreView = () => (
    <div className="pb-24 pt-8 px-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Explore Communities</h1>
        <Button
          onClick={() => setView(ViewState.CREATE_HOBBY)}
          icon={PlusIcon}
        >
          Create
        </Button>
      </div>
      <div className="grid gap-4">
        {hobbies.map((hobby) => (
          <div
            key={hobby.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
          >
            <div className="text-3xl">{hobby.icon}</div>
            <div className="flex-1">
              <h3 className="font-bold">{hobby.name}</h3>
              <p className="text-xs text-slate-500">
                {hobby.description}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {hobby.memberCount} members
              </p>
            </div>
            <Button
              variant="secondary"
              className="text-xs py-2 px-3"
              onClick={() => handleJoinCommunity(hobby.id)}
            >
              {currentUser?.joinedHobbies.includes(hobby.id)
                ? "Joined"
                : "Join"}
            </Button>
          </div>
        ))}
        {hobbies.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            No communities found. Create one!
          </div>
        )}
      </div>
    </div>
  );

  const ScheduleView = () => (
    <div className="pb-24 pt-8 px-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Your Schedule</h1>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
        <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">
          No upcoming tasks scheduled.
        </p>
        <Button variant="secondary" className="mt-4">
          Add Task
        </Button>
      </div>
    </div>
  );

  const ProfileView = () => {
    if (!currentUser) return null;
    return (
      <div className="pb-24 pt-8 px-6 bg-slate-50 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button
            onClick={handleLogout}
            className="p-2 bg-white border rounded-full hover:bg-slate-100"
          >
            <LogOutIcon className="w-5 h-5 text-red-500" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center mb-6">
          <img
            src={currentUser.avatar}
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
          />
          <h2 className="text-xl font-bold">{currentUser.name}</h2>
          <p className="text-slate-500 text-sm">
            {currentUser.bio || "No bio yet."}
          </p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-lg font-bold">
                {currentUser.stats.streak}
              </p>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Streak
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-lg font-bold">
                {currentUser.joinedHobbies.length}
              </p>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Hobbies
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-lg font-bold">
                {currentUser.stats.totalPoints}
              </p>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Points
              </p>
            </div>
          </div>
        </div>

        <h3 className="font-bold mb-4">Joined Communities</h3>
        <div className="space-y-3">
          {hobbies
            .filter((h) =>
              currentUser.joinedHobbies.includes(h.id)
            )
            .map((h) => (
              <div
                key={h.id}
                className="bg-white p-4 rounded-2xl flex items-center gap-3 border border-slate-100"
              >
                <span className="text-2xl">{h.icon}</span>
                <div>
                  <p className="font-bold">{h.name}</p>
                  <p className="text-xs text-slate-400">
                    Streak: {currentUser.hobbyStreaks[h.id] || 0} days
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const FeedView = () => {
    const firstName = currentUser?.name
      ? currentUser.name.split(" ")[0]
      : "there";

    return (
      <div className="pb-24 pt-8 px-6 bg-slate-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Hello, {firstName}
            </h1>
            <p className="text-xs text-slate-400">
              Ready to keep the streak?
            </p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white rounded-full shadow-sm">
              <BellIcon className="w-5 h-5" />
            </button>
            <button className="p-2 bg-white rounded-full shadow-sm">
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {posts.map((post) => {
            const hobby = hobbies.find(
              (h) => h.id === post.hobbyId
            );
            return (
              <div
                key={post.id}
                className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">
                      User {post.userId.slice(0, 4)}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      {hobby?.icon} {hobby?.name} •
                    </p>
                  </div>
                  <button>
                    <MoreHorizontalIcon className="w-5 h-5 text-slate-300" />
                  </button>
                </div>
                <p className="text-slate-800 mb-4 leading-relaxed">
                  {post.content}
                </p>
                {post.imageUrl && (
                  <div className="mb-4 rounded-2xl overflow-hidden">
                    <img
                      src={post.imageUrl}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-6 pt-2 border-t border-slate-50">
                  <button className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors">
                    <HeartIcon className="w-5 h-5" />{" "}
                    <span className="text-xs font-medium">
                      {post.likes}
                    </span>
                  </button>
                  <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors">
                    <MessageCircleIcon className="w-5 h-5" />{" "}
                    <span className="text-xs font-medium">
                      {post.comments.length}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
          {posts.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p>No activity yet.</p>
              <p className="text-sm">
                Join a community or post something!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // -----------------------------
  // NAVIGATION
  // -----------------------------
  const Navigation = () => {
    if (
      [ViewState.LOGIN, ViewState.REGISTER, ViewState.ONBOARDING].includes(
        view
      )
    )
      return null;

    const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-14 transition-all duration-300 ${
          active ? "text-slate-900 -translate-y-1" : "text-slate-300"
        }`}
      >
        <Icon className="w-6 h-6 mb-1" />
        {active && (
          <span className="text-[10px] font-bold animate-fade-in">
            {label}
          </span>
        )}
      </button>
    );

    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-900/10 rounded-full px-6 py-4 flex items-center gap-8 z-40">
        <NavItem
          icon={HomeIcon}
          label="Home"
          active={view === ViewState.FEED}
          onClick={() => setView(ViewState.FEED)}
        />
        <NavItem
          icon={CompassIcon}
          label="Explore"
          active={view === ViewState.EXPLORE}
          onClick={() => setView(ViewState.EXPLORE)}
        />

        <div className="relative -top-6">
          <button
            onClick={() => setView(ViewState.CREATE_POST)}
            className="w-14 h-14 bg-slate-900 rounded-full shadow-lg shadow-slate-900/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>

        <NavItem
          icon={CalendarIcon}
          label="Plan"
          active={view === ViewState.SCHEDULE}
          onClick={() => setView(ViewState.SCHEDULE)}
        />
        <NavItem
          icon={UserIcon}
          label="Profile"
          active={view === ViewState.PROFILE}
          onClick={() => setView(ViewState.PROFILE)}
        />
      </div>
    );
  };

  // -----------------------------
  // MAIN RENDER
  // -----------------------------
  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {view === ViewState.LOGIN && <LoginView />}
      {view === ViewState.REGISTER && <RegisterView />}
      {view === ViewState.FEED && <FeedView />}
      {view === ViewState.EXPLORE && <ExploreView />}
      {view === ViewState.PROFILE && <ProfileView />}
      {view === ViewState.SCHEDULE && <ScheduleView />}
      {view === ViewState.CREATE_HOBBY && <CreateHobbyModal />}
      {view === ViewState.CREATE_POST && <CreatePostModal />}

      <Navigation />
    </>
  );
}
