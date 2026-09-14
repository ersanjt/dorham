import { notFound } from "next/navigation";
import Link from "next/link";
import type { EventDto, PublicUser } from "@dorham/shared";
import { EventCard } from "../../../components/event-card";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { resolveApiBase } from "../../../lib/api-base";
import { formatDayChip, formatMemberSince, verifyFa } from "../../../lib/format";
import { publicMediaUrl } from "../../../lib/media-url";
import { AREA_LABEL } from "../../../lib/venues";

const API = resolveApiBase();

const INTENT_FA: Record<string, string> = {
  LUNCH: "ناهار",
  DINNER: "شام",
  COFFEE: "قهوه",
  OTHER: "دورهم",
};

async function loadPerson(id: string): Promise<PublicUser | null> {
  try {
    const res = await fetch(`${API}/v1/users/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: PublicUser };
    return json.data;
  } catch {
    return null;
  }
}

async function loadHosted(id: string): Promise<EventDto[]> {
  try {
    const res = await fetch(`${API}/v1/events?city=istanbul&hostId=${id}&limit=20`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: EventDto[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [person, hosted] = await Promise.all([loadPerson(id), loadHosted(id)]);
  if (!person) notFound();

  const cityLabel = person.city === "istanbul" ? "استانبول" : person.city === "ankara" ? "آنکارا" : "ازمیر";
  const memberSince = formatMemberSince(person.createdAt);
  const photo = publicMediaUrl(person.photoUrl);
  const verified = person.verificationStatus === "VERIFIED";
  const stats = person.stats;
  const hasStats = Boolean(
    stats && (stats.venuesVisited > 0 || stats.eventsAttended > 0 || stats.eventsHosted > 0),
  );
  const venues = person.venuesVisited ?? [];
  const attended = person.eventsAttended ?? [];
  const hangPlans = person.hangPlans ?? [];

  return (
    <main className="wrap person-page">
      <SiteHeader />

      <header className="person-hero">
        <div className="person-hero-main">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="person-avatar" src={photo} alt="" />
          ) : (
            <div className="person-avatar person-avatar-empty" aria-hidden>
              {person.displayName.slice(0, 1)}
            </div>
          )}
          <div className="person-hero-copy">
            <div className="person-name-row">
              <h1 className="person-name">{person.displayName}</h1>
              {verified ? <span className="verify-badge">{verifyFa.VERIFIED}</span> : null}
            </div>
            <p className="person-sub">
              {cityLabel} · عضو از {memberSince}
            </p>
            <p className="person-bio">{person.bio?.trim() || "هنوز معرفی عمومی ننوشته — حضورش در شهر مهم‌تر است."}</p>
            {!verified ? (
              <p className="muted person-trust-note">تأیید دست‌نویس عمومی نیست؛ فقط اگر تأیید شده باشد نشان کوچک دیده می‌شود.</p>
            ) : (
              <p className="muted person-trust-note">تأیید دست‌نویس دورهم (نه کارت ملی) · بدون سوایپ.</p>
            )}
          </div>
        </div>
      </header>

      {hasStats ? (
        <section className="person-stats" aria-label="حضور در شهر">
          <div className="person-stat">
            <strong>{stats!.venuesVisited.toLocaleString("fa-IR")}</strong>
            <span>مکان تأییدشده</span>
          </div>
          <div className="person-stat">
            <strong>{stats!.eventsAttended.toLocaleString("fa-IR")}</strong>
            <span>حضور در رویداد</span>
          </div>
          <div className="person-stat">
            <strong>{stats!.eventsHosted.toLocaleString("fa-IR")}</strong>
            <span>میزبانی</span>
          </div>
        </section>
      ) : (
        <section className="person-empty-strip">
          <p className="muted">هنوز حضور تأییدشده‌ای ثبت نشده. دورهم با آدم‌های واقعی در شهر ساخته می‌شود.</p>
          <div className="row">
            <Link className="btn ghost" href="/events">
              رویدادهای استانبول
            </Link>
            <Link className="btn ghost" href="/venues">
              مکان‌ها
            </Link>
          </div>
        </section>
      )}

      {hangPlans.length > 0 ? (
        <section className="person-panel">
          <h2>برنامه‌های پیش رو</h2>
          <ul className="person-list">
            {hangPlans.map((plan) => (
              <li key={plan.id}>
                <Link href={`/venues/${plan.venueSlug}`}>
                  {plan.venueName}
                  <span className="muted">
                    {" "}
                    · {INTENT_FA[plan.intent] ?? plan.intent} · {formatDayChip(plan.startsAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {venues.length > 0 ? (
        <section className="person-panel">
          <h2>مکان‌های تأییدشده</h2>
          <ul className="person-chips">
            {venues.map((v) => (
              <li key={v.venueId}>
                <Link href={`/venues/${v.venueSlug}`}>
                  {v.venueName}
                  <span className="muted">
                    {" "}
                    · {AREA_LABEL[v.venueArea] ?? v.venueArea} · {v.visitCount.toLocaleString("fa-IR")}×
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {attended.length > 0 ? (
        <section className="person-panel">
          <h2>رویدادهایی که آمده</h2>
          <ul className="person-list">
            {attended.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`}>
                  {event.title}
                  <span className="muted">
                    {" "}
                    · {formatDayChip(event.startsAt)}
                    {event.venue ? ` · ${event.venue}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hosted.length > 0 ? (
        <section className="person-panel">
          <h2>رویدادهایی که میزبانی کرده</h2>
          <div className="grid">
            {hosted.map((event) => (
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
        </section>
      ) : null}

      {!hasStats && venues.length === 0 && attended.length === 0 && hosted.length === 0 && hangPlans.length === 0 ? (
        <section className="person-panel">
          <h2>در شهر</h2>
          <p className="muted">
            این عضو هنوز ردپایی از حضور ثبت نکرده. <Link href="/events">رویداد بعدی استانبول</Link> را ببین.
          </p>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
