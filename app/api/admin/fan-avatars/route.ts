import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { getSupabaseAdmin, supabaseAdminEnabled } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authed(): Promise<boolean> {
  return !adminDisabled() && verifyToken((await cookies()).get(COOKIE_NAME)?.value);
}

function missingColumn(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return /pending_avatar_url|column|42703|PGRST204/i.test(`${error.code ?? ""} ${error.message ?? ""}`);
}

/** Fan profiles whose newly uploaded photo is waiting for review. */
export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdminEnabled) return NextResponse.json({ profiles: [] });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ profiles: [] });

  const { data, error } = await db
    .from("fan_profiles")
    .select("id, display_name, avatar_url, pending_avatar_url, updated_at")
    .not("pending_avatar_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    if (missingColumn(error)) return NextResponse.json({ profiles: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profiles: data ?? [] });
}

/** Approve → promote the pending photo to the public avatar; reject → discard it. */
export async function PATCH(request: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdminEnabled) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  let payload: { id?: string; action?: string };
  try {
    payload = (await request.json()) as { id?: string; action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = String(payload.id ?? "");
  const action = String(payload.action ?? "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  if (action === "approve") {
    const { data: row, error: readErr } = await db
      .from("fan_profiles")
      .select("pending_avatar_url")
      .eq("id", id)
      .maybeSingle();
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
    const { error } = await db
      .from("fan_profiles")
      .update({ avatar_url: row?.pending_avatar_url ?? null, pending_avatar_url: null })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await db.from("fan_profiles").update({ pending_avatar_url: null }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
