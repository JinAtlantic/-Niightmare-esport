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
      subtitle: { en: "Laos, Thailand, Vietnam. One direct slot.", lo: "ລາວ, ໄທ, ຫວຽດນາມ. ມີບ່ອນບິນກົງບໍ່ຫຼາຍ." },
      body: {
        en: "MCC Mekong is the regional pressure test. Top teams from Laos, Thailand, and Vietnam fight for global qualification. Rank 1 takes the direct slot; rank 2 must survive Wild Card.",
        lo: "MCC Mekong ແມ່ນດ່ານພາກພື້ນທີ່ກົດດັນທີ່ສຸດ. ທີມຊັ້ນນໍາຈາກລາວ, ໄທ, ແລະ ຫວຽດນາມ ຕ້ອງແຍ່ງຕົ໋ວໄປເວທີໂລກ. ອັນດັບ 1 ໄດ້ slot ບິນກົງ, ອັນດັບ 2 ຕ້ອງຜ່ານ Wild Card.",
      },
      details: [
        { en: "Regional Pro Circuit", lo: "ວົງຈອນ Pro Circuit ພາກພື້ນ" },
        { en: "Direct slot for rank 1", lo: "ອັນດັບ 1 ໄດ້ slot ບິນກົງ" },
        { en: "Wild Card route for rank 2", lo: "ອັນດັບ 2 ໄປສູ້ Wild Card" },
      ],
      accent: "mekong",
    },
    {
      eyebrow: { en: "Step 03", lo: "ຂັ້ນທີ 03" },
      title: { en: "S-Tier Global Stage", lo: "ເວທີໂລກ S-Tier" },
      subtitle: { en: "MSC mid-year. M-Series at year-end.", lo: "ກາງປີມີ MSC. ທ້າຍປີມີ M-Series." },
      body: {
        en: "The final layer is the world stage: MSC at the Esports World Cup in Saudi Arabia during mid-year, then the M-Series World Championship at the end of the season.",
        lo: "ດ່ານສຸດທ້າຍແມ່ນເວທີໂລກ: MSC ໃນ Esports World Cup ທີ່ຊາອຸດີອາຣາເບຍຊ່ວງກາງປີ, ແລະ M-Series World Championship ຊ່ວງທ້າຍລະດູການ.",
      },
      details: [
        { en: "MSC / Esports World Cup", lo: "MSC / Esports World Cup" },
        { en: "Group Stage, Knockout, Grand Final", lo: "Group Stage, Knockout, Grand Final" },
        { en: "M-Series World Championship", lo: "M-Series World Championship" },
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
        en: "The first regional run decides who reaches the mid-year world tournament path.",
        lo: "ການແຂ່ງພາກພື້ນຮອບທໍາອິດເປັນຕົວຕັດສິນເສັ້ນທາງໄປທົວໂລກກາງປີ.",
      },
      tags: [
        { en: "Mekong Slot", lo: "slot ແມ່ຂອງ" },
        { en: "MSC Path", lo: "ເສັ້ນທາງ MSC" },
      ],
    },
    {
      quarter: "Q3",
      window: { en: "Jul - Sep", lo: "ກ.ລ. - ກ.ຍ." },
      title: { en: "MSC World Stage + Season 2 reset", lo: "MSC ເວທີໂລກ + ເລີ່ມ Season 2" },
      body: {
        en: "Qualified teams fly to MSC at the Esports World Cup, then return to restart the regional race for the year-end championship.",
        lo: "ທີມທີ່ຜ່ານໄດ້ຈະໄປ MSC ໃນ Esports World Cup, ແລ້ວກັບມາເລີ່ມວົງຈອນພາກພື້ນອີກຄັ້ງເພື່ອລ່າແຊ້ມໂລກທ້າຍປີ.",
      },
      tags: [
        { en: "MSC", lo: "MSC" },
        { en: "Season 2", lo: "Season 2" },
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
    en: "For sponsors, this calendar explains when visibility spikes: national qualification, Mekong playoffs, MSC, and the M-Series race.",
    lo: "ສໍາລັບສະປອນເຊີ, ປະຕິທິນນີ້ຊ່ວຍເຫັນຊ່ວງທີ່ visibility ສູງ: ຄັດເລືອກໃນປະເທດ, playoff ແມ່ຂອງ, MSC, ແລະ ເສັ້ນທາງ M-Series.",
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
