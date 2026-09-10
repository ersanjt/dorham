"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createEventBodySchema, type VenueDto } from "@dorham/shared";
import { SiteHeader } from "../../../components/site-header";
import { PageIntro } from "../../../components/page-intro";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";
import { AREA_LABEL, KIND_LABEL } from "../../../lib/venues";

export default function NewEventPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [venueSlug, setVenueSlug] = useState("");

  useEffect(() => {
    if (!isSignedIn()) router.replace("/login");
    api<VenueDto[]>("/venues?city=istanbul&limit=80", { auth: false })
      .then(setVenues)
      .catch(() => setVenues([]));
  }, [router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const startsLocal = String(form.get("startsAt") ?? "");
    const parsed = createEventBodySchema.safeParse({
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      city: "istanbul",
      venueSlug: venueSlug || undefined,
      venue: venueSlug ? undefined : String(form.get("venue") ?? "") || undefined,
      address: venueSlug ? undefined : String(form.get("address") ?? "") || undefined,
      startsAt: startsLocal ? new Date(startsLocal).toISOString() : "",
      capacity: Number(form.get("capacity") || 24),
      priceTry: Number(form.get("priceTry") || 0),
    });
    if (!parsed.success) {
      setError("عنوان، توضیح و زمان را کامل کن. بهتر است مکان را از فهرست انتخاب کنی.");
      return;
    }
    setPending(true);
    try {
      const event = await api<{ id: string }>("/events", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      router.push(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ساخته نشد. فقط میزبان و ادمین می‌توانند.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="میزبان" title="رویداد تازه">
        <p className="muted">فقط نقش میزبان، ناظر یا ادمین. مکان را از فهرست ایرانی‌های استانبول انتخاب کن.</p>
      </PageIntro>
      <div className="form-card">
        <form className="form wide" onSubmit={onSubmit}>
          {error ? <div className="banner err">{error}</div> : null}
          <label>
            عنوان
            <input name="title" minLength={4} maxLength={80} required />
          </label>
          <label>
            توضیح
            <textarea name="description" minLength={10} rows={5} required />
          </label>
          <label>
            مکان از فهرست
            <select value={venueSlug} onChange={(e) => setVenueSlug(e.target.value)}>
              <option value="">— انتخاب کن —</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.slug}>
                  {venue.name} · {KIND_LABEL[venue.kind]} · {AREA_LABEL[venue.area] ?? venue.area}
                </option>
              ))}
            </select>
          </label>
          {!venueSlug ? (
            <>
              <label>
                مکان آزاد (اگر در فهرست نبود)
                <input name="venue" placeholder="Kadıköy" />
              </label>
              <label>
                آدرس
                <input name="address" />
              </label>
            </>
          ) : null}
          <label>
            شروع
            <input name="startsAt" type="datetime-local" required />
          </label>
          <label>
            ظرفیت
            <input name="capacity" type="number" min={2} max={500} defaultValue={24} />
          </label>
          <label>
            بلیت (لیر، صفر یعنی رایگان)
            <input name="priceTry" type="number" min={0} max={2500} defaultValue={200} />
          </label>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "..." : "انتشار"}
          </button>
        </form>
      </div>
    </main>
  );
}
