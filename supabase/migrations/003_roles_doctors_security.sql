-- Mama-Care: roles + secure RLS (safe to re-run)
-- Run in Supabase SQL Editor as ONE script.

-- =============================================================================
-- STEP 0: Ensure base tables / columns exist (fixes "user_id does not exist")
-- =============================================================================

-- Doctors table (if you never ran full schema.sql)
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  specialty text,
  bio text,
  hospital text,
  location text,
  phone text,
  email text,
  years_experience int,
  consultation_fee numeric,
  rating numeric,
  is_verified boolean not null default false,
  accepts_online boolean not null default true,
  accepts_physical boolean not null default true,
  created_at timestamptz not null default now()
);

-- Link doctors to login accounts (this column was missing on your project)
alter table public.doctors add column if not exists user_id uuid references auth.users (id) on delete set null;

-- Appointments table (if missing)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id text,
  doctor_name text,
  patient_name text not null,
  patient_email text,
  patient_phone text,
  date text,
  time text,
  type text default 'online',
  reason text,
  status text not null default 'pending',
  is_emergency boolean not null default false,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.appointments add column if not exists user_id uuid references auth.users (id) on delete set null;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  content text,
  category text default 'nutrition',
  trimester text default 'all',
  read_time_minutes int,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profiles: allow doctor role
update public.profiles set role = 'user' where role is null or role not in ('user', 'admin', 'doctor');

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'doctor'));

-- Indexes (only after user_id exists)
create unique index if not exists doctors_user_id_unique on public.doctors (user_id) where user_id is not null;
create index if not exists doctors_email_lower_idx on public.doctors (lower(email));

-- =============================================================================
-- STEP 1: Helper functions
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_doctor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'doctor'
  );
$$;

create or replace function public.my_doctor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.doctors where user_id = auth.uid() limit 1;
$$;

create or replace function public.try_link_doctor_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  with linked as (
    update public.doctors
    set user_id = new.id
    where user_id is null
      and email is not null
      and lower(trim(email)) = lower(trim(new.email))
    returning id
  )
  update public.profiles p
  set role = 'doctor'
  from linked l
  where p.id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_link_doctor on auth.users;
create trigger on_auth_user_link_doctor
  after insert on auth.users
  for each row execute function public.try_link_doctor_account();

create or replace function public.admin_link_doctor_user(p_doctor_id uuid, p_user_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select id into v_user_id
  from auth.users
  where lower(trim(email)) = lower(trim(p_user_email));

  if v_user_id is null then
    raise exception 'No account with that email. Ask them to sign up first.';
  end if;

  update public.doctors set user_id = v_user_id where id = p_doctor_id;

  if not found then
    raise exception 'Doctor not found';
  end if;

  update public.profiles set role = 'doctor' where id = v_user_id;
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_doctor() to authenticated;
grant execute on function public.my_doctor_id() to authenticated;
grant execute on function public.admin_link_doctor_user(uuid, text) to authenticated;

-- =============================================================================
-- STEP 2: RLS policies (drop then create — safe to re-run)
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.articles enable row level security;
alter table public.appointments enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()));

-- Doctors
drop policy if exists "doctors_select_auth" on public.doctors;
drop policy if exists "doctors_all_authenticated" on public.doctors;
drop policy if exists "doctors_select" on public.doctors;
drop policy if exists "doctors_admin_write" on public.doctors;
drop policy if exists "doctors_admin_update" on public.doctors;
drop policy if exists "doctors_admin_delete" on public.doctors;
drop policy if exists "doctors_update_own_profile" on public.doctors;

create policy "doctors_select"
  on public.doctors for select
  using (
    is_verified = true
    or public.is_admin()
    or user_id = auth.uid()
  );

create policy "doctors_admin_write"
  on public.doctors for insert
  with check (public.is_admin());

create policy "doctors_admin_update"
  on public.doctors for update
  using (public.is_admin());

create policy "doctors_admin_delete"
  on public.doctors for delete
  using (public.is_admin());

create policy "doctors_update_own_profile"
  on public.doctors for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Articles
drop policy if exists "articles_select_auth" on public.articles;
drop policy if exists "articles_all_authenticated" on public.articles;
drop policy if exists "articles_select_published" on public.articles;
drop policy if exists "articles_admin_insert" on public.articles;
drop policy if exists "articles_admin_update" on public.articles;
drop policy if exists "articles_admin_delete" on public.articles;

create policy "articles_select_published"
  on public.articles for select
  using (is_published = true or public.is_admin());

create policy "articles_admin_insert"
  on public.articles for insert
  with check (public.is_admin());

create policy "articles_admin_update"
  on public.articles for update
  using (public.is_admin());

create policy "articles_admin_delete"
  on public.articles for delete
  using (public.is_admin());

-- Appointments (requires appointments.user_id — added in STEP 0)
drop policy if exists "appointments_select_own" on public.appointments;
drop policy if exists "appointments_update" on public.appointments;
drop policy if exists "appointments_select" on public.appointments;
drop policy if exists "appointments_insert_own" on public.appointments;
drop policy if exists "appointments_insert_auth" on public.appointments;
drop policy if exists "appointments_update_admin" on public.appointments;
drop policy if exists "appointments_update_doctor" on public.appointments;
drop policy if exists "appointments_update_own_cancel" on public.appointments;

create policy "appointments_select"
  on public.appointments for select
  using (
    auth.uid() = user_id
    or public.is_admin()
    or (
      public.is_doctor()
      and doctor_id is not null
      and doctor_id = public.my_doctor_id()::text
    )
  );

create policy "appointments_insert_own"
  on public.appointments for insert
  with check (
    auth.role() = 'authenticated'
    and (user_id is null or auth.uid() = user_id)
  );

create policy "appointments_update_admin"
  on public.appointments for update
  using (public.is_admin());

create policy "appointments_update_doctor"
  on public.appointments for update
  using (
    public.is_doctor()
    and doctor_id = public.my_doctor_id()::text
  );

create policy "appointments_update_own_cancel"
  on public.appointments for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status in ('pending', 'cancelled'));
