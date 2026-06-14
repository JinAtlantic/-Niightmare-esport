"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import SectionLabel from "@/components/SectionLabel";
import NewsCard from "@/components/NewsCard";
import Reveal from "@/components/Reveal";
import newsData from "@/data/news.json";
import type { NewsArticle } from "@/lib/types";

export default function NewsSection() {
  const { t } = useLanguage();
  const [featured, ...digest] = (newsData.articles as NewsArticle[]).slice(0, 4);

  return (
    <section
      id="news"
      className="news-section mx-auto max-w-7xl px-4 py-24 md:px-6"
    >
      <div className="relative z-[1]">
        <Reveal>
          <SectionLabel kicker={t("sections.news_kicker")}>
            {t("sections.latest_news")}
          </SectionLabel>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          {/* Featured — the latest dispatch */}
          <Reveal className="lg:col-span-7">
            <NewsCard article={featured} variant="featured" index={1} />
          </Reveal>

          {/* Digest — the next two, stacked */}
          <div className="flex flex-col divide-y divide-edge/60 lg:col-span-5">
            {digest.map((article, i) => (
              <Reveal key={article.id} className="flex-1" delay={120 * (i + 1)}>
                <NewsCard article={article} variant="compact" index={i + 2} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
