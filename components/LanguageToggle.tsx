"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import type { Lang } from "@/lib/types";

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  const options: { value: Lang; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "lo", label: "ລາວ" },
  ];

  return (
    <div
      className={`inline-flex items-center border border-edge bg-void/60 ${className}`}
      role="group"
      aria-label="Language switcher"
    >
      {options.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLang(opt.value)}
            aria-pressed={active}
            className={`px-3 py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
              opt.value === "lo" ? "" : "keep-latin font-rajdhani"
            } ${
              active
                ? "bg-primary text-white shadow-glow-soft"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
