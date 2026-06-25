import type { Bilingual } from "@/lib/types";

/**
 * NIIGHTMARE's competitive "Esports Roadmap" — the four stages a Lao MLBB team
 * climbs each season, shown as a live status timeline on the Achievements page.
 * Static content (not admin-editable): update `status`/`note` here + redeploy as
 * the season progresses. Rendered by components/sections/RoadmapTimeline.tsx.
 */

/** Visual tier of a stage — drives the small tier tag colour. */
export type RoadmapTier = "qualifier" | "regional" | "global" | "worlds";

/** Where the team currently stands on each stage. */
export type RoadmapStatus =
  | "done" // cleared / passed
  | "active" // competing right now
  | "eliminated" // knocked out here
  | "upcoming" // qualified / waiting — the next stop
  | "locked"; // not reached yet

export interface RoadmapStep {
  /** Two-digit phase index. */
  phase: string;
  /** Punchy stage title. */
  title: Bilingual;
  /** Formal competition / system name. */
  system: Bilingual;
  /** One- or two-sentence description. */
  detail: Bilingual;
  /** Liquipedia-style tier tag (e.g. "C-Tier · Qualifiers"). */
  tierTag: Bilingual;
  tier: RoadmapTier;
  /** Live progress state for this stage. */
  status: RoadmapStatus;
  /** Optional context line shown under the active/upcoming stage. */
  note?: Bilingual;
}

/** Headline summary of where the club stands right now (top banner). */
export const ROADMAP_NOW = {
  kicker: { en: "WHERE WE STAND", lo: "ສະຖານະປະຈຸບັນ" } as Bilingual,
  headline: {
    en: "MEKONG CHAMPIONS · EYES ON RIYADH",
    lo: "ແຊมป์ແມ່ໂຂງ · ມຸ່ງສູ່ຣິຢາด",
  } as Bilingual,
  blurb: {
    en: "NIIGHTMARE cleared the regional gauntlet. Next stop: the global stage.",
    lo: "NIIGHTMARE ຜ່ານດ່ານພາກພື້ນແລ້ວ. ປ້າຍຕໍ່ໄປ: ເວທີລະດັບໂລກ.",
  } as Bilingual,
  state: { en: "UP NEXT · MSC 2026", lo: "ຮອບຕໍ່ໄປ · MSC 2026" } as Bilingual,
};

export const ROADMAP_STEPS: RoadmapStep[] = [
  {
    phase: "01",
    title: { en: "Claim the Homeland", lo: "ຄອງບັນລັງລະດັບຊາດ" },
    system: { en: "National Selection — Laos", lo: "ຄັດເລືອກລະດັບຊາດ — ລາວ" },
    detail: {
      en: "Battle through Laos' domestic qualifiers to seize the nation's official representative slot.",
      lo: "ຟັນຝ່າຮອບຄັດເລືອກພາຍໃນປະເທດລາວ ເພື່ອຄວ້າສິດເປັນຕົວແທນຢ່າງເປັນທາງການ.",
    },
    tierTag: { en: "C-Tier · Qualifiers", lo: "C-Tier · ຮອບຄັດເລືອກ" },
    tier: "qualifier",
    status: "done",
  },
  {
    phase: "02",
    title: { en: "Storm the Mekong", lo: "ບຸກລະດັບແມ່ໂຂງ" },
    system: { en: "MCC Mekong — Regional League", lo: "MCC Mekong — ລີກພາກພື້ນ" },
    detail: {
      en: "Cross the border into the M Challenge Cup Mekong and clash with the best of Laos, Thailand and Vietnam for a ticket to the world stage.",
      lo: "ຂ້າມຊາຍແດນສູ່ສຶກ M Challenge Cup Mekong ປະທະກັບທີມຊັ້ນນຳຈາກ ລາວ, ໄທ ແລະ ຫວຽດນາມ ເພື່ອຄວ້າປີ້ສູ່ເວທີໂລກ.",
    },
    tierTag: { en: "B-Tier", lo: "B-Tier" },
    tier: "regional",
    status: "done",
    note: {
      en: "Champions — M Challenge Cup Mekong Season 7 (beat Wonderer Panda 4:1).",
      lo: "ແຊมป์ — M Challenge Cup Mekong Season 7 (ຊະນະ Wonderer Panda 4:1).",
    },
  },
  {
    phase: "03",
    title: { en: "Siege of Riyadh", lo: "ບຸກສຶກກາງປີ ຣິຢາດ" },
    system: { en: "Mid-Season Cup · Esports World Cup", lo: "Mid-Season Cup · Esports World Cup" },
    detail: {
      en: "Fly to Riyadh, Saudi Arabia for the Mid-Season Cup — a multi-million-dollar global battleground among the world's elite.",
      lo: "ບິນສູ່ນະຄອນຣິຢາດ ປະເທດຊາອຸດິອາຣະເບຍ ລົງຊິງໄຊໃນ Mid-Season Cup — ເວທີລະດັບໂລກ ຊິງເງິນລາງວັນຫຼາຍລ້ານໂດລາ.",
    },
    tierTag: { en: "S-Tier · Global", lo: "S-Tier · ລະດັບໂລກ" },
    tier: "global",
    status: "upcoming",
    note: {
      en: "Qualified via Mekong S7 — awaiting the MSC 2026 bracket.",
      lo: "ຜ່ານເຂົ້າຮອບຈາກ Mekong S7 — ກຳລັງລໍຖ້າ MSC 2026.",
    },
  },
  {
    phase: "04",
    title: { en: "Throne of the World", lo: "ບັນລັງສູງສຸດຂອງໂລກ" },
    system: { en: "M-Series World Championship", lo: "M-Series ຊິງແຊมป์ໂລກ" },
    detail: {
      en: "The year-end world championship — the highest throne in Mobile Legends, where a club carves its name into history and earns a world-championship skin.",
      lo: "ສຶກຊິງແຊมป์ໂລກ ທ້າຍປີ — ບັນລັງສູງສຸດຂອງ Mobile Legends ບ່ອນທີ່ສະໂມສອນຈະຈາລຶກຊື່ລົງປະຫວັດສາດ ແລະ ສ້າງສະກິນແຊมป์ໂລກປະຈຳສະໂມສອນ.",
    },
    tierTag: { en: "S-Tier · World Championship", lo: "S-Tier · ຊິງແຊมป์ໂລກ" },
    tier: "worlds",
    status: "locked",
  },
];
