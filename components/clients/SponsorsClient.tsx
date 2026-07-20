"use client";

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/context/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import AuroraHalos from "@/components/ui/AuroraHalos";
import SectionLabel from "@/components/ui/SectionLabel";
import { useModalFocus } from "@/components/ui/useModalFocus";
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
import { safeHref, safeImageSrc } from "@/lib/safety";
import type { Bilingual, Sponsor } from "@/lib/types";

interface SponsorValueProp {
  id: string;
  title: Bilingual;
  body: Bilingual;
}

interface SponsorsPageCopy {
  heroTitle: Bilingual;
  valueLabel: Bilingual;
  valueProps: SponsorValueProp[];
}

const FALLBACK_PAGE = sponsorsSeed.page as SponsorsPageCopy;

const PARTNER_TERM_OLD = "ພາກສ່ວນ";
const PARTNER_TERM = "ພາດເນີ້";

/** Keep legacy Supabase copy consistent with the public Sponsors terminology. */
function useSponsorPick() {
  const { pick } = useLanguage();
  return (value?: Bilingual | null) => pick(value).replaceAll(PARTNER_TERM_OLD, PARTNER_TERM);
}

const COPY = {
  wallLabel: { en: "OFFICIAL PARTNERS", lo: "ພາດເນີ້ທາງການ" },
  official: { en: "Official NIIGHTMARE Partner", lo: "ພາດເນີ້ທາງການຂອງ NIIGHTMARE" },
  modalIntro: {
    en: "An official partner helping power the club's competitive journey, content, and fan moments across the season.",
    lo: "ພາດເນີ້ທາງການທີ່ຊ່ວຍຜັກດັນເສັ້ນທາງແຂ່ງຂັນ ຄອນເທນ ແລະຊ່ວງເວລາຂອງແຟນຄັບຕະຫຼອດຊີຊັນ.",
  },
  about: { en: "About", lo: "ກ່ຽວກັບ" },
  connect: { en: "Connect", lo: "ຊ່ອງທາງຕິດຕໍ່" },
  visit: { en: "Visit Website", lo: "ໄປທີ່ເວັບໄຊ" },
  close: { en: "Close", lo: "ປິດ" },
  facebook: { en: "Become Our Partner", lo: "ມາຮ່ວມເປັນພາດເນີ້ກັບພວກເຮົາ" },
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
  const pick = useSponsorPick();
  const linked = isExternalLink(sponsor?.url);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModalFocus({ active: Boolean(sponsor), containerRef: dialogRef, initialFocusRef: closeRef, onClose });

  if (!sponsor || typeof document === "undefined") return null;

  const hasDescription = sponsor.description && (sponsor.description.en || sponsor.description.lo);
  const category = sponsor.category && (sponsor.category.en || sponsor.category.lo);

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={sponsor.name}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto border border-edge-bright bg-[linear-gradient(150deg,rgba(22,16,31,0.98),rgba(11,7,16,0.99))] shadow-[0_0_54px_rgba(168,85,247,0.24)]">
        <span aria-hidden className="scythe-line absolute inset-x-0 top-0 h-[2px]" />
        <button
          ref={closeRef}
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
    </div>,
    document.body
  );
}

function SponsorConnect({ sponsor, linked }: { sponsor: Sponsor; linked: boolean }) {
  const pick = useSponsorPick();
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
  const pick = useSponsorPick();
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
  const pick = useSponsorPick();
  const content = useContent();
  const data = content.sponsors as {
    page?: SponsorsPageCopy;
    sponsors: Sponsor[];
  };
  const [activeSponsor, setActiveSponsor] = useState<Sponsor | null>(null);
  const page = { ...FALLBACK_PAGE, ...(data.page ?? {}) };
  const valueProps = page.valueProps?.length ? page.valueProps : FALLBACK_PAGE.valueProps;
  const facebookHref =
    safeHref(content.site?.contact?.facebook) || safeHref("https://facebook.com/niightmareesports");

  return (
    <>
      <PageHeader title={pick(page.heroTitle)} />

      <section className="relative isolate mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <AuroraHalos />
        {/* Partner wall — logo first */}
        <SectionLabel centered>{pick(COPY.wallLabel)}</SectionLabel>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {data.sponsors.map((sponsor) => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} onOpen={setActiveSponsor} />
          ))}
        </div>

        {/* Benefits — compact */}
        <div className="mt-12 md:mt-16">
          <SectionLabel centered>{pick(page.valueLabel)}</SectionLabel>
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {valueProps.slice(0, 4).map((item, index) => (
              <ValuePropCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>

        {/* CTA — compact */}
        <div className="relative mt-12 overflow-hidden border border-edge-bright bg-[linear-gradient(135deg,rgba(168,85,247,0.16),rgba(28,20,40,0.88)_42%,rgba(11,7,16,0.98))] p-5 shadow-[0_0_32px_rgba(168,85,247,0.16)] md:mt-16 md:p-8">
          <span aria-hidden className="scythe-line absolute inset-x-0 top-0 h-[2px]" />
          <div className="flex justify-center">
            <div className="flex shrink-0">
              <a
                href={facebookHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap border border-amethyst bg-amethyst/20 px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-soul shadow-[0_0_28px_rgba(168,85,247,0.26)] transition-colors hover:bg-amethyst/30"
              >
                <FacebookIcon size={17} />
                {pick(COPY.facebook)}
                <ArrowRightIcon size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <SponsorModal sponsor={activeSponsor} onClose={() => setActiveSponsor(null)} />
    </>
  );
}
