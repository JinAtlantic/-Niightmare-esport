import type { Bilingual, GameId } from "@/lib/types";
import { cleanBo } from "@/lib/bestOf";

export interface MatchScheduleEntry {
  id: string;
  opponent: string;
  date: string;
  time: string;
  round: Bilingual;
  /** Optional series format label ("BO1" | "BO3" | "BO5" …). Empty = not shown. */
  bo?: string;
  /** Optional game — lets this fixture be promoted to the home headline card. */
  game?: GameId;
  /** Optional tournament/event name — carried over when promoted to headline. */
  tournament?: Bilingual;
  /** Optional opponent short code / logo — carried over when promoted. */
  opponentAbbr?: string;
  opponentLogo?: string;
}

export interface MatchScheduleContent {
  enabled: boolean;
  buttonLabel: Bilingual;
  title: Bilingual;
  emptyText: Bilingual;
  entries: MatchScheduleEntry[];
}

export const DEFAULT_MATCH_SCHEDULE: MatchScheduleContent = {
  enabled: false,
  buttonLabel: { en: "View Schedule", lo: "ເບິ່ງຕາຕະລາງແຂ່ງ" },
  title: { en: "NIIGHTMARE Match Schedule", lo: "ຕາຕະລາງແຂ່ງ NIIGHTMARE" },
  emptyText: {
    en: "No NIIGHTMARE schedule rows have been added yet.",
    lo: "ຍັງບໍ່ມີລາຍການແຂ່ງຂອງ NIIGHTMARE.",
  },
  entries: [],
};

export function hasMatchSchedulePayload(input?: Partial<MatchScheduleContent> | null) {
  if (!input) return false;
  const diffBi = (key: "buttonLabel" | "title" | "emptyText") =>
    Boolean(
      (input[key]?.en ?? DEFAULT_MATCH_SCHEDULE[key].en) !== DEFAULT_MATCH_SCHEDULE[key].en ||
        (input[key]?.lo ?? DEFAULT_MATCH_SCHEDULE[key].lo) !== DEFAULT_MATCH_SCHEDULE[key].lo
    );

  return Boolean(input.enabled || input.entries?.length || diffBi("buttonLabel") || diffBi("title") || diffBi("emptyText"));
}

function cleanEntry(entry: Partial<MatchScheduleEntry>, index: number): MatchScheduleEntry {
  const tournament =
    entry.tournament && (entry.tournament.en || entry.tournament.lo)
      ? { en: entry.tournament.en ?? "", lo: entry.tournament.lo ?? "" }
      : undefined;
  return {
    id: entry.id || `schedule-${Date.now()}-${index}`,
    opponent: entry.opponent ?? "",
    date: entry.date ?? "",
    time: entry.time ?? "",
    round: {
      en: entry.round?.en ?? "",
      lo: entry.round?.lo ?? "",
    },
    bo: cleanBo(entry.bo),
    game: entry.game === "efootball" ? "efootball" : entry.game === "mlbb" ? "mlbb" : undefined,
    tournament,
    opponentAbbr: entry.opponentAbbr?.trim() || undefined,
    opponentLogo: entry.opponentLogo?.trim() || undefined,
  };
}

export function resolveMatchSchedule(input?: Partial<MatchScheduleContent> | null): MatchScheduleContent {
  const entries = Array.isArray(input?.entries)
    ? input.entries.map((entry, index) => cleanEntry(entry, index))
    : DEFAULT_MATCH_SCHEDULE.entries;

  return {
    ...DEFAULT_MATCH_SCHEDULE,
    enabled: input?.enabled ?? DEFAULT_MATCH_SCHEDULE.enabled,
    buttonLabel: { ...DEFAULT_MATCH_SCHEDULE.buttonLabel, ...(input?.buttonLabel ?? {}) },
    title: { ...DEFAULT_MATCH_SCHEDULE.title, ...(input?.title ?? {}) },
    emptyText: { ...DEFAULT_MATCH_SCHEDULE.emptyText, ...(input?.emptyText ?? {}) },
    entries,
  };
}
