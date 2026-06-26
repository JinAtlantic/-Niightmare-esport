"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/context/LanguageContext";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
import { useContent } from "@/components/context/ContentContext";

const NAV_ITEMS = [
  { href: "/", key: "nav.home" },
  { href: "/roster", key: "nav.roster" },
  { href: "/matches", key: "nav.matches" },
  { href: "/achievements", key: "nav.achievements" },
  { href: "/sponsors", key: "nav.sponsors" },
  { href: "/contact", key: "nav.contact" },
];

export default function Navbar() {
  const { t } = useLanguage();
  const { site } = useContent();
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
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${
          scrolled
            ? "border-edge bg-void/90 backdrop-blur-md"
            : "border-transparent bg-void/40 backdrop-blur-sm"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          {/* Left: logo lockup */}
          <Link href="/" className="flex h-full items-center" aria-label="NIIGHTMARE home">
            <Image
              src="/logo.png"
              alt="NIIGHTMARE Esports"
              width={359}
              height={285}
              priority
              className="h-10 w-auto drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)] md:h-11"
            />
          </Link>

          {/* Center: nav links (desktop) */}
          <ul className="hidden items-center gap-5 lg:flex xl:gap-7">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative font-mono text-xs font-medium uppercase tracking-[0.18em] transition-colors after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:bg-gradient-to-r after:from-amethyst after:to-glow after:transition-all after:duration-300 hover:text-soul ${
                    isActive(item.href)
                      ? "text-soul after:w-full"
                      : "text-ash after:w-0 hover:after:w-full"
                  }`}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right: language toggle + CTA (desktop) */}
          <div className="hidden items-center gap-4 lg:flex">
            <LanguageToggle />
            <a
              href={site.communityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-amethyst-deep px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-soul transition-all duration-200 hover:border-amethyst hover:bg-amethyst/15 hover:shadow-[0_0_22px_rgba(168,85,247,0.3)]"
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
              className="grid h-11 w-11 place-items-center border border-edge text-soul transition-colors hover:border-amethyst"
            >
              <MenuIcon size={22} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile slide-in drawer — sibling of <header> so its fixed overlay
          covers the whole viewport (the header's backdrop-filter would
          otherwise trap a fixed child to the header's box). */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[80%] max-w-sm flex-col border-l border-edge bg-crypt transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-edge px-4">
            <Image
              src="/logo.png"
              alt="NIIGHTMARE Esports"
              width={359}
              height={285}
              className="h-9 w-auto"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid h-11 w-11 place-items-center border border-edge text-soul transition-colors hover:border-amethyst"
            >
              <CloseIcon size={22} />
            </button>
          </div>
          <ul className="flex flex-col gap-1 px-4 py-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block border-l-2 px-4 py-3 font-mono text-sm font-medium uppercase tracking-[0.16em] transition-colors ${
                    isActive(item.href)
                      ? "border-amethyst bg-amethyst/10 text-soul"
                      : "border-transparent text-ash hover:border-edge hover:text-soul"
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
              className="flex min-h-[44px] items-center justify-center border border-amethyst-deep px-4 py-3 text-center font-mono text-xs font-bold uppercase tracking-[0.16em] text-soul transition-all duration-200 hover:border-amethyst hover:bg-amethyst/15"
            >
              {t("nav.join_community")}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
