/**
 * Best-of (series format) helper. A fixture's `bo` says how many games decide
 * the match: BO1 = one game, BO3 = first to 2, BO5 = first to 3, etc. Stored as
 * a short label string ("BO3") on upcoming matches, schedule rows, and match
 * records; empty means the format isn't shown.
 */

export const BO_VALUES = ["BO1", "BO2", "BO3", "BO5", "BO7"] as const;
export type BestOf = (typeof BO_VALUES)[number];

const BO_SET = new Set<string>(BO_VALUES);

/** Normalise a stored best-of value to a known label, else "" (not shown). */
export function cleanBo(value?: string | null): string {
  const v = (value ?? "").trim().toUpperCase().replace(/\s+/g, "");
  return BO_SET.has(v) ? v : "";
}

/** Admin dropdown options — leads with a "none" entry so a fixture can omit it. */
export const BO_SELECT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— (ไม่ระบุ)" },
  ...BO_VALUES.map((v) => ({ value: v, label: v })),
];
