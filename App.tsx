import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

/* ------------------------------------------------ */

type Hobby = {
  id: string;
  name: string;
  description: string;
  category: string;
};

/* ------------------------------------------------ */

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [loading, setLoading] = useState(false);

  /* ------------------------------------------------ */
  /* AUTH LISTENER */
  /* ------------------------------------------------ */

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: auth } = supabase.auth.onAuthStateChange(
      (_ev, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => auth.subscription.unsubscribe();
  }, []);

  /* ------------------------------------------------ */
  /* FETCH COMMUNITIES */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (!user) return;

    fetchPublicHobbies();
  }, [user]);

  const fetchPublicHobbies = async () => {
    const { data, error } = await supabase
  .from("hobbies")
  .select("*");     // ✅ DO NOT ORDER BY created_at


    if (error) {
      console.error("Fetch error:", error.message);
      return;
    }

    if (data) {
      setHobbies(data);
    }
  };

  /* ------------------------------------------------ */
  /* LOGIN */
  /* ------------------------------------------------ */

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  /* ------------------------------------------------ */
  /* LOGOUT */
  /* ------------------------------------------------ */

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  /* ------------------------------------------------ */
  /* JOIN COMMUNITY */
  /* ------------------------------------------------ */

  const joinCommunity = async (hobbyId: string) => {
    if (!user) return;

    const { error } = await supabase.from("user_hobbies").insert({
      user_id: user.id,
      hobby_id: hobbyId,
      streak: 0,
    });

    if (error) {
      alert("Join failed: " + error.message);
      return;
    }

    alert("✅ Joined community!");
  };

  /* ------------------------------------------------ */
  /* LOGIN VIEW */
  /* ------------------------------------------------ */

  if (!user) {
    return (
      <div style={styles.page}>
        <h1>Hobbystreak Login</h1>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Password"
            autoComplete="off"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  /* ------------------------------------------------ */
  /* COMMUNITY VIEW */
  /* ------------------------------------------------ */

  return (
    <div style={styles.page}>
      <h2>Communities</h2>
      <p>{user.email}</p>

      <button onClick={logout} style={styles.logout}>
        Logout
      </button>

      <div style={styles.grid}>
        {hobbies.length === 0 && (
          <p>❌ No communities found – insert again in SQL.</p>
        )}

        {hobbies.map((hobby) => (
          <div key={hobby.id} style={styles.card}>
            <h3>{hobby.name}</h3>
            <p>{hobby.description}</p>
            <small>{hobby.category}</small>

            <button
              style={styles.joinBtn}
              onClick={() => joinCommunity(hobby.id)}
            >
              Join Community
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------ */

const styles: any = {
  page: {
    fontFamily: "sans-serif",
    maxWidth: "600px",
    margin: "40px auto",
    textAlign: "center",
  },
  form: {
    display: "grid",
    gap: "10px",
    marginTop: "20px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    fontSize: "16px",
    cursor: "pointer",
  },
  logout: {
    background: "#111",
    color: "white",
    padding: "8px 14px",
    marginBottom: "20px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gap: "12px",
    marginTop: "30px",
  },
  card: {
    padding: "16px",
    background: "#f7f7f7",
    borderRadius: "8px",
  },
  joinBtn: {
    marginTop: "10px",
    padding: "8px",
    cursor: "pointer",
  },
};
