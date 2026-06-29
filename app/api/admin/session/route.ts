import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight "am I logged in as admin?" check. The session cookie is httpOnly
 * (client JS can't read it), so the inline editor asks the server. Returns
 * `{ authed: true }` only for a valid, unexpired admin session — guests always
 * get `false`, so the public site never renders the edit UI.
 */
export async function GET() {
  const authed = !adminDisabled() && verifyToken((await cookies()).get(COOKIE_NAME)?.value);
  return NextResponse.json({ authed }, { headers: { "Cache-Control": "no-store" } });
}
