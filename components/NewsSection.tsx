"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageContext";
import SectionLabel from "@/components/SectionLabel";
import NewsCard from "@/components/NewsCard";
import newsData from "@/data/news.json";
import type { NewsArticle } from "@/lib/types";

export default function NewsSection() {
  const { t } = useLanguage();
  const articles = (newsData.articles as NewsArticle[]).slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <SectionLabel>{t("sections.latest_news")}</SectionLabel>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
