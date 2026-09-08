CREATE TYPE "VenueKind" AS ENUM ('RESTAURANT', 'CAFE', 'MARKET', 'CULTURAL');

CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "VenueKind" NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'istanbul',
    "area" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "mapsQuery" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "website" TEXT,
    "hours" TEXT,
    "description" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Venue_slug_key" ON "Venue"("slug");
CREATE INDEX "Venue_city_kind_idx" ON "Venue"("city", "kind");
CREATE INDEX "Venue_area_idx" ON "Venue"("area");
