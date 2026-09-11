/**
 * Web API base URL.
 * - Browser: same-origin (empty) so Next.js rewrites `/v1/*` → Nest on loopback.
 * - Server (SSR): http://127.0.0.1:4000 (or API_INTERNAL_URL).
 * Optional NEXT_PUBLIC_API_URL overrides the browser (e.g. https://api.dorham.app for mobile-style split).
 */
export function resolveApiBase(): string {
  const pub = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return pub ?? "";
  }
  return (
    process.env.API_INTERNAL_URL?.trim().replace(/\/$/, "") ||
    pub ||
    "http://127.0.0.1:4000"
  );
}
