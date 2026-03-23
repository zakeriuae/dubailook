'use client'

import { Button } from '@/components/ui/button'
import { Phone, MessageCircle, ExternalLink, Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import type { ListingCTA } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface ContactButtonsProps {
  ctas: ListingCTA[]
  variant?: 'stack' | 'row'
}

export function ContactButtons({ ctas, variant = 'stack' }: ContactButtonsProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const handleContactClick = (e: React.MouseEvent, cta: ListingCTA) => {
    if (!isAuthenticated) {
      e.preventDefault()
      toast.error('ثبت نام / ورود الزامی است', {
        description: 'برای مشاهده اطلاعات تماس و ارتباط با آگهی‌دهنده، لطفاً ابتدا وارد حساب کاربری خود شوید.',
        action: {
          label: 'ورود به سایت',
          onClick: () => router.push(`/login?redirect=${window.location.pathname}`)
        }
      })
    }
  }

  if (!ctas || ctas.length === 0) return null

  return (
    <div className={variant === 'row' 
      ? `grid gap-2 ${ctas.length === 1 ? 'grid-cols-1' : ctas.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}` 
      : "space-y-3"
    }>
      {ctas.map((cta) => {
        const isWhatsapp = cta.cta_type === 'whatsapp'
        const isTelegram = cta.cta_type === 'telegram'
        const isUrl = cta.cta_type === 'url'

        let icon = <ExternalLink className="h-5 w-5" />
        let bgClass = ''
        let href = cta.value
        let label = cta.label || (variant === 'row' ? 'Link' : 'Visit Website')

        if (isWhatsapp) {
          icon = <Phone className="h-5 w-5" />
          bgClass = 'bg-[#25D366] hover:bg-[#20bd5c] text-white' // Premium WA Green
          href = `https://wa.me/${cta.value.replace(/\D/g, '')}`
          label = variant === 'row' ? 'WhatsApp' : 'Contact via WhatsApp'
        } else if (isTelegram) {
          icon = <MessageCircle className="h-5 w-5" />
          bgClass = 'bg-[#0088cc] hover:bg-[#0077b3] text-white'
          href = `https://t.me/${cta.value.replace('@', '')}`
          label = variant === 'row' ? 'Telegram' : 'Contact via Telegram'
        }

        return (
          <Button
            key={cta.id}
            size={variant === 'row' ? 'md' : 'lg'}
            variant={isUrl || !isAuthenticated ? 'outline' : 'default'}
            className={`w-full h-12 gap-2 shadow-sm ${isAuthenticated ? (isWhatsapp || isTelegram ? bgClass : '') : 'border-dashed'}`}
            asChild
          >
            <a 
              href={isAuthenticated ? href : '#'} 
              onClick={(e) => handleContactClick(e, cta)}
              target={isAuthenticated ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex items-center justify-center transition-transform active:scale-95"
            >
              <div className="flex items-center gap-2">
                {isAuthenticated ? icon : <Lock className="h-4 w-4 text-muted-foreground" />}
                <span className="font-semibold">{label.replace('Contact via ', '')}</span>
              </div>
            </a>
          </Button>
        )
      })}
    </div>
  )
}
