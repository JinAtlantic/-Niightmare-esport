/**
 * Achievements figures derived from the *live* tournament list (the same data
 * the /matches page uses), so Total Winnings, per-tier participation counts and
 * podium finishes stay in sync automatically — no separate hand-kept numbers.
 *
 * Source: `content.matches.tournaments` (Tournament[]). Tier comes from
 * `tournamentTier(name)`, rank is parsed from the free-form `placement` string.
 */
import { tournamentTier, type Tier } from "@/lib/tiers";
import type { PlacementSummaryRow, Tournament } from "@/lib/types";

/** Parse a free-form prize string ("$3,000", "29,000$", "$1.5k", "-", "TBA") to a USD number. */
export function prizeToUsd(value?: string): number {
  const text = (value ?? "").trim().toLowerCase();
  if (!text) return 0;
  const m = text.match(/(\d[\d.,]*)\s*(k|m|b)?/);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return 0;
  const mult = m[2] === "b" ? 1e9 : m[2] === "m" ? 1e6 : m[2] === "k" ? 1e3 : 1;
  return n * mult;
}

/** Compact USD label, e.g. 126073 → "$126K" (matches the hero-stat style). */
export function formatUsdCompact(n: number): string {
  return n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n)}`;
}

/** Map a free-form placement string to a podium rank (1/2/3), else 0. */
function placementRank(placement: string): 0 | 1 | 2 | 3 {
  const p = placement.trim().toLowerCase();
  if (!p) return 0;
  if (/runner[\s-]?up|silver/.test(p)) return 2; // before "champion" words
  if (/champion|winner|gold\b/.test(p)) return 1;
  if (/bronze/.test(p)) return 3;
  // Leading ordinal ("1st", "2nd", "3rd"). Ranges like "22nd–23rd" read as 22 → 0.
  const num = p.match(/^(\d+)/);
  if (num) {
    const n = Number(num[1]);
    if (n === 1) return 1;
    if (n === 2) return 2;
    if (n === 3) return 3;
  }
  return 0;
}

const tierName = (t: Pick<Tournament, "name">) => t.name?.en || t.name?.lo || "";
const placeText = (t: Pick<Tournament, "placement">) => t.placement?.en || t.placement?.lo || "";

/** Sum of every tournament's prize, in USD. */
export function deriveTotalWinnings(tournaments: Tournament[]): number {
  return tournaments.reduce((sum, t) => sum + prizeToUsd(t.prize), 0);
}

/** Total first-place finishes (championships) across all tiers. */
export function deriveChampionships(tournaments: Tournament[]): number {
  return tournaments.reduce((n, t) => n + (placementRank(placeText(t)) === 1 ? 1 : 0), 0);
}

type Bucket = Tier | "Other";
const BUCKET_ORDER: Bucket[] = ["S", "A", "B", "C", "Other"];

/**
 * Per-tier podium + participation summary. `all` = tournaments entered in that
 * tier; first/second/third = podium finishes; top3 = their sum. Tournaments
 * whose name doesn't classify into a tier fall into an "Other" row so every
 * entry is counted (matching what /matches shows). Empty tiers are dropped.
 */
export function derivePlacementSummary(tournaments: Tournament[]): PlacementSummaryRow[] {
  const blank = () => ({ first: 0, second: 0, third: 0, all: 0 });
  const acc: Record<Bucket, { first: number; second: number; third: number; all: number }> = {
    S: blank(), A: blank(), B: blank(), C: blank(), Other: blank(),
  };
  for (const t of tournaments) {
    const bucket: Bucket = tournamentTier(tierName(t)) ?? "Other";
    acc[bucket].all += 1;
    const rank = placementRank(placeText(t));
    if (rank === 1) acc[bucket].first += 1;
    else if (rank === 2) acc[bucket].second += 1;
    else if (rank === 3) acc[bucket].third += 1;
  }
  return BUCKET_ORDER.map((tier) => {
    const a = acc[tier];
    return { tier, first: a.first, second: a.second, third: a.third, top3: a.first + a.second + a.third, all: a.all };
  }).filter((row) => row.all > 0);
}
