"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { VenueDoor, VenueVisitDto } from "@dorham/shared";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";

export function VenueVisitActions({
  slug,
  venueId,
}: {
  slug: string;
  venueId: string;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [door, setDoor] = useState<VenueDoor | null>(null);
  const [pending, setPending] = useState<Array<VenueVisitDto & { guestName?: string; guestId?: string }>>([]);

  useEffect(() => {
    if (!isSignedIn()) return;
    api<VenueDoor>(`/venues/${slug}/door`)
      .then(async (d) => {
        setDoor(d);
        const list = await api<Array<VenueVisitDto & { guestName?: string; guestId?: string }>>(`/venues/${slug}/visits`);
        setPending(list.filter((v) => v.status === "PENDING"));
      })
      .catch(() => undefined);
  }, [slug]);

  if (!isSignedIn()) {
    return (
      <p className="muted">
        برای ثبت حضور در این مکان <Link href={`/login?next=/venues/${slug}`}>وارد شو</Link>.
      </p>
    );
  }

  return (
    <section className="venue-visit-box">
      <h3>حضور در مکان</h3>
      <p className="muted">صاحب کسب‌وکار حضورت را تأیید می‌کند؛ بعد در پروفایلت دیده می‌شود. لایو «الان کی اینجاست» نیست.</p>
      {message ? <div className="banner ok">{message}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      <div className="row">
        <button
          className="btn"
          type="button"
          onClick={async () => {
            try {
              const visit = await api<VenueVisitDto>(`/venues/${slug}/visits`, { method: "POST", body: "{}" });
              setMessage(
                visit.status === "VERIFIED"
                  ? "حضورت قبلاً تأیید شده."
                  : "درخواست ثبت شد. از صاحب مکان بخواه تأیید کند.",
              );
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "درخواست نشد.");
            }
          }}
        >
          درخواست تأیید حضور
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={async () => {
            try {
              await api(`/venues/${slug}/claim`, { method: "POST", body: "{}" });
              const d = await api<VenueDoor>(`/venues/${slug}/door`);
              setDoor(d);
              setMessage("مالکیت مکان برای تو ثبت شد.");
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "مالکیت گرفته نشد.");
            }
          }}
        >
          من صاحب مکانم
        </button>
      </div>

      {door ? (
        <div className="venue-door-panel">
          <p className="meta">
            تأییدشده: {door.verifiedCount.toLocaleString("fa-IR")} · در انتظار: {door.pendingCount.toLocaleString("fa-IR")}
          </p>
          <p className="muted">QR / لینک دم در برای مهمان:</p>
          <p className="strong" style={{ wordBreak: "break-all" }}>
            <a href={door.url}>{door.url}</a>
          </p>
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
            <label>
              تأیید دستی با شناسه کاربر
              <input name="userId" placeholder="cuid کاربر" required />
            </label>
            <button className="btn" type="submit">
              تأیید حضور
            </button>
          </form>
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
        </div>
      ) : null}
      <p className="meta" style={{ marginTop: 8 }}>
        venue id: <code>{venueId}</code>
      </p>
    </section>
  );
}
