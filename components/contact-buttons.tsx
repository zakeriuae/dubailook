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
    <div className={variant === 'row' ? "flex flex-row gap-2" : "space-y-3"}>
      {ctas.map((cta) => {
        const isWhatsapp = cta.cta_type === 'whatsapp'
        const isTelegram = cta.cta_type === 'telegram'
        const isUrl = cta.cta_type === 'url'

        let icon = <ExternalLink className="h-5 w-5" />
        let bgClass = ''
        let href = cta.value
        let label = cta.label || 'Visit Website'

        if (isWhatsapp) {
          icon = <Phone className="h-5 w-5" />
          bgClass = 'bg-green-600 hover:bg-green-700 text-white'
          href = `https://wa.me/${cta.value.replace(/\D/g, '')}`
          label = 'Contact via WhatsApp'
        } else if (isTelegram) {
          icon = <MessageCircle className="h-5 w-5" />
          bgClass = 'bg-[#0088cc] hover:bg-[#0088cc]/90 text-white'
          href = `https://t.me/${cta.value.replace('@', '')}`
          label = 'Contact via Telegram'
        }

        return (
          <Button
            key={cta.id}
            size="lg"
            variant={isUrl || !isAuthenticated ? 'outline' : 'default'}
            className={`w-full gap-2 ${isAuthenticated ? (isWhatsapp || isTelegram ? bgClass : '') : 'border-dashed'}`}
            asChild
          >
            <a 
              href={isAuthenticated ? href : '#'} 
              onClick={(e) => handleContactClick(e, cta)}
              target={isAuthenticated ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 overflow-hidden"
            >
              {isAuthenticated ? icon : <Lock className="h-4 w-4 text-muted-foreground mr-1" />}
              <span className="truncate">{label.replace('Contact via ', '')}</span>
              {!isAuthenticated && <span className="text-[10px] opacity-70 ml-1 hidden sm:inline">(Login)</span>}
            </a>
          </Button>
        )
      })}
    </div>
  )
}
