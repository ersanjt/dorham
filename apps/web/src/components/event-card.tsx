import Link from "next/link";
import { t } from "../lib/copy";
import { capacityWidth, formatDayChip } from "../lib/format";
import type { UiLocale } from "../lib/locale";

export type EventCardData = {
  id: string;
  title: string;
  description?: string;
  venue: string | null;
  startsAt: string;
  goingCount: number;
  capacity?: number | null;
  waitlistCount?: number;
  hostName?: string;
  priceTry?: number;
  kind?: "COMMUNITY" | "CITY_SHOW";
};

export function EventCard({
  event,
  href,
  cta,
  locale = "fa",
}: {
  event: EventCardData;
  href?: string;
  cta?: string;
  locale?: UiLocale;
}) {
  const copy = t(locale);
  const digits = locale === "en" ? "en-GB" : "fa-IR";
  const filled = capacityWidth(event.goingCount, event.capacity);
  const link = href ?? `/events/${event.id}`;
  const cityShow = event.kind === "CITY_SHOW";
  const action = cta ?? (cityShow ? copy.eventCard.interested : copy.eventCard.details);

  const status = cityShow
    ? event.goingCount === 0
      ? copy.eventCard.noMarks
      : copy.eventCard.coordinating(event.goingCount.toLocaleString(digits))
    : event.goingCount === 0
      ? event.capacity
        ? copy.eventCard.emptyCap(event.capacity.toLocaleString(digits))
        : copy.eventCard.empty
      : copy.eventCard.going(
          event.goingCount.toLocaleString(digits),
          event.capacity ? event.capacity.toLocaleString(digits) : undefined,
          event.waitlistCount ? event.waitlistCount.toLocaleString(digits) : undefined,
        );

  return (
    <article className={`event-card${cityShow ? " event-card-city" : ""}`}>
      <header className="event-card-head">
        <span className="event-kind">{cityShow ? copy.eventCard.cityCal : copy.eventCard.community}</span>
        <time className="event-when" dateTime={event.startsAt}>
          {formatDayChip(event.startsAt, locale)}
        </time>
      </header>

      <div className="event-card-body">
        <h3 className="event-title">
          <Link href={link}>{event.title}</Link>
        </h3>
        <p className="event-venue">{event.venue ?? copy.eventCard.istanbul}</p>
        {!cityShow && event.hostName ? (
          <p className="event-host">
            {copy.eventCard.host} · {event.hostName}
          </p>
        ) : null}
        {!cityShow && event.description ? <p className="event-desc muted">{event.description}</p> : null}
        {cityShow ? <p className="event-note muted">{copy.eventCard.cityNote}</p> : null}

        <div className="event-card-foot">
          <p className="event-status">{status}</p>
          {!cityShow && event.priceTry ? (
            <p className="event-price">{copy.eventCard.doorPrice(event.priceTry.toLocaleString(digits))}</p>
          ) : null}
          {!cityShow && filled != null && event.goingCount > 0 ? (
            <div className="capacity" aria-hidden>
              <i style={{ width: `${filled}%` }} />
            </div>
          ) : null}
          <Link className={cityShow ? "event-cta ghost" : "event-cta"} href={link}>
            {action}
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Compact rows for city-show calendar — less noise than a grid of identical cards. */
export function CityCalendarList({ events, locale = "fa" }: { events: EventCardData[]; locale?: UiLocale }) {
  const copy = t(locale);
  const digits = locale === "en" ? "en-GB" : "fa-IR";
  if (events.length === 0) return null;
  return (
    <ul className="city-calendar">
      {events.map((event) => (
        <li key={event.id}>
          <Link className="city-calendar-row" href={`/events/${event.id}`}>
            <time dateTime={event.startsAt}>{formatDayChip(event.startsAt, locale)}</time>
            <span className="city-calendar-main">
              <strong>{event.title}</strong>
              <span className="muted">{event.venue ?? copy.eventCard.istanbul}</span>
            </span>
            <span className="city-calendar-meta">
              {event.goingCount > 0
                ? copy.eventCard.fans(event.goingCount.toLocaleString(digits))
                : copy.eventCard.hang}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
