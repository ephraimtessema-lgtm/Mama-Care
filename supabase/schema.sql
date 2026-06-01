-- Mama-Care — Supabase schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin', 'doctor')),
  flower_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  is_emergency boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_user_id_created on public.ai_chat_messages (user_id, created_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mama-Care tables
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null default 'general',
  flower_name text,
  likes int not null default 0,
  replies jsonb not null default '[]'::jsonb,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

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
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

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

create table if not exists public.mother_chat_messages (
  id uuid primary key default gen_random_uuid(),
  room text not null default 'general',
  sender_name text not null,
  sender_email text,
  content text not null,
  created_at timestamptz not null default now()
);

-- DevForge / workspace tables (optional)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null default 'Untitled Project',
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  role text not null,
  content text not null,
  message_type text default 'text',
  created_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  path text not null,
  content text,
  language text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  plan text not null default 'free',
  tokens_used_this_month int not null default 0,
  tokens_limit int not null default 50000,
  projects_used int not null default 0,
  projects_limit int not null default 3,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  members jsonb not null default '[]'::jsonb,
  plan text not null default 'team',
  seats_used int not null default 1,
  seats_limit int not null default 10,
  created_at timestamptz not null default now()
);

-- Realtime for mother chat
alter publication supabase_realtime add table public.mother_chat_messages;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.forum_posts enable row level security;
alter table public.doctors enable row level security;
alter table public.appointments enable row level security;
alter table public.articles enable row level security;
alter table public.mother_chat_messages enable row level security;
alter table public.projects enable row level security;
alter table public.chat_messages enable row level security;
alter table public.project_files enable row level security;
alter table public.subscriptions enable row level security;
alter table public.teams enable row level security;
alter table public.ai_chat_messages enable row level security;

-- Profiles: users read/update own row
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Forum (read all; post when authenticated)
create policy "forum_select" on public.forum_posts for select using (true);
create policy "forum_insert_auth" on public.forum_posts for insert with check (auth.role() = 'authenticated');
create policy "forum_update" on public.forum_posts for update using (auth.role() = 'authenticated');

create policy "doctors_select_auth" on public.doctors for select using (auth.role() = 'authenticated');
create policy "doctors_all_authenticated" on public.doctors for all using (auth.role() = 'authenticated');

create policy "articles_select_auth" on public.articles for select using (auth.role() = 'authenticated');
create policy "articles_all_authenticated" on public.articles for all using (auth.role() = 'authenticated');

create policy "appointments_insert_auth" on public.appointments for insert with check (
  auth.role() = 'authenticated' and (user_id is null or auth.uid() = user_id)
);
create policy "appointments_select_own" on public.appointments for select using (
  auth.uid() = user_id or auth.role() = 'authenticated'
);
create policy "appointments_update" on public.appointments for update using (auth.role() = 'authenticated');

-- AI chat history (own messages only)
create policy "ai_chat_select_own" on public.ai_chat_messages for select using (auth.uid() = user_id);
create policy "ai_chat_insert_own" on public.ai_chat_messages for insert with check (auth.uid() = user_id);
create policy "ai_chat_delete_own" on public.ai_chat_messages for delete using (auth.uid() = user_id);

-- Mother chat: authenticated users
create policy "mother_chat_select" on public.mother_chat_messages for select using (auth.role() = 'authenticated');
create policy "mother_chat_insert" on public.mother_chat_messages for insert with check (auth.role() = 'authenticated');

-- User-owned workspace data
create policy "projects_owner" on public.projects for all using (auth.uid() = user_id);
create policy "chat_messages_owner" on public.chat_messages for all using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
);
create policy "project_files_owner" on public.project_files for all using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
);
create policy "subscriptions_owner" on public.subscriptions for all using (auth.uid() = user_id);
create policy "teams_owner" on public.teams for all using (auth.uid() = user_id);
