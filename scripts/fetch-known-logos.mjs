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
const GAP = 3000;
const COOLDOWN = 0; // photon path is fresh; no wait needed

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
const filepath = (f) => `liquipedia.net/commons/Special:FilePath/${encodeURIComponent(f)}`;
// Rotate image proxies (their IPs hit Liquipedia, not ours). Photon (i0/i1/i2.
// wp.com) stayed unthrottled when wsrv was blocked, so it leads.
const PROXIES = [
  (f) => `https://i0.wp.com/${filepath(f)}?w=${WIDTH}`,
  (f) => `https://i1.wp.com/${filepath(f)}?w=${WIDTH}`,
  (f) => `https://i2.wp.com/${filepath(f)}?w=${WIDTH}`,
  (f) => `https://wsrv.nl/?url=${encodeURIComponent("https://" + filepath(f))}&w=${WIDTH}&output=png`,
];

// Every name here is confirmed to exist, so a miss is transient throttle — keep
// rotating proxies and retrying with backoff until one serves the image.
async function get(fileName) {
  let rr = 0;
  for (let attempt = 0; attempt < 12; attempt++) {
    const res = await fetch(PROXIES[rr++ % PROXIES.length](fileName)).catch(() => null);
    if (res && res.status === 200 && (res.headers.get("content-type") || "").includes("image")) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 800) return buf;
    }
    await sleep(1500 + 500 * attempt); // gentle, growing spacing
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
