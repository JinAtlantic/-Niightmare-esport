"use client";

import { useEffect, useRef } from "react";

/**
 * A soft two-tone light that follows the pointer across the whole site — the
 * premium "flashlight over the void" tell. Renders a single fixed, blended
 * layer (mix-blend: screen) that only lightens, never obscures, so text stays
 * crisp. Desktop only: it does nothing on touch/coarse pointers or when the
 * visitor prefers reduced motion, and moves are throttled to one paint per
 * frame so it's cheap.
 */
export default function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--sx", `${x}px`);
      el.style.setProperty("--sy", `${y}px`);
      el.style.opacity = "1";
    };
    const onMove = (event: MouseEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="cursor-spotlight pointer-events-none fixed inset-0 z-[35] opacity-0 transition-opacity duration-500"
    />
  );
}
