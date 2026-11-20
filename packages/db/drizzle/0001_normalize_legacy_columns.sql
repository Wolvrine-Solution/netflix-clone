-- Converge databases created by Prisma `db push` with the Drizzle baseline. Idempotent: a no-op on fresh databases.
UPDATE "Content" SET "cast" = '{}' WHERE "cast" IS NULL;--> statement-breakpoint
ALTER TABLE "Content" ALTER COLUMN "cast" SET DEFAULT '{}'::text[], ALTER COLUMN "cast" SET NOT NULL;--> statement-breakpoint
UPDATE "LicenseWindow" SET "territories" = '{}' WHERE "territories" IS NULL;--> statement-breakpoint
ALTER TABLE "LicenseWindow" ALTER COLUMN "territories" SET DEFAULT '{}'::text[], ALTER COLUMN "territories" SET NOT NULL;--> statement-breakpoint
UPDATE "LiveEvent" SET "geoRestricted" = '{}' WHERE "geoRestricted" IS NULL;--> statement-breakpoint
ALTER TABLE "LiveEvent" ALTER COLUMN "geoRestricted" SET DEFAULT '{}'::text[], ALTER COLUMN "geoRestricted" SET NOT NULL;--> statement-breakpoint
UPDATE "LiveEvent" SET "blackoutRegions" = '{}' WHERE "blackoutRegions" IS NULL;--> statement-breakpoint
ALTER TABLE "LiveEvent" ALTER COLUMN "blackoutRegions" SET DEFAULT '{}'::text[], ALTER COLUMN "blackoutRegions" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Content" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Row" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "WatchHistory" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Review" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Asset" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "LiveChannel" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "LiveEvent" ALTER COLUMN "updatedAt" SET DEFAULT now();
