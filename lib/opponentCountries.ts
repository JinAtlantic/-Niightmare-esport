/**
 * Central opponent → country registry.
 *
 * Maps a *normalized* opponent team name to an ISO 3166-1 alpha-2 country code
 * so the same team shows its national flag beside its name everywhere it appears
 * (public /matches, home cards, admin rows). One place to edit, applies site-wide.
 *
 * National teams (whose name IS a country, e.g. CAMBODIA / VIETNAM) are left OUT
 * on purpose — their logo is already a flag, so adding another would be redundant.
 *
 * Countries were sourced from Liquipedia / Esports Charts (Mobile Legends). To add
 * a new team: add `normalize(name): "XX"` below. Unknown teams simply show no flag.
 */

/** Lowercase, trim, collapse internal whitespace — the registry key form. */
export function normalizeTeamName(name?: string): string {
  return (name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

const COUNTRY_BY_TEAM: Record<string, string> = {
  // ── International ──────────────────────────────────────────────
  "team falcons": "SA",
  "team falcons mena": "SA",
  "virtus.pro": "RU",
  "royal cybersports club": "RU",
  "verso time": "RU",
  "zeta division": "JP",
  "sunset ravens": "JP",
  "geekay esports": "AE",
  "fire flux esports": "TR",
  "ulfhednar": "TR",
  "the huns esport": "MN",
  "the mongolz": "MN",
  "dianfengyaoguai": "CN",

  // ── Vietnam ────────────────────────────────────────────────────
  "saigon phantom": "VN",
  "rlg vietnam": "VN",
  "legion esports": "VN",
  "mdh esports": "VN",

  // ── Cambodia ───────────────────────────────────────────────────
  "team flash kh": "KH",
  "index kh": "KH",
  "cfu gaming": "KH",
  "pro esports": "KH",
  "valhalla": "KH",
  "logic esports": "KH",

  // ── Myanmar ────────────────────────────────────────────────────
  "burmese ghouls": "MM",
  "genius esports": "MM",

  // ── Thailand ───────────────────────────────────────────────────
  "king of gamers club": "TH",
  "bacon": "TH",
  "vampire esports": "TH",
  "team lilgun": "TH",
  "av gaming th": "TH",
  "wawa gaming th": "TH",
  "hozen squad": "TH",
  "wonderer panda": "TH",
  "vampire kanagan": "TH",

  // ── Laos ───────────────────────────────────────────────────────
  "leon esports": "LA",
  "189 esports": "LA",
  "paradise esports": "LA",
  "team evo": "LA",
  "wawa gaming": "LA",
  "idonotsleep esports": "LA",
  "nine esports": "LA",
  "myway esports": "LA",
  "squad tang": "LA",

  // ── Indonesia ──────────────────────────────────────────────────
  "geek fam id": "ID",

  // ── Malaysia ───────────────────────────────────────────────────
  "team smg": "MY",
  "orange esports": "MY",
  "red giants esports": "MY",

  // ── Philippines ────────────────────────────────────────────────
  "minana esports": "PH",
  "gamelab": "PH",

  // ── Brunei ─────────────────────────────────────────────────────
  "esb titans": "BN",
  "esb legacy": "BN",
};

/** Resolve the ISO alpha-2 country code for an opponent team, if we know it. */
export function opponentCountryCode(name?: string): string | undefined {
  return COUNTRY_BY_TEAM[normalizeTeamName(name)];
}
