-- Sensitive order evidence is private; only service-role API routes write/read.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-evidence',
  'order-evidence',
  false,
  5242880,
  array['image/jpeg']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.shop_orders add column if not exists items jsonb;
alter table public.shop_orders add column if not exists anonymized_at timestamptz;
update public.shop_orders
set items = jsonb_build_array(jsonb_build_object(
  'sizeId', lower(coalesce(size, 'legacy')),
  'label', coalesce(size, 'Legacy order'),
  'quantity', greatest(coalesce(quantity, 1), 1),
  'unitPrice', coalesce(unit_price, case when coalesce(quantity, 0) > 0 then total / quantity else total end, 0),
  'lineTotal', coalesce(total, 0)
))
where items is null;
create index if not exists shop_orders_status_created_idx
  on public.shop_orders (status, created_at desc);
create unique index if not exists shop_orders_ref_code_unique_idx
  on public.shop_orders (ref_code) where ref_code is not null;

-- Fix the mutable search_path warning. This trigger function references no
-- relation, so an empty search_path is both safe and deterministic.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Internal helper for atomic whole-table content replacement. It accepts only
-- an explicit allowlist, uses the table's composite type, and repairs timestamp
-- defaults that jsonb_populate_recordset represents as null.
create or replace function public.replace_content_table_internal(
  p_table text,
  p_rows jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target regclass;
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
    execute format(
      'insert into %1$s select * from jsonb_populate_recordset(null::%1$s, $1)',
      target
    ) using p_rows;
    execute format(
      'update %s set created_at = coalesce(created_at, now()), updated_at = coalesce(updated_at, now())',
      target
    );
  end if;
end;
$$;

create or replace function public.replace_content_section(
  p_section text,
  p_primary jsonb,
  p_secondary jsonb default '[]'::jsonb,
  p_settings jsonb default '{}'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  case p_section
    when 'roster' then
      perform public.replace_content_table_internal('players', p_primary);
      perform public.replace_content_table_internal('members', p_secondary);
      if p_settings ? 'roster_page' then
        insert into public.site_settings (id, roster_page)
        values (1, p_settings -> 'roster_page')
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
    else
      raise exception 'content section not allowed';
  end case;
end;
$$;

revoke all on function public.replace_content_table_internal(text, jsonb)
  from public, anon, authenticated;
revoke all on function public.replace_content_section(text, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_content_section(text, jsonb, jsonb, jsonb)
  to service_role;
