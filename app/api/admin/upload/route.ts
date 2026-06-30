import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { storageEnabled, uploadToStorage } from "@/lib/supabaseStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Upload targets → folder prefix inside the blob store. */
const FOLDERS = new Set(["teams", "players", "staff", "sponsors"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Slugify a filename base so it is safe and predictable. */
function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "image"
  );
}

export async function POST(request: Request) {
  if (adminDisabled() || !verifyToken((await cookies()).get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!storageEnabled) {
    return NextResponse.json(
      { error: "Storage not configured (SUPABASE_SERVICE_ROLE_KEY missing)" },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const folder = String(form.get("folder") || "");
  const file = form.get("file");
  if (!FOLDERS.has(folder)) {
    return NextResponse.json({ error: "Unknown folder" }, { status: 400 });
  }
  if (!(file instanceof Blob) || typeof (file as File).name !== "string") {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 4 MB)" }, { status: 413 });
  }

  const base = slug((file as File).name);
  const pathname = `${folder}/${base}-${Date.now().toString(36)}.${ext}`;
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    // The stored path is the full public Storage URL (works the same as the old
    // /teams/... local paths in <img src>).
    const url = await uploadToStorage(pathname, bytes, file.type);
    return NextResponse.json({ ok: true, path: url });
  } catch (error) {
    console.error("admin upload failed", error);
    return NextResponse.json({ error: "Could not upload image" }, { status: 500 });
  }
}
