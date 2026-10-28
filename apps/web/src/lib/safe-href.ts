/** Only same-site paths and http(s) links are safe to put in href or src. */
export function safeHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !value.includes(":")) {
    return value;
  }
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function safeTel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const compact = raw.replace(/\s/g, "");
  const digits = compact.replace(/\D/g, "");
  if (!/^\+?[0-9().-]{6,22}$/.test(compact) || digits.length < 6 || digits.length > 16) return null;
  return `tel:${compact}`;
}
