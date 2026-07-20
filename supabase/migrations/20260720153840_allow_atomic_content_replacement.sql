-- pg-safeupdate rejects unfiltered DELETE/UPDATE statements, including the
-- dynamic whole-table replacement used by the admin content editors. Keep the
-- replacement atomic while making both statements explicitly bounded.
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

  execute format('delete from %s where true', target);
  if jsonb_array_length(coalesce(p_rows, '[]'::jsonb)) > 0 then
    execute format(
      'insert into %1$s select * from jsonb_populate_recordset(null::%1$s, $1)',
      target
    ) using p_rows;
    execute format(
      'update %s set created_at = coalesce(created_at, now()), updated_at = coalesce(updated_at, now()) where created_at is null or updated_at is null',
      target
    );
  end if;
end;
$$;

revoke all on function public.replace_content_table_internal(text, jsonb)
  from public, anon, authenticated;
