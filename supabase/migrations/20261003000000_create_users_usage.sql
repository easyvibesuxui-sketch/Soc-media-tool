-- Applied to project dppbsfngrlavgcbmqmgu (postcraft-ai, eu-central-1).

-- Per-user plan + daily usage. Clients may read their own row but never write
-- it directly (is_paid must not be self-settable).
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  is_paid     boolean not null default false,
  daily_count integer not null default 0 check (daily_count >= 0),
  last_reset  date    not null default current_date,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users read own row"
  on public.users for select
  to authenticated
  using ((select auth.uid()) = id);

-- Create the row at sign-up so the app never has to race to insert it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic usage increment for a given user (resets on a new UTC day). Server-only.
create or replace function public.increment_usage(p_user_id uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.users (id, daily_count, last_reset)
  values (p_user_id, 1, (now() at time zone 'utc')::date)
  on conflict (id) do update
    set daily_count = case
          when public.users.last_reset = (now() at time zone 'utc')::date
          then public.users.daily_count + 1 else 1 end,
        last_reset = (now() at time zone 'utc')::date
  returning daily_count;
$$;

revoke execute on function public.increment_usage(uuid) from public, anon, authenticated;
grant execute on function public.increment_usage(uuid) to service_role;
