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
  DiscordIcon,
} from "@/components/ui/Icons";
import RoadmapEditor from "@/components/admin/RoadmapEditor";
import type { Match, Tournament, UpcomingMatch } from "@/lib/types";
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

/** site.json — we edit `upcomingMatch` and `contact`; everything else is preserved. */
interface SiteFile {
  upcomingMatch: UpcomingMatch;
  /** Most-recent finished fixture, retained for the admin workflow only. */
  lastResult?: UpcomingMatch;
  contact?: Contact;
  aboutUs?: AboutUsContent;
  roadmap?: RoadmapContent;
  matchSchedule?: MatchScheduleContent;
  [key: string]: unknown;
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

/** Big touch-friendly status pill: violet when selected, rose for the live one. */
function statusBtnClass(active: boolean, value: string): string {
  const base =
    "min-h-[46px] rounded-md border px-2 py-2 text-center font-display text-[11px] font-bold uppercase leading-tight tracking-[0.06em] transition-colors sm:text-xs";
  if (!active) return `${base} border-edge bg-void/60 text-ash hover:border-edge-bright hover:text-soul`;
  if (value === "live") return `${base} border-loss bg-loss/15 text-loss shadow-[0_0_18px_rgba(251,113,133,0.4)]`;
  return `${base} border-amethyst bg-amethyst/15 text-soul shadow-glow-soft`;
}

// Fixtures are entered as Lao/Thai (+07:00) wall-clock. `match_date` is a
// timestamptz, so Supabase returns it in UTC — naively slicing the string shifted
// the time by 7h on every save (the "time changes by itself" bug). These helpers
// convert the stored instant to/from +07:00 wall-clock date + 24-hour time parts.
const BKK_OFFSET_MS = 7 * 60 * 60_000;
function isoToBkkParts(iso: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const s = iso.slice(0, 16);
    return { date: s.slice(0, 10), time: s.slice(11, 16) };
  }
  const w = new Date(d.getTime() + BKK_OFFSET_MS).toISOString();
  return { date: w.slice(0, 10), time: w.slice(11, 16) };
}
function bkkPartsToIso(date: string, time: string): string {
  if (!date) return "";
  const t = /^\d{1,2}:\d{2}$/.test(time) ? time.padStart(5, "0") : "00:00";
  return `${date}T${t}:00+07:00`;
}
/** Today's +07:00 wall-clock date (YYYY-MM-DD) — used so a time can be entered
 *  before a date is picked (otherwise `bkkPartsToIso` drops the time and the
 *  field appears frozen). */
function todayBkkDate(): string {
  return new Date(Date.now() + BKK_OFFSET_MS).toISOString().slice(0, 10);
}
/** Keep a time string as 24-hour HH:MM as the user types (digits only, auto colon). */
function normalizeTime24(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  let hh = digits.slice(0, 2);
  let mm = digits.slice(2);
  if (Number(hh) > 23) hh = "23";
  if (mm.length === 2 && Number(mm) > 59) mm = "59";
  return `${hh}:${mm}`;
}

/** 24-hour time input (text, HH:MM) — native time/datetime pickers can't be
 *  forced to 24h across browsers, so we use an explicit 24-hour field. */
