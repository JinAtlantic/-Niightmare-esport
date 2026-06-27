import type { Bilingual } from "@/lib/types";

export interface MatchScheduleEntry {
  id: string;
  opponent: string;
  date: string;
  time: string;
  round: Bilingual;
  note?: Bilingual;
}

export interface MatchScheduleContent {
  enabled: boolean;
  buttonLabel: Bilingual;
  title: Bilingual;
  intro: Bilingual;
  emptyText: Bilingual;
  entries: MatchScheduleEntry[];
}

export const DEFAULT_MATCH_SCHEDULE: MatchScheduleContent = {
  enabled: false,
  buttonLabel: { en: "View Schedule", lo: "ເບິ່ງຕາຕະລາງແຂ່ງ" },
  title: { en: "NIIGHTMARE Match Schedule", lo: "ຕາຕະລາງແຂ່ງ NIIGHTMARE" },
  intro: {
    en: "Upcoming NIIGHTMARE fixtures curated by the team.",
    lo: "ລາຍການແຂ່ງຂອງ NIIGHTMARE ຈາກຕາຕະລາງທີ່ອັບໂຫຼດ.",
  },
  emptyText: {
    en: "No NIIGHTMARE schedule rows have been added yet.",
    lo: "ຍັງບໍ່ມີລາຍການແຂ່ງຂອງ NIIGHTMARE.",
  },
  entries: [],
};

export function hasMatchSchedulePayload(input?: Partial<MatchScheduleContent> | null) {
  if (!input) return false;
  const diffBi = (key: "buttonLabel" | "title" | "intro" | "emptyText") =>
    Boolean(
      (input[key]?.en ?? DEFAULT_MATCH_SCHEDULE[key].en) !== DEFAULT_MATCH_SCHEDULE[key].en ||
        (input[key]?.lo ?? DEFAULT_MATCH_SCHEDULE[key].lo) !== DEFAULT_MATCH_SCHEDULE[key].lo
    );

  return Boolean(
    input.enabled ||
      input.entries?.length ||
      diffBi("buttonLabel") ||
      diffBi("title") ||
      diffBi("intro") ||
      diffBi("emptyText")
  );
}

function cleanEntry(entry: Partial<MatchScheduleEntry>, index: number): MatchScheduleEntry {
  return {
    id: entry.id || `schedule-${Date.now()}-${index}`,
    opponent: entry.opponent ?? "",
    date: entry.date ?? "",
    time: entry.time ?? "",
    round: {
      en: entry.round?.en ?? "",
      lo: entry.round?.lo ?? "",
    },
    note:
      entry.note?.en || entry.note?.lo
        ? { en: entry.note?.en ?? "", lo: entry.note?.lo ?? "" }
        : undefined,
  };
}

export function resolveMatchSchedule(input?: Partial<MatchScheduleContent> | null): MatchScheduleContent {
  const entries = Array.isArray(input?.entries)
    ? input.entries.map((entry, index) => cleanEntry(entry, index))
    : DEFAULT_MATCH_SCHEDULE.entries;

  return {
    ...DEFAULT_MATCH_SCHEDULE,
    ...(input ?? {}),
    buttonLabel: { ...DEFAULT_MATCH_SCHEDULE.buttonLabel, ...(input?.buttonLabel ?? {}) },
    title: { ...DEFAULT_MATCH_SCHEDULE.title, ...(input?.title ?? {}) },
    intro: { ...DEFAULT_MATCH_SCHEDULE.intro, ...(input?.intro ?? {}) },
    emptyText: { ...DEFAULT_MATCH_SCHEDULE.emptyText, ...(input?.emptyText ?? {}) },
    entries,
  };
}
