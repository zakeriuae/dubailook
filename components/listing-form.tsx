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
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(60, 'Title cannot exceed 60 characters')
    .refine(
      (val) => !/(https?:\/\/|www\.)[^\s]+|(\b[a-z0-9]+\.[a-z]{2,})/gi.test(val),
      { message: 'Links and URLs are not allowed in the title' }
    )
    .refine(
      (val) => !/(\b\d{7,15}\b)|(\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/.test(val),
      { message: 'Phone numbers are not allowed in the title' }
    ),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(500, 'Description cannot exceed 500 characters')
    .refine(
      (val) => !/(https?:\/\/|www\.)[^\s]+|(\b[a-z0-9]+\.[a-z]{2,})/gi.test(val),
      { message: 'Links and URLs are not allowed in the description' }
    )
    .refine(
      (val) => /[a-zA-Z]{2,}/.test(val),
      { message: 'Posts can be in any language, but an English translation is required in the description.' }
    ),
  listing_type: z.enum(['custom_offer', 'buyer_request', 'property', 'land', 'project']),
  publishing_mode: z.enum(['one_time', 'ten_times_daily', 'ten_times_every_other_day', 'five_times_weekly']),
})

type ListingFormData = z.infer<typeof listingSchema>

interface ContactMethod {
  enabled: boolean
  value: string
  label?: string
}

const listingTypes: { value: ListingType; icon: React.ReactNode; disabled?: boolean }[] = [
  { value: 'custom_offer', icon: <Package className="h-6 w-6" /> },
  { value: 'property', icon: <Building2 className="h-6 w-6" />, disabled: true },
  { value: 'land', icon: <LandPlot className="h-6 w-6" />, disabled: true },
  { value: 'project', icon: <Briefcase className="h-6 w-6" />, disabled: true },
  { value: 'buyer_request', icon: <Users className="h-6 w-6" />, disabled: true },
]

const publishingModes: PublishingMode[] = ['one_time', 'ten_times_daily', 'ten_times_every_other_day', 'five_times_weekly']

import { createClient } from '@/lib/supabase/client'

