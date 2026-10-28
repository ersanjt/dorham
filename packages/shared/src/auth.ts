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
  /** Server-side gate. The checkbox on the form is not enough by itself. */
  adult: z.literal(true),
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

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;

export const resetPasswordBodySchema = z.object({
  token: z.string().min(20).max(2000),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128)
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
      message: "Password must include a letter and a number",
    }),
});

export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;

export const oauthProviderSchema = z.enum(["google", "apple", "facebook"]);

export const oauthStartBodySchema = z.object({
  provider: oauthProviderSchema,
  redirectUri: z.string().trim().url().max(300),
  locale: z.enum(["FA", "EN", "TR"]).default("FA"),
  adult: z.boolean().optional(),
});

export type OAuthStartBody = z.infer<typeof oauthStartBodySchema>;

export const oauthBodySchema = z.union([
  z.object({
    code: z.string().trim().min(8).max(2048),
    state: z.string().trim().min(20).max(4000),
    redirectUri: z.string().trim().url().max(300),
    displayName: z.string().trim().min(2).max(40).optional(),
  }),
  z
    .object({
      provider: oauthProviderSchema,
      idToken: z.string().trim().min(20).max(8000).optional(),
      accessToken: z.string().trim().min(20).max(4000).optional(),
      nonce: z.string().trim().max(200).optional(),
      displayName: z.string().trim().min(2).max(40).optional(),
      locale: z.enum(["FA", "EN", "TR"]).default("FA"),
      adult: z.boolean().optional(),
    })
    .refine((value) => Boolean(value.idToken || value.accessToken), {
      message: "idToken or accessToken is required",
    }),
]);

export type OAuthBody = z.infer<typeof oauthBodySchema>;
