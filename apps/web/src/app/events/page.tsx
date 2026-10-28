import Link from "next/link";
import type { EventDto } from "@dorham/shared";
import { CityCalendarList, EventCard } from "../../components/event-card";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { catalogInit } from "../../lib/catalog-fetch";
import { t } from "../../lib/copy";
import { getLocale } from "../../lib/locale-server";
import { resolveApiBase } from "../../lib/api-base";

const API = resolveApiBase();

async function loadEvents(when: "upcoming" | "past", kind?: "COMMUNITY" | "CITY_SHOW"): Promise<EventDto[]> {
  try {
    const q = new URLSearchParams({ city: "istanbul", when, limit: "40" });
    if (kind) q.set("kind", kind);
    const res = await fetch(`${API}/v1/events?${q}`, catalogInit());
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
  const locale = await getLocale();
  const copy = t(locale);
  const [community, cityShows, pastCommunity] = await Promise.all([
    loadEvents("upcoming", "COMMUNITY"),
    loadEvents("upcoming", "CITY_SHOW"),
    loadEvents("past", "COMMUNITY"),
  ]);
  const attendedPast = pastCommunity.filter((event) => event.goingCount > 0);

  return (
    <main className="wrap events-page">
      <SiteHeader />
      <PageIntro kicker={copy.events.kicker} title={copy.events.title}>
        <p className="lead">{copy.events.lead}</p>
        <div className="row events-intro-actions">
          <Link className="btn" href="/events/new">
            {copy.events.hostCta}
          </Link>
          <Link className="btn ghost" href="/venues">
            {copy.events.venuesCta}
          </Link>
        </div>
      </PageIntro>

      <section className="events-block" aria-labelledby="community-heading">
        <div className="section-head events-block-head">
          <p className="kicker">{copy.events.frontKicker}</p>
          <h2 id="community-heading">{copy.events.communityTitle}</h2>
          <p className="muted">{copy.events.communityLead}</p>
        </div>
        {community.length === 0 ? (
          <div className="events-empty">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="events-empty-mark" src="/brand/empty-events.png" alt="" width={120} height={120} />
            <p className="muted">{copy.events.empty}</p>
            <div className="row">
              <Link className="btn" href="/events/new">
                {copy.events.create}
              </Link>
              {cityShows.length > 0 ? (
                <a className="btn ghost" href="#city-calendar">
                  {copy.events.cityCal}
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="events-grid">
            {community.map((event) => (
              <EventCard key={event.id} event={toCard(event)} locale={locale} />
            ))}
          </div>
        )}
      </section>

      {cityShows.length > 0 ? (
        <section className="events-block events-city-block" id="city-calendar" aria-labelledby="city-heading">
          <div className="section-head events-block-head">
            <p className="kicker">{copy.events.coordKicker}</p>
            <h2 id="city-heading">{copy.events.cityCal}</h2>
            <p className="muted">{copy.events.cityLead}</p>
          </div>
          <CityCalendarList events={cityShows.map(toCard)} locale={locale} />
        </section>
      ) : null}

      {attendedPast.length > 0 ? (
        <section className="events-block" aria-labelledby="past-heading">
          <div className="section-head events-block-head">
            <p className="kicker">{copy.events.archiveKicker}</p>
            <h2 id="past-heading">{copy.events.pastTitle}</h2>
          </div>
          <div className="events-grid events-grid-past">
            {attendedPast.map((event) => (
              <EventCard key={event.id} event={toCard(event)} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
