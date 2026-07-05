import React from "react";

/**
 * Premium ambient colour wash — three soft blurred glows (amethyst key +
 * magenta counter + a glow highlight) in the "Premium Violet Void" language,
 * matching the home bands so inner-page bodies glow with colour instead of
 * floating on flat void. Purely decorative.
 *
 * Usage: give the section `relative isolate overflow-hidden` and drop this in as
 * the first child — the `-z-10` + `isolate` keep the glow behind the content
 * automatically, so no content wrapper is needed:
 *   <section className="relative isolate overflow-hidden ...">
 *     <AuroraHalos />
 *     {content}
 *   </section>
 *
 * Intensity is tuned here in ONE place, so dialing the whole site's colour up
 * or down is a single edit. `variant` nudges the arrangement so stacked bands
 * don't line up identically.
 */
export default function AuroraHalos({ variant = "a" }: { variant?: "a" | "b" }) {
  const key = variant === "b" ? "right-[16%]" : "left-[18%]";
  const counter = variant === "b" ? "left-[6%]" : "right-[4%]";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span
        className={`absolute ${key} top-8 h-72 w-[min(720px,86vw)] -translate-x-1/2 rounded-full bg-amethyst/[0.16] blur-3xl`}
      />
      <span
        className={`absolute ${counter} top-[36%] h-72 w-[min(580px,76vw)] rounded-full bg-magenta/[0.14] blur-3xl`}
      />
      <span className="absolute bottom-[4%] left-[42%] h-64 w-[min(540px,72vw)] -translate-x-1/2 rounded-full bg-glow/[0.09] blur-3xl" />
    </div>
  );
}
