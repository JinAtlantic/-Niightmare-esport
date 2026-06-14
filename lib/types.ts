export type Lang = "en" | "lo";

export interface Bilingual {
  en: string;
  lo: string;
}

export interface Socials {
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
  socials: Socials;
}

export interface StaffMember {
  id: string;
  ign: string;
  name?: string;
  role: Bilingual;
  socials: Socials;
}

export type GameId = "mlbb" | "efootball";
export type MatchResult = "win" | "loss" | "draw";

export interface Match {
  id: string;
  date: string;
  game: GameId;
  tournament: Bilingual;
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
