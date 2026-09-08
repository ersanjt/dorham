import { z } from "zod";

export const verificationStatusSchema = z.enum(["NONE", "PENDING", "VERIFIED", "REJECTED"]);

export const myVerificationSchema = z.object({
  status: verificationStatusSchema,
  notes: z.string().nullable(),
  photoUrl: z.string().nullable(),
  reviewedAt: z.string().datetime().nullable(),
});

export type MyVerification = z.infer<typeof myVerificationSchema>;

export const listVerificationsQuerySchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED"]).default("PENDING"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListVerificationsQuery = z.infer<typeof listVerificationsQuerySchema>;

export const verificationQueueItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string(),
  status: verificationStatusSchema,
  photoUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type VerificationQueueItem = z.infer<typeof verificationQueueItemSchema>;

export const reviewVerificationBodySchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  notes: z.string().trim().max(500).optional(),
});

export type ReviewVerificationBody = z.infer<typeof reviewVerificationBodySchema>;
