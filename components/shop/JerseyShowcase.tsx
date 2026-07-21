"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/context/LanguageContext";
import { useModalFocus } from "@/components/ui/useModalFocus";
import { safeImageSrc } from "@/lib/safety";
import type { Bilingual } from "@/lib/types";

const COPY = {
  tapZoom: { en: "Tap to zoom", lo: "ກົດເພື່ອຂະຫຍາຍ" },
  soon: { en: "Photo coming soon", lo: "ຮູບກຳລັງຈະມາ" },
  close: { en: "Close", lo: "ປິດ" },
};

/**
 * Single product-image showcase. The uploaded artwork may already contain both
 * the front and back of the jersey, so the UI presents it as one zoomable image.
 */
export default function JerseyShowcase({
  image,
  productName,
  jerseyNumber,
}: {
  image?: string;
  productName: Bilingual;
  jerseyNumber: string;
}) {
  const { pick } = useLanguage();
  const src = safeImageSrc(image);
  const [zoom, setZoom] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);
  useModalFocus({
    active: mounted && zoom && Boolean(src),
    containerRef: dialogRef,
    initialFocusRef: closeRef,
    onClose: () => setZoom(false),
  });

  return (
    <div className="relative overflow-hidden rounded-md border border-amethyst/40 bg-gradient-to-br from-amethyst/[0.12] via-crypt/50 to-void/40 p-3 shadow-[0_0_34px_-10px_rgba(168,85,247,0.55)] ring-1 ring-inset ring-amethyst/10 sm:p-4">
      <span aria-hidden className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-glow/20 blur-3xl" />

      <div className="relative w-full" style={{ paddingBottom: "116%" }}>
        <div className="absolute inset-0 overflow-hidden rounded-md border border-edge-bright/70 bg-[radial-gradient(80%_70%_at_50%_18%,rgba(28,20,40,0.9),rgba(11,7,16,0.96))]">
          {src ? (
            <button
              type="button"
              onClick={() => setZoom(true)}
              aria-label={pick(COPY.tapZoom)}
              className="group absolute inset-0 h-full w-full cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={pick(productName)}
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

      {mounted && zoom && src && createPortal(
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="fixed inset-0 z-[110] flex flex-col bg-black/92 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={pick(productName)}
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
              src={src}
              alt={pick(productName)}
              className="max-h-full max-w-full object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

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
      <path d="M8 3 4 6l1.5 3L8 8v13h8V8l2.5 1L20 6l-4-3-1.2 1.2a4 4 0 0 1-5.6 0L8 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
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
