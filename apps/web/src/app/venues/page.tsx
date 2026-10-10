import Link from "next/link";
import {
  ISTANBUL_AREAS,
  ISTANBUL_REGIONS,
  istanbulArea,
  type IstanbulRegion,
  type VenueDto,
  type VenueKind,
} from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { VenueCover } from "../../components/venue-cover";
import { resolveApiBase } from "../../lib/api-base";
import { catalogInit } from "../../lib/catalog-fetch";
import { t } from "../../lib/copy";
import { formatCount } from "../../lib/format";
import type { UiLocale } from "../../lib/locale";
import { getLocale } from "../../lib/locale-server";
import { venueAreaLabel, venueKindLabel, venueRegionLabel } from "../../lib/venues";

const API = resolveApiBase();

type Filters = { kind?: VenueKind; region?: IstanbulRegion; area?: string; q?: string };

async function loadVenues(filters: Filters): Promise<VenueDto[]> {
  const query = new URLSearchParams({ city: "istanbul", limit: "80" });
  if (filters.kind) query.set("kind", filters.kind);
  if (filters.area) query.set("area", filters.area);
  else if (filters.region) query.set("region", filters.region);
  if (filters.q) query.set("q", filters.q);
  try {
    const res = await fetch(`${API}/v1/venues?${query}`, catalogInit());
    if (!res.ok) return [];
    const json = (await res.json()) as { data: VenueDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

function venuesHref(filters: Filters) {
  const query = new URLSearchParams();
  if (filters.kind) query.set("kind", filters.kind);
  if (filters.region) query.set("region", filters.region);
  if (filters.area) query.set("area", filters.area);
  if (filters.q) query.set("q", filters.q);
  const s = query.toString();
  return s ? `/venues?${s}` : "/venues";
}

type Section = { id: string; title: string; venues: VenueDto[] };

/** Whole city → one section per region; one region → one section per neighborhood. */
function sectionize(venues: VenueDto[], filters: Filters, locale: UiLocale): Section[] {
  const copy = t(locale);
  if (filters.area) return [{ id: filters.area, title: "", venues }];
  const sections = new Map<string, Section>();
  for (const venue of venues) {
    const known = istanbulArea(venue.area);
    const id = filters.region ? venue.area : (known?.region ?? "other");
    const title = filters.region
      ? venueAreaLabel(venue.area, locale)
      : known
        ? venueRegionLabel(known.region, locale)
        : copy.venues.otherAreas;
    const section = sections.get(id) ?? { id, title, venues: [] };
    section.venues.push(venue);
    sections.set(id, section);
  }
  return [...sections.values()];
}

function VenueCard({ venue, locale }: { venue: VenueDto; locale: UiLocale }) {
  const copy = t(locale);
  const cover = venue.photos?.[0] || venue.mapImageUrl;
  const areaLabel = venueAreaLabel(venue.area, locale);
  return (
    <article className="card venue-card">
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
        <ul className="venue-choice">
          {venue.hours ? (
            <li>
              <span className="isolate-ltr">{venue.hours}</span>
            </li>
          ) : null}
          {venue.menuNotes ? <li>{venue.menuNotes}</li> : null}
          {venue.phone ? (
            <li>
              <a className="isolate-ltr" href={`tel:${venue.phone.replace(/\s/g, "")}`}>
                {venue.phone}
              </a>
            </li>
          ) : null}
        </ul>
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
}

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; submitted?: string; q?: string; region?: string; area?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const copy = t(locale);
  const kinds = ["RESTAURANT", "CAFE", "MARKET", "CULTURAL"] as VenueKind[];
  const kind = kinds.includes(params.kind as VenueKind) ? (params.kind as VenueKind) : undefined;
  const area = istanbulArea(params.area ?? "");
  const region = area?.region ?? (ISTANBUL_REGIONS.includes(params.region as IstanbulRegion)
    ? (params.region as IstanbulRegion)
    : undefined);
  const q = params.q?.trim() || undefined;
  const filters: Filters = { kind, region, area: area?.slug, q };
  const venues = await loadVenues(filters);
  const sections = sectionize(venues, filters, locale);
  const regionAreas = region ? ISTANBUL_AREAS.filter((a) => a.region === region) : [];

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.venues.kicker} title={copy.venues.title}>
        <p className="lead">{copy.venues.lead}</p>
      </PageIntro>
      {params.submitted === "1" ? <div className="banner ok">{copy.venues.submitted}</div> : null}
      <form className="venue-search" action="/venues" method="get">
        {kind ? <input type="hidden" name="kind" value={kind} /> : null}
        {region ? <input type="hidden" name="region" value={region} /> : null}
        {area ? <input type="hidden" name="area" value={area.slug} /> : null}
        <label>
          {copy.venues.search}
          <input name="q" defaultValue={q ?? ""} placeholder={copy.venues.placeholder} />
        </label>
        <button className="btn" type="submit">
          {copy.venues.find}
        </button>
        <Link className="btn ghost" href="/venues/new">
          {copy.venues.addMine}
        </Link>
      </form>
      <div className="chip-row">
        <Link className={`pill ${kind ? "" : "solid"}`} href={venuesHref({ ...filters, kind: undefined })}>
          {copy.venues.all}
        </Link>
        {kinds.map((item) => (
          <Link key={item} className={`pill ${kind === item ? "solid" : ""}`} href={venuesHref({ ...filters, kind: item })}>
            {venueKindLabel(item, locale)}
          </Link>
        ))}
      </div>
      <nav className="chip-row venue-regions" aria-label={copy.venues.neighborhoods}>
        <Link className={`pill ${region ? "" : "solid"}`} href={venuesHref({ kind, q })}>
          {copy.venues.allCity}
        </Link>
        {ISTANBUL_REGIONS.map((item) => (
          <Link key={item} className={`pill ${region === item ? "solid" : ""}`} href={venuesHref({ kind, q, region: item })}>
            {copy.venues.regionShort[item]}
          </Link>
        ))}
      </nav>
      {regionAreas.length > 1 ? (
        <div className="chip-row venue-areas">
          <Link className={`pill small ${area ? "" : "solid"}`} href={venuesHref({ kind, q, region })}>
            {copy.venues.all}
          </Link>
          {regionAreas.map((item) => (
            <Link
              key={item.slug}
              className={`pill small ${area?.slug === item.slug ? "solid" : ""}`}
              href={venuesHref({ kind, q, region, area: item.slug })}
            >
              {item[locale]}
            </Link>
          ))}
        </div>
      ) : null}
      <p className="meta">{copy.venues.count(formatCount(venues.length, locale))}</p>
      {venues.length === 0 ? (
        <div className="empty-art card" style={{ marginTop: 16 }}>
          <p className="muted">
            {copy.venues.empty}
            {q ? copy.venues.noQuery(q) : ""}
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
        sections.map((section) => (
          <section className="venue-section" key={section.id} id={section.id} aria-label={section.title || undefined}>
            {section.title ? (
              <h2 className="venue-section-title">
                {section.title}
                <span className="meta">{formatCount(section.venues.length, locale)}</span>
              </h2>
            ) : null}
            <div className="venues-grid">
              {section.venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} locale={locale} />
              ))}
            </div>
          </section>
        ))
      )}
      <SiteFooter />
    </main>
  );
}
