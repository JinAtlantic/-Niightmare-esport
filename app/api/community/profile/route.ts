import { NextResponse } from "next/server";
import { analyzeCommentModeration } from "@/lib/commentModeration";
import { getSupabaseAdmin, supabaseAdminEnabled } from "@/lib/supabaseAdmin";
import { uploadToStorage } from "@/lib/supabaseStorage";
import { ensureFanProfileRow } from "@/lib/fanProfile";
import { checkAvatarBytesSafe } from "@/lib/nsfwServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Give the first (cold) avatar upload room to load the NSFW model + classify.
export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Best-effort in-memory rate limit keyed by the signed-in fan (not IP, since the
// request is authenticated). Serverless instances are ephemeral, so this resets
// on cold start, but it meaningfully slows a single account spamming name/avatar
// changes. Profile edits are rare, so the window is generous.
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 10;
const profileEdits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const rec = profileEdits.get(userId);
  if (!rec || now > rec.resetAt) {
    profileEdits.set(userId, { count: 1, resetAt: now + RL_WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > RL_MAX;
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

/**
 * Fan edits their own profile: display name + avatar. The name is filtered for
 * profanity (reused comment moderation). The avatar is gated in the browser by
 * nsfwjs before it ever reaches here (see lib/nsfwCheck), so a photo that gets
 * uploaded is published immediately — no admin approval step. Runs with the
 * service role, so RLS blocks fans from writing fan_profiles directly and this
 * is the only edit path.
 */
export async function POST(request: Request) {
  if (!supabaseAdminEnabled) {
    return NextResponse.json({ error: "Community database is not configured." }, { status: 503 });
  }
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "Login required." }, { status: 401 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Community database is not configured." }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Login expired." }, { status: 401 });
  const user = authData.user;

  if (rateLimited(user.id)) {
    return NextResponse.json(
      { error: "แก้ไขโปรไฟล์บ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
      { status: 429 }
    );
  }

  await ensureFanProfileRow(db, user);

  const displayNameRaw = form.get("displayName");
  const removeAvatar = String(form.get("removeAvatar") ?? "") === "1";
  const file = form.get("avatar");

  const update: Record<string, unknown> = {};

  if (typeof displayNameRaw === "string") {
    const name = displayNameRaw.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 40) {
      return NextResponse.json({ error: "ชื่อต้องยาว 2-40 ตัวอักษร" }, { status: 400 });
    }
    if (analyzeCommentModeration(name).status !== "visible") {
      return NextResponse.json({ error: "ชื่อนี้ใช้ไม่ได้ (มีคำไม่เหมาะสม) กรุณาตั้งชื่ออื่น" }, { status: 400 });
    }
    update.display_name = name;
  }

  if (removeAvatar) {
    // Removing is always safe — clear both the public and pending photo.
    update.avatar_url = null;
    update.pending_avatar_url = null;
  } else if (file instanceof Blob && typeof (file as File).name === "string" && file.size > 0) {
    const ext = EXT[file.type];
    if (!ext) return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูป (PNG/JPG/WebP/GIF)" }, { status: 415 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "รูปใหญ่เกินไป (สูงสุด 4 MB)" }, { status: 413 });

    const bytes = Buffer.from(await file.arrayBuffer());

    // Authoritative server-side NSFW gate (the only one — there is no in-browser
    // check, so this can't be bypassed by calling the API directly). Every avatar
    // is classified here before publishing. Unsafe → reject; a classifier/infra
    // failure also blocks the upload (fail closed) so no unverified photo goes live.
    try {
      const verdict = await checkAvatarBytesSafe(bytes);
      if (!verdict.safe) {
        return NextResponse.json({ error: "รูปนี้ดูไม่เหมาะสม กรุณาเลือกรูปอื่น" }, { status: 422 });
      }
    } catch (err) {
      console.error("avatar nsfw check failed", err);
      return NextResponse.json({ error: "ตรวจสอบรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 503 });
    }

    try {
      const url = await uploadToStorage(
        `fan-avatars/${user.id}-${Date.now().toString(36)}.${ext}`,
        bytes,
        file.type
      );
      // Passed both the browser and the server NSFW gate — publish immediately and
      // clear any leftover pending photo from the old review flow.
      update.avatar_url = url;
      update.pending_avatar_url = null;
    } catch {
      return NextResponse.json({ error: "อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลให้บันทึก" }, { status: 400 });
  }

  const { error: updateError } = await db.from("fan_profiles").update(update).eq("id", user.id);
  if (updateError) {
    if (/pending_avatar_url/i.test(updateError.message)) {
      return NextResponse.json(
        { error: "ต้องอัปเดตฐานข้อมูลก่อน (คอลัมน์ pending_avatar_url) — รัน supabase/schema.sql" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: profile } = await db.from("fan_profiles").select("*").eq("id", user.id).maybeSingle();

  return NextResponse.json({ ok: true, profile: profile ?? null });
}
