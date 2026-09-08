import { z } from "zod";

export const registerBodySchema = z.object({
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128)
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
      message: "Password must include a letter and a number",
    }),
  displayName: z.string().trim().min(2).max(40),
  locale: z.enum(["FA", "EN", "TR"]).default("FA"),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(20).max(2000),
});

export type RefreshBody = z.infer<typeof refreshBodySchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
  tokenType: z.literal("Bearer"),
  verifyEmailToken: z.string().optional(),
});

export type AuthTokens = z.infer<typeof authTokensSchema>;

export const verifyEmailBodySchema = z.object({
  token: z.string().min(20).max(2000),
});

export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
