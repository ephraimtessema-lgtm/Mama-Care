-- AI chat sessions + messages (self-contained — run in Supabase SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS

-- ---------------------------------------------------------------------------
-- 1. Messages table (from 002 — create if you never ran 002_user_history.sql)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  is_emergency boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_user_id_created
  on public.ai_chat_messages (user_id, created_at);

-- ---------------------------------------------------------------------------
-- 2. Sessions (multiple chats per user)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_chat_sessions_user_updated
  on public.ai_chat_sessions (user_id, updated_at desc);

alter table public.ai_chat_messages
  add column if not exists session_id uuid references public.ai_chat_sessions (id) on delete cascade;

create index if not exists ai_chat_messages_session_created
  on public.ai_chat_messages (session_id, created_at);

-- ---------------------------------------------------------------------------
-- 3. Backfill old messages (only if any rows lack session_id)
-- ---------------------------------------------------------------------------
insert into public.ai_chat_sessions (user_id, title, updated_at)
select m.user_id, 'Previous chats', max(m.created_at)
from public.ai_chat_messages m
where m.session_id is null
group by m.user_id
having count(*) > 0;

update public.ai_chat_messages m
set session_id = s.id
from public.ai_chat_sessions s
where m.user_id = s.user_id
  and m.session_id is null
  and s.title = 'Previous chats';

-- ---------------------------------------------------------------------------
-- 4. Row level security
-- ---------------------------------------------------------------------------
alter table public.ai_chat_messages enable row level security;
alter table public.ai_chat_sessions enable row level security;

drop policy if exists "ai_chat_owner" on public.ai_chat_messages;
drop policy if exists "ai_chat_select_own" on public.ai_chat_messages;
drop policy if exists "ai_chat_insert_own" on public.ai_chat_messages;
drop policy if exists "ai_chat_delete_own" on public.ai_chat_messages;

create policy "ai_chat_select_own"
  on public.ai_chat_messages for select using (auth.uid() = user_id);

create policy "ai_chat_insert_own"
  on public.ai_chat_messages for insert with check (auth.uid() = user_id);

create policy "ai_chat_delete_own"
  on public.ai_chat_messages for delete using (auth.uid() = user_id);

drop policy if exists "ai_chat_sessions_select_own" on public.ai_chat_sessions;
drop policy if exists "ai_chat_sessions_insert_own" on public.ai_chat_sessions;
drop policy if exists "ai_chat_sessions_update_own" on public.ai_chat_sessions;
drop policy if exists "ai_chat_sessions_delete_own" on public.ai_chat_sessions;

create policy "ai_chat_sessions_select_own"
  on public.ai_chat_sessions for select using (auth.uid() = user_id);

create policy "ai_chat_sessions_insert_own"
  on public.ai_chat_sessions for insert with check (auth.uid() = user_id);

create policy "ai_chat_sessions_update_own"
  on public.ai_chat_sessions for update using (auth.uid() = user_id);

create policy "ai_chat_sessions_delete_own"
  on public.ai_chat_sessions for delete using (auth.uid() = user_id);
