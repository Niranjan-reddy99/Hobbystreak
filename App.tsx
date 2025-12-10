import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type Hobby = {
  id: string;
  name: string;
  description: string;
};

export default function App() {
  const [view, setView] = useState<"login" | "register" | "communities">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [hobbies, setHobbies] = useState<Hobby[]>([]);

  // ✅ SESSION CHECK
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        setView("communities");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setView("communities");
      } else {
        setUser(null);
        setView("login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ FETCH COMMUNITIES
  useEffect(() => {
    if (!user) return;

    const loadHobbies = async () => {
      const { data, error } = await supabase
        .from("hobbies")
        .select("id,name,description")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setHobbies(data);
      }
    };

    loadHobbies();
  }, [user]);

  // ✅ LOGIN
  const login = async (e: React.FormEvent) => {
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
  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) setMessage(error.message);
    else {
      setMessage("✅ Account created — login now");
      setView("login");
    }

    setLoading(false);
  };

  // ✅ JOIN COMMUNITY
  const joinCommunity = async (hobbyId: string) => {
    if (!user) return;

    const { error } = await supabase.from("user_hobbies").insert({
      user_id: user.id,
      hobby_id: hobbyId,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("✅ Joined the community");
    }
  };

  // ✅ LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
  };

  // ---------------- UI ------------------

  if (view === "communities") {
    return (
      <div style={styles.page}>
        <h2>Communities</h2>
        <p>{user?.email}</p>

        {hobbies.map((hobby) => (
          <div key={hobby.id} style={styles.card}>
            <strong>{hobby.name}</strong>
            <p>{hobby.description}</p>
            <button
              style={styles.join}
              onClick={() => joinCommunity(hobby.id)}
            >
              Join
            </button>
          </div>
        ))}

        <button style={styles.logout} onClick={logout}>
          Logout
        </button>
      </div>
    );
  }

  if (view === "register") {
    return (
      <div style={styles.page}>
        <h2>Create Account</h2>

        <form style={styles.form} onSubmit={register}>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button style={styles.main}>
            {loading ? "Creating..." : "Create"}
          </button>
        </form>

        <p>{message}</p>

        <button style={styles.link} onClick={() => setView("login")}>
          ← Back to Login
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2>Login</h2>

      <form style={styles.form} onSubmit={login}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button style={styles.main}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <p>{message}</p>

      <button style={styles.link} onClick={() => setView("register")}>
        Create account
      </button>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    alignItems: "center",
    fontFamily: "Arial",
  },
  form: {
    maxWidth: "300px",
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  main: {
    background: "#0f172a",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  link: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
  },
  card: {
    width: "100%",
    maxWidth: "300px",
    background: "white",
    padding: "12px",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  join: {
    marginTop: "6px",
  },
  logout: {
    marginTop: "16px",
  },
};
