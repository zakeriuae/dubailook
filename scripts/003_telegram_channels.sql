-- Table to store discovered Telegram groups/channels
CREATE TABLE IF NOT EXISTS public.telegram_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT UNIQUE NOT NULL,
  title TEXT,
  username TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.telegram_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Full access for admins, read-only for system)
CREATE POLICY "telegram_channels_select_all" ON public.telegram_channels FOR SELECT USING (true);
CREATE POLICY "telegram_channels_admin_all" ON public.telegram_channels FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_telegram_channels_chat_id ON public.telegram_channels(chat_id);
