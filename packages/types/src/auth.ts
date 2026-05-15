export interface NetflixProfile {
  id: string
  name: string
  avatarUrl: string
  isKid: boolean
  userId: string
}

export interface NetflixUser {
  id: string
  email: string
  name: string | null
  image: string | null
}

export interface NetflixSession {
  user: NetflixUser
  activeProfile: NetflixProfile | null
  expires: string
}

export type SubscriptionPlan = 'BASIC' | 'STANDARD' | 'PREMIUM'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE'

export interface Subscription {
  id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
}
