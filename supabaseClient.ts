
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vfnwapcfycnpgbnsubic.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbndhcGNmeWNucGdibnN1YmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDc4OTAsImV4cCI6MjA4MDgyMzg5MH0.sPZu-Woe8I9HhefTP12TLVn_cfmDvko6Thude4y5kdk";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
