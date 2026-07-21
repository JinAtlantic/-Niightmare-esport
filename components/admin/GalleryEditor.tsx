"use client";

import React from "react";
import { useData } from "@/components/admin/useData";
import { BilingualField, Button, Card, ImageField, Section, SelectField } from "@/components/admin/ui";
import { galleryId, resolveGallery, type GalleryContent, type GalleryItem } from "@/lib/gallery";

type SiteFile = Record<string, unknown> & { gallery?: GalleryContent };
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = items.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function GalleryEditor() {
  const { data, setData, loading, saving, error, savedAt, save } = useData<SiteFile>("site");
  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data) return <p className="font-mono text-sm text-loss">โหลด Gallery ไม่สำเร็จ</p>;

  const gallery = resolveGallery(data.gallery);
  const setGallery = (next: GalleryContent) => setData({ ...data, gallery: next });
  const setItems = (items: GalleryItem[]) => setGallery({ ...gallery, items });
  const patchItem = (index: number, patch: Partial<GalleryItem>) => setItems(gallery.items.map((item, row) => row === index ? { ...item, ...patch } : item));
  const addItem = () => setItems([...gallery.items, {
    id: uid("gallery"),
    categoryId: gallery.categories[0]?.id ?? "team",
    image: "",
    title: { en: "", lo: "" },
    description: { en: "", lo: "" },
    enabled: true,
  }]);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">{gallery.categories.length} หมวด · {gallery.items.length} รูป</p>
        <div className="flex items-center gap-3">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && <span className="font-mono text-[11px] text-win">บันทึกแล้ว ✓</span>}
          <a href="/gallery" target="_blank" rel="noreferrer"><Button>ดูหน้า Gallery</Button></a>
          <Button variant="primary" onClick={() => void save()} disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึก Gallery"}</Button>
        </div>
      </div>

      <Section title="ข้อความหน้า Gallery" hint="หัวข้อและคำอธิบายด้านบนหน้า">
        <Card className="grid gap-3">
          <BilingualField label="หัวข้อ" value={gallery.page.title} onChange={(title) => setGallery({ ...gallery, page: { ...gallery.page, title } })} />
          <BilingualField label="คำอธิบาย" value={gallery.page.intro} onChange={(intro) => setGallery({ ...gallery, page: { ...gallery.page, intro } })} />
        </Card>
      </Section>

      <Section title="หมวดหมู่รูป" hint="แก้ชื่อ เพิ่ม หรือลบหมวดหมู่ได้">
        <div className="space-y-3">
          {gallery.categories.map((category, index) => (
            <Card key={category.id} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <BilingualField label={`หมวด ${index + 1}`} value={category.name} onChange={(name) => setGallery({ ...gallery, categories: gallery.categories.map((entry, row) => row === index ? { ...entry, name } : entry) })} />
              <Button variant="danger" disabled={gallery.categories.length === 1} onClick={() => {
                const next = gallery.categories.filter((_, row) => row !== index);
                const fallback = next[0]?.id ?? "team";
                setGallery({ ...gallery, categories: next, items: gallery.items.map((item) => item.categoryId === category.id ? { ...item, categoryId: fallback } : item) });
              }}>ลบ</Button>
            </Card>
          ))}
          <Button onClick={() => {
            const id = galleryId(`category-${Date.now().toString(36)}`, uid("category"));
            setGallery({ ...gallery, categories: [...gallery.categories, { id, name: { en: "New Category", lo: "ໝວດໃໝ່" } }] });
          }}>+ เพิ่มหมวดหมู่</Button>
        </div>
      </Section>

      <Section title="รูปภาพ" hint="แต่ละรูปเลือกหมวด ใส่ชื่อและ Description ได้">
        <div className="mb-4"><Button variant="primary" onClick={addItem}>+ เพิ่มรูป</Button></div>
        <div className="space-y-3">
          {gallery.items.map((item, index) => (
            <details key={item.id} className="border border-edge bg-crypt/55" open={!item.image}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <span className="font-display font-bold uppercase tracking-wide text-soul">{item.title.en || `Photo ${index + 1}`}</span>
                <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${item.enabled ? "text-win" : "text-ash"}`}>{item.enabled ? "แสดง" : "ซ่อน"}</span>
              </summary>
              <Card className="m-3 mt-0 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <ImageField label="รูปภาพ" value={item.image} folder="gallery" onChange={(image) => patchItem(index, { image })} />
                  <SelectField label="หมวดหมู่" value={item.categoryId} onChange={(categoryId) => patchItem(index, { categoryId })} options={gallery.categories.map((category) => ({ value: category.id, label: category.name.en || category.name.lo }))} />
                </div>
                <BilingualField label="ชื่อรูป (เว้นว่างได้)" value={item.title} onChange={(title) => patchItem(index, { title })} />
                <BilingualField label="Description" value={item.description} onChange={(description) => patchItem(index, { description })} />
                <label className="flex items-center gap-2 font-mono text-xs text-spectre"><input type="checkbox" checked={item.enabled} onChange={(event) => patchItem(index, { enabled: event.target.checked })} className="accent-amethyst" /> แสดงรูปนี้บนเว็บ</label>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setItems(move(gallery.items, index, -1))} disabled={index === 0}>ขึ้น</Button>
                  <Button onClick={() => setItems(move(gallery.items, index, 1))} disabled={index === gallery.items.length - 1}>ลง</Button>
                  <Button variant="danger" onClick={() => setItems(gallery.items.filter((_, row) => row !== index))}>ลบรูป</Button>
                </div>
              </Card>
            </details>
          ))}
          {gallery.items.length === 0 && <Card className="border-dashed text-center font-mono text-sm text-ash">ยังไม่มีรูป กด “เพิ่มรูป” เพื่อเริ่มต้น</Card>}
        </div>
      </Section>
    </div>
  );
}
