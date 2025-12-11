import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// SAFE STORAGE CHECK
let storage: any = undefined;
try {
  window.localStorage.setItem("test", "1");
  window.localStorage.removeItem("test");
  storage = window.localStorage;       // ✔ localStorage allowed
} catch (e) {
  storage = undefined;                 // ❌ localStorage blocked
  console.warn("⚠ Browser blocked storage. Using MEMORY session.");
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage,
      persistSession: Boolean(storage),
      autoRefreshToken: Boolean(storage),
      detectSessionInUrl: true,
    }
  }
);
