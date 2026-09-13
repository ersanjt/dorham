import Link from "next/link";
import type { EventDto } from "@dorham/shared";
import { EventCard } from "../../components/event-card";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { resolveApiBase } from "../../lib/api-base";

const API = resolveApiBase();

async function loadEvents(when: "upcoming" | "past"): Promise<EventDto[]> {
  try {
    const res = await fetch(`${API}/v1/events?city=istanbul&when=${when}&limit=40`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

function EventGrid({ events }: { events: EventDto[] }) {
  if (events.length === 0) return <p className="muted">موردی نیست.</p>;
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
            externalTicketUrl: event.externalTicketUrl,
          }}
          cta="جزئیات"
        />
      ))}
    </div>
  );
}

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([loadEvents("upcoming"), loadEvents("past")]);
  const community = upcoming.filter((e) => e.kind !== "CITY_SHOW");
  const cityShows = upcoming.filter((e) => e.kind === "CITY_SHOW");

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="صفحهٔ اول دورهم" title="رویدادهای استانبول">
        <p className="lead">
          دورهمی‌های جامعه با RSVP و دمِ در — به‌علاوه تقویم کنسرت‌های شهر برای هماهنگی دوستان (بلیط جدا).
        </p>
        <p className="muted">
          <Link href="/events/new">ثبت دورهمی</Link> فقط برای میزبان.
        </p>
      </PageIntro>

      <section className="stack" style={{ marginTop: 8 }}>
        <h2>دورهمی‌های جامعه</h2>
        <EventGrid events={community} />
      </section>

      <section className="stack" style={{ marginTop: 32 }}>
        <h2>کنسرت و شوهای شهر</h2>
        <p className="muted">کشف و هماهنگی — دورهم فروشندهٔ بلیط آرنا نیست.</p>
        <EventGrid events={cityShows} />
      </section>

      <section className="stack" style={{ marginTop: 32 }}>
        <h2>گذشتهٔ اخیر</h2>
        <EventGrid events={past} />
      </section>

      <SiteFooter />
    </main>
  );
}
