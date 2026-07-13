"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";

/**
 * Buyer opt-in for real Web Push — order alerts that fire even when the site is
 * closed (verified / packing / shipped). No login: the device subscribes against
 * the order UUIDs it holds locally. Works on Android/desktop without any install;
 * on iPhone it needs the site added to the Home Screen first (iOS limitation).
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

const COPY = {
  heading: { en: "Order updates", lo: "ແຈ້ງເຕືອນອໍເດີ" },
  lead: {
    en: "Get a notification when your order is confirmed, packed or shipped — even with this site closed.",
    lo: "ຮັບການແຈ້ງເຕືອນເມື່ອອໍເດີຖືກຢືນຢັນ, ແພັກ ຫຼື ຈັດສົ່ງ — ເຖິງແມ່ນປິດເວັບໄວ້.",
  },
  enable: { en: "Turn on notifications", lo: "ເປີດການແຈ້ງເຕືອນ" },
  on: { en: "Notifications on — this device will be alerted.", lo: "ເປີດແລ້ວ — ເຄື່ອງນີ້ຈະໄດ້ຮັບການແຈ້ງເຕືອນ." },
  off: { en: "Turn off", lo: "ປິດ" },
  fine: { en: "Free · no spam · turn off anytime.", lo: "ຟຣີ · ບໍ່ສະແປມ · ປິດໄດ້ທຸກເມື່ອ." },
  working: { en: "Working…", lo: "ກຳລັງດຳເນີນ…" },
  denied: {
    en: "Notifications are blocked. Enable them for this site in your browser settings.",
    lo: "ການແຈ້ງເຕືອນຖືກບລັອກ. ເປີດໃຫ້ເວັບນີ້ໃນຕັ້ງຄ່າ browser ຂອງທ່ານ.",
  },
  iosInstall: {
    en: "On iPhone: tap Share → “Add to Home Screen”, open it from the icon, then turn this on.",
    lo: "ເທິງ iPhone: ກົດ Share → “Add to Home Screen”, ເປີດຈາກໄອຄອນ ແລ້ວຄ່ອຍເປີດອັນນີ້.",
  },
  unsupported: { en: "This browser doesn't support notifications.", lo: "Browser ນີ້ບໍ່ຮອງຮັບການແຈ້ງເຕືອນ." },
  failed: { en: "Couldn't turn on. Please try again.", lo: "ເປີດບໍ່ສຳເລັດ. ລອງໃໝ່ອີກຄັ້ງ." },
};

type State = "loading" | "unsupported" | "ios-install" | "no-key" | "denied" | "off" | "on";

/** URL-safe base64 VAPID key → the Uint8Array PushManager.subscribe wants. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function ShopPushToggle({ orderIds }: { orderIds: string[] }) {
  const { pick, lang } = useLanguage();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const idsKey = orderIds.join(",");

  /** POST the live subscription + the device's current order ids to the server. */
  const syncSub = useCallback(
    async (sub: PushSubscription) => {
      const json = sub.toJSON();
      await fetch("/api/shop/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          orderIds,
          lang,
          userAgent: navigator.userAgent,
        }),
      });
    },
    [orderIds, lang]
  );

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) {
      const ua = navigator.userAgent;
      const isIos = /iphone|ipad|ipod/i.test(ua);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;
      setState(isIos && !standalone ? "ios-install" : "unsupported");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setState("no-key");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    try {
      const reg =
        (await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<ServiceWorkerRegistration | undefined>((r) => setTimeout(() => r(undefined), 5000)),
        ])) ?? (await navigator.serviceWorker.getRegistration());
      let sub = reg ? await reg.pushManager.getSubscription() : null;
      if (!sub && reg && Notification.permission === "granted") {
        try {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        } catch {
          // Leave it off; the buyer can retry from the explicit button.
        }
      }
      if (sub && Notification.permission === "granted") {
        setState("on");
        syncSub(sub).catch(() => {}); // keep the server's order_ids current
      } else {
        setState("off");
      }
    } catch {
      setState("off");
    }
  }, [syncSub]);

  useEffect(() => {
    (async () => {
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/sw.js");
        } catch {
          /* ignore */
        }
      }
      refresh();
    })();
  }, [refresh]);

  // Browsers can rotate/drop a push subscription while the site is closed.
  // Recheck on foreground so the buyer route (not the admin route) refreshes
  // the endpoint together with its order capabilities.
  useEffect(() => {
    const recheck = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, [refresh]);

  // When the buyer's order list changes while already subscribed, push the new
  // order_ids to the server so a freshly-placed order also gets alerts.
  useEffect(() => {
    if (state !== "on" || !idsKey) return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (sub) syncSub(sub).catch(() => {});
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  async function enable() {
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const res = await fetch("/api/shop/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.toJSON().endpoint,
          keys: sub.toJSON().keys,
          orderIds,
          lang,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error();
      setState("on");
    } catch {
      setMsg(pick(COPY.failed));
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        const endpoint = sub.toJSON().endpoint;
        await sub.unsubscribe().catch(() => {});
        await fetch("/api/shop/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }
      setState("off");
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  // Nothing to show while probing, or where push can't work at all.
  if (state === "loading" || state === "unsupported" || state === "no-key") return null;

  return (
    <div className="mb-4 rounded-md border border-edge bg-crypt/60 p-3.5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 text-lg text-glow">🔔</span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-soul">{pick(COPY.heading)}</p>

          {state === "on" ? (
            <>
              <p className="mt-0.5 font-mono text-[11px] leading-snug text-win">✓ {pick(COPY.on)}</p>
              <button
                type="button"
                onClick={disable}
                disabled={busy}
                className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ash underline transition-colors hover:text-loss disabled:opacity-50"
              >
                {busy ? pick(COPY.working) : pick(COPY.off)}
              </button>
            </>
          ) : state === "denied" ? (
            <p className="mt-0.5 font-mono text-[11px] leading-snug text-loss">{pick(COPY.denied)}</p>
          ) : state === "ios-install" ? (
            <p className="mt-0.5 font-mono text-[11px] leading-snug text-spectre">{pick(COPY.iosInstall)}</p>
          ) : (
            <>
              <p className="mt-0.5 font-mono text-[11px] leading-snug text-spectre">{pick(COPY.lead)}</p>
              <button
                type="button"
                onClick={enable}
                disabled={busy}
                className="mt-2 inline-flex min-h-[40px] items-center justify-center rounded-md border border-amethyst bg-amethyst/20 px-4 py-2 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-all hover:bg-amethyst/30 disabled:opacity-50"
              >
                {busy ? pick(COPY.working) : pick(COPY.enable)}
              </button>
              <p className="mt-1.5 font-mono text-[10px] text-ash-dim">{pick(COPY.fine)}</p>
              {msg && <p className="mt-1 font-mono text-[11px] text-loss">{msg}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
