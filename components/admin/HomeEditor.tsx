"use client";

import React from "react";
import { useData } from "@/components/admin/useData";
import {
  Button,
  Card,
  Collapsible,
  Section,
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
  TiktokIcon,
  DiscordIcon,
} from "@/components/ui/Icons";
import RoadmapEditor from "@/components/admin/RoadmapEditor";
import type { UpcomingMatch } from "@/lib/types";
import type { Bilingual } from "@/lib/types";
import { resolveAbout, type AboutUsContent } from "@/lib/about";
import { resolveRoadmap, type RoadmapContent } from "@/lib/roadmap";
import {
  resolveMatchSchedule,
  type MatchScheduleContent,
  type MatchScheduleEntry,
} from "@/lib/matchSchedule";
import { BO_SELECT_OPTIONS } from "@/lib/bestOf";

interface Contact {
  email?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  discord?: string;
  [key: string]: string | undefined;
}

type ContactKey = "email" | "facebook" | "instagram" | "youtube" | "tiktok" | "discord" | "liquipedia";
type ContactFieldKey = "name" | "email" | "company" | "type" | "message" | "attachments";
type ContactTypeKey = "sponsorship" | "media" | "general" | "tryout";

interface ContactPageCopy {
  kicker: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  deskLabel: Bilingual;
  deskIntro: Bilingual;
  infoLabel: Bilingual;
  mediaKitLabel: Bilingual;
  mediaKitDesc: Bilingual;
  mediaKitButton: Bilingual;
  formLabel: Bilingual;
  formIntro: Bilingual;
  fieldLabels: Record<ContactFieldKey, Bilingual>;
  typeLabels: Record<ContactTypeKey, Bilingual>;
  channelLabels: Record<ContactKey, Bilingual>;
  submit: Bilingual;
  submitting: Bilingual;
  success: Bilingual;
  error: Bilingual;
}

/** site.json — we edit `upcomingMatch` and `contact`; everything else is preserved. */
interface SiteFile {
  upcomingMatch: UpcomingMatch;
  contact?: Contact;
  aboutUs?: AboutUsContent;
  roadmap?: RoadmapContent;
  matchSchedule?: MatchScheduleContent;
  contactPage?: ContactPageCopy;
  [key: string]: unknown;
}

