import type { Bilingual } from "@/lib/types";

/**
 * Annual Esports Roadmap for the Matches page popup.
 * Admin-editable via site.roadmap and stored in site_settings.roadmap.
 */

export type RoadmapHalfId = "h1" | "h2";
export type RoadmapStageStatus = "past" | "active" | "future";

export interface RoadmapStage {
  id: string;
  quarter?: string;
  label: Bilingual;
  title: Bilingual;
  window: Bilingual;
  body: Bilingual;
  tag: string;
  status: RoadmapStageStatus;
  destination?: boolean;
}

export interface RoadmapHalf {
  id: RoadmapHalfId;
  tab: Bilingual;
  kicker: Bilingual;
  title: Bilingual;
  goal: Bilingual;
  stages: RoadmapStage[];
}

export interface RoadmapContent {
  buttonLabel: Bilingual;
  hero: {
    kicker: Bilingual;
    title: Bilingual;
    intro: Bilingual;
  };
  activeStageId: string;
  activeBadge: Bilingual;
  activeDetail: Bilingual;
  activeLabel: Bilingual;
  halves: RoadmapHalf[];
}

export const DEFAULT_ROADMAP: RoadmapContent = {
  buttonLabel: { en: "Niightmare Roadmap", lo: "Niightmare Roadmap" },
  hero: {
    kicker: { en: "The Nightmare Active Mission", lo: "ພາລະກິດປັດຈຸບັນຂອງ NIIGHTMARE" },
    title: { en: "Annual Esports Roadmap", lo: "ແຜນທາງ Esports ປະຈຳປີ" },
    intro: {
      en: "A clear season map for fans and sponsors: first half to MSC x EWC, second half to M-Series.",
      lo: "ແຜນທາງລະດູການທີ່ເບິ່ງງ່າຍສຳລັບແຟນຄັບ ແລະ ສະປອນເຊີ: ຄຶ່ງປີທຳອິດສູ່ MSC x EWC, ຄຶ່ງປີຫຼັງສູ່ M-Series.",
    },
  },
  activeStageId: "h1-wild-card",
  activeBadge: {
    en: "CURRENT STATUS: INVASION PREPARATION (ROAD TO RIYADH, SAUDI ARABIA)",
    lo: "ສະຖານະປັດຈຸບັນ: ຕຽມບຸກທະລຸສູ່ ຣິຍາດ, ຊາອຸດີ ອາຣາເບຍ (MSC 2026)",
  },
  activeDetail: {
    en: "After dominating the region, NIIGHTMARE is now sharpening our blades for the S-Tier world stage at the Esports World Cup. The hunt begins this July.",
    lo: "ຫຼັງຈາກຄອບງຳພາກພື້ນ, NIIGHTMARE ກຳລັງຫວນຄືນສູ່ການຝຶກຊ້ອມຢ່າງເຂັ້ມງວດ ເພື່ອຕຽມລຸຍເສັ້ນທາງ S-Tier ເທິງເວທີ Esports World Cup. ການລ່າລາງວັນຈະເລີ່ມຕົ້ນຂຶ້ນໃນເດືອນກໍລະກົດນີ້.",
  },
  activeLabel: {
    en: "CURRENT BATTLEGROUND",
    lo: "ສະໜາມຮົບປັດຈຸບັນ",
  },
  halves: [
    {
      id: "h1",
      tab: { en: "H1: Road to MSC x EWC", lo: "H1: ເສັ້ນທາງສູ່ MSC x EWC" },
      kicker: { en: "First Half of the Year", lo: "ຄຶ່ງປີທຳອິດ" },
      title: { en: "Road to Riyadh", lo: "ເສັ້ນທາງສູ່ ຣິຍາດ" },
      goal: {
        en: "Ultimate target: reach the S-Tier MSC x Esports World Cup stage in Riyadh, Saudi Arabia.",
        lo: "ເປົ້າໝາຍສູງສຸດ: ໄປໃຫ້ຮອດເວທີ S-Tier MSC x Esports World Cup ທີ່ ຣິຍາດ, ຊາອຸດີ ອາຣາເບຍ.",
      },
      stages: [
        {
          id: "h1-step-1",
          label: { en: "Step 1", lo: "ຂັ້ນທີ 1" },
          title: { en: "Laos Qualifier & Preparation", lo: "ຄັດເລືອກລາວ ແລະ ການກຽມທີມ" },
          window: { en: "January - March", lo: "ມັງກອນ - ມີນາ" },
          body: {
            en: "Form the roster, sharpen draft plans, scrim hard, and clear the Laos domestic qualifier for the official club representative slot.",
            lo: "ຟອມທີມ, ວາງແຜນ draft, scrim ຢ່າງເຂັ້ມງວດ, ແລະ ຜ່ານຮອບຄັດເລືອກພາຍໃນລາວເພື່ອຊິງ slot ຕົວແທນສະໂມສອນ.",
          },
          tag: "C-Tier / National",
          status: "past",
        },
        {
          id: "h1-step-2",
          label: { en: "Step 2", lo: "ຂັ້ນທີ 2" },
          title: { en: "MCC Mekong Season 1", lo: "MCC Mekong Season 1" },
          window: { en: "April - June", lo: "ເມສາ - ມິຖຸນາ" },
          body: {
            en: "Battle top teams from Thailand and Vietnam. Only the MCCM rank 1 team earns the Wild Card route toward MSC x EWC.",
            lo: "ປະທະທີມແກ່ງຈາກໄທ ແລະ ຫວຽດນາມ. ມີພຽງອັນດັບ 1 ຂອງ MCCM ເທົ່ານັ້ນທີ່ໄດ້ໄປ MSC x EWC ແຕ່ຕ້ອງຜ່ານ Wild Card ກ່ອນ.",
          },
          tag: "B-Tier / Regional",
          status: "past",
        },
        {
          id: "h1-wild-card",
          label: { en: "Wild Card", lo: "Wild Card" },
          title: { en: "MSC x EWC Wild Card", lo: "MSC x EWC Wild Card" },
          window: { en: "June - July", lo: "ມິຖຸນາ - ກໍລະກົດ" },
          body: {
            en: "The MCCM Season 1 champion must survive the Wild Card bracket. Only Wild Card rank 1 unlocks the MSC x EWC Group Stage.",
            lo: "ແຊ້ມ MCCM Season 1 ຕ້ອງຜ່ານຮອບ Wild Card ກ່ອນ. ມີພຽງອັນດັບ 1 ຂອງ Wild Card ເທົ່ານັ້ນທີ່ຈະປົດລັອກຕົ໋ວເຂົ້າ Group Stage ຂອງ MSC x EWC.",
          },
          tag: "A-Tier / Wild Card",
          status: "future",
        },
        {
          id: "h1-destination",
          label: { en: "Destination", lo: "ຈຸດໝາຍ" },
          title: { en: "MSC @ Esports World Cup", lo: "MSC @ Esports World Cup" },
          window: { en: "July", lo: "ກໍລະກົດ" },
          body: {
            en: "The Wild Card rank 1 earns the Group Stage slot at the real MSC x EWC battlefield, chasing a prize pool above 3,000,000 USD.",
            lo: "ອັນດັບ 1 ຂອງ Wild Card ຈຶ່ງໄດ້ slot ເຂົ້າ Group Stage ໃນສະໜາມຈິງ MSC x EWC ເພື່ອລ່າເງິນລາງວັນກວ່າ 3,000,000 USD.",
          },
          tag: "S-Tier / Global Ultimate",
          status: "future",
          destination: true,
        },
      ],
    },
    {
      id: "h2",
      tab: { en: "H2: Road to M-Series", lo: "H2: ເສັ້ນທາງສູ່ M-Series" },
      kicker: { en: "Second Half of the Year", lo: "ຄຶ່ງປີຫຼັງ" },
      title: { en: "Road to the World Crown", lo: "ເສັ້ນທາງສູ່ບັນລັງໂລກ" },
      goal: {
        en: "Ultimate target: win the M-Series world crown and earn the right to create a club Champion Skin.",
        lo: "ເປົ້າໝາຍສູງສຸດ: ລ່າບັນລັງແຊ້ມໂລກ M-Series ແລະ ສິດໃນການສ້າງ Champion Skin ຂອງສະໂມສອນ.",
      },
      stages: [
        {
          id: "h2-step-3",
          label: { en: "Step 3", lo: "ຂັ້ນທີ 3" },
          title: { en: "Mid-Season Roster & Laos Stage", lo: "ປັບທີມກາງປີ ແລະ ດ່ານລາວ" },
          window: { en: "August", lo: "ສິງຫາ" },
          body: {
            en: "Reset the system, tune the playbook, and pass the Laos qualifier for the second-half season.",
            lo: "ກັບມາຕັ້ງຫຼັກ, ປັບປຸງແຜນການຫຼິ້ນ, ແລະ ຜ່ານຮອບຄັດເລືອກລາວຂອງຄຶ່ງປີຫຼັງ.",
          },
          tag: "C-Tier / National Reset",
          status: "future",
        },
        {
          id: "h2-step-4",
          label: { en: "Step 4", lo: "ຂັ້ນທີ 4" },
          title: { en: "MCC Mekong Season 2", lo: "MCC Mekong Season 2" },
          window: { en: "September - November", lo: "ກັນຍາ - ພະຈິກ" },
          body: {
            en: "The most brutal regional battlefield of the year. MCCM rank 1 flies direct to M-Series; rank 2 enters Wild Card to fight for one final M-Series slot.",
            lo: "ສະໜາມຮົບພາກພື້ນທີ່ດຸເດືອດທີ່ສຸດຂອງປີ. ອັນດັບ 1 ຂອງ MCCM ໄດ້ຕົ໋ວບິນກົງໄປ M-Series; ອັນດັບ 2 ໄປ Wild Card ເພື່ອຫາ 1 slot ສຸດທ້າຍ.",
          },
          tag: "B-Tier / Regional Major",
          status: "future",
        },
        {
          id: "h2-wild-card",
          label: { en: "Wild Card", lo: "Wild Card" },
          title: { en: "M-Series Wild Card", lo: "M-Series Wild Card" },
          window: { en: "November - December", lo: "ພະຈິກ - ທັນວາ" },
          body: {
            en: "MCCM Season 2 rank 2 enters the Wild Card war. Only Wild Card rank 1 claims the final route into the M-Series World Championship.",
            lo: "ອັນດັບ 2 ຂອງ MCCM Season 2 ຈະເຂົ້າສູ່ຮອບ Wild Card. ມີພຽງອັນດັບ 1 ຂອງ Wild Card ເທົ່ານັ້ນທີ່ຈະຄວ້າເສັ້ນທາງສຸດທ້າຍໄປ M-Series World Championship.",
          },
          tag: "A-Tier / Wild Card",
          status: "future",
        },
        {
          id: "h2-destination",
          label: { en: "Destination", lo: "ຈຸດໝາຍ" },
          title: { en: "M-Series World Championship", lo: "M-Series World Championship" },
          window: { en: "December - January", lo: "ທັນວາ - ມັງກອນ" },
          body: {
            en: "The highest stage in MLBB history: MCCM Season 2 rank 1 flies direct, while Wild Card rank 1 joins the world race for a Champion Skin legacy.",
            lo: "ເວທີສູງສຸດໃນປະຫວັດສາດ MLBB: ສູ້ເພື່ອຈາລຶກຊື່ NIIGHTMARE ໃຫ້ເປັນທີມທີ່ແກ່ງທີ່ສຸດໃນໂລກ ແລະ ສ້າງມໍລະດົກ Champion Skin.",
          },
          tag: "S-Tier / World Championship",
          status: "future",
          destination: true,
        },
      ],
    },
  ],
};

