'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface MarqueeTitleProps {
  title: string
  className?: string
}

export function MarqueeTitle({ title, className }: MarqueeTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [shouldMarquee, setShouldMarquee] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        // Use a small buffer to avoid flickering
        const isOverflowing = textRef.current.offsetWidth > containerRef.current.clientWidth - 20
        setShouldMarquee(isOverflowing)
      }
    }

    // Delay slightly to ensure layout is complete
    const timeout = setTimeout(checkOverflow, 100)
    window.addEventListener('resize', checkOverflow)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', checkOverflow)
    }
  }, [title])

  return (
    <div 
      ref={containerRef} 
      className={cn("w-full min-w-0 overflow-hidden whitespace-nowrap text-center", className)}
    >
      <div className={cn(
        "inline-flex items-center",
        shouldMarquee && "animate-marquee-slow hover:[animation-play-state:paused]"
      )}>
        <span ref={textRef} className="px-2">{title}</span>
        {shouldMarquee && <span className="px-10">{title}</span>}
      </div>
    </div>
  )
}
