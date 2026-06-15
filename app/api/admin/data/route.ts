import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { readSection, writeSection, type ContentKey } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only these content sections may be read/written through the admin API. */
const ALLOWED = new Set<ContentKey>(["matches", "roster", "sponsors", "news", "site"]);

function authed(): boolean {
  return !adminDisabled() && verifyToken(cookies().get(COOKIE_NAME)?.value);
}

function asKey(name: string | null): ContentKey | null {
  return name && ALLOWED.has(name as ContentKey) ? (name as ContentKey) : null;
}

export async function GET(request: Request) {
  if (!authed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = asKey(new URL(request.url).searchParams.get("file"));
  if (!key) return NextResponse.json({ error: "Unknown file" }, { status: 400 });
  try {
    const data = await readSection(key);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not read content" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!authed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = asKey(new URL(request.url).searchParams.get("file"));
  if (!key) return NextResponse.json({ error: "Unknown file" }, { status: 400 });

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
    await writeSection(key, data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not save content";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
