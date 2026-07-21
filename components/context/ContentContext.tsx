"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import matchesSeed from "@/data/matches.json";
import rosterSeed from "@/data/roster.json";
import sponsorsSeed from "@/data/sponsors.json";
import newsSeed from "@/data/news.json";
import siteSeed from "@/data/site.json";
import achievementsSeed from "@/data/achievements.json";

/**
 * Live site content. The root layout server-renders the real cloud content and
 * passes it in as `initial`, so the first paint normally shows the live data.
 * The bundled JSON is only a fallback for any section the server didn't supply.
 * If a cold build had to use that fallback, the provider performs one recovery
 * read after hydration instead of leaving stale seed data on screen.
 */
export interface Content {
  matches: typeof matchesSeed;
  roster: typeof rosterSeed;
  sponsors: typeof sponsorsSeed;
  news: typeof newsSeed;
  site: typeof siteSeed;
  achievements: typeof achievementsSeed;
}

const SEED: Content = {
  matches: matchesSeed,
  roster: rosterSeed,
  sponsors: sponsorsSeed,
  news: newsSeed,
  site: siteSeed,
  achievements: achievementsSeed,
};

const ContentCtx = createContext<Content>(SEED);

type ContentEnvelope = Partial<Content> & {
  __contentSource?: "fallback";
};

function mergeContent(value?: ContentEnvelope | null): Content {
  if (!value) return SEED;
  const { __contentSource: _source, ...sections } = value;
  return { ...SEED, ...sections };
}

export function ContentProvider({
  initial,
  children,
}: {
  initial?: ContentEnvelope | null;
  children: React.ReactNode;
}) {
  const [content, setContent] = useState<Content>(() => mergeContent(initial));

  useEffect(() => {
    const controller = new AbortController();

    // Reconcile once with the runtime cache. Normal pages receive the same live
    // payload and remain visually stable; a cold deployment that prerendered
    // fallback data repairs itself immediately after hydration.
    fetch("/api/content", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Content recovery failed (${response.status})`);
        return response.json() as Promise<ContentEnvelope>;
      })
      .then((live) => {
        if (!controller.signal.aborted && live.__contentSource !== "fallback") {
          setContent(mergeContent(live));
        }
      })
      .catch(() => {
        // Keep the already-rendered fallback. The next page load/ISR can retry.
      });

    return () => controller.abort();
  }, []);

  return <ContentCtx.Provider value={content}>{children}</ContentCtx.Provider>;
}

export const useContent = () => useContext(ContentCtx);