export function ListingForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // For global upload state
  const [images, setImages] = useState<{ id: string; url?: string; uploading: boolean }[]>([])
  
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

    const availableSlots = 5 - images.length
    const filesToUpload = files.slice(0, availableSlots)
    
    if (filesToUpload.length === 0) {
      toast.error('You can only upload up to 5 photos')
      return
    }

    // 1. Create slots for the new files immediately
    const newSlots = filesToUpload.map(() => ({
      id: Math.random().toString(36).substring(7),
      uploading: true,
    }))

    setImages(prev => [...prev, ...newSlots])

    // 2. Start all uploads in parallel
    filesToUpload.forEach(async (file, i) => {
      const slotId = newSlots[i].id
      
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const { publicUrl } = await res.json()

        setImages(prev => prev.map(slot => 
          slot.id === slotId 
            ? { ...slot, url: publicUrl, uploading: false } 
            : slot
        ))
      } catch (err) {
        console.error('Upload failed:', err)
        toast.error(`Failed to upload ${file.name}`)
        // Remove the failed slot
        setImages(prev => prev.filter(slot => slot.id !== slotId))
      }
    })
    
    // Clear input so same file can be selected again if needed
    e.target.value = ''
  }

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(slot => slot.id !== id))
  }

  const handleNext = async () => {
    let isValid = false
    
    if (step === 1) {
      isValid = !!form.getValues('listing_type')
    } else if (step === 2) {
      isValid = await form.trigger(['title', 'description'])
    } else if (step === 3) {
      isValid = !!form.getValues('publishing_mode')
    }
    
    if (isValid) {
      setStep(step + 1)
    } else {
      // Small toast to notify the user there are errors
      toast.error('Please fix the errors before proceeding')
    }
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

    if (images.some(img => img.uploading)) {
        toast.error('Please wait for images to finish uploading')
        return
    }


    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('data', JSON.stringify({ 
        ...data, 
        ctas: activeCtas,
        image_urls: images.map(img => img.url).filter(Boolean) as string[] // Send the uploaded URLs
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
      case 2: return form.watch('title').length >= 5 && form.watch('title').length <= 60 && form.watch('description').length >= 20
      case 3: return !!form.watch('publishing_mode')
      case 4: return whatsapp.enabled || telegram.enabled || url.enabled
      default: return false
    }
  }

  return (
    <form 
      onSubmit={form.handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
          e.preventDefault()
        }
      }}
    >


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
              {listingTypes.map(({ value, icon, disabled }) => (
                <div
                  key={value}
                  onClick={() => !disabled && form.setValue('listing_type', value as ListingType)}
                  className={`relative flex items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                    disabled
                      ? 'cursor-not-allowed border-border opacity-50'
                      : form.watch('listing_type') === value
                        ? 'cursor-pointer border-primary bg-primary/5'
                        : 'cursor-pointer border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={value} id={value} className="sr-only" disabled={disabled} />
                  <div className={`rounded-lg p-2 ${
                    disabled ? 'bg-muted text-muted-foreground' :
                    form.watch('listing_type') === value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {icon}
                  </div>
                  <span className={`font-medium text-lg ${disabled ? 'text-muted-foreground' : ''}`}>
                    {LISTING_TYPE_LABELS[value]}
                  </span>
                  {disabled && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-muted-foreground/30 rounded px-1.5 py-0.5">
                      Soon
                    </span>
                  )}
                </div>
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
              <div className="flex justify-between items-end">
                <Label htmlFor="title">Title</Label>
                <span className={`text-[10px] ${(form.watch('title') || '').length > 60 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  {(form.watch('title') || '').length}/60
                </span>
              </div>
              <Input id="title" placeholder="Summarize your offer (No phone/links)" {...form.register('title')} maxLength={60} />
              {form.formState.errors.title?.message && (
                <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe property features, location, etc. (English required, no links)" 
                className={`min-h-[150px] resize-none ${form.formState.errors.description ? 'border-destructive ring-destructive' : ''}`} 
                {...form.register('description')} 
                maxLength={500}
              />
              {form.formState.errors.description?.message && (
                <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.description.message}</p>
              )}
              <div className="flex justify-end">
                <span className={`text-xs ${(form.watch('description') || '').length >= 500 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  {(form.watch('description') || '').length}/500
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="flex justify-between">
                <span>Photos <span className="text-muted-foreground font-normal">(Optional)</span></span>
                <span className="text-xs text-muted-foreground">{images.length}/5</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative group h-24 w-24 overflow-hidden rounded-xl border bg-muted shadow-sm">
                    {img.uploading ? (
                        <div className="flex h-full w-full items-center justify-center bg-background/50 backdrop-blur-[2px]">
                            <Spinner className="h-5 w-5 text-primary" />
                        </div>
                    ) : (
                        <>
                            <img 
                                src={img.url} 
                                className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                                alt="" 
                            />
                            <button 
                                type="button" 
                                onClick={() => removeImage(img.id)} 
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </>
                    )}
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary hover:bg-primary/5">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-1 text-[10px] text-muted-foreground font-medium">Add Photo</span>
                    <Input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImagesChange}
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
              {publishingModes.map((mode) => {
                const isDisabled = mode !== 'one_time'
                return (
                  <Label
                    key={mode}
                    htmlFor={mode}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault()
                        return
                      }
                      form.setValue('publishing_mode', mode)
                    }}
                    className={`flex items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                      isDisabled
                        ? 'cursor-not-allowed border-border opacity-50'
                        : form.watch('publishing_mode') === mode
                          ? 'cursor-pointer border-primary bg-primary/5'
                          : 'cursor-pointer border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={mode} id={mode} disabled={isDisabled} />
                    <span className={`font-medium text-lg ${isDisabled ? 'text-muted-foreground' : ''}`}>
                      {PUBLISHING_MODE_LABELS[mode]}
                    </span>
                    {isDisabled && (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-muted-foreground/30 rounded px-1.5 py-0.5">
                        Soon
                      </span>
                    )}
                  </Label>
                )
              })}
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
            <Button type="button" onClick={handleNext}>
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
