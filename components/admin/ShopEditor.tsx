"use client";

import React from "react";
import { useData } from "@/components/admin/useData";
import {
  Button,
  Card,
  Section,
  TextField,
  TextArea,
  SelectField,
  BilingualField,
  Label,
} from "@/components/admin/ui";
import { resolveShop, type ShopContent, type ShopSize } from "@/lib/shop";
import type { Bilingual } from "@/lib/types";

/** We only touch `shop`; the rest of the site object is loaded and saved as-is. */
interface SiteFile {
  shop?: ShopContent;
  [key: string]: unknown;
}

const CURRENCIES = [
  { value: "THB", label: "THB (บาท)" },
  { value: "LAK", label: "LAK (ກີບ)" },
  { value: "USD", label: "USD ($)" },
];

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

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
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
  const patchOrder = (p: Partial<ShopContent["order"]>) =>
    patch({ order: { ...shop.order, ...p } });
  const patchSize = (index: number, p: Partial<ShopSize>) =>
    patch({ sizes: shop.sizes.map((s, i) => (i === index ? { ...s, ...p } : s)) });

  return (
    <div className="space-y-8">
      {/* save bar */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">
          ร้านค้า:{" "}
          <span className={shop.enabled ? "text-win" : "text-loss"}>
            {shop.enabled ? "เปิดขาย" : "ปิด"}
          </span>{" "}
          · <span className="text-spectre">{shop.preorder ? "Pre-order" : "พร้อมส่ง"}</span>
        </p>
        <div className="flex items-center gap-3">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && <span className="font-mono text-[11px] text-win">บันทึกแล้ว ✓</span>}
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลง"}
          </Button>
        </div>
      </div>

      <Section title="สถานะร้าน & ราคา" hint="เปิด/ปิดการขาย, โหมด pre-order, สกุลเงิน และราคาต่อแบบ" collapsible={false}>
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
            <SelectField
              label="สกุลเงิน"
              value={shop.currency}
              onChange={(currency) => patch({ currency })}
              options={CURRENCIES}
            />
            <NumberField label="ราคา Fan edition" value={shop.price} onChange={(price) => patch({ price })} />
            <NumberField
              label="ราคา Player edition"
              value={shop.playerEditionPrice}
              onChange={(playerEditionPrice) => patch({ playerEditionPrice })}
            />
          </div>
          <TextField
            label="ชื่อหลังเสื้อแบบล็อก (Fan edition)"
            value={shop.fixedJerseyName}
            onChange={(fixedJerseyName) => patch({ fixedJerseyName })}
            placeholder="NIIGHTMARE"
          />
        </Card>
      </Section>

      <Section title="ข้อความสินค้า" hint="ชื่อสินค้า, แท็กไลน์, รายละเอียด และหมายเหตุการจัดส่ง">
        <Card className="space-y-4">
          <BilingualField label="ชื่อสินค้า" value={shop.productName} onChange={(productName) => patch({ productName })} />
          <BilingualField label="แท็กไลน์" value={shop.tagline} onChange={(tagline) => patch({ tagline })} />
          <BilingualTextArea label="รายละเอียด" value={shop.description} onChange={(description) => patch({ description })} />
          <BilingualTextArea
            label="หมายเหตุการจัดส่ง"
            value={shop.shippingNote}
            rows={2}
            onChange={(shippingNote) => patch({ shippingNote })}
          />
        </Card>
      </Section>

      <Section title="ช่องทางสั่งซื้อ" hint="ลิงก์ LINE / Facebook ที่ปุ่มสั่งซื้อจะเปิด">
        <Card className="space-y-3">
          <TextField
            label="ลิงก์ LINE"
            value={shop.order.lineUrl}
            onChange={(lineUrl) => patchOrder({ lineUrl })}
            placeholder="https://line.me/R/ti/p/@niightmare"
          />
          <TextField
            label="ลิงก์ Facebook / Messenger"
            value={shop.order.facebookUrl}
            onChange={(facebookUrl) => patchOrder({ facebookUrl })}
            placeholder="https://m.me/niightmareesports"
          />
          <BilingualTextArea
            label="ข้อความใต้ปุ่มสั่งซื้อ"
            value={shop.order.note}
            rows={2}
            onChange={(note) => patchOrder({ note })}
          />
        </Card>
      </Section>

      <Section title="ตารางไซส์ & สต็อก" hint="หน่วยเป็นเซนติเมตร — ติ๊ก 'มีสต็อก' เพื่อเปิดให้สั่งไซส์นั้น" collapsible={false}>
        <div className="space-y-3">
          {shop.sizes.map((s, i) => (
            <Card key={s.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-base font-bold uppercase tracking-wide text-soul">
                  ไซส์ {s.label}
                </span>
                <Button
                  variant={s.inStock ? "primary" : "danger"}
                  onClick={() => patchSize(i, { inStock: !s.inStock })}
                >
                  {s.inStock ? "มีสต็อก" : "หมด"}
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <TextField label="ป้ายไซส์ (เช่น M)" value={s.label} onChange={(label) => patchSize(i, { label })} />
                <NumberField label="รอบอก (ซม)" value={s.chest} onChange={(chest) => patchSize(i, { chest })} />
                <NumberField label="ความยาว (ซม)" value={s.length} onChange={(length) => patchSize(i, { length })} />
                <NumberField label="ไหล่ (ซม)" value={s.shoulder} onChange={(shoulder) => patchSize(i, { shoulder })} />
                <NumberField label="แขนเสื้อ (ซม)" value={s.sleeve} onChange={(sleeve) => patchSize(i, { sleeve })} />
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="สูงต่ำสุด" value={s.minHeight} onChange={(minHeight) => patchSize(i, { minHeight })} />
                  <NumberField label="สูงสูงสุด" value={s.maxHeight} onChange={(maxHeight) => patchSize(i, { maxHeight })} />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-ash">
          หมายเหตุ: รอบอก (ซม) คือเส้นรอบวงของตัวเสื้อ ใช้คำนวณความพอดีในโมเดล 3D โดยตรง —
          ค่ามากขึ้นเสื้อจะดูหลวมขึ้น
        </p>
      </Section>
    </div>
  );
}
