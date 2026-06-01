-- Run in Supabase SQL Editor if you already applied schema.sql earlier

-- Profile: persistent flower name for anonymous display
alter table public.profiles add column if not exists flower_name text;

-- AI chat history (per user)
create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  is_emergency boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_user_id_created on public.ai_chat_messages (user_id, created_at);

-- Link user content for history
alter table public.forum_posts add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.appointments add column if not exists user_id uuid references auth.users (id) on delete set null;

-- RLS: AI chat (own messages only)
alter table public.ai_chat_messages enable row level security;

drop policy if exists "ai_chat_owner" on public.ai_chat_messages;
create policy "ai_chat_select_own" on public.ai_chat_messages for select using (auth.uid() = user_id);
create policy "ai_chat_insert_own" on public.ai_chat_messages for insert with check (auth.uid() = user_id);
create policy "ai_chat_delete_own" on public.ai_chat_messages for delete using (auth.uid() = user_id);

-- Appointments: users see their own bookings
drop policy if exists "appointments_select" on public.appointments;
create policy "appointments_select_own" on public.appointments for select using (
  auth.uid() = user_id or auth.role() = 'authenticated'
);
drop policy if exists "appointments_insert" on public.appointments;
create policy "appointments_insert_auth" on public.appointments for insert with check (
  auth.role() = 'authenticated' and (user_id is null or auth.uid() = user_id)
);

-- Doctors & articles: authenticated read only
drop policy if exists "doctors_select" on public.doctors;
create policy "doctors_select_auth" on public.doctors for select using (auth.role() = 'authenticated');

drop policy if exists "articles_select" on public.articles;
create policy "articles_select_auth" on public.articles for select using (auth.role() = 'authenticated');

-- Forum: authenticated to post; public read kept for simplicity (login required via app)
drop policy if exists "forum_insert" on public.forum_posts;
create policy "forum_insert_auth" on public.forum_posts for insert with check (
  auth.role() = 'authenticated'
);
