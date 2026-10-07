import type { EventDto, EventGuest } from "@dorham/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "../../../components/page-intro";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { ShareEvent } from "../../../components/share-event";
import { t } from "../../../lib/copy";
import {
  capacityWidth,
  eventInviteText,
  eventJsonLd,
  eventPageUrl,
  eventStatusLabel,
  formatCount,
  formatDayChip,
  formatPriceTry,
} from "../../../lib/format";
import { getLocale } from "../../../lib/locale-server";
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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await loadEvent(id);
  if (!event) return { title: "Dorham — دورهم" };
  const description = event.description.replace(/\s+/g, " ").trim().slice(0, 160);
  const url = eventPageUrl(event.id);
  return {
    title: `${event.title} — Dorham`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: event.title,
      description,
      url,
      type: "article",
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const copy = t(locale);
  const [event, guests] = await Promise.all([loadEvent(id), loadGuests(id)]);
  if (!event) notFound();
  const cityShow = event.kind === "CITY_SHOW";
  const filled = capacityWidth(event.goingCount, event.capacity);
  const goingN = formatCount(event.goingCount, locale);
  const capN = event.capacity ? formatCount(event.capacity, locale) : undefined;

  return (
    <main className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event)) }} />
      <SiteHeader />
      <PageIntro
        kicker={`${cityShow ? copy.eventCard.cityCal : event.venue ?? copy.eventCard.istanbul} · ${formatDayChip(event.startsAt, locale)}`}
        title={event.title}
      >
        {!cityShow ? (
          <p className="muted">
            {copy.event.host} <Link href={`/people/${event.host.id}`}>{event.host.displayName}</Link>
          </p>
        ) : (
          <p className="muted">{copy.event.cityNote}</p>
        )}
      </PageIntro>

      {cityShow ? <div className="banner">{copy.event.cityBanner}</div> : null}

      {event.status !== "PUBLISHED" ? (
        <p>
          <span className="date-chip">{eventStatusLabel(event.status, locale)}</span>
        </p>
      ) : null}
      <p className="prose">{event.description}</p>
      {event.venueSlug ? (
        <p className="meta">
          {copy.event.place} <Link href={`/venues/${event.venueSlug}`}>{event.venue ?? copy.event.placePage}</Link>
          {event.address ? ` · ${event.address}` : ""}
        </p>
      ) : event.venue || event.address ? (
        <p className="meta">{[event.venue, event.address].filter(Boolean).join(" · ")}</p>
      ) : null}

      {!cityShow ? (
        <article className="card">
          <p className="strong">{formatPriceTry(event.priceTry, locale)}</p>
          <p className="muted">{event.priceTry ? copy.event.cashNote : copy.event.freeNote}</p>
          <p className="strong">{copy.event.going(goingN, capN)}</p>
          <p className="muted">
            {event.capacity && event.goingCount >= event.capacity ? copy.event.full : copy.event.room}
            {event.waitlistCount ? copy.event.waiting(formatCount(event.waitlistCount, locale)) : ""}
          </p>
          {filled != null ? (
            <div className="capacity" aria-hidden>
              <i style={{ width: `${filled}%` }} />
            </div>
          ) : null}
        </article>
      ) : (
        <article className="card">
          <p className="strong">{copy.event.interestedN(goingN)}</p>
          <p className="muted">{copy.event.interestedLead}</p>
        </article>
      )}

      <div className="row">
        <ShareEvent title={event.title} text={eventInviteText(event, locale)} url={eventPageUrl(event.id)} />
      </div>
      <EventActions
        eventId={event.id}
        hostId={event.host.id}
        priceTry={event.priceTry}
        initialGuests={guests}
        kind={event.kind}
      />
      <SiteFooter />
    </main>
  );
}
