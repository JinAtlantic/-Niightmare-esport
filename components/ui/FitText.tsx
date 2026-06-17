"use client";

import React, { useLayoutEffect, useRef } from "react";

/**
 * Renders text on a single line and shrinks the font size just enough to fit
 * the available width (down to `min`). Keeps long names on one row without
 * wrapping, truncation, or overflow. Re-fits on container resize and once web
 * fonts finish loading.
 */
export default function FitText({
  children,
  max = 16,
  min = 9,
  className = "",
}: {
  children: React.ReactNode;
  /** Largest font size in px (used when the text comfortably fits). */
  max?: number;
  /** Smallest font size in px before it just clips. */
  min?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = max + "px";
      const avail = el.clientWidth;
      const need = el.scrollWidth;
      if (avail > 0 && need > avail) {
        el.style.fontSize = Math.max(min, Math.floor((max * avail) / need)) + "px";
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (el.parentElement) ro.observe(el.parentElement);
    // re-fit after web fonts load (text width changes when the display font swaps in)
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, [children, max, min]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "block", width: "100%", whiteSpace: "nowrap", overflow: "hidden", fontSize: max }}
    >
      {children}
    </span>
  );
}
