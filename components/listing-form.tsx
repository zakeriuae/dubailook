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

interface CTAItem {
  type: CTAType
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

export function ListingForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [ctas, setCtas] = useState<CTAItem[]>([])
  const [ctaType, setCtaType] = useState<CTAType>('whatsapp')
  const [ctaValue, setCtaValue] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)

  // Fetch current user profile for auto-fill
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          setProfile(data.profile)
        }
      })
      .catch(() => {})
  }, [])

  // When step 4 is reached, pre-populate CTAs from profile if empty
  useEffect(() => {
    if (step === 4 && ctas.length === 0 && profile) {
      const initial: CTAItem[] = []
      if (profile.telegram_username) {
        initial.push({ type: 'telegram', value: `@${profile.telegram_username}` })
      }
      if (ctas.length === 0 && initial.length > 0) {
        setCtas(initial)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      listing_type: 'custom_offer',
      publishing_mode: 'one_time',
    },
  })

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newFiles = [...imageFiles, ...files].slice(0, 5) // max 5 images
    setImageFiles(newFiles)
    const readers = newFiles.map(file => {
      return new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    })
    Promise.all(readers).then(setImagePreviews)
  }

  const removeImage = (idx: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== idx)
    const newPreviews = imagePreviews.filter((_, i) => i !== idx)
    setImageFiles(newFiles)
    setImagePreviews(newPreviews)
  }

  const addCta = () => {
    if (ctaValue.trim()) {
      setCtas([...ctas, { type: ctaType, value: ctaValue.trim(), label: ctaLabel.trim() || undefined }])
      setCtaValue('')
      setCtaLabel('')
    }
  }

  const removeCta = (index: number) => {
    setCtas(ctas.filter((_, i) => i !== index))
  }

  // Auto-fill value when type changes
  const handleCtaTypeChange = (type: CTAType) => {
    setCtaType(type)
    if (type === 'telegram' && profile?.telegram_username) {
      const alreadyAdded = ctas.some(c => c.type === 'telegram')
      if (!alreadyAdded) setCtaValue(`@${profile.telegram_username}`)
      else setCtaValue('')
    } else {
      setCtaValue('')
    }
    setCtaLabel('')
  }

  const onSubmit = async (data: ListingFormData) => {
    if (ctas.length === 0) {
      toast.error('Please add at least one contact method')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('data', JSON.stringify({ ...data, ctas }))
      for (const file of imageFiles) {
        formData.append('images', file)
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {
        toast.success('Listing created successfully! It will be reviewed by an admin.')
        router.push('/dashboard')
      } else {
        toast.error(result.error || 'Failed to create listing')
      }
    } catch {
      toast.error('An error occurred while creating the listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return !!form.watch('listing_type')
      case 2: return form.watch('title').length >= 5 && form.watch('description').length >= 20
      case 3: return !!form.watch('publishing_mode')
      case 4: return ctas.length > 0
      default: return false
    }
  }

  const ctaTypeOptions: { type: CTAType; icon: React.ReactNode; label: string; placeholder: string }[] = [
    {
      type: 'whatsapp',
      icon: <Phone className="h-4 w-4" />,
      label: 'WhatsApp',
      placeholder: 'Phone number (e.g., +1234567890)',
    },
    {
      type: 'telegram',
      icon: <MessageCircle className="h-4 w-4" />,
      label: 'Telegram',
      placeholder: profile?.telegram_username ? `@${profile.telegram_username}` : 'Telegram username (e.g., @username)',
    },
    {
      type: 'url',
      icon: <LinkIcon className="h-4 w-4" />,
      label: 'URL',
      placeholder: 'https://...',
    },
  ]

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s < step
                  ? 'bg-primary text-primary-foreground'
                  : s === step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 4 && (
              <div className={`h-0.5 w-8 ${s < step ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Listing Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Listing Type</CardTitle>
            <CardDescription>Choose the category that best describes your listing</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={form.watch('listing_type')}
              onValueChange={(value) => form.setValue('listing_type', value as ListingType)}
              className="grid gap-4 sm:grid-cols-2"
            >
              {listingTypes.map(({ value, icon }) => (
                <Label
                  key={value}
                  htmlFor={value}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                    form.watch('listing_type') === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={value} id={value} className="sr-only" />
                  <div className={`rounded-lg p-2 ${
                    form.watch('listing_type') === value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {icon}
                  </div>
                  <span className="font-medium">{LISTING_TYPE_LABELS[value]}</span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Listing Details</CardTitle>
            <CardDescription>Provide information about your listing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a descriptive title"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your listing in detail"
                className="min-h-[150px]"
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Multi-image upload */}
            <div className="space-y-2">
              <Label>Images (Optional, up to 5)</Label>
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                    <img src={src} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < 5 && (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="mt-1 text-xs text-muted-foreground">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
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

      {/* Step 3: Publishing Mode */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Publishing Schedule</CardTitle>
            <CardDescription>Choose how often your listing should be published</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={form.watch('publishing_mode')}
              onValueChange={(value) => form.setValue('publishing_mode', value as PublishingMode)}
              className="space-y-3"
            >
              {publishingModes.map((mode) => (
                <Label
                  key={mode}
                  htmlFor={mode}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                    form.watch('publishing_mode') === mode
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={mode} id={mode} />
                  <span className="font-medium">{PUBLISHING_MODE_LABELS[mode]}</span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 4: CTA Buttons */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Methods</CardTitle>
            <CardDescription>Add ways for people to contact you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing CTAs */}
            {ctas.length > 0 && (
              <div className="space-y-2">
                {ctas.map((cta, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-2">
                      {cta.type === 'whatsapp' && <Phone className="h-4 w-4 text-green-600" />}
                      {cta.type === 'telegram' && <MessageCircle className="h-4 w-4 text-blue-500" />}
                      {cta.type === 'url' && <LinkIcon className="h-4 w-4" />}
                      <span className="text-sm font-medium capitalize">{cta.type}</span>
                      <span className="text-sm text-muted-foreground">{cta.value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCta(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New CTA */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              {/* Type buttons in a row */}
              <div className="flex gap-2">
                {ctaTypeOptions.map(({ type, icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleCtaTypeChange(type)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                      ctaType === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              <Input
                placeholder={ctaTypeOptions.find(o => o.type === ctaType)?.placeholder || ''}
                value={ctaValue}
                onChange={(e) => setCtaValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCta() } }}
              />

              {ctaType === 'url' && (
                <Input
                  placeholder="Button label (optional)"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                />
              )}

              <Button type="button" variant="outline" onClick={addCta} disabled={!ctaValue.trim()} className="w-full">
                + Add Contact Method
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting || !canProceed()}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Creating...
              </>
            ) : (
              'Create Listing'
            )}
          </Button>
        )}
      </div>
    </form>
  )
}
