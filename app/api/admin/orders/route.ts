import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["paid_declared", "verified", "shipped", "cancelled"]);

async function authed(): Promise<boolean> {
  return !adminDisabled() && verifyToken((await cookies()).get(COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ orders: [] });
  const { data, error } = await db
    .from("shop_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: string; status?: string };
  try {
    body = (await request.json()) as { id?: string; status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id || !body.status || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { error } = await db.from("shop_orders").update({ status: body.status }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
