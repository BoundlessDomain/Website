-- Change rating columns to numeric to support decimals
-- Using numeric(4,1) allows up to 999.9, supporting our 0.0-10.0 scale easily.

alter table public.articles 
alter column rating type numeric(4,1);

alter table public.review_items 
alter column rating type numeric(4,1);
