import "server-only";
import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Web Push for admin order alerts. Set these in .env.local and Vercel:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY   (also used by the browser to subscribe)
 *   VAPID_PRIVATE_KEY              (secret, server only)
 *   VAPID_SUBJECT                  (mailto: address, optional — defaults below)
 * Generate a keypair once with: `node -e "console.log(require('web-push').generateVAPIDKeys())"`.
 */
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@niightmareesport.com";

export const pushEnabled = Boolean(PUBLIC_KEY && PRIVATE_KEY);

let configured = false;
function ensureConfigured() {
  if (configured || !pushEnabled) return;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface SubRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Send a push to every stored subscription, pruning ones the browser has dropped
 *  (410 Gone / 404). Best-effort: never throws to the caller. */
export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; pruned: number }> {
  if (!pushEnabled) return { sent: 0, pruned: 0 };
  const db = getSupabaseAdmin();
  if (!db) return { sent: 0, pruned: 0 };
  ensureConfigured();

  const { data, error } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  if (error || !data?.length) return { sent: 0, pruned: 0 };

  const body = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;

  await Promise.all(
    (data as SubRow[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id);
      }
    })
  );

  if (dead.length) await db.from("push_subscriptions").delete().in("id", dead);
  return { sent, pruned: dead.length };
}

/* ── Buyer (shop) push ─────────────────────────────────────────────────────
 * Sends order-milestone alerts to the buyers' devices (keyed on the order ids a
 * device opted in for). Independent of the admin subscriptions above. */

export type ShopMilestone = "verified" | "packing" | "shipped";

const SHOP_NOTIFY: Record<ShopMilestone, { en: PushPayload; lo: PushPayload }> = {
  verified: {
    en: { title: "Payment confirmed ✓", body: "We're preparing your order for shipping." },
    lo: { title: "ຢືນຢັນການຈ່າຍແລ້ວ ✓", body: "ພວກເຮົາກຳລັງກຽມຈັດສົ່ງອໍເດີຂອງທ່ານ." },
  },
  packing: {
    en: { title: "Packing your order 📦", body: "We're packing your jersey — shipping soon." },
    lo: { title: "ກຳລັງແພັກເຄື່ອງ 📦", body: "ພວກເຮົາກຳລັງແພັກເສື້ອ — ໃກ້ຈັດສົ່ງແລ້ວ." },
  },
  shipped: {
    en: { title: "Your order shipped 🚚", body: "It's on the way — tap to see the parcel details." },
    lo: { title: "ອໍເດີຂອງທ່ານຈັດສົ່ງແລ້ວ 🚚", body: "ກຳລັງຈັດສົ່ງ — ກົດເບິ່ງລາຍລະອຽດພັດສະດຸ." },
  },
};

interface ShopSubRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  lang: string | null;
}

/** Push an order milestone to every device that opted in for this order id, in
 *  each device's chosen language. Best-effort; prunes dead endpoints; never
 *  throws (a missing table just yields 0/0). */
export async function sendPushForOrder(
  orderId: string,
  status: string
): Promise<{ sent: number; pruned: number }> {
  const milestone = status as ShopMilestone;
  if (!pushEnabled || !SHOP_NOTIFY[milestone] || !orderId) return { sent: 0, pruned: 0 };
  const db = getSupabaseAdmin();
  if (!db) return { sent: 0, pruned: 0 };
  ensureConfigured();

  const { data, error } = await db
    .from("shop_push_subscriptions")
    .select("id, endpoint, p256dh, auth, lang")
    .contains("order_ids", [orderId]);
  if (error || !data?.length) return { sent: 0, pruned: 0 };

  const dead: string[] = [];
  let sent = 0;
  await Promise.all(
    (data as ShopSubRow[]).map(async (s) => {
      const copy = SHOP_NOTIFY[milestone][s.lang === "lo" ? "lo" : "en"];
      const body = JSON.stringify({ ...copy, url: "/shop?view=orders", tag: `nm-shop-${orderId}` });
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id);
      }
    })
  );

  if (dead.length) await db.from("shop_push_subscriptions").delete().in("id", dead);
  return { sent, pruned: dead.length };
}
