export type Tier = "C" | "B" | "A" | "S";

/**
 * Classify a tournament name into its Liquipedia tier so the match list can be
 * colour-coded. Only the main competitive families are tiered; anything else
 * returns null and is rendered in the default brand violet.
 *
 *   S — M-series World Championship, MLBB Mid-Season Cup
 *   A — Games of the Future / Wild Card routes
 *   B — M Challenge Cup Mekong (and its qualifiers), other MCC
 *   C — national championships / qualifiers
 */
export function tournamentTier(name: string): Tier | null {
  const n = name.toLowerCase();
  if (/world championship/.test(n) || /\bm[5-9]\b/.test(n)) return "S";
  if (/mid[\s-]?season cup/.test(n) || /\bmsc\b/.test(n)) {
    // A Mekong / regional qualifier for the MSC is itself a B-tier event.
    return /qualifier|mekong/.test(n) ? "B" : "S";
  }
  if (/games of the future/.test(n)) return "A";
  if (/mekong/.test(n) || /m challenge cup/.test(n) || /\bmcc\b/.test(n)) return "B";
  if (/national championship/.test(n) || /\bnational\b/.test(n)) return "C";
  return null;
}

export function tierFromText(value: string): Tier | null {
  const match = value.toUpperCase().match(/\b([CBAS])-?\s*TIER\b/);
  return match ? (match[1] as Tier) : null;
}
