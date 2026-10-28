import Link from "next/link";
import { notFound } from "next/navigation";
import type { EventDto, VenueDto, VenueReview } from "@dorham/shared";
import type { Metadata } from "next";
import { EventCard } from "../../../components/event-card";
import { PageIntro } from "../../../components/page-intro";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { VenueReviews } from "./reviews";
import { VenueGallery } from "./gallery";
import { VenueVisitActions } from "./visit-actions";
import { VenueCommunity } from "./community";
import { VenueMenuEditor } from "./menu-editor";
import { resolveApiBase } from "../../../lib/api-base";
import { catalogInit } from "../../../lib/catalog-fetch";
import { t } from "../../../lib/copy";
import { formatCount } from "../../../lib/format";
import { safeHref, safeTel } from "../../../lib/safe-href";
import { getLocale } from "../../../lib/locale-server";
import { venueAreaLabel, venueKindLabel } from "../../../lib/venues";

const API = resolveApiBase();

async function loadVenue(slug: string): Promise<VenueDto | null> {
  try {
    const res = await fetch(`${API}/v1/venues/${slug}`, catalogInit());
    if (!res.ok) return null;
    const json = (await res.json()) as { data: VenueDto };
    return json.data;
  } catch {
    return null;
  }
}

async function loadReviews(slug: string): Promise<VenueReview[]> {
  try {
    const res = await fetch(`${API}/v1/venues/${slug}/reviews`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: VenueReview[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function loadEvents(slug: string): Promise<EventDto[]> {
  try {
    const res = await fetch(`${API}/v1/events?city=istanbul&venueSlug=${encodeURIComponent(slug)}&limit=10`, catalogInit());
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const venue = await loadVenue(slug);
  if (!venue) return { title: "Dorham — دورهم" };
  const description = venue.description.replace(/\s+/g, " ").trim().slice(0, 160);
  const origin = (process.env.NEXT_PUBLIC_APP_URL || "https://dorham.app").replace(/\/$/, "");
  const url = `${origin}/venues/${venue.slug}`;
  return {
    title: `${venue.name} — Dorham`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: venue.name,
      description,
      url,
      type: "article",
    },
  };
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const copy = t(locale);
  const [venue, reviews, events] = await Promise.all([loadVenue(slug), loadReviews(slug), loadEvents(slug)]);
  if (!venue) notFound();

  const gallery =
    venue.gallery?.length > 0
      ? venue.gallery
      : venue.mapImageUrl
        ? [{ kind: "map" as const, src: venue.mapsEmbedUrl ?? venue.mapImageUrl, label: copy.venues.map }]
        : [];

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro
        kicker={`${venueKindLabel(venue.kind, locale)} · ${venueAreaLabel(venue.area, locale)}`}
        title={venue.name}
      >
        <p className="lead">{venue.description}</p>
      </PageIntro>

      <VenueGallery items={gallery} name={venue.name} />

      <section className="venue-panel" aria-label={copy.venues.factsAria}>
        <h2 className="venue-panel-title">{copy.venues.details}</h2>
        <dl className="venue-facts">
          <div className="venue-fact">
            <dt>{copy.venues.address}</dt>
            <dd>{venue.address}</dd>
          </div>
          {venue.hours ? (
            <div className="venue-fact">
              <dt>{copy.venues.hours}</dt>
              <dd>
                <span className="isolate-ltr">{venue.hours}</span>
              </dd>
            </div>
          ) : null}
          {venue.priceRange ? (
            <div className="venue-fact">
              <dt>{copy.venues.price}</dt>
              <dd>{venue.priceRange}</dd>
            </div>
          ) : null}
          {venue.menuNotes ? (
            <div className="venue-fact">
              <dt>{copy.venues.signature}</dt>
              <dd>{venue.menuNotes}</dd>
            </div>
          ) : null}
          {safeHref(venue.menuImageUrl) ? (
            <div className="venue-fact venue-fact-menu">
              <dt>{copy.venues.menu}</dt>
              <dd>
                <a className="venue-menu-link" href={safeHref(venue.menuImageUrl) ?? undefined} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="venue-menu-image" src={safeHref(venue.menuImageUrl) ?? undefined} alt={copy.venues.menuAlt(venue.name)} />
                </a>
              </dd>
            </div>
          ) : null}
          {venue.phone && safeTel(venue.phone) ? (
            <div className="venue-fact">
              <dt>{copy.venues.phone}</dt>
              <dd>
                <a className="isolate-ltr" href={safeTel(venue.phone) ?? undefined}>
                  {venue.phone}
                </a>
              </dd>
            </div>
          ) : null}
          {safeHref(venue.website) ? (
            <div className="venue-fact">
              <dt>{copy.venues.website}</dt>
              <dd>
                <a href={safeHref(venue.website) ?? undefined} target="_blank" rel="noreferrer">
                  {(venue.website ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </dd>
            </div>
          ) : null}
          <div className="venue-fact">
            <dt>{copy.venues.reviewsLabel}</dt>
            <dd>{copy.venues.reviewsRecorded(formatCount(venue.reviewCount, locale))}</dd>
          </div>
        </dl>
        <div className="row venue-panel-actions">
          {safeHref(venue.mapsUrl) ? (
            <a className="btn" href={safeHref(venue.mapsUrl) ?? undefined} target="_blank" rel="noreferrer">
              {copy.venues.openMaps}
            </a>
          ) : null}
          <Link className="btn ghost" href={`/feed?venue=${venue.slug}`}>
            {copy.venues.writeFeed}
          </Link>
          <Link className="btn ghost" href="/venues">
            {copy.venues.allPlaces}
          </Link>
        </div>
      </section>

      <VenueVisitActions slug={venue.slug} />
      <VenueMenuEditor slug={venue.slug} menuNotes={venue.menuNotes} menuImageUrl={venue.menuImageUrl} />
      <VenueCommunity slug={venue.slug} />

      <section className="stack" style={{ marginTop: 28 }}>
        <h2>{copy.venues.eventsHere}</h2>
        {events.length === 0 ? <p className="muted">{copy.venues.noEvents}</p> : null}
        {events.map((event) => (
          <EventCard key={event.id} event={{ ...event, hostName: event.host.displayName }} locale={locale} />
        ))}
      </section>
      <VenueReviews slug={venue.slug} initial={reviews} />
      <SiteFooter />
    </main>
  );
}
