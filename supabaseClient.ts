import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safe in-memory storage to avoid browser "Access to storage" errors
const memoryStorage = {
  data: {} as Record<string, string>,
  getItem(key: string) {
    return this.data[key] || null;
  },
  setItem(key: string, value: string) {
    this.data[key] = value;
  },
  removeItem(key: string) {
    delete this.data[key];
  }
};

// Create client using memory storage and working auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: memoryStorage,   // ✔ no browser storage errors
    persistSession: true,     // ✔ sessions work normally
    autoRefreshToken: true,   // ✔ stays logged in
    detectSessionInUrl: false
  }
});


