import type { Bilingual } from "@/lib/types";

/**
 * NIIGHTMARE's competitive "Esports Roadmap" — the real MLBB 2026 season path a
 * Lao team climbs, with each stop's Liquipedia tier and the club's live status.
 * Static content (not admin-editable): update `status`/`note` here + redeploy as
 * the season moves. Rendered by components/sections/RoadmapTimeline.tsx.
 *
 * Sources: Liquipedia (MSC 2026 = S-Tier, Paris, $3,000,000; Niightmare listed
 * as a wildcard team via M Challenge Cup Mekong S7), Esports Charts 2026 calendar.
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

export interface RoadmapStep {
  phase: string;
  /** Real tournament name — the prominent line. */
  tournament: Bilingual;
  /** Its role in the season path (e.g. "Regional League"). */
  stage: Bilingual;
  /** Liquipedia tier. */
  tier: RoadmapTier;
  /** When it runs (kept latin). */
  window: string;
  /** Host / region. */
  location: Bilingual;
  /** Prize pool, if notable (kept latin). */
  prize?: string;
  detail: Bilingual;
  status: RoadmapStatus;
  /** Context line under the cleared/next stop. */
  note?: Bilingual;
  /** The pinnacle — gets the apex (crown) treatment. */
  apex?: boolean;
}

/** Headline summary of where the club stands right now (top banner). */
export const ROADMAP_NOW = {
  kicker: { en: "WHERE WE STAND", lo: "ສະຖານະປະຈຸບັນ" } as Bilingual,
  headline: {
    en: "MEKONG CHAMPIONS · BOUND FOR PARIS",
    lo: "ແຊมป์ແມ່ໂຂງ · ມຸ່ງສູ່ປາຣີ",
  } as Bilingual,
  blurb: {
    en: "NIIGHTMARE cleared the regional path. Next: the $3,000,000 Mid-Season Cup world stage.",
    lo: "NIIGHTMARE ຜ່ານເສັ້ນທາງພາກພື້ນແລ້ວ. ຕໍ່ໄປ: ເວທີໂລກ Mid-Season Cup ເງິນລາງວັນ 3 ລ້ານໂດລາ.",
  } as Bilingual,
  state: { en: "UP NEXT · MSC 2026", lo: "ຮອບຕໍ່ໄປ · MSC 2026" } as Bilingual,
};

export const ROADMAP_STEPS: RoadmapStep[] = [
  {
    phase: "01",
    tournament: { en: "Lao National Championship", lo: "ການແຂ່ງຂັນລະດັບຊາດ ລາວ" },
    stage: { en: "National Qualifier", lo: "ຄັດເລືອກລະດັບຊາດ" },
    tier: "C",
    window: "Domestic Season",
    location: { en: "Laos", lo: "ລາວ" },
    detail: {
      en: "Battle through Laos' domestic season to be crowned the nation's official MLBB representative.",
      lo: "ຟັນຝ່າລະດູການພາຍໃນ ເພື່ອຄອງຕຳແໜ່ງຕົວແທນ MLBB ຂອງຊາດ.",
    },
    status: "done",
  },
  {
    phase: "02",
    tournament: { en: "M Challenge Cup Mekong", lo: "M Challenge Cup Mekong" },
    stage: { en: "Regional League · Mekong", lo: "ລີກພາກພື້ນ · ແມ່ໂຂງ" },
    tier: "B",
    window: "Feb – Jun 2026",
    location: { en: "Mekong · LA / TH / VN", lo: "ແມ່ໂຂງ · ລາວ / ໄທ / ຫວຽດນາມ" },
    detail: {
      en: "A cross-border regional league against the best of Laos, Thailand and Vietnam — the gateway to the world stage.",
      lo: "ລີກພາກພື້ນຂ້າມຊາຍແດນ ປະທະທີມຊັ້ນນຳ ລາວ ໄທ ຫວຽດນາມ — ປະຕູສູ່ເວທີໂລກ.",
    },
    status: "done",
    note: {
      en: "Season 7 Champions — beat Wonderer Panda 4:1 to seize the MSC wildcard.",
      lo: "ແຊมป์ Season 7 — ຊະນະ Wonderer Panda 4:1 ຄວ້າສິດ wildcard MSC.",
    },
  },
  {
    phase: "03",
    tournament: { en: "MLBB Mid-Season Cup 2026", lo: "MLBB Mid-Season Cup 2026" },
    stage: { en: "World Stage · MSC", lo: "ເວທີໂລກ · MSC" },
    tier: "S",
    window: "Jul 1 – Aug 1, 2026",
    location: { en: "Paris, France", lo: "ປາຣີ, ປະເທດຝຣັ່ງ" },
    prize: "$3,000,000",
    detail: {
      en: "The $3M Mid-Season Cup — a global S-Tier battlefield flown under the Esports World Cup banner.",
      lo: "Mid-Season Cup ເງິນລາງວັນ 3 ລ້ານໂດລາ — ສະໜາມ S-Tier ລະດັບໂລກ ພາຍໃຕ້ Esports World Cup.",
    },
    status: "upcoming",
    note: {
      en: "Qualified as Mekong S7 champions — wildcard opens July 1 in Paris.",
      lo: "ຜ່ານເຂົ້າຮອບໃນຖານະແຊมป์ Mekong S7 — wildcard ເລີ່ມ 1 ກໍລະກົດ ທີ່ປາຣີ.",
    },
  },
  {
    phase: "04",
    tournament: { en: "M8 World Championship", lo: "M8 ຊິງແຊมป์ໂລກ" },
    stage: { en: "World Championship", lo: "ຊິງແຊมป์ໂລກ" },
    tier: "S",
    window: "Dec 2026 – Jan 2027",
    location: { en: "To be announced", lo: "ລໍຖ້າປະກາດ" },
    detail: {
      en: "The year-end world championship — the highest throne in Mobile Legends, and the name NIIGHTMARE is chasing.",
      lo: "ສຶກຊິງແຊมป์ໂລກທ້າຍປີ — ບັນລັງສູງສຸດຂອງ Mobile Legends ແລະ ເປົ້າໝາຍສູງສຸດຂອງ NIIGHTMARE.",
    },
    status: "locked",
    apex: true,
  },
];
