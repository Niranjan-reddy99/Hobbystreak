import { createClient } from "@supabase/supabase-js";

// Read keys from environment (safe for Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ------------------------------
//  VALIDATION HELPERS
// ------------------------------

export const isKeyValid = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const isKeyFormatCorrect = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  return (
    supabaseUrl.startsWith("https://") &&
    supabaseAnonKey.length > 20
  );
};

// ------------------------------
//  SUPABASE CLIENT
// ------------------------------

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------------------
//  MAP SUPABASE USER → APP USER
// ------------------------------

export const mapSupabaseUserToAppUser = (sbUser: any, profile: any) => {
  return {
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
  };
};
