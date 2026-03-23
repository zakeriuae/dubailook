export type ListingType = 'custom_offer' | 'buyer_request' | 'property' | 'land' | 'project'
export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'published'
export type PublishingMode = 'one_time' | 'ten_times_daily' | 'ten_times_every_other_day' | 'five_times_weekly'
export type CTAType = 'whatsapp' | 'url' | 'telegram'

export interface Profile {
  id: string
  telegram_id: number
  telegram_username: string | null
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  whatsapp: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  user_id: string
  title: string
  description: string
  listing_type: ListingType
  image_url: string | null
  status: ListingStatus
  publishing_mode: PublishingMode
  created_at: string
  updated_at: string
  user?: Profile
  listing_cta?: ListingCTA[]
  listing_stats?: ListingStats
}

export interface ListingCTA {
  id: string
  listing_id: string
  cta_type: CTAType
  value: string
  label: string | null
  created_at: string
}

export interface ListingSchedule {
  id: string
  listing_id: string
  scheduled_at: string
  published_at: string | null
  telegram_message_id: number | null
  is_completed: boolean
  created_at: string
}

export interface ListingStats {
  id: string
  listing_id: string
  page_views: number
  list_impressions: number
  telegram_views: number
  updated_at: string
}

export interface AdminAction {
  id: string
  admin_id: string
  listing_id: string
  action: string
  reason: string | null
  created_at: string
  admin?: Profile
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  custom_offer: 'Custom Offer',
  buyer_request: 'Buyer Request',
  property: 'Property',
  land: 'Land',
  project: 'Project',
}

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
}

export const PUBLISHING_MODE_LABELS: Record<PublishingMode, string> = {
  one_time: 'One Time',
  ten_times_daily: '10 Times Daily',
  ten_times_every_other_day: '10 Times Every Other Day',
  five_times_weekly: '5 Times Weekly',
}
