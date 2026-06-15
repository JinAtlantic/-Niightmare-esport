"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import SectionLabel from "@/components/SectionLabel";
import NewsCard from "@/components/NewsCard";
import Reveal from "@/components/Reveal";
import { ArrowRightIcon } from "@/components/Icons";
import { formatDate } from "@/lib/format";
import newsData from "@/data/news.json";
import type { NewsArticle } from "@/lib/types";

// One soft easing curve shared by every transition so the whole interaction
// moves with the same rhythm (easeOutQuint — slow, premium settle).
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/** One clickable digest box — title only, expands to full content when open.
 *  The outer grid (1fr→0fr) collapses siblings smoothly, which floats the
 *  opened item up to the top without any jumpy reorder. */
function DigestItem({
  article,
  open,
  collapsed,
  onToggle,
}: {
  article: NewsArticle;
  open: boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { t, pick, lang } = useLanguage();
  const hasLink = article.link && article.link !== "#";

  return (
    <div
      aria-hidden={collapsed}
      className={`grid transition-[grid-template-rows,opacity,margin] duration-[520ms] ${EASE} motion-reduce:transition-none ${
        collapsed
          ? "pointer-events-none mb-0 grid-rows-[0fr] opacity-0"
          : "mb-3 grid-rows-[1fr] opacity-100"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          role="button"
          tabIndex={collapsed ? -1 : 0}
          aria-expanded={open}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
          className={`group/news relative cursor-pointer overflow-hidden border bg-crypt/60 backdrop-blur-sm transition-[border-color,box-shadow,transform] duration-300 ${EASE} ${
            open
              ? "border-amethyst shadow-[0_0_38px_rgba(168,85,247,0.42)]"
              : "border-amethyst/30 hover:-translate-y-0.5 hover:border-amethyst/70 hover:shadow-[0_0_24px_rgba(168,85,247,0.25)]"
          }`}
        >
          {/* top accent line — fades in on open/hover */}
          <span
            aria-hidden
            className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent transition-opacity duration-500 ${
              open ? "opacity-100" : "opacity-0 group-hover/news:opacity-80"
            }`}
          />

          <div className="p-5">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="font-mono font-semibold uppercase tracking-[0.18em] text-spectre/80">
                {pick(article.tag)}
              </span>
              <time
                dateTime={article.date}
                className="font-mono tracking-wider text-ash-dim"
              >
                {formatDate(article.date, lang)}
              </time>
            </div>

            <div className="mt-2.5 flex items-start justify-between gap-3">
              <h3
                className={`font-display text-[17px] font-semibold uppercase leading-snug tracking-[0.01em] transition-colors duration-300 ${
                  open
                    ? "text-glow"
                    : "line-clamp-2 text-soul group-hover/news:text-glow"
                }`}
              >
                {pick(article.title)}
              </h3>
              <ArrowRightIcon
                size={16}
                className={`mt-1 shrink-0 text-amethyst transition-transform duration-500 ${EASE} ${
                  open ? "rotate-90" : "group-hover/news:translate-x-1"
                }`}
              />
            </div>

            {/* expandable body — grid-rows trick animates real height */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-[520ms] ${EASE} motion-reduce:transition-none ${
                open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <p className="text-sm leading-relaxed text-ash">
                  {pick(article.excerpt)}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  {hasLink && (
                    <a
                      href={article.link}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-amethyst transition-colors hover:text-glow"
                    >
                      {t("common.read_more")}
                      <ArrowRightIcon size={15} />
                    </a>
                  )}
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash-dim">
                    ▲ {lang === "lo" ? "ປິດ" : "Close"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewsSection() {
  const { t } = useLanguage();
  // Featured on the left; every remaining article fills the scrollable digest.
  const [featured, ...digest] = newsData.articles as NewsArticle[];
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <section id="news" className="news-section mx-auto max-w-7xl px-4 py-24 md:px-6">
      <div className="relative z-[1]">
        <Reveal>
          <SectionLabel centered>{t("sections.latest_news")}</SectionLabel>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          {/* Featured — the latest dispatch */}
          <Reveal className="lg:col-span-7">
            <NewsCard article={featured} variant="featured" index={1} />
          </Reveal>

          {/* Digest — clickable purple boxes in a scrollable rail (matches the
              featured card's height on desktop; scroll the mouse to see more) */}
          <Reveal className="lg:col-span-5" delay={120}>
            <div className="news-scroll flex flex-col lg:h-full lg:max-h-[600px] lg:overflow-y-auto lg:pr-2.5">
              {digest.map((article) => (
                <DigestItem
                  key={article.id}
                  article={article}
                  open={openId === article.id}
                  collapsed={openId !== null && openId !== article.id}
                  onToggle={() =>
                    setOpenId((cur) => (cur === article.id ? null : article.id))
                  }
                />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
