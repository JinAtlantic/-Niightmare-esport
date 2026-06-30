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
} from "@/components/admin/ui";
import { resolveShop, qrFrameStyle, type ShopContent, type ShopSize } from "@/lib/shop";
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
  const patchSize = (index: number, p: Partial<ShopSize>) =>
    patch({ sizes: shop.sizes.map((s, i) => (i === index ? { ...s, ...p } : s)) });

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

      <Section title="สถานะร้าน & ราคา" hint="เปิด/ปิดการขาย, สกุลเงิน, ราคาฐาน และชื่อ/เบอร์ที่ล็อกไว้" collapsible={false}>
        <Card className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant={shop.enabled ? "primary" : "ghost"} onClick={() => patch({ enabled: !shop.enabled })}>
              {shop.enabled ? "เปิดขายอยู่" : "ปิดร้านอยู่"}
            </Button>
            <Button variant={shop.preorder ? "primary" : "ghost"} onClick={() => patch({ preorder: !shop.preorder })}>
              {shop.preorder ? "โหมด Pre-order" : "โหมดพร้อมส่ง"}
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <TextField label="สกุลเงิน (เช่น ກີບ)" value={shop.currency} onChange={(currency) => patch({ currency })} />
            <NumberField label="ราคาฐาน (S–XXL)" value={shop.price} onChange={(price) => patch({ price })} />
            <div />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="ชื่อหลังเสื้อ (ล็อก)" value={shop.fixedJerseyName} onChange={(fixedJerseyName) => patch({ fixedJerseyName })} />
            <TextField label="เบอร์เสื้อ (ล็อก)" value={shop.fixedJerseyNumber} onChange={(fixedJerseyNumber) => patch({ fixedJerseyNumber })} />
          </div>
          <BilingualTextArea label="ข้อความสงวนลิขสิทธิ์ชื่อ/เบอร์" value={shop.rightsNote} rows={2} onChange={(rightsNote) => patch({ rightsNote })} />
        </Card>
      </Section>

      <Section title="ข้อความสินค้า" hint="ชื่อสินค้า, แท็กไลน์, รายละเอียด">
        <Card className="space-y-4">
          <BilingualField label="ชื่อสินค้า" value={shop.productName} onChange={(productName) => patch({ productName })} />
          <BilingualField label="แท็กไลน์" value={shop.tagline} onChange={(tagline) => patch({ tagline })} />
          <BilingualTextArea label="รายละเอียด" value={shop.description} onChange={(description) => patch({ description })} />
        </Card>
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
                <div className="mx-auto aspect-square w-40 overflow-hidden rounded-md border border-edge-bright bg-white">
                  <div className="h-full w-full" style={qrFrameStyle(safeImageSrc(shop.bank.qrImage), shop.bank)} />
                </div>
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

      <Section title="ตารางไซส์ & สต็อก & ค่าเพิ่ม" hint="หน่วย ซม. — 3XL/4XL ใส่ค่าเพิ่มในช่อง 'ค่าเพิ่ม'" collapsible={false}>
        <div className="space-y-3">
          {shop.sizes.map((s, i) => (
            <Card key={s.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-base font-bold uppercase tracking-wide text-soul">ไซส์ {s.label}</span>
                <Button variant={s.inStock ? "primary" : "danger"} onClick={() => patchSize(i, { inStock: !s.inStock })}>
                  {s.inStock ? "มีสต็อก" : "หมด"}
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <TextField label="ป้ายไซส์" value={s.label} onChange={(label) => patchSize(i, { label })} />
                <NumberField label="ค่าเพิ่ม (สกุลเงิน)" value={s.surcharge} onChange={(surcharge) => patchSize(i, { surcharge })} />
                <NumberField label="รอบอก (ซม)" value={s.chest} onChange={(chest) => patchSize(i, { chest })} />
                <NumberField label="ความยาว (ซม)" value={s.length} onChange={(length) => patchSize(i, { length })} />
                <NumberField label="ไหล่ (ซม)" value={s.shoulder} onChange={(shoulder) => patchSize(i, { shoulder })} />
                <NumberField label="แขนเสื้อ (ซม)" value={s.sleeve} onChange={(sleeve) => patchSize(i, { sleeve })} />
                <NumberField label="สูงต่ำสุด" value={s.minHeight} onChange={(minHeight) => patchSize(i, { minHeight })} />
                <NumberField label="สูงสูงสุด" value={s.maxHeight} onChange={(maxHeight) => patchSize(i, { maxHeight })} />
                <div />
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
