import { t } from "./copy";
import type { UiLocale } from "./locale";
import { dateTag } from "./locale";

/** Gregorian calendar, Istanbul clock — never Jalali. Persian or English digits by UI locale. */
const TIME_ZONE = "Europe/Istanbul";

function numberTag(locale: UiLocale = "fa") {
  return locale === "en" ? "en-GB" : "fa-IR";
}

export function formatDayChip(iso: string, locale: UiLocale = "fa") {
  const date = new Date(iso);
  const tag = dateTag(locale);
  const weekday = date.toLocaleDateString(tag, { weekday: "short", timeZone: TIME_ZONE });
  const dayMonth = date.toLocaleDateString(tag, {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  });
  const time = date.toLocaleTimeString(tag, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TIME_ZONE,
  });
  return `${weekday} ${dayMonth} · ${time}`;
}

export function formatWhen(iso: string, locale: UiLocale = "fa") {
  return new Date(iso).toLocaleString(dateTag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TIME_ZONE,
  });
}

/** Member-since line: Gregorian month/year (never Jalali). */
export function formatMemberSince(iso: string, locale: UiLocale = "fa") {
  return new Date(iso).toLocaleDateString(dateTag(locale), {
    year: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  });
}

export function capacityWidth(going: number, capacity: number | null | undefined) {
  if (!capacity || capacity <= 0) return null;
  return Math.min(100, Math.round((going / capacity) * 100));
}

export function formatPriceTry(amount: number, locale: UiLocale = "fa") {
  if (!amount) return locale === "en" ? "Free" : "رایگان";
  const n = amount.toLocaleString(numberTag(locale));
  return locale === "en" ? `${n} TRY · at the door` : `${n} لیر · دم در`;
}

export const verifyFa: Record<string, string> = {
  NONE: "تأیید نشده",
  PENDING: "در صف تأیید",
  VERIFIED: "تأیید دست‌نویس",
  REJECTED: "رد شده",
};

export function formatCount(n: number, locale: UiLocale = "fa") {
  return n.toLocaleString(numberTag(locale));
}

export function eventStatusLabel(status: string, locale: UiLocale = "fa") {
  const labels = t(locale).event;
  const map: Record<string, string> = {
    DRAFT: labels.draft,
    PUBLISHED: labels.published,
    CANCELLED: labels.cancelled,
    ENDED: labels.ended,
  };
  return map[status] ?? status;
}

export const eventStatusFa: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشرشده",
  CANCELLED: "لغو شد",
  ENDED: "تمام شد",
};

export function eventPageUrl(id: string) {
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "https://dorham.app").replace(/\/$/, "");
  return `${origin}/events/${id}`;
}

export function eventJsonLd(event: {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  venue: string | null;
  address?: string | null;
  priceTry: number;
  kind: "COMMUNITY" | "CITY_SHOW";
  status: string;
}) {
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "https://dorham.app").replace(/\/$/, "");
  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description.replace(/\s+/g, " ").trim().slice(0, 300),
    startDate: event.startsAt,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus:
      event.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.venue ?? "Istanbul",
      address: event.address ?? "Istanbul, Türkiye",
    },
    organizer: { "@type": "Organization", name: "Dorham", url: origin },
    url: eventPageUrl(event.id),
  };
  if (event.kind !== "CITY_SHOW") {
    payload.offers = {
      "@type": "Offer",
      price: event.priceTry,
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
    };
  }
  return payload;
}

/** JSON-LD must not be able to close the surrounding script tag. */
export function safeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function eventInviteText(
  event: {
    id: string;
    title: string;
    startsAt: string;
    venue: string | null;
    priceTry: number;
  },
  locale: UiLocale = "fa",
) {
  const share = t(locale).share;
  const price = event.priceTry ? share.cash(formatCount(event.priceTry, locale)) : share.free;
  return [
    event.title,
    `${formatDayChip(event.startsAt, locale)}${event.venue ? ` · ${event.venue}` : ""}`,
    price,
    "",
    share.closer,
    eventPageUrl(event.id),
  ].join("\n");
}
