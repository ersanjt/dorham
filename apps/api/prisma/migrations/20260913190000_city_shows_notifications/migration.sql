DO $$ BEGIN
  CREATE TYPE "EventKind" AS ENUM ('COMMUNITY', 'CITY_SHOW');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "kind" "EventKind" NOT NULL DEFAULT 'COMMUNITY';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "externalTicketUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "externalKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Event_externalKey_key" ON "Event"("externalKey");
CREATE INDEX IF NOT EXISTS "Event_kind_startsAt_idx" ON "Event"("kind", "startsAt");

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_createdAt_idx"
  ON "Notification"("userId", "readAt", "createdAt");

DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
