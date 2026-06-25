import type { Bilingual } from "@/lib/types";

/**
 * Educational MLBB competition explainer shown from the Matches page.
 * Admin-editable via site.mlbbEsportSystem, stored in site_settings.mlbb_esport_system.
 */

export type MlbbSystemPillarAccent = "national" | "mekong" | "global";

export interface MlbbSystemPillar {
  eyebrow: Bilingual;
  title: Bilingual;
  subtitle: Bilingual;
  body: Bilingual;
  details: Bilingual[];
  accent: MlbbSystemPillarAccent;
}

export interface MlbbSystemCalendarStep {
  quarter: string;
  window: Bilingual;
  title: Bilingual;
  body: Bilingual;
  tags: Bilingual[];
}

export interface MlbbEsportSystemContent {
  buttonLabel: Bilingual;
  hero: {
    kicker: Bilingual;
    title: Bilingual;
    intro: Bilingual;
    badge: Bilingual;
  };
  tabs: {
    pillars: Bilingual;
    calendar: Bilingual;
  };
  pillars: MlbbSystemPillar[];
  calendar: MlbbSystemCalendarStep[];
  sponsorNote: Bilingual;
}

export const DEFAULT_MLBB_ESPORT_SYSTEM: MlbbEsportSystemContent = {
  buttonLabel: { en: "MLBB Esport System", lo: "ລະບົບ MLBB Esport" },
  hero: {
    kicker: { en: "Road to the World Stage", lo: "ເສັ້ນທາງສູ່ເວທີໂລກ" },
    title: {
      en: "From Laos to the Global MLBB Pro Circuit",
      lo: "ຈາກລາວ ສູ່ວົງຈອນແຂ່ງ MLBB ລະດັບໂລກ",
    },
    intro: {
      en: "A Lao team does not reach the summit by one match. It must win the country, survive the Mekong, then fight through S-Tier global stages where every slot is earned.",
      lo: "ທີມຈາກລາວບໍ່ໄດ້ໄປຮອດຈຸດສູງສຸດດ້ວຍນັດດຽວ. ຕ້ອງຊະນະໃນບ້ານ, ຜ່ານເຂດແມ່ຂອງ, ແລ້ວໄປປະທະທີມໃຫຍ່ໃນເວທີ S-Tier ທີ່ທຸກ slot ຕ້ອງແຍ່ງມາເອງ.",
    },
    badge: { en: "Fan & Sponsor Guide", lo: "ຄູ່ມືສໍາລັບແຟນຄັບ ແລະ ສະປອນເຊີ" },
  },
  tabs: {
    pillars: { en: "3 Pillars", lo: "3 ຂັ້ນຫຼັກ" },
    calendar: { en: "1-Year Calendar", lo: "ປະຕິທິນ 1 ປີ" },
  },
  pillars: [
    {
      eyebrow: { en: "Step 01", lo: "ຂັ້ນທີ 01" },
      title: { en: "Laos National Selection", lo: "ສຶກຄັດເລືອກໃນປະເທດ" },
      subtitle: { en: "Win the home ground first.", lo: "ຕ້ອງເປັນເບີ 1 ໃນບ້ານກ່ອນ." },
      body: {
        en: "The journey starts with the national qualifier. Lao teams fight for domestic control, official seeding, and the right to represent the country in the regional Pro Circuit.",
        lo: "ເສັ້ນທາງເລີ່ມຈາກຮອບຄັດເລືອກໃນລາວ. ທີມຕ່າງໆແຂ່ງເພື່ອຫາເບີ 1, ເອົາ seed ທີ່ດີ, ແລະ ສິດເປັນຕົວແທນປະເທດໄປລະດັບພາກພື້ນ.",
      },
      details: [
        { en: "Domestic qualifier", lo: "ຮອບຄັດເລືອກໃນປະເທດ" },
        { en: "Best Lao team earns the path forward", lo: "ທີມລາວທີ່ດີທີ່ສຸດໄດ້ໄປຕໍ່" },
        { en: "Foundation for sponsor visibility", lo: "ເປັນຖານສໍາລັບການເຫັນຂອງສະປອນເຊີ" },
      ],
      accent: "national",
    },
    {
      eyebrow: { en: "Step 02", lo: "ຂັ້ນທີ 02" },
      title: { en: "MCC Mekong", lo: "MCC Mekong" },
      subtitle: { en: "Laos, Thailand, Vietnam. Rank 1 reaches Wild Card.", lo: "ລາວ, ໄທ, ຫວຽດນາມ. ອັນດັບ 1 ເທົ່ານັ້ນໄດ້ໄປ Wild Card." },
      body: {
        en: "MCC Mekong is the regional pressure test. Top teams from Laos, Thailand, and Vietnam fight for the next gate. Only rank 1 advances to the MSC x EWC Wild Card.",
        lo: "MCC Mekong ແມ່ນດ່ານພາກພື້ນທີ່ກົດດັນທີ່ສຸດ. ທີມຊັ້ນນໍາຈາກລາວ, ໄທ, ແລະ ຫວຽດນາມ ຕ້ອງແຍ່ງປະຕູຂັ້ນຕໍ່ໄປ. ມີພຽງອັນດັບ 1 ເທົ່ານັ້ນທີ່ໄດ້ໄປ Wild Card ຂອງ MSC x EWC.",
      },
      details: [
        { en: "Regional Pro Circuit", lo: "ວົງຈອນ Pro Circuit ພາກພື້ນ" },
        { en: "Only rank 1 advances from MCCM", lo: "ອັນດັບ 1 ຈາກ MCCM ເທົ່ານັ້ນໄດ້ໄປຕໍ່" },
        { en: "Next stop: MSC x EWC Wild Card", lo: "ດ່ານຕໍ່ໄປ: Wild Card ຂອງ MSC x EWC" },
      ],
      accent: "mekong",
    },
    {
      eyebrow: { en: "Step 03", lo: "ຂັ້ນທີ 03" },
      title: { en: "S-Tier Global Stage", lo: "ເວທີໂລກ S-Tier" },
      subtitle: { en: "Wild Card first. Group Stage must be earned.", lo: "ຕ້ອງຜ່ານ Wild Card ກ່ອນ ແລ້ວຈຶ່ງເຂົ້າ Group Stage." },
      body: {
        en: "The global layer starts with the MSC x EWC Wild Card. The Wild Card winner earns the slot into the MSC x EWC Group Stage, where the main world-stage campaign begins.",
        lo: "ດ່ານລະດັບໂລກເລີ່ມຈາກ Wild Card ຂອງ MSC x EWC. ຜູ້ຊະນະ Wild Card ຈຶ່ງໄດ້ slot ເຂົ້າ Group Stage ຂອງ MSC x EWC ເຊິ່ງເປັນຈຸດເລີ່ມຂອງແຄມເປນເວທີໂລກຕົວຈິງ.",
      },
      details: [
        { en: "MSC x EWC Wild Card", lo: "Wild Card ຂອງ MSC x EWC" },
        { en: "Wild Card rank 1 enters Group Stage", lo: "ອັນດັບ 1 Wild Card ເຂົ້າ Group Stage" },
        { en: "Then Group Stage, Knockout, Grand Final", lo: "ຈາກນັ້ນແມ່ນ Group Stage, Knockout, Grand Final" },
      ],
      accent: "global",
    },
  ],
  calendar: [
    {
      quarter: "Q1",
      window: { en: "Jan - Mar", lo: "ມ.ກ. - ມີ.ນ." },
      title: { en: "Build the roster. Win Laos.", lo: "ຈັດທີມໃຫ້ພ້ອມ ແລ້ວຊະນະໃນລາວ" },
      body: {
        en: "Pre-season preparation, trials, scrims, media setup, and National Selection.",
        lo: "ຊ່ວງເຕີມຄວາມພ້ອມ, ທົດລອງ line-up, scrim, ຈັດສື່, ແລະ ແຂ່ງ National Selection.",
      },
      tags: [
        { en: "Roster", lo: "ຈັດທີມ" },
        { en: "National Selection", lo: "ຄັດເລືອກໃນປະເທດ" },
      ],
    },
    {
      quarter: "Q2",
      window: { en: "Apr - Jun", lo: "ເມ.ສ. - ມິ.ຖ." },
      title: { en: "MCC Mekong Season 1", lo: "MCC Mekong Season 1" },
      body: {
        en: "The first regional run decides one thing: which Mekong team takes rank 1 and advances to the MSC x EWC Wild Card.",
        lo: "ການແຂ່ງພາກພື້ນຮອບທໍາອິດຕັດສິນສິ່ງດຽວ: ທີມໃດໃນແມ່ຂອງຈະໄດ້ອັນດັບ 1 ແລະ ໄປ Wild Card ຂອງ MSC x EWC.",
      },
      tags: [
        { en: "MCCM Rank 1", lo: "MCCM ອັນດັບ 1" },
        { en: "Wild Card Slot", lo: "slot Wild Card" },
      ],
    },
    {
      quarter: "Q3",
      window: { en: "Jul - Sep", lo: "ກ.ລ. - ກ.ຍ." },
      title: { en: "MSC x EWC Wild Card + Group Stage chase", lo: "MSC x EWC Wild Card + ລ່າ Group Stage" },
      body: {
        en: "The MCCM winner enters Wild Card first. Only the Wild Card rank 1 moves into the MSC x EWC Group Stage; after that, the region resets for the year-end race.",
        lo: "ແຊ້ມ MCCM ຕ້ອງເຂົ້າ Wild Card ກ່ອນ. ມີພຽງອັນດັບ 1 ຂອງ Wild Card ເທົ່ານັ້ນທີ່ໄດ້ເຂົ້າ Group Stage ຂອງ MSC x EWC; ຫຼັງຈາກນັ້ນພາກພື້ນຈະ reset ເພື່ອລ່າແຊ້ມທ້າຍປີ.",
      },
      tags: [
        { en: "Wild Card", lo: "Wild Card" },
        { en: "Group Stage Slot", lo: "slot Group Stage" },
      ],
    },
    {
      quarter: "Q4",
      window: { en: "Oct - Dec", lo: "ຕ.ລ. - ທ.ວ." },
      title: { en: "Last ticket to M-Series", lo: "ຕົ໋ວທອງໃບສຸດທ້າຍສູ່ M-Series" },
      body: {
        en: "The hottest stretch: regional finals decide the final golden slot to the M-Series World Championship.",
        lo: "ຊ່ວງທີ່ດຸເດືອດທີ່ສຸດ: ຮອບສຸດທ້າຍພາກພື້ນຈະຕັດສິນຕົ໋ວທອງໃບສຸດທ້າຍໄປ M-Series World Championship.",
      },
      tags: [
        { en: "Regional Finals", lo: "ຮອບສຸດທ້າຍພາກພື້ນ" },
        { en: "World Championship", lo: "ຊິງແຊ້ມໂລກ" },
      ],
    },
  ],
  sponsorNote: {
    en: "For sponsors, this calendar explains when visibility spikes: national qualification, MCCM playoffs, MSC x EWC Wild Card, Group Stage qualification, and the M-Series race.",
    lo: "ສໍາລັບສະປອນເຊີ, ປະຕິທິນນີ້ຊ່ວຍເຫັນຊ່ວງທີ່ visibility ສູງ: ຄັດເລືອກໃນປະເທດ, playoff MCCM, Wild Card ຂອງ MSC x EWC, ການລ່າ Group Stage, ແລະ ເສັ້ນທາງ M-Series.",
  },
};

