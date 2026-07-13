import "server-only";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { deleteFromStorage } from "./supabaseStorage";
import { SHOP_ORDER_PERSONAL_DATA_RETENTION_DAYS } from "./shop";

export const ORDER_PERSONAL_DATA_RETENTION_DAYS = SHOP_ORDER_PERSONAL_DATA_RETENTION_DAYS;

interface RetentionOrder {
  id: string;
  status: string | null;
  slip_url: string | null;
  shipping_image_url: string | null;
}

export interface OrderRetentionResult {
  cutoff: string;
  anonymized: number;
  unpaidDeleted: number;
  filesDeleted: number;
  subscriptionsUpdated: number;
  failed: number;
}

/** Remove personal order data and evidence after 30 days while keeping only the
 * non-identifying sales facts used by reports: dates, status, size/items,
 * quantity, unit price, total and currency. Old unpaid reservations are junk,
 * not sales, so they are deleted entirely. */
export async function cleanupExpiredOrderData(now = new Date()): Promise<OrderRetentionResult> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Supabase not configured");
  const cutoff = new Date(
    now.getTime() - ORDER_PERSONAL_DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const result: OrderRetentionResult = {
    cutoff,
    anonymized: 0,
    unpaidDeleted: 0,
    filesDeleted: 0,
    subscriptionsUpdated: 0,
    failed: 0,
  };

  const { data, error } = await db
    .from("shop_orders")
    .select("id, status, slip_url, shipping_image_url")
    .lt("created_at", cutoff)
    .is("anonymized_at", null)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);

  const retiredIds = new Set<string>();
  for (const order of (data ?? []) as RetentionOrder[]) {
    const refs = [order.slip_url, order.shipping_image_url].filter(
      (value): value is string => Boolean(value)
    );
    let storageOk = true;
    for (const ref of refs) {
      const removed = await deleteFromStorage(ref);
      if (removed) result.filesDeleted++;
      else storageOk = false;
    }
    // Never discard the only DB pointer to sensitive evidence if Storage failed;
    // leave the row untouched so tomorrow's run can retry.
    if (!storageOk) {
      result.failed++;
      continue;
    }

    if (order.status === "awaiting_payment") {
      const { error: deleteError } = await db.from("shop_orders").delete().eq("id", order.id);
      if (deleteError) {
        result.failed++;
        continue;
      }
      result.unpaidDeleted++;
    } else {
      const { error: updateError } = await db
        .from("shop_orders")
        .update({
          customer_name: "Deleted after 30 days",
          phone: null,
          user_email: null,
          province: null,
          city: null,
          branch: null,
          note: null,
          ref_code: null,
          slip_url: null,
          shipping_image_url: null,
          anonymized_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", order.id)
        .is("anonymized_at", null);
      if (updateError) {
        result.failed++;
        continue;
      }
      result.anonymized++;
    }
    retiredIds.add(order.id);
  }

  if (retiredIds.size) {
    const { data: subscriptions, error: subError } = await db
      .from("shop_push_subscriptions")
      .select("id, order_ids")
      .limit(1000);
    if (!subError) {
      for (const subscription of (subscriptions ?? []) as {
        id: string;
        order_ids: unknown;
      }[]) {
        const current = Array.isArray(subscription.order_ids)
          ? subscription.order_ids.map(String)
          : [];
        const remaining = current.filter((id) => !retiredIds.has(id));
        if (remaining.length === current.length) continue;
        const mutation = remaining.length
          ? db
              .from("shop_push_subscriptions")
              .update({ order_ids: remaining, updated_at: now.toISOString() })
              .eq("id", subscription.id)
          : db.from("shop_push_subscriptions").delete().eq("id", subscription.id);
        const { error: mutationError } = await mutation;
        if (mutationError) result.failed++;
        else result.subscriptionsUpdated++;
      }
    } else {
      result.failed++;
    }
  }

  return result;
}
