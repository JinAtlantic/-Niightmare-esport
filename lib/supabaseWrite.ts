import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { writeSection } from "./store";
import {
  playerRows,
  memberRows,
  matchRows,
  tournamentRows,
  newsRows,
  tierRows,
  sponsorRows,
  s,
  en,
  lo,
  type SiteShape,
} from "./migrate";
import type {
  Player,
  StaffMember,
  Match,
  Tournament,
  NewsArticle,
  Sponsor,
  SponsorTier,
} from "./types";
import type { ContentKey } from "./store";

const NONE = "00000000-0000-0000-0000-000000000000";

/** Replace a whole table with the given rows (clear, then insert). */
async function replaceTable(db: SupabaseClient, table: string, rows: Record<string, unknown>[]) {
  const { error: delErr } = await db.from(table).delete().neq("id", NONE);
  if (delErr) throw new Error(`clear ${table}: ${delErr.message}`);
  if (rows.length) {
    const { error } = await db.from(table).insert(rows);
    if (error) throw new Error(`insert ${table}: ${error.message}`);
  }
}

/**
 * Write one content section straight to Supabase — the admin save path once the
 * site reads from Supabase. Each section maps to its table(s); list-backed
 * sections are replaced wholesale, the single-row config sections are upserted.
 */
export async function writeSectionToSupabase(
  key: ContentKey,
  value: unknown
): Promise<{ ok: boolean; error?: string }> {
  const db = getSupabaseAdmin();
  if (!db) return { ok: false, error: "Supabase service role not configured" };

  try {
    if (key === "roster") {
      const r = value as {
        mlbb?: { players?: Player[] };
        efootball?: { players?: Player[] };
        staff?: StaffMember[];
      };
      await replaceTable(db, "players", [
        ...playerRows(r.mlbb?.players ?? [], "mlbb"),
        ...playerRows(r.efootball?.players ?? [], "efootball"),
      ]);
      await replaceTable(db, "members", memberRows(r.staff ?? []));
    } else if (key === "matches") {
      const m = value as { matches?: Match[]; tournaments?: Tournament[] };
      await replaceTable(db, "matches", matchRows(m.matches ?? []));
      await replaceTable(db, "tournaments", tournamentRows(m.tournaments ?? []));
    } else if (key === "news") {
      const n = value as { articles?: NewsArticle[] };
      await replaceTable(db, "news", newsRows(n.articles ?? []));
    } else if (key === "sponsors") {
      const sp = value as { sponsors?: Sponsor[]; tiers?: SponsorTier[] };
      await replaceTable(db, "sponsors", sponsorRows(sp.sponsors ?? []));
      await replaceTable(db, "sponsor_tiers", tierRows(sp.tiers ?? []));
    } else if (key === "site") {
      const site = value as SiteShape;
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
          opponent: s(um.opponent),
          opponent_logo: s(um.opponentLogo),
          stream_url: s(um.streamUrl),
        });
        if (error) throw new Error(`upcoming_match: ${error.message}`);
      }
      const c = site.contact ?? {};
      const { error } = await db.from("site_settings").upsert({
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
      });
      if (error) throw new Error(`site_settings: ${error.message}`);
    }
    try {
      await writeSection(key, value);
    } catch {
      // Supabase remains the source of truth for list/table data. The Blob copy
      // preserves page-level JSON copy when cloud storage is configured.
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}
