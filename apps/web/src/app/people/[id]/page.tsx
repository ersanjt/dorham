import { notFound } from "next/navigation";
import Link from "next/link";
import type { EventDto, PublicUser } from "@dorham/shared";
import type { Metadata } from "next";
import { EventCard } from "../../../components/event-card";
import { PersonSafety } from "../../../components/person-safety";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { resolveApiBase } from "../../../lib/api-base";
import { catalogInit } from "../../../lib/catalog-fetch";
import { t } from "../../../lib/copy";
import { formatCount, formatDayChip, formatMemberSince } from "../../../lib/format";
import { getLocale } from "../../../lib/locale-server";
import { publicMediaUrl } from "../../../lib/media-url";
import { venueAreaLabel } from "../../../lib/venues";

const API = resolveApiBase();

async function loadPerson(id: string): Promise<PublicUser | null> {
  try {
    const res = await fetch(`${API}/v1/users/${id}`, catalogInit());
    if (!res.ok) return null;
    const json = (await res.json()) as { data: PublicUser };
    return json.data;
  } catch {
    return null;
  }
}

async function loadHosted(id: string): Promise<EventDto[]> {
  try {
    const res = await fetch(`${API}/v1/events?city=istanbul&hostId=${id}&limit=20`, catalogInit());
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const person = await loadPerson(id);
  if (!person) return { title: "Dorham — دورهم" };
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "https://dorham.app").replace(/\/$/, "");
  const description = (person.bio?.trim() || person.displayName).replace(/\s+/g, " ").slice(0, 160);
  return {
    title: `${person.displayName} — Dorham`,
    description,
    alternates: { canonical: `${origin}/people/${person.id}` },
  };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const copy = t(locale);
  const intent = copy.intent;
  const [person, hosted] = await Promise.all([loadPerson(id), loadHosted(id)]);
  if (!person) notFound();

  const cityLabel =
    person.city === "istanbul" ? copy.person.istanbul : person.city === "ankara" ? copy.person.ankara : copy.person.izmir;
  const memberSince = formatMemberSince(person.createdAt, locale);
  const photo = publicMediaUrl(person.photoUrl);
  const verified = person.verificationStatus === "VERIFIED";
  const stats = person.stats;
  const hasStats = Boolean(
    stats && (stats.venuesVisited > 0 || stats.eventsAttended > 0 || stats.eventsHosted > 0),
  );
  const venues = person.venuesVisited ?? [];
  const attended = person.eventsAttended ?? [];
  const hangPlans = person.hangPlans ?? [];

  return (
    <main className="wrap person-page">
      <SiteHeader />

      <header className="person-hero">
        <div className="person-hero-main">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="person-avatar" src={photo} alt="" />
          ) : (
            <div className="person-avatar person-avatar-empty" aria-hidden>
              {person.displayName.slice(0, 1)}
            </div>
          )}
          <div className="person-hero-copy">
            <div className="person-name-row">
              <h1 className="person-name">{person.displayName}</h1>
              {verified ? <span className="verify-badge">{copy.person.verified}</span> : null}
            </div>
            <p className="person-sub">
              {cityLabel} · {copy.person.memberSince(memberSince)}
            </p>
            <p className="person-bio">{person.bio?.trim() || copy.person.bioEmpty}</p>
            <p className="muted person-trust-note">{verified ? copy.person.verifiedNote : copy.person.unverified}</p>
            <PersonSafety personId={person.id} />
          </div>
        </div>
      </header>

      {hasStats ? (
        <section className="person-stats" aria-label={copy.person.statsAria}>
          <div className="person-stat">
            <strong>{formatCount(stats!.venuesVisited, locale)}</strong>
            <span>{copy.person.venuesStat}</span>
          </div>
          <div className="person-stat">
            <strong>{formatCount(stats!.eventsAttended, locale)}</strong>
            <span>{copy.person.eventsStat}</span>
          </div>
          <div className="person-stat">
            <strong>{formatCount(stats!.eventsHosted, locale)}</strong>
            <span>{copy.person.hostedStat}</span>
          </div>
        </section>
      ) : (
        <section className="person-empty-strip">
          <p className="muted">{copy.person.emptyStats}</p>
          <div className="row">
            <Link className="btn ghost" href="/events">
              {copy.person.cityEvents}
            </Link>
            <Link className="btn ghost" href="/venues">
              {copy.person.places}
            </Link>
          </div>
        </section>
      )}

      {hangPlans.length > 0 ? (
        <section className="person-panel">
          <h2>{copy.person.upcoming}</h2>
          <ul className="person-list">
            {hangPlans.map((plan) => (
              <li key={plan.id}>
                <Link href={`/venues/${plan.venueSlug}`}>
                  {plan.venueName}
                  <span className="muted">
                    {" "}
                    · {intent[plan.intent as keyof typeof intent] ?? plan.intent} · {formatDayChip(plan.startsAt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {venues.length > 0 ? (
        <section className="person-panel">
          <h2>{copy.person.confirmedPlaces}</h2>
          <ul className="person-chips">
            {venues.map((v) => (
              <li key={v.venueId}>
                <Link href={`/venues/${v.venueSlug}`}>
                  {v.venueName}
                  <span className="muted">
                    {" "}
                    · {venueAreaLabel(v.venueArea, locale)} · {formatCount(v.visitCount, locale)}×
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {attended.length > 0 ? (
        <section className="person-panel">
          <h2>{copy.person.attended}</h2>
          <ul className="person-list">
            {attended.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`}>
                  {event.title}
                  <span className="muted">
                    {" "}
                    · {formatDayChip(event.startsAt, locale)}
                    {event.venue ? ` · ${event.venue}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hosted.length > 0 ? (
        <section className="person-panel">
          <h2>{copy.person.hosted}</h2>
          <div className="grid">
            {hosted.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  id: event.id,
                  title: event.title,
                  description: event.description,
                  venue: event.venue,
                  startsAt: event.startsAt,
                  goingCount: event.goingCount,
                  capacity: event.capacity,
                  waitlistCount: event.waitlistCount,
                  hostName: event.host.displayName,
                  priceTry: event.priceTry,
                  kind: event.kind,
                }}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!hasStats && venues.length === 0 && attended.length === 0 && hosted.length === 0 && hangPlans.length === 0 ? (
        <section className="person-panel">
          <h2>{copy.person.inCity}</h2>
          <p className="muted">
            {copy.person.noTrace} <Link href="/events">{copy.person.nextEvent}</Link>
          </p>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
