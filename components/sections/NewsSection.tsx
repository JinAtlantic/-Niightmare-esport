"use client";

import React, { useRef, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import SectionLabel from "@/components/ui/SectionLabel";
import NewsCard from "@/components/cards/NewsCard";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import { useContent } from "@/components/context/ContentContext";
import type { NewsArticle } from "@/lib/types";

// One soft easing curve shared by every transition so the whole interaction
// moves with the same rhythm (easeOutQuint — slow, premium settle).
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/** One clickable digest box — title only, expands to full content when open.
 *  Lives inside a fixed-height scroll rail, so expanding scrolls the rail
 *  instead of resizing the page. */
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
  const hasLink = Boolean(article.link && article.link !== "#");
  const external = hasLink && /^https?:\/\//.test(article.link);

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
                {hasLink && (
                  <div className="mt-4">
                    <a
                      href={article.link}
                      onClick={(e) => e.stopPropagation()}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="inline-flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-amethyst transition-colors hover:text-glow"
                    >
                      {t("common.read_more")}
                      <ArrowRightIcon size={15} />
                    </a>
                  </div>
                )}
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
  const { news: newsData } = useContent();
  // The first article is the latest — it stays pinned in the featured slot on
  // the left; everything else fills the scrollable rail on the right.
  const [featured, ...digest] = newsData.articles as NewsArticle[];
  const [openId, setOpenId] = useState<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const toggle = (id: number) =>
    setOpenId((cur) => {
      const next = cur === id ? null : id;
      // On open, snap the rail to the top so the expanded article (which floats
      // up as siblings collapse) is in view. The rail is fixed-height with
      // internal scroll, so the page itself never grows or shrinks.
      if (next !== null) {
        requestAnimationFrame(() =>
          railRef.current?.scrollTo({ top: 0, behavior: "smooth" })
        );
      }
      return next;
    });

  return (
    <section id="news" className="news-section mx-auto max-w-7xl px-4 py-24 md:px-6">
      <div className="relative z-[1]">
        <Reveal>
          <SectionLabel centered>{t("sections.latest_news")}</SectionLabel>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          {/* Featured — always the latest article, pinned on the left */}
          <Reveal className="lg:col-span-7">
            <NewsCard article={featured} variant="featured" index={1} />
          </Reveal>

          {/* Digest — fixed-height scroll rail; expanding an item scrolls inside
              it rather than resizing the page */}
          <Reveal className="lg:col-span-5" delay={120}>
            <div
              ref={railRef}
              className="news-scroll flex h-[460px] flex-col overflow-y-auto pr-2.5 lg:h-[560px]"
            >
              {digest.map((article) => (
                <DigestItem
                  key={article.id}
                  article={article}
                  open={openId === article.id}
                  collapsed={openId !== null && openId !== article.id}
                  onToggle={() => toggle(article.id)}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
