"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EventGuest, Me, RsvpResult } from "@dorham/shared";
import { api, ApiError } from "../../../lib/api";
import { publicMediaUrl } from "../../../lib/media-url";
import { isSignedIn } from "../../../lib/session";

function GuestRow({
  guest,
  cityShow,
  isHost,
  eventId,
  onCheckedIn,
  onError,
}: {
  guest: EventGuest;
  cityShow: boolean;
  isHost: boolean;
  eventId: string;
  onCheckedIn: (name: string) => void;
  onError: (msg: string) => void;
}) {
  const photo = publicMediaUrl(guest.photoUrl);
  return (
    <li className="guest-row">
      <Link className="guest-row-link" href={`/people/${guest.id}`}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" />
        ) : (
          <span className="guest-avatar-fallback" aria-hidden>
            {guest.displayName.slice(0, 1)}
          </span>
        )}
        <span className="guest-row-meta">
          <strong>{guest.displayName}</strong>
          {guest.verificationStatus === "VERIFIED" ? <span className="verify-badge">تأییدشده</span> : null}
          <span className="muted">
            {cityShow
              ? "علاقه‌مند"
              : guest.status === "GOING"
                ? guest.checkedInAt
                  ? "وارد شد"
                  : "می‌آید"
                : "لیست انتظار"}
            {!cityShow && guest.ticketStatus === "DUE" ? " · بلیت دم در" : ""}
            {!cityShow && guest.ticketStatus === "PAID_DOOR" ? " · بلیت گرفته شد" : ""}
          </span>
        </span>
      </Link>
      {isHost && !cityShow && guest.status === "GOING" && !guest.checkedInAt ? (
        <button
          className="btn ghost"
          type="button"
          onClick={async () => {
            try {
              await api(`/events/${eventId}/checkin`, {
                method: "POST",
                body: JSON.stringify({ userId: guest.id }),
              });
              onCheckedIn(guest.displayName);
            } catch (err) {
              onError(err instanceof ApiError ? err.message : "چک‌این نشد.");
            }
          }}
        >
          ورود
        </button>
      ) : null}
    </li>
  );
}

