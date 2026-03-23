import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Listing, ListingCTA } from '@/lib/types'
import { LISTING_TYPE_LABELS } from '@/lib/types'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function ensureAbsoluteUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  // Handle protocol-relative URLs
  if (url.startsWith('//')) return `https:${url}`
  return `https://${url}`
}

async function sendToTelegram(chatId: string | number, listing: Listing, ctas: ListingCTA[], baseUrl: string): Promise<number | null> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('Telegram bot token not configured')
    return null
  }

  // Build message text
  const typeLabel = LISTING_TYPE_LABELS[listing.listing_type]
  let message = `<b>${escapeHTML(listing.title)}</b>\n\n`
  message += `📍 Type: ${typeLabel}\n\n`
  message += `${escapeHTML(listing.description)}\n\n`
  
  // Prepare inline buttons
  const buttons = []
  
  for (const cta of ctas) {
    if (cta.cta_type === 'whatsapp') {
      const phone = cta.value.replace(/\D/g, '')
      if (phone) {
        buttons.push([{ 
          text: '💬 WhatsApp', 
          url: `https://wa.me/${phone}` 
        }])
      }
    } else if (cta.cta_type === 'telegram') {
      const username = cta.value.replace('@', '').trim()
      if (username) {
        buttons.push([{ 
          text: '✈️ Telegram', 
          url: `https://t.me/${username}` 
        }])
      }
    } else if (cta.cta_type === 'url') {
      const absoluteUrl = ensureAbsoluteUrl(cta.value.trim())
      if (absoluteUrl) {
        buttons.push([{ 
          text: `🔗 ${escapeHTML(cta.label || 'Website')}`, 
          url: absoluteUrl 
        }])
      }
    }
  }

  // Add View Details button (ensure absolute URL)
  const absoluteBaseUrl = ensureAbsoluteUrl(baseUrl)
  buttons.push([{ 
    text: '👁️ View on Web', 
    url: `${absoluteBaseUrl.replace(/\/$/, '')}/listings/${listing.id}` 
  }])

  const reply_markup = { inline_keyboard: buttons }

  console.log('Sending to Telegram:', {
    chatId,
    hasPhoto: !!listing.image_url,
    buttonCount: buttons.length,
    messageLength: message.length
  })

  try {
    // If there's an image, send photo with caption
    if (listing.image_url) {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: listing.image_url,
          caption: message,
          parse_mode: 'HTML',
          reply_markup,
        }),
      })

      const data = await res.json()
      if (data.ok) {
        return data.result.message_id
      }
      console.error('Telegram sendPhoto error:', JSON.stringify(data, null, 2))
    }

    // Fallback to text message
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup,
        disable_web_page_preview: false,
      }),
    })

    const data = await res.json()
    if (data.ok) {
      return data.result.message_id
    }
    console.error('Telegram sendMessage error:', JSON.stringify(data, null, 2))
    return null
  } catch (error) {
    console.error('Telegram API error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { listingId, force = false } = await request.json()

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch listing with CTAs
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(`
        *,
        listing_cta (*)
      `)
      .eq('id', listingId)
      .single() as { data: Listing & { listing_cta: ListingCTA[] } | null; error: any }

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check if already published to Telegram (prevent duplicates) unless forced
    if (!force) {
      const { data: existingSchedule } = await supabase
        .from('listing_schedules')
        .select('telegram_message_id')
        .eq('listing_id', listingId)
        .not('telegram_message_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Only prevent duplicate if last schedule was completed
      if (existingSchedule?.telegram_message_id) {
        // Check if it was within the last hour to prevent rapid duplicates
        const { data: recentSchedule } = await supabase
          .from('listing_schedules')
          .select('created_at')
          .eq('listing_id', listingId)
          .not('telegram_message_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (recentSchedule) {
          const lastPublishTime = new Date(recentSchedule.created_at).getTime()
          const oneHourAgo = Date.now() - 60 * 60 * 1000
          if (lastPublishTime > oneHourAgo) {
            return NextResponse.json({ 
              error: 'Listing was already published recently', 
              lastMessageId: existingSchedule.telegram_message_id 
            }, { status: 429 })
          }
        }
      }
    }

    // Fetch all active channels
    const { data: channels } = await supabase
      .from('telegram_channels')
      .select('chat_id')
      .eq('is_active', true)

    // Fallback to environment variable channel if no channels in DB
    const activeChannelIds: (string | number)[] = channels?.map((c: { chat_id: string | number }) => c.chat_id) || []
    const envChannelId = process.env.TELEGRAM_CHANNEL_ID
    if (envChannelId && !activeChannelIds.includes(envChannelId)) {
      activeChannelIds.push(envChannelId)
    }

    if (activeChannelIds.length === 0) {
      return NextResponse.json({ error: 'No active Telegram channels configured' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('origin') || '')

    // Broadcast to all channels
    let successCount = 0
    let lastMessageId = null

    for (const chatId of activeChannelIds) {
      const messageId = await sendToTelegram(chatId, listing, listing.listing_cta || [], baseUrl)
      if (messageId) {
        successCount++
        lastMessageId = messageId
      }
    }

    if (successCount > 0) {
      // Record the schedule (at least one was successful)
      await supabase.from('listing_schedules').insert({
        listing_id: listingId,
        scheduled_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        telegram_message_id: lastMessageId, // Store the last one for reference
        is_completed: true,
      })

      // Update listing status to published
      await supabase
        .from('listings')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', listingId)

      // Update telegram views in stats
      const { data: stats } = await supabase
        .from('listing_stats')
        .select('id, telegram_views')
        .eq('listing_id', listingId)
        .single()

      if (stats) {
        await supabase
          .from('listing_stats')
          .update({ telegram_views: (stats.telegram_views || 0) + 1, updated_at: new Date().toISOString() })
          .eq('id', stats.id)
      }

      return NextResponse.json({ success: true, broadcastCount: successCount })
    }

    return NextResponse.json({ error: 'Failed to broadcast to any Telegram channel' }, { status: 500 })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
