import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { contentFromSupabase } from "@/lib/contentFromSupabase";
import {
  resolveShop,
  sizePrice,
  validateOrder,
  buildOrderMessage,
  type ShopContent,
  type ShopOrderInput,
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

  const input: ShopOrderInput = {
    quantity: Math.max(1, Math.min(50, Math.floor(Number(body.quantity) || 0))),
    sizeId: str(body.sizeId, 12).toLowerCase(),
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
  const size = shop.sizes.find((s) => s.id === input.sizeId);
  if (!size || !size.inStock) {
    return NextResponse.json({ error: "Size unavailable", fields: { sizeId: true } }, { status: 400 });
  }

  const unitPrice = sizePrice(shop, size);
  const total = unitPrice * input.quantity;
  const record: ShopOrderRecord = {
    ...input,
    sizeLabel: size.label,
    unitPrice,
    total,
    currency: shop.currency,
  };

  // Persist to Supabase (source of truth for the admin Orders tab).
  const db = getSupabaseAdmin();
  let id: string | undefined;
  if (db) {
    const { data, error } = await db
      .from("shop_orders")
      .insert({
        quantity: input.quantity,
        size: size.label,
        unit_price: unitPrice,
        total,
        currency: shop.currency,
        customer_name: input.customerName,
        phone: input.phone,
        courier: input.courier,
        province: input.province,
        city: input.city,
        branch: input.branch,
        status: "paid_declared",
      })
      .select("id")
      .single();
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
          message: buildOrderMessage(shop, record, "en"),
          name: input.customerName,
          phone: input.phone,
        }),
      });
    } catch {
      /* email is best-effort — the order is already stored */
    }
  }

  return NextResponse.json({ ok: true, id, order: { ...record, id, status: "paid_declared" } });
}
