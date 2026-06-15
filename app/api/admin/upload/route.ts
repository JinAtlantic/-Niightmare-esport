import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Upload targets → folder prefix inside the blob store. */
const FOLDERS = new Set(["teams", "players", "staff"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
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
  if (adminDisabled() || !verifyToken(cookies().get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Storage not configured (BLOB_READ_WRITE_TOKEN missing)" },
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
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      token,
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000, // images are immutable; cache hard
    });
    // The stored path is the full public blob URL (works the same as the old
    // /teams/... local paths in <img src>).
    return NextResponse.json({ ok: true, path: blob.url });
  } catch {
    return NextResponse.json({ error: "Could not upload image" }, { status: 500 });
  }
}
