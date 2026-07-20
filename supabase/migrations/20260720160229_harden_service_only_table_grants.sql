-- These tables are accessed only by server routes using the service role.
-- RLS already denies anon/authenticated rows; explicit revokes make that
-- boundary survive an accidental future RLS or policy misconfiguration.
revoke all privileges on table public.shop_orders
  from public, anon, authenticated;
revoke all privileges on table public.push_subscriptions
  from public, anon, authenticated;
revoke all privileges on table public.shop_push_subscriptions
  from public, anon, authenticated;

grant select, insert, update, delete on table public.shop_orders
  to service_role;
grant select, insert, update, delete on table public.push_subscriptions
  to service_role;
grant select, insert, update, delete on table public.shop_push_subscriptions
  to service_role;
