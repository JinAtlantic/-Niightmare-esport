import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  /** Optional mono eyebrow shown above the heading, with a glowing node. */
  kicker?: React.ReactNode;
  centered?: boolean;
}

/**
 * Section heading in the "Premium Violet Void" language: an optional mono
 * kicker with a glowing node, then the display heading flanked by the
 * scythe-slash tick motif. Backward compatible — pages passing only
 * `children` keep their original look.
 */
export default function SectionLabel({
  children,
  kicker,
  centered = false,
}: SectionLabelProps) {
  return (
    <div className={`flex flex-col ${centered ? "items-center text-center" : "items-start"}`}>
      {kicker && (
        <span className="mb-3.5 inline-flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.34em] text-spectre/70">
          <span className="h-[5px] w-[5px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
          {kicker}
        </span>
      )}
      <div className={`flex items-center gap-2 sm:gap-3 ${centered ? "justify-center" : ""}`}>
        <span className="label-tick inline-block shrink-0" aria-hidden />
        <h2 className="font-display text-lg font-bold uppercase tracking-[0.1em] text-soul [text-shadow:0_2px_24px_rgba(168,85,247,0.25)] sm:text-2xl sm:tracking-[0.16em] md:text-[2rem]">
          {children}
        </h2>
        <span className="label-tick inline-block shrink-0" aria-hidden />
      </div>
    </div>
  );
}
