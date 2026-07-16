"use client";

import React from "react";
import { useData } from "@/components/admin/useData";
import { BilingualField, Button, Card, Section } from "@/components/admin/ui";
import achievementsSeed from "@/data/achievements.json";
import type { AchievementsData } from "@/lib/types";

const seed = achievementsSeed as AchievementsData;

function SaveBar({
  saving,
  error,
  savedAt,
  onSave,
}: {
  saving: boolean;
  error: string;
  savedAt: number | null;
  onSave: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 flex flex-col items-start justify-between gap-2 border-b border-edge bg-void/95 px-4 py-2 backdrop-blur md:-mx-6 md:flex-row md:items-center md:px-6">
      <p className="font-mono text-xs text-ash">แก้เฉพาะข้อความที่แสดงบนหน้า Achievements</p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
        {savedAt && !error && !saving && <span className="font-mono text-[11px] text-win">บันทึกแล้ว ✓</span>}
        <a href="/achievements" target="_blank" rel="noopener noreferrer">
          <Button className="min-h-[34px] px-3 py-1">ดูหน้าเว็บ</Button>
        </a>
        <Button onClick={onSave} disabled={saving} className="min-h-[34px] px-3 py-1">
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
      </div>
    </div>
  );
}

export default function AchievementsEditor() {
  const { data, setData, loading, saving, error, savedAt, save } =
    useData<AchievementsData>("achievements");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data) return <p className="font-mono text-sm text-loss">{error || "โหลดข้อมูลไม่สำเร็จ"}</p>;

  const page = data.page ?? seed.page;
  const patchPage = (patch: Partial<AchievementsData["page"]>) =>
    setData({ ...data, page: { ...page, ...patch } });

  return (
    <div className="space-y-6">
      <SaveBar saving={saving} error={error} savedAt={savedAt} onSave={() => void save()} />

      <Section
        title="ข้อความหน้า Achievements"
        hint="หัวข้อ 3 จุดที่แสดงจริงบน /achievements — เงินรางวัลและตารางอันดับคำนวณจาก Matches อัตโนมัติ"
        defaultOpen
      >
        <Card className="grid gap-3">
          <BilingualField label="ข้อความเหนือหัวข้อ" value={page.kicker} onChange={(kicker) => patchPage({ kicker })} />
          <BilingualField label="หัวข้อหลัก" value={page.title} onChange={(title) => patchPage({ title })} />
          <BilingualField label="คำอธิบาย" value={page.intro} onChange={(intro) => patchPage({ intro })} />
        </Card>
      </Section>
    </div>
  );
}
