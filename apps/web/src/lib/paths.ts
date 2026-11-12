/** Same-origin path only. `fallback` is used when the query is missing or unsafe. */
export function safeNext(raw: string | null | undefined, fallback = "/account") {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("://")) {
    return fallback;
  }
  return raw;
}

const AUTH_EXACT = new Set(["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]);

/** Login/register link that keeps the page the person was trying to open. */
export function authHref(target: "/login" | "/register", pathname: string, search = "") {
  const path = pathname.startsWith("/") ? pathname : "/";
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const onAuth = AUTH_EXACT.has(path) || path.startsWith("/auth/");
  const next = onAuth ? params.get("next") : params.toString() ? `${path}?${params.toString()}` : path;
  if (!next || next === "/" || next === target || next.startsWith("/login") || next.startsWith("/register") || next.startsWith("/auth/")) {
    return target;
  }
  const safe = safeNext(next, "");
  if (!safe || safe === target) return target;
  return `${target}?next=${encodeURIComponent(safe)}`;
}
