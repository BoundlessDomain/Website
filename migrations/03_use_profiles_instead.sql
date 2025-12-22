-- Clean up the redundant users table if it was created
drop table if exists public.users;

-- Ensure profiles has is_admin (idempotent check)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_admin') then
        alter table public.profiles add column is_admin boolean default false;
    end if;
end $$;

-- Update the owner to be admin
-- REPLACE 'Home.BobbyYu@gmail.com' with the actual email if different from verified owner email
update public.profiles
set is_admin = true
from auth.users
where profiles.id = auth.users.id
and auth.users.email = 'Home.BobbyYu@gmail.com';
