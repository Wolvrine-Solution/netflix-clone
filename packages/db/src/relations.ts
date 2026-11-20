import { relations } from 'drizzle-orm'
import {
  user,
  account,
  session,
  verificationToken,
  profile,
  refreshToken,
  subscription,
  content,
  videoFile,
  season,
  episode,
  genre,
  contentGenre,
  category,
  contentCategory,
  row,
  contentRow,
  myListItem,
  watchHistory,
  review,
  notification,
  adminLog,
  asset,
  caption,
  trickPlaySprite,
  licenseWindow,
  qoeEvent,
  liveChannel,
  liveEvent,
  eventEntitlement,
  stripeWebhookEvent,
  purchase,
  playbackSession,
  outboxEvent,
  dmcaTakedown,
  consentRecord,
  dataSubjectRequest,
  downloadLicense,
} from './schema'

export const userRelations = relations(user, ({ one, many }) => ({
  accounts: many(account),
  sessions: many(session),
  profiles: many(profile),
  subscription: one(subscription),
  notifications: many(notification),
  reviews: many(review),
  adminLogs: many(adminLog, { relationName: 'AdminWhoActed' }),
  refreshTokens: many(refreshToken),
  playbackSessions: many(playbackSession),
  purchases: many(purchase),
  eventEntitlements: many(eventEntitlement),
  consentRecords: many(consentRecord),
  dataSubjectRequests: many(dataSubjectRequest),
  downloadLicenses: many(downloadLicense),
  qoeEvents: many(qoeEvent),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const profileRelations = relations(profile, ({ one, many }) => ({
  user: one(user, { fields: [profile.userId], references: [user.id] }),
  myList: many(myListItem),
  watchHistory: many(watchHistory),
  reviews: many(review),
}))

export const refreshTokenRelations = relations(refreshToken, ({ one }) => ({
  user: one(user, { fields: [refreshToken.userId], references: [user.id] }),
}))

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, { fields: [subscription.userId], references: [user.id] }),
}))

export const contentRelations = relations(content, ({ many }) => ({
  genres: many(contentGenre),
  contentSeasons: many(season),
  videoFiles: many(videoFile),
  myListItems: many(myListItem),
  watchHistory: many(watchHistory),
  rowItems: many(contentRow),
  categories: many(contentCategory),
  reviews: many(review),
  assets: many(asset),
  captions: many(caption),
  trickPlaySprites: many(trickPlaySprite),
  licenseWindows: many(licenseWindow),
  purchases: many(purchase),
  outboxEvents: many(outboxEvent),
}))

export const videoFileRelations = relations(videoFile, ({ one }) => ({
  content: one(content, { fields: [videoFile.contentId], references: [content.id] }),
  episode: one(episode, { fields: [videoFile.episodeId], references: [episode.id] }),
}))

export const seasonRelations = relations(season, ({ one, many }) => ({
  content: one(content, { fields: [season.contentId], references: [content.id] }),
  episodes: many(episode),
}))

export const episodeRelations = relations(episode, ({ one, many }) => ({
  videoFiles: many(videoFile),
  season: one(season, { fields: [episode.seasonId], references: [season.id] }),
}))

export const genreRelations = relations(genre, ({ many }) => ({
  contents: many(contentGenre),
}))

export const contentGenreRelations = relations(contentGenre, ({ one }) => ({
  content: one(content, { fields: [contentGenre.contentId], references: [content.id] }),
  genre: one(genre, { fields: [contentGenre.genreId], references: [genre.id] }),
}))

export const categoryRelations = relations(category, ({ many }) => ({
  contents: many(contentCategory),
}))

export const contentCategoryRelations = relations(contentCategory, ({ one }) => ({
  content: one(content, { fields: [contentCategory.contentId], references: [content.id] }),
  category: one(category, { fields: [contentCategory.categoryId], references: [category.id] }),
}))

export const rowRelations = relations(row, ({ many }) => ({
  contents: many(contentRow),
}))

