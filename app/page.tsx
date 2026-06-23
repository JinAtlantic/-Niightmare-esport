import React from "react";
import Hero from "@/components/sections/Hero";
import UpcomingMatch from "@/components/sections/UpcomingMatch";
import RecentResults from "@/components/sections/RecentResults";
import VideoSection from "@/components/sections/VideoSection";
// PartnerStrip is built and ready, but hidden until real partners exist —
// showing placeholder sponsors as social proof would mislead visitors.
// To re-enable: import it and drop <PartnerStrip /> back after <UpcomingMatch />.
// import PartnerStrip from "@/components/sections/PartnerStrip";
import JsonLd from "@/components/seo/JsonLd";
import { upcomingEventSchema } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      {/* Preload the hero (LCP) image so it isn't queued behind fonts/scripts.
          Mobile and desktop crops are media-scoped so only one is fetched. */}
      <link
        rel="preload"
        as="image"
        href="/home-reaper.webp"
        media="(max-width: 1023px)"
      />
      <link
        rel="preload"
        as="image"
        href="/home-reaper-desktop.webp"
        media="(min-width: 1024px)"
      />
      <JsonLd data={upcomingEventSchema()} />
      <Hero />
      <UpcomingMatch />
      <RecentResults />
      <VideoSection />
    </>
  );
}
