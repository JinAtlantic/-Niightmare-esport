export type Lang = "en" | "lo";

export interface Bilingual {
  en: string;
  lo: string;
}

export interface Socials {
  whatsapp?: string;
  youtube?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
}

export interface NewsArticle {
  id: number;
  date: string;
  tag: Bilingual;
  title: Bilingual;
  excerpt: Bilingual;
  link: string;
}

export interface Player {
  id: string;
  /** Optional jersey number. When absent the card falls back to an IGN monogram. */
  jersey?: string;
  ign: string;
  name?: string;
  role: Bilingual;
  /** Optional short career bio shown in the profile modal's ABOUT section. */
  description?: Bilingual;
  /** Optional ISO date (YYYY-MM-DD). Used to show birth date and calculated age. */
  birthDate?: string;
  /** Optional ISO-3166 alpha-2 country code (LA, PH, TH...) rendered as a flag. */
  countryCode?: string;
  /** Optional country label shown beside the flag. */
  country?: Bilingual;
  /** Marks a substitute player (shows a SUB badge). */
  sub?: boolean;
  /** Optional player photo (e.g. "/players/phantom.png"). Falls back to a monogram. */
  photo?: string;
  /** Admin-controlled crop for the photo: zoom (scale, 1 = fit) and focal
   *  point x/y as percentages (0–100). */
  photoCrop?: { zoom: number; x: number; y: number };
  /** Legacy FMVP value kept only so older saved roster JSON/DB rows are not
   *  destroyed during admin saves. No longer shown on the public roster UI. */
  fmvp?: string;
  /** Roster tenure periods shown in the profile modal — a list of { joined,
   *  left? } spans, since some players leave and return. An empty `left` reads
   *  as "Present". Persisted as JSON in the legacy gear_device column (no
   *  schema migration). */
  tenures?: { joined: string; left?: string }[];
  /** Optional contact email; when set, the profile modal shows a copy button. */
  email?: string;
  /** Optional Liquipedia profile URL; when set, the profile modal shows a
   *  "Liquipedia" link. Persisted in the legacy gear_audio column (no schema
   *  migration). */
  liquipedia?: string;
  socials: Socials;
}

/**
 * Official position key. Drives the Operations & Management hierarchy rows
 * (executive → operations → technical/support) independently of the free-text
 * display `role`. Legacy entries without it fall back to keyword inference.
 */
export type StaffRole =
  // Tier 1 — executive
  | "owner"
  | "founder"
  | "ceo"
  // Tier 2 — operations / leadership
  | "manager"
  | "head_coach"
  | "coach"
  | "analyst"
  // Tier 3 — technical / support
  | "developer"
  | "designer"
  | "content"
  | "other";

export interface StaffMember {
  id: string;
  /** Optional handle/nickname. The card shows the real name when present. */
  ign?: string;
  name?: string;
  role: Bilingual;
  /** Official position used to place the member in the management hierarchy. */
  officialRole?: StaffRole;
  /** When set, this member is a coach shown under that game's lineup (MLBB /
   *  eFootball) instead of the back-office group. Unset = back-office staff. */
  game?: GameId;
  /** Explicit back-office row: 1 executive, 2 operations, 3 technical. When
   *  unset, the row is inferred from officialRole. Ignored for game coaches. */
  tier?: 1 | 2 | 3;
  /** Optional direct business email. Falls back to the club's contact email. */
  email?: string;
  /** Optional ISO-3166 alpha-2 country code (LA, PH, TH...) rendered as a flag. */
  countryCode?: string;
  /** Optional country label shown beside the flag. */
  country?: Bilingual;
  /** Optional short responsibility / bio shown in the staff modal. */
  bio?: Bilingual;
  /** Optional staff photo (e.g. "/staff/coach.png"). Falls back to a monogram. */
  photo?: string;
  socials: Socials;
}

export type GameId = "mlbb" | "efootball";
export type MatchResult = "win" | "loss" | "draw";

/** State of the headline fixture shown on the home page. */
export type MatchStatus = "next" | "live" | "practice";

export interface MatchVod {
  /** "series" = one video covers the whole match/series, "game" = one game only. */
  type: "series" | "game";
  /** Required when type is "game" so the UI can label Game 1 / Game 2 / Game 3. */
  game?: number;
  url: string;
}

