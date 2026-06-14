import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import { COOKIE_NAME, verifyToken } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Upload targets → subfolder under /public. */
const FOLDERS = new Set(["teams", "players"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/** Slugify a filename base so it is safe and predictable on disk. */
function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "logo"
  );
}

export async function POST(request: Request) {
  if (!verifyToken(cookies().get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const filename = `${base}-${Date.now().toString(36)}.${ext}`;
  const dir = path.join(process.cwd(), "public", folder);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "Could not save file" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path: `/${folder}/${filename}` });
}
