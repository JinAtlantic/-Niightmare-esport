"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import matchesSeed from "@/data/matches.json";
import rosterSeed from "@/data/roster.json";
import sponsorsSeed from "@/data/sponsors.json";
import newsSeed from "@/data/news.json";
import siteSeed from "@/data/site.json";

/**
 * Live site content. Seeded with the bundled JSON (so SSR + first paint render
 * the last-deployed data with no flash), then refreshed from /api/content on
 * mount so admin edits made on the cloud store appear without a redeploy.
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

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Content>(SEED);

  useEffect(() => {
    let alive = true;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data) setContent({ ...SEED, ...data });
      })
      .catch(() => {
        /* keep the seed on any error — the site still works */
      });
    return () => {
      alive = false;
    };
  }, []);

  return <ContentCtx.Provider value={content}>{children}</ContentCtx.Provider>;
}

export const useContent = () => useContext(ContentCtx);
