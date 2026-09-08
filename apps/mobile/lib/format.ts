/** Persian copy, Gregorian calendar, Istanbul clock — never Jalali. */
const DATE_LOCALE = "fa-IR-u-ca-gregory";
const TIME_ZONE = "Europe/Istanbul";

export function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(DATE_LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: TIME_ZONE,
    });
  } catch {
    return iso;
  }
}

export function formatDayChip(iso: string) {
  try {
    const date = new Date(iso);
    const weekday = date.toLocaleDateString(DATE_LOCALE, { weekday: "short", timeZone: TIME_ZONE });
    const dayMonth = date.toLocaleDateString(DATE_LOCALE, {
      day: "numeric",
      month: "short",
      timeZone: TIME_ZONE,
    });
    const time = date.toLocaleTimeString(DATE_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: TIME_ZONE,
    });
    return `${weekday} ${dayMonth} · ${time}`;
  } catch {
    return iso;
  }
}

export function formatPriceTry(amount: number) {
  if (!amount) return "رایگان";
  return `${amount.toLocaleString("fa-IR")} لیر · دم در`;
}

export function capacityWidth(going: number, capacity: number | null | undefined) {
  if (!capacity || capacity <= 0) return null;
  return Math.min(100, Math.round((going / capacity) * 100));
}

export const venueKindFa: Record<string, string> = {
  RESTAURANT: "رستوران",
  CAFE: "کافه",
  MARKET: "مارکت",
  CULTURAL: "فرهنگی",
};

export const verifyFa: Record<string, string> = {
  NONE: "تأیید نشده",
  PENDING: "در صف تأیید",
  VERIFIED: "تأییدشده",
  REJECTED: "رد شده",
};

export function eventPageUrl(id: string) {
  const origin = process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:3000";
  return `${origin}/events/${id}`;
}

export function eventInviteText(event: {
  id: string;
  title: string;
  startsAt: string;
  venue: string | null;
  priceTry: number;
}) {
  const price = event.priceTry ? `${event.priceTry.toLocaleString("fa-IR")} لیر نقد دم در` : "ورود رایگان";
  return [
    event.title,
    `${formatDayChip(event.startsAt)}${event.venue ? ` · ${event.venue}` : ""}`,
    price,
    "",
    "لیست مهمان واقعی. سوایپ نیست.",
    eventPageUrl(event.id),
  ].join("\n");
}
