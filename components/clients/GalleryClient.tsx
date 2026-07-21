"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/layout/PageHeader";
import AuroraHalos from "@/components/ui/AuroraHalos";
import Reveal from "@/components/ui/Reveal";
import { CloseIcon } from "@/components/ui/Icons";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { resolveGallery, type GalleryItem } from "@/lib/gallery";

export default function GalleryClient() {
  const { pick } = useLanguage();
  const { site } = useContent();
  const gallery = resolveGallery((site as { gallery?: unknown }).gallery);
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const visible = gallery.items.filter(
    (item) => item.enabled && item.image && (category === "all" || item.categoryId === category)
  );

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  const categoryName = (id: string) =>
    pick(gallery.categories.find((entry) => entry.id === id)?.name ?? { en: "Gallery", lo: "Gallery" });

  return (
    <>
      <PageHeader
        title={pick(gallery.page.title)}
        subtitle={pick(gallery.page.intro)}
        subtitleClassName="text-base font-medium text-spectre md:text-lg"
      />
      <section className="relative isolate mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <AuroraHalos />
        <div className="relative z-[1] flex flex-wrap justify-center gap-2 border-b border-edge pb-4">
          {[{ id: "all", name: { en: "All", lo: "ທັງໝົດ" } }, ...gallery.categories].map((entry) => {
            const active = category === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setCategory(entry.id)}
                aria-pressed={active}
                className={`min-h-[42px] border px-5 py-2 font-display text-sm font-bold uppercase tracking-[0.12em] transition-all ${
                  active
                    ? "border-amethyst bg-amethyst/20 text-soul shadow-[0_0_18px_rgba(168,85,247,0.3)]"
                    : "border-edge bg-crypt/60 text-ash hover:border-edge-bright hover:text-soul"
                }`}
              >
                {pick(entry.name)}
              </button>
            );
          })}
        </div>

        {visible.length ? (
          <div key={category} className="relative z-[1] mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((item, index) => (
              <Reveal key={item.id} delay={Math.min(index, 8) * 55}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="group block w-full overflow-hidden border border-edge bg-crypt text-left transition-all hover:border-amethyst/80 hover:shadow-[0_0_30px_rgba(168,85,247,0.24)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst"
                >
                  <span className="relative block aspect-square overflow-hidden bg-void">
                    {/* Gallery media is already resized during admin upload. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={pick(item.title) || categoryName(item.categoryId)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent" />
                    <span className="absolute bottom-2 left-2 border border-amethyst/40 bg-void/80 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-glow backdrop-blur">
                      {categoryName(item.categoryId)}
                    </span>
                  </span>
                  {(pick(item.title) || pick(item.description)) && (
                    <span className="block min-h-[78px] px-3 py-3 sm:px-4">
                      {pick(item.title) && <span className="block font-display text-base font-bold uppercase tracking-wide text-soul">{pick(item.title)}</span>}
                      {pick(item.description) && <span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-ash">{pick(item.description)}</span>}
                    </span>
                  )}
                </button>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="relative z-[1] mt-8 border border-dashed border-edge bg-crypt/45 px-6 py-16 text-center">
            <p className="font-display text-xl font-bold uppercase tracking-wide text-soul">No photos yet</p>
            <p className="mt-2 font-mono text-xs text-ash">Photos added in Admin will appear here.</p>
          </div>
        )}
      </section>

      {selected && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-label={pick(selected.title) || "Gallery image"} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div className="relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden border border-edge-bright bg-crypt shadow-[0_0_70px_rgba(168,85,247,0.34)] md:grid-cols-[minmax(0,1fr)_320px]">
            <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center border border-edge bg-void/90 text-soul hover:border-amethyst">
              <CloseIcon size={20} />
            </button>
            <div className="flex min-h-0 items-center justify-center bg-black/45 p-2 md:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.image} alt={pick(selected.title) || categoryName(selected.categoryId)} className="max-h-[70vh] w-full object-contain md:max-h-[86vh]" />
            </div>
            <div className="overflow-y-auto border-t border-edge p-5 md:border-l md:border-t-0 md:p-6">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amethyst">{categoryName(selected.categoryId)}</p>
              {pick(selected.title) && <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-wide text-soul">{pick(selected.title)}</h2>}
              {pick(selected.description) && <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-spectre">{pick(selected.description)}</p>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
