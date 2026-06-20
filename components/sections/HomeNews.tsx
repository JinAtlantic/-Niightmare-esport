"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import SectionLabel from "@/components/ui/SectionLabel";
import NewsCard from "@/components/cards/NewsCard";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import type { NewsArticle } from "@/lib/types";

/**
 * Compact "latest news" teaser for the home page — the three newest dispatches
 * plus a link into the full /news room. Keeps the home page feeling alive and
 * gives returning visitors a reason to come back, without rebuilding the full
 * featured + scroll-rail layout that lives on /news. Hidden when there's no
 * news so the home page never shows an empty band.
 */
export default function HomeNews() {
  const { t } = useLanguage();
  const { news } = useContent();
  const articles = (news.articles as NewsArticle[]).slice(0, 3);
  if (articles.length === 0) return null;

  return (
    <section className="news-section relative border-t border-edge bg-gradient-to-b from-crypt/35 via-crypt2/30 to-void px-4 py-20 md:px-6 md:py-24">
      <div className="relative z-[1] mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel centered kicker={t("sections.news_kicker")}>
            {t("sections.latest_news")}
          </SectionLabel>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <Reveal key={article.id} delay={i * 90} className="h-full">
              <NewsCard article={article} variant="default" />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 flex justify-center">
            <Link
              href="/news"
              className="group inline-flex items-center gap-2.5 rounded-md border border-edge-bright bg-void/40 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-spectre backdrop-blur-sm transition-all duration-300 hover:border-amethyst/60 hover:text-soul focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void md:text-base"
            >
              {t("sections.view_all_news")}
              <ArrowRightIcon size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
