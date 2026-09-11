import { notFound } from "next/navigation";
import Link from "next/link";
import type { EventDto, PublicUser } from "@dorham/shared";
import { EventCard } from "../../../components/event-card";
import { PageIntro } from "../../../components/page-intro";
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

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="عضو شهر" title={person.displayName}>
        <p className="lead">استانبول. ایمیل اینجا نیست.</p>
      </PageIntro>
      <article className="card">
        {person.photoUrl ? <img className="avatar" src={person.photoUrl} alt="" /> : <div className="avatar" />}
        <p>
          {person.verificationStatus === "VERIFIED" ? (
            <span className="verify-badge">{verifyFa.VERIFIED}</span>
          ) : (
            <span className="badge">{verifyFa[person.verificationStatus] ?? person.verificationStatus}</span>
          )}
        </p>
        <p className="prose">{person.bio || "هنوز معرفی ننوشته."}</p>
      </article>
      {hosted.length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2>جمعه‌های این میزبان</h2>
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
                }}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="muted" style={{ marginTop: 24 }}>
          هنوز رویدادی میزبانی نکرده. <Link href="/events">رویدادهای استانبول</Link>
        </p>
      )}
      <SiteFooter />
    </main>
  );
}
