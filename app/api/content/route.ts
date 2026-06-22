import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/getContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, read-only content feed. The site itself now server-renders content
 * via the same cached getter (see lib/getContent), so this route is kept only
 * as a stable JSON endpoint for any external/manual use.
 */
export async function GET() {
  const content = await getSiteContent();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
