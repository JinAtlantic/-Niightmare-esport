import "server-only";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { rowToStaff, type MemberRow } from "./members";
import rosterSeed from "@/data/roster.json";
import matchesSeed from "@/data/matches.json";
import newsSeed from "@/data/news.json";
import sponsorsSeed from "@/data/sponsors.json";
import siteSeed from "@/data/site.json";
import achievementsSeed from "@/data/achievements.json";
import type { Player, Socials } from "./types";

/**
 * Assemble the full site content object from Supabase, in the exact shape the
 * client ContentProvider already expects ({ matches, roster, sponsors, news,
 * site }). This is the read side of the Vercel-Blob → Supabase move: only the
 * SOURCE changes, every downstream component keeps using useContent() unchanged.
 *
 * Returns null when Supabase isn't configured or a query fails, so /api/content
 * can fall back to the bundled/Blob store and the site never goes blank.
 */

const val = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
const bi = (en?: string | null, lo?: string | null) => ({ en: en ?? "", lo: lo ?? "" });
const optBi = (en?: string | null, lo?: string | null) =>
  en || lo ? { en: en ?? "", lo: lo ?? "" } : undefined;

function socials(r: Record<string, unknown>): Socials {
  const out: Socials = {};
  for (const k of ["facebook", "instagram", "youtube", "tiktok", "whatsapp"] as const) {
    const v = val(r[k]);
    if (v) out[k] = v;
  }
  return out;
}

/** Parse the JSON tenure list stored in the legacy gear_device column. */
function parseTenures(v: unknown): { joined: string; left?: string }[] | undefined {
  if (typeof v !== "string" || !v.trim()) return undefined;
  try {
    const arr = JSON.parse(v);
    if (!Array.isArray(arr)) return undefined;
    const out = arr
      .filter((x) => x && typeof x.joined === "string" && x.joined.trim())
      .map((x) => ({ joined: x.joined, ...(x.left ? { left: String(x.left) } : {}) }));
    return out.length ? out : undefined;
  } catch {
    return undefined;
  }
}

function toPlayer(r: Record<string, unknown>): Player {
  return {
    id: String(r.id),
    ign: (r.ign as string) ?? "",
    name: val(r.name),
    jersey: val(r.jersey),
    role: bi(r.role_en as string, r.role_lo as string),
    description: optBi(r.description_en as string, r.description_lo as string),
    sub: r.is_sub ? true : undefined,
    photo: val(r.photo),
    photoCrop:
      r.photo_zoom != null || r.photo_x != null || r.photo_y != null
        ? { zoom: Number(r.photo_zoom ?? 1), x: Number(r.photo_x ?? 50), y: Number(r.photo_y ?? 50) }
        : undefined,
    fmvp: val(r.win_rate), // legacy column name, now holds the FMVP count
    tenures: parseTenures(r.gear_device), // legacy column — JSON tenure periods
    email: val(r.email),
    liquipedia: val(r.gear_audio), // legacy column — now holds the Liquipedia URL
    socials: socials(r),
  };
}

