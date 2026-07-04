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
  "189 esports": "/teams/189-esports.png",
  "200+ team": "/teams/200-team.png",
  "4merical esports": "/teams/4merical-esports.png",
  "av gaming th": "/teams/av-gaming-th.png",
  // "bacon time" — the "Bacon_*" file is a different org; real Bacon Time crest
  // not found. Monogram until a correct logo is provided.
  "bte 404": "/teams/bte-404.png",
  "burmese ghouls": "/teams/burmese-ghouls.png",
  "cfu gaming": "/teams/cfu-gaming.png",
  "evil": "/teams/evil.png",
  "fire flux esports": "/teams/fire-flux-esports.png",
  "gamelab": "/teams/gamelab.png",
  "geek fam id": "/teams/geek-fam-id.png",
  "geek slate": "/teams/geek-slate.png",
  "geekay esports": "/teams/geekay-esports.png",
  // "genius esports" — Liquipedia "Genius" matched a different org; Lao team's
  // real crest not found. Monogram until a correct logo is provided.
  "heloheli": "/teams/heloheli.png",
  "hozen squad": "/teams/hozen-squad.png",
  "index kh": "/teams/index-kh.png",
  "iq phoenix": "/teams/iq-phoenix.png",
  "king of gamers club": "/teams/king-of-gamers-club.png",
  "legion esports": "/teams/legion-esports.png",
  "leon esports": "/teams/leon-esports.png",
  "level": "/teams/level.png",
  "logic esports": "/teams/logic-esports.png",
  "mdh esports": "/teams/mdh-esports.png",
  "minana esports": "/teams/minana-esports.png",
  "miracle gaming": "/teams/miracle-gaming.png",
  "myway esports": "/teams/myway-esports.png",
  "orange esports": "/teams/orange-esports.png",
  "pandora": "/teams/pandora.png",
  // "paradise esports" — matched a different "Paradise" org; monogram until a
  // correct Lao logo is provided.
  "pro esports": "/teams/pro-esports.png",
  "red giants esports": "/teams/red-giants-esports.png",
  "saigon phantom": "/teams/saigon-phantom.png",
  "spr esports": "/teams/spr-esports.png",
  "sunset ravens": "/teams/sunset-ravens.png",
  "team evo": "/teams/team-evo.png",
  "team falcons": "/teams/team-falcons.png",
  "team falcons mena": "/teams/team-falcons.png", // same org (MENA division)
  "team flash kh": "/teams/team-flash-kh.png",
  "team lilgun": "/teams/team-lilgun.png",
  "team smg": "/teams/team-smg.png",
  "team x": "/teams/team-x.png",
  "the drift": "/teams/the-drift.png",
  "the mongolz": "/teams/the-mongolz.png",
  "the sixstar octagarm": "/teams/the-sixstar-octagarm.png",
  "ulfhednar": "/teams/ulfhednar.png",
  "valhalla": "/teams/valhalla.png",
  "vampire esports": "/teams/vampire-esports.png",
  "verso time": "/teams/verso-time.png",
  "virtus.pro": "/teams/virtus-pro.png",
  "wawa gaming": "/teams/wawa-gaming.png",
  "wawa gaming th": "/teams/wawa-gaming-th.png",
  "zenith esports": "/teams/zenith-esports.png",
  "zeta division": "/teams/zeta-division.png",
  "zino zenith": "/teams/zino-zenith.png",
};

/** Resolve the registry logo path for an opponent team, if we have one. */
export function teamLogoFor(name?: string): string | undefined {
  return LOGO_BY_TEAM[normalizeTeamName(name)];
}
