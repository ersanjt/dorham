"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EventGuest, Me, RsvpResult } from "@dorham/shared";
import { useCopy, useUiLocale } from "../../../components/locale-provider";
import { ShareEvent } from "../../../components/share-event";
import { api, ApiError } from "../../../lib/api";
import { formatCount } from "../../../lib/format";
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
  const copy = useCopy();
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
          {guest.verificationStatus === "VERIFIED" ? <span className="verify-badge">{copy.rsvp.verified}</span> : null}
          <span className="muted">
            {cityShow
              ? copy.rsvp.interested
              : guest.status === "GOING"
                ? guest.checkedInAt
                  ? copy.rsvp.arrived
                  : copy.rsvp.going
                : copy.rsvp.waiting}
            {!cityShow && guest.ticketStatus === "DUE" ? copy.rsvp.due : ""}
            {!cityShow && guest.ticketStatus === "PAID_DOOR" ? copy.rsvp.paid : ""}
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
              onError(err instanceof ApiError ? err.message : copy.rsvp.checkinFail);
            }
          }}
        >
          {copy.rsvp.checkin}
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
  const copy = useCopy();
  const locale = useUiLocale();
  const going = useMemo(() => guests.filter((g) => g.status === "GOING"), [guests]);
  const wait = useMemo(() => guests.filter((g) => g.status === "INTERESTED"), [guests]);
  const checkedIn = going.filter((g) => g.checkedInAt).length;

  if (guests.length === 0) {
    return (
      <div className="guest-empty">
        <p className="muted">{cityShow ? copy.rsvp.emptyFans : copy.rsvp.emptyGuests}</p>
        <div className="row">
          <Link className="btn ghost" href="/venues">
            {copy.rsvp.venues}
          </Link>
          <Link className="btn ghost" href="/feed">
            {copy.rsvp.feed}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-sections">
      {!cityShow ? (
        <p className="meta guest-summary">
          {copy.rsvp.goingN(formatCount(going.length, locale))}
          {wait.length > 0 ? copy.rsvp.waitN(formatCount(wait.length, locale)) : ""}
          {checkedIn > 0 ? copy.rsvp.inN(formatCount(checkedIn, locale)) : ""}
        </p>
      ) : (
        <p className="meta guest-summary">{copy.rsvp.fansN(formatCount(wait.length, locale))}</p>
      )}

      {(cityShow ? wait : going).length > 0 ? (
        <>
          <h4>{cityShow ? copy.rsvp.fans : copy.rsvp.coming}</h4>
          <ul className="guest-list">
            {(cityShow ? wait : going).map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                cityShow={cityShow}
                isHost={isHost}
                eventId={eventId}
                onCheckedIn={async (name) => {
                  setMessage(copy.rsvp.arrivedName(name));
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
          <h4>{copy.rsvp.waitlist}</h4>
          <ul className="guest-list">
            {wait.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                cityShow={cityShow}
                isHost={isHost}
                eventId={eventId}
                onCheckedIn={async (name) => {
                  setMessage(copy.rsvp.arrivedName(name));
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
  inviteTitle,
  inviteText,
  inviteUrl,
}: {
  eventId: string;
  hostId: string;
  priceTry?: number;
  initialGuests?: EventGuest[];
  kind?: "COMMUNITY" | "CITY_SHOW";
  inviteTitle?: string;
  inviteText?: string;
  inviteUrl?: string;
}) {
  const copy = useCopy();
  const locale = useUiLocale();
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [guests, setGuests] = useState<EventGuest[]>(initialGuests);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const cityShow = kind === "CITY_SHOW";
  const priceN = formatCount(priceTry, locale);

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
            {cityShow ? copy.rsvp.loginInterest : copy.rsvp.loginGoing}
          </Link>
          <Link className="btn ghost" href={`/feed?event=${eventId}`}>
            {copy.rsvp.writeFeed}
          </Link>
        </div>
        <h3>{cityShow ? copy.rsvp.fans : copy.rsvp.guests}</h3>
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
        <div className="banner">{copy.rsvp.ticketDue(priceN)}</div>
      ) : null}
      {mine?.ticketStatus === "PAID_DOOR" && !cityShow ? <div className="banner ok">{copy.rsvp.ticketPaid}</div> : null}
      {mine?.status === "INTERESTED" ? (
        <div className="banner">{cityShow ? copy.rsvp.marked : copy.rsvp.waitlisted}</div>
      ) : null}
      {mine?.status === "GOING" && !cityShow ? <div className="banner ok">{copy.rsvp.confirmed}</div> : null}
      {mine?.status === "GOING" && !cityShow ? <p className="muted">{copy.rsvp.scanDoor}</p> : null}
      {mine?.status === "GOING" && !cityShow && inviteText && inviteUrl ? (
        <div className="card" style={{ marginTop: 12 }}>
          <p className="strong">{copy.rsvp.inviteTitle}</p>
          <p className="muted">{copy.rsvp.inviteBody}</p>
          <ShareEvent title={inviteTitle || copy.rsvp.inviteTitle} text={inviteText} url={inviteUrl} />
        </div>
      ) : null}
      {paused ? (
        <div className="banner err">
          {copy.rsvp.paused} <Link href="/account">{copy.rsvp.resume}</Link>
        </div>
      ) : null}
      {message ? <div className="banner ok">{message}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      <div className="row">
        {!mine ? (
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
                    ? copy.rsvp.markedOk
                    : data.waitlisted
                      ? copy.rsvp.waitOk
                      : data.ticketStatus === "DUE"
                        ? copy.rsvp.goingDue(priceN)
                        : copy.rsvp.goingOk,
                );
                await reloadGuests();
              } catch (err) {
                setError(err instanceof ApiError ? err.message : copy.rsvp.rsvpFail);
              }
            }}
          >
            {cityShow ? copy.rsvp.imIn : copy.rsvp.imGoing}
          </button>
        ) : (
          <button
            className="btn ghost"
            type="button"
            onClick={async () => {
              await api(`/events/${eventId}/rsvp`, { method: "DELETE", body: JSON.stringify({}) });
              setMessage(cityShow ? copy.rsvp.unmarked : copy.rsvp.cancelled);
              await reloadGuests();
            }}
          >
            {cityShow ? copy.rsvp.cancelInterest : copy.rsvp.cancelGoing}
          </button>
        )}
        {isHost && !cityShow ? (
          <>
            <Link className="btn" href={`/events/${eventId}/door`}>
              {copy.rsvp.doorQr}
            </Link>
            <button
              className="btn ghost"
              type="button"
              onClick={async () => {
                if (!confirm(copy.rsvp.cancelConfirm)) return;
                try {
                  await api(`/events/${eventId}/cancel`, { method: "POST", body: "{}" });
                  setMessage(copy.rsvp.eventCancelled);
                  window.location.reload();
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : copy.rsvp.cancelFail);
                }
              }}
            >
              {copy.rsvp.cancelEvent}
            </button>
          </>
        ) : null}
        <Link className="btn ghost" href={`/feed?event=${eventId}`}>
          {copy.rsvp.writeFeed}
        </Link>
        {!paused && me && me.id !== hostId ? (
          <>
            <button
              className="btn ghost"
              type="button"
              onClick={async () => {
                try {
                  await api(`/users/${hostId}/block`, { method: "POST" });
                  setMessage(copy.rsvp.blockedHost);
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : copy.safety.blockFail);
                }
              }}
            >
              {copy.rsvp.blockHost}
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
                  setMessage(copy.rsvp.reported);
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : copy.safety.reportFail);
                }
              }}
            >
              {copy.rsvp.report}
            </button>
          </>
        ) : null}
      </div>

      <h3>{cityShow ? copy.rsvp.fans : copy.rsvp.guests}</h3>
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
