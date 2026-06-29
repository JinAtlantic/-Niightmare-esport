import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { migrateAll } from "@/lib/migrate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authed(): Promise<boolean> {
  return !adminDisabled() && verifyToken((await cookies()).get(COOKIE_NAME)?.value);
}

/** Copy the current site content into Supabase. Admin cookie required. */
export async function POST() {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await migrateAll();
  if (!result.ok) return NextResponse.json(result, { status: 500 });
  revalidateTag("content");
  return NextResponse.json(result);
}
