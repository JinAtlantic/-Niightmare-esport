import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the SERVICE ROLE key. This key bypasses RLS
 * and must NEVER reach the browser — it has no NEXT_PUBLIC_ prefix and is only
 * imported from server routes. Writes from the inline editor go through here,
 * gated by the admin session cookie, so the public anon key only ever reads.
 *
 * Set in .env.local and Vercel (Settings → Environment Variables):
 *   SUPABASE_SERVICE_ROLE_KEY   (Supabase → Settings → API → service_role)
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdminEnabled = Boolean(url && serviceKey);

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseAdminEnabled) return null;
  if (!client) {
    client = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
