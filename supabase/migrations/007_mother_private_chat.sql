-- Private mom-to-mom messages + sender_id on public room chat

alter table public.mother_chat_messages
  add column if not exists sender_id uuid references auth.users (id) on delete set null;

create index if not exists mother_chat_messages_room_created
  on public.mother_chat_messages (room, created_at desc);

create table if not exists public.mother_private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  sender_flower_name text not null,
  content text not null,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists mother_private_messages_pair_created
  on public.mother_private_messages (sender_id, recipient_id, created_at);

create index if not exists mother_private_messages_recipient_created
  on public.mother_private_messages (recipient_id, created_at desc);

alter table public.mother_private_messages enable row level security;

drop policy if exists "mother_private_select_participant" on public.mother_private_messages;
drop policy if exists "mother_private_insert_sender" on public.mother_private_messages;

create policy "mother_private_select_participant"
  on public.mother_private_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "mother_private_insert_sender"
  on public.mother_private_messages for insert
  with check (auth.uid() = sender_id);

-- Enable Realtime: Dashboard → Database → Replication → mother_private_messages