function GuestSections({
  guests,
  cityShow,
  isHost,
  eventId,
  onReload,
  setMessage,
  setError,
}: {
  guests: EventGuest[];
  cityShow: boolean;
  isHost: boolean;
  eventId: string;
  onReload: () => Promise<void>;
  setMessage: (s: string) => void;
  setError: (s: string) => void;
}) {
  const going = useMemo(() => guests.filter((g) => g.status === "GOING"), [guests]);
  const wait = useMemo(() => guests.filter((g) => g.status === "INTERESTED"), [guests]);
  const checkedIn = going.filter((g) => g.checkedInAt).length;

  if (guests.length === 0) {
    return (
      <div className="guest-empty">
        <p className="muted">
          {cityShow ? "هنوز کسی علاقه‌مندی نزده." : "هنوز کسی ثبت‌نام نکرده. اولین نفر باش یا دعوت کن."}
        </p>
        <div className="row">
          <Link className="btn ghost" href="/venues">
            هماهنگی در مکان‌ها
          </Link>
          <Link className="btn ghost" href="/feed">
            فید شهر
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-sections">
      {!cityShow ? (
        <p className="meta guest-summary">
          {going.length.toLocaleString("fa-IR")} می‌آیند
          {wait.length > 0 ? ` · ${wait.length.toLocaleString("fa-IR")} در انتظار` : ""}
          {checkedIn > 0 ? ` · ${checkedIn.toLocaleString("fa-IR")} وارد شده` : ""}
        </p>
      ) : (
        <p className="meta guest-summary">{wait.length.toLocaleString("fa-IR")} علاقه‌مند</p>
      )}

      {(cityShow ? wait : going).length > 0 ? (
        <>
          <h4>{cityShow ? "علاقه‌مندان" : "می‌آیند"}</h4>
          <ul className="guest-list">
            {(cityShow ? wait : going).map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                cityShow={cityShow}
                isHost={isHost}
                eventId={eventId}
                onCheckedIn={async (name) => {
                  setMessage(`${name} وارد شد.`);
                  await onReload();
                }}
                onError={setError}
              />
            ))}
          </ul>
        </>
      ) : null}

      {!cityShow && wait.length > 0 ? (
        <>
          <h4>لیست انتظار</h4>
          <ul className="guest-list">
            {wait.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                cityShow={cityShow}
                isHost={isHost}
                eventId={eventId}
                onCheckedIn={async (name) => {
                  setMessage(`${name} وارد شد.`);
                  await onReload();
                }}
                onError={setError}
              />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

export function EventActions({
  eventId,
  hostId,
  priceTry = 0,
  initialGuests = [],
  kind = "COMMUNITY",
}: {
  eventId: string;
  hostId: string;
  priceTry?: number;
  initialGuests?: EventGuest[];
  kind?: "COMMUNITY" | "CITY_SHOW";
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [guests, setGuests] = useState<EventGuest[]>(initialGuests);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const cityShow = kind === "CITY_SHOW";

  const isHost = Boolean(me && (me.id === hostId || me.role === "ADMIN" || me.role === "MODERATOR"));
  const mine = guests.find((guest) => guest.id === me?.id);
  const paused = me?.status === "PAUSED";

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
      <section className="event-actions" style={{ marginTop: 28 }}>
        <div className="row">
          <Link className="btn" href={`/login?next=/events/${eventId}`}>
            {cityShow ? "برای اعلام علاقه وارد شو" : "برای ثبت حضور وارد شو"}
          </Link>
          <Link className="btn ghost" href={`/feed?event=${eventId}`}>
            نوشتن در فید شهر
          </Link>
        </div>
        <h3>{cityShow ? "علاقه‌مندان" : "مهمان‌ها"}</h3>
        <GuestSections
          guests={guests}
          cityShow={cityShow}
          isHost={false}
          eventId={eventId}
          onReload={reloadGuests}
          setMessage={setMessage}
          setError={setError}
        />
      </section>
    );
  }

  return (
    <section className="event-actions" style={{ marginTop: 28 }}>
      {mine?.status === "GOING" && mine.ticketStatus === "DUE" && !cityShow ? (
        <div className="banner">
          بلیت تو: {priceTry.toLocaleString("fa-IR")} لیر نقد دم در. وقتی وارد شوی، گرفته می‌شود.
        </div>
      ) : null}
      {mine?.ticketStatus === "PAID_DOOR" && !cityShow ? <div className="banner ok">بلیت‌ات دم در گرفته شد.</div> : null}
      {mine?.status === "INTERESTED" ? (
        <div className="banner">
          {cityShow
            ? "علاقه‌مندی‌ات ثبت شد. دیگران می‌توانند برای هماهنگی ببینند."
            : "در لیست انتظاری. اگر جا باز شود، در همین صفحه وضعیتت عوض می‌شود."}
        </div>
      ) : null}
      {mine?.status === "GOING" && !cityShow ? (
        <div className="banner ok">
          ثبت شدی. پروفایل مهمان‌ها را ببین — و برای هفتهٔ بعد، مکان‌ها را برای هماهنگی چک کن.
        </div>
      ) : null}
      {paused ? (
        <div className="banner err">
          حساب متوقف است. ثبت حضور تازه بسته است؛ می‌توانی لغو کنی.{" "}
          <Link href="/account">از سر گرفتن</Link>
        </div>
      ) : null}
      {message ? <div className="banner ok">{message}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      <div className="row">
        <button
          className="btn"
          type="button"
          disabled={paused}
          onClick={async () => {
            try {
              const data = await api<RsvpResult>(`/events/${eventId}/rsvp`, {
                method: "POST",
                body: JSON.stringify({}),
              });
              setMessage(
                cityShow
                  ? "علاقه‌مندی ثبت شد."
                  : data.waitlisted
                    ? "ظرفیت پر بود؛ رفتی لیست انتظار."
                    : data.ticketStatus === "DUE"
                      ? `ثبت شد. بلیت ${priceTry.toLocaleString("fa-IR")} لیر را نقد دم در بده.`
                      : "ثبت شد. می‌آیی.",
              );
              await reloadGuests();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "ثبت نشد.");
            }
          }}
        >
          {cityShow ? "علاقه‌مندم" : "می‌آیم"}
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={async () => {
            await api(`/events/${eventId}/rsvp`, { method: "DELETE", body: JSON.stringify({}) });
            setMessage(cityShow ? "علاقه‌مندی برداشته شد." : "لغو شد. اگر کسی در انتظار بود، جایش باز شد.");
            await reloadGuests();
          }}
        >
          {cityShow ? "لغو علاقه" : "لغو حضور"}
        </button>
        {isHost && !cityShow ? (
          <>
            <Link className="btn" href={`/events/${eventId}/door`}>
              QR ورودی
            </Link>
            <button
              className="btn ghost"
              type="button"
              onClick={async () => {
                if (!confirm("رویداد لغو شود؟ مهمان‌ها دیگر آن را به‌عنوان فعال نمی‌بینند.")) return;
                try {
                  await api(`/events/${eventId}/cancel`, { method: "POST", body: "{}" });
                  setMessage("رویداد لغو شد.");
                  window.location.reload();
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : "لغو نشد.");
                }
              }}
            >
              لغو رویداد
            </button>
          </>
        ) : null}
        <Link className="btn ghost" href={`/feed?event=${eventId}`}>
          نوشتن در فید شهر
        </Link>
        {!paused ? (
          <>
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
          </>
        ) : null}
      </div>

      <h3>{cityShow ? "علاقه‌مندان" : "مهمان‌ها"}</h3>
      <GuestSections
        guests={guests}
        cityShow={cityShow}
        isHost={isHost}
        eventId={eventId}
        onReload={reloadGuests}
        setMessage={setMessage}
        setError={setError}
      />
    </section>
  );
}
