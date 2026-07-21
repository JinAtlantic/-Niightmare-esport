# AGENTS.md — NIIGHTMARE Esports website

Operational handoff for AI coding agents (Codex et al.). Read this before touching
the project. The user-facing content guide is in [README.md](./README.md), but note
the README's "Brand & tech notes" + "Deploy" sections are **outdated** — this file
overrides them.

## What this is
Dark, aggressive **esports website** for NIIGHTMARE Esports (Lao PDR), competing in
**Mobile Legends: Bang Bang (MLBB)** and **eFootball**. Next.js 15 (App Router) ·
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

### Isolated browser QA
After `npm run build`, run `npm run e2e` to exercise the complete buyer/admin order
lifecycle in Chromium: reserve → payment slip → admin verification → packing →
shipping image → shipped status sync in My Orders. The Playwright server runs on
`localhost:3100` with a process-local in-memory order store. Test mode requires both
`SHOP_E2E_MODE=true` **and** a loopback URL/Host/Forwarded-Host; the launcher also
blanks all Supabase, Storage, push, and email credentials. It therefore must never
write test orders or images to Production. CI installs Chromium and runs this flow
after the production build. The suite covers both 390px mobile and 1440px desktop,
all public routes (hydration/runtime/overflow), responsive navigation + language
switching, every admin editor in read-only mode, and the full Shop transaction.
It also runs automated axe checks against WCAG 2 A/AA and WCAG 2.1 A/AA on all
public routes, the admin login, every read-only admin editor, and key open-dialog
states at both viewports. Keyboard coverage verifies modal focus trapping/return,
Escape dismissal, the async Shop payment popup, and the Matches tournament menu's
arrow-key navigation.
Failure traces, videos, and screenshots are uploaded as the `playwright-report`
artifact.

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
  `--font-rajdhani/-barlow/-mono/-lao`). Do NOT switch any font back to
  `next/font/google`.
- **Lao font + mixed scripts**: the Lao face is **Noto Sans Lao** (`--font-lao`,
  self-hosted; chosen over the formal Phetsarath for readability). In Lao mode
  (`html.lang-lo`, see `app/globals.css`) each role keeps its **Latin font FIRST**
  with `var(--font-lao)` only as a fallback, so Latin glyphs stay on-brand
  (Chakra Petch / Barlow / JetBrains Mono) and only Lao glyphs use Noto Sans Lao.
  Don't re-add a blanket `font-family: var(--font-lao) !important` — that's what
  made English text render in the Lao face.
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
(Vercel Blob) and writes live without a redeploy; it's gated off in production. The admin
session cookie (`nm_admin`, `lib/adminAuth.ts` + `app/api/admin/login`) is **`sameSite: "lax"`**
(strict withheld it on bookmark/link navigations → re-login every visit) and lasts
**365 days** (`SESSION_MAX_AGE`), so a device stays signed in; "Log out" clears it.
**Image uploads** (admin media via `ImageField` → `/api/admin/upload`, and customer
payment slips) go to the public **Supabase Storage `uploads` bucket** (`lib/supabaseStorage.ts`),
NOT Vercel Blob — the free Blob store gets suspended at its usage cap
(`limits-exceeded-suspended`), which silently breaks every upload as "Could not upload image".
`ImageField` (`components/admin/ui.tsx`) **auto-resizes every upload in the browser**
before POSTing: it re-encodes to a ≤1200px JPEG and keeps lowering quality (to 0.6)
then dimensions until the blob is safely under the 4 MB server cap — so an upload of
any size always succeeds (a smaller transparent PNG is kept as-is; a huge GIF/SVG we
can't re-encode shows a plain-Thai "too big" message). The upload `folder` allowlist
lives in BOTH `app/api/admin/upload/route.ts` (`FOLDERS` set) and the `ImageField`
`folder` union — add a name to both to allow a new subfolder (`teams`/`players`/
`staff`/`sponsors`/`shop`).
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

**Writing prod content from a local script (no dev server, no redeploy):** the admin session
token is a signed HMAC of `ADMIN_SECRET` (`lib/adminAuth.ts` `makeToken`) — a local node script
can mint it and `PUT https://www.niightmareesport.com/api/admin/data?file=<matches|site|…>` with
`Cookie: nm_admin=<token>`, which writes Supabase **and** revalidates the public pages instantly.
The sandbox can reach the live host (apex 308→www). `matches` replaces the whole table (send the
full list), `site` upserts many fields (GET the full object first, edit only what you need, PUT it
back — else other fields get nulled). **`scripts/sync-results.mjs`** uses exactly this: it reads
NIIGHTMARE's Liquipedia played matches (proper `User-Agent`), diffs against live matches (only
results **newer than the latest already on the site** — never back-fills), and on `--apply`
publishes the new results + per-game VOD links. Driven by the **`/sync-results`** slash command
(`.claude/commands/`), which is confirm-first. The owner runs it on demand (stays manual — no
scheduled/auto routine, by choice); opponent names/tournaments come from Liquipedia as-is.

**Editable JSON blocks on the "site" section** (About Us, Niightmare Roadmap) live in
single `jsonb` columns on `site_settings`: `about_us` and `roadmap`. Pattern for any
new editable-content block: (1) `alter table site_settings add column if not exists
<col> jsonb;` in `schema.sql` **and run it in Supabase before the admin can save it**;
(2) persist it in BOTH `lib/supabaseWrite.ts` and `lib/migrate.ts` (the `site_settings`
upsert); (3) read it back in `lib/contentFromSupabase.ts` (`<key>: (c.<col> as …) ??
undefined`); (4) define `DEFAULT_*` + a `resolve*()` merge in a `lib/*.ts`, edit it via
a sub-editor in `HomeEditor`. The component reads `useContent().site.<key>` and falls
back to the default — so the block renders before anything is ever saved.

**Team PAGE copy is admin-editable (2026-07-06):** the /admin → Team **"หน้า Team
(Page)"** tab (hero title/intro, tab + tier labels, stat labels) used to be **seed-only**
— the roster save wrote only the `players`/`members` tables and reads rebuilt `page` from
`data/roster.json`, so Page-tab edits never surfaced (the Players/Staff tabs always
persisted). It's now stored as a jsonb blob on **`site_settings.roster_page`** (same
pattern as `about_us`/`roadmap`): written in `lib/supabaseWrite.ts` (roster branch,
guarded by `hasColumns`) and merged over the seed page in `lib/contentFromSupabase.ts`.
Migration (already run live): `alter table public.site_settings add column if not exists
roster_page jsonb;`. NB: this is the roster-key equivalent of the sponsors page-copy
gotcha below — but roster page copy now DOES go live.
The user-facing page name is **Team** (navigation, hero, metadata, breadcrumbs, and Admin tab),
but the stable route remains `/roster` and internal code/data keys remain `roster` for backward
compatibility. Do not rename the route, Supabase column, or content key unless a URL migration
is explicitly requested.

