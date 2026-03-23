import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log for debugging
    console.log('Telegram Webhook received:', JSON.stringify(body, null, 2))

    const supabase = await createClient()

    // 1. Handle being added to a group (my_chat_member)
    if (body.my_chat_member) {
      const { chat, new_chat_member } = body.my_chat_member
      
      if (new_chat_member.status === 'member' || new_chat_member.status === 'administrator') {
        // Added to group
        await supabase.from('telegram_channels').upsert({
          chat_id: chat.id,
          title: chat.title || chat.first_name || 'Unknown',
          username: chat.username || null,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'chat_id' })
      } else if (new_chat_member.status === 'left' || new_chat_member.status === 'kicked') {
        // Removed from group
        await supabase.from('telegram_channels')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('chat_id', chat.id)
      }
    }

    // 2. Handle commands (/register)
    if (body.message && body.message.text) {
      const { text, chat, from } = body.message
      
      if (text.startsWith('/register')) {
        // Check if sender is an admin in our system
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('telegram_id', from.id)
          .single()

        if (profile?.is_admin) {
          await supabase.from('telegram_channels').upsert({
            chat_id: chat.id,
            title: chat.title || chat.first_name || 'Unknown',
            username: chat.username || null,
            is_active: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'chat_id' })

          // Send confirmation back to group
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chat.id,
              text: `✅ Group "${chat.title}" registered successfully for Dubilook listings!`,
            })
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true }) // Always return OK to Telegram
  }
}
