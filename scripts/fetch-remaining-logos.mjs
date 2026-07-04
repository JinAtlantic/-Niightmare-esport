/**
 * fetch-remaining-logos.mjs — second pass for opponents the filename-guessing
 * sweep missed (odd casing like "The MongolZ", year-stamped names, etc.).
 *
 * Discovery: read the team's Liquipedia page through the allorigins proxy (its
 * IP hits Liquipedia, not ours) to learn the EXACT logo filename. Download: pull
 * that file through Photon (i0/i1/i2.wp.com), which resizes and never gets us
 * IP-blocked. Skips teams already on disk; reports the ones with no clear logo.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("public/teams");
const WIDTH = 256;
const NATIONAL = new Set(["cambodia","malaysia","myanmar","philippines","singapore","vietnam","laos","thailand","indonesia","brunei"]);

// Exact filenames known from earlier runs (skip discovery for these).
const KNOWN = {
  "zino zenith": "Zino_Esports_darkmode.png",
};

const norm = (s) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const filepath = (f) => `liquipedia.net/commons/Special:FilePath/${encodeURIComponent(f)}`;
const PHOTON = ["i0.wp.com", "i1.wp.com", "i2.wp.com"];

/** Score a candidate logo filename for a square crest on a DARK site. */
function scoreLogo(file, teamNorm) {
  const f = file.toLowerCase();
  if (!f.endsWith(".png")) return -1;
  if (/(at_|screenshot|banner|wallpaper|jersey|lineup|roster|preview|photo|award|trophy)/.test(f)) return -1;
  if (/(championship|tournament|invitational|qualifier|playoff|circuit|_league|_cup|_series|_season|_split|_open|world_?champ|mpl|mdl|msc|mcc|mlbb|mwi|mgl|snapdragon|arena_of|esl_|betboom|epl_)/.test(f)) return -1;
  const readable = f.replace(/\.png$/, "").replace(/_/g, " ");
  const stop = new Set(["team","esports","esport","gaming","club","the","id","kh","th","mena","of"]);
  const teamWords = teamNorm.split(" ").filter((w) => w.length >= 2 && !stop.has(w));
  const firstSig = teamWords[0];
  if (firstSig && !readable.includes(firstSig)) return -1;
  let s = 0;
  if (/allmode/.test(f)) s += 60; else if (/darkmode/.test(f)) s += 55;
  else if (/lightmode/.test(f)) s += 35; else if (/(logo|std|icon|lettermark)/.test(f)) s += 40; else s += 10;
  if (/full|wordmark|text/.test(f)) s -= 25;
  s -= file.length * 0.02;
  return s;
}

/** Discover image filenames on a team page via the allorigins proxy (retried). */
async function discover(title) {
  const target = `https://liquipedia.net/mobilelegends/${encodeURIComponent(title.replace(/\s+/g, "_"))}?action=render`;
  const url = `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    let html = "";
    try {
      const res = await fetch(url);
      if (res.ok) {
        const j = await res.json();
        html = (j.contents || "").replace(/\\\//g, "/"); // unescape JSON slashes
      }
    } catch { /* retry */ }
    if (/There is currently no text in this page/i.test(html)) return null;
    const files = [];
    const seen = new Set();
    const re = /commons\/images\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/"'\s?]+?\.(?:png|jpg|jpeg))/gi;
    let m;
    while ((m = re.exec(html))) { const file = m[1]; if (!seen.has(file)) { seen.add(file); files.push(file); } }
    if (files.length) return files;
    await sleep(4000 * (attempt + 1)); // allorigins is flaky — wait and retry
  }
  return [];
}

/** Download a filename via Photon, returns bytes or null. */
async function download(fileName, dest) {
  for (let i = 0; i < PHOTON.length; i++) {
    const res = await fetch(`https://${PHOTON[i]}/${filepath(fileName)}?w=${WIDTH}`).catch(() => null);
    if (res && res.status === 200 && (res.headers.get("content-type") || "").includes("image")) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 800) { await writeFile(dest, buf); return buf.length; }
    }
    await sleep(1000);
  }
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const content = await (await fetch("https://www.niightmareesport.com/api/content")).json();
  const rows = content.matches?.matches ?? [];
  const names = [...new Set(rows.map((m) => m.opponent).filter(Boolean))];
  const targets = names.filter((n) => !NATIONAL.has(norm(n)) && !existsSync(path.join(OUT_DIR, `${slug(n)}.png`)));

  console.error(`Remaining to try: ${targets.length}`);
  const ok = {}, failed = [];
  for (const name of targets) {
    const dest = path.join(OUT_DIR, `${slug(name)}.png`);
    let fileName = KNOWN[norm(name)];
    if (!fileName) {
      const imgs = await discover(name);
      if (imgs === null) { failed.push({ name, reason: "no Liquipedia page" }); console.error(`  ✗ ${name} (no page)`); continue; }
      const ranked = imgs.map((f) => ({ f, s: scoreLogo(f, norm(name)) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
      if (!ranked.length) { failed.push({ name, reason: "no clear logo" }); console.error(`  ✗ ${name} (no logo)`); continue; }
      fileName = ranked[0].f;
    }
    const bytes = await download(fileName, dest);
    if (!bytes) { failed.push({ name, reason: "download failed" }); console.error(`  ✗ ${name} (dl failed: ${fileName})`); continue; }
    ok[name] = { file: `/teams/${slug(name)}.png`, source: fileName, bytes };
    console.error(`  ✓ ${name}  ->  ${fileName}  (${bytes}b)`);
    await sleep(1500);
  }
  console.error(`\nDONE. ok=${Object.keys(ok).length} failed=${failed.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
