"use client";

import React, { useState } from "react";
import { useData } from "@/components/admin/useData";
import { BilingualField, Button, ImageField, Label, Section, SelectField, TextArea, TextField } from "@/components/admin/ui";
import { SPONSOR_GROUPS, resolveSponsorGroup, sponsorGroupCopy } from "@/lib/sponsorGroups";
import type { Bilingual, Sponsor, SponsorSocials } from "@/lib/types";

const SOCIAL_FIELDS: { key: keyof SponsorSocials; label: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/856..." },
  { key: "phone", label: "เบอร์โทร", placeholder: "+856 20 ..." },
];

interface SponsorsFile {
  sponsors: Sponsor[];
}

const uid = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;

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
          label="ລາວ"
          value={value.lo}
          rows={rows}
          onChange={(lo) => onChange({ ...value, lo })}
        />
      </div>
    </div>
  );
}

/** How many contact channels a sponsor has filled — shown in the collapsed row. */
function channelCount(sponsor: Sponsor) {
  const s = sponsor.socials ?? {};
  const filled = SOCIAL_FIELDS.filter(({ key }) => (s[key] ?? "").trim()).length;
  const web = sponsor.url && sponsor.url.trim() && sponsor.url.trim() !== "#" ? 1 : 0;
  return filled + web;
}

/** One collapsible partner row — collapsed shows logo + name; open shows the editor. */
function SponsorRow({
  sponsor,
  index,
  total,
  onPatch,
  onMove,
  onRemove,
}: {
  sponsor: Sponsor;
  index: number;
  total: number;
  onPatch: (patch: Partial<Sponsor>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const channels = channelCount(sponsor);
  const hasDesc = Boolean(sponsor.description && (sponsor.description.en || sponsor.description.lo));
  const group = sponsorGroupCopy(sponsor.partnerGroup);

  return (
    <div className="border border-edge bg-crypt/40">
      {/* header */}
      <div className="flex items-stretch justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-crypt"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden border border-edge bg-void/60">
            {sponsor.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sponsor.logo} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="font-mono text-[10px] font-bold text-ash">
                {(sponsor.name || "?").slice(0, 2).toUpperCase()}
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-bold uppercase tracking-wide text-soul">
              {sponsor.name || "ยังไม่ตั้งชื่อ"}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] text-ash">
              {sponsor.logo ? "โลโก้ ✓" : "ยังไม่มีโลโก้"} · {channels} ช่องทาง
              {hasDesc ? " · มีคำอธิบาย" : ""}
              {` · ${group.adminLabel}`}
            </span>
          </span>
          <span
            aria-hidden
            className={`ml-auto shrink-0 font-mono text-lg leading-none text-amethyst transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            ⌄
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1 pr-2">
          <Button onClick={() => onMove(-1)} disabled={index === 0} className="min-h-[34px] px-2.5">↑</Button>
          <Button onClick={() => onMove(1)} disabled={index === total - 1} className="min-h-[34px] px-2.5">↓</Button>
        </div>
      </div>

      {/* body */}
      {open && (
        <div className="space-y-4 border-t border-edge p-4">
          <TextField
            label="ชื่อ partner"
            value={sponsor.name}
            onChange={(name) => onPatch({ name })}
          />
          <SelectField
            label="กลุ่มที่แสดงบนหน้า Sponsors"
            value={resolveSponsorGroup(sponsor.partnerGroup)}
            options={SPONSOR_GROUPS.map((item) => ({
              value: item.id,
              label: item.adminLabel,
            }))}
            onChange={(partnerGroup) =>
              onPatch({ partnerGroup: resolveSponsorGroup(partnerGroup) })
            }
          />
          <ImageField
            label="โลโก้"
            value={sponsor.logo}
            folder="sponsors"
            onChange={(logo) => onPatch({ logo })}
          />
          <TextField
            label="เว็บไซต์ (Website)"
            value={sponsor.url}
            onChange={(url) => onPatch({ url })}
            placeholder="https://... หรือเว้นว่างถ้าไม่มี"
          />
          <BilingualField
            label="หมวดหมู่ / ประเภทธุรกิจ"
            value={sponsor.category ?? { en: "", lo: "" }}
            onChange={(category) => onPatch({ category })}
          />
          <BilingualTextArea
            label="คำอธิบาย (โชว์ใน popup)"
            value={sponsor.description ?? { en: "", lo: "" }}
            rows={3}
            onChange={(description) => onPatch({ description })}
          />
          <div>
            <Label>ช่องทาง Social / ติดต่อ (ใส่เฉพาะที่มี — ช่องว่างจะไม่โชว์)</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                <TextField
                  key={key}
                  label={label}
                  value={sponsor.socials?.[key] ?? ""}
                  onChange={(v) => onPatch({ socials: { ...(sponsor.socials ?? {}), [key]: v } })}
                  placeholder={placeholder}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end border-t border-edge pt-3">
            <Button variant="danger" onClick={onRemove}>
              ลบ partner นี้
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SponsorsEditor() {
  const { data, setData, loading, saving, error, savedAt, save } =
    useData<SponsorsFile>("sponsors");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด...</p>;
  if (!data)
    return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const { sponsors } = data;
  const setSponsors = (next: Sponsor[]) => setData({ ...data, sponsors: next });

  const patchSponsor = (i: number, patch: Partial<Sponsor>) =>
    setSponsors(sponsors.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const addSponsor = () =>
    setSponsors([
      ...sponsors,
      { id: uid("s"), name: "New Partner", url: "", logo: "", partnerGroup: "official" },
    ]);

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">{sponsors.length} partners</p>
        <div className="flex items-center gap-3">
          {error && <span className="font-mono text-[11px] text-loss">{error}</span>}
          {savedAt && !error && !saving && (
            <span className="font-mono text-[11px] text-win">บันทึกแล้ว ✓</span>
          )}
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </Button>
        </div>
      </div>

      <Section
        title="Partners"
        hint="คลิกที่ชื่อเพื่อเปิดแก้ไข — เลือกกลุ่ม / โลโก้ / คำอธิบาย / ช่องทางติดต่อ"
        defaultOpen
        collapsible={false}
        action={<Button onClick={addSponsor}>+ เพิ่ม partner</Button>}
      >
        <div className="space-y-2">
          {sponsors.map((sponsor, i) => (
            <SponsorRow
              key={sponsor.id}
              sponsor={sponsor}
              index={i}
              total={sponsors.length}
              onPatch={(patch) => patchSponsor(i, patch)}
              onMove={(dir) => setSponsors(move(sponsors, i, dir))}
              onRemove={() => setSponsors(sponsors.filter((_, idx) => idx !== i))}
            />
          ))}
          {sponsors.length === 0 && (
            <p className="border border-dashed border-edge bg-void/30 px-4 py-6 text-center font-mono text-xs text-ash">
              ยังไม่มี partner — กด “+ เพิ่ม partner”
            </p>
          )}
        </div>
      </Section>

    </div>
  );
}
