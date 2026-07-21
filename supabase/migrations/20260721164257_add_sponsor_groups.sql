-- Sponsors are shown in three admin-controlled public sections. Existing rows
-- stay visible by defaulting to the official group.
alter table public.sponsors
  add column if not exists partner_group text not null default 'official';

update public.sponsors
set partner_group = 'official'
where partner_group is null or partner_group not in ('official', 'event', 'past');

alter table public.sponsors alter column partner_group set default 'official';
alter table public.sponsors alter column partner_group set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sponsors_partner_group_check'
      and conrelid = 'public.sponsors'::regclass
  ) then
    alter table public.sponsors
      add constraint sponsors_partner_group_check
      check (partner_group in ('official', 'event', 'past'));
  end if;
end $$;
