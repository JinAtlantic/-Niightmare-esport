# AGENTS.md — NIIGHTMARE Esports website

Operational handoff for AI coding agents (Codex et al.). Read this before touching
the project. The user-facing content guide is in [README.md](./README.md), but note
the README's "Brand & tech notes" + "Deploy" sections are **outdated** — this file
overrides them.

## What this is
Dark, aggressive **esports website** for NIIGHTMARE Esports (Lao PDR), competing in
**Mobile Legends: Bang Bang (MLBB)** and **eFootball**. Next.js 14 (App Router) ·
TypeScript · Tailwind CSS · bilingual EN/Lao. Live at
**https://niightmareesport.com** (custom domain, registered + DNS on Cloudflare,
records DNS-only/grey so Vercel issues SSL). The old `niightmare-esport.vercel.app`
still deploys but **some ISPs (Lao PDR) block `*.vercel.app`** — always use the
custom domain. `SITE_URL` (lib/seo.ts) defaults to it; `NEXT_PUBLIC_SITE_URL`
overrides if set.

## Repo layout — IMPORTANT
The real project root is nested **one level deeper** than the folder you probably
opened:
```
.../Website/niightmareesport/            <- outer folder (often the cwd)
.../Website/niightmareesport/Niightmare-Esport/   <- ACTUAL project root (package.json here)
```
Run all `npm`/`next`/`vercel` commands from the inner `Niightmare-Esport` folder.

## Running locally (Node is NOT on PATH)
This machine has no global Node. Use a portable build:

- **With npm/npx** (for vercel, installs): `C:\Users\iTAPE\AppData\Local\nodejs-portable\node-v22.12.0-win-x64` (node 22.12, npm 10.9). Prepend to PATH:
  ```powershell
  $env:PATH = "C:\Users\iTAPE\AppData\Local\nodejs-portable\node-v22.12.0-win-x64;" + $env:PATH
  ```
- **node.exe only** (run the Next bin directly, no npm): `C:\Users\iTAPE\AppData\Local\OpenAI\Codex\bin\<hash>\node.exe` (node 24).

Start the dev server (deps are already installed):
```powershell
$node = "C:\Users\iTAPE\AppData\Local\OpenAI\Codex\bin\<hash>\node.exe"
Set-Location "D:\Picture D\Niigtmare Project\Website\niightmareesport\Niightmare-Esport"
& $node "node_modules\next\dist\bin\next" dev      # http://localhost:3000
```
A dev server is often **already running on :3000** from a prior session and picks up
edits via fast-refresh — check `Invoke-WebRequest http://localhost:3000/` before
starting another (a second just fails to bind).

Verify a change shipped: fetch `/` and look for a new marker (CSS class / string) +
absence of the Next error overlay. For headless screenshots, use the Playwright-core
that ships with the playwright-go bundle, launched against installed Edge:
`import { chromium } from 'file:///C:/Users/iTAPE/AppData/Local/ms-playwright-go/1.57.0/package/index.mjs'`
then `chromium.launch({ channel: 'msedge', headless: true })`.

## Deploy (Vercel)
**Primary: git push.** The repo now has a git remote and the production project is wired
to auto-deploy on push to `main`:
```powershell
git push origin main   # -> builds + ships to https://niightmareesport.com
```
- Remote `origin` = `https://github.com/JinAtlantic/-Niightmare-esport.git` — **note the
  LEADING DASH** in the repo name. A second repo `JinAtlantic/Niightmare-Esport` (no dash)
  exists and is stale; the live project must stay connected to the **dash** repo. Pushing
  to the wrong repo silently fails to deploy.
- Production branch is `main`. Every push to `main` triggers a production build.

