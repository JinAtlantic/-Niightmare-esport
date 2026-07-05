import "server-only";
import matches from "@/data/matches.json";
import roster from "@/data/roster.json";
import sponsors from "@/data/sponsors.json";
import news from "@/data/news.json";
import site from "@/data/site.json";
import achievements from "@/data/achievements.json";

/**
 * Content seed / read fallback. Vercel Blob storage has been RETIRED — Supabase
 * is the single source of truth (read via lib/contentFromSupabase, written via
 * lib/supabaseWrite). These helpers now only serve the bundled data/*.json so
 * the public site still renders if Supabase is briefly unreachable. There is no
 * cloud write path here anymore, so nothing touches the (blocked, legacy) Blob
 * store or consumes its operations.
 */

export type ContentKey = "matches" | "roster" | "sponsors" | "news" | "site" | "achievements";
export type Content = Record<ContentKey, unknown>;

export function bundled(): Content {
  // Deep clone so callers can't mutate the imported modules.
  return JSON.parse(JSON.stringify({ matches, roster, sponsors, news, site, achievements }));
}

/** Full content — the bundled seed (Supabase is read elsewhere). */
export async function readAll(): Promise<Content> {
  return bundled();
}

/** One section of the bundled seed — used only as a read fallback. */
export async function readSection(key: ContentKey): Promise<unknown> {
  return bundled()[key];
}
