import type { Bilingual } from "@/lib/types";

/** One credential row in the home-page "Club Dossier". `id` is fixed (it drives
 *  the row's icon); value/label/detail are admin-editable. */
export interface AboutDossierStat {
  id: string;
  value: string;
  label: Bilingual;
  detail: Bilingual;
}

export interface AboutCta {
  label: Bilingual;
  href: string;
}

/** All editable copy for the home-page About Us band (stored under site.aboutUs). */
export interface AboutUsContent {
  kicker: Bilingual;
  est: Bilingual;
  /** Manifesto heading, kept in segments so the glowing accent word lands in the
   *  right place in both languages: line 1, then [pre][accent][post] on line 2. */
  headLine1: Bilingual;
  headPre: Bilingual;
  headAccent: Bilingual;
  headPost: Bilingual;
  body1: Bilingual;
  body2: Bilingual;
  primaryCta: AboutCta;
  secondaryCta: AboutCta;
  dossierLabel: Bilingual;
  region: Bilingual;
  source: Bilingual;
  stats: AboutDossierStat[];
}

/** Shipped defaults — the band renders fully even before anything is saved in
 *  the admin. Stats mirror the figures on the Achievements page. */
export const DEFAULT_ABOUT: AboutUsContent = {
  kicker: { en: "WHO WE ARE", lo: "ພວກເຮົາແມ່ນໃຜ" },
  est: { en: "EST. 2020 · LAO PDR", lo: "ກໍ່ຕັ້ງ 2020 · ສປປ ລາວ" },
  headLine1: { en: "WE DON'T PLAY THE META.", lo: "ພວກເຮົາບໍ່ໄດ້ຫຼິ້ນຕາມເມຕ້າ" },
  headPre: { en: "WE ", lo: "ພວກເຮົາ" },
  headAccent: { en: "HAUNT", lo: "ຫຼອກຫຼອນ" },
  headPost: { en: " IT.", lo: "ມັນ" },
  body1: {
    en: "Forged in Vientiane in 2020, NIIGHTMARE climbed from Laos' grassroots scrims to the Mobile Legends world stage — twice. We carry a nation on our backs and a reaper's calm into every late game.",
    lo: "ກໍ່ຕັ້ງທີ່ນະຄອນຫຼວງວຽງຈັນ ປີ 2020 — NIIGHTMARE ກ້າວຈາກສະໜາມຊ້ອມພາຍໃນ ສູ່ເວທີໂລກ Mobile Legends ເຖິງສອງເທື່ອ. ພວກເຮົາແບກທຸງຊາດໄວ້ເທິງບ່າ ແລະ ນຳຄວາມສະຫງົບຂອງຍົມມະທູດ ເຂົ້າສູ່ທຸກເກມ.",
  },
  body2: {
    en: "Three national titles and five seasons deep, the banner still reads the same across the server: when the draft locks, someone's run is about to end.",
    lo: "ສາມແຊມป์ລະດັບຊາດ ແລະ ຫ້າລະດູການ ປ້າຍຍັງໝາຍຄວາມເຊັ່ນເດີມໃນທຸກເຊີເວີ: ເມື່ອລັອກໂຕລະຄອນ ການເດີນທາງຂອງຄູ່ແຂ່ງກໍໃກ້ຈົບ.",
  },
  primaryCta: { label: { en: "THE FULL RECORD", lo: "ບັນທຶກທັງໝົດ" }, href: "/achievements" },
  secondaryCta: { label: { en: "MEET THE ROSTER", lo: "ຮູ້ຈັກລາຍຊື່ທີມ" }, href: "/roster" },
  dossierLabel: { en: "CLUB DOSSIER", lo: "ແຟ້ມຂໍ້ມູນສະໂມສອນ" },
  region: { en: "LAO PDR", lo: "ສປປ ລາວ" },
  source: { en: "Record sourced from Liquipedia", lo: "ບັນທຶກອ້າງອີງຈາກ Liquipedia" },
  stats: [
    {
      id: "worlds",
      value: "2×",
      label: { en: "World Stage", lo: "ເວທີໂລກ" },
      detail: { en: "M5 & M6 Worlds", lo: "ເວທີໂລກ M5 & M6" },
    },
    {
      id: "titles",
      value: "3×",
      label: { en: "Championships", lo: "ແຊมป์" },
      detail: { en: "First-place titles", lo: "ຄອງອັນດັບ 1" },
    },
    {
      id: "winnings",
      value: "$84K",
      label: { en: "Career Winnings", lo: "ເງິນລາງວັນລວມ" },
      detail: { en: "Across 19 placements", lo: "ຈາກ 19 ລາຍການ" },
    },
    {
      id: "established",
      value: "2020",
      label: { en: "Established", lo: "ປີກໍ່ຕັ້ງ" },
      detail: { en: "Vientiane, Lao PDR", lo: "ວຽງຈັນ · ສປປ ລາວ" },
    },
  ],
};

/** Merge saved (partial) About Us copy over the defaults so a missing or
 *  partial site.aboutUs still renders cleanly. */
export function resolveAbout(raw?: Partial<AboutUsContent> | null): AboutUsContent {
  return {
    ...DEFAULT_ABOUT,
    ...(raw ?? {}),
    primaryCta: { ...DEFAULT_ABOUT.primaryCta, ...(raw?.primaryCta ?? {}) },
    secondaryCta: { ...DEFAULT_ABOUT.secondaryCta, ...(raw?.secondaryCta ?? {}) },
    stats: raw?.stats?.length ? raw.stats : DEFAULT_ABOUT.stats,
  };
}
