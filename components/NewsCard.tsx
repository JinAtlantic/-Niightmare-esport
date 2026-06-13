"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import { ArrowRightIcon } from "@/components/Icons";
import { formatDate } from "@/lib/format";
import type { NewsArticle } from "@/lib/types";

export default function NewsCard({ article }: { article: NewsArticle }) {
  const { t, pick, lang } = useLanguage();

  return (
    <article className="hover-glow clip-diagonal group flex flex-col border border-edge bg-card p-5 transition-transform duration-300 hover:-translate-y-1.5">
      <div className="flex items-center justify-between">
        <span className="inline-block border border-primary/60 bg-primary/10 px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          {pick(article.tag)}
        </span>
        <time className="text-xs text-text-muted" dateTime={article.date}>
          {formatDate(article.date, lang)}
        </time>
      </div>

      <h3 className="mt-4 font-display text-xl font-bold leading-snug text-text-primary transition-colors group-hover:text-accent">
        {pick(article.title)}
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-text-muted">
        {pick(article.excerpt)}
      </p>

      <a
        href={article.link}
        className="mt-5 inline-flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-primary transition-colors hover:text-accent"
      >
        {t("common.read_more")}
        <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
      </a>
    </article>
  );
}
