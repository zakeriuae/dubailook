'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { 
  Building2, LandPlot, Briefcase, Package, Users,
  Upload, Phone, MessageCircle, Link as LinkIcon, ArrowLeft, ArrowRight, Check, X
} from 'lucide-react'
import { LISTING_TYPE_LABELS, PUBLISHING_MODE_LABELS } from '@/lib/types'
import type { ListingType, PublishingMode, CTAType, Profile } from '@/lib/types'

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  listing_type: z.enum(['custom_offer', 'buyer_request', 'property', 'land', 'project']),
  publishing_mode: z.enum(['one_time', 'ten_times_daily', 'ten_times_every_other_day', 'five_times_weekly']),
})

type ListingFormData = z.infer<typeof listingSchema>

interface ContactMethod {
  enabled: boolean
  value: string
  label?: string
}

const listingTypes: { value: ListingType; icon: React.ReactNode }[] = [
  { value: 'custom_offer', icon: <Package className="h-6 w-6" /> },
  { value: 'property', icon: <Building2 className="h-6 w-6" /> },
  { value: 'land', icon: <LandPlot className="h-6 w-6" /> },
  { value: 'project', icon: <Briefcase className="h-6 w-6" /> },
  { value: 'buyer_request', icon: <Users className="h-6 w-6" /> },
]

const publishingModes: PublishingMode[] = ['one_time', 'ten_times_daily', 'ten_times_every_other_day', 'five_times_weekly']

import { createClient } from '@/lib/supabase/client'

