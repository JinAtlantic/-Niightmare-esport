export type Lang = "en" | "lo";

export interface Bilingual {
  en: string;
  lo: string;
}

export interface Socials {
  youtube?: string;
  facebook?: string;
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
  jersey: string;
  ign: string;
  name?: string;
  role: Bilingual;
  description?: Bilingual;
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
