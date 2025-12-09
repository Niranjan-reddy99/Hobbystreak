import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { FlameIcon } from "./components/Icons";

export default function App() {
  const didInit = useRef(false);

  const [view, setView] = useState<"login" | "register" | "feed">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Run only once (prevents cursor bug)
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setView("feed");
      }
    });
  }, []);

  // ---------------- AUTH ----------------

  const login = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) return alert(error.message);

    setView("feed");
  };

  const register = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    setLoading(false);

    if (error) return alert(error.message);

    alert("Check your email to confirm signup!");
    setView("login");
  };

  // ---------------- UI ----------------

  if (view === "feed") {
  return (
    <div className="min-h-screen bg-slate-50 p-6">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Communities</h1>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setView("login");
          }}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl"
        >
          Logout
        </button>
      </div>

      <div className="grid gap-4">

        <div className="bg-white p-4 rounded-2xl border">
          <h3 className="font-bold">🏃 Fitness</h3>
          <p className="text-sm text-slate-500">
            Workouts and staying active
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border">
          <h3 className="font-bold">📚 Reading</h3>
          <p className="text-sm text-slate-500">
            Daily reading challenge
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border">
          <h3 className="font-bold">🎨 Drawing</h3>
          <p className="text-sm text-slate-500">
            Improve creativity practice
          </p>
        </div>

      </div>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-8">

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-3xl mb-4">
          <FlameIcon className="w-8 h-8 text-white" filled />
        </div>
        <h1 className="text-3xl font-bold">Hobbystreak</h1>
      </div>

      {view === "login" && (
        <form onSubmit={login} className="space-y-4">
          <input
            className="w-full p-4 border rounded-xl"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full p-4 border rounded-xl"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl"
          >
            {loading ? "Loading..." : "Sign In"}
          </button>

          <p className="text-center">
            New user?{" "}
            <button
              type="button"
              onClick={() => setView("register")}
              className="font-bold"
            >
              Create account
            </button>
          </p>
        </form>
      )}

      {view === "register" && (
        <form onSubmit={register} className="space-y-4">
          <input
            className="w-full p-4 border rounded-xl"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full p-4 border rounded-xl"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full p-4 border rounded-xl"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="text-center">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setView("login")}
              className="font-bold"
            >
              Sign in
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
