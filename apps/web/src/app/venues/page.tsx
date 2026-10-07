import Link from "next/link";
import type { VenueDto, VenueKind } from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { VenueCover } from "../../components/venue-cover";
import { resolveApiBase } from "../../lib/api-base";
import { catalogInit } from "../../lib/catalog-fetch";
import { t } from "../../lib/copy";
import { formatCount } from "../../lib/format";
import { getLocale } from "../../lib/locale-server";
import { venueAreaLabel, venueKindLabel } from "../../lib/venues";

const API = resolveApiBase();

async function loadVenues(kind?: string, q?: string): Promise<VenueDto[]> {
  const query = new URLSearchParams({ city: "istanbul", limit: "80" });
  if (kind) query.set("kind", kind);
  if (q) query.set("q", q);
  try {
    const res = await fetch(`${API}/v1/venues?${query}`, catalogInit());
    if (!res.ok) return [];
    const json = (await res.json()) as { data: VenueDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; submitted?: string; q?: string }>;
}) {
  const { kind, submitted, q } = await searchParams;
  const locale = await getLocale();
  const copy = t(locale);
  const kinds = ["RESTAURANT", "CAFE", "MARKET", "CULTURAL"] as VenueKind[];
  const query = q?.trim() ?? "";
  const selected = kinds.includes(kind as VenueKind) ? (kind as VenueKind) : undefined;
  const venues = await loadVenues(selected, query || undefined);

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.venues.kicker} title={copy.venues.title}>
        <p className="lead">{copy.venues.lead}</p>
      </PageIntro>
      {submitted === "1" ? <div className="banner ok">{copy.venues.submitted}</div> : null}
      <form className="venue-search" action="/venues" method="get">
        {selected ? <input type="hidden" name="kind" value={selected} /> : null}
        <label>
          {copy.venues.search}
          <input name="q" defaultValue={query} placeholder={copy.venues.placeholder} />
        </label>
        <button className="btn" type="submit">
          {copy.venues.find}
        </button>
        <Link className="btn ghost" href="/venues/new">
          {copy.venues.addMine}
        </Link>
      </form>
      <div className="chip-row">
        <Link className={`pill ${selected ? "" : "solid"}`} href={query ? `/venues?q=${encodeURIComponent(query)}` : "/venues"}>
          {copy.venues.all}
        </Link>
        {kinds.map((item) => (
          <Link
            key={item}
            className={`pill ${selected === item ? "solid" : ""}`}
            href={`/venues?kind=${item}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
          >
            {venueKindLabel(item, locale)}
          </Link>
        ))}
      </div>
      <p className="meta">{copy.venues.count(formatCount(venues.length, locale))}</p>
      {venues.length === 0 ? (
        <div className="empty-art card" style={{ marginTop: 16 }}>
          <p className="muted">
            {copy.venues.empty}
            {query ? copy.venues.noQuery(query) : ""}
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn" href="/venues/new">
              {copy.venues.add}
            </Link>
            <Link className="btn ghost" href="/events">
              {copy.venues.events}
            </Link>
          </div>
        </div>
      ) : (
        <div className="venues-grid">
          {venues.map((venue) => {
            const cover = venue.photos?.[0] || venue.mapImageUrl;
            const areaLabel = venueAreaLabel(venue.area, locale);
            return (
              <article className="card venue-card" key={venue.id}>
                <VenueCover
                  href={`/venues/${venue.slug}`}
                  name={venue.name}
                  areaLabel={areaLabel}
                  src={cover}
                  mapImageUrl={venue.mapImageUrl}
                />
                <div className="venue-card-body">
                  <div className="card-top">
                    <span className="date-chip">{venueKindLabel(venue.kind, locale)}</span>
                    <span className="muted">{areaLabel}</span>
                  </div>
                  <h3>{venue.name}</h3>
                  <p className="muted venue-desc">{venue.description}</p>
                  <div className="venue-card-foot">
                    <div className="row">
                      {venue.priceRange ? <span className="meta">{venue.priceRange}</span> : null}
                      {venue.menuImageUrl ? <span className="date-chip">{copy.venues.menu}</span> : null}
                    </div>
                    <p className="meta venue-address">{venue.address}</p>
                    <p className="meta">{copy.venues.reviews(formatCount(venue.reviewCount, locale))}</p>
                    <div className="row">
                      <Link className="card-cta" href={`/venues/${venue.slug}`}>
                        {copy.venues.details}
                      </Link>
                      <a className="card-cta" href={venue.mapsUrl} target="_blank" rel="noreferrer">
                        {copy.venues.maps}
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <SiteFooter />
    </main>
  );
}
