import React from "react";
import Hero from "@/components/sections/Hero";
import UpcomingMatch from "@/components/sections/UpcomingMatch";
import RecentResults from "@/components/sections/RecentResults";
import RosterSpotlight from "@/components/sections/RosterSpotlight";
import TrophyCabinet from "@/components/sections/TrophyCabinet";
import VideoSection from "@/components/sections/VideoSection";
import ClosingCTA from "@/components/sections/ClosingCTA";
// PartnerStrip is built and ready, but hidden until real partners exist —
// showing placeholder sponsors as social proof would mislead visitors.
// To re-enable: import it and drop <PartnerStrip /> back after <UpcomingMatch />.
// import PartnerStrip from "@/components/sections/PartnerStrip";
import JsonLd from "@/components/seo/JsonLd";
import { upcomingEventSchema } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <JsonLd data={upcomingEventSchema()} />
      <Hero />
      <UpcomingMatch />
      <RecentResults />
      <RosterSpotlight />
      <TrophyCabinet />
      <VideoSection />
      <ClosingCTA />
    </>
  );
}
