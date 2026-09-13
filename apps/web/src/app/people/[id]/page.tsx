import { notFound } from "next/navigation";
import Link from "next/link";
import type { EventDto, PublicUser } from "@dorham/shared";
import { EventCard } from "../../../components/event-card";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { resolveApiBase } from "../../../lib/api-base";
import { verifyFa } from "../../../lib/format";

const API = resolveApiBase();

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
  const memberSince = new Date(person.createdAt).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
  });

  return (
    <main className="wrap profile-page">
      <SiteHeader />

      <header className="profile-hero">
        <div className="profile-hero-cover" aria-hidden />
        <div className="profile-hero-body">
          <div className="profile-avatar-wrap">
            {person.photoUrl ? (
              <img className="profile-avatar" src={person.photoUrl} alt="" />
            ) : (
              <div className="profile-avatar profile-avatar-empty" aria-hidden>
                {person.displayName.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="profile-hero-meta">
            <div className="profile-name-row">
              <h1 className="profile-name">{person.displayName}</h1>
              {person.verificationStatus === "VERIFIED" ? (
                <span className="verify-badge">{verifyFa.VERIFIED}</span>
              ) : (
                <span className="badge">{verifyFa[person.verificationStatus] ?? person.verificationStatus}</span>
              )}
            </div>
            <p className="profile-sub">
              {cityLabel} · عضو از {memberSince}
            </p>
            <p className="profile-bio-preview">{person.bio?.trim() || "هنوز معرفی عمومی ننوشته."}</p>
            <p className="muted" style={{ marginTop: 8 }}>
              ایمیل در پروفایل عمومی نیست.
            </p>
          </div>
        </div>
      </header>

      {person.stats ? (
        <section className="profile-panel">
          <div className="account-stats profile-stats">
            <div className="account-stat">
              <strong>{person.stats.venuesVisited.toLocaleString("fa-IR")}</strong>
              <span>مکان تأییدشده</span>
            </div>
            <div className="account-stat">
              <strong>{person.stats.eventsAttended.toLocaleString("fa-IR")}</strong>
              <span>رویداد</span>
            </div>
            <div className="account-stat">
              <strong>{person.stats.eventsHosted.toLocaleString("fa-IR")}</strong>
              <span>میزبانی</span>
            </div>
          </div>
        </section>
      ) : null}

      {person.venuesVisited && person.venuesVisited.length > 0 ? (
        <section className="profile-panel">
          <h2>مکان‌های تأییدشده</h2>
          <ul className="account-history profile-history">
            {person.venuesVisited.map((v) => (
              <li key={v.venueId}>
                <Link href={`/venues/${v.venueSlug}`}>{v.venueName}</Link>
                <span className="muted"> · {v.visitCount.toLocaleString("fa-IR")} بار</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="profile-panel">
        <h2>جمعه‌های این میزبان</h2>
        {hosted.length > 0 ? (
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
        ) : (
          <p className="muted">
            هنوز رویدادی میزبانی نکرده. <Link href="/events">رویدادهای استانبول</Link>
          </p>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
