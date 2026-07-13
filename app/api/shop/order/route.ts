import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  deleteFromStorage,
  normalizeOrderEvidenceImage,
  uploadOrderEvidence,
} from "@/lib/supabaseStorage";
import { contentFromSupabase } from "@/lib/contentFromSupabase";
import { sendPushToAll } from "@/lib/push";
import {
  resolveShop,
  computeOrder,
  summariseLines,
  validateOrder,
  buildOrderMessage,
  cleanRefCode,
  SHOP_PAYMENT_WINDOW_HOURS,
  type ShopContent,
  type ShopOrderInput,
  type ShopOrderItem,
  type ShopOrderLine,
  type ShopOrderRecord,
} from "@/lib/shop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_EMAIL_ENABLED = process.env.SHOP_ORDER_EMAIL_NOTIFICATIONS === "true";
const HITS = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const MAX = 6;
const SLIP_MAX_BYTES = 4 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (HITS.get(ip) ?? []).filter((time) => now - time < WINDOW);
  hits.push(now);
  HITS.set(ip, hits);
  return hits.length > MAX;
}

const str = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

async function shopContext(): Promise<{ shop: ShopContent; formspree: string }> {
  let shop = resolveShop(null);
  let formspree = "";
  try {
    const content = await contentFromSupabase();
    const site = content?.site as
      | { shop?: Partial<ShopContent>; formspreeEndpoint?: string }
      | undefined;
    shop = resolveShop(site?.shop ?? null);
    formspree = site?.formspreeEndpoint ?? "";
  } catch {
    // Defaults keep the shop page functional during a brief content-read outage.
  }
  return { shop, formspree };
}

/** Validate actual image bytes, strip metadata, and upload to the private order
 * evidence bucket. The returned value is an opaque storage ref, not a URL. */
async function uploadSlip(slip: unknown): Promise<string | undefined> {
  if (typeof slip !== "string") return undefined;
  const match = /^data:image\/(?:png|jpeg|webp);base64,([\s\S]+)$/.exec(slip);
  if (!match) return undefined;
  try {
    const input = Buffer.from(match[1], "base64");
    if (!input.length || input.length > SLIP_MAX_BYTES) return undefined;
    const normalized = await normalizeOrderEvidenceImage(input, SLIP_MAX_BYTES);
    if (!normalized) return undefined;
    return await uploadOrderEvidence(`shop-slips/${randomUUID()}.jpg`, normalized, "image/jpeg");
  } catch {
    return undefined;
  }
}

function asLine(value: unknown): ShopOrderLine | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const quantity = Math.max(0, Math.floor(Number(row.quantity) || 0));
  const unitPrice = Math.max(0, Math.floor(Number(row.unitPrice) || 0));
  const lineTotal = Math.max(0, Math.floor(Number(row.lineTotal) || unitPrice * quantity));
  const sizeId = str(row.sizeId, 20);
  const label = str(row.label, 40);
  return sizeId && label && quantity > 0
    ? { sizeId, label, quantity, unitPrice, lineTotal }
    : null;
}

/** Build notifications/responses from the authoritative reserved DB row, never
 * from fields re-submitted by a modified payment client. */
function recordFromRow(row: Record<string, unknown>): ShopOrderRecord {
  const items = (Array.isArray(row.items) ? row.items : [])
    .map(asLine)
    .filter((line): line is ShopOrderLine => Boolean(line));
  return {
    id: str(row.id, 64),
    items,
    sizeSummary: str(row.size, 300),
    totalQty: Math.max(0, Math.floor(Number(row.quantity) || 0)),
    total: Math.max(0, Math.floor(Number(row.total) || 0)),
    refCode: cleanRefCode(row.ref_code),
    currency: str(row.currency, 12) || "LAK",
    customerName: str(row.customer_name, 120),
    phone: str(row.phone, 60),
    courier: str(row.courier, 80),
    province: str(row.province, 80),
    city: str(row.city, 80),
    branch: str(row.branch, 120),
    createdAt: str(row.created_at, 64),
    status: str(row.status, 40),
  };
}

