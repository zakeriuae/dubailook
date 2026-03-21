# RealEstate Hub - Setup Instructions

## Environment Variables

Add these environment variables to your Vercel project:

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL (auto-added by integration)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key (auto-added by integration)

### Telegram Configuration
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from @BotFather
- `TELEGRAM_CHANNEL_ID` - Your Telegram channel ID (e.g., @yourchannel or -100xxxxx)
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` - Your bot username (without @)
- `NEXT_PUBLIC_APP_URL` - Your app URL (e.g., https://your-app.vercel.app)
- `CRON_SECRET` - A random secret for cron job authentication

## Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather):
   - Send `/newbot` and follow instructions
   - Save the bot token

2. Set up the bot for login:
   - Send `/setdomain` to BotFather
   - Select your bot and enter your domain

3. Create a Telegram channel and add your bot as admin

4. Set up webhook (optional, for bot commands):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram/webhook
   ```

## Database

The database schema is automatically applied via Supabase migrations. Tables created:
- `profiles` - User profiles linked to Telegram
- `listings` - Property listings
- `listing_cta` - Call-to-action buttons
- `listing_schedules` - Publishing schedule tracking
- `listing_stats` - View and impression statistics
- `admin_actions` - Admin action logs

## Storage

A storage bucket `listing-images` is created for listing images.

## Making a User Admin

Run this SQL in your Supabase SQL Editor:
```sql
UPDATE profiles SET is_admin = true WHERE telegram_id = YOUR_TELEGRAM_ID;
```

## Cron Job

The app includes a cron job that runs hourly to publish scheduled listings.
This is configured in `vercel.json` and runs automatically on Vercel.

## Features

### Public
- Browse published listings
- Filter by listing type
- View listing details

### User Dashboard
- View Telegram profile info
- Create listings (5 types)
- Track listing status and stats
- Configure contact methods (WhatsApp, Telegram, URL)

### Admin Dashboard
- Review pending listings
- Approve/reject with reasons
- Manually publish listings
- View all listings by status

### Publishing Modes
- One time
- 10 times daily
- 10 times every other day
- 5 times weekly

### Telegram Integration
- Login with Telegram
- Bot commands (/mylistings, /stats, /help)
- Automatic publishing to channel
- Duplicate prevention