**Fallback: Vercel CLI** straight from the local folder (cloud build, does NOT touch local
`.next`) — use if the git integration is ever broken:
```powershell
$env:PATH = "C:\Users\iTAPE\AppData\Local\nodejs-portable\node-v22.12.0-win-x64;" + $env:PATH
$tok = [System.Environment]::GetEnvironmentVariable('VERCEL_TOKEN','User')
Set-Location "D:\Picture D\Niigtmare Project\Website\niightmareesport\Niightmare-Esport"
npx --yes vercel@latest --prod --yes --token $tok --scope jinatlantics-projects
```
- Token is a **User env var `VERCEL_TOKEN`** — read it from the *User* scope (a freshly
  spawned shell won't see it in `$env:`). Never print/commit the token. Same token works
  for direct REST calls to `api.vercel.com` (the sandbox CAN reach the API host).
- `--scope jinatlantics-projects` is mandatory in non-interactive mode.
- Project `niightmare-esport`, projectId `prj_OFnaJcx0iXKSM9RxGoBK2MWvfS0B`, teamId
  `team_AszcleMwKqTx5nCPfaKp5yMj`.
- Deployment protection (sso login wall) is already disabled; if a new project re-enables
  it, PATCH `ssoProtection: null` via the Vercel API.
- This sandbox can't reach the live host directly — verify the live site through the
  jina proxy, requesting raw HTML so meta/markers survive:
  `Invoke-WebRequest "https://r.jina.ai/https://niightmareesport.com" -Headers @{ "X-Return-Format"="html" }`.

## Gotchas (will burn time if ignored)
- **`next/font/google` HANGS the build here** (silent, never returns). All fonts are
  therefore **self-hosted** via `next/font/local` (woff2 in `app/fonts/`, vars
  `--font-rajdhani/-barlow/-mono/-noto-lao`). Do NOT switch any font back to
  `next/font/google`.
- **Don't run `npm run build` while the dev server is up** — the production output
  clobbers the dev `.next` and the running server starts throwing `Cannot find module
  './###.js'`. If it happens: kill :3000, `Remove-Item -Recurse -Force .next`, restart
  `next dev`.
- **`next/og` routes (`/opengraph-image`, `/twitter-image`) crash under `next dev` on
  node 24** — they render fine via `next build`/`next start` on node 22. Not worth
  debugging the dev crash.
- If a build is killed mid-run, `.next` is left corrupt (`ENOENT rename
  .next/export/500.html`) — `Remove-Item -Recurse -Force .next` and rebuild.

## Design system — "Premium Violet Void"
Source of truth is [`tailwind.config.ts`](./tailwind.config.ts). Use the tokens, don't
hardcode hexes.
- Palette: `void #0B0710`, `crypt #16101F`, `crypt2 #1C1428`, `edge #2A2138`,
  `edge-bright #3A2E50`, `amethyst #A855F7` (primary), `glow #C77DFF`, `spectre #C9B4F6`,
  `soul #ECE7F2` (text), `ash`/`ash-dim` (muted). Result colors `win #34D399`,
  `loss #FB7185` (also the rose/live accent), `draw`.
- Display font is **Chakra Petch** (clipped, blade-like), exposed as both `font-display`
  and `font-rajdhani`. Body `font-barlow`, data/`font-mono`, Lao `font-lao`.
- **Sharp corners**: border-radius is capped at 4px (`rounded-*` ≤ `md`); only `rounded-full`
  is round. Aggressive, bladed aesthetic — see the `.scythe-line` skewed gradient rule in
  `app/globals.css` and `ScytheIcon`.
- Glow shadows: `shadow-glow`, `shadow-glow-accent`, `shadow-glow-soft`; animations
  `pulseGlow`, `fadeInUp`, `rise`, `slashSlide` in the config.
- `keep-latin` opts an element back into the Latin display font inside Lao mode (team
  wordmarks, in-game names).

## Content & data
All site content is JSON in [`/data`](./data) (`news/roster/matches/sponsors/site/
translations`); every translatable value is `{ "en": "...", "lo": "..." }` — keep both.
Shapes are documented in the README. The **admin editor at `/admin`** is cloud-backed
(Vercel Blob) and writes live without a redeploy; it's gated off in production.
**Behind-the-Team / roster members** use **Supabase** (service-role writes, login-gated
inline editor) — needs 3 env vars, see `.env.example`. Copy `.env.example` → `.env.local`
and fill secrets; never commit `.env.local`.

### Adding a field to a player / match / upcoming-match
`players`, `matches`, and `upcoming_match` are **Supabase tables** (read via
`lib/contentFromSupabase.ts`, written via `lib/migrate.ts` + `lib/supabaseWrite.ts`);
the bundled `/data/*.json` is only a fallback seed. To add a field, either reuse a
spare legacy column **or** add an idempotent `alter table … add column if not exists`
to `supabase/schema.sql` (the "Backfill columns" block) **and run it in the Supabase
SQL editor before deploying** — admin saves 500 on a missing column. Legacy-column
reuse in `players`: `win_rate`→`fmvp`, `gear_device`→`tenures` (JSON),
`gear_audio`→`liquipedia`. The 3-letter opponent short code lives in
`matches.opponent_abbr` / `upcoming_match.opponent_abbr` (shown by `OpponentLogo`
/ `UpcomingMatch` when no opponent logo is set; `opponentMonogram()` in
`components/cards/OpponentLogo.tsx` resolves it).

**Editable JSON blocks on the "site" section** (About Us, Esports Roadmap) live in
single `jsonb` columns on `site_settings`: `about_us` and `roadmap`. Pattern for any
new editable-content block: (1) `alter table site_settings add column if not exists
<col> jsonb;` in `schema.sql` **and run it in Supabase before the admin can save it**;
(2) persist it in BOTH `lib/supabaseWrite.ts` and `lib/migrate.ts` (the `site_settings`
upsert); (3) read it back in `lib/contentFromSupabase.ts` (`<key>: (c.<col> as …) ??
undefined`); (4) define `DEFAULT_*` + a `resolve*()` merge in a `lib/*.ts`, edit it via
a sub-editor in `HomeEditor`. The component reads `useContent().site.<key>` and falls
back to the default — so the block renders before anything is ever saved.

## Recently redesigned
`components/sections/UpcomingMatch.tsx` — the home "UPCOMING MATCH" fixture card was
rebuilt as a split-arena broadcast card (mobile-first: stacked → side-by-side on `md`,
glassmorphism team zones, forged diamond VS on a blade seam, divided tale-of-the-tape
strip). Keep edits to Tailwind classes + JSX layout; the data hooks/props are stable.

`components/sections/AboutUs.tsx` — home "About Us" band below `RecentResults`: a
single centred manifesto led by a large scythe-tick "WHO WE ARE" heading + an outlined
violet accent word. All copy is admin-editable via `site.aboutUs` (HomeEditor → "About
Us") with defaults in `lib/about.ts` (`DEFAULT_ABOUT` / `resolveAbout`). Players also
carry an optional `liquipedia` URL shown in the profile modal. The Club Dossier / stats
and "Team Snapshot" blocks were removed.

## Esports Roadmap + Matches page (2026-06)
`/matches` (`components/clients/MatchesClient.tsx`):
- **Scoreboard** = W / L / win-rate tiles (colour-accented); stats are for the selected
  game + year, independent of the result/tournament filters.
- **Filters** (all dropdowns, visible labels): Game · Year · Result · Sort, then a
  full-width **Tournament** dropdown. Tournament options are collapsed to one entry per
  event family — `baseName()` strips `Season N` / `S7` / `M5–M8` / year tokens — and
  grouped into `<optgroup>`s by tier (S→A→B→C, untiered "Other" last). The match list
  still cards each season separately.
- **Tier colours**: each match's left blade + each tournament group's tier badge are
  coloured by `tournamentTier(name)` in `lib/tiers.ts` (bronze C / cyan B / silver A /
  gold S; non-main events fall back to brand violet). `tournamentTier` is the single
  source of truth for tier classification — extend its regex to tier a new event.
- **Esports Roadmap** = a button under the filters opening `RoadmapModal` →
  `RoadmapTimeline` (a vertical status spine of the season path). Content is
  admin-editable via `site.roadmap` (HomeEditor → "Esports Roadmap", `RoadmapEditor`),
  defaults + types in `lib/roadmap.ts` (`DEFAULT_ROADMAP` / `resolveRoadmap`). Each stop
  has a tier, status (`done`/`active`/`eliminated`/`upcoming`/`locked`), optional
  prize/note, and optional **sub-stages** (Wildcard / Groups / Knockout — each with its
  own label/window/status). Stored in `site_settings.roadmap` jsonb. **Update each
  season** by editing statuses (e.g. when MSC starts, set that stop `active` and its
  Wildcard sub-stage `done`), in the admin or in `lib/roadmap.ts`.
