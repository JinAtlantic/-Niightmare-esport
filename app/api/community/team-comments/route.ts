import { NextResponse } from "next/server";
import { analyzeCommentModeration } from "@/lib/commentModeration";
import { getSupabaseAdmin, supabaseAdminEnabled } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

function displayName(user: { user_metadata?: Record<string, unknown>; email?: string }) {
  const metadata = user.user_metadata ?? {};
  return (
    String(metadata.full_name || metadata.name || metadata.preferred_username || user.email || "").trim() ||
    "NIIGHTMARE Fan"
  );
}

function avatarUrl(user: { user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  return String(metadata.avatar_url || metadata.picture || "");
}

export async function POST(request: Request) {
  if (!supabaseAdminEnabled) {
    return NextResponse.json({ error: "Community database is not configured." }, { status: 503 });
  }

  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Community database is not configured." }, { status: 503 });

  let payload: { body?: string };
  try {
    payload = (await request.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const body = String(payload.body ?? "").trim();
  if (body.length < 1 || body.length > 500) {
    return NextResponse.json({ error: "Comment must be 1-500 characters." }, { status: 400 });
  }

  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Login expired." }, { status: 401 });

  const user = authData.user;
  const moderation = analyzeCommentModeration(body);

  const { error: profileError } = await db.from("fan_profiles").upsert({
    id: user.id,
    display_name: displayName(user),
    avatar_url: avatarUrl(user),
    provider: user.app_metadata?.provider ?? null,
  });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { error: insertError } = await db.from("team_comments").insert({
    user_id: user.id,
    body,
    status: moderation.status,
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    status: moderation.status,
    review: moderation.status === "review",
    categories: moderation.categories,
  });
}
