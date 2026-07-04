/**
 * fetch-known-logos.mjs — download the confirmed opponent logos only.
 *
 * These exact Liquipedia filenames were confirmed in earlier discovery runs, so
 * here we just pull each once through the wsrv.nl proxy (resized to 256px) —
 * slowly, since wsrv throttles bursts. Correct-by-construction: each file is
 * named after its team. Skips logos already on disk.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("public/teams");
const WIDTH = 256;
const GAP = 8000;
const COOLDOWN = 180000; // let wsrv↔Liquipedia recover before we start

// slug (matches lib/teamLogos + fetch-team-logos) -> exact Liquipedia filename.
// Every name here was confirmed to exist in an earlier run, so a 404 is a
// transient throttle, not a real miss — we retry it.
const KNOWN = {
  "verso-time": "Verso_Time_darkmode.png",
  "virtus-pro": "Virtus.pro_2019_allmode.png",
  "saigon-phantom": "Saigon_Phantom_2020_allmode.png",
  "leon-esports": "Leon_Esports_allmode.png",
  "team-flash-kh": "Team_Flash_allmode.png",
  "geekay-esports": "Geekay_Esports_allmode.png",
  "team-falcons": "Team_Falcons_2022_allmode.png",
  "team-evo": "Team_EVO_darkmode.png",
  "evil": "EVIL_SG_allmode.png",
  "king-of-gamers-club": "King_of_Gamers_darkmode.png",
  "ulfhednar": "Ulfhednar_allmode.png",
  "pro-esports": "PRO_Esports_allmode.png",
  "paradise-esports": "Paradise_darkmode.png",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proxyUrl = (f) =>
  `https://wsrv.nl/?url=${encodeURIComponent(`https://liquipedia.net/commons/Special:FilePath/${f}`)}&w=${WIDTH}&output=png`;

// Retry both 429 and 404 (wsrv returns 404 when Liquipedia throttles its fetch).
async function get(fileName) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(proxyUrl(fileName));
    if (res.status === 200) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 800) return buf;
    } else if (res.status !== 429 && res.status !== 404) {
      return null;
    }
    const back = 8000 * (attempt + 1);
    console.error(`    …${res.status}, wait ${back / 1000}s`);
    await sleep(back);
  }
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.error(`Cooling down ${COOLDOWN / 1000}s before fetching…`);
  await sleep(COOLDOWN);
  let ok = 0, miss = 0;
  for (const [slug, fileName] of Object.entries(KNOWN)) {
    const dest = path.join(OUT_DIR, `${slug}.png`);
    if (existsSync(dest)) { console.error(`  = ${slug} (have)`); ok++; continue; }
    const buf = await get(fileName);
    if (!buf) { console.error(`  ✗ ${slug}  (${fileName})`); miss++; await sleep(GAP); continue; }
    await writeFile(dest, buf);
    console.error(`  ✓ ${slug}  ->  ${fileName}  (${buf.length}b)`);
    ok++;
    await sleep(GAP);
  }
  console.error(`\nDONE. ok=${ok} miss=${miss}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
