import { NextResponse } from "next/server";
import { readAll } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public, read-only content feed consumed by the client ContentProvider. */
export async function GET() {
  const content = await readAll();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
