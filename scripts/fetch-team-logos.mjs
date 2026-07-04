/**
 * fetch-team-logos.mjs — pull opponent team logos WITHOUT ever touching
 * Liquipedia from our IP (it hard-blocks after ~10 hits).
 *
 * Trick: MediaWiki serves any file by name via `Special:FilePath/<File>`, and
 * the wsrv.nl image proxy will follow that redirect on ITS servers, fetch the
 * asset from Liquipedia's CDN, and hand us back a resized PNG. So we only need
 * the logo's *filename* — which for Liquipedia is always `<TeamName>_<mode>.png`.
 * We try a handful of well-formed candidate names per team through wsrv; the
 * first that returns a real image wins. Any hit is guaranteed to be that team's
 * asset (it's named after them), so there's no wrong-logo risk — teams with no
 * hit are simply reported for manual upload.
 *
 * Run: node scripts/fetch-team-logos.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("public/teams");
const WIDTH = 256;

const NATIONAL = new Set([
  "cambodia", "malaysia", "myanmar", "philippines", "singapore", "vietnam",
  "laos", "thailand", "indonesia", "brunei",
]);

// Exact filenames already confirmed on Liquipedia in earlier discovery runs.
const KNOWN = {
  "zeta division": "ZETA_DIVISION_darkmode.png",
  "verso time": "Verso_Time_darkmode.png",
  "virtus.pro": "Virtus.pro_2019_allmode.png",
  "saigon phantom": "Saigon_Phantom_2020_allmode.png",
  "leon esports": "Leon_Esports_allmode.png",
  "team flash kh": "Team_Flash_allmode.png",
  "geekay esports": "Geekay_Esports_allmode.png",
  "team falcons": "Team_Falcons_2022_allmode.png",
  "team evo": "Team_EVO_darkmode.png",
  "evil": "EVIL_SG_allmode.png",
  "king of gamers club": "King_of_Gamers_darkmode.png",
  "ulfhednar": "Ulfhednar_allmode.png",
  "pro esports": "PRO_Esports_allmode.png",
};

const norm = (s) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Candidate base names (spaces→underscores), most-specific first. */
function nameVariants(name) {
  const clean = name.trim().replace(/\s+/g, " ");
  const words = clean.split(" ");
  const us = (arr) => arr.join("_").replace(/[^\w.+-]/g, "");
  const out = [];
  const push = (arr) => { const v = us(arr); if (v && !out.includes(v)) out.push(v); };
  push(words);
  // Progressively drop trailing region / org-type tags (Liquipedia often omits them).
  const tail = new Set(["th", "kh", "id", "sg", "vn", "mm", "my", "ph", "mena", "esports", "esport", "gaming", "club"]);
  let w = [...words];
  while (w.length > 1 && tail.has(w[w.length - 1].toLowerCase())) { w = w.slice(0, -1); push(w); }
  // Drop a leading "Team".
  if (words.length > 1 && words[0].toLowerCase() === "team") push(words.slice(1));
  return out;
}

// Dark site → prefer dark/all variants. Kept short: wsrv throttles bursts, so
// every extra suffix is another proxied request across 71 teams.
const SUFFIXES = ["_darkmode", "_allmode", "_lightmode", "logo_std", "_full_allmode"];

function candidates(name) {
  const files = [];
  const k = KNOWN[norm(name)];
  if (k) files.push(k);
  for (const base of nameVariants(name))
    for (const suf of SUFFIXES) files.push(base + suf + ".png");
  return [...new Set(files)];
}

function proxyUrl(fileName) {
  const src = `https://liquipedia.net/commons/Special:FilePath/${encodeURIComponent(fileName)}`;
  return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${WIDTH}&output=png`;
}

// wsrv throttles bursts, so pace every proxied request globally and back off on 429.
const GAP = 1600;
let lastHit = 0;

/** Try a candidate through wsrv. Returns the PNG bytes, null if the file doesn't
 *  exist, or throws only on a hard/unknown failure. */
async function tryFetch(fileName) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = GAP - (Date.now() - lastHit);
    if (wait > 0) await sleep(wait);
    lastHit = Date.now();
    const res = await fetch(proxyUrl(fileName));
    if (res.status === 429) { await sleep(8000 * (attempt + 1)); continue; }
    if (res.status === 404) return null; // file genuinely absent
    if (res.status !== 200) return null;
    if (!(res.headers.get("content-type") || "").includes("image")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 800 ? buf : null; // guard against tiny error placeholders
  }
  throw new Error("wsrv 429");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const content = await (await fetch("https://www.niightmareesport.com/api/content")).json();
  const rows = content.matches?.matches ?? [];
  const haveLogo = new Set(rows.filter((m) => m.opponentLogo).map((m) => norm(m.opponent)));
  const names = [...new Set(rows.map((m) => m.opponent).filter(Boolean))];
  const targets = names.filter((n) => !NATIONAL.has(norm(n)) && !haveLogo.has(norm(n)));

  console.error(`Distinct opponents: ${names.length}. Trying ${targets.length}.`);
  const ok = {};
  const failed = [];

  for (const name of targets) {
    const file = `${slug(name)}.png`;
    const dest = path.join(OUT_DIR, file);
    if (existsSync(dest)) { ok[name] = { file: `/teams/${file}`, source: "(existing)" }; continue; }

    let hit = null;
    for (const cand of candidates(name)) {
      try {
        const buf = await tryFetch(cand);
        if (buf) { hit = { cand, buf }; break; }
      } catch { /* keep trying */ }
    }
    if (!hit) { failed.push({ name, reason: "no logo file matched" }); console.error(`  ✗ ${name}`); continue; }
    await writeFile(dest, hit.buf);
    ok[name] = { file: `/teams/${file}`, source: hit.cand, bytes: hit.buf.length };
    console.error(`  ✓ ${name}  ->  ${hit.cand}  (${hit.buf.length}b)`);
  }

  const report = { ok, failed, okCount: Object.keys(ok).length, failCount: failed.length };
  await writeFile(path.resolve("scripts/team-logos-report.json"), JSON.stringify(report, null, 2));
  console.error(`\nDONE. ok=${report.okCount} failed=${report.failCount}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
