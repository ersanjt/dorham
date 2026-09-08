import type { EventDto } from "@dorham/shared";
import { EventCard } from "../../components/event-card";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function loadEvents(): Promise<EventDto[]> {
  try {
    const res = await fetch(`${API}/v1/events?city=istanbul&limit=20`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function EventsPage() {
  const events = await loadEvents();
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="صفحهٔ اول دورهم" title="رویدادهای استانبول">
        <p className="lead">بهانهٔ حضوری. مهمان‌لیست واقعی — نه کارت سوایپ.</p>
      </PageIntro>
      {events.length === 0 ? (
        <p className="muted">هنوز رویدادی منتشر نشده.</p>
      ) : (
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
              }}
              cta="جزئیات"
            />
          ))}
        </div>
      )}
      <SiteFooter />
    </main>
  );
}
