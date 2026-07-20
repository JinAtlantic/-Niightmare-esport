import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { signedStorageUrl } from "@/lib/supabaseStorage";
import {
  SHOP_E2E_HEADERS,
  getShopE2EOrder,
  isShopE2ERequest,
} from "@/lib/shopE2EStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public, read-only status lookup for the buyer's "My Orders" (which lives in
// localStorage and otherwise never learns about admin status changes). The buyer
// passes the order ids they already hold — UUIDs are unguessable, and we only
// return the non-sensitive status + shipping image, never customer details.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s))
    .slice(0, 50);

  if (!ids.length) return NextResponse.json({ synced: false, orders: [] });

  if (isShopE2ERequest(request)) {
    const orders = ids.flatMap((id) => {
      const row = getShopE2EOrder(id);
      return row
        ? [{ id: row.id, status: row.status, shippingImageUrl: row.shipping_image_url }]
        : [];
    });
    return NextResponse.json(
      { synced: true, orders },
      { headers: SHOP_E2E_HEADERS }
    );
  }

  const db = getSupabaseAdmin();
  // No DB → report not-synced so the client leaves its local copies untouched
  // (rather than treating every order as deleted).
  if (!db) return NextResponse.json({ synced: false, orders: [] });

  // Select the shipping image too, retrying without it if the column isn't there.
  let res = await db.from("shop_orders").select("id, status, shipping_image_url").in("id", ids);
  if (res.error && /shipping_image_url/.test(res.error.message)) {
    res = (await db.from("shop_orders").select("id, status").in("id", ids)) as typeof res;
  }
  if (res.error) return NextResponse.json({ synced: false, orders: [] });

  const orders = await Promise.all(
    ((res.data ?? []) as Record<string, unknown>[]).map(async (r) => ({
      id: r.id as string,
      status: r.status as string,
      shippingImageUrl: await signedStorageUrl(
        (r as { shipping_image_url?: string | null }).shipping_image_url
      ),
    }))
  );
  return NextResponse.json(
    { synced: true, orders },
    { headers: { "Cache-Control": "no-store, private", Pragma: "no-cache" } }
  );
}
