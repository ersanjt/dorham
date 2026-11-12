"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { VenueDoor, VenueVisitDto } from "@dorham/shared";
import { useCopy, useUiLocale } from "../../../components/locale-provider";
import { QrImage } from "../../../components/qr-image";
import { api, ApiError } from "../../../lib/api";
import { useSession } from "../../../lib/use-session";

export function VenueVisitActions({
  slug,
}: {
  slug: string;
  venueId?: string;
}) {
  const { signedIn, ready } = useSession();
  const copy = useCopy();
  const locale = useUiLocale();
  const digits = locale === "en" ? "en-GB" : "fa-IR";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [door, setDoor] = useState<VenueDoor | null>(null);
  const [pending, setPending] = useState<Array<VenueVisitDto & { guestName?: string; guestId?: string }>>([]);
  const [showClaim, setShowClaim] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    api<VenueDoor>(`/venues/${slug}/door`)
      .then(async (d) => {
        setDoor(d);
        const list = await api<Array<VenueVisitDto & { guestName?: string; guestId?: string }>>(`/venues/${slug}/visits`);
        setPending(list.filter((v) => v.status === "PENDING"));
      })
      .catch(() => {
        setDoor(null);
      });
  }, [slug, signedIn]);

  if (!ready) return null;

  if (!signedIn) {
    return (
      <section className="venue-visit-box">
        <h3>{copy.venues.visitTitle}</h3>
        <p className="muted">{copy.venues.visitLead}</p>
        <Link className="btn" href={`/login?next=/venues/${slug}`}>
          {copy.venues.visitLogin}
        </Link>
      </section>
    );
  }

  return (
    <section className="venue-visit-box">
      <h3>{copy.venues.visitTitle}</h3>
      <p className="muted">{copy.venues.visitBody}</p>
      {message ? <div className="banner ok">{message}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}

      {!door ? (
        <div className="row">
          <button
            className="btn"
            type="button"
            onClick={async () => {
              setError("");
              try {
                const visit = await api<VenueVisitDto>(`/venues/${slug}/visits`, { method: "POST", body: "{}" });
                setMessage(
                  visit.status === "VERIFIED" ? copy.venues.visitAlready : copy.venues.visitAsked,
                );
              } catch (err) {
                setError(err instanceof ApiError ? err.message : copy.venues.visitAskFail);
              }
            }}
          >
            {copy.venues.visitAsk}
          </button>
          <Link className="btn ghost" href={`/venues/${slug}/checkin`}>
            {copy.venues.visitDoor}
          </Link>
        </div>
      ) : null}

      {!door ? (
        <div className="venue-claim-soft">
          <button className="linkish" type="button" onClick={() => setShowClaim((v) => !v)}>
            {copy.venues.visitOwnerQ}
          </button>
          {showClaim ? (
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="btn ghost"
                type="button"
                onClick={async () => {
                  setError("");
                  try {
                    await api(`/venues/${slug}/claim`, { method: "POST", body: "{}" });
                    const d = await api<VenueDoor>(`/venues/${slug}/door`);
                    setDoor(d);
                    setMessage(copy.venues.visitClaimed);
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : copy.venues.visitClaimFail);
                  }
                }}
              >
                {copy.venues.visitClaim}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {door ? (
        <div className="venue-door-panel">
          <h4>{copy.venues.visitTools}</h4>
          <p className="meta">
            {copy.venues.visitCounts(
              door.verifiedCount.toLocaleString(digits),
              door.pendingCount.toLocaleString(digits),
            )}
          </p>
          <p className="muted">{copy.venues.visitQrLead}</p>
          <QrImage url={door.url} alt={door.name} size={220} />
          <p className="muted">
            {copy.venues.visitOr} <Link href={`/venues/${slug}/checkin`}>{copy.venues.visitCheckinLink}</Link>{" "}
            {copy.venues.visitUse}
          </p>
          {pending.length > 0 ? (
            <div className="stack" style={{ marginTop: 12 }}>
              <h4>{copy.venues.visitPending}</h4>
              {pending.map((v) => (
                <div className="row" key={v.id}>
                  <span>{v.guestName ?? v.guestId}</span>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={async () => {
                      if (!v.guestId) return;
                      await api(`/venues/${slug}/checkin`, {
                        method: "POST",
                        body: JSON.stringify({ userId: v.guestId }),
                      });
                      setPending((prev) => prev.filter((p) => p.id !== v.id));
                      setMessage(copy.venues.visitGuestOk(v.guestName ?? copy.venues.visitOk));
                    }}
                  >
                    {copy.venues.visitOk}
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <form
            className="form"
            onSubmit={async (e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const userId = String(form.get("userId") ?? "").trim();
              try {
                await api(`/venues/${slug}/checkin`, {
                  method: "POST",
                  body: JSON.stringify({ userId }),
                });
                setMessage(copy.venues.visitManualOk);
                const list = await api<Array<VenueVisitDto & { guestName?: string; guestId?: string }>>(
                  `/venues/${slug}/visits`,
                );
                setPending(list.filter((v) => v.status === "PENDING"));
                (e.target as HTMLFormElement).reset();
              } catch (err) {
                setError(err instanceof ApiError ? err.message : copy.venues.visitManualFail);
              }
            }}
          >
            <details>
              <summary>{copy.venues.visitManual}</summary>
              <label>
                {copy.venues.visitUserId}
                <input name="userId" placeholder="cuid" required />
              </label>
              <button className="btn" type="submit">
                {copy.venues.visitOk}
              </button>
            </details>
          </form>
        </div>
      ) : null}
    </section>
  );
}
