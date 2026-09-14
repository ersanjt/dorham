import Link from "next/link";
import type { EventDto } from "@dorham/shared";
import { CityCalendarList, EventCard } from "../../components/event-card";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { resolveApiBase } from "../../lib/api-base";

const API = resolveApiBase();

async function loadEvents(when: "upcoming" | "past", kind?: "COMMUNITY" | "CITY_SHOW"): Promise<EventDto[]> {
  try {
    const q = new URLSearchParams({ city: "istanbul", when, limit: "40" });
    if (kind) q.set("kind", kind);
    const res = await fetch(`${API}/v1/events?${q}`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

function toCard(event: EventDto) {
  return {
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
  };
}

export default async function EventsPage() {
  const [community, cityShows, pastCommunity] = await Promise.all([
    loadEvents("upcoming", "COMMUNITY"),
    loadEvents("upcoming", "CITY_SHOW"),
    loadEvents("past", "COMMUNITY"),
  ]);

  return (
    <main className="wrap events-page">
      <SiteHeader />
      <PageIntro kicker="استانبول" title="دورهمی‌های این شهر">
        <p className="lead">اول جمع جامعه با RSVP واقعی. تقویم کنسرت فقط برای هماهنگی دوستان است — نه فروش بلیط.</p>
        <div className="row events-intro-actions">
          <Link className="btn" href="/events/new">
            ثبت دورهمی
          </Link>
          <Link className="btn ghost" href="/venues">
            مکان‌های ایرانی
          </Link>
        </div>
      </PageIntro>

      <section className="events-block" aria-labelledby="community-heading">
        <div className="section-head events-block-head">
          <p className="kicker">صفحهٔ اول</p>
          <h2 id="community-heading">جمع‌های جامعه</h2>
          <p className="muted">میزبان دورهم، مکان واقعی، مهمان‌لیست و چک‌این دم در.</p>
        </div>
        {community.length === 0 ? (
          <div className="events-empty">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="events-empty-mark" src="/brand/empty-events.png" alt="" width={120} height={120} />
            <p className="muted">هنوز دورهمی منتشر نشده. اولین جمعه را یک میزبان واقعی اعلام می‌کند — دورهم رویداد جعلی نمی‌سازد.</p>
            <div className="row">
              <Link className="btn" href="/events/new">
                ساخت دورهمی
              </Link>
              {cityShows.length > 0 ? (
                <a className="btn ghost" href="#city-calendar">
                  تقویم شهر
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="events-grid">
            {community.map((event) => (
              <EventCard key={event.id} event={toCard(event)} />
            ))}
          </div>
        )}
      </section>

      {cityShows.length > 0 ? (
        <section className="events-block events-city-block" id="city-calendar" aria-labelledby="city-heading">
          <div className="section-head events-block-head">
            <p className="kicker">هماهنگی</p>
            <h2 id="city-heading">تقویم شهر</h2>
            <p className="muted">کنسرت و نمایش عمومی — فقط برای دیدن کی علاقه‌مند است، نه خرید بلیط از دورهم.</p>
          </div>
          <CityCalendarList events={cityShows.map(toCard)} />
        </section>
      ) : null}

      {pastCommunity.length > 0 ? (
        <section className="events-block" aria-labelledby="past-heading">
          <div className="section-head events-block-head">
            <p className="kicker">بایگانی</p>
            <h2 id="past-heading">دورهمی‌های گذشته</h2>
          </div>
          <div className="events-grid events-grid-past">
            {pastCommunity.map((event) => (
              <EventCard key={event.id} event={toCard(event)} />
            ))}
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
