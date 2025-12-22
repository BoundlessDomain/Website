-- Add 'type' to articles table
alter table articles add column if not exists type text default 'standard'; -- 'standard' or 'review_collection' 

-- Create Review Items Table
create table if not exists review_items (
  id uuid default gen_random_uuid() primary key,
  article_id uuid references articles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null, -- e.g. "Fiji Water"
  rating integer,
  content text,
  date_display text,
  image_url text
);

-- Enable RLS
alter table review_items enable row level security;

-- Policies for Review Items
create policy "Reviews are public"
  on review_items for select
  using ( true );

create policy "Owner can insert reviews"
  on review_items for insert
  with check ( auth.jwt() ->> 'email' = 'Home.BobbyYu@gmail.com' );

create policy "Owner can update reviews"
  on review_items for update
  using ( auth.jwt() ->> 'email' = 'Home.BobbyYu@gmail.com' );

create policy "Owner can delete reviews"
  on review_items for delete
  using ( auth.jwt() ->> 'email' = 'Home.BobbyYu@gmail.com' );
