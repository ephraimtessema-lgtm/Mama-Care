-- Run this FIRST if you want to check columns before the main migration.
-- You should see user_id = YES for both tables.

select
  'doctors' as table_name,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'doctors' and column_name = 'user_id'
  ) as has_user_id;

select
  'appointments' as table_name,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'appointments' and column_name = 'user_id'
  ) as has_user_id;
