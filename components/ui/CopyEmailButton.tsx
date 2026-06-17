"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mail, Check } from "lucide-react";
import { useLanguage } from "@/components/context/LanguageContext";

/**
 * Click-to-copy business email. Copies to the clipboard and flashes a centred
 * confirmation toast; if the clipboard API is unavailable (insecure context /
 * old browser) it falls back to opening the mail client. Logic lives here so
 * the modals just drop in <CopyEmailButton email={…} />.
 */
export default function CopyEmailButton({ email }: { email: string }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = () => {
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        flash();
        return;
      }
    } catch {
      /* fall through to the mail-client fallback */
    }
    window.location.href = `mailto:${email}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`${t("roster.copy_email")} — ${email}`}
        title={email}
        className="hover-glow grid h-11 w-11 place-items-center border border-edge bg-crypt text-ash transition-colors hover:border-amethyst hover:text-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-void"
      >
        <Mail size={18} strokeWidth={1.75} />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {copied && (
              <div className="pointer-events-none fixed inset-0 z-[90] grid place-items-center px-4">
                <motion.div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2.5 rounded-2xl border border-amethyst/60 bg-void/90 px-5 py-3 shadow-[0_0_44px_rgba(168,85,247,0.5)] backdrop-blur-md"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
                  transition={
                    reduce
                      ? { duration: 0.15 }
                      : { type: "spring", stiffness: 320, damping: 26, mass: 0.6 }
                  }
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amethyst/15 text-glow">
                    <Check size={14} strokeWidth={2.5} />
                  </span>
                  <span className="keep-latin font-mono text-xs font-semibold uppercase tracking-[0.14em] text-soul">
                    {t("roster.email_copied")}
                  </span>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
