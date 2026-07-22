"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  /** Kept for content compatibility; inner-page descriptions are intentionally hidden. */
  subtitle?: string;
  /** Optional mono eyebrow shown above the title, with a glowing node. */
  kicker?: string;
  /** Legacy companion to subtitle; retained so existing editable copy is not deleted. */
  subtitleClassName?: string;
  /** Overrides the title's size classes (default text-4xl md:text-5xl) — e.g. a
   *  smaller size for a stacked multi-line hero. */
  titleClassName?: string;
}

/**
 * Inner-page header band in the "Premium Violet Void" language: a single
 * disciplined light source rising from below, film grain, an optional mono
 * kicker, the display title with a violet glow, and the scythe-blade divider.
 */
export default function PageHeader({ title, kicker, titleClassName }: PageHeaderProps) {
  return (
    <section className="page-header relative overflow-hidden border-b border-edge">
      <div className="hero-grain" aria-hidden />

      <div className="relative z-[2] mx-auto max-w-7xl px-4 py-20 text-center md:px-6 md:py-24">
        {kicker && (
          <p className="fx-rise mb-4 inline-flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.4em] text-spectre/70 md:text-[12px]">
            <span className="h-[5px] w-[5px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
            {kicker}
          </p>
        )}

        <h1
          className={`balance fx-rise font-display font-bold uppercase tracking-[0.05em] text-soul [text-shadow:0_2px_30px_rgba(168,85,247,0.35)] ${titleClassName ?? "text-4xl md:text-5xl"}`}
          style={{ animationDelay: "0.08s" }}
        >
          {/* A title may carry explicit line breaks ("\n") to stack it into
              several lines (e.g. the shop hero); plain titles render unchanged. */}
          {title.includes("\n")
            ? title.split("\n").map((line, i) => (
                <span key={i} className="block whitespace-nowrap">
                  {line}
                </span>
              ))
            : title}
        </h1>

        <div
          className="fx-rise mx-auto mt-7 h-[2px] w-[120px] -skew-x-[24deg] bg-gradient-to-r from-transparent via-amethyst to-glow shadow-[0_0_16px_rgba(168,85,247,0.6)]"
          style={{ animationDelay: "0.24s" }}
          aria-hidden
        />
      </div>
    </section>
  );
}
