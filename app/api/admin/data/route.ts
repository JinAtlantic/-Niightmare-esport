import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only these content files may be read/written through the admin API. */
const ALLOWED = new Set(["matches", "roster", "sponsors", "news", "site"]);

function authed(): boolean {
  return !adminDisabled() && verifyToken(cookies().get(COOKIE_NAME)?.value);
}

function resolveFile(name: string | null): string | null {
  if (!name || !ALLOWED.has(name)) return null;
  return path.join(process.cwd(), "data", `${name}.json`);
}

export async function GET(request: Request) {
  if (!authed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const file = resolveFile(new URL(request.url).searchParams.get("file"));
  if (!file) return NextResponse.json({ error: "Unknown file" }, { status: 400 });
  try {
    const raw = await fs.readFile(file, "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Could not read file" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!authed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const file = resolveFile(new URL(request.url).searchParams.get("file"));
  if (!file) return NextResponse.json({ error: "Unknown file" }, { status: 400 });

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (data === null || typeof data !== "object") {
    return NextResponse.json({ error: "Expected an object" }, { status: 400 });
  }

  try {
    await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not write file" }, { status: 500 });
  }
}
