import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authed(): Promise<boolean> {
  return !adminDisabled() && verifyToken((await cookies()).get(COOKIE_NAME)?.value);
}

interface SubBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  userAgent?: string;
}

export async function POST(request: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: SubBody;
  try {
    body = (await request.json()) as SubBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const endpoint = String(body.endpoint || "");
  const p256dh = String(body.keys?.p256dh || "");
  const auth = String(body.keys?.auth || "");
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Bad subscription" }, { status: 400 });
  }
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  // Upsert on the unique endpoint so re-subscribing the same device is idempotent.
  const { error } = await db
    .from("push_subscriptions")
    .upsert(
      { endpoint, p256dh, auth, user_agent: String(body.userAgent || "").slice(0, 300) },
      { onConflict: "endpoint" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { endpoint?: string };
  try {
    body = (await request.json()) as { endpoint?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const endpoint = String(body.endpoint || "");
  if (!endpoint) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { error } = await db.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
