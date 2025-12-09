import React, { useState, useEffect, useRef } from "react";
import {
  FlameIcon,
} from "./components/Icons";

import { ViewState } from "./types";

import { supabase } from "./supabaseClient";

/* =================================================
   APP — FINAL STABLE BUILD
================================================= */

export default function App() {
  const hasInit = useRef(false);

  const [view, setView] = useState<ViewState>(ViewState.LOGIN);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // ✅ RUN ONCE ONLY
  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setView(ViewState.FEED);
      }
    });
  }, []);

  /* ================= AUTH =================== */

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setView(ViewState.FEED);
    } catch (err: any) {
      alert(err.message);
    } finally {
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
        options:{
          data:{ full_name:name }
        }
      });

      if (error) throw error;
      alert("Account created — Check your email");
      setView(ViewState.LOGIN);
    } catch (err:any){
      alert(err.message);
    }

    setIsLoading(false);
  };

  /* ================= UI =================== */

  {view === ViewState.FEED && <FeedView />}
{view === ViewState.EXPLORE && <ExploreView />}
{view === ViewState.PROFILE && <ProfileView />}
{view === ViewState.SCHEDULE && <ScheduleView />}


  /* ============= LOGIN VIEW ================= */

  if(view === ViewState.LOGIN){
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-8">

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-3xl mb-4">
            <FlameIcon className="w-8 h-8 text-white" filled />
          </div>
          <h1 className="text-3xl font-bold">Hobbystreak</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-4 rounded-xl border"
          />

          <input
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-4 rounded-xl border"
          />

          <button
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl"
          >
            {isLoading ? "Loading..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-6">
          New here?{" "}
          <button
            onClick={()=>setView(ViewState.REGISTER)}
            className="font-bold"
          >
            Create account
          </button>
        </p>

      </div>
    );
  }

  /* ============ REGISTER VIEW ================ */

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-8">

      <h1 className="text-3xl font-bold mb-6">
        Create Account
      </h1>

      <form onSubmit={handleRegister} className="space-y-4">

        <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
          placeholder="Name"
          className="w-full p-4 rounded-xl border"
        />

        <input
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-4 rounded-xl border"
        />

        <input
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-4 rounded-xl border"
        />

        <button
          disabled={isLoading}
          className="w-full bg-slate-900 text-white py-3 rounded-xl"
        >
          {isLoading ? "Creating..." : "Create Account"}
        </button>

      </form>

    </div>
  );
}
