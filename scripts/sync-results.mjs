/**
 * sync-results.mjs — semi-automatic match-result sync from Liquipedia.
 *
 * Reads NIIGHTMARE's played matches from Liquipedia, compares them to what is
 * already live on the site, and reports the NEW results (newer than the latest
 * result already on the site — it never back-fills old matches). It also grabs
 * the per-game VOD links so finished matches get their "Game 1/2/3" videos.
 *
 *   node scripts/sync-results.mjs           # DRY RUN — just prints what's new
 *   node scripts/sync-results.mjs --apply   # publishes the new results live
 *
 * Publishing goes through the site's own admin API (writes Supabase AND
 * revalidates the public pages instantly — no redeploy). The admin session
 * token is minted locally from ADMIN_SECRET in .env.local, so this only works
 * from the owner's machine where that secret lives. Nothing is written unless
 * --apply is passed. Intended to be driven by the /sync-results workflow, which
 * always shows the owner the diff and waits for a "yes" before --apply.
 */
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APPLY = process.argv.includes("--apply");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = process.env.NM_SITE_URL || "https://www.niightmareesport.com";
const LIQ_URL = "https://liquipedia.net/mobilelegends/Niightmare_Esports/Played_Matches?action=render";
const UA = { "User-Agent": "NiightmareEsportWebsite/1.0 (contact@niightmare.gg)" };

// ── env + admin token ────────────────────────────────────────────────────────
function loadEnv(file = path.join(ROOT, ".env.local")) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadEnv();

