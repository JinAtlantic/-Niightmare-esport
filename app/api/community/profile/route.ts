import { NextResponse } from "next/server";
import { analyzeCommentModeration } from "@/lib/commentModeration";
import { getSupabaseAdmin, supabaseAdminEnabled } from "@/lib/supabaseAdmin";
import { uploadToStorage } from "@/lib/supabaseStorage";
import { ensureFanProfileRow } from "@/lib/fanProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

/**
 * Fan edits their own profile: display name + avatar. The name is filtered for
 * profanity (reused comment moderation); a new photo goes into pending_avatar_url
 * and is only shown publicly after an admin approves it (/api/admin/fan-avatars).
 * Removing a photo is instant. Runs with the service role, so RLS blocks fans
 * from writing fan_profiles directly and this is the only edit path.
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

  await ensureFanProfileRow(db, user);

  const displayNameRaw = form.get("displayName");
  const removeAvatar = String(form.get("removeAvatar") ?? "") === "1";
  const file = form.get("avatar");

  const update: Record<string, unknown> = {};
  let pendingReview = false;

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
    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      const url = await uploadToStorage(
        `fan-avatars/${user.id}-${Date.now().toString(36)}.${ext}`,
        bytes,
        file.type
      );
      // Held for admin review — never written straight to the public avatar_url.
      update.pending_avatar_url = url;
      pendingReview = true;
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

  return NextResponse.json({ ok: true, pendingReview, profile: profile ?? null });
}
