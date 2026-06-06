-- In-app notifications (appointments, private chat, forum replies)

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('appointment', 'private_chat', 'forum_reply', 'system')),
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Appointment status changes → notify patient
create or replace function public.notify_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      new.user_id,
      'appointment',
      'Appointment request sent',
      format(
        'Your request with %s on %s at %s is pending doctor approval.',
        coalesce(new.doctor_name, 'your doctor'),
        coalesce(new.date, 'TBD'),
        coalesce(new.time, 'TBD')
      ),
      '/book'
    );
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      new.user_id,
      'appointment',
      case new.status
        when 'confirmed' then 'Appointment confirmed ✓'
        when 'cancelled' then 'Appointment cancelled'
        when 'completed' then 'Appointment completed'
        else 'Appointment updated'
      end,
      format(
        'Your appointment with %s on %s at %s is now %s.',
        coalesce(new.doctor_name, 'your doctor'),
        coalesce(new.date, 'TBD'),
        coalesce(new.time, 'TBD'),
        new.status
      ),
      '/book'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_notify on public.appointments;
create trigger appointments_notify
after insert or update of status on public.appointments
for each row execute function public.notify_appointment_change();

-- Private DM → notify recipient
create or replace function public.notify_private_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender_id = new.recipient_id then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    new.recipient_id,
    'private_chat',
    'New private message',
    '🌸 ' || new.sender_flower_name || ': ' || left(new.content, 100),
    '/mother-chat/dm/' || new.sender_id::text
  );

  return new;
end;
$$;

drop trigger if exists mother_private_notify on public.mother_private_messages;
create trigger mother_private_notify
after insert on public.mother_private_messages
for each row execute function public.notify_private_message();

-- Forum reply → notify post author (called from app after reply)
create or replace function public.notify_forum_reply(p_post_id uuid, p_reply_preview text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post record;
  v_flower text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select user_id, title into v_post
  from public.forum_posts
  where id = p_post_id;

  if v_post.user_id is null or v_post.user_id = auth.uid() then
    return;
  end if;

  select flower_name into v_flower from public.profiles where id = auth.uid();

  insert into public.notifications (user_id, type, title, body, link)
  values (
    v_post.user_id,
    'forum_reply',
    'New reply on your post',
    coalesce('🌸 ' || v_flower || ': ', '') || left(coalesce(p_reply_preview, ''), 120),
    '/forum'
  );
end;
$$;

revoke all on function public.notify_forum_reply(uuid, text) from public;
grant execute on function public.notify_forum_reply(uuid, text) to authenticated;
