"use client";

import React from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import Reveal from "@/components/ui/Reveal";
import {
  DiscordIcon,
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
  TiktokIcon,
} from "@/components/ui/Icons";
import type { Bilingual } from "@/lib/types";

const COPY = {
  kicker: { en: "JOIN THE COMMUNITY", lo: "ເຂົ້າຮ່ວມຊຸມຊົນ" } as Bilingual,
  title: { en: "JOIN THE NIIGHTMARE", lo: "ເຂົ້າຮ່ວມ NIIGHTMARE" } as Bilingual,
  body: {
    en: "Follow the squad, catch every match live, and be first to the news. The horde is growing — step in.",
    lo: "ຕິດຕາມທີມ, ເບິ່ງທຸກນັດແບບສົດ ແລະ ຮັບຂ່າວກ່ອນໃຜ. ຊຸມຊົນຂອງເຮົາກໍາລັງເຕີບໃຫຍ່ — ເຂົ້າມາຮ່ວມກັນ.",
  } as Bilingual,
  cta: { en: "JOIN DISCORD", lo: "ເຂົ້າຮ່ວມ Discord" } as Bilingual,
};

interface SiteShape {
  communityUrl?: string;
  contact?: {
    discord?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
}

/**
 * Final home-page band — turns a visitor into a follower. A loud headline, the
 * Discord primary action (community URL, with the contact Discord as fallback),
 * and the club's social icons. Social row only renders the channels that have a
 * URL, so empty handles never show a dead link.
 */
export default function ClosingCTA() {
  const { pick } = useLanguage();
  const site = useContent().site as SiteShape;
  const contact = site.contact ?? {};
  const discord = site.communityUrl || contact.discord || "";

  const socials = [
    { href: contact.facebook, Icon: FacebookIcon, label: "Facebook" },
    { href: contact.instagram, Icon: InstagramIcon, label: "Instagram" },
    { href: contact.youtube, Icon: YoutubeIcon, label: "YouTube" },
    { href: contact.tiktok, Icon: TiktokIcon, label: "TikTok" },
    { href: contact.discord, Icon: DiscordIcon, label: "Discord" },
  ].filter((s): s is { href: string; Icon: typeof DiscordIcon; label: string } =>
    Boolean(s.href && s.href.trim())
  );

  return (
    <section className="relative overflow-hidden border-t border-edge bg-gradient-to-b from-void via-crypt2/40 to-void px-4 py-24 md:px-6 md:py-28">
      <div className="scythe-line absolute inset-x-0 top-0 h-[2px]" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[min(900px,94vw)] -translate-x-1/2 -translate-y-1/2 bg-amethyst/14 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(circle_at_center,#000,transparent_72%)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.9) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative z-[1] mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.34em] text-amethyst">
            {pick(COPY.kicker)}
          </p>
          <h2 className="keep-latin mt-4 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-soul [text-shadow:0_0_34px_rgba(168,85,247,0.45)] sm:text-5xl md:text-6xl">
            {pick(COPY.title)}
          </h2>
          <div
            aria-hidden
            className="mx-auto mt-6 h-[2px] w-[180px] -skew-x-[24deg] bg-gradient-to-r from-transparent via-glow to-transparent shadow-[0_0_18px_rgba(168,85,247,0.65)]"
          />
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ash sm:text-base">
            {pick(COPY.body)}
          </p>
        </Reveal>

        {discord && (
          <Reveal>
            <div className="mt-9 flex justify-center">
              <a
                href={discord}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 rounded-md border border-amethyst/70 bg-gradient-to-b from-amethyst to-amethyst-deep px-8 py-4 font-display text-base font-bold uppercase tracking-[0.18em] text-soul shadow-[0_0_30px_rgba(168,85,247,0.45)] transition-all duration-300 hover:from-glow hover:to-amethyst hover:shadow-[0_0_48px_rgba(168,85,247,0.75)] focus:outline-none focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-void"
              >
                <DiscordIcon
                  size={20}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                {pick(COPY.cta)}
              </a>
            </div>
          </Reveal>
        )}

        {socials.length > 0 && (
          <Reveal>
            <div className="mt-8 flex items-center justify-center gap-3">
              {socials.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-md border border-edge bg-void/50 text-spectre backdrop-blur-sm transition-all duration-300 hover:border-amethyst/60 hover:text-glow hover:shadow-[0_0_18px_-4px_rgba(168,85,247,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
