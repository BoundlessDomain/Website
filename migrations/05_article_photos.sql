-- Create article_photos table
CREATE TABLE IF NOT EXISTS public.article_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.article_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public photos are viewable by everyone" ON public.article_photos
    FOR SELECT USING (true);

CREATE POLICY "Owners can insert photos" ON public.article_photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Owners can delete photos" ON public.article_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Create Storage Bucket for Article Photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-photos', 'article-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING ( bucket_id = 'article-photos' );

CREATE POLICY "Owner Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'article-photos' 
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Owner Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'article-photos'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
