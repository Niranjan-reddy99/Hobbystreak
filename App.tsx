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
  CalendarIcon,
  LoaderIcon,
  SettingsIcon,
  BellIcon,
  MoreHorizontalIcon,
  FlagIcon,
} from "./components/Icons";

import { ViewState, HobbyCategory, User, Hobby, Post } from "./types";
import { supabase, isKeyValid, isKeyFormatCorrect, mapSupabaseUserToAppUser }
from "./supabaseClient";


/* ------------ Toast ------------ */
const Toast = ({ message, type = "success" }: { message: string; type?: "success" | "error" }) => (
  <div
    className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex gap-2 text-sm ${
      type === "success" ? "bg-slate-900 text-white" : "bg-red-500 text-white"
    }`}
  >
    {type === "success" ? <CheckIcon /> : <XIcon />}
    {message}
  </div>
);

/* ------------ App ------------ */

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedHobby, setSelectedHobby] = useState<Hobby | null>(null);
  const [postText, setPostText] = useState("");


  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  /* ==============================
      INIT SESSION
  =============================== */
  useEffect(() => {
    if (!isKeyValid() || !isKeyFormatCorrect()) {
      alert("SUPABASE ENV KEYS INVALID");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        fetchUserData(data.session.user);
        setView(ViewState.FEED);
      }
    });

    const { data } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        await fetchUserData(session.user);
        setView(ViewState.FEED);
      } else {
        setCurrentUser(null);
        setView(ViewState.LOGIN);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  /* ==============================
      PUBLIC FETCH
  =============================== */
  const fetchPublicData = async () => {
    const { data: hobbiesData } = await supabase
      .from("hobbies")
      .select("*")
      .order("created_at", { ascending: false });

    if (hobbiesData) {
      setHobbies(
        hobbiesData.map((h: any) => ({
          id: h.id,
          name: h.name,
          description: h.description,
          category: h.category,
          memberCount: h.member_count ?? 0,
          image: h.image_url || "",
          icon: h.icon || "✨",
        }))
      );
    }

    const { data: postsData } = await supabase
      .from("posts")
      .select(`*, profiles:user_id(full_name, avatar_url)`)
      .order("created_at", { ascending: false });

    if (postsData) {
      setPosts(
        postsData.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          hobbyId: p.hobby_id,
          content: p.content,
          imageUrl: null,
          likes: p.likes_count || 0,
          comments: [],
          timestamp: p.created_at,
          authorName: p.profiles?.full_name || "User",
          authorAvatar: p.profiles?.avatar_url || "",
        }))
      );
    }
  };

  /* ==============================
      USER DATA
  =============================== */

  const fetchUserData = async (supabaseUser: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();

    const user = mapSupabaseUserToAppUser(supabaseUser, profile);

    const { data: joins } = await supabase
      .from("user_hobbies")
      .select("hobby_id, streak")
      .eq("user_id", user.id);

    if (joins) {
      user.joinedHobbies = joins.map((j) => j.hobby_id);
      joins.forEach((j) => (user.hobbyStreaks[j.hobby_id] = j.streak));
    }

    setCurrentUser(user);
    await fetchPublicData();
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  /* ==============================
      AUTH
  =============================== */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  /* ==============================
      COMMUNITY JOIN
  =============================== */
  const handleJoin = async (hobbyId: string) => {
    if (!currentUser) return;

    if (currentUser.joinedHobbies.includes(hobbyId)) return showToast("Already Joined");

    const { error } = await supabase.from("user_hobbies").insert({
      user_id: currentUser.id,
      hobby_id: hobbyId,
    });

    if (error) return showToast("Join failed", "error");

    setCurrentUser({
      ...currentUser,
      joinedHobbies: [...currentUser.joinedHobbies, hobbyId],
    });

    setHobbies((prev) =>
      prev.map((h) => (h.id === hobbyId ? { ...h, memberCount: h.memberCount + 1 } : h))
    );

    showToast("Joined Community!");
  };

  /* ==============================
      POSTS
  =============================== */
  const handlePostCreate = async (content: string) => {
    if (!currentUser || !content.trim() || !selectedHobby) return;

    setLoading(true);

    await supabase.from("posts").insert({
      user_id: currentUser.id,
      hobby_id: selectedHobby.id,
      content,
    });

    await fetchPublicData();
    showToast("Post created!");
    setLoading(false);
  };

  /* ==============================
      UI VIEWS
  =============================== */

  if (view === ViewState.LOGIN) {
    return (
      <div className="min-h-screen flex flex-col justify-center px-8">
        <h1 className="text-2xl mb-4 font-bold">Hobbystreak Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input"
          />
          <button className="btn" disabled={loading}>
            Login
          </button>
        </form>
      </div>
    );
  }

  if (view === ViewState.EXPLORE) {
    return (
      <div className="p-6 pb-32">
        <h2 className="font-bold text-xl mb-6">Communities</h2>

        {hobbies.map((h) => (
          <div
            key={h.id}
            className="border p-4 rounded-xl mb-4 cursor-pointer"
            onClick={() => {
              setSelectedHobby(h);
              setView(ViewState.COMMUNITY_DETAILS);
            }}
          >
            <h3 className="font-bold">
              {h.icon} {h.name}
            </h3>
            <p>{h.description}</p>
            <small>{h.memberCount} members</small>

            <button
              className="btn mt-2"
              onClick={(e) => {
                e.stopPropagation();
                handleJoin(h.id);
              }}
            >
              Join
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (view === ViewState.COMMUNITY_DETAILS && selectedHobby) {
    const communityPosts = posts.filter((p) => p.hobbyId === selectedHobby.id);
    const [postText, setPostText] = useState("");

    return (
      <div className="p-6 pb-32">
        <h2 className="text-xl font-bold mb-4">
          {selectedHobby.icon} {selectedHobby.name}
        </h2>
        <textarea
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          placeholder="Write a post..."
          className="input h-24 mb-4"
        />

        <button
          className="btn"
          onClick={() => {
            handlePostCreate(postText);
            setPostText("");
          }}
          disabled={loading}
        >
          Post
        </button>

        <div className="mt-6 space-y-3">
          {communityPosts.map((p) => (
            <div key={p.id} className="border p-3 rounded-xl">
              <p className="font-bold">{p.authorName}</p>
              <p>{p.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-6 bg-white px-6 py-3 shadow-xl rounded-full">
        <button onClick={() => setView(ViewState.FEED)}>
          <HomeIcon />
        </button>
        <button onClick={() => setView(ViewState.EXPLORE)}>
          <CompassIcon />
        </button>
        <button onClick={() => setView(ViewState.PROFILE)}>
          <UserIcon />
        </button>
      </div>
    </>
  );
}
