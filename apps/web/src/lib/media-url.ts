/** Rewrite API media/map URLs so the browser can load them via same-origin /v1 rewrite. */
export function publicMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  try {
    const u = new URL(url);
    if (/localhost|127\.0\.0\.1|192\.168\.\d+\.\d+/i.test(u.hostname) && u.pathname.startsWith("/v1/")) {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    /* keep original */
  }
  return url;
}
