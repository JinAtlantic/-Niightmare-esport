"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import RoadmapTimeline from "@/components/sections/RoadmapTimeline";

/**
 * "Esports Roadmap" dialog — wraps the status timeline in the project's
 * framer-motion + portal modal shell (ESC + backdrop close, body-scroll lock,
 * focus pinned to the close button). Mount inside an <AnimatePresence>.
 */
export default function RoadmapModal({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Esports Roadmap"
    >
      <motion.div
        className="absolute inset-0 bg-black/82 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
      />

      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 12 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
        transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 260, damping: 24, mass: 0.7 }}
      >
        <div className="modal-scroll clip-esports relative max-h-[88vh] overflow-y-auto overscroll-contain border border-amethyst/45 bg-crypt p-5 shadow-[0_0_60px_rgba(168,85,247,0.35)] md:p-6">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-amethyst to-transparent" />
          <RoadmapTimeline />
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 z-30 grid h-10 w-10 place-items-center border border-edge bg-void/80 text-soul backdrop-blur transition-colors hover:border-amethyst hover:text-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </motion.div>
    </div>,
    document.body
  );
}
