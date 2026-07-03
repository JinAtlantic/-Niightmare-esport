"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import SectionLabel from "@/components/ui/SectionLabel";
import { useContent } from "@/components/context/ContentContext";
import {
  ArrowRightIcon,
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  PhoneIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "@/components/ui/Icons";
import sponsorsSeed from "@/data/sponsors.json";
import { safeHref, safeImageSrc, safeMailto } from "@/lib/safety";
import type { Bilingual, Sponsor } from "@/lib/types";

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
    en: "Tap any logo to see who they are and how to reach them.",
    lo: "ແຕະໂລໂກ້ໃດກໍ່ໄດ້ ເພື່ອເບິ່ງວ່າເປັນໃຜ ແລະຊ່ອງທາງຕິດຕໍ່.",
  },
  open: { en: "View", lo: "ເບິ່ງ" },
  official: { en: "Official NIIGHTMARE Partner", lo: "ພາກສ່ວນທາງການຂອງ NIIGHTMARE" },
  modalIntro: {
    en: "An official partner helping power the club's competitive journey, content, and fan moments across the season.",
    lo: "ພາກສ່ວນທາງການທີ່ຊ່ວຍຜັກດັນເສັ້ນທາງແຂ່ງຂັນ ຄອນເທນ ແລະຊ່ວງເວລາຂອງແຟນຄັບຕະຫຼອດຊີຊັນ.",
  },
  about: { en: "About", lo: "ກ່ຽວກັບ" },
  connect: { en: "Connect", lo: "ຊ່ອງທາງຕິດຕໍ່" },
  visit: { en: "Visit Website", lo: "ໄປທີ່ເວັບໄຊ" },
  close: { en: "Close", lo: "ປິດ" },
  partners: { en: "Partners", lo: "ພາກສ່ວນ" },
};

function sponsorInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "NM";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function isExternalLink(url: string | undefined) {
  return Boolean(safeHref(url));
}

function SponsorLogo({ sponsor, className = "" }: { sponsor: Sponsor; className?: string }) {
  const initials = sponsorInitials(sponsor.name);
  return (
    <div className={`grid place-items-center overflow-hidden ${className}`}>
      {safeImageSrc(sponsor.logo) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safeImageSrc(sponsor.logo)}
          alt={`${sponsor.name} logo`}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <span className="keep-latin font-display text-3xl font-black tracking-wide text-glow/90">
          {initials}
        </span>
      )}
    </div>
  );
}

