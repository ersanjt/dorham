import { z } from "zod";
import { CITIES } from "./cities.js";

export const VENUE_KINDS = ["RESTAURANT", "CAFE", "MARKET", "CULTURAL"] as const;
export const venueKindSchema = z.enum(VENUE_KINDS);
export type VenueKind = (typeof VENUE_KINDS)[number];

export const MODERATION_STATUSES = ["PENDING", "PUBLISHED", "REJECTED"] as const;
export const moderationStatusSchema = z.enum(MODERATION_STATUSES);
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const HANG_INTENTS = ["LUNCH", "DINNER", "COFFEE", "OTHER"] as const;
export const hangIntentSchema = z.enum(HANG_INTENTS);
export type HangIntent = (typeof HANG_INTENTS)[number];

export const venueSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  kind: venueKindSchema,
  city: z.enum(CITIES),
  area: z.string(),
  address: z.string(),
  mapsUrl: z.string(),
  /** Static map preview (Google Static if keyed, else OSM). */
  mapImageUrl: z.string().nullable(),
  /** Google Maps iframe embed for the exact pin. */
  mapsEmbedUrl: z.string().nullable(),
  /** Gallery: photos (img), street (iframe/img), map (iframe/img). */
  gallery: z.array(
    z.object({
      kind: z.enum(["photo", "street", "map"]),
      src: z.string(),
      label: z.string(),
    }),
  ),
  /** Convenience cover images for cards (img URLs only). */
  photos: z.array(z.string()),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  hours: z.string().nullable(),
  priceRange: z.string().nullable(),
  menuNotes: z.string().nullable(),
  reviewCount: z.number().int().nonnegative(),
  description: z.string(),
});

export type VenueDto = z.infer<typeof venueSchema>;

export const listVenuesQuerySchema = z.object({
  city: z.enum(CITIES).default("istanbul"),
  kind: venueKindSchema.optional(),
  area: z.string().trim().min(2).max(40).optional(),
  limit: z.coerce.number().int().min(1).max(80).default(80),
});

export type ListVenuesQuery = z.infer<typeof listVenuesQuerySchema>;

const googleMapsUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => /google\.[^/]+\/maps|maps\.google\.|maps\.app\.goo\.gl/i.test(value), {
    message: "Google Maps URL required",
  });

export const submitVenueBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  kind: venueKindSchema,
  area: z.string().trim().min(2).max(40),
  address: z.string().trim().min(8).max(200),
  mapsUrl: googleMapsUrl,
  description: z.string().trim().min(10).max(800),
  hours: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().url().max(200).optional(),
  priceRange: z.string().trim().max(40).optional(),
  menuNotes: z.string().trim().max(500).optional(),
});

export type SubmitVenueBody = z.infer<typeof submitVenueBodySchema>;

export const venueReviewSchema = z.object({
  id: z.string(),
  body: z.string(),
  status: moderationStatusSchema,
  createdAt: z.string().datetime(),
  author: z.object({
    id: z.string(),
    displayName: z.string(),
    verificationStatus: z.enum(["NONE", "PENDING", "VERIFIED", "REJECTED"]),
  }),
});

export type VenueReview = z.infer<typeof venueReviewSchema>;

export const createVenueReviewBodySchema = z.object({
  body: z.string().trim().min(10).max(800),
});

export type CreateVenueReviewBody = z.infer<typeof createVenueReviewBodySchema>;

export const submitVenuePhotoBodySchema = z.object({
  mediaId: z.string().min(8).max(64),
  caption: z.string().trim().max(120).optional(),
});

export type SubmitVenuePhotoBody = z.infer<typeof submitVenuePhotoBodySchema>;

export const venuePhotoSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  venueSlug: z.string(),
  venueName: z.string(),
  url: z.string(),
  caption: z.string().nullable(),
  status: moderationStatusSchema,
  createdAt: z.string().datetime(),
  uploader: z.object({
    id: z.string(),
    displayName: z.string(),
  }),
});

export type VenuePhotoDto = z.infer<typeof venuePhotoSchema>;

export const createVenueHangPlanBodySchema = z.object({
  startsAt: z.string().datetime(),
  intent: hangIntentSchema.default("OTHER"),
  note: z.string().trim().max(120).optional(),
});

export type CreateVenueHangPlanBody = z.infer<typeof createVenueHangPlanBodySchema>;

export const venueHangPlanSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  venueSlug: z.string(),
  venueName: z.string(),
  venueArea: z.string(),
  startsAt: z.string().datetime(),
  intent: hangIntentSchema,
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
  user: z.object({
    id: z.string(),
    displayName: z.string(),
    verificationStatus: z.enum(["NONE", "PENDING", "VERIFIED", "REJECTED"]),
  }),
});

export type VenueHangPlanDto = z.infer<typeof venueHangPlanSchema>;

export const moderateVenueContentBodySchema = z.object({
  status: z.enum(["PUBLISHED", "REJECTED"]),
});

export type ModerateVenueContentBody = z.infer<typeof moderateVenueContentBodySchema>;
