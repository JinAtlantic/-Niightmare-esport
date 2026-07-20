"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/context/LanguageContext";
import { useModalFocus } from "@/components/ui/useModalFocus";
import { safeImageSrc } from "@/lib/safety";
import type { Bilingual } from "@/lib/types";

type View = "front" | "back";

const COPY = {
  front: { en: "Front", lo: "ດ້ານໜ້າ" },
  back: { en: "Back", lo: "ດ້ານຫຼັງ" },
  tapZoom: { en: "Tap to zoom", lo: "ກົດເພື່ອຂະຫຍາຍ" },
  soon: { en: "Photo coming soon", lo: "ຮູບກຳລັງຈະມາ" },
  close: { en: "Close", lo: "ປິດ" },
};

/**
 * Premium front/back jersey gallery for the shop. A large object-contain viewer
 * (so the whole shirt shows on any upload) with a Front/Back toggle and two
 * thumbnails, plus a tap-to-zoom fullscreen lightbox. When a side has no image
 * yet it renders an on-brand placeholder — so the layout reads as intentional
 * before the owner uploads the real photos. Uses a padding-bottom square/portrait
 * box (NOT CSS aspect-ratio, which older mobile Safari collapses to 0). Uploaded
 * photos live on Supabase Storage, so plain <img> is used (same as the slip/
 * shipping images) rather than next/image, which would need a remote domain.
 */
export default function JerseyShowcase({
  front,
  back,
  productName,
  jerseyNumber,
}: {
  front?: string;
  back?: string;
  productName: Bilingual;
  jerseyNumber: string;
}) {
  const { pick } = useLanguage();
  const src: Record<View, string> = {
    front: safeImageSrc(front),
    back: safeImageSrc(back),
  };
  const [view, setView] = useState<View>(src.front ? "front" : src.back ? "back" : "front");
  const [zoom, setZoom] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setMounted(true), []);
  useModalFocus({
    active: mounted && zoom && Boolean(src[view]),
    containerRef: dialogRef,
    initialFocusRef: closeRef,
    onClose: () => setZoom(false),
  });

  const activeSrc = src[view];
  const label = (v: View) => pick(v === "front" ? COPY.front : COPY.back);

  return (
    <div className="relative overflow-hidden rounded-md border border-amethyst/40 bg-gradient-to-br from-amethyst/[0.12] via-crypt/50 to-void/40 p-3 shadow-[0_0_34px_-10px_rgba(168,85,247,0.55)] ring-1 ring-inset ring-amethyst/10 sm:p-4">
      {/* ambient corner halo — visual only */}
      <span aria-hidden className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-glow/20 blur-3xl" />

      {/* ── main viewer ─────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ paddingBottom: "116%" }}>
        <div className="absolute inset-0 overflow-hidden rounded-md border border-edge-bright/70 bg-[radial-gradient(80%_70%_at_50%_18%,rgba(28,20,40,0.9),rgba(11,7,16,0.96))]">
          {/* top-left side chip */}
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-glow/40 bg-void/70 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-glow shadow-[0_0_16px_-4px_rgba(199,125,255,0.6)] backdrop-blur">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-glow shadow-[0_0_8px_rgba(199,125,255,0.9)]" />
            {label(view)}
          </span>

          {activeSrc ? (
            <button
              type="button"
              onClick={() => setZoom(true)}
              aria-label={pick(COPY.tapZoom)}
              className="group absolute inset-0 h-full w-full cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeSrc}
                alt={`${pick(productName)} — ${label(view)}`}
                className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-edge-bright/70 bg-void/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-spectre backdrop-blur transition-colors group-hover:border-amethyst group-hover:text-soul">
                <ZoomGlyph /> {pick(COPY.tapZoom)}
              </span>
            </button>
          ) : (
            <Placeholder number={jerseyNumber} caption={pick(COPY.soon)} />
          )}
        </div>
      </div>

      {/* ── front / back thumbnails ─────────────────────────────────── */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {(["front", "back"] as View[]).map((v) => {
          const active = view === v;
          const thumbSrc = src[v];
          return (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={active}
              className={`group relative overflow-hidden rounded-md border transition-all ${
                active
                  ? "border-amethyst bg-amethyst/10 shadow-[0_0_18px_-6px_rgba(168,85,247,0.7)] ring-1 ring-inset ring-amethyst/40"
                  : "border-edge bg-void/40 hover:border-edge-bright"
              }`}
            >
              <div className="relative w-full" style={{ paddingBottom: "70%" }}>
                <div className="absolute inset-0 grid place-items-center">
                  {thumbSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbSrc} alt={label(v)} className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <ShirtGlyph className={`h-8 w-8 ${active ? "text-amethyst/70" : "text-ash-dim"}`} />
                  )}
                </div>
              </div>
              <span
                className={`block border-t px-2 py-1.5 text-center font-display text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                  active ? "border-amethyst/40 text-soul" : "border-edge text-ash group-hover:text-spectre"
                }`}
              >
                {label(v)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── fullscreen lightbox ─────────────────────────────────────── */}
      {mounted &&
        zoom &&
        activeSrc &&
        createPortal(
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="fixed inset-0 z-[110] flex flex-col bg-black/92 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${pick(productName)} — ${label(view)}`}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setZoom(false)}
              aria-label={pick(COPY.close)}
              className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-md border border-edge-bright bg-void/70 text-soul transition-colors hover:border-amethyst"
            >
              ✕
            </button>
            <button
              type="button"
              className="flex flex-1 cursor-zoom-out items-center justify-center overflow-auto p-4"
              onClick={() => setZoom(false)}
              aria-label={pick(COPY.close)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeSrc}
                alt={`${pick(productName)} — ${label(view)}`}
                className="max-h-full max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </button>
            {/* front / back toggle inside the lightbox */}
            <div className="flex items-center justify-center gap-2 p-4">
              {(["front", "back"] as View[]).map((v) => {
                const has = Boolean(src[v]);
                const active = view === v;
                return (
                  <button
                    key={v}
                    type="button"
                    disabled={!has}
                    onClick={() => setView(v)}
                    className={`min-h-[40px] rounded-md border px-5 py-2 font-display text-sm font-bold uppercase tracking-[0.14em] transition-all ${
                      active
                        ? "border-amethyst bg-amethyst/20 text-soul"
                        : has
                          ? "border-edge bg-void/60 text-ash hover:text-soul"
                          : "cursor-not-allowed border-edge/50 bg-void/30 text-ash-dim opacity-50"
                    }`}
                  >
                    {label(v)}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/* ── placeholder + glyphs ─────────────────────────────────────────────────── */

function Placeholder({ number, caption }: { number: string; caption: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <ShirtGlyph className="h-24 w-24 text-edge-bright sm:h-28 sm:w-28" />
          <span className="absolute inset-0 grid place-items-center font-display text-2xl font-black text-amethyst/60 [text-shadow:0_0_18px_rgba(168,85,247,0.5)]">
            {number}
          </span>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ash">{caption}</p>
      </div>
    </div>
  );
}

function ShirtGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M8 3 4 6l1.5 3L8 8v13h8V8l2.5 1L20 6l-4-3-1.2 1.2a4 4 0 0 1-5.6 0L8 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZoomGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M11 8v6M8 11h6M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
