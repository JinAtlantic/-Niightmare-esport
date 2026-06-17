"use client";

import React from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { useLanguage } from "@/components/context/LanguageContext";
import { ArrowRightIcon } from "@/components/ui/Icons";
import type { Bilingual } from "@/lib/types";

/**
 * A legal document is described as data so both languages stay in lockstep.
 * A block is either a paragraph (optionally ending in an inline link, with
 * optional text after it) or a bullet list. Headings and every string are
 * bilingual and resolved with `pick`, so switching language re-renders the
 * whole document — not just the titles.
 */
export type LegalBlock =
  | { p: Bilingual; link?: { href: string; label: Bilingual }; after?: Bilingual }
  | { ul: Bilingual[] };

export interface LegalSectionData {
  heading: Bilingual;
  blocks: LegalBlock[];
}

function Block({ block }: { block: LegalBlock }) {
  const { pick } = useLanguage();

  if ("ul" in block) {
    return (
      <ul>
        {block.ul.map((item, i) => (
          <li key={i}>{pick(item)}</li>
        ))}
      </ul>
    );
  }

  const isMail = block.link?.href.startsWith("mailto:");
  return (
    <p>
      {pick(block.p)}
      {block.link && (
        <>
          {" "}
          {block.link.href.startsWith("/") ? (
            <Link href={block.link.href}>{pick(block.link.label)}</Link>
          ) : (
            <a
              href={block.link.href}
              {...(isMail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            >
              {pick(block.link.label)}
            </a>
          )}
        </>
      )}
      {block.after && pick(block.after)}
    </p>
  );
}

function Section({ data, index }: { data: LegalSectionData; index: number }) {
  const { pick } = useLanguage();
  return (
    <section className="mt-9 scroll-mt-24 first:mt-0">
      <h2 className="font-display text-lg font-bold uppercase tracking-[0.04em] text-soul md:text-xl">
        <span aria-hidden className="mr-2 text-amethyst">
          {String(index + 1).padStart(2, "0")}
        </span>
        {pick(data.heading)}
      </h2>
      <div className="legal-body mt-3 space-y-3 text-[15px] leading-relaxed text-ash">
        {data.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>
    </section>
  );
}

/** Shared chrome for /privacy and /terms — premium dark, comfortable measure. */
export default function LegalLayout({
  title,
  intro,
  lastUpdated,
  sections,
}: {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSectionData[];
}) {
  const { t } = useLanguage();

  return (
    <>
      <PageHeader kicker={t("legal.kicker")} title={title} subtitle={intro} />

      <article className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        {/* meta row: last updated + governing-language note */}
        <div className="mb-10 flex flex-col gap-3">
          <span className="inline-flex w-fit items-center border border-amethyst/40 bg-amethyst/[0.06] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-spectre">
            {t("legal.last_updated")}: {lastUpdated}
          </span>
          <p className="text-[13px] leading-relaxed text-ash-dim">
            {t("legal.governing_note")}
          </p>
        </div>

        {sections.map((s, i) => (
          <Section key={i} data={s} index={i} />
        ))}

        {/* foot of the document — contact + back link */}
        <div className="mt-14 flex flex-col gap-4 border-t border-edge pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ash">
            {t("legal.questions")}{" "}
            <Link
              href="/contact"
              className="font-semibold text-glow underline-offset-4 transition-colors hover:text-amethyst hover:underline"
            >
              {t("legal.contact_cta")}
            </Link>
          </p>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ash transition-colors hover:text-glow"
          >
            <ArrowRightIcon
              size={15}
              className="rotate-180 transition-transform group-hover:-translate-x-1"
            />
            {t("legal.back_home")}
          </Link>
        </div>
      </article>
    </>
  );
}
