"use client";

import React, { createContext, useContext } from "react";
import matchesSeed from "@/data/matches.json";
import rosterSeed from "@/data/roster.json";
import sponsorsSeed from "@/data/sponsors.json";
import newsSeed from "@/data/news.json";
import siteSeed from "@/data/site.json";

/**
 * Live site content. The root layout server-renders the real cloud content and
 * passes it in as `initial`, so the first paint already shows the live data —
 * no client refetch, no seed→cloud reflow. The bundled JSON is only a fallback
 * for any section the server didn't supply.
 */
export interface Content {
  matches: typeof matchesSeed;
  roster: typeof rosterSeed;
  sponsors: typeof sponsorsSeed;
  news: typeof newsSeed;
  site: typeof siteSeed;
}

const SEED: Content = {
  matches: matchesSeed,
  roster: rosterSeed,
  sponsors: sponsorsSeed,
  news: newsSeed,
  site: siteSeed,
};

const ContentCtx = createContext<Content>(SEED);

export function ContentProvider({
  initial,
  children,
}: {
  initial?: Partial<Content> | null;
  children: React.ReactNode;
}) {
  // Merge over the seed so a missing section still renders cleanly. Stable for
  // the life of the page — admin edits surface on the next server render
  // (revalidateTag("content")), not via a client refetch.
  const content: Content = initial ? { ...SEED, ...initial } : SEED;
  return <ContentCtx.Provider value={content}>{children}</ContentCtx.Provider>;
}

export const useContent = () => useContext(ContentCtx);