function TimeField24({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Keep incomplete keystrokes local. Committing "1" or "19" to the parent
  // immediately makes bkkPartsToIso fall back to 00:00, which used to reset
  // the controlled input before the user could finish typing "19:30".
  const [draft, setDraft] = React.useState(value);
  const focused = React.useRef(false);

  React.useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  const isCompleteTime = (time: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);

  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        inputMode="numeric"
        value={draft}
        maxLength={5}
        placeholder="HH:MM (เช่น 19:30)"
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(e) => {
          const next = normalizeTime24(e.target.value);
          setDraft(next);
          if (isCompleteTime(next)) onChange(next);
        }}
        onBlur={() => {
          focused.current = false;
          if (isCompleteTime(draft)) {
            onChange(draft);
          } else if (draft === "") {
            onChange("");
          } else {
            setDraft(value);
          }
        }}
        className="w-full border border-edge bg-void/60 px-3 py-2 font-mono text-xs tabular-nums text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst"
      />
    </div>
  );
}

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
  const isLive = m.status === "live";
  // +07:00 wall-clock date/time parts for the headline fixture's editors.
  const bkk = isoToBkkParts(m.date);

  // Append the current finished headline fixture to the real matches list so it
  // shows normally on Home "Recent Results" + /matches (grouped in its tournament,
  // W/L colour, VOD slot). Returns true on success. Shared by "advance to next"
  // and the always-available "record this result" button.
  const appendFinishedToMatches = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/data?file=matches");
      const matchesData = (await res.json()) as {
        matches?: Match[];
        tournaments?: Tournament[];
      } & Record<string, unknown>;
      const matchDate = isoToBkkParts(m.date).date;
      const finishedMatch: Match = {
        id: `m-${Date.now().toString(36)}`,
        date: matchDate,
        game: m.game,
        tournament: m.tournament,
        round: m.round ?? { en: "", lo: "" },
        bo: m.bo,
        opponent: m.opponent || "",
        opponentLogo: m.opponentLogo,
        opponentAbbr: m.opponentAbbr,
        score: m.score || "",
        result: m.result ?? "win",
        vod: null,
        vods: [],
      };

      // Make sure the finished match groups under its tournament in the admin
      // Records view instead of falling into "Unassigned": that grouping is
      // driven by the `tournaments` metadata rows (game + name). If none matches
      // this fixture's tournament yet, create one and prepend it so the group
      // shows at the very top with the match inside it.
      const norm = (s?: string) => (s ?? "").trim().toLowerCase();
      const tEn = norm(m.tournament?.en);
      const tLo = norm(m.tournament?.lo);
      const hasName = Boolean(tEn || tLo);
      const existingTournaments = Array.isArray(matchesData.tournaments) ? matchesData.tournaments : [];
      const tournamentExists = existingTournaments.some((t) => {
        if (t.game !== m.game) return false;
        const nEn = norm(t.name?.en);
        const nLo = norm(t.name?.lo);
        return Boolean((tEn && nEn && tEn === nEn) || (tLo && nLo && tLo === nLo));
      });
      const nextTournaments =
        hasName && !tournamentExists
          ? [
              {
                id: `t-${Date.now().toString(36)}`,
                name: { en: m.tournament?.en ?? "", lo: m.tournament?.lo ?? "" },
                game: m.game,
                placement: { en: "", lo: "" },
                prize: "",
                season: matchDate.slice(0, 4) || String(new Date().getFullYear()),
              } as Tournament,
              ...existingTournaments,
            ]
          : existingTournaments;

      const put = await fetch("/api/admin/data?file=matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...matchesData,
          tournaments: nextTournaments,
          matches: [finishedMatch, ...(matchesData.matches ?? [])],
        }),
      });
      if (!put.ok) throw new Error();
      return true;
    } catch {
      window.alert("เพิ่มผลแมตช์เข้าหน้า Match ไม่สำเร็จ — ลองใหม่ หรือเพิ่มเองในเมนู Matches");
      return false;
    }
  };

  // Record the just-finished result to /matches, then clear the headline card
  // back to a blank "next" fixture. Keep the result for the admin workflow,
  // but do not render it in the public schedule popup. This works even with NO
  // next match queued — this is how the LAST match of the day gets onto
  // /matches without needing a schedule row to advance into.
  const finishToMatches = async () => {
    if (m.status !== "finished") return;
    if (!window.confirm(`บันทึกผล ${m.opponent || "แมตช์นี้"} (${m.score || "—"}) ลงหน้า Match แล้วเคลียร์การ์ด?`)) return;
    if (!(await appendFinishedToMatches())) return;
    setData({
      ...data,
      lastResult: { ...m, status: "finished" as const },
      upcomingMatch: {
        status: "next",
        date: "",
        game: m.game,
        tournament: { en: "", lo: "" },
        round: { en: "", lo: "" },
        bo: undefined,
        opponent: "",
        opponentAbbr: undefined,
        opponentLogo: undefined,
        hasLive: false,
        streamUrl: undefined,
        result: undefined,
        score: undefined,
      },
    });
  };

  // One-tap advance: pull the first schedule row up into the headline card
  // (recording the current finished result first) and drop it from the queue.
  const nextEntry = matchSchedule.entries[0];
  const promoteNext = async () => {
    if (!nextEntry) return;
    if (!window.confirm(`ดึงแมตช์ถัดไป (${nextEntry.opponent || "TBA"}) ขึ้นมาแสดงแทนการ์ดปัจจุบัน?`)) return;
    if (m.status === "finished" && !(await appendFinishedToMatches())) return;

    const iso = nextEntry.time
      ? `${nextEntry.date}T${nextEntry.time}:00+07:00`
      : nextEntry.date || "";
    const lastResult = m.status === "finished" ? { ...m, status: "finished" as const } : data.lastResult;
    setData({
      ...data,
      lastResult,
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
        hint="การ์ดที่โชว์เด่นหน้าแรก — เลือกสถานะก่อน แล้วกรอกเฉพาะกล่องที่ขึ้นให้"
      >
        {/* 1) STATUS — pick first, big touch targets */}
        <Card className="space-y-4">
          <div>
            <Label>1. สถานะการ์ด (เลือกก่อน)</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUS_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patch({ status: opt.value as UpcomingMatch["status"] })}
                  className={statusBtnClass(m.status === opt.value, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* live preview line */}
          <div className="flex items-center gap-3 border-t border-edge pt-4">
            <OpponentLogo src="/logo.png" name="NM" size={32} />
            <span className="font-mono text-xs text-ash-dim">vs</span>
            <OpponentLogo src={m.opponentLogo} name={m.opponent || "?"} abbr={m.opponentAbbr} size={32} />
            <span className="font-mono text-xs text-spectre">
              {m.opponent || (isPractice ? "ซ้อมทีม" : "—")}
            </span>
          </div>
        </Card>

        {/* 2) LIVE score — only while a match is in progress (used often on match day) */}
        {isLive && (
          <Card className="mt-4 space-y-3 border-loss/50 bg-loss/[0.06]">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-loss">
              🔴 สกอร์สด (กำลังแข่ง)
            </h3>
            <div className="max-w-[200px]">
              <TextField
                label="สกอร์ตอนนี้ (เช่น 1-0)"
                value={m.score ?? ""}
                onChange={(v) => patch({ score: v || undefined })}
                placeholder="1-0"
              />
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-ash">
              กรอกสกอร์แล้วกด <span className="text-soul">“บันทึกการเปลี่ยนแปลง”</span> (ปุ่มบนสุด) —
              การ์ดหน้าแรกจะ<span className="text-win">โชว์สกอร์สดให้แฟนๆเห็นทันที ไม่ต้องรอจบแมตช์</span>
              (หน้าที่เปิดค้างไว้อัปเดตเองทุก ~25 วินาที). กรอกสกอร์ใหม่แล้วบันทึกได้เรื่อยๆ ระหว่างแข่ง.
            </p>
          </Card>
        )}

        {/* 3) RESULT + actions — only when finished (record to /matches, advance) */}
        {isFinished && (
          <Card className="mt-4 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
              🏁 ผลการแข่งขัน (จบแล้ว)
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField
                label="ผล"
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
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={finishToMatches}>
                ✅ บันทึกผลลงหน้า Match
              </Button>
              {nextEntry && (
                <Button variant="ghost" onClick={promoteNext}>
                  ⬇ บันทึกผล + ดึงแมตช์ถัดไปขึ้น
                </Button>
              )}
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-ash">
              <span className="text-soul">“บันทึกผลลงหน้า Match”</span> ใช้ได้เสมอ (แม้ไม่มีคู่ถัดไป) —
              ผลจะไปโผล่ในหน้า Match + Recent Results แล้วเคลียร์การ์ดให้พร้อมตั้งแมตช์ใหม่.
              {nextEntry
                ? " เพราะมีคู่ถัดไปในตารางคิว ปุ่มที่สองจะบันทึกผล + ดึงคู่ถัดไปขึ้นให้ในคลิกเดียว."
                : " จบวันแข่งก็ใช้ปุ่มนี้ดึงทีมสุดท้ายลงหน้า Match ได้เลย."}
            </p>
          </Card>
        )}

        {/* 4) คู่แข่ง */}
        <Card className="mt-4 space-y-3">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
            👥 คู่แข่ง
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              label={isPractice ? "ทีมที่ซ้อมด้วย (เว้นว่างได้)" : "ทีมคู่แข่ง"}
              value={m.opponent}
              onChange={(v) => patch({ opponent: v })}
              placeholder="เช่น Vientiane Vipers"
            />
            <TextField
              label="ชื่อย่อคู่แข่ง (สูงสุด 4 ตัว — โชว์เมื่อไม่มีโลโก้)"
              value={m.opponentAbbr ?? ""}
              onChange={(v) =>
                patch({ opponentAbbr: v.trim() ? v.trim().slice(0, 4).toUpperCase() : undefined })
              }
              placeholder="VVP"
            />
          </div>
          <ImageField
            label="โลโก้คู่แข่ง (เว้นว่างได้)"
            value={m.opponentLogo}
            folder="teams"
            onChange={(p) => patch({ opponentLogo: p || undefined })}
          />
          <p className="font-mono text-[11px] leading-relaxed text-ash">
            🇲🇳 ระบบใส่<span className="text-soul">ธงชาติให้อัตโนมัติ</span>จากชื่อทีม (ถ้ารู้จัก) — ไม่ต้องทำเอง
          </p>
          {isPractice && (
            <p className="font-mono text-[11px] leading-relaxed text-ash">
              โหมด “ช่วงซ้อมทีม”: ถ้าเว้นชื่อทีมคู่แข่งไว้ การ์ดจะโชว์เป็น “TEAM PRACTICE” แทนการ vs ทีมอื่น
            </p>
          )}
        </Card>

        {/* 5) งาน / รอบ */}
        <Card className="mt-4 space-y-3">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
            🏆 งาน / รอบ
          </h3>
          <SelectField
            label="เกม"
            value={m.game}
            onChange={(v) => patch({ game: v as UpcomingMatch["game"] })}
            options={GAME_OPTS}
          />
          <BilingualField
            label="งาน / ทัวร์นาเมนต์"
            value={m.tournament}
            onChange={(v) => patch({ tournament: v })}
          />
          <BilingualField
            label="รอบการแข่งขัน (เช่น รอบรองชนะเลิศ — เว้นว่างได้)"
            value={m.round ?? { en: "", lo: "" }}
            onChange={(v) => patch({ round: v })}
          />
          <SelectField
            label="รูปแบบ Best-of (BO) — เว้นว่างได้"
            value={m.bo ?? ""}
            onChange={(v) => patch({ bo: v || undefined })}
            options={BO_SELECT_OPTIONS}
          />
        </Card>

        {/* 6) วัน–เวลา */}
        <Card className="mt-4 space-y-3">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
            📅 วัน–เวลาแข่ง <span className="text-ash">(เวลาลาว/ไทย +07:00)</span>
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              label="วันที่แข่ง"
              type="date"
              value={bkk.date}
              onChange={(v) => patch({ date: bkkPartsToIso(v, bkk.time) })}
            />
            <TimeField24
              label="เวลาแข่ง (24 ชม.)"
              value={bkk.time}
              onChange={(t) => patch({ date: bkkPartsToIso(bkk.date || todayBkkDate(), t) })}
            />
          </div>
        </Card>

        {/* 7) ถ่ายทอดสด (used often) */}
        <Card className="mt-4 space-y-2">
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
        </Card>

        {/* 8) ตารางคิวแมตช์ถัดไป (popup) */}
        <Card className="mt-4 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-spectre">
                🗓️ ตารางคิวแมตช์ถัดไป (Popup)
              </h3>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-ash">
                เพิ่มคิวแมตช์ล่วงหน้าไว้ที่นี่ — พอแมตช์ปัจจุบัน “จบแล้ว” ปุ่ม “ดึงแมตช์ถัดไป” ในกล่องผล (ด้านบน) จะดึงแถวแรกขึ้นการ์ดหน้าแรกให้อัตโนมัติ
              </p>
            </div>
            <Button
              onClick={() => patchMatchSchedule({ enabled: !matchSchedule.enabled })}
              variant={matchSchedule.enabled ? "primary" : "ghost"}
            >
              {matchSchedule.enabled ? "เปิด Popup อยู่" : "ปิด Popup อยู่"}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <BilingualField
              label="ข้อความปุ่มเปิด popup"
              value={matchSchedule.buttonLabel}
              onChange={(buttonLabel) => patchMatchSchedule({ buttonLabel })}
            />
            <BilingualField
              label="หัวข้อ popup"
              value={matchSchedule.title}
              onChange={(title) => patchMatchSchedule({ title })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => patchMatchSchedule({ enabled: true, entries: [...matchSchedule.entries, newScheduleEntry()] })}>
              + เพิ่มแถวคิว
            </Button>
            {data.lastResult && (
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm("ล้างข้อมูลผลล่าสุดที่ระบบเก็บไว้?")) {
                    setData({ ...data, lastResult: undefined });
                  }
                }}
              >
                ล้างผลล่าสุด
              </Button>
            )}
          </div>
          {data.lastResult && (
            <p className="font-mono text-[11px] leading-relaxed text-win">
              ผลล่าสุดที่ระบบเก็บไว้: <span className="keep-latin text-soul">NIIGHTMARE {data.lastResult.score || ""} {data.lastResult.opponent || ""}</span> ({STATUS_TH.finished}) — ไม่แสดงใน View Schedule
            </p>
          )}

          <div className="space-y-3">
            {matchSchedule.entries.length === 0 && (
              <p className="border border-edge bg-void/50 p-4 font-mono text-[11px] text-ash">
                ยังไม่มีคิวแมตช์ — กด “+ เพิ่มแถวคิว”
              </p>
            )}
            {matchSchedule.entries.map((entry, index) => (
              <div key={entry.id} className="border border-edge bg-void/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-spectre">
                    คิวที่ {index + 1}
                  </span>
                  <Button
                    variant="danger"
                    onClick={() =>
                      patchMatchSchedule({ entries: matchSchedule.entries.filter((item) => item.id !== entry.id) })
                    }
                  >
                    ลบ
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField
                    label="ทีมคู่แข่ง"
                    value={entry.opponent}
                    onChange={(opponent) => patchScheduleEntry(entry.id, { opponent })}
                  />
                  <BilingualField
                    label="รอบ"
                    value={entry.round}
                    onChange={(round) => patchScheduleEntry(entry.id, { round })}
                  />
                  <TextField
                    label="วันที่"
                    type="date"
                    value={entry.date}
                    onChange={(date) => patchScheduleEntry(entry.id, { date })}
                  />
                  <TimeField24
                    label="เวลา (24 ชม.)"
                    value={entry.time}
                    onChange={(time) => patchScheduleEntry(entry.id, { time })}
                  />
                  <SelectField
                    label="รูปแบบ Best-of (BO)"
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
                    label="ชื่อย่อคู่แข่ง (สูงสุด 4 ตัว)"
                    value={entry.opponentAbbr ?? ""}
                    onChange={(v) =>
                      patchScheduleEntry(entry.id, {
                        opponentAbbr: v.trim() ? v.trim().slice(0, 4).toUpperCase() : undefined,
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

    </div>
  );
}
