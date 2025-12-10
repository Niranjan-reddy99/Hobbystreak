import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [view, setView] = useState<"login" | "register" | "feed">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Check auth session at startup
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        setView("feed");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setView("feed");
      } else {
        setUser(null);
        setView("login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setMessage(error.message);
    setLoading(false);
  };

  // ✅ REGISTER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("✅ Registered! Now log in.");
      setView("login");
    }

    setLoading(false);
  };

  // ✅ LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ---------------- UI ----------------

  if (view === "feed") {
    return (
      <div style={styles.page}>
        <h1>✅ Logged in</h1>
        <p>{user?.email}</p>

        <button style={styles.button} onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  if (view === "register") {
    return (
      <div style={styles.page}>
        <h2>Create Account</h2>

        <form style={styles.form} onSubmit={handleRegister}>
          <input
            style={styles.input}
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.button} type="submit">
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}

        <button style={styles.link} onClick={() => setView("login")}>
          ← Back to Login
        </button>
      </div>
    );
  }

  // ✅ LOGIN VIEW
  return (
    <div style={styles.page}>
      <h2>Log In</h2>

      <form style={styles.form} onSubmit={handleLogin}>
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.button} type="submit">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {message && <p style={styles.message}>{message}</p>}

      <button style={styles.link} onClick={() => setView("register")}>
        Create new account
      </button>
    </div>
  );
}

// ---------------- STYLES ----------------

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    fontFamily: "Arial, sans-serif",
  },
  form: {
    width: "100%",
    maxWidth: "320px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  input: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    background: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
  },
  link: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
  },
  message: {
    color: "#dc2626",
  },
};
