import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isKeyValid = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const isKeyFormatCorrect = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  return supabaseUrl.startsWith("https://") && supabaseAnonKey.length > 20;
};

// IMPORTANT FIX ⚠️
// Force Supabase to use localStorage so session is not blocked by browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Your mapping helper stays same
export const mapSupabaseUserToAppUser = (sbUser: any, profile: any) => ({
  id: sbUser.id,
  email: sbUser.email,
  name: profile?.full_name || sbUser.email?.split("@")[0],
  avatar: profile?.avatar_url,
  bio: profile?.bio || "",
  joinedHobbies: [],
  hobbyStreaks: {},
  stats: {
    streak: 0,
    totalPoints: 0,
  },
});
