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
  XIcon,
  ImageIcon,
  LogOutIcon,
  GoogleIcon,
  AppleIcon,
  FlameIcon,
  CalendarIcon,
  LoaderIcon,
  SettingsIcon,
  BellIcon,
  MoreHorizontalIcon,
} from "./components/Icons";

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
} from "./supabaseClient";

/* ============================================================
   UI HELPERS
============================================================ */

const Toast = ({
  message,
  type = "success",
}: {
  message: string;
  type?: "success" | "error";
}) => (
  <div
    className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 ${
      type === "success" ? "bg-slate-900 text-white" : "bg-red-500 text-white"
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

const Button = ({
  children,
  onClick,
  variant = "primary",
  isLoading,
  type = "button",
}: any) => {
  const variants: any = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20",
    secondary:
      "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`px-4 py-3 rounded-2xl w-full flex justify-center items-center gap-2 ${variants[variant]}`}
    >
      {isLoading && <LoaderIcon className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

/* ============================================================
   APP
============================================================ */

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbConnected, setIsDbConnected] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  /* ============================================================
     INITIAL LOAD  ✅ FIXED — NO RERENDER LOOP
  ============================================================ */

  useEffect(() => {
    const init = async () => {
      // ----- MOCK MODE -----
      if (!isKeyValid() || !isKeyFormatCorrect()) {
        setDbError("Invalid API key — Running in LOCAL safe mode.");
        setHobbies(MOCK_HOBBIES);
        setPosts(MOCK_POSTS);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();

        if (data?.session?.user) {
          const user = data.session.user;
          await fetchUserData(user);
          setView(ViewState.FEED);
        }

        await fetchPublicData();
        setIsDbConnected(true);
      } catch (err) {
        console.error("INIT ERROR:", err);
        setDbError("Could not connect to Supabase");
        setHobbies(MOCK_HOBBIES);
        setPosts(MOCK_POSTS);
      }
    };

    init();
  }, []);

  const fetchPublicData = async () => {
    const { data: hobbiesData } = await supabase
      .from("hobbies")
      .select("*");

    if (hobbiesData) {
      const mapped: Hobby[] = hobbiesData.map((h: any) => ({
        id: h.id,
        name: h.name,
        description: h.description,
        category: h.category,
        memberCount: h.member_count,
        image: h.image_url,
        icon: h.icon,
      }));

      setHobbies(mapped);
    }

    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (postsData) {
      const mappedPosts: Post[] = postsData.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        hobbyId: p.hobby_id,
        content: p.content,
        likes: 0,
        comments: [],
        timestamp: p.created_at,
      }));

      setPosts(mappedPosts);
    }
  };

  const fetchUserData = async (sbUser: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sbUser.id)
      .single();

    const user = mapSupabaseUserToAppUser(sbUser, profile);
    setCurrentUser(user);
  };

  /* ============================================================
     AUTH
  ============================================================ */

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isDbConnected && dbError) {
      const mockUser = MOCK_USERS["u1"];
      setCurrentUser(mockUser);
      setView(ViewState.FEED);
      showToast(`Welcome ${mockUser.name}`);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      showToast("Logged in!");
      setView(ViewState.FEED);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split("@")[0],
          },
        },
      });

      if (error) throw error;

      showToast("Account created! Check your email.");
      setView(ViewState.LOGIN);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  /* ============================================================
     VIEWS
  ============================================================ */

  const LoginView = () => (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-slate-50">
      <h1 className="text-3xl font-bold text-center mb-6">Hobbystreak</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="w-full p-4 border rounded-xl"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="w-full p-4 border rounded-xl"
        />

        <Button type="submit" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center">
        New?{" "}
        <button
          className="font-bold"
          onClick={() => setView(ViewState.REGISTER)}
        >
          Create Account
        </button>
      </p>
    </div>
  );

  const RegisterView = () => (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-slate-50">
      <h1 className="text-3xl font-bold mb-6">Create Account</h1>

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full p-4 border rounded-xl"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="w-full p-4 border rounded-xl"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="w-full p-4 border rounded-xl"
        />

        <Button isLoading={isLoading} type="submit">
          Create Account
        </Button>
      </form>

      <p className="mt-6">
        <button onClick={() => setView(ViewState.LOGIN)}>
          ← Back to Login
        </button>
      </p>
    </div>
  );

  /* ============================================================
     MAIN RENDER
  ============================================================ */

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {view === ViewState.LOGIN && <LoginView />}
      {view === ViewState.REGISTER && <RegisterView />}
    </>
  );
}
