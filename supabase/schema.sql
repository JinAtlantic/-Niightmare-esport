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
  birth_date      date,
  country_code    text,
  country_en      text,
  country_lo      text,
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
  country_code    text,
  country_en      text,
  country_lo      text,
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
  vods            jsonb   default '[]'::jsonb,
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

-- ── COMMUNITY / FAN AUTH ───────────────────────────────────────────────────
-- Fan profiles mirror Supabase Auth users. The website writes likes/comments
-- with the anon key, protected by RLS, so users must sign in with Google or a
-- Magic Link before interacting.
create table if not exists public.fan_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  avatar_url      text,
  provider        text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.player_likes (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null references public.players(id) on delete cascade,
  user_id         uuid not null references public.fan_profiles(id) on delete cascade,
  created_at      timestamptz default now(),
  unique (player_id, user_id)
);

create table if not exists public.player_comments (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null references public.players(id) on delete cascade,
  user_id         uuid not null references public.fan_profiles(id) on delete cascade,
  body            text not null check (char_length(trim(body)) between 1 and 500),
  status          text not null default 'visible',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.team_likes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.fan_profiles(id) on delete cascade,
  created_at      timestamptz default now(),
  unique (user_id)
);

create table if not exists public.team_comments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.fan_profiles(id) on delete cascade,
  body            text not null check (char_length(trim(body)) between 1 and 500),
  status          text not null default 'visible',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_player_likes_player_id on public.player_likes(player_id);
