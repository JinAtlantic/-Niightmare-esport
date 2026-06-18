"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import NewsCard from "@/components/cards/NewsCard";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { formatDate } from "@/lib/format";
import newsSeed from "@/data/news.json";
import type { Bilingual, NewsArticle } from "@/lib/types";

interface NewsCta {
  label: Bilingual;
  href: string;
}

interface NewsPageCopy {
  kicker: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  deskLabel: Bilingual;
  deskIntro: Bilingual;
  featuredLabel: Bilingual;
  feedLabel: Bilingual;
  emptyTitle: Bilingual;
  emptyBody: Bilingual;
  statArticles: Bilingual;
  statCategories: Bilingual;
  statLatest: Bilingual;
  ctaLabel: Bilingual;
  ctaTitle: Bilingual;
  ctaBody: Bilingual;
  ctaPrimary: NewsCta;
  ctaSecondary: NewsCta;
}

const pageSeed = newsSeed.page as NewsPageCopy;

function mergePageCopy(page?: Partial<NewsPageCopy>): NewsPageCopy {
  return {
    ...pageSeed,
    ...page,
    ctaPrimary: { ...pageSeed.ctaPrimary, ...(page?.ctaPrimary ?? {}) },
    ctaSecondary: { ...pageSeed.ctaSecondary, ...(page?.ctaSecondary ?? {}) },
  };
}

function uniqueTags(articles: NewsArticle[], pick: (value: Bilingual) => string) {
  return Array.from(new Set(articles.map((a) => pick(a.tag).trim()).filter(Boolean)));
}

function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="clip-diagonal border border-edge bg-crypt px-4 py-4">
      <span className="keep-latin block font-display text-2xl font-bold uppercase text-glow md:text-3xl">
        {value}
      </span>
      <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ash">
        {label}
      </p>
    </div>
  );
}

function PressDesk({
  page,
  articles,
}: {
  page: NewsPageCopy;
  articles: NewsArticle[];
}) {
  const { pick, lang } = useLanguage();
  const tags = uniqueTags(articles, pick);
  const latest = articles[0]?.date ? formatDate(articles[0].date, lang) : "-";

  return (
    <Reveal>
      <div className="border border-edge bg-crypt/35 p-4 shadow-glow-soft md:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex min-h-[170px] flex-col justify-between border border-edge bg-void/45 p-5">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.34em] text-amethyst">
                {pick(page.deskLabel)}
              </p>
              <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-spectre md:text-base">
                {pick(page.deskIntro)}
              </p>
            </div>
            <div
              aria-hidden
              className="mt-8 h-[2px] w-28 -skew-x-[24deg] bg-gradient-to-r from-amethyst via-glow to-transparent shadow-[0_0_16px_rgba(168,85,247,0.55)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile value={articles.length} label={pick(page.statArticles)} />
            <StatTile value={tags.length} label={pick(page.statCategories)} />
            <StatTile value={latest} label={pick(page.statLatest)} />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function EmptyState({ page }: { page: NewsPageCopy }) {
  const { pick } = useLanguage();
  return (
    <div className="border border-edge bg-crypt p-8 text-center">
      <p className="font-display text-xl font-bold uppercase text-soul">
        {pick(page.emptyTitle)}
      </p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ash">
        {pick(page.emptyBody)}
      </p>
    </div>
  );
}

function CtaBand({ page }: { page: NewsPageCopy }) {
  const { pick } = useLanguage();
  const ctas = [page.ctaPrimary, page.ctaSecondary].filter((cta) => cta.href);

  return (
    <Reveal>
      <section className="mt-16 overflow-hidden border border-edge bg-crypt/55 p-6 shadow-glow-soft md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-amethyst">
              {pick(page.ctaLabel)}
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-2xl font-bold uppercase leading-tight text-soul md:text-4xl">
              {pick(page.ctaTitle)}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash md:text-base">
              {pick(page.ctaBody)}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            {ctas.map((cta, index) => (
              <Link
                key={`${cta.href}-${index}`}
                href={cta.href}
                className={`inline-flex min-h-[44px] items-center justify-center gap-2 border px-5 py-3 text-center font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                  index === 0
                    ? "border-amethyst bg-amethyst/15 text-soul hover:bg-amethyst/25"
                    : "border-edge bg-void/50 text-ash hover:border-edge-bright hover:text-soul"
                }`}
              >
                {pick(cta.label)}
                <ArrowRightIcon size={15} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

export default function NewsClient() {
  const { pick } = useLanguage();
  const data = useContent().news as {
    page?: Partial<NewsPageCopy>;
    articles: NewsArticle[];
  };
  const page = mergePageCopy(data.page);
  const articles = useMemo(() => data.articles ?? [], [data.articles]);
  const [featured, ...rest] = articles;

  return (
    <>
      <PageHeader
        kicker={pick(page.kicker)}
        title={pick(page.title)}
        subtitle={pick(page.intro)}
      />

      <main className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
        <PressDesk page={page} articles={articles} />

        {featured ? (
          <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Reveal>
              <div>
                <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-amethyst">
                  {pick(page.featuredLabel)}
                </p>
                <NewsCard article={featured} variant="featured" index={1} />
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div>
                <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-amethyst">
                  {pick(page.feedLabel)}
                </p>
                <div className="grid gap-3">
                  {rest.map((article, index) => (
                    <NewsCard key={article.id} article={article} index={index + 2} />
                  ))}
                </div>
              </div>
            </Reveal>
          </section>
        ) : (
          <div className="mt-10">
            <EmptyState page={page} />
          </div>
        )}

        <CtaBand page={page} />
      </main>
    </>
  );
}
