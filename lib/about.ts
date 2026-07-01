import type { Bilingual } from "@/lib/types";

export interface AboutCta {
  label: Bilingual;
  href: string;
}

/** All editable copy for the home-page About Us band (stored under site.aboutUs). */
export interface AboutUsContent {
  kicker: Bilingual;
  /** Manifesto heading, kept in segments so the glowing accent word lands in the
   *  right place in both languages: line 1, then [pre][accent][post] on line 2. */
  headLine1: Bilingual;
  headPre: Bilingual;
  headAccent: Bilingual;
  headPost: Bilingual;
  body1: Bilingual;
  body2: Bilingual;
  primaryCta: AboutCta;
}

/** Shipped defaults — the band renders fully even before anything is saved in
 *  the admin. */
export const DEFAULT_ABOUT: AboutUsContent = {
  kicker: { en: "WHO WE ARE", lo: "ພວກເຮົາແມ່ນໃຜ" },
  headLine1: { en: "FORGED IN VIENTIANE, 2020.", lo: "ຫຼໍ່ຫຼອມຂຶ້ນທີ່ວຽງຈັນ ປີ 2020." },
  headPre: { en: "BUILT TO CARRY LAOS TO THE ", lo: "ສ້າງມາເພື່ອພາທຸງລາວສູ່ " },
  headAccent: { en: "WORLD STAGE", lo: "ເວທີໂລກ" },
  headPost: { en: "", lo: "" },
  body1: {
    en: "What began as a handful of players sharing one conviction — that Laos belongs on the Mobile Legends world stage — has grown into the team an entire nation now stands behind. NIIGHTMARE was founded to prove that talent forged far from the spotlight can rise to meet the very best.",
    lo: "ສິ່ງທີ່ເລີ່ມຕົ້ນຈາກນັກກິລາບໍ່ເທົ່າໃດຄົນ ທີ່ມີຄວາມເຊື່ອດຽວກັນ — ວ່າລາວສົມຄວນຢືນຢູ່ເທິງເວທີໂລກຂອງ Mobile Legends — ໄດ້ເຕີບໃຫຍ່ກາຍເປັນທີມທີ່ທັງຊາດຢືນຢູ່ເບື້ອງຫຼັງ. NIIGHTMARE ກໍ່ຕັ້ງຂຶ້ນເພື່ອພິສູດວ່າ ພອນສະຫວັນທີ່ບົ່ມຂຶ້ນໄກຈາກແສງໄຟ ກໍສາມາດກ້າວຂຶ້ນທຽບເທົ່າສຸດຍອດໄດ້.",
  },
  body2: {
    en: "We are driven by more than winning. Every scrim, every late night, every draft serves a single vision: to lift Lao esports to the summit and earn the world's respect along the way. Twice we have reached the global stage — and we carry that responsibility with discipline, pride, and a standard we refuse to lower.",
    lo: "ພວກເຮົາຖືກຂັບເຄື່ອນດ້ວຍສິ່ງທີ່ຫຼາຍກວ່າໄຊຊະນະ. ທຸກການຊ້ອມ, ທຸກຄືນທີ່ດຶກ, ທຸກການເລືອກໂຕ ລ້ວນຮັບໃຊ້ວິໄສທັດດຽວ: ຍົກວົງການ esports ລາວສູ່ຈຸດສູງສຸດ ແລະ ໄດ້ຮັບຄວາມເຄົາລົບຈາກໂລກໄປພ້ອມກັນ. ສອງເທື່ອແລ້ວທີ່ພວກເຮົາໄປເຖິງເວທີໂລກ — ແລະ ພວກເຮົາແບກຄວາມຮັບຜິດຊອບນັ້ນດ້ວຍລະບຽບວິໄນ, ຄວາມພູມໃຈ ແລະ ມາດຕະຖານທີ່ບໍ່ຍອມຫຼຸດລົງ.",
  },
  primaryCta: { label: { en: "THE FULL RECORD", lo: "ບັນທຶກທັງໝົດ" }, href: "/achievements" },
};

/** Merge saved (partial) About Us copy over the defaults so a missing or
 *  partial site.aboutUs still renders cleanly. */
export function resolveAbout(raw?: Partial<AboutUsContent> | null): AboutUsContent {
  return {
    ...DEFAULT_ABOUT,
    ...(raw ?? {}),
    primaryCta: { ...DEFAULT_ABOUT.primaryCta, ...(raw?.primaryCta ?? {}) },
  };
}
