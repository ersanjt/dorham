import Link from "next/link";
import { notFound } from "next/navigation";
import type { EventDto, VenueDto, VenueReview } from "@dorham/shared";
import { EventCard } from "../../../components/event-card";
import { PageIntro } from "../../../components/page-intro";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { VenueReviews } from "./reviews";
import { AREA_LABEL, KIND_LABEL } from "../../../lib/venues";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function loadVenue(slug: string): Promise<VenueDto | null> {
  try {
    const res = await fetch(`${API}/v1/venues/${slug}`, { cache: "no-store" });
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
    const res = await fetch(`${API}/v1/events?city=istanbul&venueSlug=${encodeURIComponent(slug)}&limit=10`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [venue, reviews, events] = await Promise.all([loadVenue(slug), loadReviews(slug), loadEvents(slug)]);
  if (!venue) notFound();

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={`${KIND_LABEL[venue.kind]} · ${AREA_LABEL[venue.area] ?? venue.area}`} title={venue.name}>
        <p className="lead">{venue.description}</p>
      </PageIntro>
      <section className="card">
        <p>
          <strong>آدرس:</strong> {venue.address}
        </p>
        {venue.hours ? (
          <p>
            <strong>ساعت:</strong> {venue.hours}
          </p>
        ) : null}
        {venue.priceRange ? (
          <p>
            <strong>حدود قیمت:</strong> {venue.priceRange}
          </p>
        ) : null}
        {venue.menuNotes ? (
          <p>
            <strong>منو:</strong> {venue.menuNotes}
          </p>
        ) : null}
        {venue.phone ? (
          <p>
            <strong>تلفن:</strong> <a href={`tel:${venue.phone}`}>{venue.phone}</a>
          </p>
        ) : null}
        {venue.website ? (
          <p>
            <a href={venue.website} target="_blank" rel="noreferrer">
              وب‌سایت
            </a>
          </p>
        ) : null}
        <p className="muted">{venue.reviewCount} نظر</p>
        <div className="row">
          <a className="btn" href={venue.mapsUrl} target="_blank" rel="noreferrer">
            باز کردن در گوگل‌مپ
          </a>
          <Link className="btn ghost" href={`/feed?venue=${venue.slug}`}>
            نوشتن در فید شهر
          </Link>
          <Link className="btn ghost" href="/venues">
            همه مکان‌ها
          </Link>
        </div>
      </section>
      <section className="stack" style={{ marginTop: 28 }}>
        <h2>رویدادها در این مکان</h2>
        {events.length === 0 ? <p className="muted">هنوز رویدادی برای اینجا اعلام نشده.</p> : null}
        {events.map((event) => (
          <EventCard key={event.id} event={{ ...event, hostName: event.host.displayName }} />
        ))}
      </section>
      <VenueReviews slug={venue.slug} initial={reviews} />
      <SiteFooter />
    </main>
  );
}
