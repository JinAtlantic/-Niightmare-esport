"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import TeamLogo from "@/components/TeamLogo";

/**
 * Full-screen intro loading screen shown once on first page load:
 * the team logo pulses on the void-black background, then fades out.
 */
export default function Preloader() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFading(true), 1100);
    const hideTimer = window.setTimeout(() => setVisible(false), 1700);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-void transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
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
