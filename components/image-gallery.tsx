'use client'

import React, { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getOptimizedImageUrl } from '@/lib/storage'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ImageGalleryProps {
  images: string[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const [mainViewportRef, emblaMainApi] = useEmblaCarousel({
    loop: true,
    duration: 20,
  })
  
  const [thumbViewportRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  })

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return
      emblaMainApi.scrollTo(index)
    },
    [emblaMainApi, emblaThumbsApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return
    setSelectedIndex(emblaMainApi.selectedScrollSnap())
    emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap())
  }, [emblaMainApi, emblaThumbsApi, setSelectedIndex])

  useEffect(() => {
    if (!emblaMainApi) return
    onSelect()
    emblaMainApi.on('select', onSelect)
    emblaMainApi.on('reInit', onSelect)
  }, [emblaMainApi, onSelect])

  const scrollPrev = useCallback(() => emblaMainApi && emblaMainApi.scrollPrev(), [emblaMainApi])
  const scrollNext = useCallback(() => emblaMainApi && emblaMainApi.scrollNext(), [emblaMainApi])

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center bg-muted rounded-xl">
        <span className="text-muted-foreground">No images available</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main Carousel */}
      <div className="relative group overflow-hidden md:rounded-xl bg-black/5">
        <div className="overflow-hidden" ref={mainViewportRef}>
          <div className="flex touch-pan-y">
            {images.map((url, index) => (
              <div 
                key={index} 
                className="relative flex-[0_0_100%] min-w-0 aspect-video select-none"
              >
                <Image
                  src={getOptimizedImageUrl(url, { width: 1200 })}
                  alt={`${title} - ${index + 1}`}
                  fill
                  className="object-contain"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons (Desktop Only) */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center hover:bg-white/40"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center hover:bg-white/40"
              onClick={scrollNext}
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </Button>
          </>
        )}

        {/* Multi-photo badge */}
        {images.length > 1 && (
          <Badge 
            variant="secondary" 
            className="absolute bottom-4 right-4 bg-black/60 text-white border-none backdrop-blur-md text-[10px] md:text-sm px-2.5 py-1 pointer-events-none"
          >
            {selectedIndex + 1} / {images.length}
          </Badge>
        )}

        {/* Progress Dots (Mobile) */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
            {images.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 transition-all duration-300 rounded-full",
                  selectedIndex === i ? "w-4 bg-white" : "w-1.5 bg-white/50"
                )} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="overflow-hidden mt-1 px-4 md:px-0" ref={thumbViewportRef}>
          <div className="flex gap-2.5 md:gap-3">
            {images.map((url, index) => (
              <button
                key={index}
                onClick={() => onThumbClick(index)}
                className={cn(
                  "relative flex-[0_0_20%] md:flex-[0_0_15%] aspect-video rounded-lg overflow-hidden transition-all duration-300 ring-2 ring-transparent",
                  selectedIndex === index ? "ring-primary opacity-100 scale-105 z-10" : "opacity-40 hover:opacity-100"
                )}
              >
                <Image
                  src={getOptimizedImageUrl(url, { width: 200 })}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
