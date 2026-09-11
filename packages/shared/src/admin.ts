import { z } from "zod";

export const setUserRoleBodySchema = z.object({
  role: z.enum(["MEMBER", "HOST", "MODERATOR", "ADMIN"]),
});

export type SetUserRoleBody = z.infer<typeof setUserRoleBodySchema>;
