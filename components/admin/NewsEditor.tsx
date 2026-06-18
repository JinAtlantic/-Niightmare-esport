"use client";

import React from "react";
import { useData } from "@/components/admin/useData";
import {
  Button,
  Card,
  Label,
  TextField,
  TextArea,
  BilingualField,
} from "@/components/admin/ui";
import type { Bilingual, NewsArticle } from "@/lib/types";

interface NewsCta {
  label: Bilingual;
  href: string;
}

interface NewsPageCopy {
  kicker: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  deskLabel: Bilingual;
  deskIntro: Bilingual;
  featuredLabel: Bilingual;
  feedLabel: Bilingual;
  emptyTitle: Bilingual;
  emptyBody: Bilingual;
  statArticles: Bilingual;
  statCategories: Bilingual;
  statLatest: Bilingual;
  ctaLabel: Bilingual;
  ctaTitle: Bilingual;
  ctaBody: Bilingual;
  ctaPrimary: NewsCta;
  ctaSecondary: NewsCta;
}

interface NewsFile {
  page?: NewsPageCopy;
  articles: NewsArticle[];
}

const DEFAULT_NEWS_PAGE: NewsPageCopy = {
  kicker: { en: "Media Room", lo: "ຫ້ອງຂ່າວ" },
  title: { en: "NIIGHTMARE Newsroom", lo: "ຂ່າວສານ NIIGHTMARE" },
  intro: {
    en: "Official announcements, match reports, roster updates, and partner-ready team stories.",
    lo: "ປະກາດທາງການ, ລາຍງານການແຂ່ງ, ອັບເດດລາຍຊື່ ແລະ ເລື່ອງລາວຂອງທີມສໍາລັບພາກສ່ວນ.",
  },
  deskLabel: { en: "Press Desk", lo: "ສູນຂ່າວ" },
  deskIntro: {
    en: "A clean source for sponsors, media, and fans to track the club's latest movement.",
    lo: "ແຫຼ່ງຂໍ້ມູນທີ່ອ່ານງ່າຍສໍາລັບສະປອນເຊີ, ສື່ ແລະ ແຟນທີ່ຕ້ອງການຕິດຕາມຄວາມເຄື່ອນໄຫວ.",
  },
  featuredLabel: { en: "Featured Dispatch", lo: "ຂ່າວເດັ່ນ" },
  feedLabel: { en: "Latest Feed", lo: "ຟີດຫຼ້າສຸດ" },
  emptyTitle: { en: "No dispatches yet", lo: "ຍັງບໍ່ມີຂ່າວ" },
  emptyBody: {
    en: "Publish the first article from the admin newsroom editor.",
    lo: "ເຜີຍແຜ່ຂ່າວທໍາອິດຈາກໜ້າຈັດການຂ່າວ.",
  },
  statArticles: { en: "Articles", lo: "ຂ່າວ" },
  statCategories: { en: "Categories", lo: "ໝວດໝູ່" },
  statLatest: { en: "Latest Update", lo: "ອັບເດດຫຼ້າສຸດ" },
  ctaLabel: { en: "Media Access", lo: "ການເຂົ້າເຖິງສື່" },
  ctaTitle: {
    en: "Need assets, quotes, or a team interview?",
    lo: "ຕ້ອງການຊຸດສື່, ຄໍາກ່າວ ຫຼື ສໍາພາດທີມບໍ?",
  },
  ctaBody: {
    en: "Send a brief to the partnership desk and we will route it to the right NIIGHTMARE contact.",
    lo: "ສົ່ງ brief ໃຫ້ຝ່າຍພາກສ່ວນ ແລ້ວພວກເຮົາຈະສົ່ງຕໍ່ໃຫ້ຄົນທີ່ເໝາະສົມ.",
  },
  ctaPrimary: { label: { en: "Contact Media Desk", lo: "ຕິດຕໍ່ຝ່າຍສື່" }, href: "/contact" },
  ctaSecondary: { label: { en: "View Partners", lo: "ເບິ່ງພາກສ່ວນ" }, href: "/sponsors" },
};

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function BilingualTextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: Bilingual;
  onChange: (v: Bilingual) => void;
  rows?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid gap-2 md:grid-cols-2">
        <TextArea
          label="EN"
          value={value.en}
          rows={rows}
          onChange={(en) => onChange({ ...value, en })}
        />
        <TextArea
          label="LO"
          value={value.lo}
          rows={rows}
          onChange={(lo) => onChange({ ...value, lo })}
        />
      </div>
    </div>
  );
}

