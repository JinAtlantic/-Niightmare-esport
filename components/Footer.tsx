"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import { DiscordIcon, FacebookIcon, MailIcon, TiktokIcon, YoutubeIcon } from "@/components/Icons";
import site from "@/data/site.json";

const NAV_ITEMS = [
  { href: "/", key: "nav.home" },
  { href: "/roster", key: "nav.roster" },
  { href: "/matches", key: "nav.matches" },
  { href: "/sponsors", key: "nav.sponsors" },
  { href: "/contact", key: "nav.contact" },
];

export default function Footer() {
  const { t } = useLanguage();

  const socials = [
    { href: `mailto:${site.contact.email}`, label: "Email", Icon: MailIcon },
    { href: site.contact.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: site.contact.youtube, label: "YouTube", Icon: YoutubeIcon },
    { href: site.contact.tiktok, label: "TikTok", Icon: TiktokIcon },
    { href: site.contact.discord, label: "Discord", Icon: DiscordIcon },
  ];

  return (
    <footer className="relative mt-20 border-t border-edge bg-card">
      <div className="scythe-line absolute inset-x-0 -top-px h-[2px] opacity-60" aria-hidden />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3 md:px-6">
        {/* Brand — typographic wordmark with a slow violet shimmer */}
        <div>
          <div className="group inline-flex flex-col">
            <div className="flex items-baseline gap-2.5">
              <h2 className="wordmark-shimmer keep-latin font-display text-3xl font-bold uppercase leading-none tracking-[0.12em] transition-transform duration-300 ease-out [text-shadow:0_2px_30px_rgba(168,85,247,0.45)] group-hover:-translate-y-0.5 sm:text-[2.1rem]">
                NIIGHTMARE
              </h2>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.42em] text-amethyst/85">
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

        {/* Quick links */}
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-text-primary">
            {t("footer.quick_links")}
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-[44px] items-center text-sm text-text-muted transition-colors hover:text-accent"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
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

      <div className="border-t border-edge">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-center md:flex-row md:px-6 md:text-left">
          <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
            {t("footer.copyright")}
          </p>
          <p className="font-display text-xs uppercase tracking-[0.2em] text-accent">
            {t("footer.tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
