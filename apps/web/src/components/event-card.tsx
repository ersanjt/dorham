import Link from "next/link";
import { capacityWidth, formatDayChip } from "../lib/format";

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
}: {
  event: EventCardData;
  href?: string;
  cta?: string;
}) {
  const filled = capacityWidth(event.goingCount, event.capacity);
  const link = href ?? `/events/${event.id}`;
  const cityShow = event.kind === "CITY_SHOW";
  const action = cta ?? (cityShow ? "علاقه‌مندم" : "جزئیات و ثبت حضور");

  const status = cityShow
    ? event.goingCount === 0
      ? "هنوز کسی علامت نزده"
      : `${event.goingCount.toLocaleString("fa-IR")} نفر برای هماهنگی`
    : event.goingCount === 0
      ? event.capacity
        ? `ظرفیت ${event.capacity.toLocaleString("fa-IR")} · هنوز خالی`
        : "هنوز خالی"
      : `${event.goingCount.toLocaleString("fa-IR")}${
          event.capacity ? ` از ${event.capacity.toLocaleString("fa-IR")}` : ""
        } نفر می‌آیند${
          event.waitlistCount ? ` · ${event.waitlistCount.toLocaleString("fa-IR")} انتظار` : ""
        }`;

  return (
    <article className={`event-card${cityShow ? " event-card-city" : ""}`}>
      <header className="event-card-head">
        <span className="event-kind">{cityShow ? "تقویم شهر" : "دورهمی"}</span>
        <time className="event-when" dateTime={event.startsAt}>
          {formatDayChip(event.startsAt)}
        </time>
      </header>

      <div className="event-card-body">
        <h3 className="event-title">
          <Link href={link}>{event.title}</Link>
        </h3>
        <p className="event-venue">{event.venue ?? "استانبول"}</p>
        {!cityShow && event.hostName ? <p className="event-host">میزبان · {event.hostName}</p> : null}
        {!cityShow && event.description ? (
          <p className="event-desc muted">{event.description}</p>
        ) : null}
        {cityShow ? <p className="event-note muted">هماهنگی دوستان — فروش بلیط اینجا نیست</p> : null}

        <div className="event-card-foot">
          <p className="event-status">{status}</p>
          {!cityShow && event.priceTry ? (
            <p className="event-price">{event.priceTry.toLocaleString("fa-IR")} لیر · دم در</p>
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
export function CityCalendarList({ events }: { events: EventCardData[] }) {
  if (events.length === 0) return null;
  return (
    <ul className="city-calendar">
      {events.map((event) => (
        <li key={event.id}>
          <Link className="city-calendar-row" href={`/events/${event.id}`}>
            <time dateTime={event.startsAt}>{formatDayChip(event.startsAt)}</time>
            <span className="city-calendar-main">
              <strong>{event.title}</strong>
              <span className="muted">{event.venue ?? "استانبول"}</span>
            </span>
            <span className="city-calendar-meta">
              {event.goingCount > 0
                ? `${event.goingCount.toLocaleString("fa-IR")} علاقه‌مند`
                : "هماهنگی"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
