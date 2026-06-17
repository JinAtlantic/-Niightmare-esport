"use client";

import React from "react";
import { useData } from "@/components/admin/useData";
import {
  Button,
  Card,
  TextField,
  TextArea,
  SelectField,
  BilingualField,
  ImageField,
  Label,
} from "@/components/admin/ui";
import OpponentLogo from "@/components/cards/OpponentLogo";
import {
  MailIcon,
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
  DiscordIcon,
} from "@/components/ui/Icons";
import type { UpcomingMatch } from "@/lib/types";
import type { Bilingual } from "@/lib/types";

interface Contact {
  email?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  [key: string]: string | undefined;
}

interface SnapshotStat {
  id: string;
  value: string;
  label: Bilingual;
  detail: Bilingual;
}

interface SnapshotPillar {
  id: string;
  title: Bilingual;
  body: Bilingual;
}

interface SnapshotCta {
  label: Bilingual;
  href: string;
}

interface HomeSnapshot {
  kicker: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  stats: SnapshotStat[];
  pillars: SnapshotPillar[];
  primaryCta: SnapshotCta;
  secondaryCta: SnapshotCta;
}

/** site.json — we edit `upcomingMatch` and `contact`; everything else is preserved. */
interface SiteFile {
  upcomingMatch: UpcomingMatch;
  contact?: Contact;
  homeSnapshot?: HomeSnapshot;
  [key: string]: unknown;
}

const DEFAULT_HOME_SNAPSHOT: HomeSnapshot = {
  kicker: { en: "PARTNER-READY CLUB PROFILE", lo: "ໂປຣໄຟລ໌ທີມສໍາລັບພາກສ່ວນ" },
  title: { en: "TEAM SNAPSHOT", lo: "ພາບລວມຂອງທີມ" },
  intro: {
    en: "A fast read for fans, media, and brands: the competitions we play, the roster behind the tag, and the sponsor paths built into the club.",
    lo: "ພາບລວມສໍາລັບແຟນ, ສື່ ແລະ ແບຣນ: ລາຍການທີ່ເຮົາແຂ່ງ, ນັກກິລາໃນທີມ ແລະ ເສັ້ນທາງສໍາລັບພາກສ່ວນທີ່ຢາກຮ່ວມງານ.",
  },
  stats: [
    { id: "divisions", value: "2", label: { en: "DIVISIONS", lo: "ປະເພດເກມ" }, detail: { en: "MLBB / eFootball", lo: "MLBB / eFootball" } },
    { id: "roster", value: "8", label: { en: "ROSTER", lo: "ນັກກິລາ" }, detail: { en: "Active players across the current lineup.", lo: "ນັກກິລາທີ່ຢູ່ໃນລາຍຊື່ປັດຈຸບັນ." } },
    { id: "honours", value: "1", label: { en: "HONOURS", lo: "ລາງວັນ" }, detail: { en: "Tournament placements already in the cabinet.", lo: "ຜົນງານການແຂ່ງຂັນທີ່ຢູ່ໃນຕູ້ລາງວັນ." } },
    { id: "partners", value: "3+", label: { en: "PARTNER TIERS", lo: "ລະດັບພາກສ່ວນ" }, detail: { en: "Structured options for brands and community partners.", lo: "ທາງເລືອກສໍາລັບແບຣນ ແລະ ພາກສ່ວນຊຸມຊົນ." } },
  ],
  pillars: [
    { id: "matchday", title: { en: "MATCHDAY PRESENCE", lo: "ພ້ອມສໍາລັບວັນແຂ່ງ" }, body: { en: "The headline fixture gives visitors the next battle, opponent, tournament, and kickoff without digging through pages.", lo: "ຜູ້ເຂົ້າຊົມເຫັນນັດຕໍ່ໄປ, ຄູ່ແຂ່ງ, ລາຍການ ແລະ ເວລາເລີ່ມໄດ້ທັນທີ." } },
    { id: "proof", title: { en: "PROOF OF LEVEL", lo: "ຫຼັກຖານຂອງລະດັບ" }, body: { en: "Honours, match history, and news make the team look active instead of like a static logo page.", lo: "ລາງວັນ, ປະຫວັດການແຂ່ງ ແລະ ຂ່າວ ຊ່ວຍໃຫ້ທີມເບິ່ງມີການເຄື່ອນໄຫວ." } },
    { id: "partners", title: { en: "BUSINESS FLOW", lo: "ເສັ້ນທາງທຸລະກິດ" }, body: { en: "Sponsor and contact routes are visible from the home page, which helps with price discussions and partner trust.", lo: "ລິ້ງສໍາລັບສະປອນເຊີ ແລະ ການຕິດຕໍ່ຢູ່ໃນໜ້າຫຼັກ ຊ່ວຍໃນການຕໍ່ລອງ ແລະ ສ້າງຄວາມເຊື່ອໃຈ." } },
  ],
  primaryCta: { label: { en: "VIEW SPONSOR PATHS", lo: "ເບິ່ງທາງເລືອກສະປອນເຊີ" }, href: "/sponsors" },
  secondaryCta: { label: { en: "START A DEAL", lo: "ເລີ່ມຕິດຕໍ່ທຸລະກິດ" }, href: "/contact" },
};

