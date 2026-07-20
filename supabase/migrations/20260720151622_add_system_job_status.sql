-- Durable heartbeat for production maintenance jobs. This table is internal:
-- only service-role server routes can read or update it.
create table if not exists public.system_job_status (
  job_name text primary key,
  last_started_at timestamptz not null,
  last_finished_at timestamptz,
  last_status text not null
    check (last_status in ('running', 'succeeded', 'partial', 'failed')),
  last_result jsonb not null default '{}'::jsonb,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.system_job_status enable row level security;
revoke all on table public.system_job_status from public, anon, authenticated;
grant select, insert, update, delete on table public.system_job_status to service_role;