export const contentRowRelations = relations(contentRow, ({ one }) => ({
  content: one(content, { fields: [contentRow.contentId], references: [content.id] }),
  row: one(row, { fields: [contentRow.rowId], references: [row.id] }),
}))

export const myListItemRelations = relations(myListItem, ({ one }) => ({
  profile: one(profile, { fields: [myListItem.profileId], references: [profile.id] }),
  content: one(content, { fields: [myListItem.contentId], references: [content.id] }),
}))

export const watchHistoryRelations = relations(watchHistory, ({ one }) => ({
  profile: one(profile, { fields: [watchHistory.profileId], references: [profile.id] }),
  content: one(content, { fields: [watchHistory.contentId], references: [content.id] }),
}))

export const reviewRelations = relations(review, ({ one }) => ({
  profile: one(profile, { fields: [review.profileId], references: [profile.id] }),
  content: one(content, { fields: [review.contentId], references: [content.id] }),
  user: one(user, { fields: [review.userId], references: [user.id] }),
}))

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
}))

export const adminLogRelations = relations(adminLog, ({ one }) => ({
  admin: one(user, {
    fields: [adminLog.adminId],
    references: [user.id],
    relationName: 'AdminWhoActed',
  }),
}))

export const assetRelations = relations(asset, ({ one }) => ({
  content: one(content, { fields: [asset.contentId], references: [content.id] }),
}))

export const captionRelations = relations(caption, ({ one }) => ({
  content: one(content, { fields: [caption.contentId], references: [content.id] }),
}))

export const trickPlaySpriteRelations = relations(trickPlaySprite, ({ one }) => ({
  content: one(content, { fields: [trickPlaySprite.contentId], references: [content.id] }),
}))

export const licenseWindowRelations = relations(licenseWindow, ({ one }) => ({
  content: one(content, { fields: [licenseWindow.contentId], references: [content.id] }),
}))

export const qoeEventRelations = relations(qoeEvent, ({ one }) => ({
  user: one(user, { fields: [qoeEvent.userId], references: [user.id] }),
}))

export const liveChannelRelations = relations(liveChannel, ({ many }) => ({
  events: many(liveEvent),
}))

export const liveEventRelations = relations(liveEvent, ({ one, many }) => ({
  channel: one(liveChannel, { fields: [liveEvent.channelId], references: [liveChannel.id] }),
  entitlements: many(eventEntitlement),
  purchases: many(purchase),
}))

export const eventEntitlementRelations = relations(eventEntitlement, ({ one }) => ({
  event: one(liveEvent, { fields: [eventEntitlement.eventId], references: [liveEvent.id] }),
  user: one(user, { fields: [eventEntitlement.userId], references: [user.id] }),
}))

export const purchaseRelations = relations(purchase, ({ one }) => ({
  user: one(user, { fields: [purchase.userId], references: [user.id] }),
  content: one(content, { fields: [purchase.contentId], references: [content.id] }),
  event: one(liveEvent, { fields: [purchase.eventId], references: [liveEvent.id] }),
}))

export const playbackSessionRelations = relations(playbackSession, ({ one }) => ({
  user: one(user, { fields: [playbackSession.userId], references: [user.id] }),
}))

export const outboxEventRelations = relations(outboxEvent, ({ one }) => ({
  content: one(content, { fields: [outboxEvent.contentId], references: [content.id] }),
}))

export const consentRecordRelations = relations(consentRecord, ({ one }) => ({
  user: one(user, { fields: [consentRecord.userId], references: [user.id] }),
}))

export const dataSubjectRequestRelations = relations(dataSubjectRequest, ({ one }) => ({
  user: one(user, { fields: [dataSubjectRequest.userId], references: [user.id] }),
}))

export const downloadLicenseRelations = relations(downloadLicense, ({ one }) => ({
  user: one(user, { fields: [downloadLicense.userId], references: [user.id] }),
}))
