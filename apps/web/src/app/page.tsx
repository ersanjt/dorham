import Link from "next/link";
import type { EventDto, FeedPost, VenueHangPlanDto } from "@dorham/shared";
import { EventCard } from "../components/event-card";
import { FeedPostCard } from "../components/feed-post";
import { ShareEvent } from "../components/share-event";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { eventInviteText, eventPageUrl, formatDayChip, formatPriceTry } from "../lib/format";
import { resolveApiBase } from "../lib/api-base";
import { publicMediaUrl } from "../lib/media-url";

const API = resolveApiBase();

const INTENT_FA: Record<string, string> = {
  LUNCH: "ناهار",
  DINNER: "شام",
  COFFEE: "قهوه",
  OTHER: "دورهم",
};

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
    const res = await fetch(`${API}/v1/events?city=istanbul&kind=COMMUNITY&limit=4`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function loadCityShows(): Promise<EventDto[]> {
  try {
    const res = await fetch(`${API}/v1/events?city=istanbul&kind=CITY_SHOW&limit=4`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function loadHangPlans(): Promise<VenueHangPlanDto[]> {
  try {
    const res = await fetch(`${API}/v1/venues/hang-plans?city=istanbul&limit=8`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: VenueHangPlanDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
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
        <p className="kicker">جامعهٔ ایرانی · استانبول</p>
        <h1>دورهم، توی همین شهر</h1>
        <p className="lead">
          جایی که ایرانی‌های استانبول برای رویداد، کافه و آدم واقعی برمی‌گردند — نه برای سوایپ بی‌پایان.
        </p>
        <div className="hero-visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero.png" alt="" />
        </div>
        <div className="row">
          <Link className="btn" href={next ? `/events/${next.id}` : showCityCalendar ? "/events#city-calendar" : "/events"}>
            {next ? "رویداد بعدی" : showCityCalendar ? "تقویم شهر" : "رویدادهای شهر"}
          </Link>
          <Link className="btn ghost" href="/venues">
            مکان‌ها و هماهنگی
          </Link>
        </div>
      </section>

      <section id="events">
        <div className="section-head">
          <p className="kicker">حلقهٔ برگشت</p>
          <h2>این هفته در استانبول</h2>
        </div>
        {next ? (
          <article className="card" style={{ marginBottom: 24 }}>
            <p className="kicker">رویداد بعدی</p>
            <h3 style={{ marginTop: 0 }}>{next.title}</h3>
            <p className="muted">
              {formatDayChip(next.startsAt)}
              {next.venue ? ` · ${next.venue}` : ""}
              {" · "}
              {formatPriceTry(next.priceTry)}
            </p>
            <p className="muted">
              {next.goingCount === 0
                ? next.capacity
                  ? `ظرفیت ${next.capacity.toLocaleString("fa-IR")} نفر · هنوز کسی ثبت نکرده`
                  : "هنوز کسی ثبت نکرده"
                : `${next.goingCount.toLocaleString("fa-IR")}${
                    next.capacity ? ` از ${next.capacity.toLocaleString("fa-IR")}` : ""
                  } نفر می‌آیند`}
            </p>
            <div className="row">
              <Link className="btn" href={`/events/${next.id}`}>
                جزئیات و ثبت حضور
              </Link>
              <ShareEvent title={next.title} text={eventInviteText(next)} url={eventPageUrl(next.id)} />
            </div>
          </article>
        ) : null}
        {events.length === 0 ? (
          showCityCalendar ? (
            <div>
              <p className="muted" style={{ marginBottom: 16 }}>
                هنوز رویداد انجمن ثبت نشده. تا آن موقع این‌ها از تقویم شهر هستند — دورهم رویداد جعلی نمی‌سازد.
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
                  />
                ))}
              </div>
              <div className="row" style={{ marginTop: 16 }}>
                <Link className="btn" href="/events#city-calendar">
                  همه تقویم شهر
                </Link>
                <Link className="btn ghost" href="/events/new">
                  میزبانی رویداد انجمن
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-art card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/empty-events.png" alt="" />
              <p className="muted">
                هنوز رویدادی برای این هفته ثبت نشده. دورهم رویداد جعلی نمی‌سازد — تا آن موقع از مکان‌ها و هماهنگی
                حضور شروع کن.
              </p>
              <div className="row" style={{ marginTop: 12 }}>
                <Link className="btn" href="/venues">
                  مکان‌های ایرانی
                </Link>
                <Link className="btn ghost" href="/events/new">
                  میزبانی رویداد
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
              />
            ))}
          </div>
        ) : null}
      </section>

      {hangPlans.length > 0 ? (
        <section className="home-hangs">
          <div className="section-head">
            <p className="kicker">هماهنگی</p>
            <h2>کی کجاست؟</h2>
          </div>
          <p className="muted">برنامهٔ حضور در کافه و رستوران — ببین و بپیوند. زندهٔ GPS نیست.</p>
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
                        · {INTENT_FA[plan.intent] ?? plan.intent} در {plan.venueName}
                        {plan.venueArea ? ` · ${plan.venueArea}` : ""} · {formatDayChip(plan.startsAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p style={{ marginTop: 12 }}>
            <Link className="card-cta" href="/venues">
              همه مکان‌ها
            </Link>
          </p>
        </section>
      ) : null}

      {cityNotes.length > 0 ? (
        <section>
          <div className="section-head">
            <p className="kicker">خبر شهر</p>
            <h2>حرف‌های این هفته</h2>
          </div>
          <div className="stack">
            {cityNotes.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
          </div>
          <p style={{ marginTop: 16 }}>
            <Link className="card-cta" href="/feed">
              فید کامل شهر
            </Link>
          </p>
        </section>
      ) : null}

      <section className="home-why">
        <div className="section-head">
          <p className="kicker">چرا دورهم</p>
          <h2>سه دلیل برگشتن</h2>
        </div>
        <div className="home-why-grid">
          <article>
            <h3>رویداد شهری</h3>
            <p className="muted">جمعه و بهانه‌های حضوری. مهمان‌لیست واقعی، نه کارت سوایپ.</p>
          </article>
          <article>
            <h3>هماهنگی مکان</h3>
            <p className="muted">بگو کی می‌آیی کافه؛ بقیه ببینند و بپیوندند.</p>
          </article>
          <article>
            <h3>آدم تأییدشده</h3>
            <p className="muted">عکس دست‌نویس و نشان زعفرانی. اعتماد برای ماندن زنان و خانواده‌ها.</p>
          </article>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
