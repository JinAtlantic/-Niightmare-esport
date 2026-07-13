"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import { DiscordIcon, FacebookIcon, InstagramIcon, LiquipediaIcon, MailIcon, YoutubeIcon } from "@/components/ui/Icons";
import { useContent } from "@/components/context/ContentContext";
import SponsorMarquee from "@/components/layout/SponsorMarquee";
import { safeHref, safeMailto } from "@/lib/safety";

const LIQUIPEDIA_URL = "https://liquipedia.net/mobilelegends/Niightmare_Esports";

export default function Footer() {
  const { t } = useLanguage();
  const { site } = useContent();

  // Footer channels are admin-editable (site.contact). Each shows only when a
  // value is set, so emptying a link in the admin removes its icon here.
  const c = site.contact as Record<string, string | undefined>;
  const socials = [
    { href: safeMailto(c.email), label: "Email", Icon: MailIcon },
    { href: safeHref(c.facebook), label: "Facebook", Icon: FacebookIcon },
    { href: safeHref(c.instagram), label: "Instagram", Icon: InstagramIcon },
    { href: safeHref(c.youtube), label: "YouTube", Icon: YoutubeIcon },
    { href: safeHref(c.discord), label: "Discord", Icon: DiscordIcon },
    { href: LIQUIPEDIA_URL, label: "Liquipedia", Icon: LiquipediaIcon },
  ].filter((s): s is { href: string; label: string; Icon: typeof MailIcon } => !!s.href);

  return (
    <footer className="relative mt-20 border-t border-edge bg-card">
      <div className="scythe-line absolute inset-x-0 -top-px h-[2px] opacity-60" aria-hidden />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6">
        {/* Brand — typographic wordmark with a slow violet shimmer */}
        <div>
          <div className="group inline-flex flex-col">
            <div className="flex items-baseline gap-2.5">
              <h2 className="wordmark-shimmer keep-latin font-display text-3xl font-bold uppercase leading-none tracking-[0.12em] transition-transform duration-300 ease-out [text-shadow:0_2px_30px_rgba(168,85,247,0.45)] group-hover:-translate-y-0.5 sm:text-[2.1rem]">
                NIIGHTMARE
              </h2>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.42em] text-glow">
                Esport
              </span>
            </div>

            {/* scythe rule — grows on hover */}
            <span
              aria-hidden
              className="scythe-line mt-3.5 block h-[2px] w-20 opacity-60 transition-all duration-500 ease-out group-hover:w-full"
            />

            {/* tagline with a live pulse node */}
            <p className="mt-3.5 flex items-center gap-2.5 font-display text-xs uppercase tracking-[0.3em] text-glow">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amethyst opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
              </span>
              {t("footer.tagline")}
            </p>
          </div>
        </div>

        {/* Socials */}
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-text-primary">
            {t("footer.follow_us")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                aria-label={label}
                className="hover-glow grid h-11 w-11 place-items-center border border-edge bg-void/60 text-text-muted hover:text-accent"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Partner logo marquee — replaces the old Quick Links column */}
      <SponsorMarquee />

      {/* Sub-footer — game disclaimer (fan-content), copyright, legal links */}
      <div className="border-t border-edge bg-void/40">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          {/* Game / trademark disclaimer — small, muted, clean */}
          <p className="mx-auto max-w-3xl text-center text-[11px] leading-relaxed text-ash md:mx-0 md:text-left">
            All game images, hero assets, and trademarks are the property of their
            respective owners (Moonton / Mobile Legends: Bang Bang) and are used
            for informational purposes under Fan Content policies.
          </p>

          <div className="mt-5 flex flex-col items-center gap-4 border-t border-edge/60 pt-5 md:flex-row md:justify-between md:gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
              {t("footer.copyright")}
            </p>

            {/* Legal links — hover to a faint neon violet */}
            <nav className="flex items-center gap-3 text-xs" aria-label="Legal">
              <Link
                href="/privacy"
                className="py-1 text-text-muted transition-colors duration-200 hover:text-accent"
              >
                {t("footer.privacy")}
              </Link>
              <span aria-hidden className="text-edge-bright">
                ·
              </span>
              <Link
                href="/terms"
                className="py-1 text-text-muted transition-colors duration-200 hover:text-accent"
              >
                {t("footer.terms")}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
