"use client";

import React from "react";
import { useData } from "@/components/admin/useData";
import {
  Button,
  Card,
  TextField,
  TextArea,
  BilingualField,
} from "@/components/admin/ui";
import type { NewsArticle } from "@/lib/types";

interface NewsFile {
  articles: NewsArticle[];
}

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export default function NewsEditor() {
  const { data, setData, loading, saving, error, savedAt, save } =
    useData<NewsFile>("news");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data)
    return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const { articles } = data;
  const setArticles = (next: NewsArticle[]) => setData({ ...data, articles: next });

  const patch = (i: number, p: Partial<NewsArticle>) =>
    setArticles(articles.map((a, idx) => (idx === i ? { ...a, ...p } : a)));

  const addArticle = () => {
    const nextId = articles.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    setArticles([
      {
        id: nextId,
        date: new Date().toISOString().slice(0, 10),
        tag: { en: "ANNOUNCEMENT", lo: "ປະກາດ" },
        title: { en: "", lo: "" },
        excerpt: { en: "", lo: "" },
        link: "#",
      },
      ...articles,
    ]);
  };

  return (
    <div className="space-y-8">
      {/* save bar */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">{articles.length} ข่าว</p>
        <div className="flex items-center gap-3">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && (
            <span className="font-mono text-[11px] text-win">บันทึกแล้ว ✓</span>
          )}
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}
          </Button>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
              ข่าวสารล่าสุด (Latest News)
            </h2>
            <p className="mt-1 font-mono text-[11px] text-ash">
              4 ข่าวบนสุดจะโชว์ที่หน้าแรก · ลากลำดับด้วยปุ่ม ↑ ↓
            </p>
          </div>
          <Button onClick={addArticle}>+ เพิ่มข่าว</Button>
        </div>

        <div className="space-y-4">
          {articles.map((a, i) => (
            <Card key={a.id}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs text-spectre">
                  {i < 4 && (
                    <span className="mr-1.5 text-amethyst">★หน้าแรก</span>
                  )}
                  {a.title.en || a.title.lo || "— ข่าวใหม่ —"}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button onClick={() => setArticles(move(articles, i, -1))}>↑</Button>
                  <Button onClick={() => setArticles(move(articles, i, 1))}>↓</Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      setArticles(articles.filter((_, idx) => idx !== i))
                    }
                  >
                    ลบ
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  label="วันที่"
                  type="date"
                  value={a.date}
                  onChange={(v) => patch(i, { date: v })}
                />
                <TextField
                  label="ลิงก์ (เว้น # ได้ถ้ายังไม่มี)"
                  value={a.link}
                  onChange={(v) => patch(i, { link: v })}
                  placeholder="https://… หรือ #"
                />
                <div className="md:col-span-2">
                  <BilingualField
                    label="ป้ายหมวด (เช่น ผลการแข่ง / ประกาศ)"
                    value={a.tag}
                    onChange={(v) => patch(i, { tag: v })}
                  />
                </div>
                <div className="md:col-span-2">
                  <BilingualField
                    label="หัวข้อข่าว"
                    value={a.title}
                    onChange={(v) => patch(i, { title: v })}
                  />
                </div>
                <TextArea
                  label="เนื้อหาย่อ (EN)"
                  value={a.excerpt.en}
                  onChange={(v) => patch(i, { excerpt: { ...a.excerpt, en: v } })}
                />
                <TextArea
                  label="เนื้อหาย่อ (ລາວ)"
                  value={a.excerpt.lo}
                  onChange={(v) => patch(i, { excerpt: { ...a.excerpt, lo: v } })}
                />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
