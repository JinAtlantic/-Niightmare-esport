"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import { ArrowRightIcon } from "@/components/Icons";
import { formatDate } from "@/lib/format";
import type { NewsArticle } from "@/lib/types";

type Variant = "featured" | "compact" | "default";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Mono category chip — bordered, faint amethyst tint. */
function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-amethyst/40 bg-amethyst/[0.08] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-spectre">
      {children}
    </span>
  );
}

export default function NewsCard({
  article,
  variant = "default",
  index,
}: {
  article: NewsArticle;
  variant?: Variant;
  index?: number;
}) {
  const { t, pick, lang } = useLanguage();
  const date = (
    <time dateTime={article.date} className="font-mono tracking-wider">
      {formatDate(article.date, lang)}
    </time>
  );

  // ── Compact digest row — vertical blade that lights up on hover ──────────
  if (variant === "compact") {
    return (
      <a
        href={article.link}
        className="group relative flex h-full flex-col justify-center gap-2.5 overflow-hidden border-l-2 border-edge py-5 pl-6 pr-3"
      >
        <span
          aria-hidden
          className="absolute left-[-2px] top-0 h-0 w-[2px] bg-gradient-to-b from-amethyst to-glow shadow-[0_0_12px_rgba(168,85,247,0.6)] transition-[height] duration-300 ease-out group-hover:h-full"
        />
        <div className="flex items-center gap-3 text-[11px] text-ash-dim">
          <span className="font-mono font-semibold uppercase tracking-[0.18em] text-spectre/80">
            {pick(article.tag)}
          </span>
          <span aria-hidden className="h-3 w-px bg-edge-bright" />
          {date}
        </div>
        <h3 className="line-clamp-2 font-display text-[17px] font-semibold uppercase leading-snug tracking-[0.01em] text-soul transition-colors duration-300 group-hover:text-glow">
          {pick(article.title)}
        </h3>
      </a>
    );
  }

  const featured = variant === "featured";
  const hasLink = Boolean(article.link && article.link !== "#");
  const external = hasLink && /^https?:\/\//.test(article.link);

  // ── Featured + default cards — panel with corner cut and top accent ──────
  return (
    <a
      href={hasLink ? article.link : undefined}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`hover-glow clip-diagonal group relative flex h-full flex-col overflow-hidden border border-edge bg-crypt ${
        featured ? "p-7 md:p-9" : "p-6"
      } ${hasLink ? "" : "cursor-default"}`}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-100"
      />

      {featured && index != null && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-8 select-none font-display text-[7rem] font-bold leading-none text-spectre/[0.06] md:text-[9rem]"
        >
          {pad2(index)}
        </span>
      )}

      <div className="relative flex items-center justify-between gap-4">
        <TagChip>{pick(article.tag)}</TagChip>
        <span className="font-mono text-xs text-ash">{date}</span>
      </div>

      <h3
        className={`relative font-display font-bold uppercase tracking-[0.01em] text-soul transition-colors duration-300 group-hover:text-glow ${
          featured
            ? "mt-6 text-2xl leading-[1.08] md:text-[1.95rem]"
            : "mt-4 line-clamp-3 text-xl leading-snug"
        }`}
      >
        {pick(article.title)}
      </h3>

      <p
        className={`relative flex-1 leading-relaxed text-ash ${
          featured ? "mt-4 text-[15px]" : "mt-3 line-clamp-3 text-sm"
        }`}
      >
        {pick(article.excerpt)}
      </p>

      {hasLink && (
        <span
          className={`relative inline-flex items-center gap-2 self-start font-mono font-semibold uppercase tracking-[0.16em] text-amethyst transition-colors duration-300 group-hover:text-glow ${
            featured ? "mt-8 text-[13px]" : "mt-5 text-[12px]"
          }`}
        >
          {t("common.read_more")}
          <ArrowRightIcon
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-1.5"
          />
        </span>
      )}
    </a>
  );
}
