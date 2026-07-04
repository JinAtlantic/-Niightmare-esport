/**
 * gen-team-logos-map.mjs — print the LOGO_BY_TEAM entries for lib/teamLogos.ts.
 *
 * Walks the live opponent list, and for each team whose logo file actually
 * exists in public/teams/<slug>.png emits `"<normalized name>": "/teams/<slug>.png"`.
 * Source-of-truth is the files on disk, so it stays correct no matter which
 * fetch script produced them. Copy the printed block into lib/teamLogos.ts.
 */
import { existsSync } from "node:fs";
import path from "node:path";

const norm = (s) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const content = await (await fetch("https://www.niightmareesport.com/api/content")).json();
const names = [...new Set((content.matches?.matches ?? []).map((m) => m.opponent).filter(Boolean))];

const lines = [];
for (const name of names.sort((a, b) => a.localeCompare(b))) {
  const s = slug(name);
  if (existsSync(path.resolve(`public/teams/${s}.png`))) lines.push(`  "${norm(name)}": "/teams/${s}.png",`);
}
// Team Falcons MENA reuses the parent org crest (no separate file).
if (!lines.some((l) => l.includes('"team falcons mena"')) && existsSync(path.resolve("public/teams/team-falcons.png")))
  lines.push(`  "team falcons mena": "/teams/team-falcons.png",`);

console.log(`// ${lines.length} teams with logos\n${lines.sort().join("\n")}`);
