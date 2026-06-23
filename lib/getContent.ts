import "server-only";
import { unstable_cache } from "next/cache";
import { bundled } from "@/lib/store";
import { contentFromSupabase } from "@/lib/contentFromSupabase";

/**
 * Live site content for server rendering. Supabase is the source of truth when
 * configured; otherwise the bundled/Vercel-Blob store. Cached in the Next data
 * cache under the "content" tag (admin saves call revalidateTag("content"), so
 * edits appear without a redeploy); the 120s revalidate is a self-healing
 * backstop. Used by the root layout to seed the client ContentProvider with the
 * real data at first paint — no client refetch, no seed→cloud reflow.
 */
// Bound the Supabase read so a slow / cold free-tier DB can't hang SSR. If it
// doesn't answer in time we fall back to the bundled seed and the page still
// renders fast; a warm DB answers in well under this.
const SUPABASE_TIMEOUT_MS = 3000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export const getSiteContent = unstable_cache(
  async () =>
    // Supabase is the source of truth. If it doesn't answer in time, fall
    // straight to the bundled seed — NOT the Vercel Blob store. That store is
    // legacy and blocked, and its `list()` has no timeout, so on a cold first
    // request (empty cache) a blocked Blob read could hang SSR past Vercel's
    // function limit → the browser shows "can't reach this site", then a
    // refresh works because the cache is warm. The seed is in-bundle JSON, so
    // this path is instant and the page always renders.
    (await withTimeout(contentFromSupabase(), SUPABASE_TIMEOUT_MS)) ?? bundled(),
  ["site-content"],
  // 10-min backstop. Admin saves call revalidateTag("content") so edits still
  // appear immediately; a longer TTL just cuts background rebuilds (and the Blob
  // `list` each one runs) to keep Blob advanced operations well under quota.
  { tags: ["content"], revalidate: 600 }
);
