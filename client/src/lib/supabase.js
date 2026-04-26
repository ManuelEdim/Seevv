import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check your .env.local file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "seevv-auth-v1",
    // Bypass the Web Locks API. Supabase uses navigator.locks.request() to coordinate
    // token refreshes across tabs. When a new page load starts it steals the lock,
    // aborting the previous holder and throwing AbortError everywhere. Bypassing the
    // lock means each tab refreshes independently — safe for a standard web app.
    lock: (_name, _acquireTimeout, fn) => fn(),
  },
});
