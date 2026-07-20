import type { Metadata } from "next";
import React from "react";
import Hero from "@/components/sections/Hero";
import UpcomingMatch from "@/components/sections/UpcomingMatch";
import RecentResults from "@/components/sections/RecentResults";
import AboutUs from "@/components/sections/AboutUs";
// PartnerStrip is built and ready, but hidden until real partners exist —
// showing placeholder sponsors as social proof would mislead visitors.
// To re-enable: import it and drop <PartnerStrip /> back after <UpcomingMatch />.
// import PartnerStrip from "@/components/sections/PartnerStrip";
import JsonLd from "@/components/seo/JsonLd";
import { upcomingEventSchema } from "@/lib/seo";

// The homepage inherits its title/description/OG from the root layout metadata;
// only add the self-referencing canonical so search engines collapse
// apex/query-string variants onto the clean https://…/ URL.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* Preload the hero (LCP) image so it isn't queued behind fonts/scripts.
          Mobile and desktop crops are media-scoped so only one is fetched. */}
      <link
        rel="preload"
        as="image"
        href="/home-reaper-mobile-480.webp"
        imageSrcSet="/home-reaper-mobile-480.webp 480w, /home-reaper.webp 720w"
        imageSizes="100vw"
        media="(max-width: 1023px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/home-reaper-desktop-1280.webp"
        imageSrcSet="/home-reaper-desktop-1280.webp 1280w, /home-reaper-desktop.webp 1920w"
        imageSizes="100vw"
        media="(min-width: 1024px)"
        fetchPriority="high"
      />
      <JsonLd data={upcomingEventSchema()} />
      <Hero />
      <UpcomingMatch />
      <RecentResults />
      <AboutUs />
    </>
  );
}