const DEFAULT_CONTACT_PAGE: ContactPageCopy = {
  kicker: { en: "Contact", lo: "ຕິດຕໍ່" },
  title: { en: "Contact NIIGHTMARE", lo: "ຕິດຕໍ່ NIIGHTMARE" },
  intro: {
    en: "Open the right conversation for sponsorship, media, recruitment, or community collaborations.",
    lo: "ເລີ່ມຕົ້ນການຕິດຕໍ່ທີ່ຖືກທາງ ສໍາລັບສະປອນເຊີ, ສື່, ການຮັບສະໝັກ ຫຼື ການຮ່ວມມືກັບຊຸມຊົນ.",
  },
  deskLabel: { en: "Team Contact", lo: "ຊ່ອງທາງຕິດຕໍ່ທີມ" },
  deskIntro: {
    en: "Send sponsorship, media, event, scrim, recruitment, or official team enquiries.",
    lo: "ສົ່ງຂໍ້ຄວາມເລື່ອງ sponsor, media, event, scrim, recruitment ຫຼື ການຕິດຕໍ່ທີມແບບທາງການ.",
  },
  infoLabel: { en: "Direct Channels", lo: "ຊ່ອງທາງໂດຍກົງ" },
  mediaKitLabel: { en: "Attachments", lo: "ໄຟລ໌ແນບ" },
  mediaKitDesc: {
    en: "Attach documents, images, videos, proposals, or any files NIIGHTMARE should review.",
    lo: "ແນບເອກະສານ, ຮູບ, ວິດີໂອ, proposal ຫຼື ໄຟລ໌ໃດໆ ທີ່ຕ້ອງການໃຫ້ NIIGHTMARE ກວດເບິ່ງ.",
  },
  mediaKitButton: { en: "Attach / Send Files", lo: "ແນບ / ສົ່ງໄຟລ໌" },
  formLabel: { en: "Start the Conversation", lo: "ເລີ່ມການຕິດຕໍ່" },
  formIntro: {
    en: "Send the team your brief. We will route it to the right person.",
    lo: "ສົ່ງ brief ຂອງທ່ານໃຫ້ທີມ ແລ້ວພວກເຮົາຈະສົ່ງຕໍ່ໃຫ້ຜູ້ຮັບຜິດຊອບ.",
  },
  fieldLabels: {
    name: { en: "Name", lo: "ຊື່" },
    email: { en: "Email", lo: "ອີເມວ" },
    company: { en: "Company / Organization", lo: "ບໍລິສັດ / ອົງກອນ" },
    type: { en: "Enquiry Type", lo: "ປະເພດການຕິດຕໍ່" },
    message: { en: "Message", lo: "ຂໍ້ຄວາມ" },
    attachments: { en: "Attachments", lo: "ໄຟລ໌ແນບ" },
  },
  typeLabels: {
    sponsorship: { en: "Sponsorship", lo: "ສະປອນເຊີ" },
    media: { en: "Media", lo: "ສື່" },
    general: { en: "General", lo: "ທົ່ວໄປ" },
    tryout: { en: "Tryout", lo: "ທົດສອບທີມ" },
  },
  channelLabels: {
    email: { en: "Business Email", lo: "ອີເມວທຸລະກິດ" },
    facebook: { en: "Facebook", lo: "Facebook" },
    instagram: { en: "Instagram", lo: "Instagram" },
    youtube: { en: "YouTube", lo: "YouTube" },
    tiktok: { en: "TikTok", lo: "TikTok" },
    discord: { en: "Discord", lo: "Discord" },
    liquipedia: { en: "Liquipedia", lo: "Liquipedia" },
  },
  submit: { en: "Send Message", lo: "ສົ່ງຂໍ້ຄວາມ" },
  submitting: { en: "Sending...", lo: "ກໍາລັງສົ່ງ..." },
  success: { en: "Message sent. We will get back to you soon.", lo: "ສົ່ງຂໍ້ຄວາມແລ້ວ. ພວກເຮົາຈະຕອບກັບໄວໆນີ້." },
  error: { en: "Something went wrong. Please email us directly at", lo: "ມີບາງຢ່າງຜິດພາດ. ກະລຸນາສົ່ງອີເມວໂດຍກົງຫາ" },
};

function isOldMediaKitCopy(value?: Bilingual) {
  const en = value?.en?.toLowerCase() ?? "";
  return en.includes("media kit") || en.includes("download media") || en.includes("logos, brand usage");
}

function normalizeContactPage(rawContactPage?: Partial<ContactPageCopy>): ContactPageCopy {
  const merged: ContactPageCopy = {
    ...DEFAULT_CONTACT_PAGE,
    ...(rawContactPage ?? {}),
    fieldLabels: { ...DEFAULT_CONTACT_PAGE.fieldLabels, ...(rawContactPage?.fieldLabels ?? {}) },
    typeLabels: { ...DEFAULT_CONTACT_PAGE.typeLabels, ...(rawContactPage?.typeLabels ?? {}) },
    channelLabels: { ...DEFAULT_CONTACT_PAGE.channelLabels, ...(rawContactPage?.channelLabels ?? {}) },
  };

  return {
    ...merged,
    mediaKitLabel: isOldMediaKitCopy(merged.mediaKitLabel)
      ? DEFAULT_CONTACT_PAGE.mediaKitLabel
      : merged.mediaKitLabel,
    mediaKitDesc: isOldMediaKitCopy(merged.mediaKitDesc)
      ? DEFAULT_CONTACT_PAGE.mediaKitDesc
      : merged.mediaKitDesc,
    mediaKitButton: isOldMediaKitCopy(merged.mediaKitButton)
      ? DEFAULT_CONTACT_PAGE.mediaKitButton
      : merged.mediaKitButton,
  };
}

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
  { key: "tiktok", label: "TikTok", Icon: TiktokIcon, placeholder: "https://tiktok.com/@…" },
  { key: "discord", label: "Discord", Icon: DiscordIcon, placeholder: "https://discord.gg/…" },
];

