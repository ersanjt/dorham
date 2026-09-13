import { z } from "zod";

export const mediaKindSchema = z.enum(["PROFILE", "VERIFICATION", "VENUE_PHOTO"]);

export const uploadMediaQuerySchema = z.object({
  kind: mediaKindSchema.default("PROFILE"),
});

export type UploadMediaQuery = z.infer<typeof uploadMediaQuerySchema>;

export const mediaDtoSchema = z.object({
  id: z.string(),
  kind: mediaKindSchema,
  mime: z.string(),
  bytes: z.number().int().nonnegative(),
  url: z.string(),
});

export type MediaDto = z.infer<typeof mediaDtoSchema>;

export const attachMediaBodySchema = z.object({
  mediaId: z.string().min(8).max(64),
});

export type AttachMediaBody = z.infer<typeof attachMediaBodySchema>;
