import Link from "next/link";
import type { EventDto, FeedPost, VenueHangPlanDto } from "@dorham/shared";
import { EventCard } from "../components/event-card";
import { HeroJoin } from "../components/hero-join";
import { FeedPostCard } from "../components/feed-post";
import { ShareEvent } from "../components/share-event";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { t } from "../lib/copy";
import { eventInviteText, eventPageUrl, formatDayChip, formatPriceTry } from "../lib/format";
import { resolveApiBase } from "../lib/api-base";
import { catalogInit } from "../lib/catalog-fetch";
import { getLocale } from "../lib/locale-server";
import { publicMediaUrl } from "../lib/media-url";

const API = resolveApiBase();

async function loadFeed(): Promise<FeedPost[]> {
  try {
    const res = await fetch(`${API}/v1/feed?city=istanbul&limit=4`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: FeedPost[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function loadEvents(): Promise<EventDto[]> {
  try {
    const res = await fetch(`${API}/v1/events?city=istanbul&kind=COMMUNITY&limit=4`, catalogInit());
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function loadCityShows(): Promise<EventDto[]> {
  try {
    const res = await fetch(`${API}/v1/events?city=istanbul&kind=CITY_SHOW&limit=4`, catalogInit());
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function loadHangPlans(): Promise<VenueHangPlanDto[]> {
  try {
    const res = await fetch(`${API}/v1/venues/hang-plans?city=istanbul&limit=8`, catalogInit());
    if (!res.ok) return [];
    const json = (await res.json()) as { data: VenueHangPlanDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const locale = await getLocale();
  const copy = t(locale);
  const digits = locale === "en" ? "en-GB" : "fa-IR";
  const [events, cityShows, posts, hangPlans] = await Promise.all([
    loadEvents(),
    loadCityShows(),
    loadFeed(),
    loadHangPlans(),
  ]);
  const next = events[0];
  const more = events.slice(1);
  const cityNotes = posts.filter((post) => post.body.trim().length >= 40).slice(0, 3);
  const showCityCalendar = events.length === 0 && cityShows.length > 0;

  return (
    <main className="wrap">
      <SiteHeader />

      <section className="hero">
        <p className="kicker">{copy.home.kicker}</p>
        <h1>{copy.home.title}</h1>
        <p className="lead">{copy.home.lead}</p>
        <div className="hero-visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero.png" alt="" />
        </div>
        <HeroJoin
          primaryHref={next ? `/events/${next.id}` : showCityCalendar ? "/events#city-calendar" : "/events"}
          primaryLabel={next ? copy.home.nextEvent : showCityCalendar ? copy.home.cityCalendar : copy.home.cityEvents}
          venuesLabel={copy.home.venuesCta}
        />
      </section>

      <section id="events">
        <div className="section-head">
          <p className="kicker">{copy.home.weekKicker}</p>
          <h2>{copy.home.weekTitle}</h2>
        </div>
        {next ? (
          <article className="card" style={{ marginBottom: 24 }}>
            <p className="kicker">{copy.home.nextEvent}</p>
            <h3 style={{ marginTop: 0 }}>{next.title}</h3>
            <p className="muted">
              {formatDayChip(next.startsAt, locale)}
              {next.venue ? ` · ${next.venue}` : ""}
              {" · "}
              {formatPriceTry(next.priceTry, locale)}
            </p>
            <p className="muted">
              {next.goingCount === 0
                ? next.capacity
                  ? copy.home.goingNoneCap(next.capacity.toLocaleString(digits))
                  : copy.home.goingNone
                : copy.home.going(
                    next.goingCount.toLocaleString(digits),
                    next.capacity ? next.capacity.toLocaleString(digits) : undefined,
                  )}
            </p>
            <div className="row">
              <Link className="btn" href={`/events/${next.id}`}>
                {copy.home.details}
              </Link>
              <ShareEvent title={next.title} text={eventInviteText(next, locale)} url={eventPageUrl(next.id)} />
            </div>
          </article>
        ) : null}
        {events.length === 0 ? (
          showCityCalendar ? (
            <div>
              <p className="muted" style={{ marginBottom: 16 }}>
                {copy.home.noCommunity}
              </p>
              <div className="grid">
                {cityShows.map((event) => (
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
                    locale={locale}
                  />
                ))}
              </div>
              <div className="row" style={{ marginTop: 16 }}>
                <Link className="btn" href="/events#city-calendar">
                  {copy.home.allCityCal}
                </Link>
                <Link className="btn ghost" href="/events/new">
                  {copy.home.hostCommunity}
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-art card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/empty-events.png" alt="" />
              <p className="muted">{copy.home.emptyWeek}</p>
              <div className="row" style={{ marginTop: 12 }}>
                <Link className="btn" href="/venues">
                  {copy.home.iranianPlaces}
                </Link>
                <Link className="btn ghost" href="/events/new">
                  {copy.home.hostEvent}
                </Link>
              </div>
            </div>
          )
        ) : more.length > 0 ? (
          <div className="grid">
            {more.map((event) => (
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
                    locale={locale}
                  />
            ))}
          </div>
        ) : null}
      </section>

      {hangPlans.length > 0 ? (
        <section className="home-hangs">
          <div className="section-head">
            <p className="kicker">{copy.home.hangKicker}</p>
            <h2>{copy.home.hangTitle}</h2>
          </div>
          <p className="muted">{copy.home.hangLead}</p>
          <ul className="home-hang-list">
            {hangPlans.map((plan) => {
              const photo = publicMediaUrl(plan.user.photoUrl);
              return (
                <li key={plan.id}>
                  <Link className="home-hang-row" href={`/venues/${plan.venueSlug}`}>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" />
                    ) : (
                      <span className="hang-avatar-fallback" aria-hidden>
                        {plan.user.displayName.slice(0, 1)}
                      </span>
                    )}
                    <span>
                      <strong>{plan.user.displayName}</strong>
                      <span className="muted">
                        {" "}
                        · {copy.intent[plan.intent as keyof typeof copy.intent] ?? plan.intent} {copy.home.hangAt}{" "}
                        {plan.venueName}
                        {plan.venueArea ? ` · ${plan.venueArea}` : ""} · {formatDayChip(plan.startsAt, locale)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p style={{ marginTop: 12 }}>
            <Link className="card-cta" href="/venues">
              {copy.home.allVenues}
            </Link>
          </p>
        </section>
      ) : null}

      {cityNotes.length > 0 ? (
        <section>
          <div className="section-head">
            <p className="kicker">{copy.home.notesKicker}</p>
            <h2>{copy.home.notesTitle}</h2>
          </div>
          <div className="stack">
            {cityNotes.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
          </div>
          <p style={{ marginTop: 16 }}>
            <Link className="card-cta" href="/feed">
              {copy.home.fullFeed}
            </Link>
          </p>
        </section>
      ) : null}

      <section className="home-why">
        <div className="section-head">
          <p className="kicker">{copy.home.whyKicker}</p>
          <h2>{copy.home.whyTitle}</h2>
        </div>
        <div className="home-why-grid">
          <article>
            <h3>{copy.home.whyEventTitle}</h3>
            <p className="muted">{copy.home.whyEvent}</p>
          </article>
          <article>
            <h3>{copy.home.whyHangTitle}</h3>
            <p className="muted">{copy.home.whyHang}</p>
          </article>
          <article>
            <h3>{copy.home.whyVerifyTitle}</h3>
            <p className="muted">{copy.home.whyVerify}</p>
          </article>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