async function declarePayment(
  body: Record<string, unknown>,
  db: SupabaseClient,
  orderId: string,
  refCode: string
) {
  if (!UUID_RE.test(orderId)) {
    return NextResponse.json({ error: "Bad order id" }, { status: 400 });
  }
  if (!refCode) {
    return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
  }

  const payWindowStart = new Date(
    Date.now() - SHOP_PAYMENT_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();
  const { data: reserved, error: readError } = await db
    .from("shop_orders")
    .select("*")
    .eq("id", orderId)
    .eq("ref_code", refCode)
    .eq("status", "awaiting_payment")
    .gt("created_at", payWindowStart)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!reserved) {
    return NextResponse.json(
      { error: "Order is expired, already paid, or not found" },
      { status: 409 }
    );
  }

  // Validate the reservation before uploading so bogus order IDs cannot leave
  // orphan payment slips in Storage.
  const slipRef = await uploadSlip(body.slip);
  if (!slipRef) {
    return NextResponse.json({ error: "Payment slip is required" }, { status: 400 });
  }

  const paidAt = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from("shop_orders")
    .update({
      slip_url: slipRef,
      status: "paid_declared",
      updated_at: paidAt,
      paid_at: paidAt,
    })
    .eq("id", orderId)
    .eq("ref_code", refCode)
    .eq("status", "awaiting_payment")
    .gt("created_at", payWindowStart)
    .select("*")
    .maybeSingle();

  if (updateError || !updated) {
    await deleteFromStorage(slipRef);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json(
      { error: "Order is expired, already paid, or not found" },
      { status: 409 }
    );
  }

  const paidRecord = recordFromRow(updated as Record<string, unknown>);
  const { shop, formspree } = await shopContext();
  try {
    const amount = `${paidRecord.total.toLocaleString("en-US")} ${paidRecord.currency}`;
    await sendPushToAll({
      title: "💰 มีออเดอร์โอนเงินแล้ว",
      body: `${paidRecord.customerName} · ${paidRecord.sizeSummary} · ${amount}${paidRecord.refCode ? ` · ${paidRecord.refCode}` : ""}`,
      url: "/admin",
      tag: `nm-order-${paidRecord.id}`,
    });
  } catch {
    // Push is best-effort; the paid state is already durable.
  }

  if (ORDER_EMAIL_ENABLED && formspree) {
    try {
      await fetch(formspree, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `NIIGHTMARE jersey order — ${paidRecord.customerName}`,
          message:
            buildOrderMessage(shop, paidRecord, "en") +
            (paidRecord.refCode ? `\nOrder reference: ${paidRecord.refCode}` : "") +
            "\nPayment slip: attached securely in Admin Orders",
          name: paidRecord.customerName,
          phone: paidRecord.phone,
        }),
      });
    } catch {
      // Email is optional and best-effort.
    }
  }

  // Never send the internal storage ref to the buyer's browser/localStorage.
  return NextResponse.json({ ok: true, id: paidRecord.id, order: paidRecord });
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

  const intent = body.intent;
  if (intent !== "reserve" && intent !== "pay") {
    return NextResponse.json({ error: "Invalid order intent" }, { status: 400 });
  }
  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "Order storage is not configured" }, { status: 503 });
  }

  const orderId = str(body.orderId, 64);
  const suppliedRef = cleanRefCode(body.ref);
  if (intent === "pay") return declarePayment(body, db, orderId, suppliedRef);
  // Generate the payment reference server-side with cryptographic randomness;
  // the client displays the returned value and sends it back on PAY.
  const refCode = `NM-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  const rawItems = Array.isArray(body.items) ? (body.items as unknown[]) : [];
  const items: ShopOrderItem[] = rawItems
    .slice(0, 20)
    .map((item) => {
      const value = (item ?? {}) as Record<string, unknown>;
      return {
        sizeId: str(value.sizeId, 12).toLowerCase(),
        quantity: Math.max(0, Math.min(999, Math.floor(Number(value.quantity) || 0))),
      };
    })
    .filter((item) => item.sizeId && item.quantity > 0);
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
  const { shop } = await shopContext();
  if (!shop.enabled) return NextResponse.json({ error: "Shop is closed" }, { status: 403 });
  const { lines, totalQty, total } = computeOrder(shop, input.items);
  if (!lines.length) {
    return NextResponse.json(
      { error: "No available sizes selected", fields: { items: true } },
      { status: 400 }
    );
  }
  const summary = summariseLines(lines);
  const userEmail = str(body.userEmail, 200);
  const row = {
    quantity: totalQty,
    size: summary,
    items: lines,
    unit_price: lines.length === 1 ? lines[0].unitPrice : null,
    total,
    ref_code: refCode,
    user_email: userEmail || null,
    currency: shop.currency,
    customer_name: input.customerName,
    phone: input.phone,
    courier: input.courier,
    province: input.province,
    city: input.city,
    branch: input.branch,
    slip_url: null,
    status: "awaiting_payment",
  };
  const { data, error } = await db
    .from("shop_orders")
    .insert(row)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const record = recordFromRow(data as Record<string, unknown>);
  return NextResponse.json({ ok: true, id: record.id, order: record });
}

// Buyer self-cancel: an order UUID is the capability, and the status guard
// prevents a paid/processing order from being deleted by this public route.
export async function DELETE(request: Request) {
  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = String(body.id || "").trim();
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, deleted: 0 });
  const { data, error } = await db
    .from("shop_orders")
    .delete()
    .eq("id", id)
    .eq("status", "awaiting_payment")
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: data?.length ?? 0 });
}
