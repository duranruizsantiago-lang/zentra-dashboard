import { createClient } from "@supabase/supabase-js";

// We fallback to empty strings if variables are undefined to prevent immediate crash,
// but the client won't work without actual credentials provided in .env or deployment vars.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
