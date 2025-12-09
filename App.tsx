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


// ---------------- TOAST ----------------
const Toast = ({ message, type = "success" }: any) => (
  <div
    className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-50 shadow-lg ${
      type === "error" ? "bg-red-500" : "bg-slate-900"
    } text-white`}
  >
    {message}
  </div>
);

// ---------------- BUTTON ----------------
const Button = ({ children, onClick, isLoading, type = "button", variant = "primary" }: any) => {
  const style =
    variant === "secondary"
      ? "bg-white text-black border"
      : "bg-slate-900 text-white";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`w-full py-3 rounded-xl flex justify-center items-center gap-2 
        ${style}`}
    >
      {isLoading && <LoaderIcon className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
};

// ====================================================
// ======================= APP ========================
// ====================================================

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [toast, setToast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbConnected, setIsDbConnected] = useState(false);

  const showToast = (msg: string, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ======================= INITIAL LOAD =======================
  useEffect(() => {
    const init = async () => {
      if (!isKeyValid() || !isKeyFormatCorrect()) {
        setDbError("Invalid Supabase keys → running mock mode.");
        setHobbies(MOCK_HOBBIES);
        setPosts(MOCK_POSTS);
        return;
      }

      try {
        const session = await supabase.auth.getSession();

        if (session.data.session?.user) {
          setIsDbConnected(true);
          await fetchUserData(session.data.session.user);
          setView(ViewState.FEED);
        } else {
          setIsDbConnected(true);
        }

        await loadCommunities();
        await loadPosts();
      } catch (err: any) {
        console.warn(err);
        setHobbies(MOCK_HOBBIES);
        setPosts(MOCK_POSTS);
      }
    };

    init();

    supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        await fetchUserData(session.user);
        setView(ViewState.FEED);
      } else {
        setCurrentUser(null);
        setView(ViewState.LOGIN);
      }
    });
  }, []);

  // ======================= DATA =======================
  const fetchUserData = async (sbUser: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sbUser.id)
      .single();

    const user = mapSupabaseUserToAppUser(sbUser, profile);

    const { data: memberships } = await supabase
      .from("user_hobbies")
      .select("hobby_id")
      .eq("user_id", sbUser.id);

    user.joinedHobbies = memberships?.map((m) => m.hobby_id) || [];

    setCurrentUser(user);
  };

  const loadCommunities = async () => {
    try {
      const { data } = await supabase.from("hobbies").select("*");

      setHobbies(
        data?.map((h: any) => ({
          id: h.id,
          name: h.name,
          description: h.description,
          category: h.category,
          icon: h.icon || "✨",
          memberCount: h.member_count || 0,
          image: h.image_url,
        })) || []
      );
    } catch {}
  };

  const loadPosts = async () => {
    try {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      setPosts(
        data?.map((p: any) => ({
          id: p.id,
          hobbyId: p.hobby_id,
          userId: p.user_id,
          content: p.content,
          imageUrl: p.image_url,
          likes: p.likes_count || 0,
          comments: [],
          timestamp: p.created_at,
        })) || []
      );
    } catch {}
  };

  // ======================= AUTH =======================
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isDbConnected && dbError) {
      const mock = MOCK_USERS["u1"];
      setCurrentUser(mock);
      setView(ViewState.FEED);
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsLoading(false);

    if (error) showToast(error.message, "error");
    else showToast("Logged in successfully");
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name || email.split("@")[0] },
        },
      });

      if (error) throw error;

      showToast("Account created — check your email");
      setView(ViewState.LOGIN);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView(ViewState.LOGIN);
  };

  // ======================= COMMUNITY =======================
  const joinCommunity = async (id: string) => {
    if (!currentUser) return;

    if (!isDbConnected) {
      currentUser.joinedHobbies.push(id);
      setCurrentUser({ ...currentUser });
      return;
    }

    await supabase.from("user_hobbies").insert({
      hobby_id: id,
      user_id: currentUser.id,
    });

    await fetchUserData({ id: currentUser.id });
  };

  // ======================= VIEWS =======================
  const LoginView = () => (
    <form onSubmit={handleLogin} className="p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Hobbystreak</h1>

      <input
        className="w-full p-3 border rounded-xl"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <input
        className="w-full p-3 border rounded-xl"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <Button type="submit" isLoading={isLoading}>
        Sign In
      </Button>

      <p className="text-center">
        New here?{" "}
        <span
          className="cursor-pointer text-blue-500"
          onClick={() => setView(ViewState.REGISTER)}
        >
          Create account
        </span>
      </p>
    </form>
  );

  const RegisterView = () => (
    <form onSubmit={handleRegister} className="p-8 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold">Create Account</h2>

      <input
        className="w-full p-3 border rounded-xl"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
      />

      <input
        className="w-full p-3 border rounded-xl"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <input
        className="w-full p-3 border rounded-xl"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <Button type="submit" isLoading={isLoading}>
        Create Account
      </Button>

      <button type="button" onClick={() => setView(ViewState.LOGIN)}>
        Back to Login
      </button>
    </form>
  );

  const ExploreView = () => (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Communities</h1>

      {hobbies.map((h) => (
        <div
          key={h.id}
          className="p-4 border rounded-xl flex justify-between"
        >
          <div>
            <b>
              {h.icon} {h.name}
            </b>
            <p className="text-sm">{h.description}</p>
          </div>

          <Button variant="secondary" onClick={() => joinCommunity(h.id)}>
            {currentUser?.joinedHobbies.includes(h.id) ? "Joined" : "Join"}
          </Button>
        </div>
      ))}
    </div>
  );

  // ======================= MAIN =======================
  return (
    <>
      {toast && <Toast {...toast} />}

      {view === ViewState.LOGIN && <LoginView />}
      {view === ViewState.REGISTER && <RegisterView />}
      {view === ViewState.EXPLORE && <ExploreView />}

      {view !== ViewState.LOGIN && view !== ViewState.REGISTER && (
        <div className="fixed bottom-4 w-full flex justify-center gap-6">
          <HomeIcon onClick={() => setView(ViewState.FEED)} />
          <CompassIcon onClick={() => setView(ViewState.EXPLORE)} />
          <UserIcon onClick={() => setView(ViewState.PROFILE)} />
          <LogOutIcon onClick={handleLogout} />
        </div>
      )}
    </>
  );
}
