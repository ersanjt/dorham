-- AlterTable
ALTER TABLE "Event" ADD COLUMN "venueSlug" TEXT;

-- CreateIndex
CREATE INDEX "Event_venueSlug_idx" ON "Event"("venueSlug");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueSlug_fkey" FOREIGN KEY ("venueSlug") REFERENCES "Venue"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