## Recently redesigned
**Sponsors revamp (2026-07-04):** `components/clients/SponsorsClient.tsx` is now **logo-first** —
a compact tile grid (2 cols mobile → 4 lg) where the logo is the hero and each tile opens a
redesigned popup with **real per-sponsor data**: a category chip, an "About" description, and a
**Connect** row of social/contact icons (only filled ones render, like a player card) + a Visit
Website button. The popup is **portaled to `document.body`** (`createPortal`) so it always centres
in the viewport (a transformed ancestor otherwise anchored the `fixed` layer to the section).
`Sponsor` gained `category`/`description` (Bilingual) + `socials`
(`facebook/instagram/tiktok/youtube/whatsapp/phone`; website = `Sponsor.url`) — persisted as
**three jsonb columns on `sponsors`** (`sponsorRows` in `lib/migrate.ts`, read in
`lib/contentFromSupabase.ts` via `jsonBi`), edited in **/admin → Sponsors**. New icons
`GlobeIcon`/`PhoneIcon` in `components/ui/Icons.tsx`. Columns to run before saving sponsors in
admin (else the save 500s): `alter table public.sponsors add column if not exists category jsonb;`
`… description jsonb;` `… socials jsonb;` (already run on the live DB).
- **Three public groups (2026-07-21):** the old single "OFFICIAL PARTNERS" wall is now three
  stacked sections in this order: **Official Sponsors → Event Sponsors → Past Partners**. Every
  sponsor has `partnerGroup` (`official|event|past`), persisted in the non-null
  `sponsors.partner_group` column and selected in **/admin → Sponsors**. Missing/legacy values
  resolve to `official`; all 10 existing live rows were backfilled to `official`. Shared labels,
  ordering, and fallback logic live in `lib/sponsorGroups.ts`. The old **WORKING TOGETHER**
  benefits section and its seed copy were removed completely.
- **Admin editor is an accordion** now (`components/admin/SponsorsEditor.tsx`): each partner is a
  collapsed row (logo thumb + name + status) you click to edit — far easier for a long list.
- **Sponsorship Tiers were removed** (unused, never rendered): the editor UI + the page copy's
  tier fields are gone, and the `sponsor_tiers` table was **wiped to 0 rows**. `SponsorTier` /
  `tierRows` / the `sponsor_tiers` read+write still exist in the lib layer (harmless) and the
  editor passes `tiers` through untouched so a save doesn't recreate them.
- **CTA band** is just a short **"Become Our Partner" / "ມາຮ່ວມເປັນພາດເນີ້ກັບພວກເຮົາ"**
  Facebook button (hardcoded `COPY.facebook`); the descriptive paragraph was dropped.
- **Footer partner marquee** (`components/layout/SponsorMarquee.tsx`, mounted in `Footer.tsx`)
  **replaced the Quick Links column**: a full-width band of partner logos auto-scrolling
  left→right (CSS `.marquee-track`/`@keyframes sponsor-marquee` in `globals.css`, seamless via a
  duplicated aria-hidden second copy, edge fade mask, pause-on-hover, frozen under
  reduced-motion). Footer top grid dropped to 2 cols. Logos show once uploaded; until then each
  partner renders as a **name wordmark**. Shared `partnersLabel` (footer + home `PartnerStrip`)
  Lao is **"partners ຂອງເຮົາ"**.

**GOTCHA — sponsors `page` copy is SEED-ONLY:** the sponsors-file `page` block (currently only
the hero title) is NOT persisted to Supabase — `supabaseWrite`'s `sponsors` branch only writes
the `sponsors` + `sponsor_tiers` tables, and `contentFromSupabase` builds `page` from
`data/sponsors.json`. So editing page copy in /admin does nothing live; to change it you must
edit the seed + deploy. Per-sponsor rows (name/logo/partnerGroup/category/description/socials)
DO persist via Supabase and show instantly. Publish sponsor rows to live from a script by PUTting
`/api/admin/data?file=sponsors` with a minted admin token (send the full sponsors list +
current tiers so nothing is wiped) — same pattern as `scripts/sync-results.mjs`.

**Sponsor data status (as of 2026-07-04):** 10 real sponsors are live (Apollo Entertainment,
M Frolic, Vibes Cafe VTE, SV Garage, Senglao Café, WHR, DML, Good Start, IPEDD, Lao Esports
Federation). Verified links filled: Senglao (FB/IG/web/phone), LESF (FB/web), Vibes (IG), IPEDD
(FB), M Frolic (FB). **Still needs owner input:** what WHR / DML / Good Start are (not found
online — left generic, no links), correct FB links for Apollo + SV Garage, and **real logo files
for all 10** (currently wordmark fallback everywhere).

`components/sections/UpcomingMatch.tsx` — the home "UPCOMING MATCH" fixture card was
rebuilt as a split-arena broadcast card (mobile-first: stacked → side-by-side on `md`,
glassmorphism team zones, forged diamond VS on a blade seam, divided tale-of-the-tape
strip). Keep edits to Tailwind classes + JSX layout; the data hooks/props are stable.

**Live score (2026-07-03):** when `upcomingMatch.status === "live"` the card shows a rose
"Live score" board from `upcomingMatch.score` (e.g. a BO3 at "1-0"), editable in /admin. An
open fan page **polls `GET /api/content` every ~25s while live** so the tally climbs without a
refresh, and reloads once when the admin flips the status away from "live" (match finished).
No new columns — reuses the existing `score` field. The **/admin editor** (`HomeEditor.tsx`
"นัดต่อไป") was reorganized to be **status-driven**: a big status picker up top, then only the
relevant box shows (rose LIVE-SCORE box when live; RESULT box when finished), followed by
grouped cards (คู่แข่ง / งาน–รอบ / วัน–เวลา) + the schedule-queue popup. The Upcoming Match
live-stream controls, broadcast badges, and WATCH LIVE links were removed; live match status,
the live score, and the site-wide live matchup alert remain. Legacy `streamUrl`/`hasLive` fields
stay in the data layer for backward compatibility but are no longer shown or edited. The finished
box has **two actions**: `finishToMatches()` ("✅ บันทึกผลลงหน้า Match" — appends the result to
/matches then clears the card; **works even with no queued next row**, fixing the dead-end where
the last match of the day couldn't be recorded) and `promoteNext()` (append + advance to the
first schedule row; shown only when one exists). Both share `appendFinishedToMatches()`. The 24h
time field defaults the date to today when a time is typed before a date (`todayBkkDate()`).