const mergeBi = (fallback: Bilingual, raw?: Partial<Bilingual>) => ({
  en: raw?.en ?? fallback.en,
  lo: raw?.lo ?? fallback.lo,
});

function mergeStage(fallback: RoadmapStage, raw?: Partial<RoadmapStage>): RoadmapStage {
  return {
    ...fallback,
    ...raw,
    label: mergeBi(fallback.label, raw?.label),
    title: mergeBi(fallback.title, raw?.title),
    window: mergeBi(fallback.window, raw?.window),
    body: mergeBi(fallback.body, raw?.body),
    status: raw?.status ?? fallback.status,
  };
}

function mergeHalf(fallback: RoadmapHalf, raw?: Partial<RoadmapHalf>): RoadmapHalf {
  const rawStageById = new Map((raw?.stages ?? []).map((stage) => [stage.id, stage]));

  return {
    ...fallback,
    ...raw,
    id: fallback.id,
    tab: mergeBi(fallback.tab, raw?.tab),
    kicker: mergeBi(fallback.kicker, raw?.kicker),
    title: mergeBi(fallback.title, raw?.title),
    goal: mergeBi(fallback.goal, raw?.goal),
    stages: fallback.stages.map((stage) => mergeStage(stage, rawStageById.get(stage.id))),
  };
}