const STATUS_OPTS = [
  { value: "next", label: "นัดต่อไป (Next)" },
  { value: "live", label: "กำลังแข่ง (Live)" },
  { value: "finished", label: "จบแล้ว (Finished)" },
  { value: "practice", label: "ช่วงซ้อมทีม (Practice)" },
];
const GAME_OPTS = [
  { value: "mlbb", label: "MLBB" },
  { value: "efootball", label: "eFootball" },
];
const RESULT_OPTS = [
  { value: "win", label: "ชนะ (Win)" },
  { value: "loss", label: "แพ้ (Loss)" },
  { value: "draw", label: "เสมอ (Draw)" },
];
const STATUS_TH: Record<string, string> = {
  next: "นัดต่อไป",
  live: "กำลังแข่ง",
  finished: "จบแล้ว",
  practice: "ช่วงซ้อมทีม",
};

// stored ISO "2025-06-20T19:00:00+07:00" ↔ datetime-local "2025-06-20T19:00"
const toLocalInput = (iso: string) => (iso || "").slice(0, 16);
const fromLocalInput = (v: string) => (v ? `${v}:00+07:00` : "");

const newScheduleEntry = (): MatchScheduleEntry => ({
  id: `schedule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
  opponent: "",
  date: "",
  time: "",
  round: { en: "", lo: "" },
  game: "mlbb",
  tournament: { en: "", lo: "" },
});

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
  const rawContactPage = data.contactPage;
  const contactPage = normalizeContactPage(rawContactPage);
  const patchContactPage = (p: Partial<ContactPageCopy>) =>
    setData({ ...data, contactPage: { ...contactPage, ...p } });

  const about = resolveAbout(data.aboutUs);
  const patchAbout = (p: Partial<AboutUsContent>) =>
    setData({ ...data, aboutUs: { ...about, ...p } });
  const roadmap = resolveRoadmap(data.roadmap);
  const patchRoadmap = (rm: RoadmapContent) => setData({ ...data, roadmap: rm });
  const matchSchedule = resolveMatchSchedule(data.matchSchedule);
  const patchMatchSchedule = (patch: Partial<MatchScheduleContent>) =>
    setData({ ...data, matchSchedule: resolveMatchSchedule({ ...matchSchedule, ...patch }) });
  const patchScheduleEntry = (id: string, patch: Partial<MatchScheduleEntry>) =>
    patchMatchSchedule({
      entries: matchSchedule.entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    });

  const isPractice = m.status === "practice";
  const isFinished = m.status === "finished";

  // One-tap advance: pull the first row of the schedule popup up into the home
  // headline card (replacing the finished/current fixture) and drop it from the
  // schedule list. Entries carry game/tournament so the promoted card is complete.
  const nextEntry = matchSchedule.entries[0];
  const promoteNext = () => {
    if (!nextEntry) return;
    if (!window.confirm(`ดึงแมตช์ถัดไป (${nextEntry.opponent || "TBA"}) ขึ้นมาแสดงแทนการ์ดปัจจุบัน?`)) return;
    const iso = nextEntry.time
      ? `${nextEntry.date}T${nextEntry.time}:00+07:00`
      : nextEntry.date || "";
    setData({
      ...data,
      upcomingMatch: {
        status: "next",
        date: iso,
        game: nextEntry.game ?? m.game,
        tournament: nextEntry.tournament ?? { en: "", lo: "" },
        round: nextEntry.round,
        bo: nextEntry.bo || undefined,
        opponent: nextEntry.opponent,
        opponentAbbr: nextEntry.opponentAbbr,
        opponentLogo: nextEntry.opponentLogo,
        hasLive: false,
        streamUrl: undefined,
        result: undefined,
        score: undefined,
      },
      matchSchedule: resolveMatchSchedule({
        ...matchSchedule,
        entries: matchSchedule.entries.slice(1),
      }),
    });
  };
  // "Has live" is a persisted intent (m.hasLive); an existing stream link also
  // counts so older fixtures keep showing the badge without re-toggling.
  const hasLive = Boolean(m.hasLive) || Boolean(m.streamUrl && m.streamUrl.trim());

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

      <Section
        title="About Us (หน้า Home)"
        hint="หัวข้อหลัก WHO WE ARE + ข้อความแถลงการณ์ ที่อยู่ใต้ผลการแข่งล่าสุด"
      >
        <Card className="space-y-5">
          <BilingualField
            label="หัวข้อหลัก (เช่น WHO WE ARE)"
            value={about.kicker}
            onChange={(kicker) => patchAbout({ kicker })}
          />
        </Card>

        <Card className="mt-4 space-y-3">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
            หัวข้อใหญ่ (Manifesto)
          </h3>
          <p className="font-mono text-[11px] leading-relaxed text-ash">
            หัวข้อมี 2 บรรทัด — บรรทัด 2 ประกอบจาก “ก่อนคำเด่น + คำเด่น + หลังคำเด่น”
            โดย “คำเด่น” จะแสดงเป็นตัวอักษรโครงร่างเรืองแสงสีม่วง อย่าลืมเว้นวรรค
            (เช่น EN: ก่อน = “BUILT TO CARRY LAOS TO THE ”, คำเด่น = “SUMMIT”, หลัง = “.”)
          </p>
          <BilingualField
            label="บรรทัด 1"
            value={about.headLine1}
            onChange={(headLine1) => patchAbout({ headLine1 })}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <BilingualField
              label="บรรทัด 2 — ก่อนคำเด่น"
              value={about.headPre}
              onChange={(headPre) => patchAbout({ headPre })}
            />
            <BilingualField
              label="คำเด่น (เรืองแสง)"
              value={about.headAccent}
              onChange={(headAccent) => patchAbout({ headAccent })}
            />
            <BilingualField
              label="บรรทัด 2 — หลังคำเด่น"
              value={about.headPost}
              onChange={(headPost) => patchAbout({ headPost })}
            />
          </div>
        </Card>

        <Card className="mt-4 space-y-3">
          <BilingualTextArea
            label="ย่อหน้า 1"
            value={about.body1}
            rows={3}
            onChange={(body1) => patchAbout({ body1 })}
          />
          <BilingualTextArea
            label="ย่อหน้า 2"
            value={about.body2}
            rows={3}
            onChange={(body2) => patchAbout({ body2 })}
          />
        </Card>

        <Card className="mt-4">
          <div className="grid gap-4">
            <div className="space-y-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
                ปุ่มหลัก (Primary)
              </h3>
              <BilingualField
                label="ข้อความปุ่ม"
                value={about.primaryCta.label}
                onChange={(label) =>
                  patchAbout({ primaryCta: { ...about.primaryCta, label } })
                }
              />
              <TextField
                label="ลิงก์"
                value={about.primaryCta.href}
                onChange={(href) =>
                  patchAbout({ primaryCta: { ...about.primaryCta, href } })
                }
              />
            </div>
          </div>
        </Card>

      </Section>

      <Section
        title="Niightmare Roadmap (หน้า Match)"
        hint="Popup Annual Esports Roadmap แบบกระชับ พร้อม H1/H2 tabs"
      >
        <RoadmapEditor value={roadmap} onChange={patchRoadmap} />
      </Section>

      <Section
        title="นัดต่อไป (หน้า Home)"
        hint="การ์ดการแข่งขันที่โชว์เด่นอยู่หน้าแรก"
      >
        <Card>
          {/* live preview line */}
          <div className="mb-4 flex items-center gap-3 border-b border-edge pb-4">
            <OpponentLogo src="/logo.png" name="NM" size={32} />
            <span className="font-mono text-xs text-ash-dim">vs</span>
            <OpponentLogo src={m.opponentLogo} name={m.opponent || "?"} abbr={m.opponentAbbr} size={32} />
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
            <SelectField
              label="รูปแบบ Best-of (BO) — เว้นว่างได้"
              value={m.bo ?? ""}
              onChange={(v) => patch({ bo: v || undefined })}
              options={BO_SELECT_OPTIONS}
            />
            {isFinished && (
              <>
                <SelectField
                  label="ผลการแข่งขัน"
                  value={m.result ?? "win"}
                  onChange={(v) => patch({ result: v as UpcomingMatch["result"] })}
                  options={RESULT_OPTS}
                />
                <TextField
                  label="สกอร์ (เช่น 2-1)"
                  value={m.score ?? ""}
                  onChange={(v) => patch({ score: v || undefined })}
                  placeholder="2-1"
                />
                <p className="md:col-span-2 font-mono text-[11px] leading-relaxed text-ash">
                  สถานะ “จบแล้ว”: การ์ดหน้าแรกจะโชว์ผล ชนะ/แพ้ + สกอร์ พอพร้อมแข่งนัดถัดไป กดปุ่ม “⬇ ดึงแมตช์ถัดไป” ด้านล่าง (ในหัวข้อ Upcoming schedule)
                </p>
              </>
            )}
            <TextField
              label={isPractice ? "ทีมที่ซ้อมด้วย (เว้นว่างได้)" : "ทีมคู่แข่ง"}
              value={m.opponent}
              onChange={(v) => patch({ opponent: v })}
              placeholder="เช่น Vientiane Vipers"
            />
            <TextField
              label="ชื่อย่อคู่แข่ง (3 ตัว — โชว์เมื่อไม่มีโลโก้)"
              value={m.opponentAbbr ?? ""}
              onChange={(v) =>
                patch({ opponentAbbr: v.trim() ? v.trim().slice(0, 3).toUpperCase() : undefined })
              }
              placeholder="VVP"
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
              <Label>🔴 ถ่ายทอดสด (Live)</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={hasLive ? "primary" : "ghost"}
                  onClick={() => patch({ hasLive: true })}
                  className="min-h-[36px]"
                >
                  มีถ่ายทอดสด
                </Button>
                <Button
                  variant={!hasLive ? "primary" : "ghost"}
                  onClick={() => patch({ hasLive: false, streamUrl: undefined })}
                  className="min-h-[36px]"
                >
                  ไม่มี
                </Button>
              </div>
              {hasLive && (
                <div className="mt-2">
                  <TextField
                    label="ลิงก์ไลฟ์สด (YouTube/Facebook) — เว้นว่างได้"
                    value={m.streamUrl ?? ""}
                    onChange={(v) => patch({ streamUrl: v || undefined })}
                    placeholder="https://youtube.com/live/…"
                  />
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-ash">
                    เลือก “มีถ่ายทอดสด” แล้วการ์ดจะโชว์ป้าย “🔴 LIVE STREAM” ทันที (แม้ยังไม่ใส่ลิงก์).
                    พอใส่ลิงก์ ป้ายจะกดไปดูช่องได้ และปุ่ม WATCH LIVE จะเด่นขึ้นเมื่อตั้งสถานะ = กำลังแข่ง
                  </p>
                </div>
              )}
            </div>
          </div>

          {isPractice && (
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-ash">
              โหมด “ช่วงซ้อมทีม”: ถ้าเว้นชื่อทีมคู่แข่งไว้ การ์ดจะโชว์เป็น “TEAM
              PRACTICE” แทนการ vs ทีมอื่น
            </p>
          )}
        </Card>

        <Card className="mt-4 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
                Upcoming schedule popup
              </h3>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-ash">
                Add NIIGHTMARE schedule rows manually, then enable the popup when ready.
              </p>
            </div>
            <Button
              onClick={() => patchMatchSchedule({ enabled: !matchSchedule.enabled })}
              variant={matchSchedule.enabled ? "primary" : "ghost"}
            >
              {matchSchedule.enabled ? "Popup enabled" : "Popup disabled"}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <BilingualField
              label="Button label"
              value={matchSchedule.buttonLabel}
              onChange={(buttonLabel) => patchMatchSchedule({ buttonLabel })}
            />
            <BilingualField
              label="Popup title"
              value={matchSchedule.title}
              onChange={(title) => patchMatchSchedule({ title })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => patchMatchSchedule({ enabled: true, entries: [...matchSchedule.entries, newScheduleEntry()] })}>
              + Add row
            </Button>
            <Button variant="primary" onClick={promoteNext} disabled={!nextEntry}>
              ⬇ ดึงแมตช์ถัดไป (แถวที่ 1) ขึ้นหน้าแรก
            </Button>
          </div>
          {nextEntry ? (
            <p className="font-mono text-[11px] leading-relaxed text-ash">
              กด “ดึงแมตช์ถัดไป” เพื่อเอา <span className="text-spectre">แถวที่ 1 ({nextEntry.opponent || "TBA"})</span> ขึ้นเป็นการ์ด “นัดต่อไป” หน้าแรก แล้วลบออกจากตารางนี้ให้อัตโนมัติ — อย่าลืมกดบันทึก
            </p>
          ) : (
            <p className="font-mono text-[11px] leading-relaxed text-ash">
              เพิ่มแถวตารางแข่งไว้ล่วงหน้า แล้วปุ่ม “ดึงแมตช์ถัดไป” จะเลื่อนแถวแรกขึ้นการ์ดหน้าแรกได้ในคลิกเดียว
            </p>
          )}

          <div className="space-y-3">
            {matchSchedule.entries.length === 0 && (
              <p className="border border-edge bg-void/50 p-4 font-mono text-[11px] text-ash">
                No schedule rows yet.
              </p>
            )}
            {matchSchedule.entries.map((entry, index) => (
              <div key={entry.id} className="border border-edge bg-void/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-spectre">
                    Row {index + 1}
                  </span>
                  <Button
                    variant="danger"
                    onClick={() =>
                      patchMatchSchedule({ entries: matchSchedule.entries.filter((item) => item.id !== entry.id) })
                    }
                  >
                    Delete
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField
                    label="Opponent"
                    value={entry.opponent}
                    onChange={(opponent) => patchScheduleEntry(entry.id, { opponent })}
                  />
                  <BilingualField
                    label="Round"
                    value={entry.round}
                    onChange={(round) => patchScheduleEntry(entry.id, { round })}
                  />
                  <TextField
                    label="Date"
                    type="date"
                    value={entry.date}
                    onChange={(date) => patchScheduleEntry(entry.id, { date })}
                  />
                  <TextField
                    label="Time"
                    type="time"
                    value={entry.time}
                    onChange={(time) => patchScheduleEntry(entry.id, { time })}
                  />
                  <SelectField
                    label="Best-of (BO)"
                    value={entry.bo ?? ""}
                    onChange={(bo) => patchScheduleEntry(entry.id, { bo })}
                    options={BO_SELECT_OPTIONS}
                  />
                  <SelectField
                    label="เกม (ใช้ตอนดึงขึ้นหน้าแรก)"
                    value={entry.game ?? "mlbb"}
                    onChange={(game) => patchScheduleEntry(entry.id, { game: game as MatchScheduleEntry["game"] })}
                    options={GAME_OPTS}
                  />
                  <TextField
                    label="ชื่อย่อคู่แข่ง (3 ตัว)"
                    value={entry.opponentAbbr ?? ""}
                    onChange={(v) =>
                      patchScheduleEntry(entry.id, {
                        opponentAbbr: v.trim() ? v.trim().slice(0, 3).toUpperCase() : undefined,
                      })
                    }
                    placeholder="VVP"
                  />
                  <div className="md:col-span-2">
                    <BilingualField
                      label="งาน / ทัวร์นาเมนต์ (โชว์ใน popup + ตอนดึงขึ้นหน้าแรก)"
                      value={entry.tournament ?? { en: "", lo: "" }}
                      onChange={(tournament) => patchScheduleEntry(entry.id, { tournament })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <ImageField
                      label="โลโก้คู่แข่ง (เว้นว่างได้)"
                      value={entry.opponentLogo}
                      folder="teams"
                      onChange={(p) => patchScheduleEntry(entry.id, { opponentLogo: p || undefined })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* Footer / contact links — rarely edited, collapsed */}
      <Collapsible
        title="ลิงก์ติดต่อ & Footer"
        hint="ไอคอนท้ายเว็บ — เว้นว่างช่องไหน ไอคอนนั้นจะถูกซ่อน"
      >
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
      </Collapsible>

      {/* Contact page copy + form labels — rarely edited, collapsed */}
      <Collapsible
        title="ข้อความหน้า Contact & ฟอร์ม"
        hint="ข้อความทั้งหมดในหน้า /contact และป้ายกำกับฟอร์ม"
      >
        <Card>
          <div className="grid gap-3">
            <BilingualField
              label="Hero title"
              value={contactPage.title}
              onChange={(title) => patchContactPage({ title })}
            />
            <BilingualTextArea
              label="Hero intro"
              value={contactPage.intro}
              onChange={(intro) => patchContactPage({ intro })}
            />
            <BilingualField
              label="Direct channels heading"
              value={contactPage.infoLabel}
              onChange={(infoLabel) => patchContactPage({ infoLabel })}
            />
            <BilingualTextArea
              label="File submission description"
              value={contactPage.mediaKitDesc}
              onChange={(mediaKitDesc) => patchContactPage({ mediaKitDesc })}
            />
            <BilingualField
              label="File submission button"
              value={contactPage.mediaKitButton}
              onChange={(mediaKitButton) => patchContactPage({ mediaKitButton })}
            />
            <BilingualField
              label="Form heading"
              value={contactPage.formLabel}
              onChange={(formLabel) => patchContactPage({ formLabel })}
            />
            <BilingualTextArea
              label="Form intro"
              value={contactPage.formIntro}
              onChange={(formIntro) => patchContactPage({ formIntro })}
            />
          </div>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-soul">
              Form labels
            </h3>
            <div className="grid gap-3">
              {(["name", "email", "company", "type", "message", "attachments"] as ContactFieldKey[]).map((key) => (
                <BilingualField
                  key={key}
                  label={key}
                  value={contactPage.fieldLabels[key]}
                  onChange={(label) =>
                    patchContactPage({ fieldLabels: { ...contactPage.fieldLabels, [key]: label } })
                  }
                />
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-soul">
              Enquiry types
            </h3>
            <div className="grid gap-3">
              {(["sponsorship", "media", "general", "tryout"] as ContactTypeKey[]).map((key) => (
                <BilingualField
                  key={key}
                  label={key}
                  value={contactPage.typeLabels[key]}
                  onChange={(label) =>
                    patchContactPage({ typeLabels: { ...contactPage.typeLabels, [key]: label } })
                  }
                />
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-soul">
              Channel labels
            </h3>
            <div className="grid gap-3">
              {(["email", "facebook", "instagram", "youtube", "tiktok", "discord", "liquipedia"] as ContactKey[]).map((key) => (
                <BilingualField
                  key={key}
                  label={key}
                  value={contactPage.channelLabels[key]}
                  onChange={(label) =>
                    patchContactPage({ channelLabels: { ...contactPage.channelLabels, [key]: label } })
                  }
                />
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-soul">
              Form states
            </h3>
            <div className="grid gap-3">
              <BilingualField
                label="Submit"
                value={contactPage.submit}
                onChange={(submit) => patchContactPage({ submit })}
              />
              <BilingualField
                label="Submitting"
                value={contactPage.submitting}
                onChange={(submitting) => patchContactPage({ submitting })}
              />
              <BilingualTextArea
                label="Success message"
                value={contactPage.success}
                onChange={(success) => patchContactPage({ success })}
              />
              <BilingualTextArea
                label="Error message prefix"
                value={contactPage.error}
                onChange={(error) => patchContactPage({ error })}
              />
            </div>
          </Card>
        </div>
      </Collapsible>
    </div>
  );
}
