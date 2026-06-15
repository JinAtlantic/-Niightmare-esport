import React from "react";
import Hero from "@/components/Hero";
import UpcomingMatch from "@/components/UpcomingMatch";
import NewsSection from "@/components/NewsSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <UpcomingMatch />
      <NewsSection />
    </>
  );
}