const mergeBi = (fallback: Bilingual, raw?: Partial<Bilingual>) => ({
  en: raw?.en ?? fallback.en,
  lo: raw?.lo ?? fallback.lo,
});

export function resolveMlbbEsportSystem(
  raw?: Partial<MlbbEsportSystemContent> | null
): MlbbEsportSystemContent {
  return {
    buttonLabel: mergeBi(DEFAULT_MLBB_ESPORT_SYSTEM.buttonLabel, raw?.buttonLabel),
    hero: {
      kicker: mergeBi(DEFAULT_MLBB_ESPORT_SYSTEM.hero.kicker, raw?.hero?.kicker),
      title: mergeBi(DEFAULT_MLBB_ESPORT_SYSTEM.hero.title, raw?.hero?.title),
      intro: mergeBi(DEFAULT_MLBB_ESPORT_SYSTEM.hero.intro, raw?.hero?.intro),
      badge: mergeBi(DEFAULT_MLBB_ESPORT_SYSTEM.hero.badge, raw?.hero?.badge),
    },
    tabs: {
      pillars: mergeBi(DEFAULT_MLBB_ESPORT_SYSTEM.tabs.pillars, raw?.tabs?.pillars),
      calendar: mergeBi(DEFAULT_MLBB_ESPORT_SYSTEM.tabs.calendar, raw?.tabs?.calendar),
    },
    pillars: raw?.pillars?.length
      ? raw.pillars.map((pillar, i) => ({
          ...DEFAULT_MLBB_ESPORT_SYSTEM.pillars[i % DEFAULT_MLBB_ESPORT_SYSTEM.pillars.length],
          ...pillar,
        }))
      : DEFAULT_MLBB_ESPORT_SYSTEM.pillars,
    calendar: raw?.calendar?.length
      ? raw.calendar.map((step, i) => ({
          ...DEFAULT_MLBB_ESPORT_SYSTEM.calendar[i % DEFAULT_MLBB_ESPORT_SYSTEM.calendar.length],
          ...step,
        }))
      : DEFAULT_MLBB_ESPORT_SYSTEM.calendar,
    sponsorNote: mergeBi(DEFAULT_MLBB_ESPORT_SYSTEM.sponsorNote, raw?.sponsorNote),
  };
}
