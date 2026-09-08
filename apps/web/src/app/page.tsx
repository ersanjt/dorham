import Link from "next/link";
import type { EventDto, FeedPost } from "@dorham/shared";
import { EventCard } from "../components/event-card";
import { FeedPostCard } from "../components/feed-post";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function loadFeed(): Promise<FeedPost[]> {
  try {
    const res = await fetch(`${API}/v1/feed?city=istanbul&limit=2`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: FeedPost[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function loadEvents(): Promise<EventDto[]> {
  try {
    const res = await fetch(`${API}/v1/events?city=istanbul&limit=3`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [events, posts] = await Promise.all([loadEvents(), loadFeed()]);
  const next = events[0];

  return (
    <main className="wrap">
      <SiteHeader />

      <section className="hero">
        <p className="kicker">جامعهٔ ایرانی · استانبول</p>
        <h1>دورهم، توی همین شهر</h1>
        <p className="lead">
          برای ایرانی‌های ترکیه. اول استانبول. جمعه دور هم جمع می‌شویم — نه اینکه بی‌نهایت کارت سوایپ کنیم.
        </p>
        <div className="row">
          <Link className="btn" href={next ? `/events/${next.id}` : "/events"}>
            {next ? "رویداد بعدی" : "رویدادها"}
          </Link>
          <Link className="btn ghost" href="/feed">
            فید شهر
          </Link>
          <Link className="btn ghost" href="/venues">
            رستوران و کافه ایرانی
          </Link>
          <Link className="btn ghost" href="/get-app">
            اپ گوشی
          </Link>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <p className="kicker">حضوری</p>
          <h3>رویداد شهری</h3>
          <p className="muted">بهانهٔ حضوری. کافه، پیاده‌روی، شب شعر. مهمان‌لیست واقعی.</p>
        </article>
        <article className="card">
          <p className="kicker">اعتماد</p>
          <h3>آدم تأییدشده</h3>
          <p className="muted">عکس دست‌نویس. نشان زعفرانی. بدون پروفایل فیک نزدیک.</p>
        </article>
        <article className="card">
          <p className="kicker">بعداً</p>
          <h3>دیتینگ بعداً</h3>
          <p className="muted">یک تب اختیاری، وقتی جامعه زنده شد. نه صفحهٔ اول.</p>
        </article>
      </section>

      {posts.length > 0 ? (
        <section>
          <div className="section-head">
            <p className="kicker">خبر شهر</p>
            <h2>حرف‌های این هفته</h2>
          </div>
          <div className="stack">
            {posts.map((post) => (
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

      <section id="events">
        <div className="section-head">
          <p className="kicker">صفحهٔ اول دورهم</p>
          <h2>این هفته در استانبول</h2>
        </div>
        {events.length === 0 ? (
          <p className="muted">هنوز رویدادی از API نرسیده. API را روشن کن یا جمعهٔ اول را بساز.</p>
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
              />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
