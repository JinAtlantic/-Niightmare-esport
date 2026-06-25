import type { Bilingual } from "@/lib/types";

/**
 * NIIGHTMARE's competitive "Esports Roadmap" — the MLBB season path shown as a
 * live status timeline on the Matches page. Admin-editable via site.roadmap
 * (HomeEditor → Roadmap), stored in Supabase site_settings.roadmap; these are
 * the shipped defaults. Rendered by components/sections/RoadmapTimeline.tsx.
 */

/** Liquipedia tournament tier. */
export type RoadmapTier = "C" | "B" | "A" | "S";

/** Where the team currently stands on each stop. */
export type RoadmapStatus =
  | "done" // cleared / passed
  | "active" // competing right now
  | "eliminated" // knocked out here
  | "upcoming" // qualified / waiting — the next stop
  | "locked"; // not reached yet

/** A sub-event within a stop (e.g. Wildcard → Group Stage → Knockout). */
export interface RoadmapSubStage {
  label: Bilingual;
  /** When it runs (kept latin), optional. */
  window?: string;
  status: RoadmapStatus;
}

export interface RoadmapStep {
  /** Real tournament name — the prominent line. */
  tournament: Bilingual;
  /** Its role in the season path (e.g. "Regional League"). */
  stage: Bilingual;
  tier: RoadmapTier;
  /** When it runs (kept latin). */
  window: string;
  /** Host / region. */
  location: Bilingual;
  /** Prize pool, if notable (kept latin). */
  prize?: string;
  status: RoadmapStatus;
  /** Context line under the cleared/next stop. */
  note?: Bilingual;
  /** Sub-events to clear before the next stop (Wildcard, Groups, etc.). */
  subStages?: RoadmapSubStage[];
  /** The pinnacle — gets the apex (crown) treatment. */
  apex?: boolean;
}

export interface RoadmapNow {
  kicker: Bilingual;
  headline: Bilingual;
  blurb: Bilingual;
  state: Bilingual;
}

export interface RoadmapContent {
  now: RoadmapNow;
  steps: RoadmapStep[];
}

export const DEFAULT_ROADMAP: RoadmapContent = {
  now: {
    kicker: { en: "WHERE WE STAND", lo: "ສະຖານະປະຈຸບັນ" },
    headline: { en: "MEKONG CHAMPIONS · BOUND FOR PARIS", lo: "ແຊมป์ແມ່ໂຂງ · ມຸ່ງສູ່ປາຣີ" },
    blurb: {
      en: "NIIGHTMARE cleared the regional path. Next: the $3,000,000 Mid-Season Cup world stage.",
      lo: "NIIGHTMARE ຜ່ານເສັ້ນທາງພາກພື້ນແລ້ວ. ຕໍ່ໄປ: ເວທີໂລກ Mid-Season Cup ເງິນລາງວັນ 3 ລ້ານໂດລາ.",
    },
    state: { en: "UP NEXT · MSC 2026", lo: "ຮອບຕໍ່ໄປ · MSC 2026" },
  },
  steps: [
    {
      tournament: { en: "Lao National Championship", lo: "ການແຂ່ງຂັນລະດັບຊາດ ລາວ" },
      stage: { en: "National Qualifier", lo: "ຄັດເລືອກລະດັບຊາດ" },
      tier: "C",
      window: "Domestic Season",
      location: { en: "Laos", lo: "ລາວ" },
      status: "done",
    },
    {
      tournament: { en: "M Challenge Cup Mekong", lo: "M Challenge Cup Mekong" },
      stage: { en: "Regional League · Mekong", lo: "ລີກພາກພື້ນ · ແມ່ໂຂງ" },
      tier: "B",
      window: "Feb – Jun 2026",
      location: { en: "Mekong · LA / TH / VN", lo: "ແມ່ໂຂງ · ລາວ / ໄທ / ຫວຽດນາມ" },
      status: "done",
      note: {
        en: "Season 7 Champions — beat Wonderer Panda 4:1 to seize the MSC wildcard.",
        lo: "ແຊมป์ Season 7 — ຊະນະ Wonderer Panda 4:1 ຄວ້າສິດ wildcard MSC.",
      },
      subStages: [
        { label: { en: "Laos Qualifier", lo: "ຮອບຄັດເລືອກ ລາວ" }, window: "May 2026", status: "done" },
        { label: { en: "Playoffs", lo: "ຮອບ Playoff" }, window: "Jun 2026", status: "done" },
      ],
    },
    {
      tournament: { en: "MLBB Mid-Season Cup 2026", lo: "MLBB Mid-Season Cup 2026" },
      stage: { en: "World Stage · MSC", lo: "ເວທີໂລກ · MSC" },
      tier: "S",
      window: "Jul 1 – Aug 1, 2026",
      location: { en: "Paris, France", lo: "ປາຣີ, ປະເທດຝຣັ່ງ" },
      prize: "$3,000,000",
      status: "upcoming",
      note: {
        en: "Qualified as Mekong S7 champions — wildcard opens July 1 in Paris.",
        lo: "ຜ່ານເຂົ້າຮອບໃນຖານະແຊมป์ Mekong S7 — wildcard ເລີ່ມ 1 ກໍລະກົດ ທີ່ປາຣີ.",
      },
      subStages: [
        { label: { en: "Wildcard", lo: "ຮອບ Wildcard" }, window: "Jul 1 – 4", status: "upcoming" },
        { label: { en: "Group Stage", lo: "ຮອບແບ່ງກຸ່ມ" }, window: "Jul 22 – 26", status: "locked" },
        { label: { en: "Knockout Stage", lo: "ຮອບ Knockout" }, window: "Jul 29 – Aug 1", status: "locked" },
      ],
    },
    {
      tournament: { en: "M8 World Championship", lo: "M8 ຊິງແຊมป์ໂລກ" },
      stage: { en: "World Championship", lo: "ຊິງແຊมป์ໂລກ" },
      tier: "S",
      window: "Dec 2026 – Jan 2027",
      location: { en: "To be announced", lo: "ລໍຖ້າປະກາດ" },
      status: "locked",
      apex: true,
    },
  ],
};

/** Merge saved (partial) roadmap over the defaults so a missing/partial
 *  site.roadmap still renders cleanly. */
export function resolveRoadmap(raw?: Partial<RoadmapContent> | null): RoadmapContent {
  return {
    now: { ...DEFAULT_ROADMAP.now, ...(raw?.now ?? {}) },
    steps: raw?.steps?.length ? raw.steps : DEFAULT_ROADMAP.steps,
  };
}
