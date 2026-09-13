"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Me, VenueDto, VenuePhotoDto, VenueReview } from "@dorham/shared";
import { AuthImage } from "../../components/auth-image";
import { PageIntro } from "../../components/page-intro";
import { SiteHeader } from "../../components/site-header";
import { api, ApiError } from "../../lib/api";
import { isSignedIn } from "../../lib/session";

type Reports = {
  people: Array<{
    id: string;
    reason: string;
    details: string | null;
    status: string;
    createdAt: string;
    reporter: { id: string; displayName: string };
    reported: { id: string; displayName: string };
  }>;
  feed: Array<{
    id: string;
    targetType: string;
    targetId: string;
    reason: string;
    status: string;
    createdAt: string;
    reporter: { id: string; displayName: string };
  }>;
};

type PendingReview = VenueReview & {
  venueId: string;
  venueSlug: string;
  venueName: string;
};

export default function AdminModerationPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<VenuePhotoDto[]>([]);
  const [reports, setReports] = useState<Reports | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");

  async function load() {
    const [profile, pending, reviews, photos, reps] = await Promise.all([
      api<Me>("/users/me"),
      api<VenueDto[]>("/admin/venues/pending"),
      api<PendingReview[]>("/admin/venues/reviews/pending"),
      api<VenuePhotoDto[]>("/admin/venues/photos/pending"),
      api<Reports>("/admin/reports"),
    ]);
    setMe(profile);
    setVenues(pending);
    setPendingReviews(reviews);
    setPendingPhotos(photos);
    setReports(reps);
  }

  useEffect(() => {
    if (!isSignedIn()) {
      setError("وارد شو.");
      return;
    }
    load().catch((err) => setError(err instanceof ApiError ? err.message : "بارگذاری نشد."));
  }, []);

  if (error && !me) {
    return (
      <main className="wrap">
        <SiteHeader />
        <div className="banner err">{error}</div>
        <Link href="/login?next=/admin">ورود</Link>
      </main>
    );
  }

  const staff = me && (me.role === "ADMIN" || me.role === "MODERATOR");

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="مدیریت" title="صف بررسی">
        <p className="muted">مکان‌ها، نظرات، عکس‌ها، گزارش‌ها، و نقش میزبان.</p>
      </PageIntro>
      {!staff ? (
        <div className="banner err">فقط مدیر و ناظر. این صفحه برای عموم نیست.</div>
      ) : (
        <>
          {message ? <div className="banner ok">{message}</div> : null}
          {error ? <div className="banner err">{error}</div> : null}

          <div className="admin-summary">
            <Link className="admin-summary-chip" href="#venues-pending">
              مکان {venues.length.toLocaleString("fa-IR")}
            </Link>
            <Link className="admin-summary-chip" href="#reviews-pending">
              نظر {pendingReviews.length.toLocaleString("fa-IR")}
            </Link>
            <Link className="admin-summary-chip" href="#photos-pending">
              عکس {pendingPhotos.length.toLocaleString("fa-IR")}
            </Link>
            <Link className="admin-summary-chip" href="/admin/verify">
              تأیید دست‌نویس
            </Link>
          </div>

          <section className="stack" id="venues-pending">
            <h2>مکان‌های در انتظار</h2>
            {venues.length === 0 ? <p className="muted">صف خالی است.</p> : null}
            {venues.map((v) => (
              <article className="card" key={v.id}>
                <strong>{v.name}</strong>
                <p className="muted">
                  {v.area} · {v.kind}
                </p>
                <button
                  className="btn"
                  type="button"
                  onClick={async () => {
                    try {
                      await api(`/admin/venues/${v.id}/publish`, { method: "POST", body: "{}" });
                      setMessage(`${v.name} منتشر شد.`);
                      await load();
                    } catch (err) {
                      setError(err instanceof ApiError ? err.message : "منتشر نشد.");
                    }
                  }}
                >
                  انتشار
                </button>
              </article>
            ))}
          </section>

          <section className="stack" style={{ marginTop: 32 }}>
            <h2 id="reviews-pending">نظرات در انتظار</h2>
            {pendingReviews.length === 0 ? <p className="muted">نظری در صف نیست.</p> : null}
            {pendingReviews.map((r) => (
              <article className="card" key={r.id}>
                <p className="muted">
                  <Link href={`/venues/${r.venueSlug}`}>{r.venueName}</Link> · {r.author.displayName}
                </p>
                <p>{r.body}</p>
                <div className="row">
                  <button
                    className="btn"
                    type="button"
                    onClick={async () => {
                      try {
                        await api(`/admin/venues/reviews/${r.id}/review`, {
                          method: "POST",
                          body: JSON.stringify({ status: "PUBLISHED" }),
                        });
                        setMessage("نظر منتشر شد.");
                        await load();
                      } catch (err) {
                        setError(err instanceof ApiError ? err.message : "نشد.");
                      }
                    }}
                  >
                    انتشار
                  </button>
                  <button
                    className="btn danger"
                    type="button"
                    onClick={async () => {
                      try {
                        await api(`/admin/venues/reviews/${r.id}/review`, {
                          method: "POST",
                          body: JSON.stringify({ status: "REJECTED" }),
                        });
                        setMessage("نظر رد شد.");
                        await load();
                      } catch (err) {
                        setError(err instanceof ApiError ? err.message : "نشد.");
                      }
                    }}
                  >
                    رد
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="stack" style={{ marginTop: 32 }}>
            <h2 id="photos-pending">عکس‌های در انتظار</h2>
            {pendingPhotos.length === 0 ? <p className="muted">عکسی در صف نیست.</p> : null}
            {pendingPhotos.map((p) => (
              <article className="card" key={p.id}>
                <p className="muted">
                  <Link href={`/venues/${p.venueSlug}`}>{p.venueName}</Link> · {p.uploader.displayName}
                </p>
                {p.caption ? <p>{p.caption}</p> : null}
                <AuthImage src={p.url} />
                <div className="row" style={{ marginTop: 12 }}>
                  <button
                    className="btn"
                    type="button"
                    onClick={async () => {
                      try {
                        await api(`/admin/venues/photos/${p.id}/review`, {
                          method: "POST",
                          body: JSON.stringify({ status: "PUBLISHED" }),
                        });
                        setMessage("عکس منتشر شد.");
                        await load();
                      } catch (err) {
                        setError(err instanceof ApiError ? err.message : "نشد.");
                      }
                    }}
                  >
                    انتشار
                  </button>
                  <button
                    className="btn danger"
                    type="button"
                    onClick={async () => {
                      try {
                        await api(`/admin/venues/photos/${p.id}/review`, {
                          method: "POST",
                          body: JSON.stringify({ status: "REJECTED" }),
                        });
                        setMessage("عکس رد شد.");
                        await load();
                      } catch (err) {
                        setError(err instanceof ApiError ? err.message : "نشد.");
                      }
                    }}
                  >
                    رد
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="stack" style={{ marginTop: 32 }}>
            <h2>گزارش افراد</h2>
            {(reports?.people ?? []).filter((r) => r.status === "open").length === 0 ? (
              <p className="muted">گزارش باز نیست.</p>
            ) : null}
            {(reports?.people ?? [])
              .filter((r) => r.status === "open")
              .map((r) => (
                <article className="card" key={r.id}>
                  <p>
                    <Link href={`/people/${r.reported.id}`}>{r.reported.displayName}</Link> — {r.reason}
                  </p>
                  <p className="muted">{r.details}</p>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={async () => {
                      await api(`/admin/reports/people/${r.id}/resolve`, { method: "POST", body: "{}" });
                      await load();
                    }}
                  >
                    رسیدگی شد
                  </button>
                </article>
              ))}
          </section>

          <section className="stack" style={{ marginTop: 32 }}>
            <h2>گزارش فید</h2>
            {(reports?.feed ?? []).filter((r) => r.status === "open").length === 0 ? (
              <p className="muted">گزارش فید باز نیست.</p>
            ) : null}
            {(reports?.feed ?? [])
              .filter((r) => r.status === "open")
              .map((r) => (
                <article className="card" key={r.id}>
                  <p>
                    {r.targetType} · {r.reason}
                  </p>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={async () => {
                      await api(`/admin/reports/feed/${r.id}/resolve`, { method: "POST", body: "{}" });
                      await load();
                    }}
                  >
                    رسیدگی شد
                  </button>
                </article>
              ))}
          </section>

          {me.role === "ADMIN" ? (
            <section className="form-card" style={{ marginTop: 32 }}>
              <h2>ارتقای نقش</h2>
              <p className="muted">شناسهٔ کاربر را از صفحهٔ پروفایل کپی کن و نقش میزبان بده.</p>
              <label>
                شناسه کاربر
                <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="cuid" />
              </label>
              <button
                className="btn"
                type="button"
                onClick={async () => {
                  try {
                    await api(`/admin/users/${userId}/role`, {
                      method: "POST",
                      body: JSON.stringify({ role: "HOST" }),
                    });
                    setMessage("نقش HOST تنظیم شد.");
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : "نشد.");
                  }
                }}
              >
                تبدیل به میزبان
              </button>
              <p style={{ marginTop: 12 }}>
                <Link href="/admin/verify">صف تأیید دست‌نویس</Link>
              </p>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
