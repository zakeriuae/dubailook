-- Migration 004: Create listing_reposts table
-- Tracks manual reposts by users to enforce daily limits

CREATE TABLE IF NOT EXISTS public.listing_reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster daily limit checks
CREATE INDEX IF NOT EXISTS idx_listing_reposts_listing_at
ON public.listing_reposts (listing_id, created_at);

-- Enable RLS
ALTER TABLE public.listing_reposts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own repost history" 
ON public.listing_reposts FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
));

CREATE POLICY "Users can insert their own reposts" 
ON public.listing_reposts FOR INSERT 
WITH CHECK (user_id = auth.uid());
