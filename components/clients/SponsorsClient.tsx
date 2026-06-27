"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import { useContent } from "@/components/context/ContentContext";
import { ArrowRightIcon } from "@/components/ui/Icons";
import sponsorsSeed from "@/data/sponsors.json";
import type { Bilingual, Sponsor, SponsorTier } from "@/lib/types";

interface SponsorValueProp {
  id: string;
  title: Bilingual;
  body: Bilingual;
}

interface SponsorCta {
  label: Bilingual;
  href: string;
}

interface SponsorsPageCopy {
  heroTitle: Bilingual;
  heroSubtitle: Bilingual;
  partnersLabel: Bilingual;
  tiersLabel: Bilingual;
  tiersIntro: Bilingual;
  valueLabel: Bilingual;
  valueProps: SponsorValueProp[];
  ctaTitle: Bilingual;
  ctaBody: Bilingual;
  ctaPrimary: SponsorCta;
  ctaSecondary: SponsorCta;
}

const FALLBACK_PAGE = sponsorsSeed.page as SponsorsPageCopy;

const COPY = {
  wallLabel: { en: "OFFICIAL PARTNERS", lo: "ພາກສ່ວນທາງການ" },
  wallTitle: {
    en: "Brands Behind The Nightmare",
    lo: "ແບຣນທີ່ຢືນຢູ່ຫຼັງ NIIGHTMARE",
  },
  wallIntro: {
    en: "A clean partner wall built for visibility first: logo, name, and a focused story behind every supporter.",
    lo: "ພື້ນທີ່ພາກສ່ວນທີ່ເນັ້ນໃຫ້ເຫັນໂລໂກ້ ຊື່ ແລະເລື່ອງລາວຂອງຜູ້ສະໜັບສະໜູນແຕ່ລະລາຍຢ່າງຊັດເຈນ.",
  },
  open: { en: "View Partner", lo: "ເບິ່ງພາກສ່ວນ" },
  official: { en: "Official NIIGHTMARE Partner", lo: "ພາກສ່ວນທາງການຂອງ NIIGHTMARE" },
  modalIntro: {
    en: "This partner helps power the club's competitive journey, content presence, and fan-facing moments across the season.",
    lo: "ພາກສ່ວນນີ້ຊ່ວຍຜັກດັນເສັ້ນທາງແຂ່ງຂັນ ຄອນເທນ ແລະຊ່ວງເວລາສຳຄັນຂອງທີມຕະຫຼອດຊີຊັນ.",
  },
  spotlight: { en: "Partner Spotlight", lo: "ຈຸດເດັ່ນຂອງພາກສ່ວນ" },
  impact: { en: "How They Support", lo: "ສະໜັບສະໜູນຢ່າງໃດ" },
  fans: { en: "Why Fans Should Care", lo: "ເປັນຫຍັງແຟນຄວນສົນໃຈ" },
  visit: { en: "Visit Sponsor", lo: "ໄປທີ່ Sponsor" },
  close: { en: "Close", lo: "ປິດ" },
  noLink: { en: "Website link not set yet", lo: "ຍັງບໍ່ໄດ້ໃສ່ລິງກ໌ເວັບໄຊ" },
  tierLabel: { en: "Partner Packages", lo: "ແພັກເກດພາກສ່ວນ" },
};

const PARTNER_POINTS = {
  spotlight: {
    en: "A trusted brand presence placed beside NIIGHTMARE on match days, community posts, and premium club surfaces.",
    lo: "ແບຣນທີ່ປະກົດຄູ່ກັບ NIIGHTMARE ໃນວັນແຂ່ງ ໂພສຊຸມຊົນ ແລະພື້ນທີ່ພຣີມຽມຂອງສະໂມສອນ.",
  },
  impact: {
    en: "Their support strengthens team operations, tournament preparation, creator output, and fan engagement.",
    lo: "ການສະໜັບສະໜູນຊ່ວຍເສີມການບໍລິຫານທີມ ການກຽມແຂ່ງ ຄອນເທນ ແລະການເຊື່ອມຕໍ່ກັບແຟນ.",
  },
  fans: {
    en: "Fans can discover the brands that invest directly in Lao esports and help NIIGHTMARE chase bigger stages.",
    lo: "ແຟນສາມາດຮູ້ຈັກແບຣນທີ່ລົງທຶນກັບອີສະປອດລາວໂດຍກົງ ແລະຊ່ວຍໃຫ້ NIIGHTMARE ໄປສູ່ເວທີໃຫຍ່ກວ່າເກົ່າ.",
  },
};

function sponsorInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "NM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function isExternalLink(url: string | undefined) {
  return Boolean(url && url !== "#");
}

function SponsorLogo({ sponsor, className = "" }: { sponsor: Sponsor; className?: string }) {
  const initials = sponsorInitials(sponsor.name);
  return (
    <div className={`grid place-items-center overflow-hidden bg-void/70 ${className}`}>
      {sponsor.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sponsor.logo} alt={`${sponsor.name} logo`} className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="keep-latin font-display text-2xl font-black tracking-wide text-glow">{initials}</span>
      )}
    </div>
  );
}

function SponsorCard({
  sponsor,
  index,
  onOpen,
}: {
  sponsor: Sponsor;
  index: number;
  onOpen: (sponsor: Sponsor) => void;
}) {
  const { pick } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => onOpen(sponsor)}
      className="group relative min-h-[160px] overflow-hidden border border-edge bg-[linear-gradient(145deg,rgba(28,20,40,0.7),rgba(11,7,16,0.98))] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-[border-color,transform,background-color] duration-300 hover:-translate-y-1 hover:border-amethyst/65 hover:bg-crypt2/70"
    >
      <span aria-hidden className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <span aria-hidden className="absolute -right-16 -top-16 h-36 w-36 bg-amethyst/10 blur-3xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <SponsorLogo sponsor={sponsor} className="h-20 w-28 border border-edge-bright/50 p-3" />
        <span className="font-mono text-[10px] font-semibold text-ash-dim">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="relative mt-4">
        <h3 className="keep-latin line-clamp-2 font-display text-base font-bold uppercase tracking-[0.08em] text-soul">
          {sponsor.name}
        </h3>
        <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amethyst">
          {pick(COPY.open)}
        </p>
      </div>
    </button>
  );
}

function InfoBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="border-l-2 border-amethyst/70 bg-crypt/45 px-4 py-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amethyst">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-ash">{body}</p>
    </div>
  );
}

