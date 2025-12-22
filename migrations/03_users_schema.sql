-- Create a public.users table that syncs with auth.users if it doesn't exist
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS (Safe to run multiple times)
alter table public.users enable row level security;

-- Policies (Drop first to avoid duplication error)
drop policy if exists "Public users are viewable by everyone." on public.users;
create policy "Public users are viewable by everyone." on public.users
  for select using (true);

drop policy if exists "Users can insert their own profile." on public.users;
create policy "Users can insert their own profile." on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.users;
create policy "Users can update own profile." on public.users
  for update using (auth.uid() = id);

-- Trigger Function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, is_admin)
  values (new.id, new.email, false)
  on conflict (id) do nothing; -- Handle potential duplicates
  return new;
end;
$$ language plpgsql security definer;

-- Trigger (Drop first ensuring cleanliness)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- INSTRUCTION FOR USER:
-- You must manually update your owner user to be admin in SQL Editor:
-- update public.users set is_admin = true where email = 'your_email@gmail.com';
