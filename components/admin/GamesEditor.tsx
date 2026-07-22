"use client";

import React, { useState } from "react";
import { useData } from "@/components/admin/useData";
import { BilingualField, Button, Card, Section, TextField } from "@/components/admin/ui";
import { gameSlug, resolveGames, type GameDefinition } from "@/lib/games";

type SiteFile = Record<string, unknown> & { games?: GameDefinition[] };

export default function GamesEditor() {
  const { data, setData, loading, saving, error, savedAt, save } = useData<SiteFile>("site");
  const [newName, setNewName] = useState("");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data) return <p className="font-mono text-sm text-loss">โหลดรายการเกมไม่สำเร็จ</p>;

  const games = resolveGames(data.games);
  const setGames = (next: GameDefinition[]) => setData({ ...data, games: next });
  const patchGame = (index: number, patch: Partial<GameDefinition>) =>
    setGames(games.map((game, row) => row === index ? { ...game, ...patch } : game));
  const addGame = () => {
    const id = gameSlug(newName);
    if (!id || games.some((game) => game.id === id)) return;
    setGames([...games, { id, name: { en: newName.trim(), lo: newName.trim() }, shortName: newName.trim().slice(0, 24), enabled: true }]);
    setNewName("");
  };
  const removeGame = (index: number) => {
    const game = games[index];
    if (!game || games.length <= 1) return;
    const confirmed = window.confirm(
      `ลบเกม ${game.shortName} ออกจากระบบ?\n\nข้อมูลนักกีฬา แมตช์ และผลงานเดิมจะยังไม่ถูกลบ และจะกลับมาได้หากเพิ่มเกม ID เดิมอีกครั้ง`
    );
    if (!confirmed) return;
    setGames(games.filter((_, row) => row !== index));
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">{games.filter((game) => game.enabled).length} เกมที่เปิดใช้งาน</p>
        <div className="flex items-center gap-3">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && <span className="font-mono text-[11px] text-win">บันทึกแล้ว ✓</span>}
          <Button variant="primary" onClick={() => void save()} disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึกเกม"}</Button>
        </div>
      </div>

      <Section title="ระบบเกมส่วนกลาง" hint="เพิ่มเกมที่นี่ครั้งเดียว แล้วเกมจะปรากฏใน Team, Matches และ Achievements" defaultOpen>
        <Card className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <TextField label="ชื่อเกมใหม่ (ภาษาอังกฤษ)" value={newName} onChange={setNewName} placeholder="เช่น Valorant" />
          <Button variant="primary" onClick={addGame} disabled={!gameSlug(newName) || games.some((game) => game.id === gameSlug(newName))}>+ เพิ่มเกม</Button>
        </Card>

        <div className="mt-4 space-y-3">
          {games.map((game, index) => (
            <Card key={game.id} className="relative space-y-3 overflow-hidden">
              <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-amethyst" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-3">
                <div>
                  <p className="font-display text-lg font-bold uppercase tracking-wide text-soul">{game.shortName}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">ID: {game.id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 font-mono text-xs text-spectre">
                    <input type="checkbox" checked={game.enabled} onChange={(event) => patchGame(index, { enabled: event.target.checked })} className="accent-amethyst" />
                    แสดงเกมนี้
                  </label>
                  <Button
                    variant="danger"
                    onClick={() => removeGame(index)}
                    disabled={games.length <= 1}
                    className="game-delete-button min-h-[36px] px-3 py-1.5"
                  >
                    ลบเกม <span className="keep-latin">{game.shortName}</span>
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <BilingualField label="ชื่อเต็ม" value={game.name} onChange={(name) => patchGame(index, { name })} />
                <TextField label="ชื่อสั้นบนแท็บ" value={game.shortName} onChange={(shortName) => patchGame(index, { shortName: shortName.slice(0, 24) })} />
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-ash">
          การลบจะซ่อนเกมออกจาก Team, Matches และ Achievements หลังจากกด “บันทึกเกม” โดยไม่ลบข้อมูลเก่าถาวร
        </p>
      </Section>
    </div>
  );
}
