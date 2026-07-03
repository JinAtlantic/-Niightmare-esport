"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import type { Bilingual } from "@/lib/types";
import type { ShopOrderRecord } from "@/lib/shop";

/**
 * In-site order notifier — no login, no OS permission, no app install.
 *
 * The buyer's orders live in localStorage (`nm-shop-orders`). This runs on every
 * public page: it reads those order ids, asks the public status endpoint for the
 * latest status, and pops an in-page toast the moment an order reaches a positive
 * milestone the buyer hasn't seen yet (payment confirmed / shipped). It only ever
 * fetches when this device actually has orders, so non-buyers cost nothing.
 *
 * "Seen" is tracked in its own key (`nm-shop-status-seen`) so a status only ever
 * toasts once, even across page loads — independent of the My Orders list that
 * ShopClient maintains.
 */

const ORDERS_KEY = "nm-shop-orders";
const SEEN_KEY = "nm-shop-status-seen";
const POLL_MS = 90_000;
const AUTO_DISMISS_MS = 12_000;
const SETTLE_MS = 2_500;

/** Only these positive milestones ping the buyer (chosen by the shop owner). */
const NOTIFY: Record<string, { title: Bilingual; body: Bilingual; accent: string }> = {
  verified: {
    title: { en: "Payment confirmed ✓", lo: "ຢືນຢັນການຈ່າຍແລ້ວ ✓" },
    body: { en: "We're preparing your order for shipping.", lo: "ພວກເຮົາກຳລັງກຽມຈັດສົ່ງອໍເດີຂອງທ່ານ." },
    accent: "!border-l-win",
  },
  shipped: {
    title: { en: "Your order shipped 🚚", lo: "ອໍເດີຂອງທ່ານຈັດສົ່ງແລ້ວ 🚚" },
    body: { en: "It's on the way — tap to see the parcel details.", lo: "ກຳລັງຈັດສົ່ງ — ກົດເບິ່ງລາຍລະອຽດພັດສະດຸ." },
    accent: "!border-l-glow",
  },
};

interface ToastItem {
  id: string;
  refCode: string;
  status: keyof typeof NOTIFY | string;
}

const toastKey = (t: { id: string; status: string }) => `${t.id}:${t.status}`;

function readOrders(): ShopOrderRecord[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ShopOrderRecord[]) : [];
  } catch {
    return [];
  }
}

function readSeen(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeSeen(map: Record<string, string>) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export default function OrderStatusToast() {
  const { pick } = useLanguage();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const dismiss = useCallback((key: string) => {
    setToasts((prev) => prev.filter((t) => toastKey(t) !== key));
    const h = timersRef.current[key];
    if (h) {
      window.clearTimeout(h);
      delete timersRef.current[key];
    }
  }, []);

  const poll = useCallback(async () => {
    if (document.visibilityState === "hidden") return;

    const orders = readOrders();
    const localStatus: Record<string, string> = {};
    const refById: Record<string, string> = {};
    for (const o of orders) {
      if (!o.id) continue;
      localStatus[o.id] = o.status || "";
      refById[o.id] = o.refCode || "";
    }
    const ids = Object.keys(localStatus).slice(0, 50);
    if (!ids.length) return;

    let json: { synced?: boolean; orders?: { id: string; status: string }[] };
    try {
      const res = await fetch(`/api/shop/order/status?ids=${encodeURIComponent(ids.join(","))}`);
      json = await res.json();
    } catch {
      return; // offline — try again next tick
    }
    if (!json?.synced || !Array.isArray(json.orders)) return;

    const seen = readSeen();
    const fresh: ToastItem[] = [];
    for (const row of json.orders) {
      if (!row?.id) continue;
      // Baseline = last status we already notified for this order, falling back to
      // the status the buyer last saw locally (so a first run doesn't re-announce
      // history, but a change since their last visit still fires once).
      const baseline = seen[row.id] ?? localStatus[row.id] ?? "";
      if (row.status !== baseline && NOTIFY[row.status]) {
        fresh.push({ id: row.id, refCode: refById[row.id] || "", status: row.status });
      }
      seen[row.id] = row.status;
    }
    // Housekeeping — forget orders that are no longer on this device.
    for (const key of Object.keys(seen)) if (!(key in localStatus)) delete seen[key];
    writeSeen(seen);

    if (fresh.length) {
      setToasts((prev) => {
        const have = new Set(prev.map(toastKey));
        const add = fresh.filter((t) => !have.has(toastKey(t)));
        return add.length ? [...prev, ...add] : prev;
      });
    }
  }, []);

  // Poll on settle, on an interval, and whenever the tab regains focus.
  useEffect(() => {
    let alive = true;
    const kick = () => {
      if (alive) poll();
    };
    const settle = window.setTimeout(kick, SETTLE_MS);
    const iv = window.setInterval(kick, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") kick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      window.clearTimeout(settle);
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [poll]);

  // Auto-dismiss each toast after a while.
  useEffect(() => {
    for (const t of toasts) {
      const key = toastKey(t);
      if (!timersRef.current[key]) {
        timersRef.current[key] = window.setTimeout(() => dismiss(key), AUTO_DISMISS_MS);
      }
    }
  }, [toasts, dismiss]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const h of Object.values(timers)) window.clearTimeout(h);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-[95] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-4 sm:items-end"
      role="region"
      aria-label="Order updates"
    >
      {toasts.map((t) => {
        const meta = NOTIFY[t.status];
        if (!meta) return null;
        return (
          <div
            key={toastKey(t)}
            role="status"
            className={`pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-md border border-edge-bright border-l-[3px] bg-crypt/95 p-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur animate-fadeInUp sm:w-[22rem] ${meta.accent}`}
          >
            <a href="/shop?view=orders" className="group min-w-0 flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-soul">{pick(meta.title)}</p>
              <p className="mt-0.5 font-mono text-[11px] leading-snug text-spectre">
                {pick(meta.body)}
                {t.refCode && <span className="keep-latin text-ash"> · {t.refCode}</span>}
              </p>
              <span className="mt-1.5 inline-block font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-glow transition-colors group-hover:text-soul">
                {pick({ en: "View order →", lo: "ເບິ່ງອໍເດີ →" })}
              </span>
            </a>
            <button
              type="button"
              onClick={() => dismiss(toastKey(t))}
              aria-label={pick({ en: "Dismiss", lo: "ປິດ" })}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-edge bg-void/60 text-ash transition-colors hover:border-amethyst hover:text-soul"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
