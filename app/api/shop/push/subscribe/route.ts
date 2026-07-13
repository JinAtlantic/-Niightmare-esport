import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public buyer push opt-in. No login: a device registers its push subscription
// against the order UUIDs it already holds (unguessable ids are the capability,
// same as /api/shop/order/status). We only ever push non-sensitive milestone
// text ("your order shipped"), never customer details.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Body {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  orderIds?: unknown;
  lang?: string;
  userAgent?: string;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16 * 1024) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const endpoint = String(body.endpoint || "").slice(0, 2048);
  const p256dh = String(body.keys?.p256dh || "").slice(0, 256);
  const auth = String(body.keys?.auth || "").slice(0, 256);
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Bad subscription" }, { status: 400 });
  }

  const orderIds = Array.isArray(body.orderIds)
    ? [...new Set(body.orderIds.map((x) => String(x)).filter((x) => UUID_RE.test(x)))].slice(0, 50)
    : [];
  if (!orderIds.length) return NextResponse.json({ error: "No orders" }, { status: 400 });
  const lang = body.lang === "lo" ? "lo" : "en";

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, stored: false });

  // A UUID is a capability only when it names a real order. Refuse arbitrary
  // IDs so this public endpoint cannot be used to bloat subscription rows.
  const { data: existingOrders, error: orderError } = await db
    .from("shop_orders")
    .select("id")
    .in("id", orderIds);
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
  const validIds = (existingOrders ?? []).map((row) => String(row.id));
  if (!validIds.length) return NextResponse.json({ error: "No valid orders" }, { status: 400 });

  // Upsert on the unique endpoint so re-subscribing / refreshing order_ids for
  // the same device is idempotent.
  const { error } = await db.from("shop_push_subscriptions").upsert(
    {
      endpoint,
      p256dh,
      auth,
      order_ids: validIds,
      lang,
      user_agent: String(body.userAgent || "").slice(0, 300),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );
  if (error) {
    // Migration not run yet → tell the client cleanly instead of a raw 500.
    if (/shop_push_subscriptions/.test(error.message)) {
      return NextResponse.json({ error: "notifications not set up yet" }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, stored: true });
}

export async function DELETE(request: Request) {
  let body: { endpoint?: string };
  try {
    body = (await request.json()) as { endpoint?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const endpoint = String(body.endpoint || "");
  if (!endpoint) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true });
  const { error } = await db.from("shop_push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
