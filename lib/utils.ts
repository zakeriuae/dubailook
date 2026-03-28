import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return 'Never'
  const d = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays <= 3) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
  }

  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getAvatarColor(name: string = 'User') {
  const gradients = [
    'from-red-500 to-orange-400',
    'from-blue-600 to-cyan-400',
    'from-green-500 to-emerald-400',
    'from-purple-600 to-violet-400',
    'from-pink-500 to-rose-400',
    'from-sky-500 to-blue-400',
    'from-yellow-500 to-orange-400',
    'from-indigo-600 to-purple-400',
  ]
  
  let hash = 0
  const str = name || 'User'
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % gradients.length
  return gradients[index]
}

export function getInitials(firstName?: string | null, lastName?: string | null) {
  const f = firstName?.trim() || ''
  const l = lastName?.trim() || ''
  if (!f && !l) return 'U'
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase()
  return f ? f[0].toUpperCase() : l[0].toUpperCase()
}
