CREATE TYPE "public"."AssetStatus" AS ENUM('UPLOADED', 'TRANSCODING', 'PACKAGED', 'READY', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."ContentStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."DmcaStatus" AS ENUM('OPEN', 'RESOLVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."DsarStatus" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."DsarType" AS ENUM('EXPORT', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."LiveEventStatus" AS ENUM('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."MediaType" AS ENUM('movie', 'tv');--> statement-breakpoint
CREATE TYPE "public"."NotificationType" AS ENUM('NEW_CONTENT', 'SUBSCRIPTION', 'SYSTEM', 'GENERAL', 'PROMO', 'ACCOUNT');--> statement-breakpoint
CREATE TYPE "public"."Plan" AS ENUM('BASIC', 'STANDARD', 'PREMIUM');--> statement-breakpoint
CREATE TYPE "public"."PurchaseType" AS ENUM('PPV', 'TVOD');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."SubStatus" AS ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING');--> statement-breakpoint
CREATE TYPE "public"."VideoQuality" AS ENUM('AUTO', 'Q_4K', 'Q_1080P', 'Q_720P', 'Q_480P', 'Q_360P');--> statement-breakpoint
CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "AdminLog" (
	"id" text PRIMARY KEY NOT NULL,
	"adminId" text NOT NULL,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resourceId" text,
	"details" jsonb,
	"ipAddress" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Asset" (
	"id" text PRIMARY KEY NOT NULL,
	"contentId" text,
	"episodeId" text,
	"status" "AssetStatus" DEFAULT 'UPLOADED' NOT NULL,
	"sourceKey" text NOT NULL,
	"manifestUrl" text,
	"hlsUrl" text,
	"dashUrl" text,
	"drmKeyId" text,
	"error" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Caption" (
	"id" text PRIMARY KEY NOT NULL,
	"contentId" text,
	"episodeId" text,
	"language" text NOT NULL,
	"url" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"icon" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ConsentRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"consentType" text NOT NULL,
	"granted" boolean NOT NULL,
	"ipAddress" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Content" (
	"id" text PRIMARY KEY NOT NULL,
	"tmdbId" integer,
	"mediaType" "MediaType" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"posterPath" text NOT NULL,
	"backdropPath" text NOT NULL,
	"trailerKey" text,
	"videoUrl" text,
	"releaseDate" text NOT NULL,
	"rating" double precision NOT NULL,
	"runtime" integer,
	"seasons" integer,
	"episodes" integer,
	"maturityRating" text DEFAULT 'TV-MA' NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"status" "ContentStatus" DEFAULT 'PUBLISHED' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"country" text,
	"studio" text,
	"director" text,
	"tagline" text,
	"cast" text[] DEFAULT '{}' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ContentCategory" (
	"contentId" text NOT NULL,
	"categoryId" text NOT NULL,
	CONSTRAINT "ContentCategory_pkey" PRIMARY KEY("contentId","categoryId")
);
--> statement-breakpoint
CREATE TABLE "ContentGenre" (
	"contentId" text NOT NULL,
	"genreId" integer NOT NULL,
	CONSTRAINT "ContentGenre_pkey" PRIMARY KEY("contentId","genreId")
);
--> statement-breakpoint
CREATE TABLE "ContentRow" (
	"contentId" text NOT NULL,
	"rowId" text NOT NULL,
	"order" integer NOT NULL,
	CONSTRAINT "ContentRow_pkey" PRIMARY KEY("contentId","rowId")
);
--> statement-breakpoint
CREATE TABLE "DataSubjectRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "DsarType" NOT NULL,
	"status" "DsarStatus" DEFAULT 'PENDING' NOT NULL,
	"completedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DmcaTakedown" (
	"id" text PRIMARY KEY NOT NULL,
	"reporterEmail" text NOT NULL,
	"contentId" text,
	"details" text NOT NULL,
	"status" "DmcaStatus" DEFAULT 'OPEN' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"resolvedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "DownloadLicense" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"contentId" text NOT NULL,
	"licenseUrl" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Episode" (
	"id" text PRIMARY KEY NOT NULL,
	"seasonId" text NOT NULL,
	"episodeNumber" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"stillPath" text,
	"runtime" integer,
	"airDate" text,
	"videoUrl" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "EventEntitlement" (
	"id" text PRIMARY KEY NOT NULL,
	"eventId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Genre" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LicenseWindow" (
	"id" text PRIMARY KEY NOT NULL,
	"contentId" text NOT NULL,
	"territories" text[] DEFAULT '{}' NOT NULL,
	"startsAt" timestamp (3) NOT NULL,
	"endsAt" timestamp (3) NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LiveChannel" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LiveEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"channelId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "LiveEventStatus" DEFAULT 'SCHEDULED' NOT NULL,
	"scheduledStart" timestamp (3) NOT NULL,
	"scheduledEnd" timestamp (3),
	"ingestUrl" text,
	"playbackUrl" text,
	"dvrWindowSec" integer DEFAULT 7200 NOT NULL,
	"slatePreUrl" text,
	"slatePostUrl" text,
	"geoRestricted" text[] DEFAULT '{}' NOT NULL,
	"blackoutRegions" text[] DEFAULT '{}' NOT NULL,
	"archivedContentId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "MyListItem" (
	"id" text PRIMARY KEY NOT NULL,
	"profileId" text NOT NULL,
	"contentId" text NOT NULL,
	"addedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "NotificationType" DEFAULT 'GENERAL' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"link" text,
	"imageUrl" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OutboxEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"aggregateType" text NOT NULL,
	"aggregateId" text NOT NULL,
	"eventType" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processedAt" timestamp (3),
	"contentId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PlaybackSession" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"profileId" text,
	"deviceId" text NOT NULL,
	"qualityCap" text,
	"lastHeartbeat" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expiresAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Profile" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"avatarUrl" text NOT NULL,
	"isKid" boolean DEFAULT false NOT NULL,
	"pinHash" text,
	"language" text DEFAULT 'en' NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Purchase" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"contentId" text,
	"eventId" text,
	"type" "PurchaseType" NOT NULL,
	"amountCents" integer NOT NULL,
	"stripePaymentIntentId" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "QoEEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"contentId" text NOT NULL,
	"eventType" text NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RefreshToken" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"tokenHash" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"revokedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Review" (
	"id" text PRIMARY KEY NOT NULL,
	"profileId" text NOT NULL,
	"contentId" text NOT NULL,
	"userId" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Row" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"query" text NOT NULL,
	"order" integer NOT NULL,
	"mediaType" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Season" (
	"id" text PRIMARY KEY NOT NULL,
	"contentId" text NOT NULL,
	"seasonNumber" integer NOT NULL,
	"title" text,
	"description" text,
	"posterPath" text,
	"airDate" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionToken" text NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StripeWebhookEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"stripeEventId" text NOT NULL,
	"processedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"plan" "Plan" DEFAULT 'STANDARD' NOT NULL,
	"status" "SubStatus" DEFAULT 'ACTIVE' NOT NULL,
	"stripeCustomerId" text,
	"stripePriceId" text,
	"stripeSubId" text,
	"currentPeriodEnd" timestamp (3),
	"cancelAtPeriodEnd" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TrickPlaySprite" (
	"id" text PRIMARY KEY NOT NULL,
	"contentId" text NOT NULL,
	"url" text NOT NULL,
	"intervalSec" integer DEFAULT 10 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"emailVerified" timestamp (3),
	"name" text,
	"image" text,
	"hashedPassword" text,
	"role" "Role" DEFAULT 'USER' NOT NULL,
	"isSuspended" boolean DEFAULT false NOT NULL,
	"mfaEnabled" boolean DEFAULT false NOT NULL,
	"mfaSecret" text,
	"tosAcceptedAt" timestamp (3),
	"privacyAcceptedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "VerificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "VideoFile" (
	"id" text PRIMARY KEY NOT NULL,
	"contentId" text,
	"episodeId" text,
	"quality" "VideoQuality" DEFAULT 'AUTO' NOT NULL,
	"url" text NOT NULL,
	"size" bigint,
	"duration" integer,
	"format" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "WatchHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"profileId" text NOT NULL,
	"contentId" text NOT NULL,
	"episodeId" text,
	"progress" double precision DEFAULT 0 NOT NULL,
	"watchedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Caption" ADD CONSTRAINT "Caption_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentCategory" ADD CONSTRAINT "ContentCategory_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentCategory" ADD CONSTRAINT "ContentCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentGenre" ADD CONSTRAINT "ContentGenre_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentGenre" ADD CONSTRAINT "ContentGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "public"."Genre"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentRow" ADD CONSTRAINT "ContentRow_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ContentRow" ADD CONSTRAINT "ContentRow_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "public"."Row"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DownloadLicense" ADD CONSTRAINT "DownloadLicense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."Season"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EventEntitlement" ADD CONSTRAINT "EventEntitlement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."LiveEvent"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EventEntitlement" ADD CONSTRAINT "EventEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LicenseWindow" ADD CONSTRAINT "LicenseWindow_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LiveEvent" ADD CONSTRAINT "LiveEvent_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."LiveChannel"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MyListItem" ADD CONSTRAINT "MyListItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MyListItem" ADD CONSTRAINT "MyListItem_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PlaybackSession" ADD CONSTRAINT "PlaybackSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."LiveEvent"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "QoEEvent" ADD CONSTRAINT "QoEEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Review" ADD CONSTRAINT "Review_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Review" ADD CONSTRAINT "Review_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Season" ADD CONSTRAINT "Season_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TrickPlaySprite" ADD CONSTRAINT "TrickPlaySprite_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "VideoFile" ADD CONSTRAINT "VideoFile_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "VideoFile" ADD CONSTRAINT "VideoFile_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "public"."Episode"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "public"."Content"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE INDEX "Asset_contentId_idx" ON "Asset" USING btree ("contentId");--> statement-breakpoint
CREATE INDEX "Asset_status_idx" ON "Asset" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Caption_contentId_idx" ON "Caption" USING btree ("contentId");--> statement-breakpoint
CREATE UNIQUE INDEX "Category_name_key" ON "Category" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "Category_slug_key" ON "Category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ConsentRecord_userId_consentType_idx" ON "ConsentRecord" USING btree ("userId","consentType");--> statement-breakpoint
CREATE UNIQUE INDEX "Content_tmdbId_key" ON "Content" USING btree ("tmdbId");--> statement-breakpoint
CREATE INDEX "DataSubjectRequest_userId_status_idx" ON "DataSubjectRequest" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "DownloadLicense_userId_expiresAt_idx" ON "DownloadLicense" USING btree ("userId","expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "Episode_seasonId_episodeNumber_key" ON "Episode" USING btree ("seasonId","episodeNumber");--> statement-breakpoint
CREATE UNIQUE INDEX "EventEntitlement_eventId_userId_key" ON "EventEntitlement" USING btree ("eventId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre" USING btree ("name");--> statement-breakpoint
CREATE INDEX "LicenseWindow_contentId_endsAt_idx" ON "LicenseWindow" USING btree ("contentId","endsAt");--> statement-breakpoint
CREATE UNIQUE INDEX "LiveChannel_slug_key" ON "LiveChannel" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "LiveEvent_channelId_scheduledStart_idx" ON "LiveEvent" USING btree ("channelId","scheduledStart");--> statement-breakpoint
CREATE INDEX "LiveEvent_status_idx" ON "LiveEvent" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "MyListItem_profileId_contentId_key" ON "MyListItem" USING btree ("profileId","contentId");--> statement-breakpoint
CREATE INDEX "OutboxEvent_processedAt_createdAt_idx" ON "OutboxEvent" USING btree ("processedAt","createdAt");--> statement-breakpoint
CREATE INDEX "PlaybackSession_userId_expiresAt_idx" ON "PlaybackSession" USING btree ("userId","expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "Profile_userId_name_key" ON "Profile" USING btree ("userId","name");--> statement-breakpoint
CREATE UNIQUE INDEX "Purchase_stripePaymentIntentId_key" ON "Purchase" USING btree ("stripePaymentIntentId");--> statement-breakpoint
CREATE INDEX "Purchase_userId_idx" ON "Purchase" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "QoEEvent_contentId_createdAt_idx" ON "QoEEvent" USING btree ("contentId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Review_profileId_contentId_key" ON "Review" USING btree ("profileId","contentId");--> statement-breakpoint
CREATE UNIQUE INDEX "Season_contentId_seasonNumber_key" ON "Season" USING btree ("contentId","seasonNumber");--> statement-breakpoint
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session" USING btree ("sessionToken");--> statement-breakpoint
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent" USING btree ("stripeEventId");--> statement-breakpoint
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription" USING btree ("stripeCustomerId");--> statement-breakpoint
CREATE UNIQUE INDEX "Subscription_stripeSubId_key" ON "Subscription" USING btree ("stripeSubId");--> statement-breakpoint
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken" USING btree ("identifier","token");--> statement-breakpoint
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "WatchHistory_profileId_contentId_key" ON "WatchHistory" USING btree ("profileId","contentId");