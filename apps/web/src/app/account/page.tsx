"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import type { EventDto, Me, MyVerification, UserActivity } from "@dorham/shared";
import { EventCard } from "../../components/event-card";
import { SiteHeader } from "../../components/site-header";
import { PageIntro } from "../../components/page-intro";
import { api, ApiError } from "../../lib/api";
import { verifyFa } from "../../lib/format";
import { clearSession, isSignedIn } from "../../lib/session";

function AccountBody() {
  const router = useRouter();
  const search = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [verification, setVerification] = useState<MyVerification | null>(null);
  const [mine, setMine] = useState<EventDto[]>([]);
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(search.get("verify") === "1" ? "لینک تأیید به ایمیلت فرستاده شد." : "");

  async function reload() {
    const [profile, verify, events, act] = await Promise.all([
      api<Me>("/users/me"),
      api<MyVerification>("/users/me/verification"),
      api<EventDto[]>("/events/mine"),
      api<UserActivity>("/users/me/activity"),
    ]);
    setMe(profile);
    setVerification(verify);
    setMine(events);
    setActivity(act);
  }

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login");
      return;
    }
    reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : "حساب خوانده نشد.");
    });
  }, [router]);

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!me) return;
    const form = new FormData(e.currentTarget);
    try {
      const next = await api<Me>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: String(form.get("displayName") ?? me.displayName),
          bio: String(form.get("bio") ?? "") || null,
        }),
      });
      setMe(next);
      setNotice("پروفایل ذخیره شد.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیره نشد.");
    }
  }

  async function upload(kind: "PROFILE" | "VERIFICATION", file: File) {
    const body = new FormData();
    body.append("file", file);
    const media = await api<{ id: string }>(`/media?kind=${kind}`, { method: "POST", body });
    if (kind === "PROFILE") {
      await api("/users/me/photo", { method: "POST", body: JSON.stringify({ mediaId: media.id }) });
    } else {
      await api("/users/me/verification", { method: "POST", body: JSON.stringify({ mediaId: media.id }) });
    }
    await reload();
    setNotice(kind === "PROFILE" ? "عکس پروفایل عوض شد." : "عکس تأیید ارسال شد.");
  }

  async function resend() {
    const data = await api<{ verifyEmailToken?: string }>("/auth/resend-verification", { method: "POST" });
    if (data.verifyEmailToken) {
      router.push(`/verify-email?token=${encodeURIComponent(data.verifyEmailToken)}`);
    } else {
      setNotice("اگر ایمیل تأیید نشده باشد، لینک جدید ساخته شد.");
    }
  }

  if (!me) {
    return (
      <main className="wrap">
        <SiteHeader />
        <p className="muted">{error || "در حال بارگذاری حساب..."}</p>
      </main>
    );
  }

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="پروفایل" title="حساب من" />
      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      {me.status === "PAUSED" ? (
        <div className="banner err">حساب متوقف است. از سر بگیر تا پروفایل، ثبت حضور و فید دوباره باز شوند.</div>
      ) : null}

      <section className="card" style={{ marginTop: 24 }}>
        <div className="guest">
          {me.photoUrl ? <img className="avatar" src={me.photoUrl} alt="" /> : <div className="avatar" />}
          <div>
            <h2 style={{ margin: 0 }}>{me.displayName}</h2>
            <p className="muted">{me.email}</p>
            {me.verificationStatus === "VERIFIED" ? (
              <span className="verify-badge">{verifyFa.VERIFIED}</span>
            ) : (
              <span className="badge">{verifyFa[me.verificationStatus] ?? me.verificationStatus}</span>
            )}
            {me.emailVerified ? <span className="badge ok">ایمیل تأیید شد</span> : <span className="badge">ایمیل تأیید نشده</span>}
            {me.status === "PAUSED" ? <span className="badge">متوقف</span> : null}
          </div>
        </div>
        <div className="row">
          <Link className="btn ghost" href="/feed">
            فید شهر
          </Link>
          {(me.role === "ADMIN" || me.role === "MODERATOR") && (
            <Link className="btn ghost" href="/admin/verify">
              صف تأیید
            </Link>
          )}
          {me.role === "ADMIN" || me.role === "MODERATOR" || me.role === "HOST" ? (
            <Link className="btn ghost" href="/events/new">
              رویداد تازه
            </Link>
          ) : null}
          <Link className="btn ghost" href="/venues/new">
            ثبت مکان
          </Link>
          <Link className="btn ghost" href={`/people/${me.id}`}>
            پروفایل عمومی
          </Link>
        </div>
      </section>

      {activity ? (
        <section className="venue-panel" style={{ marginTop: 24 }} aria-label="آمار حضور">
          <h2 className="venue-panel-title">حضور در شهر</h2>
          <div className="account-stats">
            <div className="account-stat">
              <strong>{activity.stats.venuesVisited.toLocaleString("fa-IR")}</strong>
              <span>مکان تأییدشده</span>
            </div>
            <div className="account-stat">
              <strong>{activity.stats.eventsAttended.toLocaleString("fa-IR")}</strong>
              <span>رویداد (چک‌این)</span>
            </div>
            <div className="account-stat">
              <strong>{activity.stats.eventsGoing.toLocaleString("fa-IR")}</strong>
              <span>RSVP فعال</span>
            </div>
            <div className="account-stat">
              <strong>{activity.stats.eventsHosted.toLocaleString("fa-IR")}</strong>
              <span>میزبانی</span>
            </div>
          </div>
          {activity.stats.pendingVenueVisits > 0 ? (
            <p className="muted" style={{ padding: "0 20px" }}>
              {activity.stats.pendingVenueVisits.toLocaleString("fa-IR")} درخواست حضور در انتظار تأیید صاحب مکان است.
            </p>
          ) : null}

          <h3 style={{ margin: "16px 20px 8px" }}>مکان‌هایی که رفته‌ای</h3>
          {activity.venues.length === 0 ? (
            <p className="muted" style={{ padding: "0 20px 16px" }}>
              هنوز مکانی با تأیید صاحب کسب‌وکار ثبت نشده. از صفحهٔ مکان «درخواست تأیید حضور» بزن.
            </p>
          ) : (
            <ul className="account-history">
              {activity.venues.map((v) => (
                <li key={v.id}>
                  <Link href={`/venues/${v.venueSlug}`}>{v.venueName}</Link>
                  <span className="muted">
                    {" "}
                    · {v.visitCount.toLocaleString("fa-IR")} بار ·{" "}
                    {new Date(v.lastVisitedAt).toLocaleDateString("fa-IR")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ margin: "16px 20px 8px" }}>رویدادهایی که وارد شده‌ای</h3>
          {activity.eventsAttended.length === 0 ? (
            <p className="muted" style={{ padding: "0 20px 16px" }}>
              هنوز چک‌این رویدادی نداری. دم در با QR میزبان وارد شو.
            </p>
          ) : (
            <ul className="account-history">
              {activity.eventsAttended.map((ev) => (
                <li key={ev.id}>
                  <Link href={`/events/${ev.id}`}>{ev.title}</Link>
                  <span className="muted">
                    {ev.venue ? ` · ${ev.venue}` : ""} · {new Date(ev.startsAt).toLocaleDateString("fa-IR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <form className="form wide" onSubmit={saveProfile}>
        <label>
          نام نمایشی
          <input name="displayName" defaultValue={me.displayName} minLength={2} maxLength={40} />
        </label>
        <label>
          معرفی کوتاه
          <textarea name="bio" defaultValue={me.bio ?? ""} maxLength={280} rows={3} />
        </label>
        <button className="btn" type="submit" disabled={me.status === "PAUSED"}>
          ذخیره پروفایل
        </button>
      </form>

      <section className="card" style={{ marginTop: 24 }}>
        <h3>عکس پروفایل</h3>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={me.status === "PAUSED"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload("PROFILE", file).catch((err: unknown) => setError(err instanceof ApiError ? err.message : "آپلود نشد."));
          }}
        />
      </section>

      {mine.length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2>جمعه‌های من</h2>
          <div className="grid">
            {mine.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  id: event.id,
                  title: event.title,
                  description: event.description,
                  venue: event.venue,
                  startsAt: event.startsAt,
                  goingCount: event.goingCount,
                  capacity: event.capacity,
                  waitlistCount: event.waitlistCount,
                  hostName: event.host.displayName,
                  priceTry: event.priceTry,
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="card" style={{ marginTop: 24 }}>
        <h3>تأیید دست‌نویس</h3>
        <p className="muted">
          روی کاغذ بنویس «دورهم» و نام نمایشی‌ات، عکس بگیر. عکس تأیید عمومی نمی‌شود. هزینهٔ هدف ۲۵۰ لیر در سال است؛
          برای جمعه‌های اول رایگان می‌ماند تا درگاه وصل شود.
        </p>
        <p>
          وضعیت:{" "}
          {verification?.status === "VERIFIED" ? (
            <span className="verify-badge">{verifyFa.VERIFIED}</span>
          ) : (
            verifyFa[verification?.status ?? "NONE"] ?? verification?.status ?? "NONE"
          )}
        </p>
        {verification?.notes ? <p className="muted">{verification.notes}</p> : null}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={me.status === "PAUSED"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload("VERIFICATION", file).catch((err: unknown) => setError(err instanceof ApiError ? err.message : "ارسال نشد."));
          }}
        />
      </section>

      <div className="row" style={{ marginTop: 24 }}>
        <Link className="btn ghost" href="/safety">
          امنیت و قواعد
        </Link>
        <Link className="btn ghost" href="/privacy">
          حریم خصوصی
        </Link>
        <Link className="btn ghost" href="/terms">
          قوانین
        </Link>
      </div>

      <div className="row">
        {!me.emailVerified ? (
          <button className="btn ghost" type="button" onClick={() => resend().catch((err: unknown) => setError(err instanceof ApiError ? err.message : "ارسال نشد."))}>
            ارسال دوبارهٔ تأیید ایمیل
          </button>
        ) : null}
        {me.status === "PAUSED" ? (
          <button className="btn" type="button" onClick={() => api<Me>("/users/me/resume", { method: "POST" }).then(setMe)}>
            از سر گرفتن حساب
          </button>
        ) : (
          <button className="btn ghost" type="button" onClick={() => api<Me>("/users/me/pause", { method: "POST" }).then(setMe)}>
            توقف موقت
          </button>
        )}
        <button
          className="btn ghost"
          type="button"
          onClick={async () => {
            await api("/auth/logout", { method: "POST" }).catch(() => undefined);
            clearSession();
            router.replace("/");
          }}
        >
          خروج
        </button>
        <button
          className="btn danger"
          type="button"
          onClick={async () => {
            if (!confirm("حساب برای همیشه حذف شود؟")) return;
            await api("/users/me", { method: "DELETE" });
            clearSession();
            router.replace("/");
          }}
        >
          حذف حساب
        </button>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<main className="wrap">در حال بارگذاری...</main>}>
      <AccountBody />
    </Suspense>
  );
}
