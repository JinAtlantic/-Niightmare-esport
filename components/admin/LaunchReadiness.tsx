"use client";

import React from "react";
import { useContent } from "@/components/context/ContentContext";
import { buildLaunchReadiness, type ReadinessLevel, type ReadinessTarget } from "@/lib/launchReadiness";
import type { ShopContent } from "@/lib/shop";
import type { Player, Sponsor, StaffMember } from "@/lib/types";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

const LEVEL_COPY: Record<ReadinessLevel, { badge: string; heading: string; symbol: string; classes: string }> = {
  ready: {
    badge: "พร้อมเปิดใช้งาน",
    heading: "พร้อมสำหรับ Launch",
    symbol: "✓",
    classes: "border-win/40 bg-win/10 text-win",
  },
  warning: {
    badge: "พร้อมใช้งาน แต่ยังไม่สมบูรณ์",
    heading: "เหลือง — มีรายการแนะนำให้เติม",
    symbol: "!",
    classes: "border-draw/40 bg-draw/10 text-draw",
  },
  blocked: {
    badge: "ยังไม่พร้อมรับออเดอร์เต็มรูปแบบ",
    heading: "แดง — ต้องแก้รายการสำคัญก่อน",
    symbol: "×",
    classes: "border-loss/40 bg-loss/10 text-loss",
  },
};

interface LaunchReadinessCheckerProps {
  onNavigate: (target: ReadinessTarget) => void;
}

export function LaunchReadinessChecker({ onNavigate }: LaunchReadinessCheckerProps) {
  const content = useContent();
  const site = content.site as typeof content.site & { shop?: Partial<ShopContent> };
  const sponsors = content.sponsors as typeof content.sponsors & { sponsors?: Sponsor[] };
  const roster = content.roster as typeof content.roster & {
    mlbb?: { players?: Player[] };
    efootball?: { players?: Player[] };
    staff?: StaffMember[];
  };
  const readiness = buildLaunchReadiness({
    shop: site.shop,
    sponsors: sponsors.sponsors,
    roster,
    vapidPublicKey: VAPID_PUBLIC_KEY,
  });
  const overall = LEVEL_COPY[readiness.level];

  return (
    <section
      aria-label="Launch Readiness"
      data-readiness-level={readiness.level}
      className="border-b border-edge bg-crypt2/45"
    >
      <div className="mx-auto max-w-5xl px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amethyst">
              Launch Readiness
            </p>
            <h2 id="launch-readiness-title" className="mt-1 font-display text-lg font-bold uppercase text-soul">
              {overall.heading}
            </h2>
            <p className="mt-1 text-sm text-ash">
              พร้อม {readiness.readyCount}/{readiness.checks.length} หมวด
              {readiness.actionCount > 0 ? ` · ต้องดูอีก ${readiness.actionCount} รายการ` : " · ไม่มีรายการค้าง"}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="border border-edge px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-spectre transition-colors hover:border-edge-bright hover:text-soul focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amethyst"
            >
              รีเช็กหลังบันทึก
            </button>
            <span className={`border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${overall.classes}`}>
              {overall.symbol} {overall.badge}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="readiness-checks">
          {readiness.checks.map((item) => {
            const copy = LEVEL_COPY[item.level];
            return (
              <article key={item.id} className="flex min-h-32 flex-col border border-edge bg-void/45 p-3">
                <div className="flex items-start gap-2">
                  <span
                    aria-label={copy.badge}
                    className={`grid size-6 shrink-0 place-items-center border font-mono text-xs font-bold ${copy.classes}`}
                  >
                    {copy.symbol}
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold uppercase tracking-wide text-soul">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ash">{item.detail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(item.target)}
                  className="mt-auto self-start pt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-glow underline decoration-amethyst/60 underline-offset-4 hover:text-soul focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amethyst"
                >
                  {item.level === "ready" ? "ไปดูที่" : "ไปแก้ที่"} {item.target === "shop" ? "Shop" : item.target === "sponsors" ? "Sponsors" : "Roster"}
                </button>
              </article>
            );
          })}
        </div>

        <p className="mt-3 font-mono text-[10px] leading-relaxed text-ash">
          ตัวตรวจนี้อ่านข้อมูลตอนเปิดหน้าอย่างเดียว ไม่บันทึกหรือแก้ข้อมูลอัตโนมัติ · หลังแก้และบันทึกให้กด “รีเช็กหลังบันทึก” · Web Push ยืนยันได้เฉพาะ public key จากหน้าเว็บ กรุณากด “ทดสอบ” เพื่อยืนยันอุปกรณ์และ private key
        </p>
      </div>
    </section>
  );
}
