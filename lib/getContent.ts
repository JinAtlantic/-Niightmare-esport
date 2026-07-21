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
 * real data at first paint. A marked fallback lets the provider repair a rare
 * cold-build timeout from the live API after hydration.
 */
// Bound the Supabase read so a slow / cold free-tier DB can't hang SSR. If it
// doesn't answer in time we fall back to the bundled seed and the page still
// renders fast; a warm DB answers in well under this.
const SUPABASE_TIMEOUT_MS = 10_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

type SiteContentPayload = Record<string, unknown> & {
  __contentSource?: "fallback";
};

function fallbackContent(): SiteContentPayload {
  return { ...bundled(), __contentSource: "fallback" };
}

async function readLiveContent(): Promise<Record<string, unknown>> {
  const live = await withTimeout(contentFromSupabase(), SUPABASE_TIMEOUT_MS);
  if (!live) throw new Error("Supabase content read timed out or failed");
  return live;
}

const getCachedSiteContent = unstable_cache(
  readLiveContent,
  ["site-content-v10"],
  // 10-min backstop. Admin saves call revalidateTag("content") so edits still
  // appear immediately; a longer TTL just cuts background rebuilds (and the Blob
  // `list` each one runs) to keep Blob advanced operations well under quota.
  { tags: ["content"], revalidate: 600 }
);

/** Cached live content for normal SSR/ISR. Failed reads are deliberately
 * converted outside the cache scope so a fallback is never treated as the
 * source-of-truth payload. */
export async function getSiteContent(): Promise<SiteContentPayload> {
  try {
    return await getCachedSiteContent();
  } catch (error) {
    console.warn(
      "[content] using bundled fallback",
      error instanceof Error ? error.message : "unknown error"
    );
    return fallbackContent();
  }
}
