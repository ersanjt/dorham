import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  APP_URL: z.string().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:8081"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  API_PUBLIC_URL: z.string().default("http://localhost:4000"),
  MEDIA_DIR: z.string().default(".media"),
  /** Resend API key — required for production email verify / password reset. */
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("Dorham <noreply@dorham.app>"),
  /** Bind address. Production behind Cloudflare Tunnel should use 127.0.0.1. */
  API_HOST: z.string().default("0.0.0.0"),
  /** Optional Google Maps Static API key for venue map previews. */
  GOOGLE_MAPS_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
