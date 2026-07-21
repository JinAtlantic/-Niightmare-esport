import "server-only";

import { randomUUID } from "node:crypto";
import {
  generateOrderReference,
  orderReferenceCapacity,
  ORDER_REFERENCE_START_LENGTH,
} from "@/lib/orderReference";
import {
  cleanRefCode,
  SHOP_PAYMENT_WINDOW_HOURS,
  type ShopOrderLine,
  type ShopOrderRecord,
} from "@/lib/shop";

export const SHOP_E2E_HEADER = "X-NIIGHTMARE-SHOP-E2E";
export const SHOP_E2E_HEADERS = {
  [SHOP_E2E_HEADER]: "1",
  "Cache-Control": "no-store, private",
  Pragma: "no-cache",
} as const;

/**
 * The test store is deliberately impossible to select on the public hostname.
 * This second lock matters even if SHOP_E2E_MODE is accidentally configured on
 * a deployment: only a loopback request can enter the in-memory code path.
 */
export function isShopE2ERequest(request: Request): boolean {
  if (process.env.SHOP_E2E_MODE !== "true") return false;
  try {
    const loopback = (value: string) => {
      const hostname = value.trim().toLowerCase().replace(/:\d+$/, "");
      return hostname === "127.0.0.1" || hostname === "localhost";
    };
    const candidates = [
      new URL(request.url).hostname,
      request.headers.get("host")?.split(",")[0],
      request.headers.get("x-forwarded-host")?.split(",")[0],
    ].filter((value): value is string => Boolean(value));
    return candidates.length > 0 && candidates.every(loopback);
  } catch {
    return false;
  }
}

export interface ShopE2EOrderRow {
  id: string;
  created_at: string;
  updated_at: string | null;
  paid_at: string | null;
  quantity: number;
  size: string;
  items: ShopOrderLine[];
  unit_price: number | null;
  total: number;
  ref_code: string;
  user_email: string | null;
  currency: string;
  customer_name: string;
  phone: string;
  courier: string;
  province: string;
  city: string;
  branch: string;
  slip_url: string | null;
  shipping_image_url: string | null;
  status: string;
}

type NewShopE2EOrder = Omit<
  ShopE2EOrderRow,
  "id" | "created_at" | "updated_at" | "paid_at" | "ref_code" | "shipping_image_url"
>;

declare global {
  // eslint-disable-next-line no-var
  var __niightmareShopE2EOrders: Map<string, ShopE2EOrderRow> | undefined;
}

function orders(): Map<string, ShopE2EOrderRow> {
  globalThis.__niightmareShopE2EOrders ??= new Map<string, ShopE2EOrderRow>();
  return globalThis.__niightmareShopE2EOrders;
}

export function createShopE2EOrder(input: NewShopE2EOrder): ShopE2EOrderRow {
  const now = new Date().toISOString();
  const usedReferences = new Set([...orders().values()].map((order) => order.ref_code));
  let referenceLength = ORDER_REFERENCE_START_LENGTH;
  while (
    BigInt([...usedReferences].filter((reference) => reference.length === referenceLength).length) >=
    orderReferenceCapacity(referenceLength)
  ) {
    referenceLength += 1;
  }
  let refCode = generateOrderReference(referenceLength);
  while (usedReferences.has(refCode)) refCode = generateOrderReference(referenceLength);
  const row: ShopE2EOrderRow = {
    ...input,
    ref_code: refCode,
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    paid_at: null,
    shipping_image_url: null,
  };
  orders().set(row.id, row);
  return row;
}

export function getShopE2EOrder(id: string): ShopE2EOrderRow | undefined {
  return orders().get(id);
}

export function listShopE2EOrders(): ShopE2EOrderRow[] {
  return [...orders().values()].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  );
}

export function resetShopE2EOrders(): void {
  orders().clear();
}

export function declareShopE2EPayment(
  id: string,
  refCode: string,
  slip: string
): ShopE2EOrderRow | undefined {
  const row = orders().get(id);
  if (!row || row.ref_code !== refCode || row.status !== "awaiting_payment") return undefined;
  const cutoff = Date.now() - SHOP_PAYMENT_WINDOW_HOURS * 60 * 60 * 1000;
  if (Date.parse(row.created_at) <= cutoff) return undefined;
  const now = new Date().toISOString();
  const updated = {
    ...row,
    slip_url: slip,
    status: "paid_declared",
    paid_at: now,
    updated_at: now,
  };
  orders().set(id, updated);
  return updated;
}

export function patchShopE2EOrder(
  id: string,
  changes: { status?: string; shippingImage?: string; clearShippingImage?: boolean }
): ShopE2EOrderRow | undefined {
  const row = orders().get(id);
  if (!row) return undefined;
  const updated: ShopE2EOrderRow = {
    ...row,
    ...(changes.status ? { status: changes.status } : {}),
    ...(changes.clearShippingImage ? { shipping_image_url: null } : {}),
    ...(changes.shippingImage ? { shipping_image_url: changes.shippingImage } : {}),
    updated_at: new Date().toISOString(),
  };
  orders().set(id, updated);
  return updated;
}

export function deleteShopE2EOrder(id: string, awaitingOnly = false): boolean {
  const row = orders().get(id);
  if (!row || (awaitingOnly && row.status !== "awaiting_payment")) return false;
  return orders().delete(id);
}

export function shopE2ERecord(row: ShopE2EOrderRow): ShopOrderRecord {
  return {
    id: row.id,
    items: row.items,
    sizeSummary: row.size,
    totalQty: row.quantity,
    total: row.total,
    refCode: cleanRefCode(row.ref_code),
    currency: row.currency,
    customerName: row.customer_name,
    phone: row.phone,
    courier: row.courier,
    province: row.province,
    city: row.city,
    branch: row.branch,
    createdAt: row.created_at,
    status: row.status,
  };
}
