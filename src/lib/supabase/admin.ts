import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Server-side only. Never import in client components.
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars are not set");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
