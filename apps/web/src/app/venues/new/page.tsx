"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { submitVenueBodySchema, type VenueKind } from "@dorham/shared";
import { PageIntro } from "../../../components/page-intro";
import { SiteHeader } from "../../../components/site-header";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";
import { KIND_LABEL } from "../../../lib/venues";

export default function SubmitVenuePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isSignedIn()) router.replace("/login?next=/venues/new");
  }, [router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const website = String(form.get("website") ?? "").trim();
    const parsed = submitVenueBodySchema.safeParse({
      name: String(form.get("name") ?? ""),
      kind: String(form.get("kind") ?? "RESTAURANT"),
      area: String(form.get("area") ?? ""),
      address: String(form.get("address") ?? ""),
      mapsUrl: String(form.get("mapsUrl") ?? ""),
      description: String(form.get("description") ?? ""),
      hours: String(form.get("hours") ?? "") || undefined,
      phone: String(form.get("phone") ?? "") || undefined,
      website: website || undefined,
      priceRange: String(form.get("priceRange") ?? "") || undefined,
      menuNotes: String(form.get("menuNotes") ?? "") || undefined,
    });
    if (!parsed.success) {
      setError("نام، آدرس، توضیح و لینک گوگل‌مپ را کامل کن.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const venue = await api<{ slug: string; pendingReview?: boolean }>("/venues", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      if (venue.pendingReview) {
        router.push("/venues?submitted=1");
      } else {
        router.push(`/venues/${venue.slug}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ثبت نشد. وارد شو.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="صاحب‌کار" title="ثبت مکان">
        <p className="muted">رستوران، کافه، مارکت یا جای جمع فرهنگی. لینک گوگل‌مپ اجباری است. دیسکو دوستیابی نیست.</p>
      </PageIntro>
      <div className="form-card">
        <form className="form wide" onSubmit={onSubmit}>
          {error ? <div className="banner err">{error}</div> : null}
          <label>
            نام
            <input name="name" minLength={2} maxLength={80} required />
          </label>
          <label>
            نوع
            <select name="kind" defaultValue="RESTAURANT">
              {(Object.keys(KIND_LABEL) as VenueKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABEL[kind]}
                </option>
              ))}
            </select>
          </label>
          <label>
            محله (لاتین، مثل kadikoy)
            <input name="area" minLength={2} maxLength={40} required placeholder="kadikoy" />
          </label>
          <label>
            آدرس
            <input name="address" minLength={8} required />
          </label>
          <label>
            لینک گوگل‌مپ
            <input name="mapsUrl" type="url" required placeholder="https://maps.google.com/..." />
          </label>
          <label>
            توضیح
            <textarea name="description" minLength={10} rows={4} required />
          </label>
          <label>
            ساعت
            <input name="hours" placeholder="۱۲–۲۴" />
          </label>
          <label>
            حدود قیمت
            <input name="priceRange" placeholder="۱۵۰–۳۰۰ لیر" />
          </label>
          <label>
            منو / غذای شاخص
            <textarea name="menuNotes" rows={3} maxLength={500} />
          </label>
          <label>
            تلفن
            <input name="phone" />
          </label>
          <label>
            وب‌سایت
            <input name="website" type="url" />
          </label>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "..." : "انتشار مکان"}
          </button>
        </form>
      </div>
    </main>
  );
}
