import Link from "next/link";
import type { VenueDto, VenueKind } from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { VenueCover } from "../../components/venue-cover";
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
          رستوران، کافه و مارکت ایرانی با آدرس واقعی. کاور اول از عکس تأییدشدهٔ همان مکان است؛ اگر نباشد نمای خیابان (با کلید
          نقشه) یا کاشی نقشه. عکس جعلی استوک نمی‌گذاریم — از صفحهٔ هر مکان می‌توانی عکس بفرستی.
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
      <p className="meta">{venues.length.toLocaleString("fa-IR")} مکان</p>
      <div className="venues-grid">
        {venues.map((venue) => {
          const cover = venue.photos?.[0] || venue.mapImageUrl;
          const areaLabel = AREA_LABEL[venue.area] ?? venue.area;
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
                  <span className="date-chip">{KIND_LABEL[venue.kind]}</span>
                  <span className="muted">{areaLabel}</span>
                </div>
                <h3>{venue.name}</h3>
                <p className="muted venue-desc">{venue.description}</p>
                <div className="venue-card-foot">
                  {venue.priceRange ? <p className="meta">{venue.priceRange}</p> : null}
                  <p className="meta venue-address">{venue.address}</p>
                  <p className="meta">{venue.reviewCount.toLocaleString("fa-IR")} نظر</p>
                  <div className="row">
                    <Link className="card-cta" href={`/venues/${venue.slug}`}>
                      جزئیات
                    </Link>
                    <a className="card-cta" href={venue.mapsUrl} target="_blank" rel="noreferrer">
                      گوگل‌مپ
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <SiteFooter />
    </main>
  );
}
