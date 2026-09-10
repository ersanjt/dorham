import { z } from "zod";
import { CITIES } from "./cities.js";

export const VENUE_KINDS = ["RESTAURANT", "CAFE", "MARKET", "CULTURAL"] as const;
export const venueKindSchema = z.enum(VENUE_KINDS);
export type VenueKind = (typeof VENUE_KINDS)[number];

export const venueSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  kind: venueKindSchema,
  city: z.enum(CITIES),
  area: z.string(),
  address: z.string(),
  mapsUrl: z.string(),
  /** OpenStreetMap static preview from real lat/lng — not a stock photo of the venue. */
  mapImageUrl: z.string().nullable(),
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
