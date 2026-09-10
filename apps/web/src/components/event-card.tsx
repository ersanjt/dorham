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
};

export function EventCard({
  event,
  href,
  cta = "جزئیات و ثبت حضور",
}: {
  event: EventCardData;
  href?: string;
  cta?: string;
}) {
  const filled = capacityWidth(event.goingCount, event.capacity);
  const link = href ?? `/events/${event.id}`;

  return (
    <article className="card event-card">
      <div className="card-top">
        <span className="date-chip">{formatDayChip(event.startsAt)}</span>
        <span className="muted">{event.venue ?? "استانبول"}</span>
      </div>
      <h3>{event.title}</h3>
      {event.description ? <p className="muted">{event.description}</p> : null}
      <p className="meta">
        {event.hostName ? `میزبان: ${event.hostName} · ` : ""}
        {event.goingCount}
        {event.capacity ? ` از ${event.capacity}` : ""} نفر
        {event.waitlistCount ? ` · ${event.waitlistCount} در انتظار` : ""}
        {event.priceTry ? ` · ${event.priceTry.toLocaleString("fa-IR")} لیر` : ""}
      </p>
      {filled != null ? (
        <div className="capacity" aria-hidden>
          <i style={{ width: `${filled}%` }} />
        </div>
      ) : null}
      <Link className="card-cta" href={link}>
        {cta}
      </Link>
    </article>
  );
}
