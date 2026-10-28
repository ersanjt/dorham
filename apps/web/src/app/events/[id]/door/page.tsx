"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { EventDoor, EventGuest } from "@dorham/shared";
import { QrImage } from "../../../../components/qr-image";
import { SiteHeader } from "../../../../components/site-header";
import { useCopy } from "../../../../components/locale-provider";
import { api, ApiError } from "../../../../lib/api";
import { isSignedIn } from "../../../../lib/session";

export default function DoorPage() {
  const params = useParams<{ id: string }>();
  const copy = useCopy();
  const [door, setDoor] = useState<EventDoor | null>(null);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isSignedIn()) {
      setError(copy.door.signIn);
      return;
    }
    let stop = false;
    async function tick() {
      try {
        const [nextDoor, nextGuests] = await Promise.all([
          api<EventDoor>(`/events/${params.id}/door`),
          api<EventGuest[]>(`/events/${params.id}/guests`),
        ]);
        if (stop) return;
        setDoor(nextDoor);
        setGuests(nextGuests.filter((guest) => guest.status === "GOING"));
        setError("");
      } catch (err: unknown) {
        if (!stop) setError(err instanceof ApiError ? err.message : copy.door.loadFail);
      }
    }
    void tick();
    const timer = window.setInterval(() => void tick(), 8000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [params.id, copy.door.signIn, copy.door.loadFail]);

  const waiting = guests.filter((guest) => !guest.checkedInAt);
  const arrived = guests.filter((guest) => guest.checkedInAt);

  async function checkIn(guest: EventGuest) {
    try {
      await api(`/events/${params.id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ userId: guest.id }),
      });
      setNotice(guest.ticketStatus === "DUE" ? copy.door.paidIn(guest.displayName) : copy.door.checkedIn(guest.displayName));
      const [nextDoor, nextGuests] = await Promise.all([
        api<EventDoor>(`/events/${params.id}/door`),
        api<EventGuest[]>(`/events/${params.id}/guests`),
      ]);
      setDoor(nextDoor);
      setGuests(nextGuests.filter((row) => row.status === "GOING"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.door.checkinFail);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <h1>{copy.door.title}</h1>
      <p className="lead">{copy.door.lead}</p>
      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      {door ? (
        <>
          <section className="card" style={{ maxWidth: 420, textAlign: "center" }}>
            <h2>{door.title}</h2>
            <QrImage url={door.url} alt={copy.door.title} />
            <p className="meta">
              {copy.door.counts(door.checkedInCount, door.goingCount)}
              {door.dueCount ? copy.door.due(door.dueCount) : ""}
              {door.paidCount ? copy.door.paid(door.paidCount) : ""}
            </p>
            <p className="muted">{copy.door.secretNote}</p>
            <Link className="btn ghost" href={`/events/${door.eventId}`}>
              {copy.door.back}
            </Link>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>{copy.door.waiting}</h2>
            {waiting.length === 0 ? <p className="muted">{copy.door.waitingEmpty}</p> : null}
            <div className="stack">
              {waiting.map((guest) => (
                <article className="card guest" key={guest.id}>
                  <div>
                    <strong>
                      <Link href={`/people/${guest.id}`}>{guest.displayName}</Link>
                    </strong>
                    <p className="meta">
                      {guest.ticketStatus === "DUE"
                        ? copy.door.ticketDue
                        : guest.ticketStatus === "PAID_DOOR"
                          ? copy.door.ticketPaid
                          : copy.door.ticketFree}
                    </p>
                    <button className="btn ghost" type="button" onClick={() => void checkIn(guest)}>
                      {guest.ticketStatus === "DUE" ? copy.door.manualPaid : copy.door.manual}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {arrived.length > 0 ? (
            <section style={{ marginTop: 32 }}>
              <h2>{copy.door.arrived}</h2>
              <div className="stack">
                {arrived.map((guest) => (
                  <article className="card guest" key={guest.id}>
                    <strong>
                      <Link href={`/people/${guest.id}`}>{guest.displayName}</Link>
                    </strong>
                    <p className="meta">
                      {guest.ticketStatus === "PAID_DOOR" ? copy.door.arrivedPaid : copy.door.arrivedFree}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