export default function NewsEditor() {
  const { data, setData, loading, saving, error, savedAt, save } =
    useData<NewsFile>("news");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data)
    return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const { articles } = data;
  const setArticles = (next: NewsArticle[]) => setData({ ...data, articles: next });
  const rawPage = data.page;
  const page: NewsPageCopy = {
    ...DEFAULT_NEWS_PAGE,
    ...(rawPage ?? {}),
    ctaPrimary: { ...DEFAULT_NEWS_PAGE.ctaPrimary, ...(rawPage?.ctaPrimary ?? {}) },
    ctaSecondary: { ...DEFAULT_NEWS_PAGE.ctaSecondary, ...(rawPage?.ctaSecondary ?? {}) },
  };
  const patchPage = (p: Partial<NewsPageCopy>) =>
    setData({ ...data, page: { ...page, ...p } });

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
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
            Newsroom Page Copy
          </h2>
          <p className="mt-1 font-mono text-[11px] text-ash">
            Header, labels, stats, empty state, and CTA copy for /news.
          </p>
        </div>

        <Card>
          <div className="grid gap-3">
            <BilingualField
              label="Hero kicker"
              value={page.kicker}
              onChange={(kicker) => patchPage({ kicker })}
            />
            <BilingualField
              label="Hero title"
              value={page.title}
              onChange={(title) => patchPage({ title })}
            />
            <BilingualTextArea
              label="Hero intro"
              value={page.intro}
              onChange={(intro) => patchPage({ intro })}
            />
            <BilingualField
              label="Press desk label"
              value={page.deskLabel}
              onChange={(deskLabel) => patchPage({ deskLabel })}
            />
            <BilingualTextArea
              label="Press desk intro"
              value={page.deskIntro}
              onChange={(deskIntro) => patchPage({ deskIntro })}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <BilingualField
                label="Featured label"
                value={page.featuredLabel}
                onChange={(featuredLabel) => patchPage({ featuredLabel })}
              />
              <BilingualField
                label="Feed label"
                value={page.feedLabel}
                onChange={(feedLabel) => patchPage({ feedLabel })}
              />
              <BilingualField
                label="Articles stat label"
                value={page.statArticles}
                onChange={(statArticles) => patchPage({ statArticles })}
              />
              <BilingualField
                label="Categories stat label"
                value={page.statCategories}
                onChange={(statCategories) => patchPage({ statCategories })}
              />
              <BilingualField
                label="Latest stat label"
                value={page.statLatest}
                onChange={(statLatest) => patchPage({ statLatest })}
              />
              <BilingualField
                label="Empty title"
                value={page.emptyTitle}
                onChange={(emptyTitle) => patchPage({ emptyTitle })}
              />
            </div>
            <BilingualTextArea
              label="Empty body"
              value={page.emptyBody}
              onChange={(emptyBody) => patchPage({ emptyBody })}
            />
            <BilingualField
              label="CTA label"
              value={page.ctaLabel}
              onChange={(ctaLabel) => patchPage({ ctaLabel })}
            />
            <BilingualField
              label="CTA title"
              value={page.ctaTitle}
              onChange={(ctaTitle) => patchPage({ ctaTitle })}
            />
            <BilingualTextArea
              label="CTA body"
              value={page.ctaBody}
              onChange={(ctaBody) => patchPage({ ctaBody })}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <BilingualField
                label="Primary CTA label"
                value={page.ctaPrimary.label}
                onChange={(label) => patchPage({ ctaPrimary: { ...page.ctaPrimary, label } })}
              />
              <TextField
                label="Primary CTA link"
                value={page.ctaPrimary.href}
                onChange={(href) => patchPage({ ctaPrimary: { ...page.ctaPrimary, href } })}
              />
              <BilingualField
                label="Secondary CTA label"
                value={page.ctaSecondary.label}
                onChange={(label) => patchPage({ ctaSecondary: { ...page.ctaSecondary, label } })}
              />
              <TextField
                label="Secondary CTA link"
                value={page.ctaSecondary.href}
                onChange={(href) => patchPage({ ctaSecondary: { ...page.ctaSecondary, href } })}
              />
            </div>
          </div>
        </Card>
      </section>

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
