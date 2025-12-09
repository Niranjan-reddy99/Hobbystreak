import React, { useEffect, useRef, useState } from "react";
import { FlameIcon, ArrowLeftIcon, CheckIcon, XIcon } from "./components/Icons";
import { ViewState } from "./types";
import { MOCK_USERS } from "./constants";
import {
  supabase,
  isKeyFormatCorrect,
  isKeyValid,
} from "./supabaseClient";

/* ===========================
   SIMPLE TOAST
=========================== */
const Toast = ({
  msg,
  type,
}: {
  msg: string;
  type: "success" | "error";
}) => (
  <div
    className={`fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm ${
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
    {msg}
  </div>
);

/* ===========================
      APP
=========================== */
export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  const mountedOnce = useRef(false);

  /* ✅ INIT RUNS ONLY ONCE */
  useEffect(() => {
    if (mountedOnce.current) return;
    mountedOnce.current = true;

    if (!isKeyValid() || !isKeyFormatCorrect()) {
      console.warn("MOCK MODE ENABLED");
      setMockMode(true);
    }
  }, []);

  /* ===========================
        TOAST
  =========================== */
  const showToast = (
    msg: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  /* ===========================
        LOGIN
  =========================== */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mockMode) {
      setTimeout(() => {
        setIsLoading(false);
        showToast("Logged in (mock mode)");
      }, 700);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      showToast("Login successful!");
    } catch (e: any) {
      showToast(e.message || "Login failed", "error");
    }

    setIsLoading(false);
  };

  /* ===========================
        REGISTER
  =========================== */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password || !name) {
      showToast("All fields required", "error");
      setIsLoading(false);
      return;
    }

    if (mockMode) {
      setTimeout(() => {
        MOCK_USERS["u_test"] = {
          id: "u_test",
          name,
          email,
          joinedHobbies: [],
          stats: { streak: 0, totalPoints: 0 },
          hobbyStreaks: {},
          bio: "",
          avatar: "",
        };

        setIsLoading(false);
        showToast("Account created (mock)");
        setView(ViewState.LOGIN);
      }, 800);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (error) throw error;

      showToast("Check your email for verification");
      setView(ViewState.LOGIN);
    } catch (e: any) {
      showToast(e.message || "Signup failed", "error");
    }

    setIsLoading(false);
  };

  /* ===========================
        LOGIN VIEW
  =========================== */
  const Login = () => (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-slate-50">
      <div className="text-center mb-8">
        <FlameIcon className="mx-auto w-10 h-10 text-slate-900" />
        <h1 className="text-3xl font-bold mt-2">Hobbystreak</h1>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-4 border rounded-xl"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-4 border rounded-xl"
        />

        <button
          disabled={isLoading}
          className="w-full p-4 bg-slate-900 rounded-xl text-white"
        >
          {isLoading ? "Loading..." : "LOGIN"}
        </button>
      </form>

      <p className="text-center mt-5 text-sm">
        New here?{" "}
        <button
          onClick={() => setView(ViewState.REGISTER)}
          className="font-bold underline"
        >
          Create Account
        </button>
      </p>
    </div>
  );

  /* ===========================
        REGISTER VIEW
  =========================== */
  const Register = () => (
    <div className="min-h-screen flex flex-col justify-center px-8 bg-slate-50">
      <button
        className="absolute top-6 left-6"
        onClick={() => setView(ViewState.LOGIN)}
      >
        <ArrowLeftIcon className="w-6 h-6" />
      </button>

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full p-4 border rounded-xl"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="w-full p-4 border rounded-xl"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="w-full p-4 border rounded-xl"
        />

        <button
          disabled={isLoading}
          className="w-full p-4 bg-slate-900 text-white rounded-xl"
        >
          {isLoading ? "Creating..." : "CREATE ACCOUNT"}
        </button>
      </form>
    </div>
  );

  /* ===========================
        RENDER
  =========================== */
  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {view === ViewState.LOGIN && <Login />}
      {view === ViewState.REGISTER && <Register />}
    </>
  );
}
