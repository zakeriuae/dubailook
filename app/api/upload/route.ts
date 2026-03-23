import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const profile = await requireAuth()
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Dubilook')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('Dubilook')
      .getPublicUrl(uploadData.path)

    return NextResponse.json({ publicUrl })
  } catch (error) {
    console.error('Upload API error:', error)
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
