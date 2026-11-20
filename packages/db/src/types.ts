// Row types, named like the former Prisma model types.
import type {
  session,
  profile,
  refreshToken,
  verificationToken,
  subscription,
  content,
  videoFile,
  season,
  user,
  category,
  genre,
  episode,
  row,
  myListItem,
  watchHistory,
  review,
  notification,
  adminLog,
  asset,
  caption,
  licenseWindow,
  qoeEvent,
  liveChannel,
  eventEntitlement,
  stripeWebhookEvent,
  trickPlaySprite,
  dmcaTakedown,
  playbackSession,
  outboxEvent,
  downloadLicense,
  dataSubjectRequest,
  account,
  liveEvent,
  purchase,
  consentRecord,
  contentGenre,
  contentCategory,
  contentRow,
} from './schema'

export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert
export type Profile = typeof profile.$inferSelect
export type NewProfile = typeof profile.$inferInsert
export type RefreshToken = typeof refreshToken.$inferSelect
export type NewRefreshToken = typeof refreshToken.$inferInsert
export type VerificationToken = typeof verificationToken.$inferSelect
export type NewVerificationToken = typeof verificationToken.$inferInsert
export type Subscription = typeof subscription.$inferSelect
export type NewSubscription = typeof subscription.$inferInsert
export type Content = typeof content.$inferSelect
export type NewContent = typeof content.$inferInsert
export type VideoFile = typeof videoFile.$inferSelect
export type NewVideoFile = typeof videoFile.$inferInsert
export type Season = typeof season.$inferSelect
export type NewSeason = typeof season.$inferInsert
export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Category = typeof category.$inferSelect
export type NewCategory = typeof category.$inferInsert
export type Genre = typeof genre.$inferSelect
export type NewGenre = typeof genre.$inferInsert
export type Episode = typeof episode.$inferSelect
export type NewEpisode = typeof episode.$inferInsert
export type Row = typeof row.$inferSelect
export type NewRow = typeof row.$inferInsert
export type MyListItem = typeof myListItem.$inferSelect
export type NewMyListItem = typeof myListItem.$inferInsert
export type WatchHistory = typeof watchHistory.$inferSelect
export type NewWatchHistory = typeof watchHistory.$inferInsert
export type Review = typeof review.$inferSelect
export type NewReview = typeof review.$inferInsert
export type Notification = typeof notification.$inferSelect
export type NewNotification = typeof notification.$inferInsert
export type AdminLog = typeof adminLog.$inferSelect
export type NewAdminLog = typeof adminLog.$inferInsert
export type Asset = typeof asset.$inferSelect
export type NewAsset = typeof asset.$inferInsert
export type Caption = typeof caption.$inferSelect
export type NewCaption = typeof caption.$inferInsert
export type LicenseWindow = typeof licenseWindow.$inferSelect
export type NewLicenseWindow = typeof licenseWindow.$inferInsert
export type QoEEvent = typeof qoeEvent.$inferSelect
export type NewQoEEvent = typeof qoeEvent.$inferInsert
export type LiveChannel = typeof liveChannel.$inferSelect
export type NewLiveChannel = typeof liveChannel.$inferInsert
export type EventEntitlement = typeof eventEntitlement.$inferSelect
export type NewEventEntitlement = typeof eventEntitlement.$inferInsert
export type StripeWebhookEvent = typeof stripeWebhookEvent.$inferSelect
export type NewStripeWebhookEvent = typeof stripeWebhookEvent.$inferInsert
export type TrickPlaySprite = typeof trickPlaySprite.$inferSelect
export type NewTrickPlaySprite = typeof trickPlaySprite.$inferInsert
export type DmcaTakedown = typeof dmcaTakedown.$inferSelect
export type NewDmcaTakedown = typeof dmcaTakedown.$inferInsert
export type PlaybackSession = typeof playbackSession.$inferSelect
export type NewPlaybackSession = typeof playbackSession.$inferInsert
export type OutboxEvent = typeof outboxEvent.$inferSelect
export type NewOutboxEvent = typeof outboxEvent.$inferInsert
export type DownloadLicense = typeof downloadLicense.$inferSelect
export type NewDownloadLicense = typeof downloadLicense.$inferInsert
export type DataSubjectRequest = typeof dataSubjectRequest.$inferSelect
export type NewDataSubjectRequest = typeof dataSubjectRequest.$inferInsert
export type Account = typeof account.$inferSelect
export type NewAccount = typeof account.$inferInsert
export type LiveEvent = typeof liveEvent.$inferSelect
export type NewLiveEvent = typeof liveEvent.$inferInsert
export type Purchase = typeof purchase.$inferSelect
export type NewPurchase = typeof purchase.$inferInsert
export type ConsentRecord = typeof consentRecord.$inferSelect
export type NewConsentRecord = typeof consentRecord.$inferInsert
export type ContentGenre = typeof contentGenre.$inferSelect
export type NewContentGenre = typeof contentGenre.$inferInsert
export type ContentCategory = typeof contentCategory.$inferSelect
export type NewContentCategory = typeof contentCategory.$inferInsert
export type ContentRow = typeof contentRow.$inferSelect
export type NewContentRow = typeof contentRow.$inferInsert
