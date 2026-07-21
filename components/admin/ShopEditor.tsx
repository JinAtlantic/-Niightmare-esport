"use client";

import React from "react";
import { useData } from "@/components/admin/useData";
import {
  Button,
  Card,
  Section,
  TextField,
  TextArea,
  BilingualField,
  ImageField,
  Label,
  SelectField,
} from "@/components/admin/ui";
import {
  resolveShop,
  qrFrameStyle,
  shopSlug,
  type ShopCollection,
  type ShopContent,
  type ShopSize,
  type ShopSizeAvailability,
} from "@/lib/shop";
import { safeImageSrc } from "@/lib/safety";
import type { Bilingual } from "@/lib/types";

interface SiteFile {
  shop?: ShopContent;
  [key: string]: unknown;
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
        <TextArea label="EN" value={value.en} rows={rows} onChange={(en) => onChange({ ...value, en })} />
        <TextArea label="ລາວ" value={value.lo} rows={rows} onChange={(lo) => onChange({ ...value, lo })} />
      </div>
    </div>
  );
}

function QrSlider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Label>{label}</Label>
        <span className="font-mono text-[11px] tabular-nums text-spectre">{Math.round(value)}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amethyst"
      />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <TextField
      label={label}
      type="number"
      value={String(value)}
      onChange={(v) => {
        const n = Number(v);
        onChange(Number.isFinite(n) ? n : 0);
      }}
    />
  );
}

