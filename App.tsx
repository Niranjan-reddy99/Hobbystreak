import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Icons wrapper (safe)
import Icons from "./components/Icons";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Check existing login session
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Login with OTP
  async function login() {
    if (!email) {
      alert("Enter your email first");
      return;
    }

    setLoading(true);

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href,
      },
    });

    alert("✅ Login link sent to your email.");
    setLoading(false);
  }

  // Logout handler
  async function logout() {
    await supabase.auth.signOut();
  }

  //---------------- VIEW ----------------//

  // Logged-in screen
  if (user) {
    return (
      <div style={container}>
        <h1 style={title}>🚀 Hobbystreak</h1>

        <p style={text}>
          ✅ Logged in as:
          <br />
          <b>{user.email}</b>
        </p>

        <div style={{ marginTop: 20 }}>
          <button style={button} onClick={logout}>
            Logout
          </button>
        </div>

        <div style={card}>
          <h2 style={section}>🎯 Your Dashboard</h2>
          <p style={text}>
            This is where your hobbies, goals, streak tracking—and future UI
            will live.
          </p>
        </div>
      </div>
    );
  }

  // Logged-out screen
  return (
    <div style={container}>
      <h1 style={title}>🚀 Hobbystreak</h1>
      <p style={text}>Login via Email OTP</p>

      <input
        style={input}
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button style={button} onClick={login} disabled={loading}>
        {loading ? "Sending Link..." : "Login"}
      </button>
    </div>
  );
}

//---------------- STYLES ----------------//

const container: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
};

const title: React.CSSProperties = {
  fontSize: 36,
  marginBottom: 10,
};

const section: React.CSSProperties = {
  marginBottom: 8,
};

const text: React.CSSProperties = {
  color: "#444",
  textAlign: "center",
};

const card: React.CSSProperties = {
  marginTop: 24,
  padding: 20,
  background: "white",
  borderRadius: 12,
  boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
  width: 300,
};

const input: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  width: 250,
};

const button: React.CSSProperties = {
  padding: "10px 16px",
  background: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

