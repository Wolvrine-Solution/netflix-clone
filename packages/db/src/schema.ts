import {
  pgTable,
  uniqueIndex,
  foreignKey,
  text,
  timestamp,
  boolean,
  index,
  integer,
  doublePrecision,
  bigint,
  jsonb,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

export const assetStatus = pgEnum('AssetStatus', [
  'UPLOADED',
  'TRANSCODING',
  'PACKAGED',
  'READY',
  'FAILED',
])
export const contentStatus = pgEnum('ContentStatus', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])
export const dmcaStatus = pgEnum('DmcaStatus', ['OPEN', 'RESOLVED', 'REJECTED'])
export const dsarStatus = pgEnum('DsarStatus', ['PENDING', 'COMPLETED', 'FAILED'])
export const dsarType = pgEnum('DsarType', ['EXPORT', 'DELETE'])
export const liveEventStatus = pgEnum('LiveEventStatus', [
  'SCHEDULED',
  'LIVE',
  'ENDED',
  'CANCELLED',
])
export const mediaType = pgEnum('MediaType', ['movie', 'tv'])
export const notificationType = pgEnum('NotificationType', [
  'NEW_CONTENT',
  'SUBSCRIPTION',
  'SYSTEM',
  'GENERAL',
  'PROMO',
  'ACCOUNT',
])
export const plan = pgEnum('Plan', ['BASIC', 'STANDARD', 'PREMIUM'])
export const purchaseType = pgEnum('PurchaseType', ['PPV', 'TVOD'])
export const role = pgEnum('Role', ['USER', 'ADMIN'])
export const subStatus = pgEnum('SubStatus', ['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING'])
export const videoQuality = pgEnum('VideoQuality', [
  'AUTO',
  'Q_4K',
  'Q_1080P',
  'Q_720P',
  'Q_480P',
  'Q_360P',
])

