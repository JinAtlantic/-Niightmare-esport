import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SOURCE_URL = "https://liquipedia.net/mobilelegends/Niightmare_Esports/Played_Matches?action=render";
const APPLY = process.argv.includes("--apply");

function loadEnvFile(path = ".env.local") {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function text(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&#58;/g, ":")
    .replace(/&#95;/g, "_")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function attrs(value = "") {
  const out = {};
  value.replace(/([\w:-]+)="([^"]*)"/g, (_, key, val) => {
    out[key] = val.replace(/&amp;/g, "&");
    return "";
  });
  return out;
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(esports?|gaming|team)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeScore(value = "") {
  return String(value).replace(/\s+/g, "").replace(/:/g, "-");
}

function dateFromTimestamp(timestamp) {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return "";
  return new Date(value * 1000).toISOString().slice(0, 10);
}

async function loadLiquipediaRows() {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "NiightmareEsportWebsite/1.0 (contact@niightmare.gg)" },
  });
  if (!res.ok) throw new Error(`Liquipedia request failed: ${res.status}`);
  const html = await res.text();
  const rows = [...html.matchAll(/<tr class="table2&#95;&#95;row--body[^>]*>(.*?)<\/tr>/gs)];

  return rows
    .map((row) => {
      const cells = [...row[1].matchAll(/<td\b([^>]*)>(.*?)<\/td>/gs)].map((cell) => ({
        attr: attrs(cell[1]),
        html: cell[2],
      }));
      if (cells.length < 8) return null;

      const vods = [...cells[7].html.matchAll(/<span class="plainlinks vodlink" title="([^"]*)"><a href="([^"]*)"/g)]
        .map((match) => {
          const game = match[1].match(/Game\s*(\d+)/i)?.[1];
          return {
            type: game ? "game" : "series",
            ...(game ? { game: Number(game) } : {}),
            url: match[2].replace(/&amp;/g, "&"),
          };
        })
        .filter((vod) => vod.url);

      if (!vods.length) return null;

      return {
        date: dateFromTimestamp(cells[0].attr["data-sort-value"]),
        tournament: text(cells[3].html),
        opponent: cells[6].attr["data-sort-value"] || text(cells[6].html),
        score: normalizeScore(text(cells[5].html)),
        vods,
      };
    })
    .filter(Boolean);
}

function matchLiquipediaRow(match, sourceRows) {
  const date = String(match.match_date ?? "");
  const opponent = normalize(match.opponent);
  const score = normalizeScore(match.score);
  const tournament = normalize(match.tournament_en);

  const hardMatch = sourceRows.find((row) => {
    if (row.date && date && row.date !== date) return false;
    if (score && row.score && score !== row.score) return false;
    const sourceOpponent = normalize(row.opponent);
    if (opponent && sourceOpponent && opponent !== sourceOpponent) return false;
    return true;
  });
  if (hardMatch) return hardMatch;

  return sourceRows.find((row) => {
    if (row.date && date && row.date !== date) return false;
    const sourceOpponent = normalize(row.opponent);
    if (opponent && sourceOpponent && opponent !== sourceOpponent) return false;
    const sourceTournament = normalize(row.tournament);
    return !tournament || !sourceTournament || sourceTournament.includes(tournament) || tournament.includes(sourceTournament);
  });
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRole) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
const sourceRows = await loadLiquipediaRows();
const { data: matches, error } = await db
  .from("matches")
  .select("id,match_date,tournament_en,opponent,score,vod")
  .eq("game", "mlbb");
if (error) throw new Error(error.message);

const updates = [];
const misses = [];
for (const match of matches ?? []) {
  const source = matchLiquipediaRow(match, sourceRows);
  if (!source) {
    misses.push(match);
    continue;
  }
  updates.push({
    id: match.id,
    opponent: match.opponent,
    tournament: match.tournament_en,
    date: match.match_date,
    vods: source.vods,
  });
}

console.log(`Liquipedia VOD rows: ${sourceRows.length}`);
console.log(`Matched local matches: ${updates.length}`);
console.log(`Unmatched local MLBB matches: ${misses.length}`);

for (const update of updates) {
  console.log(`${update.date} | ${update.tournament} | ${update.opponent} | ${update.vods.map((vod) => vod.type === "game" ? `Game ${vod.game}` : "Full Match").join(", ")}`);
}

if (!APPLY) {
  console.log("Dry run only. Re-run with --apply after the matches.vods SQL migration is live.");
  process.exit(0);
}

for (const update of updates) {
  const { error: updateError } = await db
    .from("matches")
    .update({
      vod: update.vods[0]?.url ?? null,
      vods: update.vods,
    })
    .eq("id", update.id);
  if (updateError) throw new Error(`Update ${update.id}: ${updateError.message}`);
}

console.log(`Applied VOD updates: ${updates.length}`);
