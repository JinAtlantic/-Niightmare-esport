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

function missingRelation(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || error.code === "PGRST205" || /team_comments|relation/i.test(error.message ?? "");
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
  let playerQuery = db
    .from("player_comments")
    .select("id, body, status, created_at, players(id, ign), fan_profiles(display_name, avatar_url, provider)")
    .order("created_at", { ascending: false })
    .limit(100);

  let teamQuery = db
    .from("team_comments")
    .select("id, body, status, created_at, fan_profiles(display_name, avatar_url, provider)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") {
    playerQuery = playerQuery.eq("status", status);
    teamQuery = teamQuery.eq("status", status);
  }

  const [playerResult, teamResult] = await Promise.all([playerQuery, teamQuery]);
  if (playerResult.error) return NextResponse.json({ error: playerResult.error.message }, { status: 500 });
  if (teamResult.error && !missingRelation(teamResult.error)) {
    return NextResponse.json({ error: teamResult.error.message }, { status: 500 });
  }

  const playerComments = (playerResult.data ?? []).map((comment) => {
    const moderation = analyzeCommentModeration(String(comment.body ?? ""));
    return {
      ...comment,
      target: "player" as const,
      moderation: {
        status: moderation.status,
        categories: moderation.categories,
      },
    };
  });

  const teamComments = (teamResult.error ? [] : teamResult.data ?? []).map((comment) => {
    const moderation = analyzeCommentModeration(String(comment.body ?? ""));
    return {
      ...comment,
      target: "team" as const,
      players: null,
      moderation: {
        status: moderation.status,
        categories: moderation.categories,
      },
    };
  });

  const comments = [...playerComments, ...teamComments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 100);

  return NextResponse.json({ comments, persisted: true });
}

export async function PATCH(request: Request) {
  if (!authed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!supabaseAdminEnabled) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  let payload: { id?: string; status?: string; target?: string };
  try {
    payload = (await request.json()) as { id?: string; status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = String(payload.id ?? "");
  const status = String(payload.status ?? "");
  const target = String(payload.target ?? "player");
  if (!id) return NextResponse.json({ error: "Missing comment id." }, { status: 400 });
  if (!ALLOWED_STATUS.has(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  if (target !== "player" && target !== "team") return NextResponse.json({ error: "Invalid target." }, { status: 400 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const table = target === "team" ? "team_comments" : "player_comments";
  const { error } = await db.from(table).update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
