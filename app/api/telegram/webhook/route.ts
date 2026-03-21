import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
  }
}

async function sendMessage(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  })
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()

    if (!update.message?.text) {
      return NextResponse.json({ ok: true })
    }

    const { message } = update
    const chatId = message.chat.id
    const text = message.text
    const userId = message.from.id

    // Handle /start command
    if (text === '/start') {
      await sendMessage(chatId, 
        `👋 Welcome to RealEstate Hub Bot!\n\n` +
        `This bot helps you manage your property listings.\n\n` +
        `*Commands:*\n` +
        `/mylistings - View your listings\n` +
        `/stats - View your stats\n` +
        `/help - Get help\n\n` +
        `Visit our website to create and manage listings!`
      )
      return NextResponse.json({ ok: true })
    }

    // Handle /mylistings command
    if (text === '/mylistings') {
      const supabase = await createClient()
      
      // Find user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', userId)
        .single()

      if (!profile) {
        await sendMessage(chatId, 
          '❌ You haven\'t registered yet.\n\n' +
          'Please visit our website and log in with Telegram first.'
        )
        return NextResponse.json({ ok: true })
      }

      // Get user's listings
      const { data: listings } = await supabase
        .from('listings')
        .select('title, status')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!listings || listings.length === 0) {
        await sendMessage(chatId, 
          '📋 You don\'t have any listings yet.\n\n' +
          'Visit our website to create your first listing!'
        )
        return NextResponse.json({ ok: true })
      }

      let response = '📋 *Your Listings:*\n\n'
      listings.forEach((listing, index) => {
        const statusEmoji = {
          pending: '⏳',
          approved: '✅',
          rejected: '❌',
          published: '📢',
        }[listing.status] || '❓'
        response += `${index + 1}. ${statusEmoji} ${listing.title}\n`
      })

      await sendMessage(chatId, response)
      return NextResponse.json({ ok: true })
    }

    // Handle /stats command
    if (text === '/stats') {
      const supabase = await createClient()
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', userId)
        .single()

      if (!profile) {
        await sendMessage(chatId, 
          '❌ You haven\'t registered yet.\n\n' +
          'Please visit our website and log in with Telegram first.'
        )
        return NextResponse.json({ ok: true })
      }

      // Get aggregated stats
      const { data: listings } = await supabase
        .from('listings')
        .select(`
          status,
          listing_stats (page_views, list_impressions)
        `)
        .eq('user_id', profile.id)

      if (!listings || listings.length === 0) {
        await sendMessage(chatId, '📊 No stats available yet.')
        return NextResponse.json({ ok: true })
      }

      const totalListings = listings.length
      const publishedCount = listings.filter(l => l.status === 'published').length
      const pendingCount = listings.filter(l => l.status === 'pending').length
      const totalViews = listings.reduce((acc, l) => acc + ((l.listing_stats as any)?.page_views || 0), 0)
      const totalImpressions = listings.reduce((acc, l) => acc + ((l.listing_stats as any)?.list_impressions || 0), 0)

      const response = 
        `📊 *Your Statistics:*\n\n` +
        `📋 Total Listings: ${totalListings}\n` +
        `📢 Published: ${publishedCount}\n` +
        `⏳ Pending: ${pendingCount}\n` +
        `👁 Total Views: ${totalViews}\n` +
        `📈 Impressions: ${totalImpressions}`

      await sendMessage(chatId, response)
      return NextResponse.json({ ok: true })
    }

    // Handle /help command
    if (text === '/help') {
      await sendMessage(chatId, 
        `ℹ️ *Help*\n\n` +
        `*Available Commands:*\n` +
        `/start - Welcome message\n` +
        `/mylistings - View your listings\n` +
        `/stats - View your stats\n` +
        `/help - This help message\n\n` +
        `*How to use:*\n` +
        `1. Visit our website\n` +
        `2. Log in with Telegram\n` +
        `3. Create your listings\n` +
        `4. Wait for admin approval\n` +
        `5. Your listings will be published!\n\n` +
        `For support, contact the admin.`
      )
      return NextResponse.json({ ok: true })
    }

    // Unknown command
    await sendMessage(chatId, 
      'I don\'t understand that command.\n\nType /help to see available commands.'
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}