export const session = pgTable(
  'Session',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    sessionToken: text().notNull(),
    userId: text().notNull(),
    expires: timestamp({ precision: 3, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('Session_sessionToken_key').using('btree', table.sessionToken),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'Session_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const profile = pgTable(
  'Profile',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text().notNull(),
    avatarUrl: text().notNull(),
    isKid: boolean().default(false).notNull(),
    pinHash: text(),
    language: text().default('en').notNull(),
    userId: text().notNull(),
  },
  (table) => [
    uniqueIndex('Profile_userId_name_key').using('btree', table.userId, table.name),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'Profile_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const refreshToken = pgTable(
  'RefreshToken',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text().notNull(),
    tokenHash: text().notNull(),
    expiresAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
    revokedAt: timestamp({ precision: 3, mode: 'date' }),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('RefreshToken_tokenHash_key').using('btree', table.tokenHash),
    index('RefreshToken_userId_idx').using('btree', table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'RefreshToken_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const verificationToken = pgTable(
  'VerificationToken',
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp({ precision: 3, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('VerificationToken_identifier_token_key').using(
      'btree',
      table.identifier,
      table.token
    ),
    uniqueIndex('VerificationToken_token_key').using('btree', table.token),
  ]
)

export const subscription = pgTable(
  'Subscription',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text().notNull(),
    plan: plan().default('STANDARD').notNull(),
    status: subStatus().default('ACTIVE').notNull(),
    stripeCustomerId: text(),
    stripePriceId: text(),
    stripeSubId: text(),
    currentPeriodEnd: timestamp({ precision: 3, mode: 'date' }),
    cancelAtPeriodEnd: boolean().default(false).notNull(),
  },
  (table) => [
    uniqueIndex('Subscription_stripeCustomerId_key').using('btree', table.stripeCustomerId),
    uniqueIndex('Subscription_stripeSubId_key').using('btree', table.stripeSubId),
    uniqueIndex('Subscription_userId_key').using('btree', table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'Subscription_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const content = pgTable(
  'Content',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    tmdbId: integer(),
    mediaType: mediaType().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    posterPath: text().notNull(),
    backdropPath: text().notNull(),
    trailerKey: text(),
    videoUrl: text(),
    releaseDate: text().notNull(),
    rating: doublePrecision().notNull(),
    runtime: integer(),
    seasons: integer(),
    episodes: integer(),
    maturityRating: text().default('TV-MA').notNull(),
    isFeatured: boolean().default(false).notNull(),
    status: contentStatus().default('PUBLISHED').notNull(),
    language: text().default('en').notNull(),
    country: text(),
    studio: text(),
    director: text(),
    tagline: text(),
    cast: text().array().notNull().default([]),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('Content_tmdbId_key').using('btree', table.tmdbId)]
)

export const videoFile = pgTable(
  'VideoFile',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    contentId: text(),
    episodeId: text(),
    quality: videoQuality().default('AUTO').notNull(),
    url: text().notNull(),
    size: bigint({ mode: 'bigint' }),
    duration: integer(),
    format: text(),
    isDefault: boolean().default(false).notNull(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'VideoFile_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.episodeId],
      foreignColumns: [episode.id],
      name: 'VideoFile_episodeId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const season = pgTable(
  'Season',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    contentId: text().notNull(),
    seasonNumber: integer().notNull(),
    title: text(),
    description: text(),
    posterPath: text(),
    airDate: text(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('Season_contentId_seasonNumber_key').using(
      'btree',
      table.contentId,
      table.seasonNumber
    ),
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'Season_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const user = pgTable(
  'User',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text().notNull(),
    emailVerified: timestamp({ precision: 3, mode: 'date' }),
    name: text(),
    image: text(),
    hashedPassword: text(),
    role: role().default('USER').notNull(),
    isSuspended: boolean().default(false).notNull(),
    mfaEnabled: boolean().default(false).notNull(),
    mfaSecret: text(),
    tosAcceptedAt: timestamp({ precision: 3, mode: 'date' }),
    privacyAcceptedAt: timestamp({ precision: 3, mode: 'date' }),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('User_email_key').using('btree', table.email)]
)

export const category = pgTable(
  'Category',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text().notNull(),
    slug: text().notNull(),
    description: text(),
    color: text(),
    icon: text(),
    isActive: boolean().default(true).notNull(),
    order: integer().default(0).notNull(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('Category_name_key').using('btree', table.name),
    uniqueIndex('Category_slug_key').using('btree', table.slug),
  ]
)

export const genre = pgTable(
  'Genre',
  {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
  },
  (table) => [uniqueIndex('Genre_name_key').using('btree', table.name)]
)

export const episode = pgTable(
  'Episode',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    seasonId: text().notNull(),
    episodeNumber: integer().notNull(),
    title: text().notNull(),
    description: text(),
    stillPath: text(),
    runtime: integer(),
    airDate: text(),
    videoUrl: text(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('Episode_seasonId_episodeNumber_key').using(
      'btree',
      table.seasonId,
      table.episodeNumber
    ),
    foreignKey({
      columns: [table.seasonId],
      foreignColumns: [season.id],
      name: 'Episode_seasonId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const row = pgTable('Row', {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text().notNull(),
  query: text().notNull(),
  order: integer().notNull(),
  mediaType: text(),
  isActive: boolean().default(true).notNull(),
  createdAt: timestamp({ precision: 3, mode: 'date' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const myListItem = pgTable(
  'MyListItem',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    profileId: text().notNull(),
    contentId: text().notNull(),
    addedAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('MyListItem_profileId_contentId_key').using(
      'btree',
      table.profileId,
      table.contentId
    ),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'MyListItem_profileId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'MyListItem_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const watchHistory = pgTable(
  'WatchHistory',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    profileId: text().notNull(),
    contentId: text().notNull(),
    episodeId: text(),
    progress: doublePrecision().default(0).notNull(),
    watchedAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('WatchHistory_profileId_contentId_key').using(
      'btree',
      table.profileId,
      table.contentId
    ),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'WatchHistory_profileId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'WatchHistory_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const review = pgTable(
  'Review',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    profileId: text().notNull(),
    contentId: text().notNull(),
    userId: text().notNull(),
    rating: integer().notNull(),
    comment: text(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('Review_profileId_contentId_key').using('btree', table.profileId, table.contentId),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'Review_profileId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'Review_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'Review_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const notification = pgTable(
  'Notification',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text().notNull(),
    type: notificationType().default('GENERAL').notNull(),
    title: text().notNull(),
    message: text().notNull(),
    read: boolean().default(false).notNull(),
    link: text(),
    imageUrl: text(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'Notification_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const adminLog = pgTable(
  'AdminLog',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    adminId: text().notNull(),
    action: text().notNull(),
    resource: text().notNull(),
    resourceId: text(),
    details: jsonb(),
    ipAddress: text(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.adminId],
      foreignColumns: [user.id],
      name: 'AdminLog_adminId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
  ]
)

export const asset = pgTable(
  'Asset',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    contentId: text(),
    episodeId: text(),
    status: assetStatus().default('UPLOADED').notNull(),
    sourceKey: text().notNull(),
    manifestUrl: text(),
    hlsUrl: text(),
    dashUrl: text(),
    drmKeyId: text(),
    error: text(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('Asset_contentId_idx').using('btree', table.contentId),
    index('Asset_status_idx').using('btree', table.status),
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'Asset_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const caption = pgTable(
  'Caption',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    contentId: text(),
    episodeId: text(),
    language: text().notNull(),
    url: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index('Caption_contentId_idx').using('btree', table.contentId),
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'Caption_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const licenseWindow = pgTable(
  'LicenseWindow',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    contentId: text().notNull(),
    territories: text().array().notNull().default([]),
    startsAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
    endsAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index('LicenseWindow_contentId_endsAt_idx').using('btree', table.contentId, table.endsAt),
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'LicenseWindow_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const qoeEvent = pgTable(
  'QoEEvent',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text(),
    contentId: text().notNull(),
    eventType: text().notNull(),
    metadata: jsonb(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index('QoEEvent_contentId_createdAt_idx').using('btree', table.contentId, table.createdAt),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'QoEEvent_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
)

export const liveChannel = pgTable(
  'LiveChannel',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text().notNull(),
    slug: text().notNull(),
    description: text(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('LiveChannel_slug_key').using('btree', table.slug)]
)

export const eventEntitlement = pgTable(
  'EventEntitlement',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text().notNull(),
    userId: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('EventEntitlement_eventId_userId_key').using('btree', table.eventId, table.userId),
    foreignKey({
      columns: [table.eventId],
      foreignColumns: [liveEvent.id],
      name: 'EventEntitlement_eventId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'EventEntitlement_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const stripeWebhookEvent = pgTable(
  'StripeWebhookEvent',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    stripeEventId: text().notNull(),
    processedAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('StripeWebhookEvent_stripeEventId_key').using('btree', table.stripeEventId),
  ]
)

export const trickPlaySprite = pgTable(
  'TrickPlaySprite',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    contentId: text().notNull(),
    url: text().notNull(),
    intervalSec: integer().default(10).notNull(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'TrickPlaySprite_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const dmcaTakedown = pgTable('DmcaTakedown', {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  reporterEmail: text().notNull(),
  contentId: text(),
  details: text().notNull(),
  status: dmcaStatus().default('OPEN').notNull(),
  createdAt: timestamp({ precision: 3, mode: 'date' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  resolvedAt: timestamp({ precision: 3, mode: 'date' }),
})

export const playbackSession = pgTable(
  'PlaybackSession',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text().notNull(),
    profileId: text(),
    deviceId: text().notNull(),
    qualityCap: text(),
    lastHeartbeat: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    expiresAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
  },
  (table) => [
    index('PlaybackSession_userId_expiresAt_idx').using('btree', table.userId, table.expiresAt),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'PlaybackSession_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const outboxEvent = pgTable(
  'OutboxEvent',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    aggregateType: text().notNull(),
    aggregateId: text().notNull(),
    eventType: text().notNull(),
    payload: jsonb().notNull(),
    processedAt: timestamp({ precision: 3, mode: 'date' }),
    contentId: text(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index('OutboxEvent_processedAt_createdAt_idx').using(
      'btree',
      table.processedAt,
      table.createdAt
    ),
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'OutboxEvent_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
)

export const downloadLicense = pgTable(
  'DownloadLicense',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text().notNull(),
    contentId: text().notNull(),
    licenseUrl: text().notNull(),
    expiresAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index('DownloadLicense_userId_expiresAt_idx').using('btree', table.userId, table.expiresAt),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'DownloadLicense_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const dataSubjectRequest = pgTable(
  'DataSubjectRequest',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text().notNull(),
    type: dsarType().notNull(),
    status: dsarStatus().default('PENDING').notNull(),
    completedAt: timestamp({ precision: 3, mode: 'date' }),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index('DataSubjectRequest_userId_status_idx').using('btree', table.userId, table.status),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'DataSubjectRequest_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const account = pgTable(
  'Account',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text().notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text(),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (table) => [
    uniqueIndex('Account_provider_providerAccountId_key').using(
      'btree',
      table.provider,
      table.providerAccountId
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'Account_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const liveEvent = pgTable(
  'LiveEvent',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    channelId: text().notNull(),
    title: text().notNull(),
    description: text(),
    status: liveEventStatus().default('SCHEDULED').notNull(),
    scheduledStart: timestamp({ precision: 3, mode: 'date' }).notNull(),
    scheduledEnd: timestamp({ precision: 3, mode: 'date' }),
    ingestUrl: text(),
    playbackUrl: text(),
    dvrWindowSec: integer().default(7200).notNull(),
    slatePreUrl: text(),
    slatePostUrl: text(),
    geoRestricted: text().array().notNull().default([]),
    blackoutRegions: text().array().notNull().default([]),
    archivedContentId: text(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('LiveEvent_channelId_scheduledStart_idx').using(
      'btree',
      table.channelId,
      table.scheduledStart
    ),
    index('LiveEvent_status_idx').using('btree', table.status),
    foreignKey({
      columns: [table.channelId],
      foreignColumns: [liveChannel.id],
      name: 'LiveEvent_channelId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const purchase = pgTable(
  'Purchase',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text().notNull(),
    contentId: text(),
    eventId: text(),
    type: purchaseType().notNull(),
    amountCents: integer().notNull(),
    stripePaymentIntentId: text(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('Purchase_stripePaymentIntentId_key').using('btree', table.stripePaymentIntentId),
    index('Purchase_userId_idx').using('btree', table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'Purchase_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'Purchase_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
    foreignKey({
      columns: [table.eventId],
      foreignColumns: [liveEvent.id],
      name: 'Purchase_eventId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
)

export const consentRecord = pgTable(
  'ConsentRecord',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text().notNull(),
    consentType: text().notNull(),
    granted: boolean().notNull(),
    ipAddress: text(),
    createdAt: timestamp({ precision: 3, mode: 'date' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index('ConsentRecord_userId_consentType_idx').using('btree', table.userId, table.consentType),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'ConsentRecord_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const contentGenre = pgTable(
  'ContentGenre',
  {
    contentId: text().notNull(),
    genreId: integer().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'ContentGenre_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.genreId],
      foreignColumns: [genre.id],
      name: 'ContentGenre_genreId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('restrict'),
    primaryKey({ columns: [table.contentId, table.genreId], name: 'ContentGenre_pkey' }),
  ]
)

export const contentCategory = pgTable(
  'ContentCategory',
  {
    contentId: text().notNull(),
    categoryId: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'ContentCategory_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [category.id],
      name: 'ContentCategory_categoryId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({ columns: [table.contentId, table.categoryId], name: 'ContentCategory_pkey' }),
  ]
)

export const contentRow = pgTable(
  'ContentRow',
  {
    contentId: text().notNull(),
    rowId: text().notNull(),
    order: integer().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.contentId],
      foreignColumns: [content.id],
      name: 'ContentRow_contentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.rowId],
      foreignColumns: [row.id],
      name: 'ContentRow_rowId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({ columns: [table.contentId, table.rowId], name: 'ContentRow_pkey' }),
  ]
)
