import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Rate Limit Helpers ────────────────────────────────────────────────────────

export const RATE_LIMIT = 999999
export const RATE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours
export const RATE_LIMIT_KEY = 'tatvam_message_timestamps'

export function getMessageTimestamps(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    if (!stored) return []
    const timestamps: number[] = JSON.parse(stored)
    const cutoff = Date.now() - RATE_WINDOW_MS
    return timestamps.filter(t => t > cutoff)
  } catch {
    return []
  }
}

export function recordMessageTimestamp(): void {
  if (typeof window === 'undefined') return
  const timestamps = getMessageTimestamps()
  timestamps.push(Date.now())
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps))
}

export function getRemainingMessages(): number {
  return Math.max(0, RATE_LIMIT - getMessageTimestamps().length)
}

export function getNextResetTime(): string {
  const timestamps = getMessageTimestamps()
  if (timestamps.length === 0) return ''
  const oldest = Math.min(...timestamps)
  const resetAt = new Date(oldest + RATE_WINDOW_MS)
  const now = new Date()
  const diffMs = resetAt.getTime() - now.getTime()
  if (diffMs <= 0) return 'now'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) return 'in 24h'
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
