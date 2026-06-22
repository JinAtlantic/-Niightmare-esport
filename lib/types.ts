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
  /** Marks a substitute player (shows a SUB badge). */
  sub?: boolean;
  /** Optional player photo (e.g. "/players/phantom.png"). Falls back to a monogram. */
  photo?: string;
  /** Admin-controlled crop for the photo: zoom (scale, 1 = fit) and focal
   *  point x/y as percentages (0–100). */
  photoCrop?: { zoom: number; x: number; y: number };
  /** Optional FMVP / finals-MVP count shown in the profile modal (free text,
   *  e.g. "3×"). Empty falls back to a "no titles yet" placeholder.
   *  Persisted in the legacy `win_rate` DB column (no schema migration). */
  fmvp?: string;
  /** Optional contact email; when set, the profile modal shows a copy button. */
  email?: string;
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
  /** Optional direct business email. Falls back to the club's contact email. */
  email?: string;
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
  opponent: string;
  /** Optional opponent logo (e.g. "/teams/vipers.png"); falls back to a monogram. */
  opponentLogo?: string;
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
  opponent: string;
  /** Optional path/URL to the opponent's logo (e.g. "/teams/dragon-force.png").
   *  When absent the row falls back to an initials monogram. */
  opponentLogo?: string;
  score: string;
  result: MatchResult;
  vod: string | null;
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

/** A coach in the Achievements staff strip. */
export interface AchievementStaff {
  ign: string;
  role: Bilingual;
  since: string;
}

export interface AchievementsData {
  page: { kicker: Bilingual; title: Bilingual; intro: Bilingual };
  stats: AchievementStat[];
  trophies: Trophy[];
  campaign: CampaignEntry[];
  formerPlayers: FormerPlayer[];
  staff: AchievementStaff[];
}
