import type { ListEventsQuery } from "@dorham/shared";
import type { Prisma } from "@prisma/client";

type ListViewer = { id: string; role: string };

/**
 * Public event list filter.
 * Past community nights with no GOING RSVP stay out of the archive.
 * Only that host, or staff, may list those empty past nights.
 */
export function eventListWhere(
  query: ListEventsQuery,
  now: Date,
  viewer?: ListViewer,
): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = { city: query.city };
  const and: Prisma.EventWhereInput[] = [];

  if (query.when === "past") {
    and.push({
      OR: [{ status: "ENDED" }, { status: "PUBLISHED", startsAt: { lt: now } }],
    });
    const seesEmpty =
      Boolean(query.hostId) &&
      Boolean(viewer) &&
      (viewer?.id === query.hostId || viewer?.role === "ADMIN" || viewer?.role === "MODERATOR");
    if (!seesEmpty) {
      and.push({
        OR: [{ kind: "CITY_SHOW" }, { rsvps: { some: { status: "GOING" } } }],
      });
    }
  } else {
    where.status = "PUBLISHED";
    where.startsAt = { gte: now };
  }

  if (query.hostId) where.hostId = query.hostId;
  if (query.venueSlug) where.venueSlug = query.venueSlug;
  if (query.kind) where.kind = query.kind;
  if (query.cursor) where.id = { lt: query.cursor };
  if (and.length > 0) where.AND = and;
  return where;
}
