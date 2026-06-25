import type { Bilingual } from "@/lib/types";

/**
 * NIIGHTMARE's competitive "Esports Roadmap" — the four stages a Lao MLBB team
 * climbs each season, from the national qualifier to the world throne. Static,
 * aspirational content (not admin-editable); edit here + redeploy to change it.
 * Rendered by components/sections/RoadmapModal.tsx on the Achievements page.
 */

/** Visual tier of a stage — drives the badge / node colour in the modal. */
export type RoadmapTier = "qualifier" | "regional" | "global" | "worlds";

export interface RoadmapStep {
  /** Two-digit phase index shown on the spine. */
  phase: string;
  /** Punchy stage title. */
  title: Bilingual;
  /** Formal competition / system name. */
  system: Bilingual;
  /** One- or two-sentence description. */
  detail: Bilingual;
  /** Liquipedia-style tier tag (e.g. "C-Tier · Qualifiers"). */
  tierTag: Bilingual;
  /** Drives the colour treatment. */
  tier: RoadmapTier;
}

export const ROADMAP_INTRO = {
  kicker: { en: "THE ASCENT", lo: "ເສັ້ນທາງໄຕ່ເຕົ້າ" } as Bilingual,
  title: { en: "ESPORTS ROADMAP", lo: "ແຜນເສັ້ນທາງ Esports" } as Bilingual,
  blurb: {
    en: "Four stages stand between a Lao qualifier and the world throne — the road NIIGHTMARE walks every season.",
    lo: "ສີ່ດ່ານ ກັ້ນລະຫວ່າງຮອບຄັດເລືອກລາວ ກັບບັນລັງໂລກ — ເສັ້ນທາງທີ່ NIIGHTMARE ກ້າວທຸກລະດູການ.",
  } as Bilingual,
  cta: { en: "VIEW THE ROADMAP", lo: "ເບິ່ງແຜນເສັ້ນທາງ" } as Bilingual,
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
  },
];
