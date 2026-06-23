import "server-only";
import { unstable_cache } from "next/cache";
import { readAll } from "@/lib/store";
import { contentFromSupabase } from "@/lib/contentFromSupabase";

/**
 * Live site content for server rendering. Supabase is the source of truth when
 * configured; otherwise the bundled/Vercel-Blob store. Cached in the Next data
 * cache under the "content" tag (admin saves call revalidateTag("content"), so
 * edits appear without a redeploy); the 120s revalidate is a self-healing
 * backstop. Used by the root layout to seed the client ContentProvider with the
 * real data at first paint — no client refetch, no seed→cloud reflow.
 */
export const getSiteContent = unstable_cache(
  async () => (await contentFromSupabase()) ?? (await readAll()),
  ["site-content"],
  // 10-min backstop. Admin saves call revalidateTag("content") so edits still
  // appear immediately; a longer TTL just cuts background rebuilds (and the Blob
  // `list` each one runs) to keep Blob advanced operations well under quota.
  { tags: ["content"], revalidate: 600 }
);
