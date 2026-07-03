import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadToStorage, deleteFromStorage } from "@/lib/supabaseStorage";
import { sendPushForOrder } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["awaiting_payment", "paid_declared", "verified", "packing", "shipped", "cancelled"]);
const IMAGE_MAX_BYTES = 4 * 1024 * 1024; // 4 MB

async function authed(): Promise<boolean> {
  return !adminDisabled() && verifyToken((await cookies()).get(COOKIE_NAME)?.value);
}

/** Decode a base64 image data URL and upload it to Supabase Storage. Returns the
 *  public URL, or undefined if the payload is invalid/too big/storage is down. */
async function uploadImage(data: unknown): Promise<string | undefined> {
  if (typeof data !== "string" || !data.startsWith("data:image/")) return undefined;
  const m = /^data:(image\/(png|jpeg|webp));base64,([\s\S]+)$/.exec(data);
  if (!m) return undefined;
  try {
    const bytes = Buffer.from(m[3], "base64");
    if (!bytes.length || bytes.length > IMAGE_MAX_BYTES) return undefined;
    const ext = m[2] === "jpeg" ? "jpg" : m[2];
    const name = `shop-shipping/ship-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    return await uploadToStorage(name, bytes, m[1]);
  } catch {
    return undefined;
  }
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
  let body: { id?: string; status?: string; shippingImage?: string; clearShippingImage?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  if (body.status && !STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  // Build the update. Set updated_at explicitly so the order's displayed time
  // tracks the last change (the DB trigger isn't relied on).
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status) update.status = body.status;

  let shippingImageUrl: string | undefined;
  if (body.clearShippingImage) {
    update.shipping_image_url = null;
  } else if (body.shippingImage) {
    shippingImageUrl = await uploadImage(body.shippingImage);
    if (!shippingImageUrl) return NextResponse.json({ error: "อัปโหลดรูปไม่สำเร็จ" }, { status: 400 });
    update.shipping_image_url = shippingImageUrl;
  }

  let { error } = await db.from("shop_orders").update(update).eq("id", body.id);
  // The shipping_image_url column may not exist yet — retry without it so a
  // plain status change still goes through.
  if (error && /shipping_image_url/.test(error.message)) {
    delete update.shipping_image_url;
    ({ error } = await db.from("shop_orders").update(update).eq("id", body.id));
    if (!error && (body.shippingImage || body.clearShippingImage)) {
      return NextResponse.json(
        { error: "ยังไม่มีคอลัมน์ shipping_image_url ใน DB (รันสคริปต์ migration ก่อน)" },
        { status: 500 }
      );
    }
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify the buyer's opted-in devices on a positive milestone (verified /
  // packing / shipped) — fires even when their site is closed. Best-effort:
  // a no-op unless they enabled notifications, and never blocks the response.
  if (body.status) {
    try {
      await sendPushForOrder(body.id, body.status);
    } catch {
      /* push is best-effort */
    }
  }

  return NextResponse.json({ ok: true, shippingImageUrl: shippingImageUrl ?? null });
}

export async function DELETE(request: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  // Read the order's uploaded image URLs first so we can purge them from Storage
  // after the row is gone (deleting the row alone orphans the slip/shipping image
  // in the `uploads` bucket). `select("*")` tolerates the optional columns
  // (slip_url / shipping_image_url) not existing yet.
  const { data: existing } = await db.from("shop_orders").select("*").eq("id", body.id).maybeSingle();

  const { error } = await db.from("shop_orders").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort cleanup — never fail the delete if storage removal doesn't land.
  const imageUrls = [
    (existing as { slip_url?: string | null } | null)?.slip_url,
    (existing as { shipping_image_url?: string | null } | null)?.shipping_image_url,
  ].filter((u): u is string => typeof u === "string" && u.length > 0);
  for (const url of imageUrls) {
    try {
      await deleteFromStorage(url);
    } catch {
      /* storage cleanup is best-effort */
    }
  }

  return NextResponse.json({ ok: true });
}
