import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { getSupabaseAdmin, supabaseAdminEnabled } from "@/lib/supabaseAdmin";
import { staffToRow } from "@/lib/members";
import type { StaffMember } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authed(): boolean {
  return !adminDisabled() && verifyToken(cookies().get(COOKIE_NAME)?.value);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROFILE_COLUMNS = ["country_code", "country_en", "country_lo"];

async function membersHaveProfileColumns(db: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const { error } = await db.from("members").select(PROFILE_COLUMNS.join(",")).limit(1);
  return !error;
}

function omitProfileColumns<T extends object>(row: T): T {
  const next = { ...(row as Record<string, unknown>) };
  for (const key of PROFILE_COLUMNS) delete next[key];
  return next as T;
}

function hasProfileValue(row: Record<string, unknown>) {
  return PROFILE_COLUMNS.some((key) => {
    const value = row[key];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });
}

/**
 * Upsert one Behind-the-Team member. Admin cookie required; the write itself
 * runs with the service role (bypasses RLS) so the public anon key never needs
 * write access. Returns persisted:false (not an error) when Supabase isn't
 * configured yet, so the editor can update the screen and say so honestly.
 */
export async function POST(request: Request) {
  if (!authed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let member: StaffMember;
  try {
    member = (await request.json()) as StaffMember;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!member || typeof member !== "object" || !member.id) {
    return NextResponse.json({ error: "Missing member" }, { status: 400 });
  }

  if (!supabaseAdminEnabled) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, persisted: false });

  const baseRow = staffToRow(member);
  const hasColumns = await membersHaveProfileColumns(db);
  if (!hasColumns && hasProfileValue(baseRow as unknown as Record<string, unknown>)) {
    return NextResponse.json(
      { error: "Supabase members profile columns are missing. Run supabase/schema.sql before saving staff flag fields." },
      { status: 500 }
    );
  }
  const row = hasColumns ? baseRow : omitProfileColumns(baseRow);
  let error;
  if (UUID.test(member.id)) {
    ({ error } = await db.from("members").upsert(row));
  } else {
    const { id: _drop, ...insertRow } = row;
    ({ error } = await db.from("members").insert(insertRow));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("content");
  return NextResponse.json({ ok: true, persisted: true });
}
