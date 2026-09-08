"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EventGuest, Me, RsvpResult } from "@dorham/shared";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";

export function EventActions({
  eventId,
  hostId,
  priceTry = 0,
  initialGuests = [],
}: {
  eventId: string;
  hostId: string;
  priceTry?: number;
  initialGuests?: EventGuest[];
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [guests, setGuests] = useState<EventGuest[]>(initialGuests);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isHost = Boolean(me && (me.id === hostId || me.role === "ADMIN" || me.role === "MODERATOR"));
  const mine = guests.find((guest) => guest.id === me?.id);

  async function reloadGuests() {
    try {
      setGuests(await api<EventGuest[]>(`/events/${eventId}/guests`));
    } catch {
      /* keep current list if the browser cannot reach the API */
    }
  }

  useEffect(() => {
    setGuests(initialGuests);
  }, [initialGuests]);

  useEffect(() => {
    const ok = isSignedIn();
    setSignedIn(ok);
    if (!ok) return;
    Promise.all([api<Me>("/users/me"), api<EventGuest[]>(`/events/${eventId}/guests`)])
      .then(([profile, list]) => {
        setMe(profile);
        setGuests(list);
      })
      .catch(() => undefined);
  }, [eventId]);

  if (!signedIn) {
    return (
      <section style={{ marginTop: 28 }}>
        <div className="row">
          <Link className="btn" href={`/login?next=/events/${eventId}`}>
            برای RSVP وارد شو
          </Link>
          <Link className="btn ghost" href={`/feed?event=${eventId}`}>
            نوشتن در فید شهر
          </Link>
        </div>
        <h3>مهمان‌ها</h3>
        {guests.length === 0 ? (
          <p className="muted">هنوز کسی ثبت‌نام نکرده.</p>
        ) : (
          <div className="grid">
            {guests.map((guest) => (
              <div className="card guest" key={guest.id}>
                {guest.photoUrl ? <img src={guest.photoUrl} alt="" /> : <div className="avatar" style={{ width: 36, height: 36 }} />}
                <div>
                  <strong>
                    <Link href={`/people/${guest.id}`}>{guest.displayName}</Link>
                  </strong>
                  <div className="muted">{guest.status === "GOING" ? "می‌آید" : "لیست انتظار"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section style={{ marginTop: 28 }}>
      {mine?.status === "GOING" && mine.ticketStatus === "DUE" ? (
        <div className="banner">
          بلیت تو: {priceTry.toLocaleString("fa-IR")} لیر نقد دم در. وقتی وارد شوی، گرفته می‌شود.
        </div>
      ) : null}
      {mine?.ticketStatus === "PAID_DOOR" ? <div className="banner ok">بلیت‌ات دم در گرفته شد.</div> : null}
      {mine?.status === "INTERESTED" ? <div className="banner">در لیست انتظاری. اگر جا باز شود خبر می‌دهیم.</div> : null}
      {message ? <div className="banner ok">{message}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      <div className="row">
        <button
          className="btn"
          type="button"
          onClick={async () => {
            try {
              const data = await api<RsvpResult>(`/events/${eventId}/rsvp`, {
                method: "POST",
                body: JSON.stringify({}),
              });
              setMessage(
                data.waitlisted
                  ? "ظرفیت پر بود؛ رفتی لیست انتظار."
                  : data.ticketStatus === "DUE"
                    ? `ثبت شد. بلیت ${priceTry.toLocaleString("fa-IR")} لیر را نقد دم در بده.`
                    : "ثبت شد. می‌آیی.",
              );
              await reloadGuests();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "RSVP نشد.");
            }
          }}
        >
          می‌آیم
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={async () => {
            await api(`/events/${eventId}/rsvp`, { method: "DELETE", body: JSON.stringify({}) });
            setMessage("لغو شد. اگر کسی در انتظار بود، جایش باز شد.");
            await reloadGuests();
          }}
        >
          لغو RSVP
        </button>
        {isHost ? (
          <Link className="btn" href={`/events/${eventId}/door`}>
            QR ورودی
          </Link>
        ) : null}
        <Link className="btn ghost" href={`/feed?event=${eventId}`}>
          نوشتن در فید شهر
        </Link>
        <button
          className="btn ghost"
          type="button"
          onClick={async () => {
            try {
              await api(`/users/${hostId}/block`, { method: "POST" });
              setMessage("میزبان بلاک شد.");
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "بلاک نشد.");
            }
          }}
        >
          بلاک میزبان
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={async () => {
            try {
              await api("/reports", {
                method: "POST",
                body: JSON.stringify({ targetId: hostId, reason: "other", details: "event host" }),
              });
              setMessage("گزارش ثبت شد.");
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "گزارش نشد.");
            }
          }}
        >
          گزارش
        </button>
      </div>

      <h3>مهمان‌ها</h3>
      {guests.length === 0 ? (
        <p className="muted">هنوز کسی ثبت‌نام نکرده یا باید وارد شوی.</p>
      ) : (
        <div className="grid">
          {guests.map((guest) => (
            <div className="card guest" key={guest.id}>
              {guest.photoUrl ? <img src={guest.photoUrl} alt="" /> : <div className="avatar" style={{ width: 36, height: 36 }} />}
              <div>
                <strong>
                  <Link href={`/people/${guest.id}`}>{guest.displayName}</Link>
                </strong>
                <div className="muted">
                  {guest.status === "GOING" ? "می‌آید" : "لیست انتظار"}
                  {guest.ticketStatus === "DUE" ? " · بلیت دم در" : ""}
                  {guest.ticketStatus === "PAID_DOOR" ? " · بلیت گرفته شد" : ""}
                  {guest.verificationStatus === "VERIFIED" ? (
                    <>
                      {" "}
                      <span className="verify-badge">تأییدشده</span>
                    </>
                  ) : null}
                  {guest.checkedInAt ? " · وارد شد" : ""}
                </div>
                {isHost && guest.status === "GOING" && !guest.checkedInAt ? (
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={async () => {
                      try {
                        await api(`/events/${eventId}/checkin`, {
                          method: "POST",
                          body: JSON.stringify({ userId: guest.id }),
                        });
                        setMessage(`${guest.displayName} وارد شد.`);
                        await reloadGuests();
                      } catch (err) {
                        setError(err instanceof ApiError ? err.message : "چک‌این نشد.");
                      }
                    }}
                  >
                    ورود دستی
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
