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

import { ViewState, HobbyCategory, User, Hobby, Post } from "./types";

import { MOCK_HOBBIES, MOCK_POSTS, MOCK_USERS } from "./constants";

import {
  supabase,
  isKeyValid,
  isKeyFormatCorrect,
  mapSupabaseUserToAppUser,
} from "./supabaseClient";

/* ===========================
    TOAST
=========================== */
const Toast = ({
  message,
  type = "success",
}: {
  message: string;
  type?: "success" | "error";
}) => (
  <div
    className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex gap-2 items-center ${
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

/* ===========================
    BUTTON
=========================== */
const Button = ({
  children,
  onClick,
  isLoading,
  variant = "primary",
  type = "button",
}: any) => {
  const styles: any = {
    primary:
      "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20",
    secondary:
      "bg-white border border-slate-200 hover:bg-slate-50 text-slate-900",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`w-full px-4 py-3 rounded-2xl flex items-center justify-center gap-2 ${
        styles[variant]
      }`}
    >
      {isLoading && <LoaderIcon className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
};

/* ===========================
        MAIN APP
=========================== */
export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  /* ===========================
        INIT
  =========================== */
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      if (!isKeyValid() || !isKeyFormatCorrect()) {
        setDbError("Invalid API key. Using Mock Mode.");
        setHobbies(MOCK_HOBBIES);
        setPosts(MOCK_POSTS);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        setIsDbConnected(true);
        await fetchPublicData();

        if (data?.session?.user) {
          await fetchUserData(data.session.user);
          setView(ViewState.FEED);
        }
      } catch (e) {
        console.error(e);
        setDbError("Database not reachable. Using Mock Mode.");
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
      if (session?.user) await fetchUserData(session.user);
      if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setView(ViewState.LOGIN);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ===========================
        DATA HELPERS
  =========================== */
  const fetchPublicData = async () => {
    try {
      const { data: hobbiesData } = await supabase.from("hobbies").select("*");
      if (hobbiesData) setHobbies(hobbiesData as Hobby[]);

      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsData) setPosts(postsData as Post[]);
    } catch {
      setHobbies(MOCK_HOBBIES);
      setPosts(MOCK_POSTS);
    }
  };

  const fetchUserData = async (sbUser: any) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sbUser.id)
        .single();

      setCurrentUser(mapSupabaseUserToAppUser(sbUser, profile));
    } catch (e) {
      console.error("Profile fetch fail", e);
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ===========================
        AUTH
  =========================== */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isDbConnected && dbError) {
      setTimeout(() => {
        setCurrentUser(MOCK_USERS["u1"]);
        setView(ViewState.FEED);
        showToast("Logged in (mock)");
        setIsLoading(false);
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
    } catch (e: any) {
      showToast(e.message, "error");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      if (error) throw error;

      showToast("Check your email to confirm");
      setView(ViewState.LOGIN);
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView(ViewState.LOGIN);
  };

  /* ===========================
        VIEWS
  =========================== */

  const LoginView = () => (
    <div className="min-h-screen px-8 flex flex-col justify-center bg-slate-50">
      <div className="text-center mb-8">
        <FlameIcon className="mx-auto w-10 h-10 text-slate-900" />
        <h1 className="text-3xl font-bold mt-2">Hobbystreak</h1>
      </div>

      {dbError && (
        <div className="mb-4 rounded-xl bg-orange-50 border border-orange-300 p-4 text-sm text-orange-700">
          {dbError}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full p-4 border rounded-xl"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          className="w-full p-4 border rounded-xl"
        />

        <Button type="submit" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="text-center mt-6 text-sm">
        New here?{" "}
        <button
          onClick={() => setView(ViewState.REGISTER)}
          className="font-bold underline"
        >
          Register
        </button>
      </p>
    </div>
  );

  const RegisterView = () => (
    <div className="min-h-screen px-8 flex flex-col justify-center bg-slate-50">
      <button
        onClick={() => setView(ViewState.LOGIN)}
        className="absolute top-6 left-6"
      >
        <ArrowLeftIcon className="w-6 h-6" />
      </button>

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full p-4 border rounded-xl"
        />

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full p-4 border rounded-xl"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          className="w-full p-4 border rounded-xl"
        />

        <Button type="submit" isLoading={isLoading}>
          Create Account
        </Button>
      </form>
    </div>
  );

  /* ===========================
        MAIN
  =========================== */

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {view === ViewState.LOGIN && <LoginView />}
      {view === ViewState.REGISTER && <RegisterView />}
      {view === ViewState.FEED && (
        <div className="p-8">🎉 Logged in successfully! UI restored.</div>
      )}
    </>
  );
}
