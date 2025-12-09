import React, { useEffect, useState } from "react";
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
  ImageIcon,
  LogOutIcon,
  GoogleIcon,
  AppleIcon,
  CalendarIcon,
  LoaderIcon,
  SettingsIcon,
  BellIcon,
  MoreHorizontalIcon,
  FlameIcon,
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

/* ------------------ Toast ------------------ */
const Toast = ({ message, type = "success" }: any) => (
  <div
    className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 ${
      type === "success"
        ? "bg-slate-900 text-white"
        : "bg-red-500 text-white"
    }`}
  >
    {type === "success" ? (
      <CheckIcon className="w-4 h-4" />
    ) : (
      <span>❌</span>
    )}
    <span className="text-sm">{message}</span>
  </div>
);

/* ------------------ Button ------------------ */
const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  isLoading,
}: any) => {
  const base =
    "px-4 py-3 rounded-2xl font-medium transition-all flex justify-center items-center gap-2";

  const styles: any = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 shadow",
    secondary:
      "bg-white border border-slate-200 hover:bg-slate-50",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${base} ${styles[variant]} ${
        disabled && "opacity-50"
      }`}
    >
      {isLoading && (
        <LoaderIcon className="w-4 h-4 animate-spin" />
      )}
      {children}
    </button>
  );
};

/* ========================================================== */

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [toast, setToast] = useState<any>(null);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ------------------ Init ------------------ */
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      if (!isKeyValid() || !isKeyFormatCorrect()) {
        setDbError("Supabase key invalid — running in MOCK MODE");
        setHobbies(MOCK_HOBBIES);
        setPosts(MOCK_POSTS);
        setLoading(false);
        return;
      }

      try {
        const { data } =
          await supabase.auth.getSession();

        if (data?.session?.user) {
          await fetchUserData(data.session.user);
          setIsDbConnected(true);
          setView(ViewState.FEED);
        } else {
          setIsDbConnected(true);
          await fetchPublicData();
        }
      } catch (err: any) {
        console.error(err);
        setDbError("Failed DB connection");
        setHobbies(MOCK_HOBBIES);
        setPosts(MOCK_POSTS);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session?.user)
          await fetchUserData(session.user);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /* ------------------ Helpers ------------------ */
  const showToast = (
    msg: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPublicData = async () => {
    try {
      const { data: h } =
        await supabase.from("hobbies").select("*");
      if (h) setHobbies(h);

      const { data: p } =
        await supabase.from("posts").select("*");

      if (p) setPosts(p);
    } catch {
      console.warn("Public fetch failed");
    }
  };

  const fetchUserData = async (sbUser: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sbUser.id)
      .single();

    const appUser =
      mapSupabaseUserToAppUser(sbUser, profile);

    setCurrentUser(appUser);
  };

  /* ------------------ Auth ------------------ */

  const login = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    if (!isDbConnected) {
      const mock = MOCK_USERS["u1"];
      setCurrentUser(mock);
      setView(ViewState.FEED);
      showToast(`Welcome ${mock.name}`);
      setLoading(false);
      return;
    }

    try {
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

      showToast("Logged in successfully");
    } catch (err: any) {
      showToast(err.message, "error");
      setLoading(false);
    }
  };

  const register = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      showToast(
        "Registered successfully — check mail"
      );
      setView(ViewState.LOGIN);
    } catch (err: any) {
      showToast(err.message, "error");
    }

    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView(ViewState.LOGIN);
  };

  /* ------------------ Views ------------------ */

  const LoginView = () => (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-slate-50">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto bg-slate-900 rounded-3xl mb-4 flex items-center justify-center">
          <FlameIcon className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold">
          Hobbystreak
        </h1>
      </div>

      <form onSubmit={login} className="space-y-4">
        <input
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          type="email"
          placeholder="Email"
          className="w-full p-4 border rounded-2xl"
        />

        <input
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          type="password"
          placeholder="Password"
          className="w-full p-4 border rounded-2xl"
        />

        <Button
          type="submit"
          isLoading={loading}
          className="w-full"
        >
          Login
        </Button>
      </form>

      <p className="text-center mt-6">
        New user?{" "}
        <button
          onClick={() =>
            setView(ViewState.REGISTER)
          }
          className="underline"
        >
          Create Account
        </button>
      </p>
    </div>
  );

  const RegisterView = () => (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-slate-50">
      <button
        className="absolute top-6 left-6"
        onClick={() =>
          setView(ViewState.LOGIN)
        }
      >
        <ArrowLeftIcon />
      </button>

      <form
        onSubmit={register}
        className="space-y-4"
      >
        <input
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          type="text"
          placeholder="Full name"
          className="w-full p-4 border rounded-2xl"
        />

        <input
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          type="email"
          placeholder="Email"
          className="w-full p-4 border rounded-2xl"
        />

        <input
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          type="password"
          placeholder="Password"
          className="w-full p-4 border rounded-2xl"
        />

        <Button
          type="submit"
          isLoading={loading}
          className="w-full"
        >
          Create Account
        </Button>
      </form>
    </div>
  );

  const FeedView = () => (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="flex justify-between mb-6">
        <h1 className="font-bold text-xl">
          Welcome {currentUser?.name}
        </h1>

        <button onClick={logout}>
          <LogOutIcon />
        </button>
      </div>

      {posts.map((p) => (
        <div
          key={p.id}
          className="p-4 bg-white mb-4 rounded-2xl border"
        >
          {p.content}
        </div>
      ))}
    </div>
  );

  /* ------------------ Render ------------------ */

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
        />
      )}

      {view === ViewState.LOGIN && <LoginView />}
      {view === ViewState.REGISTER && (
        <RegisterView />
      )}
      {view === ViewState.FEED && <FeedView />}
    </>
  );
}
