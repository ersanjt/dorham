import { z } from "zod";
import { CITIES } from "./cities.js";

export const publicUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  bio: z.string().nullable(),
  city: z.enum(CITIES),
  locale: z.enum(["FA", "EN", "TR"]),
  verificationStatus: z.enum(["NONE", "PENDING", "VERIFIED", "REJECTED"]),
  datingEnabled: z.boolean(),
  photoUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
  stats: z
    .object({
      venuesVisited: z.number().int().nonnegative(),
      eventsAttended: z.number().int().nonnegative(),
      eventsHosted: z.number().int().nonnegative(),
    })
    .optional(),
  venuesVisited: z
    .array(
      z.object({
        venueId: z.string(),
        venueSlug: z.string(),
        venueName: z.string(),
        venueArea: z.string(),
        visitCount: z.number().int().positive(),
        lastVisitedAt: z.string().datetime(),
      }),
    )
    .optional(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const meSchema = publicUserSchema.extend({
  email: z.string().email(),
  role: z.enum(["MEMBER", "HOST", "MODERATOR", "ADMIN"]),
  status: z.enum(["ACTIVE", "PAUSED", "SUSPENDED", "DELETED"]),
  emailVerified: z.boolean(),
});

export type Me = z.infer<typeof meSchema>;

export const patchMeBodySchema = z
  .object({
    displayName: z.string().trim().min(2).max(40).optional(),
    bio: z.string().trim().max(280).nullable().optional(),
    city: z.enum(CITIES).optional(),
    locale: z.enum(["FA", "EN", "TR"]).optional(),
    datingEnabled: z.literal(false).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Empty patch" });

export type PatchMeBody = z.infer<typeof patchMeBodySchema>;
