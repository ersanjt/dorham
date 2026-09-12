import { z } from "zod";

export const venueVisitStatusSchema = z.enum(["PENDING", "VERIFIED", "REJECTED"]);

export const venueVisitSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  venueSlug: z.string(),
  venueName: z.string(),
  venueArea: z.string(),
  status: venueVisitStatusSchema,
  visitCount: z.number().int().positive(),
  lastVisitedAt: z.string().datetime(),
  verifiedAt: z.string().datetime().nullable(),
});

export type VenueVisitDto = z.infer<typeof venueVisitSchema>;

export const venueCheckInBodySchema = z
  .object({
    /** Guest being checked in by the venue owner/staff. */
    userId: z.string().min(8).max(64).optional(),
    /** Door secret from the venue QR page. */
    secret: z.string().min(8).max(200).optional(),
  })
  .refine((v) => Boolean(v.userId || v.secret), { message: "userId or secret is required" });

export type VenueCheckInBody = z.infer<typeof venueCheckInBodySchema>;

export const activityStatsSchema = z.object({
  venuesVisited: z.number().int().nonnegative(),
  eventsAttended: z.number().int().nonnegative(),
  eventsGoing: z.number().int().nonnegative(),
  eventsHosted: z.number().int().nonnegative(),
  pendingVenueVisits: z.number().int().nonnegative(),
});

export type ActivityStats = z.infer<typeof activityStatsSchema>;

export const userActivitySchema = z.object({
  stats: activityStatsSchema,
  venues: z.array(venueVisitSchema),
  eventsAttended: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      venue: z.string().nullable(),
      startsAt: z.string().datetime(),
      checkedInAt: z.string().datetime().nullable(),
    }),
  ),
});

export type UserActivity = z.infer<typeof userActivitySchema>;

export const venueDoorSchema = z.object({
  venueId: z.string(),
  slug: z.string(),
  name: z.string(),
  url: z.string(),
  verifiedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
});

export type VenueDoor = z.infer<typeof venueDoorSchema>;
