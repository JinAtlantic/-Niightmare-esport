"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";
import TeamLogo from "@/components/TeamLogo";
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
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3">
            <TeamLogo size={48} />
            <div>
              <p className="keep-latin font-rajdhani text-lg font-bold uppercase tracking-[0.18em] text-text-primary">
                NIIGHTMARE
              </p>
              <p className="font-display text-xs uppercase tracking-[0.2em] text-accent">
                {t("footer.tagline")}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm text-text-muted">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* Quick links */}
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-text-primary">
            {t("footer.quick_links")}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-text-muted transition-colors hover:text-accent"
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
                className="hover-glow grid h-10 w-10 place-items-center border border-edge bg-void/60 text-text-muted hover:text-accent"
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
