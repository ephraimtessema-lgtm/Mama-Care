-- Forum like/unlike, message delete, and admin bans
-- Safe to re-run. Adds missing columns if your project skipped earlier migrations.

-- ---------------------------------------------------------------------------
-- Prerequisites (fixes: column "user_id" does not exist)
-- ---------------------------------------------------------------------------
alter table public.forum_posts
  add column if not exists user_id uuid references auth.users (id) on delete set null;

alter table public.mother_chat_messages
  add column if not exists sender_id uuid references auth.users (id) on delete set null;

create index if not exists mother_chat_messages_sender_id_idx
  on public.mother_chat_messages (sender_id);

-- Private DMs table (from 007 — create if missing)
create table if not exists public.mother_private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  sender_flower_name text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint mother_private_no_self check (sender_id <> recipient_id)
);

create index if not exists mother_private_messages_thread_idx
  on public.mother_private_messages (sender_id, recipient_id, created_at desc);

alter table public.mother_private_messages enable row level security;

-- ---------------------------------------------------------------------------
-- Forum likes (one row per user per post)
-- ---------------------------------------------------------------------------

create table if not exists public.forum_post_likes (
  post_id uuid not null references public.forum_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists forum_post_likes_user_idx on public.forum_post_likes (user_id);

create or replace function public.sync_forum_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
begin
  v_post_id := coalesce(new.post_id, old.post_id);
  update public.forum_posts
  set likes = (
    select count(*)::int from public.forum_post_likes where post_id = v_post_id
  )
  where id = v_post_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists forum_post_likes_sync on public.forum_post_likes;
create trigger forum_post_likes_sync
after insert or delete on public.forum_post_likes
for each row execute function public.sync_forum_post_likes_count();

alter table public.forum_post_likes enable row level security;

drop policy if exists "forum_likes_select" on public.forum_post_likes;
create policy "forum_likes_select"
  on public.forum_post_likes for select
  using (auth.role() = 'authenticated');

drop policy if exists "forum_likes_insert" on public.forum_post_likes;
create policy "forum_likes_insert"
  on public.forum_post_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "forum_likes_delete" on public.forum_post_likes;
create policy "forum_likes_delete"
  on public.forum_post_likes for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Profile bans
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists banned_from_forum boolean not null default false;
alter table public.profiles add column if not exists banned_from_mother_chat boolean not null default false;

-- ---------------------------------------------------------------------------
-- Forum: delete own posts; insert blocked when banned
-- ---------------------------------------------------------------------------
drop policy if exists "forum_insert_auth" on public.forum_posts;
create policy "forum_insert_auth"
  on public.forum_posts for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = user_id
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.banned_from_forum
    )
  );

drop policy if exists "forum_delete_own" on public.forum_posts;
create policy "forum_delete_own"
  on public.forum_posts for delete
  using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- Mother chat: delete own messages; insert blocked when banned
-- ---------------------------------------------------------------------------
drop policy if exists "mother_chat_insert" on public.mother_chat_messages;
create policy "mother_chat_insert"
  on public.mother_chat_messages for insert
  with check (
    auth.role() = 'authenticated'
    and (sender_id is null or auth.uid() = sender_id)
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.banned_from_mother_chat
    )
  );

drop policy if exists "mother_chat_delete_own" on public.mother_chat_messages;
create policy "mother_chat_delete_own"
  on public.mother_chat_messages for delete
  using (auth.uid() = sender_id);

-- ---------------------------------------------------------------------------
-- Private mother chat: delete own; insert blocked when banned
-- ---------------------------------------------------------------------------
drop policy if exists "mother_private_insert_sender" on public.mother_private_messages;
create policy "mother_private_insert_sender"
  on public.mother_private_messages for insert
  with check (
    auth.uid() = sender_id
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.banned_from_mother_chat
    )
  );

drop policy if exists "mother_private_delete_own" on public.mother_private_messages;
create policy "mother_private_delete_own"
  on public.mother_private_messages for delete
  using (auth.uid() = sender_id);

-- ---------------------------------------------------------------------------
-- Admin ban RPC
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_user_bans(
  p_user_id uuid,
  p_banned_from_forum boolean,
  p_banned_from_mother_chat boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.profiles
  set
    banned_from_forum = coalesce(p_banned_from_forum, banned_from_forum),
    banned_from_mother_chat = coalesce(p_banned_from_mother_chat, banned_from_mother_chat)
  where id = p_user_id;

  if not found then
    raise exception 'User profile not found';
  end if;
end;
$$;

revoke all on function public.admin_set_user_bans(uuid, boolean, boolean) from public;
grant execute on function public.admin_set_user_bans(uuid, boolean, boolean) to authenticated;
