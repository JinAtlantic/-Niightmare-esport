-- ============================================================================
-- NIIGHTMARE Esports — remove the fan community (likes / comments / sign-in)
-- ============================================================================
-- The site no longer has fan likes, comments, profile editing, or login. Run
-- this whole file in Supabase → SQL Editor to drop the now-unused tables and
-- their data. Idempotent (IF EXISTS) and CASCADE-safe.
--
-- This does NOT touch site content (players, members, matches, news, …),
-- shop_orders, or push_subscriptions — only the community tables.
--
-- Note: the Supabase Auth *users* (Dashboard → Authentication → Users) are
-- separate from these tables. If you also want to clear the accounts people
-- signed up with, delete them there. You may additionally disable the Google
-- and Email (Magic Link) providers under Authentication → Providers so nobody
-- can create new accounts.
-- ============================================================================

drop table if exists public.player_comments cascade;
drop table if exists public.team_comments   cascade;
drop table if exists public.player_likes     cascade;
drop table if exists public.team_likes       cascade;
drop table if exists public.fan_profiles     cascade;
