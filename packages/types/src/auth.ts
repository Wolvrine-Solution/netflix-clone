export interface NetflixProfile {
  id: string
  name: string
  avatarUrl: string
  isKid: boolean
  language: string
  userId: string
}

export interface NetflixUser {
  id: string
  email: string
  name: string | null
  image: string | null
  role: 'USER' | 'ADMIN'
  isSuspended: boolean
}

export interface NetflixSession {
  user: NetflixUser
  activeProfile: NetflixProfile | null
  expires: string
}

export type SubscriptionPlan = 'BASIC' | 'STANDARD' | 'PREMIUM'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'

export interface Subscription {
  id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

export const PLAN_FEATURES: Record<
  SubscriptionPlan,
  { price: number; streams: number; quality: string; downloads: boolean }
> = {
  BASIC: { price: 6.99, streams: 1, quality: '1080p', downloads: false },
  STANDARD: { price: 13.99, streams: 2, quality: '1080p', downloads: true },
  PREMIUM: { price: 17.99, streams: 4, quality: '4K + HDR', downloads: true },
}
