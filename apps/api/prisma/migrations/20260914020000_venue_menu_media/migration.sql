-- AlterEnum
ALTER TYPE "MediaKind" ADD VALUE 'VENUE_MENU';

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "menuMediaId" TEXT;
