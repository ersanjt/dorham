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
  const action = cta ?? (cityShow ? "هماهنگی با دوستان" : "جزئیات و ثبت حضور");

  return (
    <article className={`card event-card${cityShow ? " event-card-city" : ""}`}>
      <div className="card-top">
        <span className="date-chip">{formatDayChip(event.startsAt)}</span>
        <span className="muted">
          {cityShow ? "تقویم شهر · " : ""}
          {event.venue ?? "استانبول"}
        </span>
      </div>
      <h3>{event.title}</h3>
      {cityShow ? (
        <p className="muted">هماهنگی دوستان — نه فروش بلیط</p>
      ) : event.description ? (
        <p className="muted">{event.description}</p>
      ) : null}
      <p className="meta">
        {cityShow
          ? `${event.goingCount.toLocaleString("fa-IR")} نفر علاقه‌مند به هماهنگی`
          : `${event.hostName ? `میزبان: ${event.hostName} · ` : ""}${event.goingCount}${
              event.capacity ? ` از ${event.capacity}` : ""
            } نفر${event.waitlistCount ? ` · ${event.waitlistCount} در انتظار` : ""}${
              event.priceTry ? ` · ${event.priceTry.toLocaleString("fa-IR")} لیر` : ""
            }`}
      </p>
      {!cityShow && filled != null ? (
        <div className="capacity" aria-hidden>
          <i style={{ width: `${filled}%` }} />
        </div>
      ) : null}
      <Link className="card-cta" href={link}>
        {action}
      </Link>
    </article>
  );
}
