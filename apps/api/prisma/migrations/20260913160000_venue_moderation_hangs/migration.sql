-- MediaKind: venue community photos
ALTER TYPE "MediaKind" ADD VALUE IF NOT EXISTS 'VENUE_PHOTO';

DO $$ BEGIN
  CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HangIntent" AS ENUM ('LUNCH', 'DINNER', 'COFFEE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Existing reviews stay public; new ones default to PENDING
ALTER TABLE "VenueReview" ADD COLUMN IF NOT EXISTS "status" "ModerationStatus";
ALTER TABLE "VenueReview" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "VenueReview" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

UPDATE "VenueReview" SET "status" = 'PUBLISHED' WHERE "status" IS NULL;
ALTER TABLE "VenueReview" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "VenueReview" ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS "VenueReview_venueId_status_createdAt_idx" ON "VenueReview"("venueId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "VenueReview_status_createdAt_idx" ON "VenueReview"("status", "createdAt");

DO $$ BEGIN
  ALTER TABLE "VenueReview" ADD CONSTRAINT "VenueReview_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "VenuePhoto" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "uploaderId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "caption" TEXT,
  "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenuePhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VenuePhoto_venueId_status_createdAt_idx" ON "VenuePhoto"("venueId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "VenuePhoto_status_createdAt_idx" ON "VenuePhoto"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "VenuePhoto_uploaderId_createdAt_idx" ON "VenuePhoto"("uploaderId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "VenuePhoto" ADD CONSTRAINT "VenuePhoto_venueId_fkey"
    FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VenuePhoto" ADD CONSTRAINT "VenuePhoto_uploaderId_fkey"
    FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VenuePhoto" ADD CONSTRAINT "VenuePhoto_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "VenueHangPlan" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "intent" "HangIntent" NOT NULL DEFAULT 'OTHER',
  "note" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VenueHangPlan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VenueHangPlan_venueId_startsAt_idx" ON "VenueHangPlan"("venueId", "startsAt");
CREATE INDEX IF NOT EXISTS "VenueHangPlan_userId_startsAt_idx" ON "VenueHangPlan"("userId", "startsAt");

DO $$ BEGIN
  ALTER TABLE "VenueHangPlan" ADD CONSTRAINT "VenueHangPlan_venueId_fkey"
    FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VenueHangPlan" ADD CONSTRAINT "VenueHangPlan_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
