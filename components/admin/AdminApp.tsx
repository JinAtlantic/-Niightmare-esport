"use client";

import React, { useState } from "react";
import { Button } from "@/components/admin/ui";
import HomeEditor from "@/components/admin/HomeEditor";
import MatchesEditor from "@/components/admin/MatchesEditor";
import NewsEditor from "@/components/admin/NewsEditor";
import RosterEditor from "@/components/admin/RosterEditor";

type Tab = "home" | "news" | "matches" | "roster";

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "หน้า Home (นัดต่อไป)" },
  { id: "news", label: "ข่าวสาร" },
  { id: "matches", label: "แมตช์ & ทัวร์นาเมนต์" },
  { id: "roster", label: "นักแข่ง (Roster)" },
];

export default function AdminApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [deploying, setDeploying] = useState(false);
  const [deployMsg, setDeployMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  async function deploy() {
    if (deploying) return;
    if (!window.confirm("เผยแพร่เวอร์ชันล่าสุดขึ้นเว็บออนไลน์เลยไหม? (ใช้เวลา ~1–2 นาที)")) return;
    setDeploying(true);
    setDeployMsg(null);
    try {
      const res = await fetch("/api/admin/deploy", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Deploy ไม่สำเร็จ");
      setDeployMsg({ ok: true, text: `เผยแพร่ขึ้นเว็บแล้ว ✓ — ${json.url}` });
    } catch (e) {
      setDeployMsg({ ok: false, text: e instanceof Error ? e.message : "Deploy ไม่สำเร็จ" });
    } finally {
      setDeploying(false);
    }
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
            <Button variant="primary" onClick={deploy} disabled={deploying}>
              {deploying ? "กำลัง Deploy…" : "🚀 Deploy ขึ้นเว็บ"}
            </Button>
            <Button variant="danger" onClick={logout}>
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>

      {/* publish reminder / deploy status */}
      <div className="border-b border-edge bg-amethyst/[0.06]">
        <p className="mx-auto max-w-5xl px-4 py-2.5 font-mono text-[11px] leading-relaxed text-spectre md:px-6">
          {deploying ? (
            <span className="text-glow">🚀 กำลังเผยแพร่ขึ้นเว็บออนไลน์… อย่าปิดหน้านี้ (~1–2 นาที)</span>
          ) : deployMsg ? (
            <span className={deployMsg.ok ? "text-win" : "text-loss"}>{deployMsg.text}</span>
          ) : (
            <>
              💾 บันทึกแล้วเห็นผลในเครื่องทันที · กด <b>🚀 Deploy ขึ้นเว็บ</b> เพื่อเผยแพร่ให้คนอื่นเห็นบนลิงก์ออนไลน์
            </>
          )}
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
        {tab === "home" && <HomeEditor />}
        {tab === "news" && <NewsEditor />}
        {tab === "matches" && <MatchesEditor />}
        {tab === "roster" && <RosterEditor />}
      </main>
    </div>
  );
}
