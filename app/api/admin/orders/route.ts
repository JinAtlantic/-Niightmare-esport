import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  deleteFromStorage,
  signedStorageUrl,
} from "@/lib/supabaseStorage";
import { uploadEvidenceDataUrl } from "@/lib/orderEvidenceUpload";
import { sendPushForOrder } from "@/lib/push";
import {
  SHOP_E2E_HEADERS,
  deleteShopE2EOrder,
  isShopE2ERequest,
  listShopE2EOrders,
  patchShopE2EOrder,
} from "@/lib/shopE2EStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set([
  "awaiting_payment",
  "paid_declared",
  "verified",
  "packing",
  "shipped",
  "cancelled",
]);
const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authed(): Promise<boolean> {
  return !adminDisabled() && verifyToken((await cookies()).get(COOKIE_NAME)?.value);
}

function testImage(data: unknown): string | undefined {
  if (typeof data !== "string") return undefined;
  const match = /^data:image\/(?:png|jpeg|webp);base64,([\s\S]+)$/.exec(data);
  if (!match) return undefined;
  try {
    const bytes = Buffer.from(match[1], "base64");
    return bytes.length > 0 && bytes.length <= IMAGE_MAX_BYTES ? data : undefined;
  } catch {
    return undefined;
  }
}

async function exposeEvidence(row: Record<string, unknown>) {
  const [slipUrl, shippingUrl] = await Promise.all([
    signedStorageUrl(row.slip_url as string | null, 60 * 60),
    signedStorageUrl(row.shipping_image_url as string | null, 60 * 60),
  ]);
  return { ...row, slip_url: slipUrl, shipping_image_url: shippingUrl };
}

export async function GET(request: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isShopE2ERequest(request)) {
    return NextResponse.json(
      { orders: listShopE2EOrders() },
      { headers: SHOP_E2E_HEADERS }
    );
  }
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ orders: [] });
  const { data, error } = await db
    .from("shop_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const orders = await Promise.all(
    ((data ?? []) as Record<string, unknown>[]).map(exposeEvidence)
  );
  return NextResponse.json(
    { orders },
    { headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" } }
  );
}

export async function PATCH(request: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: string; status?: string; shippingImage?: string; clearShippingImage?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id || !UUID_RE.test(body.id)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (body.status && !STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!body.status && !body.shippingImage && !body.clearShippingImage) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  if (isShopE2ERequest(request)) {
    const shippingImage = body.shippingImage ? testImage(body.shippingImage) : undefined;
    if (body.shippingImage && !shippingImage) {
      return NextResponse.json(
        { error: "อัปโหลดรูปไม่สำเร็จ" },
        { status: 400, headers: SHOP_E2E_HEADERS }
      );
    }
    const updated = patchShopE2EOrder(body.id, {
      status: body.status,
      shippingImage,
      clearShippingImage: body.clearShippingImage,
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404, headers: SHOP_E2E_HEADERS }
      );
    }
    return NextResponse.json(
      {
        ok: true,
        shippingImageUrl: shippingImage ?? (body.clearShippingImage ? null : undefined),
      },
      { headers: SHOP_E2E_HEADERS }
    );
  }

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { data: existing, error: readError } = await db
    .from("shop_orders")
    .select("id, shipping_image_url")
    .eq("id", body.id)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const oldRef = (existing as { shipping_image_url?: string | null }).shipping_image_url ?? null;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status) update.status = body.status;

  let newRef: string | undefined;
  if (body.clearShippingImage) {
    update.shipping_image_url = null;
  } else if (body.shippingImage) {
    const shippingUpload = await uploadEvidenceDataUrl(body.shippingImage, "shop-shipping");
    if (!shippingUpload.ok) {
      const status = shippingUpload.reason === "storage_failed" ? 503 : 400;
      return NextResponse.json(
        {
          code: shippingUpload.reason,
          error:
            shippingUpload.reason === "storage_failed"
              ? "ระบบเก็บรูปไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่"
              : "ประมวลผลรูปไม่สำเร็จ กรุณาใช้ JPG, PNG หรือ WebP ขนาดต่ำกว่า 25 MB",
        },
        { status }
      );
    }
    newRef = shippingUpload.ref;
    update.shipping_image_url = newRef;
  }

  const { error } = await db.from("shop_orders").update(update).eq("id", body.id);
  if (error) {
    if (newRef) await deleteFromStorage(newRef);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Only delete the prior object after the row safely points at the replacement.
  if ((body.clearShippingImage || newRef) && oldRef && oldRef !== newRef) {
    await deleteFromStorage(oldRef);
  }

  if (body.status) {
    try {
      await sendPushForOrder(body.id, body.status);
    } catch {
      // Push is best-effort.
    }
  }

  return NextResponse.json({
    ok: true,
    shippingImageUrl: newRef ? await signedStorageUrl(newRef, 60 * 60) : null,
  });
}

export async function DELETE(request: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id || !UUID_RE.test(body.id)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (isShopE2ERequest(request)) {
    const deleted = deleteShopE2EOrder(body.id);
    return deleted
      ? NextResponse.json({ ok: true }, { headers: SHOP_E2E_HEADERS })
      : NextResponse.json(
          { error: "Order not found" },
          { status: 404, headers: SHOP_E2E_HEADERS }
        );
  }
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  const { data: existing } = await db
    .from("shop_orders")
    .select("slip_url, shipping_image_url")
    .eq("id", body.id)
    .maybeSingle();
  const { error } = await db.from("shop_orders").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const refs = [
    (existing as { slip_url?: string | null } | null)?.slip_url,
    (existing as { shipping_image_url?: string | null } | null)?.shipping_image_url,
  ].filter((value): value is string => Boolean(value));
  await Promise.all(refs.map((ref) => deleteFromStorage(ref)));
  return NextResponse.json({ ok: true });
}