export default function ShopEditor() {
  const { data, setData, loading, saving, error, savedAt, save } = useData<SiteFile>("site");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data) return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const shop = resolveShop(data.shop);
  const patch = (p: Partial<ShopContent>) => setData({ ...data, shop: { ...shop, ...p } });
  const patchBank = (p: Partial<ShopContent["bank"]>) => patch({ bank: { ...shop.bank, ...p } });
  const patchCollections = (collections: ShopCollection[]) => {
    const first = collections[0];
    patch({
      collections,
      ...(first ? {
        productName: first.productName,
        tagline: first.tagline,
        description: first.description,
        rightsNote: first.rightsNote,
        currency: first.currency,
        price: first.price,
        fixedJerseyName: first.fixedJerseyName,
        fixedJerseyNumber: first.fixedJerseyNumber,
        sizes: first.sizes,
        productImage: first.productImage,
      } : {}),
    });
  };
  const patchCollection = (index: number, p: Partial<ShopCollection>) =>
    patchCollections(shop.collections.map((collection, i) => i === index ? { ...collection, ...p } : collection));
  const uniqueSlug = (raw: string, currentIndex: number) => {
    const base = shopSlug(raw, shop.collections[currentIndex].id);
    const used = new Set(shop.collections.filter((_, index) => index !== currentIndex).map((collection) => collection.slug));
    if (!used.has(base)) return base;
    let suffix = 2;
    while (used.has(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
  };
  const patchSize = (collectionIndex: number, sizeIndex: number, p: Partial<ShopSize>) => {
    const collection = shop.collections[collectionIndex];
    patchCollection(collectionIndex, { sizes: collection.sizes.map((size, i) => i === sizeIndex ? { ...size, ...p } : size) });
  };
  const addCollection = () => {
    const template = shop.collections[0];
    const suffix = Date.now().toString(36);
    patchCollections([...shop.collections, {
      ...template,
      id: `collection-${suffix}`,
      slug: `collection-${suffix}`,
      enabled: false,
      productName: { en: "New Product", lo: "ສິນຄ້າໃໝ່" },
      tagline: { en: "New NIIGHTMARE collection", lo: "ຄໍເລັກຊັນ NIIGHTMARE ໃໝ່" },
      description: { en: "", lo: "" },
      sizes: template.sizes.map((size) => ({ ...size })),
      productImage: undefined,
    }]);
  };
  const removeCollection = (index: number) => {
    if (shop.collections.length === 1) return;
    if (!window.confirm("ลบสินค้านี้หรือไม่? ออเดอร์เก่าจะไม่ถูกลบ")) return;
    patchCollections(shop.collections.filter((_, i) => i !== index));
  };
  const moveCollection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= shop.collections.length) return;
    const next = [...shop.collections];
    [next[index], next[target]] = [next[target], next[index]];
    patchCollections(next);
  };

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">
          ร้านค้า: <span className={shop.enabled ? "text-win" : "text-loss"}>{shop.enabled ? "เปิดขาย" : "ปิด"}</span>
        </p>
        <div className="flex items-center gap-3">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && <span className="font-mono text-[11px] text-win">บันทึกแล้ว ✓</span>}
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}
          </Button>
        </div>
      </div>

      <Section title="สถานะร้าน" hint="สวิตช์หลักสำหรับเปิดหรือปิดหน้า Shop ทั้งหมด" collapsible={false}>
        <Card className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant={shop.enabled ? "primary" : "ghost"} onClick={() => patch({ enabled: !shop.enabled })}>
              {shop.enabled ? "เปิดขายอยู่" : "ปิดร้านอยู่"}
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="สินค้า / Collections" hint="สินค้าแต่ละชิ้นมีหน้ารายละเอียดของตัวเอง แยกราคา รูป และสถานะของแต่ละไซส์ได้อิสระ" collapsible={false}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-md border border-edge bg-crypt/50 p-3">
            <p className="font-mono text-xs text-ash">ทั้งหมด {shop.collections.length} สินค้า · หน้าเว็บจะแสดงเฉพาะรายการที่เปิดขาย</p>
            <Button variant="primary" onClick={addCollection}>+ เพิ่มสินค้า</Button>
          </div>
          {shop.collections.map((collection, collectionIndex) => (
            <details key={collection.id} className="group overflow-hidden rounded-md border border-edge-bright bg-crypt/45" open={shop.collections.length === 1 || undefined}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-crypt2/70 p-4 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold uppercase tracking-wide text-soul">{collection.productName.en || `Product ${collectionIndex + 1}`}</p>
                  <p className={`mt-1 font-mono text-[10px] uppercase tracking-[0.14em] ${collection.enabled ? "text-win" : "text-ash"}`}>{collection.enabled ? "เปิดขาย" : "ซ่อนจากหน้าเว็บ"} · /shop/{collection.slug}</p>
                </div>
                <span className="font-mono text-xs text-glow transition-transform group-open:rotate-90">▶</span>
              </summary>
              <div className="space-y-5 border-t border-edge p-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant={collection.enabled ? "primary" : "ghost"} onClick={() => patchCollection(collectionIndex, { enabled: !collection.enabled })}>{collection.enabled ? "เปิดขายอยู่" : "ซ่อนอยู่"}</Button>
                  <Button onClick={() => moveCollection(collectionIndex, -1)} disabled={collectionIndex === 0}>↑ เลื่อนขึ้น</Button>
                  <Button onClick={() => moveCollection(collectionIndex, 1)} disabled={collectionIndex === shop.collections.length - 1}>↓ เลื่อนลง</Button>
                  <Button variant="danger" onClick={() => removeCollection(collectionIndex)} disabled={shop.collections.length === 1}>ลบ</Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <BilingualField label="ชื่อสินค้า" value={collection.productName} onChange={(productName) => patchCollection(collectionIndex, { productName })} />
                  <BilingualField label="แท็กไลน์" value={collection.tagline} onChange={(tagline) => patchCollection(collectionIndex, { tagline })} />
                </div>
                <BilingualTextArea label="รายละเอียดสินค้า" value={collection.description} onChange={(description) => patchCollection(collectionIndex, { description })} />
                <div className="grid gap-3 md:grid-cols-3">
                  <TextField label="Slug สำหรับลิงก์" value={collection.slug} onChange={(slug) => patchCollection(collectionIndex, { slug: uniqueSlug(slug, collectionIndex) })} />
                  <TextField label="สกุลเงิน (เช่น ກີບ)" value={collection.currency} onChange={(currency) => patchCollection(collectionIndex, { currency })} />
                  <NumberField label="ราคาฐาน" value={collection.price} onChange={(price) => patchCollection(collectionIndex, { price })} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="ชื่อหลังเสื้อ (ล็อก)" value={collection.fixedJerseyName} onChange={(fixedJerseyName) => patchCollection(collectionIndex, { fixedJerseyName })} />
                  <TextField label="เบอร์เสื้อ (ล็อก)" value={collection.fixedJerseyNumber} onChange={(fixedJerseyNumber) => patchCollection(collectionIndex, { fixedJerseyNumber })} />
                </div>
                <BilingualTextArea label="ข้อความสงวนลิขสิทธิ์ชื่อ/เบอร์" value={collection.rightsNote} rows={2} onChange={(rightsNote) => patchCollection(collectionIndex, { rightsNote })} />

                <ImageField
                  label="รูปสินค้า (รวมด้านหน้าและด้านหลัง)"
                  value={collection.productImage}
                  folder="shop"
                  onChange={(productImage) => patchCollection(collectionIndex, {
                    productImage: productImage || undefined,
                    frontImage: undefined,
                    backImage: undefined,
                  })}
                />

                <div>
                  <p className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-soul">ไซส์ · สถานะ · ค่าเพิ่ม</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {collection.sizes.map((size, sizeIndex) => (
                      <Card key={size.id} className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <TextField label="ป้ายไซส์" value={size.label} onChange={(label) => patchSize(collectionIndex, sizeIndex, { label })} />
                          <SelectField
                            label="สถานะ"
                            value={size.availability}
                            onChange={(availability) => patchSize(collectionIndex, sizeIndex, { availability: availability as ShopSizeAvailability, inStock: availability !== "sold_out" })}
                            options={[
                              { value: "in_stock", label: "พร้อมส่ง" },
                              { value: "preorder", label: "พรีออเดอร์" },
                              { value: "sold_out", label: "หมด" },
                            ]}
                          />
                          <NumberField label="ค่าเพิ่ม" value={size.surcharge} onChange={(surcharge) => patchSize(collectionIndex, sizeIndex, { surcharge })} />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </Section>

      <Section title="ธนาคาร & QR โอนเงิน" hint="ข้อมูลที่โชว์ใน popup โอนเงิน" collapsible={false}>
        <Card className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <TextField label="ชื่อธนาคาร" value={shop.bank.bankName} onChange={(bankName) => patchBank({ bankName })} />
            <TextField label="ชื่อบัญชี" value={shop.bank.accountName} onChange={(accountName) => patchBank({ accountName })} />
            <TextField label="เลขบัญชี" value={shop.bank.accountNumber} onChange={(accountNumber) => patchBank({ accountNumber })} />
          </div>
          <ImageField
            label="รูป QR ธนาคาร (อัปโหลด)"
            value={shop.bank.qrImage}
            folder="sponsors"
            onChange={(qrImage) => patchBank({ qrImage: qrImage || undefined })}
          />

          {shop.bank.qrImage && (
            <div>
              <Label>ครอบ/ซูม QR (ให้เห็นเฉพาะ QR เต็มกรอบ)</Label>
              <p className="mb-2 font-mono text-[10px] text-ash">
                ถ้ารูปเป็นสกรีนช็อตยาว ปรับ “ซูม” แล้วเลื่อนแนวนอน/แนวตั้ง ให้เหลือแต่ตัว QR — กรอบสี่เหลี่ยมคือสิ่งที่ลูกค้าจะเห็น
              </p>
              <div className="grid items-start gap-4 sm:grid-cols-[160px_1fr]">
                <div
                  className="mx-auto w-40 overflow-hidden rounded-md border border-edge-bright bg-white"
                  style={{ paddingBottom: "10rem", ...qrFrameStyle(safeImageSrc(shop.bank.qrImage), shop.bank) }}
                />
                <div className="space-y-3">
                  <QrSlider label="ซูม" min={100} max={500} value={shop.bank.qrZoom} onChange={(qrZoom) => patchBank({ qrZoom })} />
                  <QrSlider label="เลื่อนแนวนอน" min={0} max={100} value={shop.bank.qrX} onChange={(qrX) => patchBank({ qrX })} />
                  <QrSlider label="เลื่อนแนวตั้ง" min={0} max={100} value={shop.bank.qrY} onChange={(qrY) => patchBank({ qrY })} />
                  <Button variant="ghost" onClick={() => patchBank({ qrZoom: 100, qrX: 50, qrY: 50 })}>
                    รีเซ็ตกรอบ
                  </Button>
                </div>
              </div>
            </div>
          )}
          <BilingualTextArea label="ข้อความใต้ QR" value={shop.bank.note} rows={2} onChange={(note) => patchBank({ note })} />
          <BilingualTextArea
            label="ข้อความแจ้งให้เขียนเลขออเดอร์ในสลิป"
            value={shop.bank.refNote}
            rows={3}
            onChange={(refNote) => patchBank({ refNote })}
          />
        </Card>
      </Section>

      <Section title="ช่องทางติดต่อ" hint="ลิงก์ปุ่ม 'สอบถามข้อมูลเพิ่มเติม'">
        <Card>
          <TextField label="ลิงก์ติดต่อ (LINE/Facebook/...)" value={shop.contactUrl} onChange={(contactUrl) => patch({ contactUrl })} placeholder="https://m.me/niightmareesports" />
        </Card>
      </Section>

      <Section title="บริษัทขนส่ง (dropdown)" hint="รายชื่อให้ลูกค้าเลือกในฟอร์ม — บรรทัดละ 1 บริษัท">
        <Card>
          <TextArea
            label="รายชื่อบริษัทขนส่ง"
            rows={6}
            value={shop.couriers.join("\n")}
            onChange={(v) => patch({ couriers: v.split("\n").map((c) => c.trim()).filter(Boolean) })}
          />
        </Card>
      </Section>

    </div>
  );
}
