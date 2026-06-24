-- ============================================================================
-- NIIGHTMARE Esports — full Supabase schema (Stage 1)
-- ============================================================================
-- One source of truth for ALL site content. Run this whole file in
-- Supabase → SQL Editor. It is idempotent: safe to run again — it never
-- recreates tables or duplicates seed rows.
--
-- Conventions:
--   • Bilingual text is stored as <field>_en / <field>_lo column pairs.
--   • Every public-facing table allows anonymous SELECT (the site reads with
--     the anon key). NO anonymous write policy — the admin saves through server
--     routes using the service-role key, which bypasses RLS. So the browser key
--     can only ever read.
--   • sort_order drives display order; created_at / updated_at track changes.
-- ============================================================================

-- Auto-touch updated_at on every UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Helper applied per table below: enable RLS + (re)create the public read policy
-- + attach the updated_at trigger. Written inline (no loop) so it stays readable.

-- ── PLAYERS (MLBB + eFootball) ──────────────────────────────────────────────
create table if not exists public.players (
  id              uuid primary key default gen_random_uuid(),
  game            text not null default 'mlbb',  -- 'mlbb' | 'efootball'
  ign             text,
  name            text,
  jersey          text,
  role_en         text,
  role_lo         text,
  description_en  text,
  description_lo  text,
  is_sub          boolean default false,
  photo           text,
  photo_zoom      real    default 1,
  photo_x         int     default 50,
  photo_y         int     default 50,
  heroes          text[]  default '{}',
  win_rate        text,           -- holds the FMVP count (legacy column name)
  gear_device     text,           -- holds the roster tenure periods as JSON (legacy column name)
  gear_audio      text,           -- holds the Liquipedia profile URL (legacy column name)
  email           text,
  facebook        text,
  instagram       text,
  youtube         text,
  tiktok          text,
  whatsapp        text,
  sort_order      int     default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── MEMBERS (Behind the Team / staff) ───────────────────────────────────────
create table if not exists public.members (
  id              uuid primary key default gen_random_uuid(),
  name            text,
  nickname        text,
  official_role   text,  -- owner|founder|ceo|manager|head_coach|coach|analyst|developer|designer|content|other
  game            text,  -- mlbb|efootball for coaches shown under a game lineup; null = back-office
  tier            int,   -- explicit back-office row 1|2|3; null = infer from official_role
  role_en         text,
  role_lo         text,
  bio_en          text,
  bio_lo          text,
  email           text,
  photo           text,
  facebook        text,
  instagram       text,
  youtube         text,
  tiktok          text,
  whatsapp        text,
  sort_order      int     default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── MATCHES (results / fixtures) ────────────────────────────────────────────
create table if not exists public.matches (
  id              uuid primary key default gen_random_uuid(),
  match_date      date,
  game            text,
  tournament_en   text,
  tournament_lo   text,
  round_en        text,
  round_lo        text,
  opponent        text,
  opponent_logo   text,
  score           text,
  result          text,  -- 'win' | 'loss' | 'draw'
  vod             text,
  sort_order      int     default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── TOURNAMENTS (trophy cabinet) ────────────────────────────────────────────
create table if not exists public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  name_en         text,
  name_lo         text,
  game            text,
  placement_en    text,
  placement_lo    text,
  prize           text,
  season          text,
  sort_order      int     default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── NEWS ────────────────────────────────────────────────────────────────────
create table if not exists public.news (
  id              uuid primary key default gen_random_uuid(),
  news_date       date,
  tag_en          text,
  tag_lo          text,
  title_en        text,
  title_lo        text,
  excerpt_en      text,
  excerpt_lo      text,
  link            text,
  sort_order      int     default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── SPONSOR TIERS ───────────────────────────────────────────────────────────
create table if not exists public.sponsor_tiers (
  id              uuid primary key default gen_random_uuid(),
  name_en         text,
  name_lo         text,
  color           text,
  benefits        jsonb   default '[]'::jsonb,  -- [{ "en": "...", "lo": "..." }, ...]
  sort_order      int     default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── SPONSORS ────────────────────────────────────────────────────────────────
create table if not exists public.sponsors (
  id              uuid primary key default gen_random_uuid(),
  name            text,
  url             text,
  logo            text,
  tier_id         uuid references public.sponsor_tiers(id) on delete set null,
  sort_order      int     default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── UPCOMING MATCH (single row, home hero) ──────────────────────────────────
create table if not exists public.upcoming_match (
  id              int primary key default 1 check (id = 1),
  status          text,  -- 'next' | 'live' | 'practice'
  match_date      timestamptz,
  game            text,
  tournament_en   text,
  tournament_lo   text,
  round_en        text,
  round_lo        text,
  opponent        text,
  opponent_logo   text,
  stream_url      text,
  updated_at      timestamptz default now()
);

-- ── SITE SETTINGS (single row, team + contact/footer) ───────────────────────
create table if not exists public.site_settings (
  id                 int primary key default 1 check (id = 1),
  team_name          text,
  team_full_name     text,
  region_en          text,
  region_lo          text,
  email              text,
  facebook           text,
  instagram          text,
  youtube            text,
  tiktok             text,
  discord            text,
  community_url      text,
  formspree_endpoint text,
  media_kit_url      text,
  updated_at         timestamptz default now()
);

-- Backfill columns that may be missing on a members table created by an earlier
-- (Stage 0) run, so the updated_at trigger below has a column to write to.
alter table public.members add column if not exists updated_at timestamptz default now();
alter table public.upcoming_match add column if not exists stream_url text;
-- Optional 3-letter opponent short code shown when no opponent logo is set.
alter table public.matches add column if not exists opponent_abbr text;
alter table public.upcoming_match add column if not exists opponent_abbr text;
-- Home "About Us" band copy (admin-editable), stored as one JSON blob.
alter table public.site_settings add column if not exists about_us jsonb;
drop policy if exists "members are publicly readable" on public.members;

-- ============================================================================
-- Row Level Security: public read everywhere, writes only via service role.
-- Plain per-table statements (re-runnable) — read each as: turn on RLS, allow
-- everyone to SELECT, and auto-stamp updated_at on UPDATE.
-- ============================================================================

alter table public.players enable row level security;
drop policy if exists "public read players" on public.players;
create policy "public read players" on public.players for select using (true);
drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at before update on public.players for each row execute function public.set_updated_at();

alter table public.members enable row level security;
drop policy if exists "public read members" on public.members;
create policy "public read members" on public.members for select using (true);
drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at before update on public.members for each row execute function public.set_updated_at();

alter table public.matches enable row level security;
drop policy if exists "public read matches" on public.matches;
create policy "public read matches" on public.matches for select using (true);
drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at before update on public.matches for each row execute function public.set_updated_at();

alter table public.tournaments enable row level security;
drop policy if exists "public read tournaments" on public.tournaments;
create policy "public read tournaments" on public.tournaments for select using (true);
drop trigger if exists set_tournaments_updated_at on public.tournaments;
create trigger set_tournaments_updated_at before update on public.tournaments for each row execute function public.set_updated_at();

alter table public.news enable row level security;
drop policy if exists "public read news" on public.news;
create policy "public read news" on public.news for select using (true);
drop trigger if exists set_news_updated_at on public.news;
create trigger set_news_updated_at before update on public.news for each row execute function public.set_updated_at();

alter table public.sponsor_tiers enable row level security;
drop policy if exists "public read sponsor_tiers" on public.sponsor_tiers;
create policy "public read sponsor_tiers" on public.sponsor_tiers for select using (true);
drop trigger if exists set_sponsor_tiers_updated_at on public.sponsor_tiers;
create trigger set_sponsor_tiers_updated_at before update on public.sponsor_tiers for each row execute function public.set_updated_at();

alter table public.sponsors enable row level security;
drop policy if exists "public read sponsors" on public.sponsors;
create policy "public read sponsors" on public.sponsors for select using (true);
drop trigger if exists set_sponsors_updated_at on public.sponsors;
create trigger set_sponsors_updated_at before update on public.sponsors for each row execute function public.set_updated_at();

alter table public.upcoming_match enable row level security;
drop policy if exists "public read upcoming_match" on public.upcoming_match;
create policy "public read upcoming_match" on public.upcoming_match for select using (true);
drop trigger if exists set_upcoming_match_updated_at on public.upcoming_match;
create trigger set_upcoming_match_updated_at before update on public.upcoming_match for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;
drop policy if exists "public read site_settings" on public.site_settings;
create policy "public read site_settings" on public.site_settings for select using (true);
drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

-- ============================================================================
-- Seed the single-row config tables with the current site values (only when
-- empty — never overwrites your edits). Content tables (players, matches, news,
-- sponsors…) are migrated in Stage 3 from the live data, so they stay empty here.
-- ============================================================================
insert into public.upcoming_match (id, status, match_date, game, tournament_en, tournament_lo, round_en, round_lo, opponent, opponent_logo)
values (1, 'next', '2026-07-01T19:00:00+07:00', 'mlbb', 'WILD CARD 2026', 'WILD CARD 2026', 'Semi Final', 'ຮອບຮອງຊະນະເລີດ', 'ONIC', '')
on conflict (id) do nothing;

insert into public.site_settings (id, team_name, team_full_name, region_en, region_lo, email, facebook, instagram, youtube, tiktok, discord, community_url, media_kit_url)
values (1, 'NIIGHTMARE', 'NIIGHTMARE ESPORTS', 'Lao PDR', 'ສປປ ລາວ',
        'contact@niightmare.gg', 'https://facebook.com/niightmareesports', 'https://instagram.com/niightmareesports',
        'https://youtube.com/@niightmareesports', 'https://tiktok.com/@niightmareesports', 'https://discord.gg/niightmare',
        'https://discord.gg/niightmare', '/media-kit.pdf')
on conflict (id) do nothing;
