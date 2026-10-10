/** Same-origin path only. `fallback` is used when the query is missing or unsafe. */
export function safeNext(raw: string | null | undefined, fallback = "/account") {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("://")) {
    return fallback;
  }
  return raw;
}
