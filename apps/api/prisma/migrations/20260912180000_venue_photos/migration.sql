-- AlterTable Venue photos + ownership + door secret
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "photos" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "checkInSecret" TEXT;

DO $$ BEGIN
  CREATE TYPE "VenueVisitStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "VenueVisit" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "VenueVisitStatus" NOT NULL DEFAULT 'PENDING',
  "visitCount" INTEGER NOT NULL DEFAULT 1,
  "verifiedById" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "lastVisitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VenueVisit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VenueVisit_venueId_userId_key" ON "VenueVisit"("venueId", "userId");
CREATE INDEX IF NOT EXISTS "VenueVisit_userId_status_lastVisitedAt_idx" ON "VenueVisit"("userId", "status", "lastVisitedAt");
CREATE INDEX IF NOT EXISTS "VenueVisit_venueId_status_idx" ON "VenueVisit"("venueId", "status");
CREATE INDEX IF NOT EXISTS "Venue_ownerId_idx" ON "Venue"("ownerId");

DO $$ BEGIN
  ALTER TABLE "Venue" ADD CONSTRAINT "Venue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VenueVisit" ADD CONSTRAINT "VenueVisit_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VenueVisit" ADD CONSTRAINT "VenueVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VenueVisit" ADD CONSTRAINT "VenueVisit_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
