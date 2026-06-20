"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import TeamLogo from "@/components/cards/TeamLogo";

/**
 * Full-screen intro loading screen shown once on first page load:
 * the team logo pulses on the void-black background, then fades out.
 */
export default function Preloader() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Unmount once the CSS fade-out (see .preloader-overlay) has finished.
    // Kept short so the intro is a quick brand flash, not a wait — the page
    // behind it is already painted, so the overlay is the only thing delaying
    // the first interaction.
    const hideTimer = window.setTimeout(() => setVisible(false), 1000);
    return () => window.clearTimeout(hideTimer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="preloader-overlay fixed inset-0 z-[100] grid place-items-center bg-void"
      aria-hidden
    >
      <div className="flex flex-col items-center gap-6">
        <TeamLogo size={140} pulse />
        <p className="font-display text-xs uppercase tracking-[0.4em] text-text-muted">
          {t("common.loading")}
        </p>
      </div>
    </div>
  );
}