/** Build the ordered, filtered list of contact channels for a sponsor. */
function sponsorChannels(sponsor: Sponsor) {
  const s = sponsor.socials ?? {};
  const clean = (v?: string) => (v && v.trim() && v.trim() !== "#" ? v.trim() : undefined);

  const waHref = (v: string) => {
    const link = safeHref(v);
    if (link) return link;
    const digits = v.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}` : undefined;
  };

  const items: { key: string; label: string; href?: string; Icon: typeof GlobeIcon }[] = [
    { key: "website", label: "Website", href: safeHref(sponsor.url), Icon: GlobeIcon },
    { key: "facebook", label: "Facebook", href: safeHref(clean(s.facebook)), Icon: FacebookIcon },
    { key: "instagram", label: "Instagram", href: safeHref(clean(s.instagram)), Icon: InstagramIcon },
    { key: "tiktok", label: "TikTok", href: safeHref(clean(s.tiktok)), Icon: TiktokIcon },
    { key: "youtube", label: "YouTube", href: safeHref(clean(s.youtube)), Icon: YoutubeIcon },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: clean(s.whatsapp) ? waHref(clean(s.whatsapp)!) : undefined,
      Icon: WhatsappIcon,
    },
    {
      key: "phone",
      label: "Phone",
      href: clean(s.phone) ? `tel:${clean(s.phone)!.replace(/\s+/g, "")}` : undefined,
      Icon: PhoneIcon,
    },
  ];
  return items.filter((it) => Boolean(it.href) && it.href !== "#");
}

function SponsorCard({
  sponsor,
  onOpen,
}: {
  sponsor: Sponsor;
  onOpen: (sponsor: Sponsor) => void;
}) {
  const { pick } = useLanguage();
  const category = sponsor.category && (sponsor.category.en || sponsor.category.lo);
  return (
    <button
      type="button"
      onClick={() => onOpen(sponsor)}
      className="group relative flex flex-col overflow-hidden border border-edge bg-[linear-gradient(155deg,rgba(28,20,40,0.7),rgba(11,7,16,0.98))] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-amethyst/60 md:p-5"
    >
      <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <span aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 bg-amethyst/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative grid h-20 place-items-center rounded-sm bg-void/40 px-3 transition-colors group-hover:bg-void/60 md:h-24">
        <SponsorLogo sponsor={sponsor} className="h-full w-full" />
      </div>
      <h3 className="keep-latin mt-3 line-clamp-1 font-display text-sm font-bold uppercase tracking-[0.06em] text-soul md:text-[15px]">
        {sponsor.name}
      </h3>
      {category ? (
        <p className="mt-1 line-clamp-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ash-dim">
          {pick(sponsor.category!)}
        </p>
      ) : (
        <p className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-amethyst opacity-0 transition-opacity group-hover:opacity-100">
          {pick(COPY.open)}
        </p>
      )}
    </button>
  );
}

function SponsorSocialRow({ sponsor }: { sponsor: Sponsor }) {
  const channels = sponsorChannels(sponsor);
  if (channels.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {channels.map(({ key, label, href, Icon }) => (
        <a
          key={key}
          href={href}
          target={href?.startsWith("tel:") ? undefined : "_blank"}
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="hover-glow grid h-11 w-11 place-items-center border border-edge bg-void/60 text-ash transition-colors hover:border-amethyst/70 hover:text-glow"
        >
          <Icon size={18} />
        </a>
      ))}
    </div>
  );
}

function SponsorModal({
  sponsor,
  onClose,
}: {
  sponsor: Sponsor | null;
  onClose: () => void;
}) {
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

  const hasDescription = sponsor.description && (sponsor.description.en || sponsor.description.lo);
  const category = sponsor.category && (sponsor.category.en || sponsor.category.lo);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={sponsor.name}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto border border-edge-bright bg-[linear-gradient(150deg,rgba(22,16,31,0.98),rgba(11,7,16,0.99))] shadow-[0_0_54px_rgba(168,85,247,0.24)]">
        <span aria-hidden className="scythe-line absolute inset-x-0 top-0 h-[2px]" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 border border-edge bg-void/80 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ash transition-colors hover:border-amethyst hover:text-soul"
        >
          {pick(COPY.close)}
        </button>

        {/* Header: logo + name */}
        <div className="flex flex-col items-center gap-4 border-b border-edge bg-void/45 px-6 pb-6 pt-8 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <div className="grid h-28 w-40 shrink-0 place-items-center border border-edge-bright/60 bg-void/60 p-4">
            <SponsorLogo sponsor={sponsor} className="h-full w-full" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amethyst">
              {pick(COPY.official)}
            </p>
            <h2 className="keep-latin mt-2 break-words font-display text-3xl font-black uppercase leading-none tracking-wide text-soul md:text-4xl">
              {sponsor.name}
            </h2>
            {category && (
              <span className="mt-3 inline-block border border-edge bg-crypt/60 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-spectre">
                {pick(sponsor.category!)}
              </span>
            )}
          </div>
        </div>

        {/* Body: description + connect */}
        <div className="space-y-6 p-6 md:p-7">
          <div>
            <SectionLabel>{pick(COPY.about)}</SectionLabel>
            <p className="mt-3 text-[15px] leading-relaxed text-spectre">
              {hasDescription ? pick(sponsor.description!) : pick(COPY.modalIntro)}
            </p>
          </div>

          <SponsorConnect sponsor={sponsor} linked={linked} />
        </div>
      </div>
    </div>
  );
}

function SponsorConnect({ sponsor, linked }: { sponsor: Sponsor; linked: boolean }) {
  const { pick } = useLanguage();
  const channels = sponsorChannels(sponsor);
  if (channels.length === 0 && !linked) return null;

  return (
    <div className="border-t border-edge pt-6">
      <SectionLabel>{pick(COPY.connect)}</SectionLabel>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SponsorSocialRow sponsor={sponsor} />
        {linked && (
          <a
            href={safeHref(sponsor.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-amethyst bg-amethyst/15 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-soul shadow-[0_0_24px_rgba(168,85,247,0.2)] transition-colors hover:bg-amethyst/25"
          >
            {pick(COPY.visit)}
            <ArrowRightIcon size={16} />
          </a>
        )}
      </div>
    </div>
  );
}

function ValuePropCard({ item, index }: { item: SponsorValueProp; index: number }) {
  const { pick } = useLanguage();
  return (
    <div className="group relative overflow-hidden border border-edge bg-[linear-gradient(150deg,rgba(28,20,40,0.78),rgba(11,7,16,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-amethyst/60 md:p-5">
      <span aria-hidden className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amethyst/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-center gap-2">
        <span aria-hidden className="h-2 w-6 skew-x-[-18deg] bg-amethyst/70 transition-colors group-hover:bg-glow" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-amethyst">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3 className="relative mt-3 font-display text-base font-black uppercase leading-tight tracking-[0.06em] text-soul transition-colors group-hover:text-glow md:text-lg">
        {pick(item.title)}
      </h3>
      <p className="relative mt-2 text-[13px] font-medium leading-relaxed text-ash">
        {pick(item.body)}
      </p>
    </div>
  );
}

export default function SponsorsClient() {
  const { pick } = useLanguage();
  const content = useContent();
  const data = content.sponsors as {
    page?: SponsorsPageCopy;
    sponsors: Sponsor[];
  };
  const [activeSponsor, setActiveSponsor] = useState<Sponsor | null>(null);
  const page = { ...FALLBACK_PAGE, ...(data.page ?? {}) };
  const valueProps = page.valueProps?.length ? page.valueProps : FALLBACK_PAGE.valueProps;
  const sponsorCount = useMemo(() => data.sponsors.length, [data.sponsors.length]);
  const contactEmail = content.site?.contact?.email || "contact@niightmare.gg";

  return (
    <>
      <PageHeader title={pick(page.heroTitle)} subtitle={pick(page.heroSubtitle)} />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        {/* Partner wall — logo first */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>{pick(COPY.wallLabel)}</SectionLabel>
            <h2 className="mt-3 font-display text-2xl font-black uppercase leading-none tracking-wide text-soul md:text-4xl">
              {pick(COPY.wallTitle)}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ash">
              {pick(COPY.wallIntro)}
            </p>
          </div>
          <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ash-dim">
            <span className="font-display text-2xl font-bold text-glow">{sponsorCount}</span>{" "}
            {pick(COPY.partners)}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {data.sponsors.map((sponsor) => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} onOpen={setActiveSponsor} />
          ))}
        </div>

        {/* Benefits — compact */}
        <div className="mt-12 md:mt-16">
          <SectionLabel>{pick(page.valueLabel)}</SectionLabel>
          <h2 className="mt-3 max-w-3xl font-display text-xl font-black uppercase leading-tight tracking-[0.06em] text-soul md:text-3xl">
            {pick(page.ctaTitle)}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {valueProps.slice(0, 4).map((item, index) => (
              <ValuePropCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>

        {/* CTA — compact */}
        <div className="relative mt-12 overflow-hidden border border-edge-bright bg-[linear-gradient(135deg,rgba(168,85,247,0.16),rgba(28,20,40,0.88)_42%,rgba(11,7,16,0.98))] p-5 shadow-[0_0_32px_rgba(168,85,247,0.16)] md:mt-16 md:p-8">
          <span aria-hidden className="scythe-line absolute inset-x-0 top-0 h-[2px]" />
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="max-w-xl">
              <h2 className="font-display text-xl font-bold uppercase tracking-[0.1em] text-soul md:text-3xl">
                {pick(page.ctaTitle)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ash md:text-[15px]">
                {pick(page.ctaBody)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row md:flex-col lg:flex-row">
              <a
                href={
                  page.ctaPrimary.href && page.ctaPrimary.href !== "/contact"
                    ? safeHref(page.ctaPrimary.href)
                    : safeMailto(contactEmail, "mailto:contact@niightmare.gg")
                }
                className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap border border-amethyst bg-amethyst/20 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-soul shadow-[0_0_28px_rgba(168,85,247,0.26)] transition-colors hover:bg-amethyst/30"
              >
                {pick(page.ctaPrimary.label)}
                <ArrowRightIcon size={16} />
              </a>
              <a
                href={safeMailto(contactEmail, "mailto:contact@niightmare.gg")}
                className="inline-flex min-h-[48px] items-center justify-center whitespace-nowrap border border-edge-bright bg-void/45 px-6 py-3 font-mono text-xs font-bold tracking-[0.1em] text-spectre transition-colors hover:border-amethyst/70 hover:text-soul"
              >
                {contactEmail}
              </a>
            </div>
          </div>
        </div>
      </section>

      <SponsorModal sponsor={activeSponsor} onClose={() => setActiveSponsor(null)} />
    </>
  );
}