export async function contentFromSupabase(): Promise<Record<string, unknown> | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  try {
    const [players, members, matches, tournaments, news, tiers, sponsors, um, ss] = await Promise.all([
      db.from("players").select("*").order("sort_order", { ascending: true }),
      db.from("members").select("*").order("sort_order", { ascending: true }),
      db.from("matches").select("*").order("sort_order", { ascending: true }),
      db.from("tournaments").select("*").order("sort_order", { ascending: true }),
      db.from("news").select("*").order("sort_order", { ascending: true }),
      db.from("sponsor_tiers").select("*").order("sort_order", { ascending: true }),
      db.from("sponsors").select("*").order("sort_order", { ascending: true }),
      db.from("upcoming_match").select("*").eq("id", 1).maybeSingle(),
      db.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

    const firstError = [players, members, matches, tournaments, news, tiers, sponsors, um, ss].find(
      (r) => r.error
    );
    if (firstError?.error) throw new Error(firstError.error.message);

    // Page-label copy + static fields come from the committed seed, NOT Vercel
    // Blob. Supabase (above) is the live source of truth; the only thing Blob
    // added here was editable label overrides — but the Blob admin editor is
    // gated off in production, and every readAll() costs a `list` advanced
    // operation on each content build. Reading the seed makes that cost zero.
    const storedRoster = rosterSeed as Record<string, unknown>;
    const storedMatches = matchesSeed as Record<string, unknown>;
    const storedNews = newsSeed as Record<string, unknown>;
    const storedSponsors = sponsorsSeed as Record<string, unknown>;
    const storedSite = siteSeed as Record<string, unknown>;

    const all = (players.data ?? []) as Record<string, unknown>[];
    const roster = {
      ...storedRoster,
      mlbb: { players: all.filter((r) => r.game === "mlbb").map(toPlayer) },
      efootball: { players: all.filter((r) => r.game === "efootball").map(toPlayer) },
      staff: ((members.data ?? []) as MemberRow[]).map(rowToStaff),
    };

    const matchesOut = {
      ...storedMatches,
      matches: ((matches.data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        date: (r.match_date as string) ?? "",
        game: r.game,
        tournament: bi(r.tournament_en as string, r.tournament_lo as string),
        round: optBi(r.round_en as string, r.round_lo as string),
        opponent: (r.opponent as string) ?? "",
        opponentLogo: val(r.opponent_logo),
        opponentAbbr: val(r.opponent_abbr),
        score: (r.score as string) ?? "",
        result: r.result,
        vod: (r.vod as string) ?? null,
      })),
      tournaments: ((tournaments.data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        name: bi(r.name_en as string, r.name_lo as string),
        game: r.game,
        placement: bi(r.placement_en as string, r.placement_lo as string),
        prize: (r.prize as string) ?? "",
        season: (r.season as string) ?? "",
      })),
    };

    const newsOut = {
      ...storedNews,
      articles: ((news.data ?? []) as Record<string, unknown>[]).map((r, i) => ({
        id: i + 1,
        date: (r.news_date as string) ?? "",
        tag: bi(r.tag_en as string, r.tag_lo as string),
        title: bi(r.title_en as string, r.title_lo as string),
        excerpt: bi(r.excerpt_en as string, r.excerpt_lo as string),
        link: (r.link as string) ?? "#",
      })),
    };

    const sponsorsOut = {
      ...storedSponsors,
      sponsors: ((sponsors.data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        name: (r.name as string) ?? "",
        url: (r.url as string) ?? "#",
      })),
      tiers: ((tiers.data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        name: bi(r.name_en as string, r.name_lo as string),
        color: (r.color as string) ?? "#A855F7",
        benefits: Array.isArray(r.benefits) ? r.benefits : [],
      })),
    };

    const u = (um.data ?? null) as Record<string, unknown> | null;
    const c = (ss.data ?? {}) as Record<string, unknown>;
    const site = {
      ...storedSite,
      team: {
        name: (c.team_name as string) ?? "NIIGHTMARE",
        fullName: (c.team_full_name as string) ?? "NIIGHTMARE ESPORTS",
        region: bi(c.region_en as string, c.region_lo as string),
      },
      contact: {
        email: val(c.email) ?? "",
        facebook: val(c.facebook) ?? "",
        instagram: val(c.instagram) ?? "",
        youtube: val(c.youtube) ?? "",
        tiktok: val(c.tiktok) ?? "",
        discord: val(c.discord) ?? "",
      },
      communityUrl: val(c.community_url) ?? "",
      formspreeEndpoint: val(c.formspree_endpoint) ?? "",
      mediaKitUrl: val(c.media_kit_url) ?? "",
      // About Us band copy (jsonb). Null/absent → leave undefined so the
      // component falls back to DEFAULT_ABOUT.
      aboutUs: (c.about_us as Record<string, unknown> | null) ?? undefined,
      // Matches-page Niightmare Roadmap popup (jsonb). Null/absent → defaults.
      roadmap: (c.roadmap as Record<string, unknown> | null) ?? undefined,
      upcomingMatch: u
        ? {
            status: u.status,
            date: (u.match_date as string) ?? "",
            game: u.game,
            tournament: bi(u.tournament_en as string, u.tournament_lo as string),
            round: optBi(u.round_en as string, u.round_lo as string),
            opponent: (u.opponent as string) ?? "",
            opponentLogo: val(u.opponent_logo),
            opponentAbbr: val(u.opponent_abbr),
            streamUrl: val(u.stream_url),
          }
        : undefined,
    };

    const achievements = (c.achievements as Record<string, unknown> | null) ?? achievementsSeed;

    return { roster, matches: matchesOut, news: newsOut, sponsors: sponsorsOut, site, achievements };
  } catch {
    return null;
  }
}
