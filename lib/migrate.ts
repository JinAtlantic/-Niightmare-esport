import "server-only";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { readAll } from "./store";
import { staffRoleKey } from "./staff";
import type {
  AchievementsData,
  Player,
  StaffMember,
  Match,
  Tournament,
  NewsArticle,
  Sponsor,
  SponsorTier,
  UpcomingMatch,
  Bilingual,
} from "./types";
import type { AboutUsContent } from "./about";
import type { RoadmapContent } from "./roadmap";
import type { MatchScheduleContent } from "./matchSchedule";
import type { ShopContent } from "./shop";
import { cleanMatchVods } from "./matchVods";

/**
 * One-time (re-runnable) migration of the current Vercel-Blob content into the
 * Supabase tables. Runs server-side with the service role. It clears each
 * content table then re-inserts from the live store, so Supabase becomes a
 * faithful copy of what's on the site right now. Safe to run again.
 */

export const s = (v?: string | null) => (v && String(v).trim() ? String(v).trim() : null);
export const en = (b?: Bilingual) => s(b?.en);
export const lo = (b?: Bilingual) => s(b?.lo);

export function playerRows(players: Player[], game: string) {
  return players.map((p, i) => ({
    game,
    ign: s(p.ign),
    name: s(p.name),
    jersey: s(p.jersey),
    role_en: en(p.role),
    role_lo: lo(p.role),
    description_en: en(p.description),
    description_lo: lo(p.description),
    birth_date: s(p.birthDate),
    country_code: s(p.countryCode)?.toUpperCase() ?? null,
    country_en: en(p.country),
    country_lo: lo(p.country),
    is_sub: !!p.sub,
    photo: s(p.photo),
    photo_zoom: p.photoCrop?.zoom ?? 1,
    photo_x: p.photoCrop?.x ?? 50,
    photo_y: p.photoCrop?.y ?? 50,
    win_rate: s(p.fmvp), // legacy column name, now holds the FMVP count
    // legacy column — now holds the roster tenure periods as a JSON array
    gear_device: p.tenures?.length ? JSON.stringify(p.tenures) : null,
    gear_audio: s(p.liquipedia), // legacy column — now holds the Liquipedia URL
    email: s(p.email),
    facebook: s(p.socials?.facebook),
    instagram: s(p.socials?.instagram),
    youtube: s(p.socials?.youtube),
    tiktok: s(p.socials?.tiktok),
    whatsapp: s(p.socials?.whatsapp),
    sort_order: i,
  }));
}

export function memberRows(staff: StaffMember[]) {
  return staff.map((m, i) => ({
    name: s(m.name),
    nickname: s(m.ign),
    // Persist the resolved role so official_role is never empty: use the chosen
    // value, else the one inferred from the display role (what the admin dropdown
    // already shows). Keeps the DB explicit instead of relying on render-time guesses.
    official_role: s(m.officialRole) ?? staffRoleKey(m),
    game: s(m.game),
    tier: m.tier ?? null,
    role_en: en(m.role),
    role_lo: lo(m.role),
    bio_en: en(m.bio),
    bio_lo: lo(m.bio),
    country_code: s(m.countryCode)?.toUpperCase() ?? null,
    country_en: en(m.country),
    country_lo: lo(m.country),
    email: s(m.email),
    photo: s(m.photo),
    facebook: s(m.socials?.facebook),
    instagram: s(m.socials?.instagram),
    youtube: s(m.socials?.youtube),
    tiktok: s(m.socials?.tiktok),
    whatsapp: s(m.socials?.whatsapp),
    sort_order: i,
  }));
}

export function matchRows(matches: Match[]) {
  return matches.map((m, i) => ({
    match_date: s(m.date),
    game: s(m.game),
    tournament_en: en(m.tournament),
    tournament_lo: lo(m.tournament),
    round_en: en(m.round),
    round_lo: lo(m.round),
    bo: s(m.bo),
    opponent: s(m.opponent),
    opponent_logo: s(m.opponentLogo),
    opponent_abbr: s(m.opponentAbbr),
    score: s(m.score),
    result: s(m.result),
    vod: s(m.vod),
    vods: cleanMatchVods(m.vods),
    sort_order: i,
  }));
}

export function tournamentRows(tournaments: Tournament[]) {
  return tournaments.map((t, i) => ({
    name_en: en(t.name),
    name_lo: lo(t.name),
    game: s(t.game),
    placement_en: en(t.placement),
    placement_lo: lo(t.placement),
    prize: s(t.prize),
    season: s(t.season),
    sort_order: i,
  }));
}

export function newsRows(articles: NewsArticle[]) {
  return articles.map((a, i) => ({
    news_date: s(a.date),
    tag_en: en(a.tag),
    tag_lo: lo(a.tag),
    title_en: en(a.title),
    title_lo: lo(a.title),
    excerpt_en: en(a.excerpt),
    excerpt_lo: lo(a.excerpt),
    link: s(a.link),
    sort_order: i,
  }));
}

export function tierRows(tiers: SponsorTier[]) {
  return tiers.map((t, i) => ({
    name_en: en(t.name),
    name_lo: lo(t.name),
    color: s(t.color),
    benefits: t.benefits ?? [],
    sort_order: i,
  }));
}

export function sponsorRows(sponsors: Sponsor[]) {
  return sponsors.map((sp, i) => ({
    name: s(sp.name),
    url: s(sp.url),
    logo: s(sp.logo),
    category: sp.category ?? null,
    description: sp.description ?? null,
    socials: sp.socials ?? null,
    sort_order: i,
  }));
}

