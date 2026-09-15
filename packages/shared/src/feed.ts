import { z } from "zod";
import { CITIES } from "./cities.js";
import { reportReasonSchema } from "./trust.js";

export const createPostBodySchema = z.object({
  body: z.string().trim().min(20).max(2000),
  city: z.enum(CITIES).default("istanbul"),
  eventId: z.string().min(8).max(64).optional(),
  venueSlug: z.string().trim().min(2).max(80).optional(),
});

export type CreatePostBody = z.infer<typeof createPostBodySchema>;

export const createCommentBodySchema = z.object({
  body: z.string().trim().min(1).max(500),
});

export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;

export const listFeedQuerySchema = z.object({
  city: z.enum(CITIES).default("istanbul"),
  limit: z.coerce.number().int().min(1).max(30).default(20),
  cursor: z.string().optional(),
});

export type ListFeedQuery = z.infer<typeof listFeedQuerySchema>;

export const feedAuthorSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  photoUrl: z.string().nullable(),
  verificationStatus: z.enum(["NONE", "PENDING", "VERIFIED", "REJECTED"]),
});

export const feedPostSchema = z.object({
  id: z.string(),
  body: z.string(),
  city: z.enum(CITIES),
  eventId: z.string().nullable(),
  venueSlug: z.string().nullable(),
  commentCount: z.number().int().nonnegative(),
  author: feedAuthorSchema,
  createdAt: z.string().datetime(),
});

export type FeedPost = z.infer<typeof feedPostSchema>;

export const feedCommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  author: feedAuthorSchema,
  createdAt: z.string().datetime(),
});

export type FeedComment = z.infer<typeof feedCommentSchema>;

export const feedReportBodySchema = z.object({
  reason: reportReasonSchema,
  details: z.string().trim().max(1000).optional(),
});

export type FeedReportBody = z.infer<typeof feedReportBodySchema>;
