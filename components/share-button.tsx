'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ShareButtonProps {
  title: string
  text?: string
  className?: string
}

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const shareData = {
    title: title,
    text: text || `Check out this listing on Dubilook: ${title}`,
    url: typeof window !== 'undefined' ? window.location.href : '',
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err)
          handleCopy()
        }
      }
    } else {
      handleCopy()
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareData.url)
    setCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Share2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {navigator.share && (
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share via...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopy}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
