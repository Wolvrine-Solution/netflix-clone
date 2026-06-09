export type NotificationType = 'NEW_CONTENT' | 'SUBSCRIPTION' | 'SYSTEM' | 'GENERAL'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  link?: string
  imageUrl?: string
  createdAt: string
}
