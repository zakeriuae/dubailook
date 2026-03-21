import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/session'
import type { CTAType } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const profile = await requireAuth()
    const formData = await request.formData()
    
    const dataStr = formData.get('data') as string
    const imageFile = formData.get('image') as File | null
    
    if (!dataStr) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const data = JSON.parse(dataStr)
    const { title, description, listing_type, publishing_mode, ctas } = data

    if (!title || !description || !listing_type || !publishing_mode || !ctas || ctas.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    let imageUrl: string | null = null

    // Upload image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Image upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
      }

      const { data: urlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(uploadData.path)
      
      imageUrl = urlData.publicUrl
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
        image_url: imageUrl,
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
