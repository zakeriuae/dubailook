-- Real Estate Listing App Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to Telegram auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing types enum
CREATE TYPE listing_type AS ENUM (
  'custom_offer',
  'buyer_request', 
  'property',
  'land',
  'project'
);

-- Publishing mode enum
CREATE TYPE publishing_mode AS ENUM (
  'one_time',
  'ten_times_daily',
  'ten_times_every_other_day',
  'five_times_weekly'
);

-- Listing status enum
CREATE TYPE listing_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'published'
);

-- CTA type enum
CREATE TYPE cta_type AS ENUM (
  'whatsapp',
  'url',
  'telegram'
);

-- Listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  listing_type listing_type NOT NULL,
  image_url TEXT,
  status listing_status DEFAULT 'pending',
  publishing_mode publishing_mode NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing CTA buttons
CREATE TABLE IF NOT EXISTS public.listing_cta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  cta_type cta_type NOT NULL,
  value TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing schedules (for tracking publish times)
CREATE TABLE IF NOT EXISTS public.listing_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  telegram_message_id BIGINT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing stats (page views, impressions)
CREATE TABLE IF NOT EXISTS public.listing_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  page_views INTEGER DEFAULT 0,
  list_impressions INTEGER DEFAULT 0,
  telegram_views INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin actions log
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'approve', 'reject', 'publish'
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

-- RLS Policies for profiles
CREATE POLICY "profiles_select_public" ON public.profiles 
  FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id');

-- RLS Policies for listings
CREATE POLICY "listings_select_public" ON public.listings 
  FOR SELECT USING (true);
CREATE POLICY "listings_insert_authenticated" ON public.listings 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "listings_update_own" ON public.listings 
  FOR UPDATE USING (
    user_id IN (SELECT id FROM public.profiles WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND is_admin = true)
  );
CREATE POLICY "listings_delete_own" ON public.listings 
  FOR DELETE USING (
    user_id IN (SELECT id FROM public.profiles WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id')
  );

-- RLS Policies for listing_cta
CREATE POLICY "listing_cta_select_public" ON public.listing_cta 
  FOR SELECT USING (true);
CREATE POLICY "listing_cta_insert_authenticated" ON public.listing_cta 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "listing_cta_update_own" ON public.listing_cta 
  FOR UPDATE USING (
    listing_id IN (SELECT id FROM public.listings WHERE user_id IN (SELECT id FROM public.profiles WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'))
  );
CREATE POLICY "listing_cta_delete_own" ON public.listing_cta 
  FOR DELETE USING (
    listing_id IN (SELECT id FROM public.listings WHERE user_id IN (SELECT id FROM public.profiles WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'))
  );

-- RLS Policies for listing_schedules
CREATE POLICY "listing_schedules_select_public" ON public.listing_schedules 
  FOR SELECT USING (true);
CREATE POLICY "listing_schedules_insert_authenticated" ON public.listing_schedules 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "listing_schedules_update" ON public.listing_schedules 
  FOR UPDATE USING (true);

-- RLS Policies for listing_stats
CREATE POLICY "listing_stats_select_public" ON public.listing_stats 
  FOR SELECT USING (true);
CREATE POLICY "listing_stats_insert" ON public.listing_stats 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "listing_stats_update" ON public.listing_stats 
  FOR UPDATE USING (true);

-- RLS Policies for admin_actions (admin only)
CREATE POLICY "admin_actions_select_admin" ON public.admin_actions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND is_admin = true)
  );
CREATE POLICY "admin_actions_insert_admin" ON public.admin_actions 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id' AND is_admin = true)
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listing_stats_updated_at
  BEFORE UPDATE ON public.listing_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create listing stats when listing is created
CREATE OR REPLACE FUNCTION create_listing_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.listing_stats (listing_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_listing_stats_trigger
  AFTER INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION create_listing_stats();
