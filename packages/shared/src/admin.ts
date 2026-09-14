import { z } from "zod";

export const userRoleSchema = z.enum(["MEMBER", "HOST", "MODERATOR", "ADMIN"]);

export const setUserRoleBodySchema = z.object({
  role: userRoleSchema,
});

export type SetUserRoleBody = z.infer<typeof setUserRoleBodySchema>;

export const listAdminUsersQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  role: userRoleSchema.optional(),
  cursor: z.string().min(8).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(40),
});

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;

export const adminUserRowSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  city: z.string(),
  role: userRoleSchema,
  status: z.enum(["ACTIVE", "PAUSED", "SUSPENDED", "DELETED"]),
  emailVerified: z.boolean(),
  verificationStatus: z.enum(["NONE", "PENDING", "VERIFIED", "REJECTED"]),
  photoUrl: z.string().nullable(),
  lastLoginAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type AdminUserRow = z.infer<typeof adminUserRowSchema>;

export const adminUsersListSchema = z.object({
  items: z.array(adminUserRowSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int().nonnegative(),
});

export type AdminUsersList = z.infer<typeof adminUsersListSchema>;
