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
  description?: Bilingual;
  /** Marks a substitute player (shows a SUB badge). */
  sub?: boolean;
  /** Optional player photo (e.g. "/players/phantom.png"). Falls back to a monogram. */
  photo?: string;
  /** Admin-controlled crop for the photo: zoom (scale, 1 = fit) and focal
   *  point x/y as percentages (0–100). */
  photoCrop?: { zoom: number; x: number; y: number };
  socials: Socials;
}

export interface StaffMember {
  id: string;
  /** Optional handle/nickname. The card shows the real name when present. */
  ign?: string;
  name?: string;
  role: Bilingual;
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