function mintAdminToken() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("Missing ADMIN_SECRET in .env.local — cannot authenticate to the admin API.");
  const value = String(Date.now());
  const sig = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${sig}`;
}

// ── html helpers (aligned with import-liquipedia-vods.mjs) ───────────────────
function text(v = "") {
  return v
    .replace(/&amp;/g, "&").replace(/&#160;|&nbsp;/g, " ").replace(/&#58;/g, ":")
    .replace(/&#95;/g, "_").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
function attrs(v = "") {
  const out = {};
  v.replace(/([\w:-]+)="([^"]*)"/g, (_, k, val) => { out[k] = val.replace(/&amp;/g, "&"); return ""; });
  return out;
}
function normName(v = "") {
  return String(v).toLowerCase().replace(/&/g, "and")
    .replace(/\b(esports?|gaming|team)\b/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function normScore(v = "") { return String(v).replace(/\s+/g, "").replace(/:/g, "-"); }
function dateFromTs(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Date(n * 1000).toISOString().slice(0, 10);
}

/** Derive win/loss/draw from a score like "2-1", "0-2", "W-FF". */
function resultFromScore(score) {
  const s = normScore(score);
  const m = s.match(/^(\d+)-(\d+)$/);
  if (m) {
    const a = Number(m[1]), b = Number(m[2]);
    return a > b ? "win" : a < b ? "loss" : "draw";
  }
  // walkover / forfeit — a leading W is a win, a leading FF/L is a loss
  if (/^w/i.test(s)) return "win";
  if (/^(ff|l)/i.test(s)) return "loss";
  return "win";
}

// ── fetch ────────────────────────────────────────────────────────────────────
async function fetchLiquipedia() {
  const res = await fetch(LIQ_URL, { headers: UA });
  if (!res.ok) throw new Error(`Liquipedia request failed: ${res.status}`);
  const html = await res.text();
  const rows = [...html.matchAll(/<tr class="table2&#95;&#95;row--body[^>]*>(.*?)<\/tr>/gs)];
  return rows.map((row) => {
    const cells = [...row[1].matchAll(/<td\b([^>]*)>(.*?)<\/td>/gs)].map((c) => ({ attr: attrs(c[1]), html: c[2] }));
    if (cells.length < 8) return null;
    const vods = [...cells[7].html.matchAll(/vodlink" title="([^"]*)"><a href="([^"]*)"/g)].map((m) => {
      const game = m[1].match(/Game\s*(\d+)/i)?.[1];
      return { type: game ? "game" : "series", ...(game ? { game: Number(game) } : {}), url: m[2].replace(/&amp;/g, "&") };
    }).filter((v) => v.url);
    return {
      date: dateFromTs(cells[0].attr["data-sort-value"]),
      tournament: text(cells[3].html),
      score: normScore(text(cells[5].html)),
      opponent: text(cells[6].html) || cells[6].attr["data-sort-value"] || "",
      vods,
    };
  }).filter((r) => r && r.date && r.opponent);
}

async function fetchLiveMatches(token) {
  const res = await fetch(`${SITE}/api/admin/data?file=matches`, { headers: { Cookie: `nm_admin=${token}` } });
  if (res.status === 401) throw new Error("Admin auth rejected (ADMIN_SECRET here may differ from the live site's).");
  if (!res.ok) throw new Error(`Reading live matches failed: ${res.status}`);
  const data = await res.json();
  return { matches: data.matches ?? [], tournaments: data.tournaments ?? [] };
}

// ── diff ─────────────────────────────────────────────────────────────────────
function alreadyOnSite(row, siteMatches) {
  return siteMatches.some((m) => {
    if (String(m.date) !== row.date) return false;
    const oppMatch = normName(m.opponent) === normName(row.opponent);
    const scoreMatch = normScore(m.score) === row.score;
    return oppMatch || scoreMatch; // same date + (same opp OR same score) = same match
  });
}

function toMatch(row) {
  return {
    id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    date: row.date,
    game: "mlbb",
    tournament: { en: row.tournament, lo: row.tournament },
    opponent: row.opponent,
    score: normScore(row.score),
    result: resultFromScore(row.score),
    vod: row.vods[0]?.url ?? null,
    ...(row.vods.length ? { vods: row.vods } : {}),
  };
}

// ── main ─────────────────────────────────────────────────────────────────────
const token = mintAdminToken();
const [liq, live] = await Promise.all([fetchLiquipedia(), fetchLiveMatches(token)]);

const siteMatches = live.matches;
const maxSiteDate = siteMatches.reduce((max, m) => (String(m.date) > max ? String(m.date) : max), "0000-00-00");

// Only consider results on/after the newest one already on the site, so we grab
// fresh matches (including more games the same day) without back-filling history.
const candidates = liq.filter((r) => r.date >= maxSiteDate);
const fresh = candidates.filter((r) => !alreadyOnSite(r, siteMatches));

console.log(`Liquipedia rows: ${liq.length}`);
console.log(`Live matches on site: ${siteMatches.length} (latest: ${maxSiteDate})`);
console.log(`New results to add: ${fresh.length}\n`);

if (!fresh.length) {
  console.log("✓ Up to date — the site already has every recent Liquipedia result. Nothing to publish.");
  process.exit(0);
}

console.log("=== PROPOSED ADDITIONS ===");
for (const r of fresh) {
  const res = resultFromScore(r.score).toUpperCase();
  const vodStr = r.vods.length ? r.vods.map((v) => (v.game ? `G${v.game}` : "Full")).join("/") : "none";
  console.log(`  ${r.date} | ${r.tournament} | NIIGHTMARE ${normScore(r.score)} ${r.opponent} [${res}] | VOD: ${vodStr}`);
}
console.log("");

if (!APPLY) {
  console.log("DRY RUN — nothing written. Re-run with --apply to publish these live.");
  process.exit(0);
}

const merged = { matches: [...siteMatches, ...fresh.map(toMatch)], tournaments: live.tournaments };
const put = await fetch(`${SITE}/api/admin/data?file=matches`, {
  method: "PUT",
  headers: { "Content-Type": "application/json", Cookie: `nm_admin=${token}` },
  body: JSON.stringify(merged),
});
if (!put.ok) {
  console.error(`PUBLISH FAILED: ${put.status} ${(await put.text()).slice(0, 200)}`);
  process.exit(1);
}
console.log(`✓ Published ${fresh.length} new result(s) live. The public site was revalidated — they show now.`);
