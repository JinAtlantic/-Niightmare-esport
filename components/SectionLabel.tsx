import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  centered?: boolean;
}

/** Small uppercase section heading with the scythe-slash tick motif. */
export default function SectionLabel({ children, centered = false }: SectionLabelProps) {
  return (
    <div
      className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}
    >
      <span className="label-tick inline-block" aria-hidden />
      <h2 className="font-display text-2xl font-bold uppercase tracking-[0.18em] text-text-primary md:text-3xl">
        {children}
      </h2>
      <span className="label-tick inline-block" aria-hidden />
    </div>
  );
}
