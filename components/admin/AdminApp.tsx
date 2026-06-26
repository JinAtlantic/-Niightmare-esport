"use client";

import React, { useState } from "react";
import { Button } from "@/components/admin/ui";
import AchievementsEditor from "@/components/admin/AchievementsEditor";
import HomeEditor from "@/components/admin/HomeEditor";
import MatchesEditor from "@/components/admin/MatchesEditor";
import NewsEditor from "@/components/admin/NewsEditor";
import RosterEditor from "@/components/admin/RosterEditor";
import SponsorsEditor from "@/components/admin/SponsorsEditor";

type Tab = "home" | "news" | "matches" | "achievements" | "roster" | "sponsors";

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "news", label: "News" },
  { id: "matches", label: "Matches" },
  { id: "achievements", label: "Achievements" },
  { id: "roster", label: "Roster" },
  { id: "sponsors", label: "Sponsors" },
];

export default function AdminApp() {
  const [tab, setTab] = useState<Tab>("home");

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-void text-soul">
      <header className="border-b border-edge bg-crypt">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-amethyst">
              NIIGHTMARE
            </p>
            <h1 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button>Open site</Button>
            </a>
            <Button variant="danger" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b border-edge bg-amethyst/[0.06]">
        <p className="mx-auto max-w-5xl px-4 py-2.5 font-mono text-[11px] leading-relaxed text-spectre md:px-6">
          Save changes here, then refresh the public site to see the live update.
        </p>
      </div>

      <nav className="border-b border-edge">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 md:px-6">
          {TABS.map((tabDef) => {
            const active = tab === tabDef.id;
            return (
              <button
                key={tabDef.id}
                type="button"
                onClick={() => setTab(tabDef.id)}
                className={`-mb-px shrink-0 border-b-2 px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "border-amethyst text-soul"
                    : "border-transparent text-ash hover:text-soul"
                }`}
              >
                {tabDef.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {tab === "home" && <HomeEditor />}
        {tab === "news" && <NewsEditor />}
        {tab === "matches" && <MatchesEditor />}
        {tab === "achievements" && <AchievementsEditor />}
        {tab === "roster" && <RosterEditor />}
        {tab === "sponsors" && <SponsorsEditor />}
      </main>
    </div>
  );
}
