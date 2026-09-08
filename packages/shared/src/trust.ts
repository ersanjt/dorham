import { z } from "zod";

export const reportReasonSchema = z.enum(["spam", "harassment", "fake", "unsafe", "other"]);

export const reportBodySchema = z.object({
  targetId: z.string().min(8).max(64),
  reason: reportReasonSchema,
  details: z.string().trim().max(1000).optional(),
});

export type ReportBody = z.infer<typeof reportBodySchema>;

export const blockDtoSchema = z.object({
  id: z.string(),
  blockedId: z.string(),
  displayName: z.string(),
  createdAt: z.string().datetime(),
});

export type BlockDto = z.infer<typeof blockDtoSchema>;
