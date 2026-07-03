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

**Editable JSON blocks on the "site" section** (About Us, Niightmare Roadmap) live in
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
notify, edit the `NOTIFY` map. If background delivery (site closed) is ever wanted,
upgrade this to real Web Push reusing the admin `lib/push.ts` infra (works on
Android/desktop without install; iOS still needs Add-to-Home-Screen).

Possible follow-ups (only if asked): a real payment gateway (e.g. BCEL OnePay) for
automatic transfer verification; a real `.glb` model + re-enabled vanilla-Three.js
preview.
