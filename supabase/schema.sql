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
returns trigger language plpgsql
set search_path = ''
as $$
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
  category        jsonb,   -- { en, lo } short industry label
  description     jsonb,   -- { en, lo } what the sponsor does (popup)
  socials         jsonb,   -- { facebook, instagram, tiktok, youtube, whatsapp, phone }
  tier_id         uuid references public.sponsor_tiers(id) on delete set null,
  sort_order      int     default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
-- Backfill columns for sponsors created before the popup redesign.
alter table public.sponsors add column if not exists category    jsonb;
alter table public.sponsors add column if not exists description jsonb;
alter table public.sponsors add column if not exists socials     jsonb;

-- ── UPCOMING MATCH (single row, home hero) ──────────────────────────────────
create table if not exists public.upcoming_match (
  id              int primary key default 1 check (id = 1),
  status          text,  -- 'next' | 'live' | 'practice' | 'finished'
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
-- Whether the upcoming fixture will be broadcast live (drives the card badge
-- even before a stream link is set).
alter table public.upcoming_match add column if not exists has_live boolean default false;
-- Result + final score shown when the headline fixture is marked 'finished'.
alter table public.upcoming_match add column if not exists result text;  -- 'win' | 'loss' | 'draw'
alter table public.upcoming_match add column if not exists score text;   -- e.g. '2-1'
-- Home "About Us" band copy (admin-editable), stored as one JSON blob.
alter table public.site_settings add column if not exists about_us jsonb;
-- Matches-page "Niightmare Roadmap" popup (admin-editable), stored as one JSON blob.
alter table public.site_settings add column if not exists roadmap jsonb;
-- Achievements page content (admin-editable), stored as one JSON blob.
alter table public.site_settings add column if not exists achievements jsonb;
-- Home upcoming-match schedule popup (admin-editable), stored as one JSON blob.
alter table public.site_settings add column if not exists match_schedule jsonb;
-- Most-recent finished fixture (shown faded on the schedule popup + results),
-- captured when the admin advances the headline to the next match.
alter table public.site_settings add column if not exists last_result jsonb;
-- Shop / 3D jersey config (admin-editable): price, stock, size chart, order links.
alter table public.site_settings add column if not exists shop jsonb;
-- Roster page copy (admin-editable): hero title/intro, tab + tier labels, stat
-- labels. The player/staff LISTS live in their own tables; this is only the
-- surrounding page text so /admin → Roster → "หน้า Roster (Page)" saves live.
alter table public.site_settings add column if not exists roster_page jsonb;

-- ── STORAGE BUCKETS ──────────────────────────────────────────────────────────
-- Public website media stays CDN-readable. Customer slips and shipping evidence
-- live separately in a private bucket and are displayed through signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 5242880,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-evidence', 'order-evidence', false, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = false,
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
update public.shop_orders
set items = jsonb_build_array(jsonb_build_object(
  'sizeId', lower(coalesce(size, 'legacy')),
  'label', coalesce(size, 'Legacy order'),
  'quantity', greatest(coalesce(quantity, 1), 1),
  'unitPrice', coalesce(unit_price, case when coalesce(quantity, 0) > 0 then total / quantity else total end, 0),
  'lineTotal', coalesce(total, 0)
))
where items is null;
-- Short order reference code (e.g. "NM-7K3QX") the buyer is asked to put in the
-- transfer note, so the team can match a payment to one order (manual, no gateway).
alter table public.shop_orders add column if not exists ref_code text;
-- Private storage reference for the customer-uploaded payment slip.
alter table public.shop_orders add column if not exists slip_url text;
-- Email of the signed-in buyer (the shop now requires sign-in to order). The
-- order route degrades gracefully if this column is missing, but add it to keep it.
alter table public.shop_orders add column if not exists user_email text;
-- Private storage reference for an admin-uploaded shipping image. APIs turn it
-- into a short-lived signed URL for authorized displays.
alter table public.shop_orders add column if not exists shipping_image_url text;
-- Immutable moment the buyer declared their transfer (slip attached). Set once by
-- the PAY route and never touched by admin status changes, so the order's shown
-- "transfer time" can't drift as it advances (verified/packing/shipped).
alter table public.shop_orders add column if not exists paid_at timestamptz;
-- Timestamp set by the 30-day retention job after PII and evidence are removed.
alter table public.shop_orders add column if not exists anonymized_at timestamptz;
create index if not exists shop_orders_status_created_idx on public.shop_orders (status, created_at desc);
create unique index if not exists shop_orders_ref_code_unique_idx on public.shop_orders (ref_code) where ref_code is not null;
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

-- Buyer push subscriptions (no login): a device opts in to alerts for the order
-- UUIDs it holds locally. Service-role only; the unguessable order id is the
-- capability (same model as the public status endpoint). order_ids is refreshed
-- whenever the buyer's My Orders list changes; lang picks the message language.
create table if not exists public.shop_push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text unique not null,
  p256dh      text not null,
  auth        text not null,
  order_ids   jsonb not null default '[]'::jsonb,
  lang        text default 'en',
  user_agent  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.shop_push_subscriptions enable row level security;

-- Atomic content replacement RPC. Admin list editors replace full sections; the
-- transaction prevents a failed insert from leaving a deleted/half-saved table.
create or replace function public.replace_content_table_internal(p_table text, p_rows jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare target regclass;
begin
  target := case p_table
    when 'players' then 'public.players'::regclass
    when 'members' then 'public.members'::regclass
    when 'matches' then 'public.matches'::regclass
    when 'tournaments' then 'public.tournaments'::regclass
    when 'news' then 'public.news'::regclass
    when 'sponsors' then 'public.sponsors'::regclass
    when 'sponsor_tiers' then 'public.sponsor_tiers'::regclass
    else null
  end;
  if target is null then raise exception 'content table not allowed'; end if;
  execute format('delete from %s', target);
  if jsonb_array_length(coalesce(p_rows, '[]'::jsonb)) > 0 then
    execute format('insert into %1$s select * from jsonb_populate_recordset(null::%1$s, $1)', target) using p_rows;
    execute format('update %s set created_at = coalesce(created_at, now()), updated_at = coalesce(updated_at, now())', target);
  end if;
end; $$;

create or replace function public.replace_content_section(
  p_section text,
  p_primary jsonb,
  p_secondary jsonb default '[]'::jsonb,
  p_settings jsonb default '{}'::jsonb
)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  case p_section
    when 'roster' then
      perform public.replace_content_table_internal('players', p_primary);
      perform public.replace_content_table_internal('members', p_secondary);
      if p_settings ? 'roster_page' then
        insert into public.site_settings (id, roster_page) values (1, p_settings -> 'roster_page')
        on conflict (id) do update set roster_page = excluded.roster_page;
      end if;
    when 'matches' then
      perform public.replace_content_table_internal('matches', p_primary);
      perform public.replace_content_table_internal('tournaments', p_secondary);
    when 'news' then
      perform public.replace_content_table_internal('news', p_primary);
    when 'sponsors' then
      perform public.replace_content_table_internal('sponsors', p_primary);
      perform public.replace_content_table_internal('sponsor_tiers', p_secondary);
    else raise exception 'content section not allowed';
  end case;
end; $$;
revoke all on function public.replace_content_table_internal(text, jsonb) from public, anon, authenticated;
revoke all on function public.replace_content_section(text, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.replace_content_section(text, jsonb, jsonb, jsonb) to service_role;

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
