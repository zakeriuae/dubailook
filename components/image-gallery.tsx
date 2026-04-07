'use client'

import React, { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getOptimizedImageUrl } from '@/lib/storage'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ImageGalleryProps {
  images: string[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // --- Main Carousel ---
  const [mainViewportRef, emblaMainApi] = useEmblaCarousel({ loop: true, duration: 20 })
  const [thumbViewportRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  })

  // --- Lightbox Carousel ---
  const [lightboxViewportRef, emblaLightboxApi] = useEmblaCarousel({ loop: true })

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
  }, [emblaMainApi, emblaThumbsApi])

  useEffect(() => {
    if (!emblaMainApi) return
    onSelect()
    emblaMainApi.on('select', onSelect)
    emblaMainApi.on('reInit', onSelect)
  }, [emblaMainApi, onSelect])

  // Sync lightbox carousel when it opens
  useEffect(() => {
    if (lightboxOpen && emblaLightboxApi) {
      emblaLightboxApi.scrollTo(lightboxIndex, true)
    }
  }, [lightboxOpen, emblaLightboxApi, lightboxIndex])

  // Track lightbox scroll index
  const onLightboxSelect = useCallback(() => {
    if (!emblaLightboxApi) return
    setLightboxIndex(emblaLightboxApi.selectedScrollSnap())
  }, [emblaLightboxApi])

  useEffect(() => {
    if (!emblaLightboxApi) return
    onLightboxSelect()
    emblaLightboxApi.on('select', onLightboxSelect)
    emblaLightboxApi.on('reInit', onLightboxSelect)
  }, [emblaLightboxApi, onLightboxSelect])

  const scrollPrev = useCallback(() => emblaMainApi && emblaMainApi.scrollPrev(), [emblaMainApi])
  const scrollNext = useCallback(() => emblaMainApi && emblaMainApi.scrollNext(), [emblaMainApi])

  const lightboxPrev = useCallback(() => emblaLightboxApi && emblaLightboxApi.scrollPrev(), [emblaLightboxApi])
  const lightboxNext = useCallback(() => emblaLightboxApi && emblaLightboxApi.scrollNext(), [emblaLightboxApi])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen, lightboxPrev, lightboxNext])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxOpen])

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center bg-muted rounded-xl">
        <span className="text-muted-foreground">No images available</span>
      </div>
    )
  }

  return (
    <>
      {/* ─── Main Gallery ─── */}
      <div className="flex flex-col gap-3">
        <div className="relative group overflow-hidden md:rounded-xl bg-black/5">
          <div className="overflow-hidden" ref={mainViewportRef}>
            <div className="flex touch-pan-y">
              {images.map((url, index) => (
                <div
                  key={index}
                  className="relative flex-[0_0_100%] min-w-0 aspect-video select-none cursor-zoom-in"
                  onClick={() => openLightbox(index)}
                >
                  <Image
                    src={getOptimizedImageUrl(url, { width: 1200 })}
                    alt={`${title} - ${index + 1}`}
                    fill
                    className="object-contain"
                    priority={index === 0}
                  />
                  {/* Zoom hint icon */}
                  <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <ZoomIn className="h-4 w-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Nav Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center hover:bg-white/40"
                onClick={(e) => { e.stopPropagation(); scrollPrev() }}
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center hover:bg-white/40"
                onClick={(e) => { e.stopPropagation(); scrollNext() }}
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </Button>
            </>
          )}

          {/* Counter Badge */}
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
                    'h-1.5 transition-all duration-300 rounded-full',
                    selectedIndex === i ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
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
                    'relative flex-[0_0_20%] md:flex-[0_0_15%] aspect-video rounded-lg overflow-hidden transition-all duration-300 ring-2 ring-transparent',
                    selectedIndex === index
                      ? 'ring-primary opacity-100 scale-105 z-10'
                      : 'opacity-40 hover:opacity-100'
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

      {/* ─── Lightbox Overlay ─── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              <X className="h-5 w-5" />
              Close
            </button>
            <span className="text-white/60 text-sm">
              {lightboxIndex + 1} of {images.length}
            </span>
          </div>

          {/* Lightbox Carousel */}
          <div
            className="flex-1 overflow-hidden flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <div className="overflow-hidden h-full" ref={lightboxViewportRef}>
                <div className="flex h-full touch-pan-y">
                  {images.map((url, index) => (
                    <div
                      key={index}
                      className="relative flex-[0_0_100%] min-w-0 h-full"
                    >
                      <Image
                        src={getOptimizedImageUrl(url, { width: 1920 })}
                        alt={`${title} - ${index + 1}`}
                        fill
                        className="object-contain"
                        priority={index === lightboxIndex}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Lightbox Nav Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md flex items-center justify-center transition-colors"
                    onClick={lightboxPrev}
                  >
                    <ChevronLeft className="h-7 w-7 text-white" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md flex items-center justify-center transition-colors"
                    onClick={lightboxNext}
                  >
                    <ChevronRight className="h-7 w-7 text-white" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bottom Thumbnails (Lightbox) */}
          {images.length > 1 && (
            <div
              className="shrink-0 flex justify-center gap-2 px-4 py-4 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((url, index) => (
                <button
                  key={index}
                  onClick={() => emblaLightboxApi?.scrollTo(index)}
                  className={cn(
                    'relative h-14 w-20 shrink-0 rounded-md overflow-hidden transition-all duration-200 ring-2 ring-transparent',
                    lightboxIndex === index
                      ? 'ring-white opacity-100'
                      : 'opacity-40 hover:opacity-80'
                  )}
                >
                  <Image
                    src={getOptimizedImageUrl(url, { width: 160 })}
                    alt={`Thumb ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
