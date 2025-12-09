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
  LoaderIcon,
  CalendarIcon,
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

/* ----------------------------------------
   TOAST
---------------------------------------- */
const Toast = ({
  message,
  type = "success",
}: {
  message: string;
  type?: "success" | "error";
}) => (
  <div
    className={`fixed top-4 left-1/2 translate-x-[-50%] px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2
      ${type === "success" ? "bg-slate-900 text-white" : "bg-red-500 text-white"}
    `}
  >
    {type === "success" ? (
      <CheckIcon className="w-4 h-4" />
    ) : (
      <XIcon className="w-4 h-4" />
    )}
    <span>{message}</span>
  </div>
);

/* ----------------------------------------
   BUTTON
---------------------------------------- */
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
  const base =
    "px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95";

  const variants: any = {
    primary: "bg-slate-900 text-white",
    secondary: "border bg-white",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <LoaderIcon className="animate-spin w-5 h-5" />
      ) : (
        Icon && <Icon className="w-5 h-5" />
      )}
      {children}
    </button>
  );
};

/* ========================================
           APP
======================================== */
export default function App() {
  const [view, setView] = useState(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [toast, setToast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  /* ----------------------------------------
     INIT
  ---------------------------------------- */
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      if (!isKeyValid() || !isKeyFormatCorrect()) {
        setDbError("Using Mock Mode");
        setHobbies(MOCK_HOBBIES);
        setPosts(MOCK_POSTS);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();

        if (data?.session?.user) {
          setIsDbConnected(true);
          await loadUser(data.session.user);
          setView(ViewState.FEED);
        } else {
          setIsDbConnected(true);
        }

        await loadPublicData();
      } catch {
        setDbError("Database unavailable. Mock Mode enabled.");
        setHobbies(MOCK_HOBBIES);
        setPosts(MOCK_POSTS);
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const showToast = (m: string, t: "success" | "error" = "success") => {
    setToast({ message: m, type: t });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPublicData = async () => {
    const { data } = await supabase.from("hobbies").select("*");
    if (data) setHobbies(data as Hobby[]);

    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (postsData) setPosts(postsData as Post[]);
  };

  const loadUser = async (sbUser: any) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sbUser.id)
      .single();

    const user = mapSupabaseUserToAppUser(sbUser, data);
    setCurrentUser(user);
  };

  /* ----------------------------------------
       AUTH
  ---------------------------------------- */
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isDbConnected) {
      setCurrentUser(MOCK_USERS.u1);
      setView(ViewState.FEED);
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
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (error) throw error;

      showToast("Account created!");
      setView(ViewState.LOGIN); // ✅ BLANK PAGE FIX

    } catch (err: any) {
      showToast(err.message, "error");
    }

    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView(ViewState.LOGIN);
  };

  /* ----------------------------------------
       VIEWS
  ---------------------------------------- */
  const LoginView = () => (
    <div className="p-8">
      <h1 className="text-3xl mb-6">Login</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          placeholder="Email"
          className="border p-3 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          className="border p-3 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          className="w-full"
          type="submit"
          isLoading={isLoading}
        >
          Login
        </Button>
      </form>

      <p className="mt-4">
        New user?{" "}
        <button
          onClick={() => setView(ViewState.REGISTER)}
          className="underline"
        >
          Create account
        </button>
      </p>
    </div>
  );

  const RegisterView = () => (
    <div className="p-8">
      <button
        className="mb-6"
        onClick={() => setView(ViewState.LOGIN)}
      >
        ← Back
      </button>

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          placeholder="Name"
          className="border p-3 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email"
          className="border p-3 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          className="border p-3 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          className="w-full"
          type="submit"
          isLoading={isLoading}
        >
          Create Account
        </Button>
      </form>
    </div>
  );

  const FeedView = () => (
    <div className="p-8">
      <h1 className="mb-4">Welcome {currentUser?.name}</h1>

      {posts.map((post) => (
        <div key={post.id} className="border p-3 mb-3">
          {post.content}
        </div>
      ))}

      <button
        className="mt-10 underline"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );

  /* ----------------------------------------
        RENDER
  ---------------------------------------- */
  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {view === ViewState.LOGIN && <LoginView />}
      {view === ViewState.REGISTER && <RegisterView />}
      {view === ViewState.FEED && <FeedView />}
    </>
  );
}
