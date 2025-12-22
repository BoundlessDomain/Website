-- Create articles table
create table if not exists articles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  rating integer,
  date_display text, -- For manually formatted dates like "Dec 22, 2025"
  image_url text
);

-- Enable RLS
alter table articles enable row level security;

-- Policy: Everyone can read articles
create policy "Articles are public"
  on articles for select
  using ( true );

-- Policy: Only Owner can insert/update/delete
-- NOTE: Replace 'Home.BobbyYu@gmail.com' with your actual owner email if different, 
-- OR strictly ensure that only the owner can log in to the dashboard if you use a different method.
-- For a robust "Email Check":
create policy "Owner can insert articles"
  on articles for insert
  with check ( auth.jwt() ->> 'email' = 'Home.BobbyYu@gmail.com' );

create policy "Owner can update articles"
  on articles for update
  using ( auth.jwt() ->> 'email' = 'Home.BobbyYu@gmail.com' );

create policy "Owner can delete articles"
  on articles for delete
  using ( auth.jwt() ->> 'email' = 'Home.BobbyYu@gmail.com' );

-- STORAGE BUCKET SETUP
-- You need to create a bucket named 'article-images' in the dashboard first.
-- Then run these policies:

-- Policy: Public Read Access for Images
-- (Assuming you create a bucket named 'article-images')
-- storage.objects policies are needed if you want RLS on storage.
-- Often simpler to just set the bucket to "Public" in the dashboard.
