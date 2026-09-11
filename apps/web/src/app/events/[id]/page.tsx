import type { EventDto, EventGuest } from "@dorham/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "../../../components/page-intro";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { ShareEvent } from "../../../components/share-event";
import { capacityWidth, eventInviteText, eventPageUrl, eventStatusFa, formatDayChip, formatPriceTry } from "../../../lib/format";
import { resolveApiBase } from "../../../lib/api-base";
import { EventActions } from "./event-actions";

const API = resolveApiBase();

async function loadEvent(id: string): Promise<EventDto | null> {
  try {
    const res = await fetch(`${API}/v1/events/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: EventDto };
    return json.data;
  } catch {
    return null;
  }
}

async function loadGuests(id: string): Promise<EventGuest[]> {
  try {
    const res = await fetch(`${API}/v1/events/${id}/guests`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventGuest[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, guests] = await Promise.all([loadEvent(id), loadGuests(id)]);
  if (!event) notFound();
  const filled = capacityWidth(event.goingCount, event.capacity);

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={`${event.venue ?? "استانبول"} · ${formatDayChip(event.startsAt)}`} title={event.title}>
        <p className="muted">
          میزبان: <Link href={`/people/${event.host.id}`}>{event.host.displayName}</Link>
        </p>
      </PageIntro>
      {event.status !== "PUBLISHED" ? (
        <p>
          <span className="date-chip">{eventStatusFa[event.status] ?? event.status}</span>
        </p>
      ) : null}
      <p className="prose">{event.description}</p>
      {event.venueSlug ? (
        <p className="meta">
          مکان: <Link href={`/venues/${event.venueSlug}`}>{event.venue ?? "صفحهٔ مکان"}</Link>
          {event.address ? ` · ${event.address}` : ""}
        </p>
      ) : event.address ? (
        <p className="meta">{event.address}</p>
      ) : null}
      <article className="card">
        <p className="strong">{formatPriceTry(event.priceTry)}</p>
        <p className="muted">
          {event.priceTry
            ? "نقد دم در، وقتی وارد می‌شوی. درگاه آنلاین بعد از جمعه‌های واقعی وصل می‌شود."
            : "ورود رایگان است."}
        </p>
        <p className="strong">
          {event.goingCount}
          {event.capacity ? ` از ${event.capacity}` : ""} نفر می‌آیند
        </p>
        <p className="muted">
          {event.capacity && event.goingCount >= event.capacity
            ? "ظرفیت پر است. می‌توانی به لیست انتظار بروی."
            : "هنوز جا هست."}
          {event.waitlistCount ? ` · ${event.waitlistCount} در انتظار` : ""}
        </p>
        {filled != null ? (
          <div className="capacity" aria-hidden>
            <i style={{ width: `${filled}%` }} />
          </div>
        ) : null}
      </article>
      <div className="row">
        <ShareEvent title={event.title} text={eventInviteText(event)} url={eventPageUrl(event.id)} />
      </div>
      <EventActions eventId={event.id} hostId={event.host.id} priceTry={event.priceTry} initialGuests={guests} />
      <SiteFooter />
    </main>
  );
}