/** The footer/contact channels, in footer order, each with its icon + hint. */
const CONTACT_FIELDS: {
  key: keyof Contact;
  label: string;
  Icon: typeof MailIcon;
  placeholder: string;
}[] = [
  { key: "email", label: "Email", Icon: MailIcon, placeholder: "contact@niightmare.gg" },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon, placeholder: "https://facebook.com/…" },
  { key: "instagram", label: "Instagram", Icon: InstagramIcon, placeholder: "https://instagram.com/…" },
  { key: "youtube", label: "YouTube", Icon: YoutubeIcon, placeholder: "https://youtube.com/@…" },
  { key: "discord", label: "Discord", Icon: DiscordIcon, placeholder: "https://discord.gg/…" },
];

const STATUS_OPTS = [
  { value: "next", label: "นัดต่อไป (Next)" },
  { value: "live", label: "กำลังแข่ง (Live)" },
  { value: "practice", label: "ช่วงซ้อมทีม (Practice)" },
];
const GAME_OPTS = [
  { value: "mlbb", label: "MLBB" },
  { value: "efootball", label: "eFootball" },
];
const STATUS_TH: Record<string, string> = {
  next: "นัดต่อไป",
  live: "กำลังแข่ง",
  practice: "ช่วงซ้อมทีม",
};

// stored ISO "2025-06-20T19:00:00+07:00" ↔ datetime-local "2025-06-20T19:00"
const toLocalInput = (iso: string) => (iso || "").slice(0, 16);
const fromLocalInput = (v: string) => (v ? `${v}:00+07:00` : "");

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

