import crypto from 'crypto'
import type { TelegramUser, Profile } from './types'

export function verifyTelegramAuth(data: TelegramUser): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return false

  const { hash, ...rest } = data
  const checkArr = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
  const checkString = checkArr.join('\n')
  
  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')
  
  return hmac === hash
}

export function isAuthDateValid(authDate: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  const maxAge = 86400 // 24 hours
  return now - authDate < maxAge
}

export function createSessionToken(profile: Profile): string {
  const payload = {
    id: profile.id,
    telegram_id: profile.telegram_id,
    is_admin: profile.is_admin,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

export function parseSessionToken(token: string): { id: string; telegram_id: number; is_admin: boolean } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
