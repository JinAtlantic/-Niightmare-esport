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
import { hasMatchSchedulePayload } from "./matchSchedule";

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

async function hasColumns(db: SupabaseClient, table: string, columns: string): Promise<boolean> {
  const { error } = await db.from(table).select(columns).limit(1);
  return !error;
}

function omitKeys(rows: Record<string, unknown>[], keys: string[]) {
  return rows.map((row) => {
    const next = { ...row };
    for (const key of keys) delete next[key];
    return next;
  });
}

function hasAnyValue(rows: Record<string, unknown>[], keys: string[]) {
  return rows.some((row) =>
    keys.some((key) => {
      const value = row[key];
      return value !== null && value !== undefined && String(value).trim() !== "";
    })
  );
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
      const players = [
        ...playerRows(r.mlbb?.players ?? [], "mlbb"),
        ...playerRows(r.efootball?.players ?? [], "efootball"),
      ];
      const members = memberRows(r.staff ?? []);
      const playerProfileColumns = ["birth_date", "country_code", "country_en", "country_lo"];
      const memberProfileColumns = ["country_code", "country_en", "country_lo"];
      const playersHaveProfileColumns = await hasColumns(db, "players", playerProfileColumns.join(","));
      const membersHaveProfileColumns = await hasColumns(db, "members", memberProfileColumns.join(","));
      if (!playersHaveProfileColumns && hasAnyValue(players, playerProfileColumns)) {
        throw new Error("Supabase players profile columns are missing. Run supabase/schema.sql before saving birth date or flag fields.");
      }
      if (!membersHaveProfileColumns && hasAnyValue(members, memberProfileColumns)) {
        throw new Error("Supabase members profile columns are missing. Run supabase/schema.sql before saving staff flag fields.");
      }
      await replaceTable(
        db,
        "players",
        playersHaveProfileColumns ? players : omitKeys(players, playerProfileColumns)
      );
      await replaceTable(
        db,
        "members",
        membersHaveProfileColumns ? members : omitKeys(members, memberProfileColumns)
      );
    } else if (key === "matches") {
      const m = value as { matches?: Match[]; tournaments?: Tournament[] };
      const rows = matchRows(m.matches ?? []);
      const matchesHaveVodColumns = await hasColumns(db, "matches", "vods");
      if (!matchesHaveVodColumns && hasAnyValue(rows, ["vods"])) {
        throw new Error("Supabase matches.vods column is missing. Run supabase/schema.sql before saving multiple VOD links.");
      }
      // `bo` degrades silently: if the column hasn't been added yet, drop it so
      // the rest of the match still saves instead of 500-ing the whole editor.
      const matchesHaveBo = await hasColumns(db, "matches", "bo");
      const matchDropKeys = [
        ...(matchesHaveVodColumns ? [] : ["vods"]),
        ...(matchesHaveBo ? [] : ["bo"]),
      ];
      await replaceTable(db, "matches", matchDropKeys.length ? omitKeys(rows, matchDropKeys) : rows);
      await replaceTable(db, "tournaments", tournamentRows(m.tournaments ?? []));
    } else if (key === "news") {
      const n = value as { articles?: NewsArticle[] };
      await replaceTable(db, "news", newsRows(n.articles ?? []));
    } else if (key === "sponsors") {
      const sp = value as { sponsors?: Sponsor[]; tiers?: SponsorTier[] };
      await replaceTable(db, "sponsors", sponsorRows(sp.sponsors ?? []));
      await replaceTable(db, "sponsor_tiers", tierRows(sp.tiers ?? []));
    } else if (key === "achievements") {
      const { error } = await db.from("site_settings").upsert({
        id: 1,
        achievements: value,
      });
      if (error) throw new Error(`site_settings achievements: ${error.message}`);
    } else if (key === "site") {
      const site = value as SiteShape;
      const um = site.upcomingMatch;
      if (um) {
        const upRow: Record<string, unknown> = {
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
          opponent_abbr: s(um.opponentAbbr),
          stream_url: s(um.streamUrl),
        };
        // Only send optional columns when they exist — an upsert with an unknown
        // column fails wholesale, unlike the graceful drop used for matches.
        if (await hasColumns(db, "upcoming_match", "bo")) upRow.bo = s(um.bo);
        if (await hasColumns(db, "upcoming_match", "has_live")) upRow.has_live = !!um.hasLive;
        if (await hasColumns(db, "upcoming_match", "result")) upRow.result = s(um.result);
        if (await hasColumns(db, "upcoming_match", "score")) upRow.score = s(um.score);
        const { error } = await db.from("upcoming_match").upsert(upRow);
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
        shop: site.shop ?? null,
      };
      if (hasMatchSchedulePayload(site.matchSchedule)) {
        siteSettingsRow.match_schedule = site.matchSchedule ?? null;
      }
      // Guarded: the column may not exist yet — writing an unknown column fails
      // the whole upsert, so only send it once the column is present.
      if (await hasColumns(db, "site_settings", "last_result")) {
        siteSettingsRow.last_result = site.lastResult ?? null;
      }
      const { error } = await db.from("site_settings").upsert(siteSettingsRow);
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