create index if not exists idx_player_likes_user_id on public.player_likes(user_id);
create index if not exists idx_player_comments_player_created on public.player_comments(player_id, created_at desc);
create index if not exists idx_player_comments_status_created on public.player_comments(status, created_at desc);
create index if not exists idx_team_comments_status_created on public.team_comments(status, created_at desc);
create index if not exists idx_team_likes_user_id on public.team_likes(user_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'player_comments_status_check'
      and conrelid = 'public.player_comments'::regclass
  ) then
    alter table public.player_comments
      add constraint player_comments_status_check
      check (status in ('visible', 'review', 'hidden'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_comments_status_check'
      and conrelid = 'public.team_comments'::regclass
  ) then
    alter table public.team_comments
      add constraint team_comments_status_check
      check (status in ('visible', 'review', 'hidden'));
  end if;
end $$;

-- Backfill columns that may be missing on a members table created by an earlier
-- (Stage 0) run, so the updated_at trigger below has a column to write to.
alter table public.members add column if not exists updated_at timestamptz default now();
alter table public.players add column if not exists birth_date date;
alter table public.players add column if not exists country_code text;
alter table public.players add column if not exists country_en text;
alter table public.players add column if not exists country_lo text;
alter table public.members add column if not exists country_code text;
alter table public.members add column if not exists country_en text;
alter table public.members add column if not exists country_lo text;
alter table public.upcoming_match add column if not exists stream_url text;
-- Optional 3-letter opponent short code shown when no opponent logo is set.
alter table public.matches add column if not exists opponent_abbr text;
alter table public.upcoming_match add column if not exists opponent_abbr text;
alter table public.matches add column if not exists vods jsonb default '[]'::jsonb;
-- Optional best-of / series format label (e.g. "BO3") for a fixture / record.
alter table public.matches add column if not exists bo text;
alter table public.upcoming_match add column if not exists bo text;
-- Home "About Us" band copy (admin-editable), stored as one JSON blob.
alter table public.site_settings add column if not exists about_us jsonb;
-- Matches-page "Niightmare Roadmap" popup (admin-editable), stored as one JSON blob.
alter table public.site_settings add column if not exists roadmap jsonb;
-- Achievements page content (admin-editable), stored as one JSON blob.
alter table public.site_settings add column if not exists achievements jsonb;
-- Home upcoming-match schedule popup (admin-editable), stored as one JSON blob.
alter table public.site_settings add column if not exists match_schedule jsonb;
-- Shop / 3D jersey config (admin-editable): price, stock, size chart, order links.
alter table public.site_settings add column if not exists shop jsonb;

-- ── STORAGE BUCKET (admin media + customer payment slips) ───────────────────
-- All image uploads live in one public bucket. Moved off Vercel Blob, whose free
-- store gets suspended at its usage cap (`limits-exceeded-suspended`), silently
-- breaking every upload. Public-read; writes are service-role only from the API
-- routes (app/api/admin/upload, app/api/shop/order via lib/supabaseStorage.ts).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 5242880,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── SHOP ORDERS (customer jersey orders) ────────────────────────────────────
-- Written ONLY by the server route (service role) after a buyer declares their
-- bank transfer; read ONLY in the admin Orders tab. RLS on with no anon policy
-- so the public anon key can neither read nor write customer data.
create table if not exists public.shop_orders (
  id              uuid primary key default gen_random_uuid(),
  quantity        int,
  size            text,
  unit_price      bigint,
  total           bigint,
  currency        text,
  customer_name   text,
  phone           text,
  courier         text,
  province        text,
  city            text,
  branch          text,
  status          text default 'paid_declared',  -- paid_declared | verified | shipped | cancelled
  note            text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
-- Per-size breakdown for multi-size orders: [{ sizeId, label, quantity, unitPrice, lineTotal }, …]
alter table public.shop_orders add column if not exists items jsonb;
-- Short order reference code (e.g. "NM-7K3QX") the buyer is asked to put in the
-- transfer note, so the team can match a payment to one order (manual, no gateway).
alter table public.shop_orders add column if not exists ref_code text;
-- Public URL of the customer-uploaded payment slip image (Supabase Storage).
alter table public.shop_orders add column if not exists slip_url text;
-- Email of the signed-in buyer (the shop now requires sign-in to order). The
-- order route degrades gracefully if this column is missing, but add it to keep it.
alter table public.shop_orders add column if not exists user_email text;
-- Public URL of an admin-uploaded shipping image (e.g. the courier branch's
-- parcel/receipt number) shown to the buyer in My Orders once shipped.
alter table public.shop_orders add column if not exists shipping_image_url text;
alter table public.shop_orders enable row level security;
drop trigger if exists set_shop_orders_updated_at on public.shop_orders;
create trigger set_shop_orders_updated_at before update on public.shop_orders for each row execute function public.set_updated_at();
drop policy if exists "members are publicly readable" on public.members;

-- Web Push subscriptions for admin order alerts. One row per browser/device that
-- opted in (admin has no per-user identity — it's a shared password — so we key
-- on the push endpoint). Service-role only; never publicly readable.
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text unique not null,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz default now()
);
alter table public.push_subscriptions enable row level security;

-- Privacy backfill: Magic Link users may not have a provider display name.
-- Never expose an email address as the public fan name.
update public.fan_profiles
set display_name = 'NIIGHTMARE Fan'
where display_name ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';

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

alter table public.fan_profiles enable row level security;
drop policy if exists "public read fan_profiles" on public.fan_profiles;
create policy "public read fan_profiles" on public.fan_profiles for select using (true);
drop policy if exists "fans insert own profile" on public.fan_profiles;
create policy "fans insert own profile" on public.fan_profiles for insert with check (auth.uid() = id);
drop policy if exists "fans update own profile" on public.fan_profiles;
create policy "fans update own profile" on public.fan_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop trigger if exists set_fan_profiles_updated_at on public.fan_profiles;
create trigger set_fan_profiles_updated_at before update on public.fan_profiles for each row execute function public.set_updated_at();

alter table public.player_likes enable row level security;
drop policy if exists "public read player_likes" on public.player_likes;
create policy "public read player_likes" on public.player_likes for select using (true);
drop policy if exists "fans like as self" on public.player_likes;
create policy "fans like as self" on public.player_likes for insert with check (auth.uid() = user_id);
drop policy if exists "fans unlike own" on public.player_likes;
create policy "fans unlike own" on public.player_likes for delete using (auth.uid() = user_id);

alter table public.player_comments enable row level security;
drop policy if exists "public read visible player_comments" on public.player_comments;
create policy "public read visible player_comments" on public.player_comments for select using (status = 'visible');
drop policy if exists "fans comment as self" on public.player_comments;
create policy "fans comment as self" on public.player_comments for insert with check (auth.uid() = user_id and status = 'review');
drop policy if exists "fans update own comments" on public.player_comments;
drop policy if exists "fans delete own comments" on public.player_comments;
create policy "fans delete own comments" on public.player_comments for delete using (auth.uid() = user_id);
drop trigger if exists set_player_comments_updated_at on public.player_comments;
create trigger set_player_comments_updated_at before update on public.player_comments for each row execute function public.set_updated_at();

alter table public.team_likes enable row level security;
drop policy if exists "public read team_likes" on public.team_likes;
create policy "public read team_likes" on public.team_likes for select using (true);
drop policy if exists "fans like team as self" on public.team_likes;
create policy "fans like team as self" on public.team_likes for insert with check (auth.uid() = user_id);
drop policy if exists "fans unlike own team like" on public.team_likes;
create policy "fans unlike own team like" on public.team_likes for delete using (auth.uid() = user_id);

alter table public.team_comments enable row level security;
drop policy if exists "public read visible team_comments" on public.team_comments;
create policy "public read visible team_comments" on public.team_comments for select using (status = 'visible');
drop policy if exists "fans team comment as self" on public.team_comments;
create policy "fans team comment as self" on public.team_comments for insert with check (auth.uid() = user_id and status = 'review');
drop policy if exists "fans update own team comments" on public.team_comments;
drop policy if exists "fans delete own team comments" on public.team_comments;
create policy "fans delete own team comments" on public.team_comments for delete using (auth.uid() = user_id);
drop trigger if exists set_team_comments_updated_at on public.team_comments;
create trigger set_team_comments_updated_at before update on public.team_comments for each row execute function public.set_updated_at();

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
