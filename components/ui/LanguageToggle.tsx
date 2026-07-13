"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";
import type { Lang } from "@/lib/types";

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const options: { value: Lang; label: string; native: string }[] = [
    { value: "en", label: "English", native: "EN" },
    { value: "lo", label: "Lao", native: "LA" },
  ];
  const active = options.find((opt) => opt.value === lang) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Choose language, current ${active.native}`}
        className="group inline-flex min-h-[44px] items-center gap-2 border border-edge bg-void/70 px-3 text-soul shadow-[0_0_18px_rgba(11,7,16,0.42)] backdrop-blur-md transition-all duration-200 hover:border-amethyst hover:bg-crypt/90 hover:shadow-glow-soft"
      >
        <Globe2
          size={18}
          strokeWidth={1.8}
          className="text-spectre transition-colors group-hover:text-glow"
          aria-hidden
        />
        <span className="keep-latin font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
          {active.native}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.9}
          className={`text-ash transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <div
        role="menu"
        aria-label="Language options"
        className={`absolute right-0 top-full z-50 mt-2 w-44 origin-top-right border border-edge-bright bg-crypt/95 p-1 shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-150 ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        {options.map((opt) => {
          const selected = lang === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              onClick={() => {
                setLang(opt.value);
                setOpen(false);
              }}
              className={`flex min-h-[40px] w-full items-center justify-between gap-3 px-3 text-left transition-colors ${
                selected
                  ? "bg-amethyst/15 text-soul"
                  : "text-ash hover:bg-void/70 hover:text-soul"
              }`}
            >
              <span className="flex flex-col leading-none">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
                  {opt.label}
                </span>
                <span className="keep-latin mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ash-dim">
                  {opt.native}
                </span>
              </span>
              {selected && (
                <Check size={15} strokeWidth={2} className="text-glow" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