`components/sections/AboutUs.tsx` — home "About Us" band below `RecentResults`: a
single centred manifesto led by a large scythe-tick "WHO WE ARE" heading + an outlined
violet accent word. All copy is admin-editable via `site.aboutUs` (HomeEditor → "About
Us") with defaults in `lib/about.ts` (`DEFAULT_ABOUT` / `resolveAbout`). Players also
carry an optional `liquipedia` URL shown in the profile modal. The Club Dossier / stats
and "Team Snapshot" blocks were removed.

## Matches page (2026-06)
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
- **Niightmare Roadmap** = a button above the W/L/win-rate scoreboard opening
  `RoadmapModal`. It shows H1/H2 tabs, a bilingual language toggle, and a
  current-status tracker. Content is admin-editable via `site.roadmap`
  (HomeEditor → "Niightmare Roadmap") with defaults/types in `lib/roadmap.ts`.
  The active card is controlled by `activeStageId` (default `h1-wild-card`).
  Current flow: MCCM Season 1 rank 1 goes to MSC x EWC Wild Card, then Wild
  Card rank 1 enters Group Stage; MCCM Season 2 rank 1 goes direct to M-Series,
  rank 2 goes to Wild Card for the final M-Series slot.

## Shop / jersey ordering (IMPLEMENTED — 2026-06)
`/shop` is a live on-site jersey ordering flow. **No 3D viewer** — an early
placeholder used a procedural Three.js model but the user dropped it as fiddly;
`components/shop/JerseyModelViewer.tsx` still exists (vanilla Three.js) but is no
longer imported, so three.js is not bundled on the page. **Do NOT reintroduce
`@react-three/fiber`** — Next 15 serves a React-19 client runtime while the repo
pins React 18, so fiber's reconciler reads removed internals (`ReactCurrentBatchConfig`)
and crashes only at client runtime (tsc/lint/build all pass). Any future 3D must be
vanilla Three.js in a `useEffect`.

Product model (one jersey, one edition): currency LAK, base **329,000 ກີບ**, sizes
S–4XL where **3XL +10,000 / 4XL +20,000** (per-size `surcharge`). Back name/number are
**locked** to "NIIGHTMARE ESPORTS #7" (reserved, shown with a rights note). The page is
two tabs styled like the Achievements page: **Order** (reserved note + size→quantity
rows, supporting several sizes per order and a typeable qty up to 999; customer name,
phone/WhatsApp, courier dropdown with a free-text "Other", province/city/branch) and
**My Orders** (the buyer's saved orders from `localStorage`, with an empty state).
Bilingual EN/Lao throughout.

**Front/back jersey gallery (2026-07-06):** the Order tab leads with
`components/shop/JerseyShowcase.tsx` — a premium viewer showing the shirt with a
Front/Back toggle + two thumbnails and a tap-to-zoom fullscreen lightbox (portaled to
`document.body`; padding-bottom box, NOT CSS aspect-ratio, for mobile Safari; plain
`<img>` since the photos live on Supabase Storage). Before photos are uploaded it renders
an on-brand placeholder (shirt glyph + #number + "coming soon"). The two images are
`shop.frontImage` / `shop.backImage` on the `site.shop` jsonb blob (no migration —
`resolveShop` in `lib/shop.ts` passes them through), uploaded in **/admin → Shop → "รูปเสื้อ
(หน้า/หลัง)"** via `ImageField folder="shop"`. Owner will fill the real photos later
(recommend JPEG, or a transparent PNG cut-out for the most premium look on the violet bg).

**Buying does NOT require sign-in** — the site has **no user login at all** (manual slip
verification is the real safeguard). "My Orders" is tracked locally in `localStorage` on the
buyer's device under one base key; `shop_orders.user_email` is left empty.

Order flow is **reserve → pay** (two `POST /api/shop/order` calls, distinguished by
`body.intent`): **Order & pay** first prices server-side and inserts the order as
`status='awaiting_payment'` (`intent:"reserve"`), then opens the payment popup. The
popup is **portaled to `document.body`** with background scroll locked so it always
centres in the viewport (a transformed ancestor used to capture the `fixed` positioning).
Attaching a slip + "I've transferred" (`intent:"pay"`, sends the reserved `orderId`)
updates that row to `status='paid_declared'`, uploads the slip, fires Admin Web Push
alerts, and then shows the success tick → popup self-closes → My Orders tab. Payment is **self-declared**
(no gateway). Formspree email for shop paid-order declarations is **disabled by default**
so fake slips / high order volume do not consume the free Formspree quota; only enable it
as a secondary channel with `SHOP_ORDER_EMAIL_NOTIFICATIONS=true`. The team verifies in **/admin → Orders** and advances status
(awaiting_payment → paid_declared → verified → shipped → cancelled).

**Pay window / My Orders:** a reserved order shows in the buyer's `localStorage` **My
Orders** with a live **24-hour countdown** + a **Pay now** button (reopens the popup for that
order); past the window it's auto-removed from My Orders / displays as cancelled
(`isOrderExpired` / `payWindowRemaining` in `lib/shop.ts`, `SHOP_PAYMENT_WINDOW_HOURS = 24`).
My Orders uses a single localStorage key `nm-shop-orders` on the device (no login, so it is
not account-scoped). Because My Orders is otherwise localStorage-only, it now **syncs live status from the
server** when the buyer opens the tab: `GET /api/shop/order/status?ids=<uuid,…>` (public,
returns only `status` + `shippingImageUrl` by UUID) merges the latest into localStorage.
This is what makes admin status changes visible to the buyer — badges map
`paid_declared`→processing, `verified`→preparing, `shipped`→"shipped, please wait",
and an id the server no longer returns (admin deleted it) flips the local copy to
cancelled. Each My Orders card has a read-only **Order details** `<details>` (the data the
buyer entered) and, once shipped/verified, shows the **shipping image** the team attached.
/admin → Orders shows expired awaiting orders with a "หมดเวลา 24 ชม" tag. The cancel is a
**display-only** computation on both sides (no cron); admin can still set status manually.

**Manual-verification aids (no gateway):** the buyer transfers the **exact order total**
(no amount tampering — an earlier random-kip scheme was dropped so customers never feel
overcharged). Each order gets a short **reference code** (`NM-XXXXX`, generated client-side
on reserve, sent as `ref`, sanitised by `cleanRefCode`, stored in `shop_orders.ref_code`)
shown big + **copyable** (clipboard) in the pay popup and in My Orders. The instruction to
put it in the transfer note is **admin-editable** (`shop.bank.refNote`, bilingual, set in
/admin → Shop). The buyer must
also **attach a payment slip** (required to enable "I've transferred"); the image is
downscaled client-side, posted as a base64 data URL on `slip`, uploaded to the public
**Supabase Storage** `uploads` bucket server-side (via `lib/supabaseStorage.ts`, service
role), and stored as `shop_orders.slip_url`.
Expired (>24h) reservations are auto-removed from the buyer's My Orders, and a buyer can
delete any of their own My Orders entries. Deleting an **awaiting_payment** entry also hard-
deletes the server/admin copy (`DELETE /api/shop/order` with the order UUID; the handler only
removes rows still `status='awaiting_payment'`, so a paid/processing order can't be erased
this way). Deleting a paid/processing entry stays localStorage-only — the Supabase copy
remains for the team.

**/admin → Orders** is split into **4 status sub-tabs** (with counts): รอชำระ
(awaiting_payment), กำลังตรวจ (paid_declared — the default/actionable bucket), จ่ายแล้ว
(verified + cancelled), ส่งแล้ว (shipped). Each card **headlines the order ref code + amount**
(the two fields matched against the slip) + the slip thumbnail; customer name/phone/courier/
address fold into a `<details>` dropdown (plus the signed-in buyer's `user_email` if present).
The **ส่งแล้ว tab leads with a sales report** — total revenue, units sold, and per-size,
grouped by **day / month / year** (`SalesReport` in `OrdersEditor.tsx`). Each order's shown
**time ("เวลาโอน"), the list sort and the sales report all use `paid_at`** — the **immutable
moment the buyer declared their transfer** (slip attached + "I've transferred"), set once by
the PAY route and **never touched by admin status changes**, so advancing an order can't drift
its time (`orderTime()` falls back to `updated_at`→`created_at` for rows saved before the
column existed). **NB: the `shop_orders.updated_at` DB trigger does NOT fire in the live DB**,
so the pay route and the admin status PATCH set `updated_at` (and the pay route `paid_at`)
**explicitly** in the update payload. Run `alter table public.shop_orders add column if not
exists paid_at timestamptz;` in Supabase — the routes degrade gracefully until then.

Admin Orders also has: a **search box** (matches ref code / name / email / phone) + a
**newest⇄oldest sort** toggle; a **⚠ duplicate flag** when an order shares a phone or
signed-in email with another; **tap-to-call (`tel:`) + copy** for phone/ref/amount/email; a
relative **"x นาทีที่แล้ว" time**; a prominent **quick-advance** button (paid→verified→
shipped); and on verified/shipped orders a **shipping-image uploader** (`PATCH` with a
base64 `shippingImage` → uploaded to the `uploads` bucket `shop-shipping/` → stored in
`shop_orders.shipping_image_url`, shown to the buyer). The red **"ยกเลิก & ลบ"** button is a
**hard delete** (`DELETE /api/admin/orders`, `window.confirm` first) — used to purge junk /
mismatched-transfer orders; the legacy `cancelled` status is no longer set from the UI.
**The DELETE route now also purges the order's uploaded images** (`slip_url` in `shop-slips/`
+ `shipping_image_url` in `shop-shipping/`) from the public `uploads` bucket via
`deleteFromStorage()` (`lib/supabaseStorage.ts`, derives the in-bucket path from the public
URL) — best-effort, never fails the delete. Before this, deleting a row orphaned its slip in
Storage. A one-off orphan sweep (list `shop-slips/`+`shop-shipping/`, remove files no order's
`slip_url`/`shipping_image_url` references) is the safe cleanup for pre-existing orphans.

**QR framing:** the QR is drawn as a CSS background on a square so a long bank-app
screenshot can be cropped to just the QR. `/admin → Shop` has zoom + X/Y position sliders
with a live preview; values live in `shop.bank.qrZoom/qrX/qrY` (jsonb, no migration) and
both the admin preview and the shop popup share `qrFrameStyle()` in `lib/shop.ts`.

Files: `lib/shop.ts` (config/types/`resolveShop`/`computeOrder`/`validateOrder`; also a
leftover fit model used only by the unused viewer), `app/shop/page.tsx`,
`components/shop/ShopClient.tsx`, `app/api/shop/order/route.ts`,
`app/api/admin/orders/route.ts` (GET/PATCH/DELETE), `app/api/shop/order/status/route.ts`
(public buyer status sync), `components/admin/ShopEditor.tsx`,
`components/admin/OrdersEditor.tsx` (+ tab wired in `AdminApp.tsx`). All shop *config*
(price, sizes, stock, bank/QR, couriers, contact link, rights note) lives in the
`site_settings.shop` jsonb blob and is edited in **/admin → Shop** — same editable-JSON
pattern as `site.aboutUs`/`site.roadmap`.

Owner setup still pending (placeholders shipped): upload the real bank **QR** + account
+ the "Ask for more info" contact link in /admin → Shop. The order route degrades
gracefully if optional columns haven't been added — run these in the Supabase SQL editor
to persist them: `alter table public.shop_orders add column if not exists items jsonb;`
`alter table public.shop_orders add column if not exists ref_code text;`
`alter table public.shop_orders add column if not exists slip_url text;`
`alter table public.shop_orders add column if not exists shipping_image_url text;`
**Admin push alerts (Web Push):** when a buyer declares a transfer (the PAY intent flips
an order to `paid_declared`), `app/api/shop/order/route.ts` calls `sendPushToAll()`
(`lib/push.ts`) to fire an **OS notification (sound + vibration) to every opted-in admin
device — even with the tab closed / phone asleep**. Admin is a shared password (no per-user
identity), so subscriptions are keyed per browser endpoint in the **`push_subscriptions`**
Supabase table (run its `create table` from `schema.sql`). Opt-in UI is
`components/admin/PushNotifications.tsx` (mounted in `AdminApp.tsx`): it registers the
service worker **`public/sw.js`**, requests permission, subscribes via `PushManager`, and
POSTs to `/api/admin/push/subscribe`; a **ทดสอบ** button hits `/api/admin/push/test`.
Requires VAPID env vars in `.env.local` **and Vercel** (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` is
baked at BUILD time → must be set before the deploy that should expose it):
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (generate once with
`node -e "console.log(require('web-push').generateVAPIDKeys())"`). The feature degrades to
"ยังไม่ได้ตั้งค่า VAPID keys" if unset. **iOS caveat:** Safari only delivers Web Push when
the site is added to the Home Screen (installed as a PWA); desktop Chrome/Edge/Firefox and
Android Chrome work directly.
Shop paid-order email notifications through the site's Formspree endpoint are optional
and off by default (`SHOP_ORDER_EMAIL_NOTIFICATIONS=false` / unset). Keep them off unless
the team intentionally wants email as a paid/secondary channel; Admin Web Push + `/admin`
Orders are the primary path and are not subject to Formspree's monthly submission limit.

**PWA / install prompt:** icons are driven via **`metadata.icons` (config-based), not the
`app/icon.png` file convention** — the files live in `public/` (`icon.png`, `apple-icon.png`,
`icon-{192,512}.png`) so the /admin route can cleanly override them. The public site uses
the NIIGHTMARE logo; **/admin uses the reaper icon** (`public/admin-icon-{192,512}.png`,
`public/admin-apple-icon.png`, flattened onto `#0B0710`) set in `app/admin/page.tsx`
`metadata.icons`. Don't re-add `app/icon.png`/`app/apple-icon.png` (file convention) — they
inject globally and would double up with the metadata icons on /admin.
**Two separate manifests** so the public site and /admin install as distinct Android apps
(a single shared manifest made Android treat the whole origin as one app, so you couldn't
add both): `public/site.webmanifest` (id/scope `/`, linked via root `layout.tsx`
`metadata.manifest`) and `public/admin.webmanifest` (id/scope `/admin`, linked via
`app/admin/page.tsx` `metadata.manifest`, which overrides the root for that route). Don't
re-add a file-based `app/manifest.ts` — it injects a global link on every page and would
double up on /admin. `components/ui/InstallPrompt.tsx` (mounted in the **public** branch of
`Chrome.tsx`, so never on /admin) is a dismissible bottom banner that nudges fans to add the
site: Android/desktop Chrome get a one-tap **Install** via the `beforeinstallprompt` event;
iOS Safari gets the Share→"Add to Home Screen" instructions. It registers `sw.js` site-wide
(its no-op `fetch` handler makes Chrome treat the site as installable), hides when already
in standalone, shows on every visit while ignored, and stays quiet for 3 days after an
explicit ✕ dismissal (`nm-install-dismissed`).

**Buyer order notifications (in-site, no login/push/install):**
`components/shop/OrderStatusToast.tsx` is mounted globally in the **public**
`Chrome.tsx` (never on /admin). On every public page it reads the buyer's local
order ids (`nm-shop-orders`), polls the public `GET /api/shop/order/status`
endpoint (settle + every 90s + on tab-focus, and only when this device actually
has orders), and pops an in-page toast the moment an order reaches a **positive
milestone the buyer hasn't seen yet** — currently `verified` ("payment confirmed"),
`packing` and `shipped`. Deliberately **no OS Web Push / no permission / no PWA install**
(so it also works on iPhone Safari) — the trade-off is the toast only appears
while the buyer has the site open. "Seen" is tracked in its own key
(`nm-shop-status-seen`, id→last-notified status) so each status toasts once even
across reloads; baseline falls back to the locally-stored status so a first run
never re-announces history. The toast links to `/shop?view=orders`, which
ShopClient reads on mount to open the **My Orders** tab. To change which statuses
notify, edit the `NOTIFY` map.

**Buyer order notifications (real Web Push, site closed):** on top of the in-site
toast, buyers can opt into OS push that fires even when the site is closed.
`components/shop/ShopPushToggle.tsx` (mounted at the top of the **My Orders** tab in
`ShopClient`, only when they have ≥1 order) registers `sw.js`, requests permission,
subscribes with the shared VAPID key, and POSTs the subscription + the device's
order UUIDs + lang to **`/api/shop/push/subscribe`** (public — the unguessable
order id is the capability, same model as the status endpoint; upserts the
**`shop_push_subscriptions`** table keyed on endpoint). When the admin PATCHes an
order to a milestone, `app/api/admin/orders/route.ts` calls **`sendPushForOrder()`**
(`lib/push.ts`) which pushes `verified`/`packing`/`shipped` copy (per-subscription
`lang`) to every device that opted in for that order id, pruning dead endpoints.
The toggle re-syncs `order_ids` whenever the buyer's My Orders list changes so a
new order is covered. Reuses the **same VAPID keys + `public/sw.js`** as admin push
(its `notificationclick` now routes by the payload `url`, so buyer alerts open
`/shop?view=orders`). **No install needed on Android/desktop; iPhone must Add-to-Home-
Screen first** (iOS Web Push limitation) — the toggle detects this and shows the
instructions. Run its migration in Supabase (routes degrade to a 503 until then):
`create table` for `shop_push_subscriptions` in `schema.sql`. To change the copy or
which statuses push, edit `SHOP_NOTIFY` in `lib/push.ts`.

Possible follow-ups (only if asked): a real payment gateway (e.g. BCEL OnePay) for
automatic transfer verification; a real `.glb` model + re-enabled vanilla-Three.js
preview.

## Claude Code handoff - launch hardening deploy (2026-07-04)

Latest launch-readiness work was completed, committed, pushed, and promoted on Vercel.

Commit:
- `1d60b7c Harden shop payment flow before launch`
- Pushed to `origin/main`
- Vercel deployment for this commit reached `READY` / `PROMOTED`

What changed:
- Hardened `app/api/shop/order/route.ts`:
  - `body.intent` must now be explicitly `"reserve"` or `"pay"`; missing/unknown intent returns 400.
  - PAY now requires a valid UUID `orderId`, a non-empty sanitized ref code, a payment slip, and configured Supabase storage.
  - PAY updates only an existing row matching `id + ref_code + status='awaiting_payment'`.
  - PAY rejects expired reservations by checking `created_at` against `SHOP_PAYMENT_WINDOW_HOURS`.
  - Removed the old fallback that inserted a fresh `paid_declared` order when update failed. This was the main pre-launch risk.
- Updated `next.config.js` CSP:
  - Dev keeps `'unsafe-eval'` so Next dev hydration/debugging works.
  - Added `https://va.vercel-scripts.com` for Vercel Analytics scripts.
- Updated `app/sitemap.ts` to include `/shop` and `/achievements`.
- Updated `/shop` metadata in `app/shop/page.tsx` so it no longer mentions a removed 3D model.
- Fixed nested landmark markup:
  - `components/layout/Chrome.tsx` no longer wraps `/admin` or `/live/overlay` in an extra `<main>`.
  - `components/shop/ShopClient.tsx` uses non-main wrappers inside the page.
  - `components/sections/RoadmapModal.tsx` uses `<section>` instead of nested `<main>`.
- Fixed Next Image sizing warnings in `components/cards/OpponentLogo.tsx` by switching opponent crests to `fill` inside a fixed relative box.

Validation already run locally before deploy:
- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd audit --omit=dev` passed with 0 vulnerabilities.
- `npm.cmd run build` passed.
- Production-mode local `next start` browser regression passed 30/30 with Playwright/Edge:
  - desktop/mobile `/`, `/matches`, `/roster`, `/sponsors`, `/shop`, `/achievements`, `/privacy`, `/terms`, `/live/overlay`
  - no broken images, horizontal overflow, Next error overlay, critical console errors, or stuck preloader
  - mobile nav + language toggle passed
  - Roadmap modal and sponsor modal passed
  - shop empty-form validation stayed client-side and did not POST
  - unauth admin routes returned 401
  - admin dashboard tabs rendered with a locally minted signed cookie

Production verification after deploy:
- `https://www.niightmareesport.com/` returned 200.
- `/matches` returned 200.
- `/shop` returned 200.
- `/api/content` returned 200 and included shop/sponsors data.
- `/api/admin/orders` returned 401 when unauthenticated.
- `/sitemap.xml` returned 200 and now includes `/shop` and `/achievements`.
- Live `/api/shop/order` guard checks:
  - POST with missing `intent` returned `400 {"error":"Invalid order intent"}`.
  - POST with `intent:"pay"` but no slip returned `400 {"error":"Payment slip is required"}`.

Important constraints for the next agent:
- Do not run `npm run build` while a dev server is active on port 3000; stop it first or `.next` can be corrupted for the running dev server.
- Do not perform a real reserve/pay test against production unless the user explicitly wants a real test order created. The live environment writes to real Supabase tables and uploads to real Supabase Storage.
- If a real final order smoke test is requested, create one small test order, attach a test slip, verify it appears in `/admin -> Orders`, then delete it from admin so the row and uploaded test images are purged.
- Current known non-code launch gaps: sponsor logos are still missing for all 10 sponsors, and WHR / DML / Good Start still have generic descriptions. This is content/asset work, not a code blocker.

## Opponent team logos — auto name→logo registry (2026-07-04)
`/matches` (and home RecentResults + UpcomingMatch) show opponent crests via a **central
registry** `lib/teamLogos.ts`: a map of *normalized* team name → `/public/teams/<slug>.png`.
`OpponentLogo` (`components/cards/OpponentLogo.tsx`) and `UpcomingMatch`'s `Crest` resolve the
logo as `safeImageSrc(match.opponentLogo) || safeImageSrc(teamLogoFor(name))` — so a per-match
`opponentLogo` still wins, otherwise the crest shows **automatically by team name** for every
past & future match, no per-match setup. Add a team once and it applies everywhere. Unknown
teams fall back to the initials monogram (unchanged). (`OpponentLogo` now renders via `fill`
inside a fixed relative box — Codex's Next-Image sizing fix — but the registry fallback is intact.)
- **55 real logos live** (52+ team names). Rebuild the registry block from disk with
  `node scripts/gen-team-logos-map.mjs` (reads `/public/teams/*.png` + the live opponent list,
  prints the `LOGO_BY_TEAM` entries to paste; **keys off the live opponent names**, so it also
  surfaces orphans — e.g. an opponent renamed "Bacon"→"Bacon time" needs the file renamed too).
- **HOW THE LOGOS WERE FETCHED (rate-limit gotcha — read before fetching more):** team names
  match Liquipedia MLBB pages; logo files are `<TeamName>_darkmode/_allmode/_lightmode.png`
  (some year-stamped, e.g. `Team_Falcons_2022_allmode.png`). **Do NOT hit liquipedia.net from our
  IP** — it hard-blocks the whole domain (api.php + `?action=render` + the `commons` CDN) after
  ~10 requests in a rolling ~15-min window, and that block cascades to the jina/wsrv proxies too.
  **The route that works = Photon (Jetpack CDN):**
  `https://i0.wp.com/liquipedia.net/commons/Special:FilePath/<File>?w=256` (also i1/i2). It fetches
  from ITS IP (never ours), follows the `Special:FilePath` redirect without needing the hash,
  resizes via `?w=`, and stays unblocked. A Photon 404 is a trustworthy "file absent". Scripts:
  `scripts/fetch-team-logos.mjs` (guess `<name>_mode.png` across name variants via Photon — got
  51/71), `scripts/fetch-known-logos.mjs` (confirmed filenames). The scorer rejects tournament/
  event logos (kept "RLG Vietnam" from grabbing `Vietnam_MLBB_Championship`). **darkmode files are
  white** (good on the void bg); **lightmode files are dark** (may vanish on the dark site — prefer
  darkmode/allmode). Owner can also just drop image files in `Website/LOGO/` (outer folder) or
  straight into `public/teams/` and ask to wire them; large ones get resized to 256px with
  PowerShell `System.Drawing` (webp isn't readable by System.Drawing — copy those as-is).
- **~15 teams still on the monogram** (odd-cased/absent filenames): The huns…, Nine Esports,
  Nadaeng, RLG Vietnam, ESB Titans/Legacy, DianFengYaoGuai, Vampire Kanagan, Onyx Prime,
  KalahKaluk, Royal Cybersports Club, CRIT x EVO, HTR Hybridz, IDONOTSLEEP. Need the exact
  Liquipedia filename (discovery via jina/allorigins was exhausted at the time) or an owner upload.
- Wrong-org risk: single/generic names can match a *different* org's Liquipedia page. Owner flagged
  Genius/Paradise/Bacon Time/MyWay as wrong autos → replaced with owner-supplied art (a wrong logo
  is worse than a monogram, so remove rather than guess). See also [country flags]: national flag
  beside a name is a **separate** system (`lib/opponentCountries.ts` → `OpponentFlag`, flagcdn);
  its keys must track live opponent-name changes too (fixed "bacon"→"bacon time").

## Achievements page figures are DERIVED from /matches (2026-07-04)
`components/clients/AchievementsClient.tsx` no longer hand-keeps its hero numbers. `lib/
achievementsDerived.ts` computes them from `content.matches.tournaments` (the SAME list /matches
uses), so they auto-update with results:
- **Total Winnings** = Σ `prizeToUsd(t.prize)` (parses "$3,000" / "29,000$" / "$3,072.51" / "-"),
  shown compact (`$109K`). **Championships** stat = count of first-place placements.
- **Placement table** (`PodiumDashboard`) = per-tier `{first,second,third,top3,all}` where tier =
  `tournamentTier(name)` and rank is parsed from the free-form `placement` ("Champion"/"Runner-up"/
  "1st"; ranges like "22nd–23rd" → not podium). Untiered events go in a new **"Other"** row
  (`PlacementSummaryTier` gained `"Other"`) so all 21 entries are counted, not just tiered ones.
- **GOTCHA — total can trail Liquipedia** if the source `prize` fields are blank/`-`. e.g. the
  ESL Snapdragon Pro Series S1/S3/S6, Kohai SEAC S2, VMWI rows have `-` → summed as 0, so the site
  showed $108,692 vs Liquipedia's $113,338 ($4,646 gap). Fix = fill those prizes in the data
  (admin / the tournaments source), NOT hardcode the total — the derivation is correct.

## /matches tournament dropdown — custom portaled Select (2026-07-04)
The Tournament filter in `MatchesClient.tsx` is a **custom `TournamentSelect`**, not a native
`<select>` (the list is long AND the filter sits inside two `overflow-hidden` ancestors, so a
native/absolute popup spilled off-screen). It renders its menu `position:fixed` **portaled to
`document.body`** (same trick as the sponsor/shop popups), anchored under the trigger via
`getBoundingClientRect()`, width = trigger, `maxHeight` capped to ~60vh (mobile-toolbar safe) and
clamped horizontally. Options **wrap** in a smaller font (no truncation) + tier group headers.
Closes on outside-click / Escape / scroll. The other filters (Game/Year/Result/Sort) stay native.

## Claude Code handoff - achievements, sponsors, roadmap, and Orders UX (2026-07-11)

This batch is complete, committed, pushed to `origin/main`, and deployed to production.
The latest Vercel deployment for `f8c2636` reached `READY`.

Commits, oldest to newest:
- `c74b5eb Remove achievements legacy view`
- `8a68bd1 Simplify sponsors CTA and admin`
- `9626328 Move sponsor CTA copy onto button`
- `5862f74 Make roadmap statuses admin controlled`
- `f8c2636 Redesign desktop order management`

### Achievements public page

File:
- `components/clients/AchievementsClient.tsx`

Changes:
- `/achievements` is now one Overview page only.
- Removed the Overview/Legacy tab switch and all public Legacy roster/staff rendering.
- Legacy data shapes and admin data were deliberately preserved for backward compatibility;
  they are simply not rendered on the public page.

### Sponsors CTA and admin cleanup

Files:
- `components/clients/SponsorsClient.tsx`
- `components/admin/SponsorsEditor.tsx`
- `data/sponsors.json`

Changes:
- The bottom Sponsors CTA contains one centered Facebook button only.
- The button label is `Become Our Partner` and its Lao translation. The same phrase is no
  longer rendered as a separate heading.
- The link comes from `site.contact.facebook`, with
  `https://facebook.com/niightmareesports` as a safe fallback.
- Removed the CTA email button.
- `/admin -> Sponsors` now exposes only live partner-row fields: name, logo, website,
  category, description, and per-sponsor social/contact channels.
- Removed the misleading Sponsors page-copy editor. That editor was seed-only and its
  saves never affected the public site because the Sponsors `page` block is not persisted
  by the Supabase sponsors branch.
- Removed unused page-copy fields from `data/sponsors.json`: old partner/tier labels,
  tier intro, CTA body, and old primary/secondary CTA definitions.

### Roadmap status control

Files:
- `components/admin/RoadmapEditor.tsx`
- `components/sections/RoadmapModal.tsx`
- `lib/roadmap.ts`

Changes:
- `/admin -> Home -> Niightmare Roadmap` now gives every stage a clear Thai status select:
  completed, competing now, or up next.
- Removed the manual `Active stage ID` field from the admin UI.
- Selecting a stage as active updates `activeStageId` automatically and demotes any other
  active stage to future. Changing the current active stage to past/future stores an empty
  `activeStageId`, and `resolveRoadmap()` now respects that instead of forcing the default.
- Public labels are bilingual and fixed by state: `COMPLETED`, `COMPETING NOW`, `UP NEXT`
  plus Lao equivalents. The future icon is now a calendar/clock rather than a lock.
- Existing `site_settings.roadmap` JSONB persistence is reused; no migration is required.

### Desktop Orders workspace

Files:
- `components/admin/OrdersEditor.tsx`
- `components/admin/AdminApp.tsx`

Changes:
- At `xl` desktop widths, `/admin -> Orders` is now a two-pane workspace:
  - left: dense, scannable order table;
  - right: sticky selected-order detail and action panel.
- The table exposes reference/customer, slip thumbnail, sizes/quantity/courier, amount,
  status, transfer timestamp, and duplicate warning without opening every card.
- Selecting an order is keyboard-accessible through a real button in the order cell.
- The detail panel centralizes reference/amount copy actions, full slip, item breakdown,
  customer/contact/address, shipping image management, quick advance, manual status, and
  permanent delete.
- Courier grouping and per-courier bulk advance remain available in desktop table headers.
- The existing mobile/narrow-screen card workflow is preserved below `xl`.
- Only the Orders tab expands the admin content width to `max-w-[1500px]`; other admin tabs
  keep the previous `max-w-5xl` layout.

### Validation and production checks

Local checks passed after the final Orders/Roadmap changes:
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`

Production checks after deploy:
- Vercel deployment for `f8c2636` reached `READY`.
- `https://www.niightmareesport.com/matches` returned 200.
- `https://www.niightmareesport.com/admin` returned 200.
- Deployed admin bundles contained the new Orders table/detail-panel markers and all three
  Roadmap admin status labels.
- Unauthenticated `GET /api/admin/orders` returned 401.
- No real production order was created, changed, or deleted during verification.

Known QA limitation and recommended first follow-up:
- The in-app browser backend was unavailable during the final Orders visual pass, so there
  is no screenshot-based desktop QA for the new two-pane layout yet.
- Before making further visual refinements, sign in to `/admin`, open Orders on a screen at
  least 1280px wide, and inspect the real table/detail split with existing orders. Do not
  change statuses or delete orders merely for visual testing.
- If the owner requests refinements, preserve all existing API calls and mobile cards; focus
  on desktop density, column widths, panel scroll behavior, and action prominence.

## Claude Code handoff - sponsors tile, achievements prize hero, player modal (2026-07-13)

All of this batch is complete, committed, pushed to `origin/main`, and deployed to
production (each change verified `READY` on Vercel before moving on). Commits, oldest to
newest:
- `888fd37 Document 2026-07-11 handoff in AGENTS.md` (docs only)
- `5ff9640 Show only name on sponsor tiles`
- `ebacb3f Feature total prize on achievements hero`
- `7f6449a Trim achievements hero to prize only`
- `4ef89e1 Make prize hero heading white`
- `d0e6a4d Refine player profile modal, drop bio`
- `131db26 Use image flag in player modal country tile`

Every change passed `npx.cmd tsc --noEmit` + `npm.cmd run lint` locally, then was verified
live by fetching the page HTML through `https://www.niightmareesport.com/...` (client-only
UI — the profile modal and count-up — is verified via tsc+lint per the headless-hydration
limitation, not screenshots).

### Sponsors — logo-first tiles show only the name
File: `components/clients/SponsorsClient.tsx`.
- The outer partner-grid tile (`SponsorCard`) now renders **only the logo + name** — the
  category caption line (and the hover "View" hint) under the name were removed. The full
  category chip + description + Connect channels still live in the sponsor **popup**
  (`SponsorModal`), untouched. Removed the now-dead `COPY.open` and the `category`/`pick`
  locals from `SponsorCard`.
- The per-sponsor `category` still ships in the page's serialized content data (the popup
  uses it) — so grepping the live HTML still finds e.g. "Automotive"; that's the data blob,
  not a visible tile caption. Confirm removal by the absence of the tile caption class
  (`... tracking-[0.16em] text-ash-dim`), which is what I checked live.

### Achievements — Total Record replaced by a single prize hero
File: `components/clients/AchievementsClient.tsx`.
- The four Total Record stat cards (Established year, Championships, World Championship,
  Winnings) were **replaced by one premium hero**: a colossal gold-to-violet gradient
  numeral of the **total prize won**, e.g. `$113,338`. It **counts up on mount** via a new
  local `useCountUp` hook (ease-out cubic, `requestAnimationFrame`) that **honours
  `prefers-reduced-motion`** (jumps to the final value) and starts from 0 (so SSR/first
  paint shows `$0` then animates — acceptable, it fades in with the container).
- The amount stays **derived live** from the tournament list: `deriveTotalWinnings(tournaments)`
  gives the raw number (now shown in **full** `toLocaleString`, not the old `$113K` compact),
  with the authored seed `winnings` stat value as the fallback when the list is empty. An
  `aria-label` carries the final exact figure for screen readers during the count.
- Copy: after two follow-up tweaks the hero now shows just the heading **"Total prize won"**
  (`labels.prizeWon`, bilingual, colored `text-soul`/white) + the numeral. The earlier
  "TOTAL RECORD" eyebrow and the "Across N tournaments" sub-line were both removed.
- Removed imports/vars that went unused: `deriveChampionships`, `formatUsdCompact`, and the
  `championships` memo. The **Placement Table** (`PodiumDashboard`) below is unchanged.
- The gradient is an arbitrary Tailwind value: `bg-[linear-gradient(176deg,#FBE9C0_2%,
  #F5C451_18%,#C77DFF_60%,#A855F7_100%)] bg-clip-text text-transparent` + a violet
  `drop-shadow` filter. If you touch it, keep spaces as underscores inside the arbitrary value.

### Roster — player profile modal redesign + country flag fix
File: `components/cards/PlayerModal.tsx` (the popup opened from a `PlayerCard`, lazy-loaded
via `PlayerModalHost`; the grid `PlayerCard` itself was **not** changed).
- **Removed the ABOUT / bio section** entirely (it read `player.description` and showed a
  "TBA" placeholder when empty). `player.description` is still a valid field on the type and
  still editable in admin — it's simply no longer rendered. Dropped the now-unused `bio`/`tba`
  locals and the `roster.about_label` usage.
- **Premium pass** on the right detail column: a bladed skewed accent bar under the IGN, the
  role is now a glowing bordered **chip** (was a left-rule label), and the vitals
  (country / birth date / age) are **`StatTile`s** — a new local component with a corner
  lucide icon (`MapPin`/`CalendarDays`/`Clock`), a violet hover edge + top hairline. Tenure
  rows gained a glowing amethyst node dot. Two-column layout + bottom social row unchanged.
- **Country now shows a real image flag + name.** The modal previously used `countryFlag()`
  (an emoji regional-indicator flag) which **does not render on Windows** (shows the letters
  "LA"). It now uses `countryFlagImageUrl()` (flagcdn PNG) like the grid card, plus the
  country name. It resolves the code the same way the card does — a copied
  `fallbackCountryCode(player)` (PH for a few known IGNs, else LA) — so a flag always appears.
  NB: `calculateAge` (in `lib/personProfile.ts`) is already **auto-computed** from `birthDate`
  vs `new Date()` at render, correctly decrementing before the birthday — it self-updates, no
  manual age field.

### Still-open / recommended follow-ups (unchanged, content/asset work)
- Sponsor **logo files** are still missing for all 10 partners (tiles render the name
  wordmark until real logos are uploaded in `/admin → Sponsors`, folder `sponsors`). The
  owner sent a single combined "Thank you" graphic of 8 logos but no separate files yet;
  from that image DML is a **delivery/logistics** brand ("Deliver·Move·Life") — one of the
  three previously-unknown partners (WHR / DML / Good Start).
- The 2026-07-11 desktop **Orders** two-pane layout still has no screenshot-based QA (see the
  previous handoff) — verify by signing into `/admin` on a ≥1280px screen with real orders.

## Codex handoff - order privacy, 30-day retention, atomic admin saves (2026-07-13)

Code commit `115f6f6` is pushed to `origin/main` and deployed `READY` on Vercel. The
production domain was checked after deploy: `/`, `/shop`, `/privacy`, `/terms`, `/admin`,
and `/api/content` returned 200; unauthenticated admin-orders and retention-cron requests
returned 401; a PAY request for a nonexistent order returned 409 before accepting a slip.
Vercel reported no runtime errors during the verification window.

### Shop-order privacy and payment integrity
- Payment slips and shipping proof now use the private Supabase Storage bucket
  `order-evidence`. Database values are opaque `order-evidence:<path>` references, and
  authorized reads receive short-lived signed URLs. The one existing legacy public slip
  was copied into the private bucket, its database value was updated, and the old public
  object was removed.
- `lib/supabaseStorage.ts` validates and re-encodes order evidence with Sharp as JPEG,
  strips metadata, caps dimensions, signs private reads, and deletes both new private refs
  and legacy public URLs. Site/editor media intentionally stays in the public `uploads`
  bucket because those images are public content.
- The PAY route verifies the order UUID, reference, status, and 24-hour payment window
  before uploading a slip. It treats the reserved database row as authoritative for
  notifications and the response, deletes a newly uploaded object if the database update
  loses a race/fails, and never returns the internal slip reference to the buyer.
- Reference codes are generated server-side. Buyer push subscriptions are size-limited
  and can only reference order IDs that exist. The service worker no longer posts a
  buyer subscription to the admin-only endpoint after a subscription change.

### 30-day retention
- Owner decision: two trusted admins may continue sharing the admin password. Personal
  shop-order data and evidence must be retained for 30 days, not 90 days.
- `lib/orderRetention.ts` deletes private evidence after 30 days from `created_at`.
  Unpaid reservations are deleted; paid/processed rows are anonymized by removing customer
  identity, contact/address, note, reference, and evidence fields. Aggregate sales fields
  (dates/status/items/quantity/prices/total/currency/courier) remain for reporting.
- Buyer-side `nm-shop-orders` copies are also removed after 30 days. The daily protected
  route is `/api/cron/order-retention`; Vercel Cron is active at `15 18 * * *` (01:15 in
  Bangkok/Lao time). `CRON_SECRET` is configured as a sensitive Production environment
  variable. Keep the single retention duration in `lib/shop.ts`.

### Database and admin-save hardening
- Applied production migration `20260713143157_harden_order_privacy_and_content_saves.sql`.
  It creates the private bucket, adds/backfills order fields, adds `anonymized_at`, installs
  indexes, fixes the trigger function search path, and creates the service-role-only
  `replace_content_section` RPC.
- Multi-table admin saves now use that RPC transactionally instead of delete-then-insert,
  so a failed save rolls back instead of leaving live content empty. Anonymous and
  authenticated roles cannot execute the RPC; the service role can.
- `/api/admin/data` now enforces a 5 MB body limit plus section-specific complete-payload
  validation. An authenticated `{}` save is rejected with 400 rather than wiping a section.

### Legal, accessibility, and validation
- Privacy and Terms were updated on 2026-07-13 for private signed evidence, providers,
  localStorage, 30-day retention/anonymized statistics, the 24-hour reservation window,
  manual payment verification, delivery estimates, and case-by-case cancellation/refunds.
- Fixed footer/marquee contrast, the language control's accessible name, and explicit
  labels for admin password/TOTP inputs.
- Passed `npm run typecheck`, `npm run lint`, `npm audit --omit=dev` (0 vulnerabilities),
  `npm run build`, local production API checks, desktop/mobile Playwright smoke checks, and
  Lighthouse accessibility (100). Supabase security/performance advisors were reviewed;
  remaining findings are intentional service-role tables, unused Supabase Auth password
  protection, and expected unused/legacy indexes.

### Still pending owner assets
- No separate sponsor logos, player photos, jersey front/back photos, or final bank QR were
  available during this pass. Existing deliberate placeholders/wordmarks remain until the
  owner supplies or uploads them through `/admin`.
