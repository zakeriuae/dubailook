import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/session'
import type { CTAType } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const profile = await requireAuth()
    const formData = await request.formData()
    
    const dataStr = formData.get('data') as string
    
    if (!dataStr) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const data = JSON.parse(dataStr)
    const { title, description, listing_type, publishing_mode, ctas } = data

    if (!title || !description || !listing_type || !publishing_mode || !ctas || ctas.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Prevent links in title
    const urlRegex = /(https?:\/\/|www\.)[^\s]+|(\b[a-z0-9]+\.[a-z]{2,})/gi
    if (urlRegex.test(title)) {
      return NextResponse.json({ error: 'Links and URLs are not allowed in the title' }, { status: 400 })
    }

    // Enforce 500 char limit for description
    if (description.length > 500) {
      return NextResponse.json({ error: 'Description cannot exceed 500 characters' }, { status: 400 })
    }

    // Prevent links in description
    if (urlRegex.test(description)) {
      return NextResponse.json({ error: 'Links and URLs are not allowed in the description' }, { status: 400 })
    }

    // Require at least some English text
    if (!/[a-zA-Z]{2,}/.test(description)) {
      return NextResponse.json({ error: 'Posts can be in any language, but an English translation is required in the description.' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const imageUrls: string[] = data.image_urls || []
    
    // Optionally still handle direct uploads if provided (fallback)
    const imageFiles = formData.getAll('images') as File[]
    if (imageFiles.length > 0) {
      for (const imageFile of imageFiles) {
        if (!imageFile || imageFile.size === 0) continue
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('Dubilook')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('Dubilook')
            .getPublicUrl(uploadData.path)
          imageUrls.push(urlData.publicUrl)
        }
      }
    }

    // Create listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        user_id: profile.id,
        title,
        description,
        listing_type,
        publishing_mode,
        image_url: imageUrls[0] ?? null,
        status: 'pending',
      })
      .select()
      .single()

    if (listingError) {
      console.error('Listing creation error:', listingError)
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
    }

    // Create CTA entries
    const ctaEntries = ctas.map((cta: { type: CTAType; value: string; label?: string }) => ({
      listing_id: listing.id,
      cta_type: cta.type,
      value: cta.value,
      label: cta.label || null,
    }))

    const { error: ctaError } = await supabase
      .from('listing_cta')
      .insert(ctaEntries)

    if (ctaError) {
      console.error('CTA creation error:', ctaError)
      // Don't fail the whole operation, listing is created
    }

    // Update user profile with latest contact info for future pre-filling
    const whatsappCTA = ctas.find((c: any) => c.type === 'whatsapp')
    const telegramCTA = ctas.find((c: any) => c.type === 'telegram')
    
    if (whatsappCTA || telegramCTA) {
      const profileUpdates: any = {}
      if (whatsappCTA) profileUpdates.whatsapp = whatsappCTA.value
      if (telegramCTA) profileUpdates.telegram_username = telegramCTA.value.replace('@', '')
      
      await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', profile.id)
    }

    // Create stats entry
    await supabase
      .from('listing_stats')
      .insert({ listing_id: listing.id })

    return NextResponse.json({ success: true, listing })
  } catch (error) {
    console.error('Create listing error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
