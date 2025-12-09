import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { FlameIcon } from "./components/Icons";

/**
 ✅ FULL SAFE STABLE APP.TSX
 ✅ NO CONDITIONAL HOOKS
 ✅ NO CURSOR BUG
 ✅ NO BLANK PAGES
*/

export default function App() {
  const didInit = useRef(false);

  // -------- GLOBAL STATE --------
  const [view, setView] = useState<"login" | "register" | "feed">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);

  // Community state
  const [showModal, setShowModal] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityDesc, setCommunityDesc] = useState("");

  // -------- INIT SESSION --------
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setView("feed");
      }
    });
  }, []);

  // -------- AUTH --------
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

    alert("✅ Confirmation email sent.\nClick it then sign in.");
    setView("login");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setView("login");
  };

  // -------- CREATE COMMUNITY --------
  const createCommunity = async () => {
    if (!communityName || !communityDesc) {
      alert("Fill both fields");
      return;
    }

    const { error } = await supabase.from("hobbies").insert({
      name: communityName,
      description: communityDesc,
      category: "GENERAL",
      icon: "✨",
    });

    if (error) return alert(error.message);

    alert("✅ Community created successfully!");

    setCommunityName("");
    setCommunityDesc("");
    setShowModal(false);
  };

  // =================================
  // ============ PAGES ===============
  // =================================

  // -------- FEED --------
  if (view === "feed") {
    return (
      <div className="min-h-screen bg-slate-50 p-6">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Communities</h1>

          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
            >
              Create
            </button>

            <button
              onClick={logout}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl"
            >
              Logout
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Click CREATE to add a community (saved to Supabase).
        </p>

        {/* ---------- MODAL ---------- */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm space-y-4">
              <input
                className="w-full border p-3 rounded"
                placeholder="Community Name"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
              />

              <textarea
                className="w-full border p-3 rounded"
                placeholder="Description"
                value={communityDesc}
                onChange={(e) => setCommunityDesc(e.target.value)}
              />

              <button
                onClick={createCommunity}
                className="w-full bg-indigo-600 text-white py-2 rounded"
              >
                Create Community
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="w-full border py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------- LOGIN & REGISTER --------
  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 px-8">

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-3xl mb-4">
          <FlameIcon className="w-8 h-8 text-white" filled />
        </div>
        <h1 className="text-3xl font-bold">Hobbystreak</h1>
      </div>

      {view === "login" ? (
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

          <button className="w-full bg-slate-900 text-white p-3 rounded-xl">
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
      ) : (
        <form onSubmit={register} className="space-y-4">
          <input
            className="w-full p-4 border rounded-xl"
            placeholder="Full Name"
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

          <button className="w-full bg-slate-900 text-white p-3 rounded-xl">
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="text-center">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setView("login")}
              className="font-bold"
            >
              Sign In
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
