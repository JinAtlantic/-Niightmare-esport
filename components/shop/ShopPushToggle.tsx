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
  enable: { en: "Turn on notifications", lo: "ເປີດການແຈ້ງເຕືອນ" },
  off: { en: "Turn off notifications", lo: "ປິດການແຈ້ງເຕືອນ" },
  working: { en: "Working…", lo: "ກຳລັງດຳເນີນ…" },
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
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
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
  if (state === "loading" || state === "unsupported" || state === "no-key" || state === "ios-install") return null;

  const isOn = state === "on";

  return (
    <button
      type="button"
      onClick={isOn ? disable : enable}
      disabled={busy || state === "denied"}
      aria-pressed={isOn}
      className={`mb-4 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md border px-4 py-2 font-display text-sm font-bold uppercase tracking-[0.1em] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        isOn
          ? "border-win/55 bg-win/10 text-win hover:bg-win/20"
          : "border-amethyst bg-amethyst/20 text-soul hover:bg-amethyst/30"
      }`}
    >
      <span aria-hidden>{isOn ? "🔕" : "🔔"}</span>
      {busy ? pick(COPY.working) : pick(isOn ? COPY.off : COPY.enable)}
    </button>
  );
}
