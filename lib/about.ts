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
  secondaryCta: AboutCta;
}

/** Shipped defaults — the band renders fully even before anything is saved in
 *  the admin. */
export const DEFAULT_ABOUT: AboutUsContent = {
  kicker: { en: "WHO WE ARE", lo: "ພວກເຮົາແມ່ນໃຜ" },
  headLine1: { en: "THE LIGHTS GO OUT WHEN WE DRAFT.", lo: "ໄຟມືດລົງ ເມື່ອພວກເຮົາລັອກໂຕ." },
  headPre: { en: "AND THE ", lo: "ແລ້ວ " },
  headAccent: { en: "NIGHTMARE", lo: "ຝັນຮ້າຍ" },
  headPost: { en: " BEGINS.", lo: " ກໍເລີ່ມຂຶ້ນ." },
  body1: {
    en: "Born in the dark of Vientiane, NIIGHTMARE was never built to take part — we were built to be remembered. Twice we carried a nation onto the Mobile Legends world stage, and twice the world learned our name the hard way. We arrive in silence. We leave a legend.",
    lo: "ເກີດໃນຄວາມມືດຂອງນະຄອນຫຼວງວຽງຈັນ — NIIGHTMARE ບໍ່ເຄີຍຖືກສ້າງມາເພື່ອພຽງເຂົ້າຮ່ວມ ແຕ່ສ້າງມາເພື່ອໃຫ້ໂລກຈົດຈໍາ. ສອງເທື່ອທີ່ພວກເຮົາແບກທັງຊາດຂຶ້ນສູ່ເວທີໂລກ Mobile Legends ແລະ ສອງເທື່ອທີ່ໂລກໄດ້ຮຽນຮູ້ຊື່ຂອງພວກເຮົາ. ພວກເຮົາມາຢ່າງງຽບ ແລະ ຈາກໄປຢ່າງເປັນຕໍານານ.",
  },
  body2: {
    en: "Three national crowns. Five seasons of dread. The draft is where hope comes to die — and the moment our banner locks in, the only question left on the server is whose run ends tonight.",
    lo: "ສາມມຸງກຸດລະດັບຊາດ. ຫ້າລະດູການແຫ່ງຄວາມຢ້ານກົວ. ບ່ອນເລືອກໂຕຄືບ່ອນທີ່ຄວາມຫວັງມາຕາຍ — ແລະ ໃນວິນາທີທີ່ປ້າຍຂອງພວກເຮົາລັອກລົງ ຄໍາຖາມດຽວທີ່ເຫຼືອໃນເຊີເວີ ກໍຄື ການເດີນທາງຂອງໃຜຈະຈົບໃນຄືນນີ້.",
  },
  primaryCta: { label: { en: "THE FULL RECORD", lo: "ບັນທຶກທັງໝົດ" }, href: "/achievements" },
  secondaryCta: { label: { en: "MEET THE ROSTER", lo: "ຮູ້ຈັກລາຍຊື່ທີມ" }, href: "/roster" },
};

/** Merge saved (partial) About Us copy over the defaults so a missing or
 *  partial site.aboutUs still renders cleanly. */
export function resolveAbout(raw?: Partial<AboutUsContent> | null): AboutUsContent {
  return {
    ...DEFAULT_ABOUT,
    ...(raw ?? {}),
    primaryCta: { ...DEFAULT_ABOUT.primaryCta, ...(raw?.primaryCta ?? {}) },
    secondaryCta: { ...DEFAULT_ABOUT.secondaryCta, ...(raw?.secondaryCta ?? {}) },
  };
}