export default function HomeEditor() {
  const { data, setData, loading, saving, error, savedAt, save } =
    useData<SiteFile>("site");

  if (loading) return <p className="font-mono text-sm text-ash">กำลังโหลด…</p>;
  if (!data)
    return <p className="font-mono text-sm text-loss">โหลดข้อมูลไม่สำเร็จ</p>;

  const m = data.upcomingMatch;
  const patch = (p: Partial<UpcomingMatch>) =>
    setData({ ...data, upcomingMatch: { ...m, ...p } });

  const contact: Contact = data.contact ?? {};
  const patchContact = (key: keyof Contact, value: string) => {
    const next = { ...contact, [key]: value.trim() || undefined };
    setData({ ...data, contact: next });
  };

  const rawSnapshot = data.homeSnapshot;
  const snapshot: HomeSnapshot = {
    ...DEFAULT_HOME_SNAPSHOT,
    ...(rawSnapshot ?? {}),
    stats: rawSnapshot?.stats?.length ? rawSnapshot.stats : DEFAULT_HOME_SNAPSHOT.stats,
    pillars: rawSnapshot?.pillars?.length ? rawSnapshot.pillars : DEFAULT_HOME_SNAPSHOT.pillars,
    primaryCta: { ...DEFAULT_HOME_SNAPSHOT.primaryCta, ...(rawSnapshot?.primaryCta ?? {}) },
    secondaryCta: { ...DEFAULT_HOME_SNAPSHOT.secondaryCta, ...(rawSnapshot?.secondaryCta ?? {}) },
  };
  const patchSnapshot = (p: Partial<HomeSnapshot>) =>
    setData({ ...data, homeSnapshot: { ...snapshot, ...p } });
  const patchStat = (index: number, p: Partial<SnapshotStat>) => {
    const stats = snapshot.stats.map((stat, i) => (i === index ? { ...stat, ...p } : stat));
    patchSnapshot({ stats });
  };
  const patchPillar = (index: number, p: Partial<SnapshotPillar>) => {
    const pillars = snapshot.pillars.map((pillar, i) =>
      i === index ? { ...pillar, ...p } : pillar
    );
    patchSnapshot({ pillars });
  };

  const isPractice = m.status === "practice";

  return (
    <div className="space-y-8">
      {/* save bar */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="font-mono text-xs text-ash">
          สถานะ: <span className="text-spectre">{STATUS_TH[m.status] ?? m.status}</span>
        </p>
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
            Team Snapshot (หน้า Home)
          </h2>
          <p className="mt-1 font-mono text-[11px] text-ash">
            แก้ข้อความ ตัวเลข การ์ดจุดขาย และปุ่ม CTA ของ section ที่ใช้คุยกับสปอนเซอร์
          </p>
        </div>

        <Card className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <BilingualField
              label="Kicker / Eyebrow"
              value={snapshot.kicker}
              onChange={(kicker) => patchSnapshot({ kicker })}
            />
            <BilingualField
              label="หัวข้อหลัก"
              value={snapshot.title}
              onChange={(title) => patchSnapshot({ title })}
            />
          </div>
          <BilingualTextArea
            label="Intro copy"
            value={snapshot.intro}
            rows={3}
            onChange={(intro) => patchSnapshot({ intro })}
          />
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {snapshot.stats.slice(0, 4).map((stat, i) => (
            <Card key={stat.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
                  Stat Tile {i + 1}
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash-dim">
                  {stat.id}
                </span>
              </div>
              <TextField
                label="ตัวเลข / Value"
                value={stat.value}
                onChange={(value) => patchStat(i, { value })}
              />
              <BilingualField
                label="Label"
                value={stat.label}
                onChange={(label) => patchStat(i, { label })}
              />
              <BilingualField
                label="Detail"
                value={stat.detail}
                onChange={(detail) => patchStat(i, { detail })}
              />
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {snapshot.pillars.slice(0, 3).map((pillar, i) => (
            <Card key={pillar.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
                  Pillar {i + 1}
                </h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash-dim">
                  {pillar.id}
                </span>
              </div>
              <BilingualField
                label="Title"
                value={pillar.title}
                onChange={(title) => patchPillar(i, { title })}
              />
              <BilingualTextArea
                label="Body"
                value={pillar.body}
                rows={4}
                onChange={(body) => patchPillar(i, { body })}
              />
            </Card>
          ))}
        </div>

        <Card className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
                Primary CTA
              </h3>
              <BilingualField
                label="Button label"
                value={snapshot.primaryCta.label}
                onChange={(label) =>
                  patchSnapshot({ primaryCta: { ...snapshot.primaryCta, label } })
                }
              />
              <TextField
                label="Link"
                value={snapshot.primaryCta.href}
                onChange={(href) =>
                  patchSnapshot({ primaryCta: { ...snapshot.primaryCta, href } })
                }
              />
            </div>
            <div className="space-y-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
                Secondary CTA
              </h3>
              <BilingualField
                label="Button label"
                value={snapshot.secondaryCta.label}
                onChange={(label) =>
                  patchSnapshot({ secondaryCta: { ...snapshot.secondaryCta, label } })
                }
              />
              <TextField
                label="Link"
                value={snapshot.secondaryCta.href}
                onChange={(href) =>
                  patchSnapshot({ secondaryCta: { ...snapshot.secondaryCta, href } })
                }
              />
            </div>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
            นัดต่อไป (หน้า Home)
          </h2>
          <p className="mt-1 font-mono text-[11px] text-ash">
            แก้ไขการ์ดการแข่งขันที่โชว์เด่นอยู่หน้าแรก
          </p>
        </div>

        <Card>
          {/* live preview line */}
          <div className="mb-4 flex items-center gap-3 border-b border-edge pb-4">
            <OpponentLogo src="/logo.png" name="NM" size={32} />
            <span className="font-mono text-xs text-ash-dim">vs</span>
            <OpponentLogo src={m.opponentLogo} name={m.opponent || "?"} size={32} />
            <span className="font-mono text-xs text-spectre">
              {m.opponent || (isPractice ? "ซ้อมทีม" : "—")}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <SelectField
              label="สถานะ"
              value={m.status}
              onChange={(v) => patch({ status: v as UpcomingMatch["status"] })}
              options={STATUS_OPTS}
            />
            <SelectField
              label="เกม (งาน)"
              value={m.game}
              onChange={(v) => patch({ game: v as UpcomingMatch["game"] })}
              options={GAME_OPTS}
            />
            <div className="md:col-span-2">
              <TextField
                label="วันและเวลาแข่ง (เวลาลาว/ไทย +07:00)"
                type="datetime-local"
                value={toLocalInput(m.date)}
                onChange={(v) => patch({ date: fromLocalInput(v) })}
              />
            </div>
            <div className="md:col-span-2">
              <BilingualField
                label="งาน / ทัวร์นาเมนต์"
                value={m.tournament}
                onChange={(v) => patch({ tournament: v })}
              />
            </div>
            <div className="md:col-span-2">
              <BilingualField
                label="รอบการแข่งขัน (เช่น รอบรองชนะเลิศ — เว้นว่างได้)"
                value={m.round ?? { en: "", lo: "" }}
                onChange={(v) => patch({ round: v })}
              />
            </div>
            <TextField
              label={isPractice ? "ทีมที่ซ้อมด้วย (เว้นว่างได้)" : "ทีมคู่แข่ง"}
              value={m.opponent}
              onChange={(v) => patch({ opponent: v })}
              placeholder="เช่น Vientiane Vipers"
            />
            <div className="md:col-span-2">
              <ImageField
                label="โลโก้คู่แข่ง"
                value={m.opponentLogo}
                folder="teams"
                onChange={(p) => patch({ opponentLogo: p || undefined })}
              />
            </div>
            <div className="md:col-span-2">
              <TextField
                label="ลิงก์ไลฟ์สด (YouTube/Facebook) — โชว์ปุ่ม WATCH LIVE เมื่อสถานะ = กำลังแข่ง"
                value={m.streamUrl ?? ""}
                onChange={(v) => patch({ streamUrl: v || undefined })}
                placeholder="https://youtube.com/live/…"
              />
            </div>
          </div>

          {isPractice && (
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-ash">
              โหมด “ช่วงซ้อมทีม”: ถ้าเว้นชื่อทีมคู่แข่งไว้ การ์ดจะโชว์เป็น “TEAM
              PRACTICE” แทนการ vs ทีมอื่น
            </p>
          )}
        </Card>
      </section>

      {/* Footer / contact links */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-soul">
            ลิงก์ติดต่อ & Footer
          </h2>
          <p className="mt-1 font-mono text-[11px] text-ash">
            ไอคอนท้ายเว็บ (Footer) — เว้นว่างช่องไหน ไอคอนนั้นจะถูกซ่อนอัตโนมัติ
          </p>
        </div>

        <Card>
          <div className="space-y-3">
            {CONTACT_FIELDS.map(({ key, label, Icon, placeholder }) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center border border-edge bg-void/60 text-amethyst">
                    <Icon size={18} />
                  </span>
                  <input
                    className="w-full border border-edge bg-void/60 px-3 py-2 font-mono text-xs text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst"
                    placeholder={placeholder}
                    value={contact[key] ?? ""}
                    onChange={(e) => patchContact(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-ash">
            Email ใส่เป็นที่อยู่อีเมลธรรมดา (เช่น contact@niightmare.gg) — ระบบจะทำลิงก์ mailto ให้เอง
          </p>
        </Card>
      </section>
    </div>
  );
}
