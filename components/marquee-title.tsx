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
        setShouldMarquee(textRef.current.offsetWidth > containerRef.current.offsetWidth)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [title])

  return (
    <div 
      ref={containerRef} 
      className={cn("flex-1 overflow-hidden whitespace-nowrap", className)}
    >
      <div className={cn(
        "inline-block",
        shouldMarquee && "animate-marquee-slow hover:[animation-play-state:paused]"
      )}>
        <span ref={textRef} className="px-2">{title}</span>
        {shouldMarquee && <span className="px-10">{title}</span>}
      </div>
    </div>
  )
}
