import Link from "next/link";
import { notFound } from "next/navigation";
import type { EventDto, VenueDto, VenueReview } from "@dorham/shared";
import { EventCard } from "../../../components/event-card";
import { PageIntro } from "../../../components/page-intro";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { VenueReviews } from "./reviews";
import { VenueGallery } from "./gallery";
import { VenueVisitActions } from "./visit-actions";
import { VenueCommunity } from "./community";
import { resolveApiBase } from "../../../lib/api-base";
import { AREA_LABEL, KIND_LABEL } from "../../../lib/venues";

const API = resolveApiBase();

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

  const gallery =
    venue.gallery?.length > 0
      ? venue.gallery
      : venue.mapImageUrl
        ? [{ kind: "map" as const, src: venue.mapsEmbedUrl ?? venue.mapImageUrl, label: "نقشه" }]
        : [];

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={`${KIND_LABEL[venue.kind]} · ${AREA_LABEL[venue.area] ?? venue.area}`} title={venue.name}>
        <p className="lead">{venue.description}</p>
      </PageIntro>

      <VenueGallery items={gallery} name={venue.name} />

      <section className="venue-panel" aria-label="اطلاعات مکان">
        <h2 className="venue-panel-title">جزئیات</h2>
        <dl className="venue-facts">
          <div className="venue-fact">
            <dt>آدرس</dt>
            <dd>{venue.address}</dd>
          </div>
          {venue.hours ? (
            <div className="venue-fact">
              <dt>ساعت کار</dt>
              <dd>{venue.hours}</dd>
            </div>
          ) : null}
          {venue.priceRange ? (
            <div className="venue-fact">
              <dt>حدود قیمت</dt>
              <dd>{venue.priceRange}</dd>
            </div>
          ) : null}
          {venue.menuNotes ? (
            <div className="venue-fact">
              <dt>منو</dt>
              <dd>{venue.menuNotes}</dd>
            </div>
          ) : null}
          {venue.phone ? (
            <div className="venue-fact">
              <dt>تلفن</dt>
              <dd>
                <a href={`tel:${venue.phone}`}>{venue.phone}</a>
              </dd>
            </div>
          ) : null}
          {venue.website ? (
            <div className="venue-fact">
              <dt>وب‌سایت</dt>
              <dd>
                <a href={venue.website} target="_blank" rel="noreferrer">
                  {venue.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </dd>
            </div>
          ) : null}
          <div className="venue-fact">
            <dt>نظرها</dt>
            <dd>{venue.reviewCount.toLocaleString("fa-IR")} نظر ثبت‌شده</dd>
          </div>
        </dl>
        <div className="row venue-panel-actions">
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

      <VenueVisitActions slug={venue.slug} venueId={venue.id} />
      <VenueCommunity slug={venue.slug} />

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
