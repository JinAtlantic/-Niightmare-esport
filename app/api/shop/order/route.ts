import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadToStorage } from "@/lib/supabaseStorage";
import { contentFromSupabase } from "@/lib/contentFromSupabase";
import { sendPushToAll } from "@/lib/push";
import {
  resolveShop,
  computeOrder,
  summariseLines,
  validateOrder,
  buildOrderMessage,
  cleanRefCode,
  type ShopContent,
  type ShopOrderInput,
  type ShopOrderItem,
  type ShopOrderRecord,
} from "@/lib/shop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Light in-memory rate limit: max 6 orders / 10 min per IP (best-effort; resets
// on cold start). Stops casual spam without a datastore.
const HITS = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const MAX = 6;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW);
  hits.push(now);
  HITS.set(ip, hits);
  return hits.length > MAX;
}

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

const SLIP_MAX_BYTES = 4 * 1024 * 1024; // 4 MB

/** Decode a base64 image data URL and upload the payment slip to Supabase Storage.
 *  Best-effort: returns undefined (order still saves) if storage isn't set up
 *  or the payload is invalid/too big. */
async function uploadSlip(slip: unknown): Promise<string | undefined> {
  if (typeof slip !== "string" || !slip.startsWith("data:image/")) return undefined;
  const m = /^data:(image\/(png|jpeg|webp));base64,([\s\S]+)$/.exec(slip);
  if (!m) return undefined;
  try {
    const bytes = Buffer.from(m[3], "base64");
    if (!bytes.length || bytes.length > SLIP_MAX_BYTES) return undefined;
    const ext = m[2] === "jpeg" ? "jpg" : m[2];
    const name = `shop-slips/slip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    return await uploadToStorage(name, bytes, m[1]);
  } catch {
    return undefined;
  }
}

/** Insert an order row, dropping optional columns that may not exist yet
 *  (items / ref_code / slip_url) instead of 500ing. */
async function insertOrder(
  db: SupabaseClient,
  row: Record<string, unknown>
): Promise<{ id?: string; createdAt?: string; error?: string }> {
  const work = { ...row };
  let { data, error } = await db.from("shop_orders").insert(work).select("id, created_at").single();
  let guard = 0;
  while (error && guard < 4) {
    const col = ["items", "ref_code", "slip_url", "user_email"].find((c) => error!.message.includes(c));
    if (!col) break;
    delete work[col];
    guard++;
    ({ data, error } = await db.from("shop_orders").insert(work).select("id, created_at").single());
  }
  if (error) return { error: error.message };
  return { id: data?.id as string | undefined, createdAt: data?.created_at as string | undefined };
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many orders, please try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // "reserve" = create an unpaid order the buyer can pay within the window;
  // "pay" = the buyer attached a slip and declared their transfer.
  const intent = body.intent === "reserve" ? "reserve" : "pay";
  const orderId = str(body.orderId, 64);

  const rawItems = Array.isArray(body.items) ? (body.items as unknown[]) : [];
  const items: ShopOrderItem[] = rawItems
    .slice(0, 20)
    .map((it) => {
      const o = (it ?? {}) as Record<string, unknown>;
      return {
        sizeId: str(o.sizeId, 12).toLowerCase(),
        quantity: Math.max(0, Math.min(999, Math.floor(Number(o.quantity) || 0))),
      };
    })
    .filter((it) => it.sizeId && it.quantity > 0);

  const input: ShopOrderInput = {
    items,
    customerName: str(body.customerName, 120),
    phone: str(body.phone, 60),
    courier: str(body.courier, 80),
    province: str(body.province, 80),
    city: str(body.city, 80),
    branch: str(body.branch, 120),
  };

  const errors = validateOrder(input);
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Invalid order", fields: errors }, { status: 400 });
  }

  // Resolve shop content server-side so the price is authoritative, never trusted
  // from the client.
  let shop: ShopContent = resolveShop(null);
  let formspree = "";
  try {
    const content = await contentFromSupabase();
    if (content) {
      const site = content.site as { shop?: Partial<ShopContent>; formspreeEndpoint?: string } | undefined;
      shop = resolveShop(site?.shop ?? null);
      formspree = site?.formspreeEndpoint ?? "";
    }
  } catch {
    /* fall back to defaults */
  }

  if (!shop.enabled) {
    return NextResponse.json({ error: "Shop is closed" }, { status: 403 });
  }

  const { lines, totalQty, total } = computeOrder(shop, input.items);
  if (!lines.length) {
    return NextResponse.json({ error: "No available sizes selected", fields: { items: true } }, { status: 400 });
  }
  const summary = summariseLines(lines);

  // Short reference code the buyer is asked to put in the transfer note, so the
  // team can match a payment to one order (no amount tampering).
  const refCode = cleanRefCode(body.ref);
  // Signed-in buyer's email (buying requires sign-in). Stored for the team's reference.
  const userEmail = str(body.userEmail, 200);

  const baseRow = (status: string, slipUrl: string | null): Record<string, unknown> => ({
    quantity: totalQty,
    size: summary,
    items: lines,
    unit_price: lines.length === 1 ? lines[0].unitPrice : null,
    total,
    ref_code: refCode || null,
    user_email: userEmail || null,
    currency: shop.currency,
    customer_name: input.customerName,
    phone: input.phone,
    courier: input.courier,
    province: input.province,
    city: input.city,
    branch: input.branch,
    slip_url: slipUrl,
    status,
  });

  const record: ShopOrderRecord = {
    items: lines,
    sizeSummary: summary,
    totalQty,
    total,
    refCode,
    currency: shop.currency,
    customerName: input.customerName,
    phone: input.phone,
    courier: input.courier,
    province: input.province,
    city: input.city,
    branch: input.branch,
  };

  const db = getSupabaseAdmin();

  // ── RESERVE ─────────────────────────────────────────────────────────────
  // Save as awaiting_payment so it shows in /admin and the buyer's My Orders
  // with a countdown; no slip, no email yet (no money has moved).
  if (intent === "reserve") {
    let id: string | undefined;
    let createdAt: string | undefined;
    if (db) {
      const res = await insertOrder(db, baseRow("awaiting_payment", null));
      if (res.error) return NextResponse.json({ error: res.error }, { status: 500 });
      id = res.id;
      createdAt = res.createdAt;
    }
    return NextResponse.json({
      ok: true,
      id,
      order: { ...record, id, createdAt, status: "awaiting_payment" },
    });
  }

  // ── PAY ─────────────────────────────────────────────────────────────────
  // Buyer attached a slip and declared the transfer. Update the reserved order
  // if we have its id, otherwise insert a fresh paid order so nothing is lost.
  const slipUrl = await uploadSlip(body.slip);
  let id: string | undefined = orderId || undefined;
  if (db) {
    let updated = false;
    if (orderId) {
      // Set updated_at explicitly (the DB trigger isn't relied on) so the order's
      // time reflects the transfer moment.
      const changedAt = new Date().toISOString();
      let { error } = await db
        .from("shop_orders")
        .update({ slip_url: slipUrl ?? null, status: "paid_declared", updated_at: changedAt })
        .eq("id", orderId);
      if (error && /slip_url/.test(error.message)) {
        ({ error } = await db
          .from("shop_orders")
          .update({ status: "paid_declared", updated_at: changedAt })
          .eq("id", orderId));
      }
      updated = !error;
    }
    if (!updated) {
      const res = await insertOrder(db, baseRow("paid_declared", slipUrl ?? null));
      if (res.error) return NextResponse.json({ error: res.error }, { status: 500 });
      id = res.id;
    }
  }

  const paidRecord: ShopOrderRecord = { ...record, slipUrl, status: "paid_declared" };

  // Push the team an instant on-screen alert (best-effort — works even when the
  // admin tab is closed / phone is asleep). Only fires on a declared transfer.
  try {
    const amount = `${total.toLocaleString("en-US")} ${shop.currency}`;
    await sendPushToAll({
      title: "💰 มีออเดอร์โอนเงินแล้ว",
      body: `${input.customerName} · ${summary} · ${amount}${refCode ? ` · ${refCode}` : ""}`,
      url: "/admin",
      tag: `nm-order-${id ?? refCode ?? Date.now()}`,
    });
  } catch {
    /* push is best-effort — the order is already stored */
  }

  // Notify the team by email (best-effort) through the existing Formspree endpoint.
  if (formspree) {
    try {
      await fetch(formspree, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `NIIGHTMARE jersey order — ${input.customerName}`,
          message:
            buildOrderMessage(shop, paidRecord, "en") +
            (refCode ? `\nOrder reference: ${refCode}` : "") +
            (slipUrl ? `\nPayment slip: ${slipUrl}` : `\nPayment slip: (not attached)`),
          name: input.customerName,
          phone: input.phone,
        }),
      });
    } catch {
      /* email is best-effort — the order is already stored */
    }
  }

  return NextResponse.json({ ok: true, id, order: { ...paidRecord, id } });
}
