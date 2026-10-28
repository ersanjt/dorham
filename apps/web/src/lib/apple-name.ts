/** Apple sends the person name once, as JSON on the form POST. */
export function applePersonName(raw: unknown) {
  if (typeof raw !== "string" || raw.length > 2000) return null;
  try {
    const parsed = JSON.parse(raw) as { name?: { firstName?: unknown; lastName?: unknown } };
    const parts = [parsed.name?.firstName, parsed.name?.lastName].filter((part): part is string => typeof part === "string");
    const name = parts.join(" ").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
    return name.length >= 2 ? name : null;
  } catch {
    return null;
  }
}
