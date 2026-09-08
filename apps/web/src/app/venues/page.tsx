import Link from "next/link";
import type { VenueDto, VenueKind } from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { AREA_LABEL, KIND_LABEL } from "../../lib/venues";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const selected = (["RESTAURANT", "CAFE", "MARKET", "CULTURAL"] as VenueKind[]).includes(kind as VenueKind)
    ? (kind as VenueKind)
    : undefined;
  const venues = await loadVenues(selected);

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="نقشهٔ خوردنی" title="مکان‌های ایرانی استانبول">
        <p className="lead">رستوران، کافه، مارکت و جای جمع‌شدن — از نقشه و آدرس عمومی. کلاب دوستیابی نیست.</p>
      </PageIntro>
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
          <article className="card" key={venue.id}>
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
