"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Me, VenueDto } from "@dorham/shared";
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

export default function AdminModerationPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [reports, setReports] = useState<Reports | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");

  async function load() {
    const [profile, pending, reps] = await Promise.all([
      api<Me>("/users/me"),
      api<VenueDto[]>("/admin/venues/pending"),
      api<Reports>("/admin/reports"),
    ]);
    setMe(profile);
    setVenues(pending);
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
        <p className="muted">مکان‌های در انتظار، گزارش‌ها، و نقش میزبان.</p>
      </PageIntro>
      {!staff ? (
        <div className="banner err">فقط مدیر و ناظر.</div>
      ) : (
        <>
          {message ? <div className="banner ok">{message}</div> : null}
          {error ? <div className="banner err">{error}</div> : null}

          <section className="stack">
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
