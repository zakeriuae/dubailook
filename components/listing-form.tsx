'use client'

import { useState } from 'react'
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
  Upload, Phone, MessageCircle, Link as LinkIcon, ArrowLeft, ArrowRight, Check
} from 'lucide-react'
import { LISTING_TYPE_LABELS, PUBLISHING_MODE_LABELS } from '@/lib/types'
import type { ListingType, PublishingMode, CTAType } from '@/lib/types'

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
  { value: 'property', icon: <Building2 className="h-6 w-6" /> },
  { value: 'land', icon: <LandPlot className="h-6 w-6" /> },
  { value: 'project', icon: <Briefcase className="h-6 w-6" /> },
  { value: 'custom_offer', icon: <Package className="h-6 w-6" /> },
  { value: 'buyer_request', icon: <Users className="h-6 w-6" /> },
]

const publishingModes: PublishingMode[] = ['one_time', 'ten_times_daily', 'ten_times_every_other_day', 'five_times_weekly']

export function ListingForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ctas, setCtas] = useState<CTAItem[]>([])
  const [newCta, setNewCta] = useState<CTAItem>({ type: 'whatsapp', value: '', label: '' })

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      listing_type: 'property',
      publishing_mode: 'one_time',
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addCta = () => {
    if (newCta.value.trim()) {
      setCtas([...ctas, { ...newCta }])
      setNewCta({ type: 'whatsapp', value: '', label: '' })
    }
  }

  const removeCta = (index: number) => {
    setCtas(ctas.filter((_, i) => i !== index))
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
      if (imageFile) {
        formData.append('image', imageFile)
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
      case 1:
        return !!form.watch('listing_type')
      case 2:
        return form.watch('title').length >= 5 && form.watch('description').length >= 20
      case 3:
        return !!form.watch('publishing_mode')
      case 4:
        return ctas.length > 0
      default:
        return false
    }
  }

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

            <div className="space-y-2">
              <Label>Image (Optional)</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                      className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-destructive"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-2 text-sm text-muted-foreground">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
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
                      {cta.type === 'whatsapp' && <Phone className="h-4 w-4" />}
                      {cta.type === 'telegram' && <MessageCircle className="h-4 w-4" />}
                      {cta.type === 'url' && <LinkIcon className="h-4 w-4" />}
                      <span className="text-sm">{cta.value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCta(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New CTA */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex gap-4">
                <Label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={newCta.type === 'whatsapp'}
                    onCheckedChange={() => setNewCta({ ...newCta, type: 'whatsapp' })}
                  />
                  <Phone className="h-4 w-4" />
                  WhatsApp
                </Label>
                <Label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={newCta.type === 'telegram'}
                    onCheckedChange={() => setNewCta({ ...newCta, type: 'telegram' })}
                  />
                  <MessageCircle className="h-4 w-4" />
                  Telegram
                </Label>
                <Label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={newCta.type === 'url'}
                    onCheckedChange={() => setNewCta({ ...newCta, type: 'url' })}
                  />
                  <LinkIcon className="h-4 w-4" />
                  URL
                </Label>
              </div>

              <Input
                placeholder={
                  newCta.type === 'whatsapp'
                    ? 'Phone number (e.g., +1234567890)'
                    : newCta.type === 'telegram'
                    ? 'Telegram username (e.g., @username)'
                    : 'URL (e.g., https://instagram.com/...)'
                }
                value={newCta.value}
                onChange={(e) => setNewCta({ ...newCta, value: e.target.value })}
              />

              {newCta.type === 'url' && (
                <Input
                  placeholder="Button label (optional)"
                  value={newCta.label || ''}
                  onChange={(e) => setNewCta({ ...newCta, label: e.target.value })}
                />
              )}

              <Button type="button" variant="outline" onClick={addCta} disabled={!newCta.value.trim()}>
                Add Contact Method
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
