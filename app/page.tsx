import React from "react";
import Hero from "@/components/sections/Hero";
import UpcomingMatch from "@/components/sections/UpcomingMatch";
import TeamSnapshot from "@/components/sections/TeamSnapshot";
import TrophyCabinet from "@/components/sections/TrophyCabinet";
import JsonLd from "@/components/seo/JsonLd";
import { upcomingEventSchema } from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <JsonLd data={upcomingEventSchema()} />
      <Hero />
      <UpcomingMatch />
      <TeamSnapshot />
      <TrophyCabinet />
    </>
  );
}
