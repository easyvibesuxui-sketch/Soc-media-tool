-- Lets the server count usage with the caller's own JWT, so the app needs no
-- service-role key. Callers can only ever increase their own counter.
-- (Supabase advisor flags this SECURITY DEFINER as callable by `authenticated`
-- — intentional.)
create or replace function public.increment_my_usage()
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.users (id, email, daily_count, last_reset)
  values ((select auth.uid()), (select auth.jwt() ->> 'email'), 1, (now() at time zone 'utc')::date)
  on conflict (id) do update
    set daily_count = case
          when public.users.last_reset = (now() at time zone 'utc')::date
          then public.users.daily_count + 1 else 1 end,
        last_reset = (now() at time zone 'utc')::date
  returning daily_count;
$$;

revoke execute on function public.increment_my_usage() from public, anon;
grant execute on function public.increment_my_usage() to authenticated;
