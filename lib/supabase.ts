import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client, created lazily from the public env vars. When the
 * vars are absent (local dev without a project, or before they're set in
 * Vercel) the helpers return null so every caller can fall back to the bundled
 * content — the site never crashes just because Supabase isn't wired up yet.
 *
 * Set in .env.local AND in Vercel → Project → Settings → Environment Variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    });
  }
  return client;
}