export interface SiteShape {
  team?: { name?: string; fullName?: string; region?: Bilingual };
  contact?: Record<string, string>;
  communityUrl?: string;
  formspreeEndpoint?: string;
  mediaKitUrl?: string;
  upcomingMatch?: UpcomingMatch;
  /** Most-recent finished fixture (shown faded once the headline advances). */
  lastResult?: UpcomingMatch;
  aboutUs?: AboutUsContent;
  roadmap?: RoadmapContent;
  matchSchedule?: MatchScheduleContent;
  shop?: ShopContent;
}

export interface MigrateResult {
  ok: boolean;
  error?: string;
  counts?: Record<string, number>;
}

export async function migrateAll(): Promise<MigrateResult> {
  // Migrate (Blob → Supabase) is RETIRED: Vercel Blob is gone and Supabase is
  // the source of truth. Re-running it would wipe every table and re-insert the
  // bundled seed (readAll now returns the seed) → data loss. Hard-disabled.
  const MIGRATE_DISABLED = true;
  if (MIGRATE_DISABLED) {
    return { ok: false, error: "Migrate is disabled — Supabase is the source of truth; admin edits save directly." };
  }

  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: "Supabase service role not configured" };

  const content = (await readAll()) as Record<string, unknown>;
  const roster = (content.roster ?? {}) as {
    mlbb?: { players?: Player[] };
    efootball?: { players?: Player[] };
    staff?: StaffMember[];
  };
  const matchesFile = (content.matches ?? {}) as { matches?: Match[]; tournaments?: Tournament[] };
  const newsFile = (content.news ?? {}) as { articles?: NewsArticle[] };
  const sponsorsFile = (content.sponsors ?? {}) as { sponsors?: Sponsor[]; tiers?: SponsorTier[] };
  const site = (content.site ?? {}) as SiteShape;
  const achievements = content.achievements as AchievementsData | undefined;

  const players = [
    ...playerRows(roster.mlbb?.players ?? [], "mlbb"),
    ...playerRows(roster.efootball?.players ?? [], "efootball"),
  ];
  const members = memberRows(roster.staff ?? []);
  const matches = matchRows(matchesFile.matches ?? []);
  const tournaments = tournamentRows(matchesFile.tournaments ?? []);
  const articles = newsRows(newsFile.articles ?? []);
  const tiers = tierRows(sponsorsFile.tiers ?? []);
  const sponsors = sponsorRows(sponsorsFile.sponsors ?? []);

  const NONE = "00000000-0000-0000-0000-000000000000";
  try {
    // Clear (sponsors before tiers for the FK), then re-insert fresh.
    for (const table of ["sponsors", "players", "members", "matches", "tournaments", "news", "sponsor_tiers"]) {
      const { error } = await db.from(table).delete().neq("id", NONE);
      if (error) throw new Error(`clear ${table}: ${error.message}`);
    }

    const inserts: [string, Record<string, unknown>[]][] = [
      ["players", players],
      ["members", members],
      ["matches", matches],
      ["tournaments", tournaments],
      ["news", articles],
      ["sponsor_tiers", tiers],
      ["sponsors", sponsors],
    ];
    for (const [table, rows] of inserts) {
      if (!rows.length) continue;
      const { error } = await db.from(table).insert(rows);
      if (error) throw new Error(`insert ${table}: ${error.message}`);
    }

    // Single-row config tables.
    const um = site.upcomingMatch;
    if (um) {
      const { error } = await db.from("upcoming_match").upsert({
        id: 1,
        status: s(um.status),
        match_date: s(um.date),
        game: s(um.game),
        tournament_en: en(um.tournament),
        tournament_lo: lo(um.tournament),
        round_en: en(um.round),
        round_lo: lo(um.round),
        bo: s(um.bo),
        opponent: s(um.opponent),
        opponent_logo: s(um.opponentLogo),
        opponent_abbr: s(um.opponentAbbr),
        stream_url: s(um.streamUrl),
        has_live: !!um.hasLive,
        result: s(um.result),
        score: s(um.score),
      });
      if (error) throw new Error(`upcoming_match: ${error.message}`);
    }
    const c = site.contact ?? {};
    const siteSettingsRow: Record<string, unknown> = {
      id: 1,
      team_name: s(site.team?.name),
      team_full_name: s(site.team?.fullName),
      region_en: en(site.team?.region),
      region_lo: lo(site.team?.region),
      email: s(c.email),
      facebook: s(c.facebook),
      instagram: s(c.instagram),
      youtube: s(c.youtube),
      tiktok: s(c.tiktok),
      discord: s(c.discord),
      community_url: s(site.communityUrl),
      formspree_endpoint: s(site.formspreeEndpoint),
      media_kit_url: s(site.mediaKitUrl),
      about_us: site.aboutUs ?? null,
      roadmap: site.roadmap ?? null,
      match_schedule: site.matchSchedule ?? null,
      last_result: site.lastResult ?? null,
      shop: site.shop ?? null,
      achievements: achievements ?? null,
    };
    const { error: siteErr } = await db.from("site_settings").upsert(siteSettingsRow);
    if (siteErr) throw new Error(`site_settings: ${siteErr.message}`);

    return {
      ok: true,
      counts: {
        players: players.length,
        members: members.length,
        matches: matches.length,
        tournaments: tournaments.length,
        news: articles.length,
        sponsor_tiers: tiers.length,
        sponsors: sponsors.length,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Migration failed" };
  }
}
