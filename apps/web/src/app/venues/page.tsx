import Link from "next/link";
import type { VenueDto, VenueKind } from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { resolveApiBase } from "../../lib/api-base";
import { AREA_LABEL, KIND_LABEL } from "../../lib/venues";

const API = resolveApiBase();

async function loadVenues(kind?: string): Promise<VenueDto[]> {
  const query = new URLSearchParams({ city: "istanbul", limit: "80" });
  if (kind) query.set("kind", kind);
  try {
    const res = await fetch(`${API}/v1/venues?${query}`, { cache: "no-store" });
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
  searchParams: Promise<{ kind?: string; submitted?: string }>;
}) {
  const { kind, submitted } = await searchParams;
  const selected = (["RESTAURANT", "CAFE", "MARKET", "CULTURAL"] as VenueKind[]).includes(kind as VenueKind)
    ? (kind as VenueKind)
    : undefined;
  const venues = await loadVenues(selected);

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="نقشهٔ خوردنی" title="مکان‌های ایرانی استانبول">
        <p className="lead">
          رستوران، کافه و مارکت ایرانی استانبول با آدرس و پین گوگل‌مپ. پیش‌نمایش نقشه از همان مختصات واقعی است.
        </p>
      </PageIntro>
      {submitted === "1" ? (
        <div className="banner ok">مکان ثبت شد و بعد از بررسی تیم منتشر می‌شود.</div>
      ) : null}
      <div className="row">
        <Link className="btn" href="/venues/new">
          ثبت مکان من
        </Link>
      </div>
      <div className="chip-row">
        <Link className={`pill ${selected ? "" : "solid"}`} href="/venues">
          همه
        </Link>
        {(Object.keys(KIND_LABEL) as VenueKind[]).map((item) => (
          <Link key={item} className={`pill ${selected === item ? "solid" : ""}`} href={`/venues?kind=${item}`}>
            {KIND_LABEL[item]}
          </Link>
        ))}
      </div>
      <p className="meta">{venues.length} مکان</p>
      <div className="grid">
        {venues.map((venue) => (
          <article className="card venue-card" key={venue.id}>
            {venue.mapImageUrl ? (
              <a href={venue.mapsUrl} target="_blank" rel="noreferrer" aria-label={`گوگل‌مپ ${venue.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="venue-map" src={venue.mapImageUrl} alt={`نقشه ${venue.name}`} loading="lazy" />
              </a>
            ) : null}
            <div className="card-top">
              <span className="date-chip">{KIND_LABEL[venue.kind]}</span>
              <span className="muted">{AREA_LABEL[venue.area] ?? venue.area}</span>
            </div>
            <h3>{venue.name}</h3>
            <p className="muted">{venue.description}</p>
            {venue.priceRange ? <p className="meta">{venue.priceRange}</p> : null}
            <p className="meta">{venue.address}</p>
            <p className="meta">{venue.reviewCount} نظر</p>
            <div className="row">
              <Link className="card-cta" href={`/venues/${venue.slug}`}>
                جزئیات
              </Link>
              <a className="card-cta" href={venue.mapsUrl} target="_blank" rel="noreferrer">
                گوگل‌مپ
              </a>
            </div>
          </article>
        ))}
      </div>
      <SiteFooter />
    </main>
  );
}
