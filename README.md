# NIIGHTMARE Esports — Official Website

Dark, aggressive esports website for **NIIGHTMARE Esports** (Lao PDR) — competing in
**Mobile Legends: Bang Bang (MLBB)** and **eFootball**. Built with Next.js 14 (App
Router), Tailwind CSS, and fully **bilingual (English + Lao)**.

> All site content (news, roster, matches, sponsors, UI text) lives in plain JSON
> files in the [`/data`](./data) folder. **You do not need to write any code to update
> the site** — just edit the values inside those files. See
> [Updating content](#updating-content-no-code) below.

---

## Quick start

```bash
# from this folder (niightmare-esports/)
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # lint
```

### Deploy to Vercel (free tier)

1. Push this repository to GitHub.
2. In Vercel, **New Project → Import** the repo.
3. Set the **Root Directory** to `niightmare-esports`.
4. Framework preset auto-detects **Next.js**. Click **Deploy**. Done.

---

## Updating content (no-code)

Every editable file is in [`/data`](./data). Each translatable value is an object with
two languages:

```json
{ "en": "English text", "lo": "ຂໍ້ຄວາມພາສາລາວ" }
```

Always keep **both** `en` and `lo` fields. The site shows the correct one based on the
visitor's selected language. Never use machine translation for the `lo` field — type the
real Lao text.

> Tip: JSON is picky about punctuation. Keep every `"quote"` and `,` comma exactly as
> shown, and don't remove the surrounding `{ }` / `[ ]`. After editing, you can paste the
> file into <https://jsonlint.com> to check it is valid.

### `data/news.json` — news articles (home page)

```json
{
  "articles": [
    {
      "id": 1,
      "date": "2025-06-10",
      "tag":   { "en": "MATCH RESULT", "lo": "ຜົນການແຂ່ງຂັນ" },
      "title": { "en": "...", "lo": "..." },
      "excerpt": { "en": "...", "lo": "..." },
      "link": "#"
    }
  ]
}
```

- `tag` — use `MATCH RESULT`, `ANNOUNCEMENT`, or `HIGHLIGHTS`.
- `date` — format `YYYY-MM-DD`.
- `link` — where "READ MORE" goes (`#` is a safe placeholder).
- The **home page shows the first 3 articles**.

### `data/roster.json` — players & staff

Two divisions: `mlbb` and `efootball`, each with a `players` array, plus a shared
`staff` array.

```json
{
  "ign": "ReaperX",                       // in-game name (large text)
  "jersey": "07",                         // shown in the avatar circle
  "name": "Somchai Vongsa",               // real name (optional — can be "")
  "role": { "en": "Jungler", "lo": "ຈັງເກີ" },
  "description": { "en": "...", "lo": "..." },
  "socials": { "youtube": "#", "facebook": "#", "tiktok": "#" }
}
```

- MLBB roles: Jungler / Roamer / Gold Laner / Mid Laner / Exp Laner (+ Substitute).
- eFootball roles: Forward / Midfielder / Defender.
- To **add a player**, copy an existing `{ ... }` block, change the values, give it a
  unique `id`, and keep it inside the `players` array.

### `data/matches.json` — results & tournament history

```json
{
  "matches": [
    {
      "id": "m1",
      "date": "2025-06-10",
      "game": "mlbb",                      // "mlbb" or "efootball"
      "tournament": { "en": "...", "lo": "..." },
      "opponent": "Dragon Force",
      "score": "3-1",
      "result": "win",                     // "win" | "loss" | "draw"
      "vod": "#"                            // YouTube link, or null for no button
    }
  ],
  "tournaments": [
    {
      "id": "t1",
      "name": { "en": "...", "lo": "..." },
      "game": "mlbb",
      "placement": { "en": "Champions", "lo": "ຊະນະເລີດ" },
      "prize": "$3,000",                    // use "—" if none
      "season": "2025"
    }
  ]
}
```

- `result` controls the colored badge (green WIN / red LOSS / gray DRAW).
- Set `vod` to `null` (no quotes) when there is no video.

### `data/sponsors.json` — partners & tiers

```json
{
  "sponsors": [ { "id": "s1", "name": "Mekong Mobile", "url": "#" } ],
  "tiers": [
    {
      "id": "tier-title",
      "name": { "en": "TITLE SPONSOR", "lo": "ສະປອນເຊີຫຼັກ" },
      "color": "#C244C4",                   // tier border color
      "benefits": [ { "en": "...", "lo": "..." } ]
    }
  ]
}
```

### `data/site.json` — global settings

Team name, contact links, the **JOIN COMMUNITY** button URL, the **next match** banner,
the contact-form endpoint, and the media-kit link all live here.

```json
{
  "contact": {
    "email": "contact@niightmare.gg",
    "facebook": "https://...",
    "youtube": "https://...",
    "tiktok": "https://...",
    "discord": "https://..."
  },
  "communityUrl": "https://discord.gg/niightmare",
  "formspreeEndpoint": "https://formspree.io/f/your-form-id",
  "mediaKitUrl": "/media-kit.pdf",
  "upcomingMatch": {
    "date": "2025-06-20T19:00:00+07:00",
    "game": "mlbb",
    "tournament": { "en": "...", "lo": "..." },
    "opponent": "Vientiane Vipers"
  }
}
```

### `data/translations.json` — static UI text

All fixed interface text (nav labels, buttons, section headings, form labels, footer).
Each entry is `{ "en": "...", "lo": "..." }`. Edit the strings only — keep the keys
(e.g. `nav.home`) unchanged.

---

## Setting up the contact form (Formspree)

The contact form posts to [Formspree](https://formspree.io) (no backend required).

1. Create a free Formspree form and copy its endpoint
   (e.g. `https://formspree.io/f/abcdwxyz`).
2. Paste it into `formspreeEndpoint` in `data/site.json`.

Until you set a real endpoint, the form will show an error and ask people to email you
directly.

---

## Adding the real logo

The logo is a placeholder component, [`<TeamLogo />`](./components/TeamLogo.tsx), that
draws a purple "NM" circle. When the real artwork is ready:

1. Drop the image into `/public` (e.g. `public/logo.png`).
2. Pass it via the `src` prop, e.g. `<TeamLogo src="/logo.png" />`.

The component is used in the navbar, hero, footer, preloader, and the upcoming-match
banner.

To replace the **favicon**, edit/replace [`app/icon.svg`](./app/icon.svg).

---

## Brand & tech notes

| Token            | Value     | Use                         |
| ---------------- | --------- | --------------------------- |
| Primary          | `#8B2FC9` | Deep purple                 |
| Accent           | `#C244C4` | Reaper magenta / glow       |
| Background        | `#0A0A14` | Void black                  |
| Card background  | `#120D1E` | Cards / panels              |
| Border           | `#2A1545` | Borders                     |
| Text primary     | `#F0F0F0` | Main text                   |
| Text muted       | `#6B6B7A` | Secondary text              |

- **Fonts:** Rajdhani (headings) + Barlow (body) for English; Noto Sans Lao for all Lao
  text (applied automatically when Lao is selected; the base size also bumps up slightly
  for readability).
- **Language toggle** is in the navbar (`EN` / `ລາວ`). The choice is saved to
  `localStorage` and persists between visits. Default is English.
- Stack: Next.js 14 App Router · Tailwind CSS · TypeScript.
