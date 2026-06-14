"use client";

import React, { useState } from "react";
import { Button } from "@/components/admin/ui";
import MatchesEditor from "@/components/admin/MatchesEditor";
import RosterEditor from "@/components/admin/RosterEditor";

type Tab = "matches" | "roster";

const TABS: { id: Tab; label: string }[] = [
  { id: "matches", label: "แมตช์ & ทัวร์นาเมนต์" },
  { id: "roster", label: "นักแข่ง (Roster)" },
];

export default function AdminApp() {
  const [tab, setTab] = useState<Tab>("matches");

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-void text-soul">
      {/* top bar */}
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
              <Button>เปิดดูเว็บ ↗</Button>
            </a>
            <Button variant="danger" onClick={logout}>
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>

      {/* publish reminder */}
      <div className="border-b border-edge bg-amethyst/[0.06]">
        <p className="mx-auto max-w-5xl px-4 py-2.5 font-mono text-[11px] leading-relaxed text-spectre md:px-6">
          💾 การแก้ไขจะบันทึกลงไฟล์ในเครื่องทันที และเห็นผลในเว็บที่รันในเครื่องเลย ·
          ต้องการให้คนอื่นเห็นบนลิงก์ออนไลน์ ให้ <b>Deploy ขึ้น Vercel</b> อีกครั้งหลังบันทึก
        </p>
      </div>

      {/* tabs */}
      <nav className="border-b border-edge">
        <div className="mx-auto flex max-w-5xl gap-1 px-4 md:px-6">
          {TABS.map((tDef) => {
            const active = tab === tDef.id;
            return (
              <button
                key={tDef.id}
                type="button"
                onClick={() => setTab(tDef.id)}
                className={`-mb-px border-b-2 px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "border-amethyst text-soul"
                    : "border-transparent text-ash hover:text-soul"
                }`}
              >
                {tDef.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* content */}
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {tab === "matches" ? <MatchesEditor /> : <RosterEditor />}
      </main>
    </div>
  );
}
