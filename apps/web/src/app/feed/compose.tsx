"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { EventDto, FeedPost, Me } from "@dorham/shared";
import { api, ApiError } from "../../lib/api";
import { canPost } from "../../lib/can-post";
import { isSignedIn } from "../../lib/session";

export function FeedCompose() {
  const router = useRouter();
  const search = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [eventId, setEventId] = useState(search.get("event") ?? search.get("eventId") ?? "");
  const [venueSlug, setVenueSlug] = useState(search.get("venue") ?? search.get("venueSlug") ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const ok = isSignedIn();
    setSignedIn(ok);
    api<EventDto[]>("/events?city=istanbul&kind=COMMUNITY&limit=8", { auth: false })
      .then(setEvents)
      .catch(() => undefined);
    if (!ok) return;
    api<Me>("/users/me")
      .then(setMe)
      .catch(() => undefined);
  }, []);

  if (!signedIn) {
    const next = eventId || venueSlug
      ? `/feed?${new URLSearchParams({ ...(eventId ? { event: eventId } : {}), ...(venueSlug ? { venue: venueSlug } : {}) })}`
      : "/feed";
    return (
      <p className="muted">
        برای نوشتن در فید شهر <a className="card-cta" href={`/login?next=${encodeURIComponent(next)}`}>وارد شو</a>. فقط میزبان و عضو تأییدشده پست می‌گذارند.
      </p>
    );
  }

  if (me?.status === "PAUSED") {
    return (
      <p className="muted">
        حساب متوقف است. برای نوشتن در فید، از <a className="card-cta" href="/account">حساب</a> از سر بگیر.
      </p>
    );
  }

  if (me && !canPost(me)) {
    return (
      <p className="muted">
        نوشتن پست برای میزبان و اعضای تأییدشده است. از حساب، عکس دست‌نویس بفرست. نظر گذاشتن برای همهٔ اعضا آزاد است.
      </p>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    setPending(true);
    setError("");
    try {
      const post = await api<FeedPost>("/feed", {
        method: "POST",
        body: JSON.stringify({
          body,
          city: "istanbul",
          eventId: eventId || undefined,
          venueSlug: venueSlug || undefined,
        }),
      });
      form.reset();
      router.push(`/feed/${post.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "پست ذخیره نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form wide" onSubmit={onSubmit}>
      {error ? <div className="banner err">{error}</div> : null}
      <label>
        برای استانبول بنویس
        <textarea
          name="body"
          minLength={20}
          maxLength={2000}
          rows={4}
          required
          placeholder="مثلاً: سه‌شنبه ساعت ۱۹ سفیر آکسارای خلوت بود؛ جوجه خوب، میز برای ۴ نفر راحت جا شد."
        />
      </label>
      {events.length > 0 ? (
        <label>
          وصل به رویداد
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">بدون رویداد</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {venueSlug ? <p className="muted">وصل به مکان: {venueSlug}</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        انتشار
      </button>
    </form>
  );
}