export function resolveRoadmap(raw?: Partial<RoadmapContent> | null): RoadmapContent {
  const hasSavedWildCard = raw?.halves?.some((half) =>
    half.stages?.some((stage) => stage.id === "h1-wild-card")
  );
  const activeStageId =
    !hasSavedWildCard && raw?.activeStageId === "h1-destination"
      ? DEFAULT_ROADMAP.activeStageId
      : raw?.activeStageId ?? DEFAULT_ROADMAP.activeStageId;
  const halves = DEFAULT_ROADMAP.halves.map((half, index) => mergeHalf(half, raw?.halves?.[index])).map((half) => ({
    ...half,
    stages: half.stages.map((stage) => ({
      ...stage,
      status: (stage.id === activeStageId ? "active" : stage.status === "active" ? "future" : stage.status) as RoadmapStageStatus,
    })),
  }));

  return {
    buttonLabel: mergeBi(DEFAULT_ROADMAP.buttonLabel, raw?.buttonLabel),
    hero: {
      kicker: mergeBi(DEFAULT_ROADMAP.hero.kicker, raw?.hero?.kicker),
      title: mergeBi(DEFAULT_ROADMAP.hero.title, raw?.hero?.title),
      intro: mergeBi(DEFAULT_ROADMAP.hero.intro, raw?.hero?.intro),
    },
    activeStageId,
    activeBadge: mergeBi(DEFAULT_ROADMAP.activeBadge, raw?.activeBadge),
    activeDetail: mergeBi(DEFAULT_ROADMAP.activeDetail, raw?.activeDetail),
    activeLabel: mergeBi(DEFAULT_ROADMAP.activeLabel, raw?.activeLabel),
    halves,
  };
}
