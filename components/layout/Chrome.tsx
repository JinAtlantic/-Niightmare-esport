"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LiveBanner from "@/components/layout/LiveBanner";
import Preloader from "@/components/ui/Preloader";

/**
 * Renders the public site chrome (preloader, navbar, footer) around the page —
 * except on the /admin dashboard and OBS overlay routes, which are shown
 * full-bleed with no public nav.
 */
export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isOverlay = pathname?.startsWith("/live/overlay");

  if (isAdmin || isOverlay) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Preloader />
      <Navbar />
      <main className="min-h-screen pt-16">
        <LiveBanner />
        {children}
      </main>
      <Footer />
    </>
  );
}
