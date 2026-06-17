import React from "react";
import Hero from "@/components/sections/Hero";
import UpcomingMatch from "@/components/sections/UpcomingMatch";
import TrophyCabinet from "@/components/sections/TrophyCabinet";
import NewsSection from "@/components/sections/NewsSection";
import JsonLd from "@/components/seo/JsonLd";
import { upcomingEventSchema } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <JsonLd data={upcomingEventSchema()} />
      <Hero />
      <UpcomingMatch />
      <TrophyCabinet />
      <NewsSection />
    </>
  );
}