export interface UpcomingMatch {
  /** Drives the badge + styling: upcoming, currently live, or scrim/practice block. */
  status: MatchStatus;
  /** ISO datetime with offset, e.g. "2025-06-20T19:00:00+07:00". */
  date: string;
  game: GameId;
  /** Tournament / event name. */
  tournament: Bilingual;
  /** Optional stage/round (e.g. Semi Final). */
  round?: Bilingual;
  /** Optional series format label ("BO1" | "BO3" | "BO5" …). Empty = not shown. */
  bo?: string;
  opponent: string;
  /** Optional opponent logo (e.g. "/teams/vipers.png"); falls back to a monogram. */
  opponentLogo?: string;
  /** Optional 3-letter opponent short code, shown in the crest when no logo is
   *  set. Empty falls back to initials derived from the opponent name. */
  opponentAbbr?: string;
  /** Optional live-stream URL (YouTube/Facebook). When set + status "live",
   *  the home hero shows a WATCH LIVE button. */
  streamUrl?: string;
}

export interface Match {
  id: string;
  date: string;
  game: GameId;
  tournament: Bilingual;
  /** Optional stage/round within the tournament (e.g. Group Stage, Grand Final). */
  round?: Bilingual;
  /** Optional series format label ("BO1" | "BO3" | "BO5" …). Empty = not shown. */
  bo?: string;
  opponent: string;
  /** Optional path/URL to the opponent's logo (e.g. "/teams/dragon-force.png").
   *  When absent the row falls back to an initials monogram. */
  opponentLogo?: string;
  /** Optional 3-letter opponent short code, shown in the crest when no logo is
   *  set. Empty falls back to initials derived from the opponent name. */
  opponentAbbr?: string;
  score: string;
  result: MatchResult;
  /** Legacy single VOD link kept for old saved data. New edits should use `vods`. */
  vod: string | null;
  /** Multiple VOD links per match, e.g. Full Match plus Game 1 / Game 2 / Game 3. */
  vods?: MatchVod[];
}

export interface Tournament {
  id: string;
  name: Bilingual;
  game: GameId;
  placement: Bilingual;
  prize: string;
  season: string;
}

export interface Sponsor {
  id: string;
  name: string;
  url: string;
  /** Optional sponsor logo URL uploaded from admin. */
  logo?: string;
}

export interface SponsorTier {
  id: string;
  name: Bilingual;
  color: string;
  benefits: Bilingual[];
}

// ── Achievements page (static, sourced from Liquipedia) ──────────────────
export type TournamentTier = "S" | "A" | "B" | "C";
export type Medal = "gold" | "silver" | "bronze";
export type PlacementSummaryTier = TournamentTier | "Total";

/** Big tale-of-the-tape number on the Achievements hero. */
export interface AchievementStat {
  id: string;
  value: string;
  label: Bilingual;
  detail: Bilingual;
}

/** A first-place title shown in the Trophy Cabinet. */
export interface Trophy {
  tournament: string;
  date: string;
  result: string;
  opponent: string;
  prize: string;
  tier: TournamentTier;
}

/** Liquipedia Placement Summary row. */
export interface PlacementSummaryRow {
  tier: PlacementSummaryTier;
  first: number;
  second: number;
  third: number;
  top3: number;
  all: number;
}

/** One result on the Campaign timeline. */
export interface CampaignEntry {
  date: string;
  tournament: string;
  place: string;
  medal: Medal | null;
  tier: TournamentTier;
  result: string;
  opponent: string;
  prize: string;
  worlds: boolean;
}

/** A past player in the Legacy roll. */
export interface FormerPlayer {
  ign: string;
  name: string;
  role: string;
  joined: string;
  left: string;
  note: string;
}

/** A past staff member shown in the Achievements legacy view. */
export interface AchievementStaff {
  ign: string;
  role: Bilingual;
  since: string;
}

export interface AchievementsData {
  page: { kicker: Bilingual; title: Bilingual; intro: Bilingual };
  stats: AchievementStat[];
  trophies: Trophy[];
  placementSummary?: PlacementSummaryRow[];
  campaign: CampaignEntry[];
  formerPlayers: FormerPlayer[];
  staff: AchievementStaff[];
}
