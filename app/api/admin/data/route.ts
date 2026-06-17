import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { readSection, writeSection, type ContentKey } from "@/lib/store";
import { supabaseAdminEnabled } from "@/lib/supabaseAdmin";
import { contentFromSupabase } from "@/lib/contentFromSupabase";
import { writeSectionToSupabase } from "@/lib/supabaseWrite";

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
    // Read from Supabase (source of truth) when configured; otherwise the Blob
    // store. Falls back to Blob too if the Supabase assembly fails.
    let data: unknown = null;
    if (supabaseAdminEnabled) {
      const all = await contentFromSupabase();
      if (all) data = all[key];
    }
    if (data == null) data = await readSection(key);
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
    // Write to Supabase (source of truth) when configured; otherwise the Blob
    // store so local dev without Supabase still works.
    if (supabaseAdminEnabled) {
      const res = await writeSectionToSupabase(key, data);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
    } else {
      await writeSection(key, data);
    }
    revalidateTag("content"); // surface the edit on the public site immediately
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not save content";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