export function ListingForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // For global upload state
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({}) // Track per-image upload state
  
  const [whatsapp, setWhatsapp] = useState<ContactMethod>({ enabled: false, value: '' })
  const [telegram, setTelegram] = useState<ContactMethod>({ enabled: false, value: '' })
  const [url, setUrl] = useState<ContactMethod>({ enabled: false, value: '', label: '' })
  
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/me')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return
        if (data.profile) {
          setProfile(data.profile)
          // Pre-fill Telegram
          if (data.profile.telegram_username) {
            setTelegram(prev => ({ ...prev, value: `@${data.profile.telegram_username}`, enabled: true }))
          }
          // Pre-fill WhatsApp
          if (data.profile.whatsapp) {
            setWhatsapp(prev => ({ ...prev, value: data.profile.whatsapp, enabled: true }))
          }
        }
      })
      .catch(() => {})
    
    return () => { mounted = false }
  }, [])

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      listing_type: 'custom_offer',
      publishing_mode: 'one_time',
    },
  })

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (!profile) {
      toast.error('You must be logged in to upload images')
      return
    }

    const supabase = createClient()
    const startIndex = imageUrls.length
    
    // Add placeholders to show previews immediately (mock)
    const newUrls = [...imageUrls]
    const newUploadingMap = { ...uploadingMap }
    
    for (let i = 0; i < files.length && (startIndex + i) < 5; i++) {
        const file = files[i]
        const currentIndex = startIndex + i
        
        // Show local preview immediately
        const reader = new FileReader()
        reader.onloadend = () => {
            // We use the same array to manage order
        }
        reader.readAsDataURL(file)

        // Start upload
        newUploadingMap[currentIndex] = true
        setUploadingMap({ ...newUploadingMap })
        
        const fileExt = file.name.split('.').pop()
        const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        
        try {
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('Dubilook')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('Dubilook')
                .getPublicUrl(uploadData.path)

            setImageUrls(prev => {
                const updated = [...prev]
                updated[currentIndex] = publicUrl
                return updated
            })
        } catch (err) {
            console.error('Upload failed:', err)
            toast.error(`Failed to upload ${file.name}`)
        } finally {
            setUploadingMap(prev => {
                const updated = { ...prev }
                delete updated[currentIndex]
                return updated
            })
        }
    }
  }

  const removeImage = (index: number) => {
    setImageUrls(prev => {
        const updated = [...prev]
        updated.splice(index, 1)
        return updated
    })
    
    // Also clean up uploading map if needed
    setUploadingMap(prev => {
        const updated = { ...prev }
        delete updated[index]
        return updated
    })
  }

  const onSubmit = async (data: ListingFormData) => {
    const activeCtas = []
    if (whatsapp.enabled && whatsapp.value.trim()) activeCtas.push({ type: 'whatsapp' as const, value: whatsapp.value.trim() })
    if (telegram.enabled && telegram.value.trim()) activeCtas.push({ type: 'telegram' as const, value: telegram.value.trim() })
    if (url.enabled && url.value.trim()) activeCtas.push({ type: 'url' as const, value: url.value.trim(), label: url.label?.trim() })

    if (activeCtas.length === 0) {
      toast.error('Please select at least one contact method')
      return
    }

    if (Object.keys(uploadingMap).length > 0) {
        toast.error('Please wait for images to finish uploading')
        return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('data', JSON.stringify({ 
        ...data, 
        ctas: activeCtas,
        image_urls: imageUrls.filter(Boolean) // Send the uploaded URLs
      }))
      
      const res = await fetch('/api/listings', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {
        toast.success('Listing created successfully! Admin will review it.')
        router.push('/dashboard')
      } else {
        toast.error(result.error || 'Failed to create listing')
      }
    } catch {
      toast.error('An error occurred. Check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return !!form.watch('listing_type')
      case 2: return form.watch('title').length >= 5 && form.watch('description').length >= 20
      case 3: return !!form.watch('publishing_mode')
      case 4: return whatsapp.enabled || telegram.enabled || url.enabled
      default: return false
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s < step ? 'bg-primary text-primary-foreground' : s === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 4 && <div className={`h-0.5 w-8 ${s < step ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Listing Type</CardTitle>
            <CardDescription>What kind of listing are you creating?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={form.watch('listing_type')}
              onValueChange={(value: string) => form.setValue('listing_type', value as ListingType)}
              className="grid gap-4 sm:grid-cols-2"
            >
              {listingTypes.map(({ value, icon }) => (
                <Label
                  key={value}
                  htmlFor={value}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                    form.watch('listing_type') === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={value} id={value} className="sr-only" />
                  <div className={`rounded-lg p-2 ${form.watch('listing_type') === value ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {icon}
                  </div>
                  <span className="font-medium text-lg">{LISTING_TYPE_LABELS[value]}</span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Listing Details</CardTitle>
            <CardDescription>Give it a catchy title and clear description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Luxury Apartment in Downtown" {...form.register('title')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe property features, location, etc." className="min-h-[150px]" {...form.register('description')} />
            </div>
            <div className="space-y-3">
              <Label className="flex justify-between">
                <span>Photos <span className="text-muted-foreground font-normal">(Optional)</span></span>
                <span className="text-xs text-muted-foreground">{imageUrls.length}/5</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative group h-24 w-24 overflow-hidden rounded-xl border bg-muted shadow-sm">
                    {uploadingMap[i] ? (
                        <div className="flex h-full w-full items-center justify-center bg-background/50 backdrop-blur-[2px]">
                            <Spinner className="h-5 w-5 text-primary" />
                        </div>
                    ) : (
                        <>
                            <img 
                                src={url} 
                                className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                                alt="" 
                            />
                            <button 
                                type="button" 
                                onClick={() => removeImage(i)} 
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </>
                    )}
                  </div>
                ))}
                {imageUrls.length < 5 && (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary hover:bg-primary/5">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-1 text-[10px] text-muted-foreground font-medium">Add Photo</span>
                    <Input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImagesChange}
                        disabled={Object.keys(uploadingMap).length > 0} 
                    />
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Publishing Mode</CardTitle>
            <CardDescription>Select your visibility level</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={form.watch('publishing_mode')}
              onValueChange={(value: string) => form.setValue('publishing_mode', value as PublishingMode)}
              className="space-y-4"
            >
              {publishingModes.map((mode) => (
                <Label
                  key={mode}
                  htmlFor={mode}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 ${
                    form.watch('publishing_mode') === mode ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <RadioGroupItem value={mode} id={mode} />
                  <span className="font-medium text-lg">{PUBLISHING_MODE_LABELS[mode]}</span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Methods</CardTitle>
            <CardDescription>How should people reach you?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* WhatsApp Row */}
            <div className={`flex flex-col gap-3 rounded-xl border-2 p-4 transition-all ${whatsapp.enabled ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="flex items-center justify-between">
                <Label htmlFor="use-whatsapp" className="flex flex-1 cursor-pointer items-center gap-3 font-bold text-lg">
                  <div className={`rounded-lg p-2 ${whatsapp.enabled ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                    <Phone className="h-5 w-5" />
                  </div>
                  WhatsApp
                </Label>
                <Checkbox 
                  id="use-whatsapp" 
                  checked={whatsapp.enabled} 
                  onCheckedChange={(val: boolean) => setWhatsapp({ ...whatsapp, enabled: val })} 
                  className="h-6 w-6 rounded-md"
                />
              </div>
              {whatsapp.enabled && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input 
                    placeholder="Phone number (+97...)" 
                    value={whatsapp.value} 
                    onChange={(e) => setWhatsapp({ ...whatsapp, value: e.target.value })}
                    className="bg-background"
                  />
                </div>
              )}
            </div>

            {/* Telegram Row */}
            <div className={`flex flex-col gap-3 rounded-xl border-2 p-4 transition-all ${telegram.enabled ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="flex items-center justify-between">
                <Label htmlFor="use-telegram" className="flex flex-1 cursor-pointer items-center gap-3 font-bold text-lg">
                  <div className={`rounded-lg p-2 ${telegram.enabled ? 'bg-blue-400 text-white' : 'bg-muted'}`}>
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  Telegram
                </Label>
                <Checkbox 
                  id="use-telegram" 
                  checked={telegram.enabled} 
                  onCheckedChange={(val: boolean) => setTelegram({ ...telegram, enabled: val })}
                  className="h-6 w-6 rounded-md"
                />
              </div>
              {telegram.enabled && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input 
                    placeholder="@username" 
                    value={telegram.value} 
                    onChange={(e) => setTelegram({ ...telegram, value: e.target.value })}
                    className="bg-background"
                  />
                </div>
              )}
            </div>

            {/* URL Row */}
            <div className={`flex flex-col gap-3 rounded-xl border-2 p-4 transition-all ${url.enabled ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="flex items-center justify-between">
                <Label htmlFor="use-url" className="flex flex-1 cursor-pointer items-center gap-3 font-bold text-lg">
                  <div className={`rounded-lg p-2 ${url.enabled ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <LinkIcon className="h-5 w-5" />
                  </div>
                  Link / Website
                </Label>
                <Checkbox 
                  id="use-url" 
                  checked={url.enabled} 
                  onCheckedChange={(val: boolean) => setUrl({ ...url, enabled: val })}
                  className="h-6 w-6 rounded-md"
                />
              </div>
              {url.enabled && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input 
                    placeholder="https://..." 
                    value={url.value} 
                    onChange={(e) => setUrl({ ...url, value: e.target.value })}
                    className="bg-background"
                  />
                  <Input 
                    placeholder="Button Label (optional)" 
                    value={url.label || ''} 
                    onChange={(e) => setUrl({ ...url, label: e.target.value })}
                    className="bg-background"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticky Bottom Actions (Mobile) / Regular Actions (Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 p-4 pb-safe-offset-4 backdrop-blur-md md:relative md:mt-8 md:border-none md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-2xl justify-between">
          <Button type="button" variant="outline" onClick={() => (step === 1 ? router.push('/dashboard') : setStep(step - 1))}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {step < 4 ? (
            <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting || !canProceed()} className="min-w-[150px]">
              {isSubmitting ? <Spinner className="h-4 w-4" /> : 'Create Listing'}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
