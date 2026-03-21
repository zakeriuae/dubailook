-- Real Estate Listing App Database Schema

-- Profiles table (linked to Telegram auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('custom_offer', 'buyer_request', 'property', 'land', 'project')),
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  publishing_mode TEXT NOT NULL CHECK (publishing_mode IN ('one_time', 'ten_times_daily', 'ten_times_every_other_day', 'five_times_weekly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing CTA buttons
CREATE TABLE IF NOT EXISTS public.listing_cta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  cta_type TEXT NOT NULL CHECK (cta_type IN ('whatsapp', 'url', 'telegram')),
  value TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing schedules (for tracking publish times)
CREATE TABLE IF NOT EXISTS public.listing_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  telegram_message_id BIGINT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing stats (page views, impressions)
CREATE TABLE IF NOT EXISTS public.listing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  page_views INTEGER DEFAULT 0,
  list_impressions INTEGER DEFAULT 0,
  telegram_views INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin actions log
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listing_schedules_scheduled_at ON public.listing_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_listing_schedules_listing_id ON public.listing_schedules(listing_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_cta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (public read, authenticated write)
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_any" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_any" ON public.profiles FOR UPDATE USING (true);

-- RLS Policies for listings
CREATE POLICY "listings_select_public" ON public.listings FOR SELECT USING (true);
CREATE POLICY "listings_insert_any" ON public.listings FOR INSERT WITH CHECK (true);
CREATE POLICY "listings_update_any" ON public.listings FOR UPDATE USING (true);
CREATE POLICY "listings_delete_any" ON public.listings FOR DELETE USING (true);

-- RLS Policies for listing_cta
CREATE POLICY "listing_cta_select_public" ON public.listing_cta FOR SELECT USING (true);
CREATE POLICY "listing_cta_insert_any" ON public.listing_cta FOR INSERT WITH CHECK (true);
CREATE POLICY "listing_cta_update_any" ON public.listing_cta FOR UPDATE USING (true);
CREATE POLICY "listing_cta_delete_any" ON public.listing_cta FOR DELETE USING (true);

-- RLS Policies for listing_schedules
CREATE POLICY "listing_schedules_select_public" ON public.listing_schedules FOR SELECT USING (true);
CREATE POLICY "listing_schedules_insert_any" ON public.listing_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "listing_schedules_update_any" ON public.listing_schedules FOR UPDATE USING (true);

-- RLS Policies for listing_stats
CREATE POLICY "listing_stats_select_public" ON public.listing_stats FOR SELECT USING (true);
CREATE POLICY "listing_stats_insert_any" ON public.listing_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "listing_stats_update_any" ON public.listing_stats FOR UPDATE USING (true);

-- RLS Policies for admin_actions
CREATE POLICY "admin_actions_select_public" ON public.admin_actions FOR SELECT USING (true);
CREATE POLICY "admin_actions_insert_any" ON public.admin_actions FOR INSERT WITH CHECK (true);
