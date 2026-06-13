import React from "react";
import Hero from "@/components/Hero";
import NewsSection from "@/components/NewsSection";
import UpcomingMatch from "@/components/UpcomingMatch";

export default function HomePage() {
  return (
    <>
      <Hero />
      <NewsSection />
      <UpcomingMatch />
    </>
  );
}
