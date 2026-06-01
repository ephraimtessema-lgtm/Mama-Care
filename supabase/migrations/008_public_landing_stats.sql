-- Public landing page stats (counts only; safe for anonymous visitors)

create or replace function public.get_landing_stats()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'verified_doctors',
    (select count(*)::int from public.doctors where is_verified = true),
    'moms',
    (select count(*)::int from public.profiles where role = 'user')
  );
$$;

revoke all on function public.get_landing_stats() from public;
grant execute on function public.get_landing_stats() to anon, authenticated;
