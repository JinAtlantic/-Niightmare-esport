"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/layout/PageHeader";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon, CloseIcon } from "@/components/ui/Icons";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { formatDate } from "@/lib/format";
import newsSeed from "@/data/news.json";
import type { Bilingual, NewsArticle } from "@/lib/types";

interface NewsPageCopy {
  kicker: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  feedLabel: Bilingual;
  emptyTitle: Bilingual;
  emptyBody: Bilingual;
}

const READ_MORE: Bilingual = { en: "Read full article", lo: "ອ່ານຂ່າວເຕັມ" };

const pageSeed = newsSeed.page as NewsPageCopy;

function mergePageCopy(page?: Partial<NewsPageCopy>): NewsPageCopy {
  return { ...pageSeed, ...page };
}

/** A single headline row — tag, date, and title only. The body opens in a modal
 *  on click so the feed stays scannable. */
function HeadlineRow({
  article,
  onOpen,
}: {
  article: NewsArticle;
  onOpen: () => void;
}) {
  const { pick, lang } = useLanguage();
  const tag = pick(article.tag).trim();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 px-1 py-5 text-left transition-colors duration-200 hover:bg-amethyst/[0.04] focus:outline-none focus-visible:bg-amethyst/[0.06] focus-visible:ring-1 focus-visible:ring-amethyst/50 md:gap-5 md:px-3"
    >
      {/* result blade — lights up on hover/focus */}
      <span
        aria-hidden
        className="h-10 w-[3px] shrink-0 -skew-x-[24deg] bg-edge transition-colors duration-200 group-hover:bg-gradient-to-b group-hover:from-amethyst group-hover:to-glow group-focus-visible:from-amethyst group-focus-visible:to-glow"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {tag && (
            <span className="border border-amethyst/40 bg-amethyst/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-glow">
              {tag}
            </span>
          )}
          <time
            dateTime={article.date}
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-ash-dim"
          >
            {formatDate(article.date, lang)}
          </time>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold uppercase leading-snug tracking-[0.01em] text-soul transition-colors duration-200 group-hover:text-glow md:text-xl">
          {pick(article.title)}
        </h3>
      </div>
      <ArrowRightIcon
        size={18}
        className="shrink-0 text-ash transition-all duration-300 group-hover:translate-x-1 group-hover:text-glow"
      />
    </button>
  );
}

/** Reading modal — the article sits above a blurred backdrop; everything behind
 *  is dimmed and blurred so only the open story is in focus. */
function ArticleModal({
  article,
  onClose,
}: {
  article: NewsArticle;
  onClose: () => void;
}) {
  const { pick, lang, t } = useLanguage();
  const tag = pick(article.tag).trim();
  const hasLink = Boolean(article.link && article.link.trim() && article.link !== "#");

  const [show, setShow] = useState(false);

  // Animate out before unmounting so closing scales back down smoothly.
  const requestClose = useCallback(() => {
    setShow(false);
    window.setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true)); // play the enter transition
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [requestClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={pick(article.title)}
    >
      {/* blurred backdrop — click to dismiss */}
      <div
        className={`absolute inset-0 bg-void/80 backdrop-blur-md transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={requestClose}
        aria-hidden
      />

      <div
        className={`relative z-10 max-h-[88vh] w-full max-w-2xl overflow-hidden border border-amethyst/45 bg-gradient-to-b from-crypt to-void shadow-[0_0_60px_rgba(168,85,247,0.3)] transition-all duration-200 ease-out motion-reduce:transition-none ${
          show ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        <span aria-hidden className="scythe-line absolute inset-x-0 top-0 h-[2px]" />

        <div className="flex items-center justify-between gap-4 border-b border-edge px-5 py-4 md:px-7">
          <div className="flex flex-wrap items-center gap-3">
            {tag && (
              <span className="border border-amethyst/40 bg-amethyst/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-glow">
                {tag}
              </span>
            )}
            <time
              dateTime={article.date}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash"
            >
              {formatDate(article.date, lang)}
            </time>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 shrink-0 place-items-center border border-edge bg-void/60 text-soul transition-colors hover:border-amethyst hover:text-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="max-h-[calc(88vh-64px)] overflow-y-auto px-5 py-6 [scrollbar-color:#A855F7_#16101F] [scrollbar-width:thin] md:px-7 md:py-8">
          <h2 className="font-display text-2xl font-bold uppercase leading-tight tracking-[0.01em] text-soul [text-shadow:0_0_28px_rgba(168,85,247,0.35)] md:text-3xl">
            {pick(article.title)}
          </h2>
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-spectre md:text-base">
            {pick(article.excerpt)}
          </p>

          {hasLink && (
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-7 inline-flex items-center gap-2.5 rounded-md border border-amethyst/60 bg-amethyst/10 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-soul transition-all duration-300 hover:bg-amethyst/20 hover:shadow-[0_0_28px_-6px_rgba(168,85,247,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
            >
              {pick(READ_MORE)}
              <ArrowRightIcon
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function NewsClient() {
  const { pick } = useLanguage();
  const data = useContent().news as {
    page?: Partial<NewsPageCopy>;
    articles: NewsArticle[];
  };
  const page = mergePageCopy(data.page);

  // Newest first so the feed reads top-down.
  const articles = useMemo(
    () =>
      [...(data.articles ?? [])].sort((a, b) =>
        (b.date ?? "").localeCompare(a.date ?? "")
      ),
    [data.articles]
  );

  const [active, setActive] = useState<NewsArticle | null>(null);

  return (
    <>
      <PageHeader title={pick(page.title)} subtitle={pick(page.intro)} />

      <main className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-16">
        {articles.length > 0 ? (
          <>
            <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-amethyst">
              {pick(page.feedLabel)}
            </p>
            <Reveal>
              <ul className="divide-y divide-edge border-y border-edge">
                {articles.map((article) => (
                  <li key={article.id}>
                    <HeadlineRow article={article} onOpen={() => setActive(article)} />
                  </li>
                ))}
              </ul>
            </Reveal>
          </>
        ) : (
          <div className="border border-edge bg-crypt p-8 text-center">
            <p className="font-display text-xl font-bold uppercase text-soul">
              {pick(page.emptyTitle)}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ash">
              {pick(page.emptyBody)}
            </p>
          </div>
        )}
      </main>

      {active && <ArticleModal article={active} onClose={() => setActive(null)} />}
    </>
  );
}
