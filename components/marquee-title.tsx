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
    if (!containerRef.current || !textRef.current) return

    const observer = new ResizeObserver(() => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const textWidth = textRef.current.scrollWidth
        // If text is wider than container, marquee is needed
        setShouldMarquee(textWidth > containerWidth)
      }
    })

    observer.observe(containerRef.current)
    // Also re-check when title changes
    return () => observer.disconnect()
  }, [title])

  return (
    <div 
      ref={containerRef} 
      className={cn("w-full overflow-hidden whitespace-nowrap text-center", className)}
    >
      <div className={cn(
        "inline-flex items-center",
        shouldMarquee && "animate-marquee-slow hover:[animation-play-state:paused]"
      )}>
        <span ref={textRef} className="px-1">{title}</span>
        {shouldMarquee && <span className="px-10">{title}</span>}
      </div>
    </div>
  )
}
