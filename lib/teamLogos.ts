/**
 * Central opponent → logo registry.
 *
 * Maps a *normalized* opponent team name to a logo file in /public/teams so the
 * same team shows its crest everywhere it appears (public /matches, home
 * RecentResults + UpcomingMatch, admin rows) — WITHOUT attaching a logo to each
 * individual match. Add a team once here and every past & future match against
 * that name picks the logo up automatically.
 *
 * A match's own `opponentLogo` (set in /admin) always wins; this registry is the
 * fallback used when a match has none. Unknown teams fall back to the initials
 * monogram, exactly as before.
 *
 * Logos were sourced from Liquipedia (Mobile Legends) by exact team name via
 * scripts/fetch-team-logos.mjs — re-run it to add more.
 */

/** Lowercase, trim, collapse internal whitespace — the registry key form.
 *  (Same shape as normalizeTeamName in lib/opponentCountries.ts.) */
export function normalizeTeamName(name?: string): string {
  return (name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * normalized team name → /public path of its logo.
 * GENERATED-ish: edit via scripts/fetch-team-logos.mjs, or add a line by hand.
 */
const LOGO_BY_TEAM: Record<string, string> = {
  "team falcons": "/teams/team-falcons.png",
  "team falcons mena": "/teams/team-falcons.png", // same org (MENA division)
  "team evo": "/teams/team-evo.png",
  "verso time": "/teams/verso-time.png",
  "ulfhednar": "/teams/ulfhednar.png",
  "paradise esports": "/teams/paradise-esports.png",
};

/** Resolve the registry logo path for an opponent team, if we have one. */
export function teamLogoFor(name?: string): string | undefined {
  return LOGO_BY_TEAM[normalizeTeamName(name)];
}
