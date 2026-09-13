import Link from "next/link";
import type { EventDto } from "@dorham/shared";
import { EventCard } from "../../components/event-card";
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

function EventGrid({ events, empty }: { events: EventDto[]; empty: string }) {
  if (events.length === 0) return <p className="muted">{empty}</p>;
  return (
    <div className="grid">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={{
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
          }}
        />
      ))}
    </div>
  );
}

export default async function EventsPage() {
  const [community, cityShows, pastCommunity] = await Promise.all([
    loadEvents("upcoming", "COMMUNITY"),
    loadEvents("upcoming", "CITY_SHOW"),
    loadEvents("past", "COMMUNITY"),
  ]);

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="صفحهٔ اول دورهم" title="دورهمی‌های استانبول">
        <p className="lead">اینجا برای جمع شدن است — RSVP، مهمان‌لیست، دمِ در. فروش بلیط کنسرت آرنا کار دورهم نیست.</p>
        <p className="muted">
          <Link href="/events/new">ثبت دورهمی</Link> برای میزبان ·{" "}
          <Link href="/venues">مکان‌های ایرانی</Link>
        </p>
      </PageIntro>

      <section className="stack" style={{ marginTop: 8 }}>
        <h2>جمع‌های جامعه</h2>
        <p className="muted">میزبان دورهم، مکان واقعی، چک‌این با QR.</p>
        <EventGrid events={community} empty="هنوز دورهمی منتشر نشده. میزبان می‌تواند یکی بسازد." />
      </section>

      {cityShows.length > 0 ? (
        <section className="stack events-city-section" style={{ marginTop: 40 }}>
          <h2>تقویم شهر (هماهنگی)</h2>
          <p className="muted">
            کنسرت‌های عمومی شهر فقط برای هماهنگی دوستان است. CTA اصلی «علاقه‌مندم» داخل دورهم است — نه خروج به فروشگاه
            بلیط.
          </p>
          <EventGrid events={cityShows} empty="" />
        </section>
      ) : null}

      {pastCommunity.length > 0 ? (
        <section className="stack" style={{ marginTop: 40 }}>
          <h2>دورهمی‌های گذشته</h2>
          <EventGrid events={pastCommunity} empty="" />
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
