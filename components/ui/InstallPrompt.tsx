"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";

const DISMISS_KEY = "nm-install-dismissed";
// Balanced: shows on every visit while ignored; an explicit ✕ stays quiet this
// many days; once installed (standalone) it never shows again.
const DISMISS_DAYS = 3;

/** Chrome's beforeinstallprompt event (not in the standard lib types). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const COPY = {
  title: { en: "Add NIIGHTMARE to your home screen", lo: "ເພີ່ມ NIIGHTMARE ລົງໜ້າຈໍ" },
  benefitNews: { en: "News & live match results, instantly", lo: "ຂ່າວ & ຜົນແຂ່ງສົດ ທັນທີ" },
  benefitShop: { en: "Order team jerseys in one tap", lo: "ສັ່ງເສື້ອທີມໄດ້ໃນແຕະດຽວ" },
  safetyLead: { en: "100% safe.", lo: "ປອດໄພ 100%." },
  safetyRest: {
    en: "It's just a shortcut, not an installed app — no download, no access to your phone.",
    lo: "ເປັນພຽງທາງລັດ ບໍ່ແມ່ນແອັບຕິດຕັ້ງ — ບໍ່ດາວໂຫລດ ບໍ່ຂໍສິດເຂົ້າເຄື່ອງ.",
  },
  install: { en: "Install", lo: "ຕິດຕັ້ງ" },
  later: { en: "Not now", lo: "ບໍ່ຕອນນີ້" },
  iosLead: { en: "Tap", lo: "ກົດ" },
  iosShare: { en: "Share", lo: "ແຊร์" },
  iosThen: { en: "then “Add to Home Screen”.", lo: "ແລ້ວເລືອກ “Add to Home Screen”." },
};

/** iOS Safari share glyph (square with an up arrow). */
function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="inline-block h-4 w-4 align-text-bottom text-glow" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

export default function InstallPrompt() {
  const { pick } = useLanguage();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register the service worker so the site is installable (and push-ready).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Already installed (opened from the home-screen icon)? Never nag.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Dismissed recently? Stay quiet for DISMISS_DAYS.
    try {
      const ts = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
      if (ts && Date.now() - ts < DISMISS_DAYS * 86400000) return;
    } catch {
      /* ignore */
    }

    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);

    if (ios) {
      // iOS can't install programmatically, and only Safari has Add to Home Screen.
      const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
      if (!isSafari) return;
      setIsIos(true);
      const t = window.setTimeout(() => setShow(true), 3500);
      return () => window.clearTimeout(t);
    }

    // Android / desktop Chrome: wait for the install prompt to become available.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => {
      remember();
      setShow(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function remember() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  function close() {
    remember();
    setShow(false);
  }

  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* user dismissed the native sheet */
    }
    setDeferred(null);
    setShow(false);
    remember();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" role="dialog" aria-label={pick(COPY.title)}>
      <div className="mx-auto max-w-md rounded-md border border-edge-bright bg-crypt/95 p-3.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur">
        {/* header: app icon + title + close */}
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-md border border-edge" />
          <p className="min-w-0 flex-1 font-display text-sm font-bold uppercase tracking-wide text-soul">{pick(COPY.title)}</p>
          <button
            type="button"
            onClick={close}
            aria-label={pick(COPY.later)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-edge bg-void/60 text-ash transition-colors hover:border-amethyst hover:text-soul"
          >
            ✕
          </button>
        </div>

        {/* why add it — the two things fans actually want */}
        <ul className="mt-3 space-y-1.5">
          <li className="flex items-center gap-2 font-mono text-[12px] text-spectre">
            <span aria-hidden className="w-4 shrink-0 text-center text-glow">⚡</span>
            {pick(COPY.benefitNews)}
          </li>
          <li className="flex items-center gap-2 font-mono text-[12px] text-spectre">
            <span aria-hidden className="w-4 shrink-0 text-center text-glow">👕</span>
            {pick(COPY.benefitShop)}
          </li>
        </ul>

        {/* safety reassurance — a real reason, not a hollow guarantee */}
        <p className="mt-3 flex items-start gap-2 rounded-md border border-win/30 bg-win/10 px-2.5 py-2 font-mono text-[11px] leading-snug text-spectre">
          <span aria-hidden className="shrink-0 text-win">🔒</span>
          <span>
            <span className="font-bold text-win">{pick(COPY.safetyLead)}</span> {pick(COPY.safetyRest)}
          </span>
        </p>

        {/* CTA: one-tap install on Android/desktop; Share-sheet steps on iOS */}
        {isIos ? (
          <p className="mt-3 font-mono text-[11px] leading-snug text-spectre">
            {pick(COPY.iosLead)} <ShareGlyph /> <span className="text-glow">{pick(COPY.iosShare)}</span> {pick(COPY.iosThen)}
          </p>
        ) : (
          <button
            type="button"
            onClick={install}
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-amethyst bg-amethyst/20 px-4 py-2 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul transition-all hover:bg-amethyst/30"
          >
            {pick(COPY.install)}
          </button>
        )}
      </div>
    </div>
  );
}
