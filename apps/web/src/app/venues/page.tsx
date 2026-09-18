import Link from "next/link";
import type { VenueDto, VenueKind } from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { VenueCover } from "../../components/venue-cover";
import { resolveApiBase } from "../../lib/api-base";
import { AREA_LABEL, KIND_LABEL } from "../../lib/venues";

const API = resolveApiBase();

async function loadVenues(kind?: string, q?: string): Promise<VenueDto[]> {
  const query = new URLSearchParams({ city: "istanbul", limit: "80" });
  if (kind) query.set("kind", kind);
  if (q) query.set("q", q);
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
  searchParams: Promise<{ kind?: string; submitted?: string; q?: string }>;
}) {
  const { kind, submitted, q } = await searchParams;
  const query = q?.trim() ?? "";
  const selected = (["RESTAURANT", "CAFE", "MARKET", "CULTURAL"] as VenueKind[]).includes(kind as VenueKind)
    ? (kind as VenueKind)
    : undefined;
  const venues = await loadVenues(selected, query || undefined);

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="نقشهٔ خوردنی" title="مکان‌های ایرانی استانبول">
        <p className="lead">
          اول آکسارای و نامق‌کمال، بعد کادیکوی، تکسیم، شیشلی و غرب شهر. آدرس و نقشه واقعی؛ از هر صفحه می‌توانی برنامهٔ
          حضور بگذاری یا عکس/نظر بفرستی.
        </p>
      </PageIntro>
      {submitted === "1" ? (
        <div className="banner ok">مکان ثبت شد و بعد از بررسی تیم منتشر می‌شود.</div>
      ) : null}
      <form className="venue-search" action="/venues" method="get">
        {selected ? <input type="hidden" name="kind" value={selected} /> : null}
        <label>
          جستجو
          <input name="q" defaultValue={query} placeholder="نام، محله، غذا، آدرس" />
        </label>
        <button className="btn" type="submit">
          پیدا کن
        </button>
        <Link className="btn ghost" href="/venues/new">
          ثبت مکان من
        </Link>
      </form>
      <div className="chip-row">
        <Link className={`pill ${selected ? "" : "solid"}`} href={query ? `/venues?q=${encodeURIComponent(query)}` : "/venues"}>
          همه
        </Link>
        {(Object.keys(KIND_LABEL) as VenueKind[]).map((item) => (
          <Link
            key={item}
            className={`pill ${selected === item ? "solid" : ""}`}
            href={`/venues?kind=${item}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
          >
            {KIND_LABEL[item]}
          </Link>
        ))}
      </div>
      <p className="meta">{venues.length.toLocaleString("fa-IR")} مکان</p>
      {venues.length === 0 ? (
        <div className="empty-art card" style={{ marginTop: 16 }}>
          <p className="muted">
            هنوز مکانی در این فیلتر نیست. می‌توانی مکان ایرانی واقعی ثبت کنی تا بعد از بررسی منتشر شود.
            {query ? ` هیچ نتیجه‌ای برای «${query}» نبود.` : ""}
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn" href="/venues/new">
              ثبت مکان
            </Link>
            <Link className="btn ghost" href="/events">
              رویدادهای شهر
            </Link>
          </div>
        </div>
      ) : (
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
                  <div className="row">
                    {venue.priceRange ? <span className="meta">{venue.priceRange}</span> : null}
                    {venue.menuImageUrl ? <span className="date-chip">منو</span> : null}
                  </div>
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
      )}
      <SiteFooter />
    </main>
  );
}
