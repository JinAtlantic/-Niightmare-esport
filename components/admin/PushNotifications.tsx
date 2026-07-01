"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/admin/ui";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

/** Convert the URL-safe base64 VAPID key to the Uint8Array the PushManager wants. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "loading" | "unsupported" | "no-key" | "denied" | "off" | "on";

export default function PushNotifications() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
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
      // Read the subscription from the ACTIVE registration. getRegistration()
      // can resolve before the SW controls the page on a fresh load, so its
      // getSubscription() returns null and the toggle wrongly flips to "off"
      // when you reopen /admin. serviceWorker.ready waits for an active worker;
      // guard it with a timeout so it can never hang the panel.
      const reg =
        (await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<ServiceWorkerRegistration | undefined>((resolve) =>
            setTimeout(() => resolve(undefined), 5000)
          ),
        ])) ?? (await navigator.serviceWorker.getRegistration());
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        setState("on");
        // Re-sync the live subscription so the server never drifts out of step
        // (e.g. after it pruned a transient failure) — keeps alerts flowing.
        const json = sub.toJSON();
        fetch("/api/admin/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent }),
        }).catch(() => {});
      } else {
        setState("off");
      }
    } catch {
      setState("off");
    }
  }, []);

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

  async function enable() {
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        setMsg("ยังไม่ได้รับอนุญาต");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent }),
      });
      if (!res.ok) throw new Error();
      setState("on");
      setMsg("เปิดแล้ว ✅ เครื่องนี้จะได้รับแจ้งเตือน");
    } catch {
      setMsg("เปิดไม่สำเร็จ ลองใหม่อีกครั้ง");
      refresh();
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
        await fetch("/api/admin/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
      setMsg("ปิดแล้ว");
    } catch {
      setMsg("ปิดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/push/test", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "");
      setMsg(`ส่งทดสอบแล้ว → ${json.sent} เครื่อง${json.pruned ? ` (ล้างที่เลิกใช้ ${json.pruned})` : ""}`);
    } catch (e) {
      setMsg(e instanceof Error && e.message ? e.message : "ส่งทดสอบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;

  return (
    <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-2.5 font-mono text-[11px] md:px-6">
      <span className="font-semibold uppercase tracking-[0.14em] text-spectre">🔔 แจ้งเตือนออเดอร์โอนเงิน</span>

      {state === "unsupported" && <span className="text-ash">เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน</span>}
      {state === "no-key" && <span className="text-loss">ยังไม่ได้ตั้งค่า VAPID keys (env)</span>}
      {state === "denied" && (
        <span className="text-loss">ถูกบล็อก — เปิดสิทธิ์ &quot;การแจ้งเตือน&quot; ของเว็บนี้ในตั้งค่าเบราว์เซอร์ก่อน</span>
      )}

      {state === "off" && (
        <Button onClick={enable} disabled={busy}>
          {busy ? "กำลังเปิด…" : "เปิดแจ้งเตือนบนเครื่องนี้"}
        </Button>
      )}

      {state === "on" && (
        <>
          <span className="text-win">เปิดอยู่ ✅</span>
          <Button onClick={test} disabled={busy}>
            {busy ? "…" : "ทดสอบ"}
          </Button>
          <Button variant="ghost" onClick={disable} disabled={busy}>
            ปิด
          </Button>
        </>
      )}

      {msg && <span className="text-ash">{msg}</span>}
    </div>
  );
}
