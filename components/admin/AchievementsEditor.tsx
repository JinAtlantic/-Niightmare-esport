"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useData } from "@/components/admin/useData";
import { useContent } from "@/components/context/ContentContext";
import { BilingualField, Button, Card, ImageField, Section, TextField } from "@/components/admin/ui";
import achievementsSeed from "@/data/achievements.json";
import { enabledGames } from "@/lib/games";
import type { AchievementRecord, AchievementsData } from "@/lib/types";

const seed = achievementsSeed as AchievementsData;
const uid = () => `achievement-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

export default function AchievementsEditor() {
  const { data, setData, loading, saving, error, savedAt, save } = useData<AchievementsData>("achievements");
  const site = useContent().site as { games?: unknown };
  const [activeGame, setActiveGame] = useState("mlbb");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data) return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const records = data.records ?? [];
  const games = enabledGames(site.games, records.map((record) => record.game));
  const gameId = games.some((game) => game.id === activeGame) ? activeGame : games[0]?.id ?? "mlbb";
  const page = data.page ?? seed.page;
  const setRecords = (next: AchievementRecord[]) => setData({ ...data, records: next });
  const patchRecord = (id: string, patch: Partial<AchievementRecord>) => setRecords(records.map((record) => record.id === id ? { ...record, ...patch } : record));
  const gameRecords = records.filter((record) => record.game === gameId);
  const addRecord = () => setRecords([...records, {
    id: uid(),
    game: gameId,
    tournament: { en: "New Tournament", lo: "New Tournament" },
    placement: { en: "", lo: "" },
    year: String(new Date().getFullYear()),
    image: "",
    description: { en: "", lo: "" },
    enabled: true,
  }]);

  const moveWithinGame = (id: string, direction: -1 | 1) => {
    const gameIndexes = records.map((record, index) => ({ record, index })).filter(({ record }) => record.game === gameId);
    const position = gameIndexes.findIndex(({ record }) => record.id === id);
    const target = gameIndexes[position + direction];
    const current = gameIndexes[position];
    if (!current || !target) return;
    const next = records.slice();
    [next[current.index], next[target.index]] = [next[target.index], next[current.index]];
    setRecords(next);
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">ผลงานแยกตามเกม · {records.length} รายการ</p>
        <div className="flex items-center gap-3">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && <span className="font-mono text-[11px] text-win">บันทึกแล้ว ✓</span>}
          <a href="/achievements" target="_blank" rel="noreferrer"><Button>ดูหน้าเว็บ</Button></a>
          <Button variant="primary" onClick={() => void save()} disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึกผลงาน"}</Button>
        </div>
      </div>

      <Section title="ข้อความหน้า Achievements" hint="แก้หัวข้อหลักด้านบนหน้า">
        <Card className="grid gap-3">
          <BilingualField label="ข้อความเหนือหัวข้อ" value={page.kicker} onChange={(kicker) => setData({ ...data, page: { ...page, kicker } })} />
          <BilingualField label="หัวข้อหลัก" value={page.title} onChange={(title) => setData({ ...data, page: { ...page, title } })} />
          <BilingualField label="คำอธิบาย" value={page.intro} onChange={(intro) => setData({ ...data, page: { ...page, intro } })} />
        </Card>
      </Section>

      <Section title="ผลงานของแต่ละเกม" hint="แต่ละเกมแยกข้อมูลออกจากกัน รูปทัวร์นาเมนต์ใช้กรอบ 1:1">
        <div className="mb-4 flex flex-wrap gap-2">
          {games.map((game) => {
            const active = game.id === gameId;
            return <button key={game.id} type="button" onClick={() => setActiveGame(game.id)} className={`border px-4 py-2 font-display text-sm font-bold uppercase tracking-wide ${active ? "border-amethyst bg-amethyst/20 text-soul" : "border-edge bg-crypt text-ash"}`}>{game.shortName} <span className="ml-1 font-mono text-[10px]">{records.filter((record) => record.game === game.id).length}</span></button>;
          })}
        </div>
        <div className="mb-4"><Button variant="primary" onClick={addRecord}>+ เพิ่มผลงาน {games.find((game) => game.id === gameId)?.shortName}</Button></div>
        <div className="space-y-3">
          {gameRecords.map((record, index) => (
            <details key={record.id} className="border border-edge bg-crypt/55" open={!record.image}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <span className="font-display font-bold uppercase tracking-wide text-soul">{record.tournament.en || `Tournament ${index + 1}`}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className={`border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${record.enabled !== false ? "border-win/45 bg-win/10 text-win" : "border-edge bg-void/60 text-ash"}`}>
                    {record.enabled !== false ? "แสดงบนเว็บ" : "ซ่อนอยู่"}
                  </span>
                  <span className="font-display text-lg font-black uppercase text-gold">{record.placement.en || "—"}</span>
                </span>
              </summary>
              <Card className="m-3 mt-0 space-y-3">
                <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                  <div>
                    <ImageField label="รูปทัวร์นาเมนต์ 1:1" value={record.image} folder="achievements" onChange={(image) => patchRecord(record.id, { image })} />
                    {record.image && <div className="relative mt-3 aspect-square overflow-hidden border border-edge bg-void"><Image src={record.image} alt="" fill sizes="180px" className="object-cover" /></div>}
                  </div>
                  <div className="grid gap-3">
                    <BilingualField label="ชื่อทัวร์นาเมนต์" value={record.tournament} onChange={(tournament) => patchRecord(record.id, { tournament })} />
                    <BilingualField label="อันดับ / ผลงาน" value={record.placement} onChange={(placement) => patchRecord(record.id, { placement })} />
                    <TextField label="ปี / Season" value={record.year ?? ""} onChange={(year) => patchRecord(record.id, { year })} />
                    <BilingualField label="Description (เว้นว่างได้)" value={record.description ?? { en: "", lo: "" }} onChange={(description) => patchRecord(record.id, { description })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 font-mono text-xs text-spectre"><input type="checkbox" checked={record.enabled !== false} onChange={(event) => patchRecord(record.id, { enabled: event.target.checked })} className="accent-amethyst" /> แสดงรายการนี้บนเว็บ</label>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => moveWithinGame(record.id, -1)} disabled={index === 0}>ขึ้น</Button>
                  <Button onClick={() => moveWithinGame(record.id, 1)} disabled={index === gameRecords.length - 1}>ลง</Button>
                  <Button variant="danger" onClick={() => setRecords(records.filter((entry) => entry.id !== record.id))}>ลบผลงาน</Button>
                </div>
              </Card>
            </details>
          ))}
          {gameRecords.length === 0 && <Card className="border-dashed text-center font-mono text-sm text-ash">ยังไม่มีผลงานของเกมนี้ กด “เพิ่มผลงาน” เพื่อสร้างช่องแรก</Card>}
        </div>
      </Section>
    </div>
  );
}