function SponsorModal({ sponsor, onClose }: { sponsor: Sponsor | null; onClose: () => void }) {
  const { pick } = useLanguage();
  const linked = isExternalLink(sponsor?.url);

  useEffect(() => {
    if (!sponsor) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [sponsor, onClose]);

  if (!sponsor) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={sponsor.name}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 px-4 py-6 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto border border-edge-bright bg-[linear-gradient(145deg,rgba(22,16,31,0.98),rgba(11,7,16,0.99))] shadow-[0_0_48px_rgba(168,85,247,0.22)]">
        <span aria-hidden className="scythe-line absolute inset-x-0 top-0 h-[2px]" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 border border-edge bg-void/80 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ash transition-colors hover:border-amethyst hover:text-soul"
        >
          {pick(COPY.close)}
        </button>

        <div className="grid gap-0 md:grid-cols-[240px_1fr]">
          <div className="border-b border-edge bg-void/55 p-6 md:border-b-0 md:border-r">
            <SponsorLogo sponsor={sponsor} className="h-36 w-full border border-edge-bright/60 p-5" />
            <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amethyst">
              {pick(COPY.official)}
            </p>
            <h2 className="keep-latin mt-2 break-words font-display text-3xl font-black uppercase leading-none tracking-wide text-soul">
              {sponsor.name}
            </h2>
          </div>

          <div className="p-6 md:p-7">
            <SectionLabel>{pick(COPY.spotlight)}</SectionLabel>
            <p className="mt-4 text-base leading-relaxed text-spectre">
              {pick(COPY.modalIntro)}
            </p>

            <div className="mt-6 grid gap-3">
              <InfoBlock label={pick(COPY.spotlight)} body={pick(PARTNER_POINTS.spotlight)} />
              <InfoBlock label={pick(COPY.impact)} body={pick(PARTNER_POINTS.impact)} />
              <InfoBlock label={pick(COPY.fans)} body={pick(PARTNER_POINTS.fans)} />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {linked ? (
                <a
                  href={sponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-amethyst bg-amethyst/15 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-soul shadow-[0_0_24px_rgba(168,85,247,0.2)] transition-colors hover:bg-amethyst/25"
                >
                  {pick(COPY.visit)}
                  <ArrowRightIcon size={16} />
                </a>
              ) : (
                <span className="inline-flex min-h-[46px] items-center justify-center border border-edge bg-void/50 px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ash-dim">
                  {pick(COPY.noLink)}
                </span>
              )}
              <Link
                href="/contact"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-edge-bright bg-void/50 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre transition-colors hover:border-amethyst/70 hover:text-soul"
                onClick={onClose}
              >
                {pick(FALLBACK_PAGE.ctaPrimary.label)}
                <ArrowRightIcon size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValuePropCard({ item, index }: { item: SponsorValueProp; index: number }) {
  const { pick } = useLanguage();
  return (
    <div className="group relative min-h-[250px] overflow-hidden border border-edge bg-[linear-gradient(145deg,rgba(28,20,40,0.78),rgba(11,7,16,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-amethyst/70 hover:shadow-[0_0_34px_rgba(168,85,247,0.22)]">
      <span aria-hidden className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/75 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <span aria-hidden className="absolute -right-14 -top-14 h-36 w-36 bg-amethyst/10 blur-3xl transition-opacity group-hover:bg-glow/15" />
      <div className="relative flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amethyst">
          Benefit {String(index + 1).padStart(2, "0")}
        </span>
        <span aria-hidden className="h-2 w-8 skew-x-[-18deg] bg-amethyst/65 transition-colors group-hover:bg-glow" />
      </div>
      <h3 className="relative mt-5 font-display text-xl font-black uppercase leading-tight tracking-[0.08em] text-soul transition-colors group-hover:text-glow">
        {pick(item.title)}
      </h3>
      <p className="relative mt-4 text-sm font-medium leading-relaxed text-ash md:text-[15px]">
        {pick(item.body)}
      </p>
    </div>
  );
}

function TierCard({ tier, cta, label }: { tier: SponsorTier; cta: SponsorCta; label: string }) {
  const { pick } = useLanguage();
  return (
    <div
      className="group relative flex flex-col overflow-hidden border border-edge bg-[linear-gradient(180deg,rgba(28,20,40,0.78),rgba(11,7,16,0.96))] transition-transform duration-300 hover:-translate-y-1"
      style={{ borderTopColor: tier.color, borderTopWidth: 3 }}
    >
      <span aria-hidden className="absolute -right-20 -top-20 h-44 w-44 opacity-20 blur-3xl" style={{ backgroundColor: tier.color }} />
      <div className="relative p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ash-dim">
          {label}
        </p>
        <h3
          className="mt-3 font-display text-xl font-bold uppercase tracking-[0.08em]"
          style={{ color: tier.color }}
        >
          {pick(tier.name)}
        </h3>
        <ul className="mt-5 flex flex-col gap-3 border-t border-edge pt-5">
          {tier.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-text-primary">
              <span
                className="mt-1.5 inline-block h-2 w-2 shrink-0"
                style={{ backgroundColor: tier.color, transform: "skewX(-20deg)" }}
                aria-hidden
              />
              <span>{pick(benefit)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative mt-auto p-5 pt-0">
        <Link
          href={cta.href}
          className="flex min-h-[44px] items-center justify-center gap-2 border border-primary px-4 py-2.5 text-center font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-primary transition-colors hover:bg-primary/15"
        >
          {pick(cta.label)}
          <ArrowRightIcon size={15} />
        </Link>
      </div>
    </div>
  );
}

export default function SponsorsClient() {
  const { pick } = useLanguage();
  const content = useContent();
  const data = content.sponsors as {
    page?: SponsorsPageCopy;
    sponsors: Sponsor[];
    tiers: SponsorTier[];
  };
  const [activeSponsor, setActiveSponsor] = useState<Sponsor | null>(null);
  const page = { ...FALLBACK_PAGE, ...(data.page ?? {}) };
  const valueProps = page.valueProps?.length ? page.valueProps : FALLBACK_PAGE.valueProps;
  const sponsorCount = useMemo(() => data.sponsors.length, [data.sponsors.length]);
  const contactEmail = content.site?.contact?.email || "contact@niightmare.gg";

  return (
    <>
      <PageHeader title={pick(page.heroTitle)} subtitle={pick(page.heroSubtitle)} />

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="relative overflow-hidden border border-edge bg-[linear-gradient(135deg,rgba(28,20,40,0.72),rgba(11,7,16,0.98))] p-5 shadow-glow-soft md:p-8">
          <span aria-hidden className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-glow/70 to-transparent" />
          <div className="relative grid gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <SectionLabel>{pick(COPY.wallLabel)}</SectionLabel>
              <h2 className="mt-4 font-display text-3xl font-black uppercase leading-none tracking-wide text-soul md:text-5xl">
                {pick(COPY.wallTitle)}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-spectre md:text-base">
                {pick(COPY.wallIntro)}
              </p>
            </div>
            <div className="grid grid-cols-2 border border-edge bg-void/55 sm:grid-cols-3">
              <div className="border-b border-r border-edge px-4 py-3 sm:border-b-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ash-dim">
                  {pick(page.partnersLabel)}
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-glow">{sponsorCount}</p>
              </div>
              <div className="border-b border-edge px-4 py-3 sm:border-b-0 sm:border-r">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ash-dim">
                  {pick(page.tiersLabel)}
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-soul">{data.tiers.length}</p>
              </div>
              <div className="col-span-2 px-4 py-3 sm:col-span-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ash-dim">
                  {pick(COPY.official)}
                </p>
                <p className="mt-1 font-display text-lg font-bold uppercase text-spectre">
                  NIIGHTMARE
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel>{pick(page.partnersLabel)}</SectionLabel>
              <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.08em] text-soul md:text-4xl">
                {pick(COPY.wallTitle)}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ash md:text-right">
              {pick(COPY.wallIntro)}
            </p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.sponsors.map((sponsor, index) => (
              <SponsorCard key={sponsor.id} sponsor={sponsor} index={index} onOpen={setActiveSponsor} />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <SectionLabel>{pick(page.valueLabel)}</SectionLabel>
          <h2 className="mt-3 max-w-3xl font-display text-2xl font-black uppercase leading-tight tracking-[0.08em] text-soul md:text-4xl">
            {pick(page.ctaTitle)}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.slice(0, 4).map((item, index) => (
              <ValuePropCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <SectionLabel>{pick(COPY.tierLabel)}</SectionLabel>
          <p className="mt-4 max-w-2xl text-text-muted">
            {pick(page.tiersIntro)}
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {data.tiers.map((tier) => (
              <TierCard key={tier.id} tier={tier} cta={page.ctaPrimary} label={pick(page.tiersLabel)} />
            ))}
          </div>
        </div>

        <div className="relative mt-16 overflow-hidden border border-edge-bright bg-[linear-gradient(135deg,rgba(168,85,247,0.16),rgba(28,20,40,0.86)_38%,rgba(11,7,16,0.98))] p-6 text-center shadow-[0_0_32px_rgba(168,85,247,0.16)] md:p-10">
          <span aria-hidden className="scythe-line absolute inset-x-0 top-0 h-[2px]" />
          <h2 className="font-display text-2xl font-bold uppercase tracking-[0.12em] text-soul md:text-4xl">
            {pick(page.ctaTitle)}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ash md:text-base">
            {pick(page.ctaBody)}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={page.ctaPrimary.href}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 border border-amethyst bg-amethyst/20 px-7 py-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-soul shadow-[0_0_30px_rgba(168,85,247,0.28)] transition-colors hover:bg-amethyst/30"
            >
              {pick(page.ctaPrimary.label)}
              <ArrowRightIcon size={16} />
            </Link>
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex min-h-[50px] items-center justify-center border border-edge-bright bg-void/45 px-7 py-3 font-mono text-xs font-bold tracking-[0.12em] text-spectre transition-colors hover:border-amethyst/70 hover:text-soul"
            >
              {contactEmail}
            </a>
          </div>
        </div>
      </section>

      <SponsorModal sponsor={activeSponsor} onClose={() => setActiveSponsor(null)} />
    </>
  );
}
