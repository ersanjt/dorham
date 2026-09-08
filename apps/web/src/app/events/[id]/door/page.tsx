"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { EventDoor, EventGuest } from "@dorham/shared";
import { SiteHeader } from "../../../../components/site-header";
import { api, ApiError } from "../../../../lib/api";
import { isSignedIn } from "../../../../lib/session";
import { DoorQr } from "./door-qr";

export default function DoorPage() {
  const params = useParams<{ id: string }>();
  const [door, setDoor] = useState<EventDoor | null>(null);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function reload() {
    const [nextDoor, nextGuests] = await Promise.all([
      api<EventDoor>(`/events/${params.id}/door`),
      api<EventGuest[]>(`/events/${params.id}/guests`),
    ]);
    setDoor(nextDoor);
    setGuests(nextGuests.filter((guest) => guest.status === "GOING"));
  }

  useEffect(() => {
    if (!isSignedIn()) {
      setError("برای QR در باید وارد شوی.");
      return;
    }
    reload().catch((err: unknown) => setError(err instanceof ApiError ? err.message : "QR خوانده نشد."));
  }, [params.id]);

  const due = guests.filter((guest) => guest.ticketStatus === "DUE" && !guest.checkedInAt);

  return (
    <main className="wrap">
      <SiteHeader />
      <h1>QR ورودی</h1>
      <p className="lead">این صفحه را روی میز بگذار. مهمان کد را اسکن می‌کند؛ نقد را همان‌جا بگیر.</p>
      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      {door ? (
        <section className="card" style={{ maxWidth: 420, textAlign: "center" }}>
          <h2>{door.title}</h2>
          <DoorQr url={door.url} />
          <p className="meta">
            {door.checkedInCount} از {door.goingCount} نفر وارد شده‌اند
            {door.dueCount ? ` · ${door.dueCount} بلیت دم در` : ""}
            {door.paidCount ? ` · ${door.paidCount} بلیت گرفته شد` : ""}
          </p>
          <Link className="btn ghost" href={`/events/${door.eventId}`}>
            برگشت به رویداد
          </Link>
        </section>
      ) : null}
      {due.length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2>هنوز نقد نداده‌اند</h2>
          <div className="stack">
            {due.map((guest) => (
              <article className="card guest" key={guest.id}>
                <div>
                  <strong>
                    <Link href={`/people/${guest.id}`}>{guest.displayName}</Link>
                  </strong>
                  <p className="meta">بلیت دم در</p>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={async () => {
                      try {
                        await api(`/events/${params.id}/checkin`, {
                          method: "POST",
                          body: JSON.stringify({ userId: guest.id }),
                        });
                        setNotice(`${guest.displayName} وارد شد. بلیت گرفته شد.`);
                        await reload();
                      } catch (err) {
                        setError(err instanceof ApiError ? err.message : "چک‌این نشد.");
                      }
                    }}
                  >
                    ورود + نقد گرفت
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
