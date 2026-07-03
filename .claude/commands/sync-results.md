---
description: Pull NIIGHTMARE's latest match results from Liquipedia and publish them live (with a confirm step)
---

Semi-automatic match-result sync. ALWAYS show the owner what's new and wait for
an explicit "yes" before publishing — never publish without confirmation.

Reply to the owner in Thai (they don't read code — keep it plain).

## Steps

1. **Check for new results (read-only, safe).** Run the dry run from the project root:
   ```
   node scripts/sync-results.mjs
   ```
   Use the portable Node if `node` isn't on PATH:
   `C:\Users\iTAPE\AppData\Local\nodejs-portable\node-v22.12.0-win-x64\node.exe`

2. **Report to the owner.**
   - If it prints `Up to date` (0 new): tell them the site already has every recent
     result from Liquipedia — nothing to do. Stop here.
   - If it lists `PROPOSED ADDITIONS`: show them as a short Thai table
     (วันที่ / ทัวร์ / คู่แข่ง / สกอร์ / ชนะ-แพ้ / VOD) and ask
     **"กรอกผลพวกนี้ขึ้นเว็บเลยไหม?"**

3. **Wait for confirmation.** Only if the owner says yes/OK/ตกลง:
   ```
   node scripts/sync-results.mjs --apply
   ```
   This writes to Supabase AND revalidates the public pages instantly (no redeploy).
   It mints the admin token locally from `ADMIN_SECRET` in `.env.local`, so it only
   works on the owner's machine.

4. **Confirm done.** Tell them how many results were published and that they now show
   on the home "Recent Results" band and /matches (with the opponent flag + per-game
   VOD links). If a new opponent has no flag yet, offer to add it to
   `lib/opponentCountries.ts` (see the `/add-flag` pattern).

## Notes
- The sync only adds results **on or after the newest date already on the site**, so it
  never back-fills old/minor matches Liquipedia lists but the owner left off.
- Opponent names + tournament names come from Liquipedia as-is; the owner can rename
  them later in /admin → Match. Small events Liquipedia doesn't cover still need manual
  entry (or an image → I fill it in).
- Never print secrets (ADMIN_SECRET, service-role key, VERCEL_TOKEN).
