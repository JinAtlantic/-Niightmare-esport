"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import translations from "@/data/translations.json";
import type { Bilingual, Lang } from "@/lib/types";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  /** Look up a static UI string by dot-path key, e.g. t("nav.home"). */
  t: (key: string) => string;
  /** Pick the active-language value from a { en, lo } content object. */
  pick: (obj?: Bilingual | null) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "niightmare-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Restore saved language preference on first mount.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "lo") {
        setLangState(saved);
      }
    } catch {
      /* localStorage unavailable — ignore */
    }
  }, []);

  // Reflect the active language on <html> so CSS can swap the Lao font
  // and bump the base size.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", lang);
    root.classList.toggle("lang-lo", lang === "lo");
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "en" ? "lo" : "en");
  }, [lang, setLang]);

  const t = useCallback(
    (key: string): string => {
      const parts = key.split(".");
      let node: unknown = translations;
      for (const part of parts) {
        if (node && typeof node === "object" && part in (node as object)) {
          node = (node as Record<string, unknown>)[part];
        } else {
          return key;
        }
      }
      if (node && typeof node === "object") {
        const bi = node as Partial<Bilingual>;
        return bi[lang] ?? bi.en ?? key;
      }
      return typeof node === "string" ? node : key;
    },
    [lang]
  );

  const pick = useCallback(
    (obj?: Bilingual | null): string => {
      if (!obj) return "";
      return obj[lang] ?? obj.en ?? "";
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t, pick }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
