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
  externalTicketUrl?: string | null;
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
  const cityShow = event.kind === "CITY_SHOW";

  return (
    <article className="card event-card">
      <div className="card-top">
        <span className="date-chip">{formatDayChip(event.startsAt)}</span>
        <span className="muted">
          {cityShow ? "کنسرت شهر · " : ""}
          {event.venue ?? "استانبول"}
        </span>
      </div>
      <h3>{event.title}</h3>
      {event.description ? <p className="muted">{event.description}</p> : null}
      <p className="meta">
        {cityShow
          ? `${event.goingCount.toLocaleString("fa-IR")} علاقه‌مند`
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
      <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}>
        <Link className="card-cta" href={link}>
          {cityShow ? "جزئیات" : cta}
        </Link>
        {cityShow && event.externalTicketUrl ? (
          <a className="btn ghost" href={event.externalTicketUrl} target="_blank" rel="noreferrer">
            بلیط / منبع
          </a>
        ) : null}
      </div>
    </article>
  );
}
