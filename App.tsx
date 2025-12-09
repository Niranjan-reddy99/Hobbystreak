import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(res => {
      setUser(res.data.user || null);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    );

    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn() {
    await supabase.auth.signInWithOtp({
      email: prompt("Enter your email") || ""
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl mb-4">🚀 Hobbystreak Login Test</h1>

      {user ? (
        <>
          <p>✅ Logged in as: {user.email}</p>
          <button
            onClick={signOut}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={signIn}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Login via Email OTP
        </button>
      )}
    </div>
  );
}
