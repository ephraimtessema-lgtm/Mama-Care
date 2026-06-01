-- Profile fields & user preferences (run in Supabase SQL Editor)

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists due_date date;
alter table public.profiles add column if not exists baby_birth_date date;
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
