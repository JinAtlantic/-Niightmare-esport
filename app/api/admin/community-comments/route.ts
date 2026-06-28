import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { analyzeCommentModeration } from "@/lib/commentModeration";
import { getSupabaseAdmin, supabaseAdminEnabled } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUS = new Set(["visible", "review", "hidden"]);

function authed(): boolean {
  return !adminDisabled() && verifyToken(cookies().get(COOKIE_NAME)?.value);
}

export async function GET(request: Request) {
  if (!authed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdminEnabled) return NextResponse.json({ comments: [], persisted: false });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ comments: [], persisted: false });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "review";
  if (status !== "all" && !ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  let query = db
    .from("player_comments")
    .select("id, body, status, created_at, players(id, ign), fan_profiles(display_name, avatar_url, provider)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comments = (data ?? []).map((comment) => {
    const moderation = analyzeCommentModeration(String(comment.body ?? ""));
    return {
      ...comment,
      moderation: {
        status: moderation.status,
        categories: moderation.categories,
      },
    };
  });

  return NextResponse.json({ comments, persisted: true });
}

export async function PATCH(request: Request) {
  if (!authed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdminEnabled) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  let payload: { id?: string; status?: string };
  try {
    payload = (await request.json()) as { id?: string; status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = String(payload.id ?? "");
  const status = String(payload.status ?? "");
  if (!id) return NextResponse.json({ error: "Missing comment id." }, { status: 400 });
  if (!ALLOWED_STATUS.has(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { error } = await db.from("player_comments").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
