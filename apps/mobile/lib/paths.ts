export function safeNext(raw: string | string[] | null | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export function loginHref(next?: string) {
  const target = safeNext(next);
  return target === "/account" ? "/login" : `/login?next=${encodeURIComponent(target)}`;
}
