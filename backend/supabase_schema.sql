-- profiles table
-- Linked to auth.users via specific ID reference not possible directly in create table usually for auth.users, 
-- but we can reference it. Supabase handles auth.users.
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  is_admin boolean default false,

  constraint username_length check (char_length(full_name) >= 3)
);

-- contacts table (CRM)
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  location text,
  linkedin_id text,
  whatsapp_id text,
  notes text
);

-- content_items table (Articles, Recipes, Poems)
create table public.content_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null check (type in ('article', 'recipe', 'poem')),
  title text not null,
  slug text not null unique,
  content jsonb default '{}'::jsonb not null,
  published boolean default false,
  image_url text
);

-- Row Level Security (RLS)

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.content_items enable row level security;

-- Policies for profiles
-- Public read access to profiles (optional, maybe restrict later)
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Users can insert their own profile.
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

-- Users can update own profile.
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );


-- Policies for contacts
-- Only Admins can view/edit contacts
-- Function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and is_admin = true
  );
end;
$$ language plpgsql security definer;

create policy "Admins can view all contacts."
  on contacts for select
  using ( is_admin() );

create policy "Admins can insert contacts."
  on contacts for insert
  with check ( is_admin() );

create policy "Admins can update contacts."
  on contacts for update
  using ( is_admin() );

create policy "Admins can delete contacts."
  on contacts for delete
  using ( is_admin() );


-- Policies for content_items
-- Public read access for published items
create policy "Public can view published content."
  on content_items for select
  using ( published = true );

-- Admins can view ALL content (published or not)
create policy "Admins can view all content."
  on content_items for select
  using ( is_admin() );

-- Admins can insert/update/delete content
create policy "Admins can insert content."
  on content_items for insert
  with check ( is_admin() );

create policy "Admins can update content."
  on content_items for update
  using ( is_admin() );

create policy "Admins can delete content."
  on content_items for delete
  using ( is_admin() );

-- Trigger to handle new user signup -> create profile entry automatically?
-- Or we handle it via frontend. For now, let's keep it simple and expect frontend to create profile or a trigger.
-- Adding a trigger for auto-profile creation is a nice to have.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- NEW: Navigation & Gallery Tables (Migration)
-- ==========================================

-- Navigation Items
create table public.navigation (
  id uuid default gen_random_uuid() primary key,
  side text not null check (side in ('left', 'right')),
  sort_order int not null,
  label text not null,
  icon_name text not null,
  href text not null
);

-- Global Settings (Debug mode, etc)
create table public.site_settings (
  key text primary key,
  value jsonb not null
);

-- Albums
create table public.albums (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  cover_url text, -- optimized/highlight url
  date_label text -- e.g. "December 2023"
);

-- Photos
create table public.photos (
  id uuid default gen_random_uuid() primary key,
  album_id uuid references public.albums(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  url text not null,
  type text default 'image',
  width int,
  height int
);

-- RLS for New Tables
alter table public.navigation enable row level security;
alter table public.site_settings enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;

-- Policies (Public Read, Admin Write)
create policy "Public read navigation" on navigation for select using (true);
create policy "Public read settings" on site_settings for select using (true);
create policy "Public read albums" on albums for select using (true);
create policy "Public read photos" on photos for select using (true);

-- Admin Write Policies (using is_admin() function from above)
create policy "Admins write navigation" on navigation for all using (is_admin());
create policy "Admins write settings" on site_settings for all using (is_admin());
create policy "Admins write albums" on albums for all using (is_admin());
create policy "Admins write photos" on photos for all using (is_admin());

