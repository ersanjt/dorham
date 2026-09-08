CREATE TYPE "TicketStatus" AS ENUM ('NONE', 'DUE', 'PAID_DOOR');

ALTER TABLE "Event" ADD COLUMN "priceTry" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "EventRsvp" ADD COLUMN "ticketStatus" "TicketStatus" NOT NULL DEFAULT 'NONE';

ALTER TABLE "Venue" ADD COLUMN "priceRange" TEXT;
ALTER TABLE "Venue" ADD COLUMN "menuNotes" TEXT;
ALTER TABLE "Venue" ADD COLUMN "submitterId" TEXT;

CREATE TABLE "VenueReview" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VenueReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VenueReview_venueId_authorId_key" ON "VenueReview"("venueId", "authorId");
CREATE INDEX "VenueReview_venueId_createdAt_idx" ON "VenueReview"("venueId", "createdAt");

ALTER TABLE "VenueReview" ADD CONSTRAINT "VenueReview_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VenueReview" ADD CONSTRAINT "VenueReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
