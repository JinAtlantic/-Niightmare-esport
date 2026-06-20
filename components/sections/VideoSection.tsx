"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { PlayIcon, CloseIcon } from "@/components/ui/Icons";
import type { Bilingual } from "@/lib/types";

interface VideoItem {
  id: string;
  /** The YouTube video id (the part after watch?v= or youtu.be/). */
  youtubeId: string;
  title?: Bilingual;
  /** Marks the large hero clip; first item is used if none is flagged. */
  featured?: boolean;
}

// YouTube serves the cover art for every public video, so no thumbnails need to
// be uploaded — the hero clip uses the hi-res frame, the rail uses the lighter one.
const thumb = (id: string, hi = false) =>
  `https://i.ytimg.com/vi/${id}/${hi ? "maxresdefault" : "hqdefault"}.jpg`;

function VideoThumb({
  video,
  featured = false,
  onPlay,
}: {
  video: VideoItem;
  featured?: boolean;
  onPlay: () => void;
}) {
  const { pick, t } = useLanguage();
  const title = video.title ? pick(video.title) : "";

  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`${title || "NIIGHTMARE"} — ${t("common.watch_vod")}`}
      className="clip-esports group relative block aspect-video w-full overflow-hidden border border-edge bg-crypt transition-all duration-300 hover:border-amethyst/70 hover:shadow-[0_0_30px_-6px_rgba(168,85,247,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb(video.youtubeId, featured)}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-void via-void/30 to-transparent" />

      {/* play sigil */}
      <span
        aria-hidden
        className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-amethyst/60 bg-void/55 text-glow shadow-[0_0_24px_rgba(168,85,247,0.5)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 ${
          featured ? "h-16 w-16" : "h-12 w-12"
        }`}
      >
        <PlayIcon size={featured ? 26 : 20} />
      </span>

      {title && (
        <span
          className={`absolute inset-x-0 bottom-0 px-4 pb-3 pt-10 text-left font-display font-bold uppercase leading-tight tracking-[0.02em] text-soul ${
            featured ? "text-lg md:text-xl" : "line-clamp-2 text-sm"
          }`}
        >
          {title}
        </span>
      )}
    </button>
  );
}

/**
 * Highlights reel for the home page. Hidden until clips are added to
 * site.videos, so it never shows an empty band. Renders fast YouTube
 * thumbnails (no heavy iframes on load); the player only mounts inside a
 * lightbox once a clip is clicked, keeping the page light while letting fans
 * watch without leaving the site.
 */
export default function VideoSection() {
  const { t } = useLanguage();
  const { site } = useContent();
  const videos = ((site as { videos?: VideoItem[] }).videos ?? []).filter(
    (v) => v && v.youtubeId
  );
  const [active, setActive] = useState<VideoItem | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active]);

  if (videos.length === 0) return null;

  const featured = videos.find((v) => v.featured) ?? videos[0];
  const rest = videos.filter((v) => v.id !== featured.id).slice(0, 4);

  return (
    <section className="relative border-t border-edge bg-void px-4 py-20 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel centered kicker={t("sections.highlights_kicker")}>
            {t("sections.highlights")}
          </SectionLabel>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <VideoThumb video={featured} featured onPlay={() => setActive(featured)} />
          </Reveal>

          {rest.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5">
              {rest.map((v, i) => (
                <Reveal key={v.id} delay={(i + 1) * 90}>
                  <VideoThumb video={v} onPlay={() => setActive(v)} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>

      {active &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={active.title ? undefined : "Video player"}
          >
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setActive(null)}
              aria-hidden
            />
            <div className="relative z-10 w-full max-w-4xl">
              <div className="clip-esports relative aspect-video overflow-hidden border border-amethyst/45 bg-black shadow-[0_0_60px_rgba(168,85,247,0.35)]">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=1&rel=0`}
                  title={active.title ? undefined : "NIIGHTMARE highlight"}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label={t("common.close")}
                className="absolute -right-1 -top-12 grid h-10 w-10 place-items-center border border-edge bg-void/80 text-soul backdrop-blur transition-colors hover:border-amethyst hover:text-glow sm:-right-12 sm:top-0"
              >
                <CloseIcon size={20} />
              </button>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
