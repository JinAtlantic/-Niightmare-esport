import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { readAll } from "@/lib/store";
import { contentFromSupabase } from "@/lib/contentFromSupabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, read-only content feed for the client ContentProvider. Supabase is
 * the source of truth when configured; otherwise it falls back to the
 * bundled/Vercel-Blob store so the site never goes blank.
 *
 * Cached in the Next data cache under the "content" tag so visitors don't each
 * trigger a database round-trip. Admin saves call revalidateTag("content"), so
 * edits appear immediately; the 120s revalidate is just a self-healing backstop.
 */
const getCachedContent = unstable_cache(
  async () => (await contentFromSupabase()) ?? (await readAll()),
  ["site-content"],
  { tags: ["content"], revalidate: 120 }
);

export async function GET() {
  const content = await getCachedContent();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
