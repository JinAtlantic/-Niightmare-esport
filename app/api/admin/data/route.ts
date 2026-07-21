import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { readSection, type ContentKey } from "@/lib/store";
import { supabaseAdminEnabled } from "@/lib/supabaseAdmin";
import { contentFromSupabase } from "@/lib/contentFromSupabase";
import { writeSectionToSupabase } from "@/lib/supabaseWrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only these content sections may be read/written through the admin API. */
const ALLOWED = new Set<ContentKey>(["matches", "roster", "sponsors", "news", "site", "achievements"]);

async function authed(): Promise<boolean> {
  return !adminDisabled() && verifyToken((await cookies()).get(COOKIE_NAME)?.value);
}

function asKey(name: string | null): ContentKey | null {
  return name && ALLOWED.has(name as ContentKey) ? (name as ContentKey) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Reject partial/empty payloads before they reach whole-section replacement.
 * Admin editors always PUT the full section; accepting `{}` here would turn a
 * client bug or malformed script into a destructive table wipe. */
function validateSection(key: ContentKey, value: unknown): string | null {
  if (!isRecord(value)) return "Expected an object";
  const array = (name: string) => Array.isArray(value[name]);
  const object = (name: string) => isRecord(value[name]);
  switch (key) {
    case "matches":
      return object("page") && array("matches") && array("tournaments")
        ? null
        : "Invalid matches payload";
    case "roster":
      return object("page") && (object("games") || (object("mlbb") && object("efootball"))) && array("staff")
        ? null
        : "Invalid roster payload";
    case "sponsors":
      return object("page") && array("sponsors") && array("tiers")
        ? null
        : "Invalid sponsors payload";
    case "news":
      return object("page") && array("articles") ? null : "Invalid news payload";
    case "site":
      return object("team") && object("contact") && object("upcomingMatch")
        ? null
        : "Invalid site payload";
    case "achievements":
      return object("page") && array("stats") && array("trophies")
        ? null
        : "Invalid achievements payload";
  }
}

export async function GET(request: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = asKey(new URL(request.url).searchParams.get("file"));
  if (!key) return NextResponse.json({ error: "Unknown file" }, { status: 400 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  let data: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const validationError = validateSection(key, data);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  try {
    // Write to Supabase (source of truth) when configured; otherwise the Blob
    // store so local dev without Supabase still works.
    if (supabaseAdminEnabled) {
      const res = await writeSectionToSupabase(key, data);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
    } else {
      return NextResponse.json({ error: "Storage not configured (Supabase required)" }, { status: 500 });
    }
    revalidateTag("content"); // surface the edit on the public site immediately
    revalidatePath("/", "layout");
    revalidatePath("/matches");
    revalidatePath("/achievements");
    revalidatePath("/roster");
    revalidatePath("/gallery");
    revalidatePath("/shop");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not save content";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
