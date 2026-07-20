-- Admin editors replace a whole content section atomically. Preserve valid
-- UUIDs supplied by the live content read; generate UUIDs only for legacy seed
-- rows, whose historical IDs are not PostgreSQL UUIDs. Hydrate timestamps
-- before jsonb_populate_recordset so NOT NULL/default columns never become null.
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
  hydrated_rows jsonb;
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

  select coalesce(
    jsonb_agg(
      row_data || jsonb_build_object(
        'id', case
          when coalesce(row_data ->> 'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then row_data -> 'id'
          else to_jsonb(gen_random_uuid())
        end,
        'created_at', case
          when jsonb_typeof(row_data -> 'created_at') = 'string' then row_data -> 'created_at'
          else to_jsonb(now())
        end,
        'updated_at', case
          when jsonb_typeof(row_data -> 'updated_at') = 'string' then row_data -> 'updated_at'
          else to_jsonb(now())
        end
      )
    ),
    '[]'::jsonb
  )
  into hydrated_rows
  from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as rows(row_data);

  execute format('delete from %s where true', target);
  if jsonb_array_length(hydrated_rows) > 0 then
    execute format(
      'insert into %1$s select * from jsonb_populate_recordset(null::%1$s, $1)',
      target
    ) using hydrated_rows;
  end if;
end;
$$;

revoke all on function public.replace_content_table_internal(text, jsonb)
  from public, anon, authenticated;
