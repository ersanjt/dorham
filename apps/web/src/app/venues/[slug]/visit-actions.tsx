"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { VenueDoor, VenueVisitDto } from "@dorham/shared";
import { api, ApiError } from "../../../lib/api";
import { useSession } from "../../../lib/use-session";

export function VenueVisitActions({
  slug,
}: {
  slug: string;
  venueId?: string;
}) {
  const { signedIn, ready } = useSession();
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
        <h3>آیا اینجا بوده‌ای؟</h3>
        <p className="muted">بعد از حضور واقعی، صاحب مکان تأیید می‌کند و در پروفایلت دیده می‌شود.</p>
        <Link className="btn" href={`/login?next=/venues/${slug}`}>
          ورود برای ثبت حضور
        </Link>
      </section>
    );
  }

  return (
    <section className="venue-visit-box">
      <h3>آیا اینجا بوده‌ای؟</h3>
      <p className="muted">
        حضور تأییدشده روی پروفایل می‌آید. این لایو «الان کی اینجاست» نیست — فقط سابقهٔ واقعی.
      </p>
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
                  visit.status === "VERIFIED"
                    ? "حضورت قبلاً تأیید شده."
                    : "درخواست ثبت شد. از صاحب مکان بخواه با QR یا لینک دم‌در تأیید کند.",
                );
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "درخواست نشد.");
              }
            }}
          >
            درخواست تأیید حضور
          </button>
          <Link className="btn ghost" href={`/venues/${slug}/checkin`}>
            صفحهٔ دم‌در
          </Link>
        </div>
      ) : null}

      {!door ? (
        <div className="venue-claim-soft">
          <button className="linkish" type="button" onClick={() => setShowClaim((v) => !v)}>
            صاحب این مکان هستی؟
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
                    setMessage("مالکیت مکان برای تو ثبت شد. لینک دم‌در آماده‌ست.");
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : "مالکیت گرفته نشد.");
                  }
                }}
              >
                ثبت مالکیت
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {door ? (
        <div className="venue-door-panel">
          <h4>ابزار صاحب مکان</h4>
          <p className="meta">
            تأییدشده: {door.verifiedCount.toLocaleString("fa-IR")} · در انتظار:{" "}
            {door.pendingCount.toLocaleString("fa-IR")}
          </p>
          <p className="muted">لینک / QR دم در برای مهمان:</p>
          <p className="strong" style={{ wordBreak: "break-all" }}>
            <a href={door.url}>{door.url}</a>
          </p>
          <p className="muted">
            یا از <Link href={`/venues/${slug}/checkin`}>صفحهٔ چک‌این</Link> استفاده کن.
          </p>
          {pending.length > 0 ? (
            <div className="stack" style={{ marginTop: 12 }}>
              <h4>در انتظار تأیید</h4>
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
                      setMessage(`${v.guestName ?? "مهمان"} تأیید شد.`);
                    }}
                  >
                    تأیید
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
                setMessage("حضور مهمان تأیید شد.");
                const list = await api<Array<VenueVisitDto & { guestName?: string; guestId?: string }>>(
                  `/venues/${slug}/visits`,
                );
                setPending(list.filter((v) => v.status === "PENDING"));
                (e.target as HTMLFormElement).reset();
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "تأیید نشد.");
              }
            }}
          >
            <details>
              <summary>تأیید دستی با شناسه (پشتیبان)</summary>
              <label>
                شناسه کاربر
                <input name="userId" placeholder="cuid" required />
              </label>
              <button className="btn" type="submit">
                تأیید حضور
              </button>
            </details>
          </form>
        </div>
      ) : null}
    </section>
  );
}
