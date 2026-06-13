"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import TeamLogo from "@/components/TeamLogo";
import { CloseIcon, MenuIcon } from "@/components/Icons";
import site from "@/data/site.json";

const NAV_ITEMS = [
  { href: "/", key: "nav.home" },
  { href: "/roster", key: "nav.roster" },
  { href: "/matches", key: "nav.matches" },
  { href: "/sponsors", key: "nav.sponsors" },
  { href: "/contact", key: "nav.contact" },
];

export default function Navbar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-edge bg-void/90 backdrop-blur-md"
          : "border-transparent bg-void/40 backdrop-blur-sm"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        {/* Left: logo + wordmark */}
        <Link href="/" className="flex items-center gap-3" aria-label="NIIGHTMARE home">
          <TeamLogo size={40} />
          <span className="keep-latin font-rajdhani text-xl font-bold uppercase tracking-[0.18em] text-text-primary">
            NIIGHTMARE
          </span>
        </Link>

        {/* Center: nav links (desktop) */}
        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative font-display text-sm font-semibold uppercase tracking-[0.14em] transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 hover:text-text-primary ${
                  isActive(item.href)
                    ? "text-text-primary [text-shadow:0_0_12px_rgba(194,68,196,0.7)] after:w-full"
                    : "text-text-muted after:w-0 hover:after:w-full"
                }`}
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: language toggle + CTA (desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageToggle />
          <a
            href={site.communityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-glow border border-primary px-4 py-2 font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-primary hover:bg-primary/15"
          >
            {t("nav.join_community")}
          </a>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="hover-glow grid h-10 w-10 place-items-center border border-edge text-text-primary"
          >
            <MenuIcon size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile slide-in drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-void/80 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[78%] max-w-sm flex-col border-l border-edge bg-card transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-edge px-4">
            <span className="keep-latin font-rajdhani text-lg font-bold uppercase tracking-[0.18em] text-text-primary">
              NIIGHTMARE
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="hover-glow grid h-10 w-10 place-items-center border border-edge text-text-primary"
            >
              <CloseIcon size={22} />
            </button>
          </div>
          <ul className="flex flex-col gap-1 px-4 py-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block border-l-2 px-4 py-3 font-display text-base font-semibold uppercase tracking-[0.14em] transition-colors ${
                    isActive(item.href)
                      ? "border-primary bg-primary/10 text-text-primary"
                      : "border-transparent text-text-muted hover:border-edge hover:text-text-primary"
                  }`}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto p-4">
            <a
              href={site.communityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover-glow block border border-primary px-4 py-3 text-center font-display text-sm font-semibold uppercase tracking-[0.12em] text-text-primary hover:bg-primary/15"
            >
              {t("nav.join_community")}
            </a>
          </div>
        </aside>
      </div>
    </header>
  );
}
