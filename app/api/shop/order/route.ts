import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { contentFromSupabase } from "@/lib/contentFromSupabase";
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

/** Decode a base64 image data URL and upload the payment slip to Vercel Blob.
 *  Best-effort: returns undefined (order still saves) if storage isn't set up
 *  or the payload is invalid/too big. */
async function uploadSlip(slip: unknown): Promise<string | undefined> {
  if (typeof slip !== "string" || !slip.startsWith("data:image/")) return undefined;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return undefined;
  const m = /^data:(image\/(png|jpeg|webp));base64,([\s\S]+)$/.exec(slip);
  if (!m) return undefined;
  try {
    const bytes = Buffer.from(m[3], "base64");
    if (!bytes.length || bytes.length > SLIP_MAX_BYTES) return undefined;
    const ext = m[2] === "jpeg" ? "jpg" : m[2];
    const { put } = await import("@vercel/blob");
    const name = `shop-slips/slip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(name, bytes, {
      access: "public",
      contentType: m[1],
      token,
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000,
    });
    return blob.url;
  } catch {
    return undefined;
  }
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

  // Upload the customer's payment slip (best-effort; order still saves without it).
  const slipUrl = await uploadSlip(body.slip);

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
    slipUrl,
  };

  // Persist to Supabase (source of truth for the admin Orders tab).
  const db = getSupabaseAdmin();
  let id: string | undefined;
  if (db) {
    const row: Record<string, unknown> = {
      quantity: totalQty,
      size: summary,
      items: lines,
      unit_price: lines.length === 1 ? lines[0].unitPrice : null,
      total,
      ref_code: refCode || null,
      currency: shop.currency,
      customer_name: input.customerName,
      phone: input.phone,
      courier: input.courier,
      province: input.province,
      city: input.city,
      branch: input.branch,
      slip_url: slipUrl ?? null,
      status: "paid_declared",
    };
    let { data, error } = await db.from("shop_orders").insert(row).select("id").single();
    // Resilience: if an optional column hasn't been added to the table yet
    // (items / ref_code / slip_url), drop it and retry instead of 500ing.
    let guard = 0;
    while (error && guard < 3) {
      const col = ["items", "ref_code", "slip_url"].find((c) => error!.message.includes(c));
      if (!col) break;
      delete row[col];
      guard++;
      ({ data, error } = await db.from("shop_orders").insert(row).select("id").single());
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    id = data?.id as string | undefined;
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
            buildOrderMessage(shop, record, "en") +
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

  return NextResponse.json({ ok: true, id, order: { ...record, id, refCode, slipUrl, status: "paid_declared" } });
}
