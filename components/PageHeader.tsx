"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

/** Dark page header band with the scythe-slash motif, used on inner pages. */
export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="diagonal-split noise-overlay relative overflow-hidden border-b border-edge">
      <div className="hero-slash top-1/2 opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-16 text-center md:px-6 md:py-20">
        <h1 className="font-display text-4xl font-bold uppercase tracking-[0.06em] text-text-primary md:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-text-muted">{subtitle}</p>
        ) : null}
        <div className="mx-auto mt-6 h-[3px] w-24 bg-gradient-to-r from-primary to-accent" aria-hidden />
      </div>
    </section>
  );
}
