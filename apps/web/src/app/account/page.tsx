"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { EventDto, Me, MyVerification, NotificationsList, UserActivity } from "@dorham/shared";
import { EventCard } from "../../components/event-card";
import { SiteHeader } from "../../components/site-header";
import { SiteFooter } from "../../components/site-footer";
import { api, ApiError } from "../../lib/api";
import { verifyFa } from "../../lib/format";
import { clearSession, isSignedIn } from "../../lib/session";

type Tab = "overview" | "edit" | "activity" | "trust" | "inbox";

function completeness(me: Me, verification: MyVerification | null) {
  const checks = [
    { id: "photo", ok: Boolean(me.photoUrl), label: "عکس پروفایل", href: "#edit" as const },
    { id: "bio", ok: Boolean(me.bio && me.bio.trim().length >= 20), label: "معرفی حداقل ۲۰ حرف", href: "#edit" as const },
    { id: "email", ok: me.emailVerified, label: "تأیید ایمیل", href: "#trust" as const },
    {
      id: "verify",
      ok: (verification?.status ?? me.verificationStatus) === "VERIFIED",
      label: "تأیید دست‌نویس",
      href: "#trust" as const,
    },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { checks, score };
}

function AccountBody() {
  const router = useRouter();
  const search = useSearchParams();
  const photoInput = useRef<HTMLInputElement>(null);
  const verifyInput = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [me, setMe] = useState<Me | null>(null);
  const [verification, setVerification] = useState<MyVerification | null>(null);
  const [mine, setMine] = useState<EventDto[]>([]);
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [notes, setNotes] = useState<NotificationsList | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(search.get("verify") === "1" ? "لینک تأیید به ایمیلت فرستاده شد." : "");
  const [saving, setSaving] = useState(false);

  async function reload() {
    const [profile, verify, events, act, inbox] = await Promise.all([
      api<Me>("/users/me"),
      api<MyVerification>("/users/me/verification"),
      api<EventDto[]>("/events/mine"),
      api<UserActivity>("/users/me/activity"),
      api<NotificationsList>("/users/me/notifications").catch(() => ({ unreadCount: 0, items: [] })),
    ]);
    setMe(profile);
    setVerification(verify);
    setMine(events);
    setActivity(act);
    setNotes(inbox);
  }

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/account");
      return;
    }
    reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : "حساب خوانده نشد.");
    });
  }, [router]);

  const progress = useMemo(() => (me ? completeness(me, verification) : null), [me, verification]);

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!me) return;
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    try {
      const next = await api<Me>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: String(form.get("displayName") ?? me.displayName),
          bio: String(form.get("bio") ?? "") || null,
          city: String(form.get("city") || me.city) as Me["city"],
          locale: String(form.get("locale") || me.locale) as Me["locale"],
        }),
      });
      setMe(next);
      setNotice("پروفایل ذخیره شد.");
      setTab("overview");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیره نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: "PROFILE" | "VERIFICATION", file: File) {
    setError("");
    const body = new FormData();
    body.append("file", file);
    const media = await api<{ id: string }>(`/media?kind=${kind}`, { method: "POST", body });
    if (kind === "PROFILE") {
      await api("/users/me/photo", { method: "POST", body: JSON.stringify({ mediaId: media.id }) });
    } else {
      await api("/users/me/verification", { method: "POST", body: JSON.stringify({ mediaId: media.id }) });
    }
    await reload();
    setNotice(kind === "PROFILE" ? "عکس پروفایل به‌روز شد." : "عکس تأیید ارسال شد و در صف بررسی است.");
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
        <p className="muted profile-loading">{error || "در حال بارگذاری پروفایل…"}</p>
      </main>
    );
  }

  const memberSince = new Date(me.createdAt).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
  });
  const cityLabel = me.city === "istanbul" ? "استانبول" : me.city === "ankara" ? "آنکارا" : "ازمیر";
  const unread = notes?.unreadCount ?? 0;

  return (
    <main className="wrap profile-page">
      <SiteHeader />

      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      {me.status === "PAUSED" ? (
        <div className="banner err">حساب متوقف است. از سر بگیر تا پروفایل، حضور و فید دوباره باز شوند.</div>
      ) : null}

      <header className="profile-hero">
        <div className="profile-hero-cover" aria-hidden />
        <div className="profile-hero-body">
          <div className="profile-avatar-wrap">
            {me.photoUrl ? (
              <img className="profile-avatar" src={me.photoUrl} alt="" />
            ) : (
              <div className="profile-avatar profile-avatar-empty" aria-hidden>
                {me.displayName.slice(0, 1)}
              </div>
            )}
            <button
              className="profile-avatar-edit"
              type="button"
              disabled={me.status === "PAUSED"}
              onClick={() => photoInput.current?.click()}
              aria-label="تعویض عکس پروفایل"
            >
              عکس
            </button>
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  upload("PROFILE", file).catch((err: unknown) =>
                    setError(err instanceof ApiError ? err.message : "آپلود نشد."),
                  );
                }
                e.target.value = "";
              }}
            />
          </div>

          <div className="profile-hero-meta">
            <div className="profile-name-row">
              <h1 className="profile-name">{me.displayName}</h1>
              {me.verificationStatus === "VERIFIED" ? (
                <span className="verify-badge">{verifyFa.VERIFIED}</span>
              ) : null}
            </div>
            <p className="profile-sub">
              {cityLabel} · عضو از {memberSince}
              {me.role === "HOST" || me.role === "MODERATOR" || me.role === "ADMIN" ? (
                <> · {me.role === "ADMIN" ? "مدیر" : me.role === "MODERATOR" ? "ناظر" : "میزبان"}</>
              ) : null}
            </p>
            <p className="profile-bio-preview">{me.bio?.trim() || "هنوز معرفی ننوشته‌ای — پروفایل کامل، اعتماد می‌سازد."}</p>
            <div className="profile-badge-row">
              {me.emailVerified ? <span className="badge ok">ایمیل تأیید شد</span> : <span className="badge">ایمیل تأیید نشده</span>}
              {me.verificationStatus !== "VERIFIED" ? (
                <span className="badge">{verifyFa[me.verificationStatus] ?? me.verificationStatus}</span>
              ) : null}
              {me.status === "PAUSED" ? <span className="badge">متوقف</span> : null}
            </div>
            <div className="profile-actions">
              <Link className="btn" href={`/people/${me.id}`}>
                مشاهدهٔ عمومی
              </Link>
              <button className="btn ghost" type="button" onClick={() => setTab("edit")}>
                ویرایش پروفایل
              </button>
              <Link className="btn ghost" href="/events">
                رویدادها
              </Link>
              {(me.role === "ADMIN" || me.role === "MODERATOR" || me.role === "HOST") && (
                <Link className="btn ghost" href="/events/new">
                  رویداد تازه
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {progress ? (
        <section className="profile-complete" aria-label="کامل بودن پروفایل">
          <div className="profile-complete-head">
            <div>
              <h2>کامل بودن پروفایل</h2>
              <p className="muted">هر قدم اعتماد مهمان‌لیست و میزبان را بالا می‌برد.</p>
            </div>
            <strong className="profile-score">{progress.score.toLocaleString("fa-IR")}٪</strong>
          </div>
          <div className="profile-complete-bar" aria-hidden>
            <i style={{ width: `${progress.score}%` }} />
          </div>
          <ul className="profile-checklist">
            {progress.checks.map((c) => (
              <li key={c.id} className={c.ok ? "done" : ""}>
                <span>{c.ok ? "✓" : "○"}</span>
                {c.label}
                {!c.ok ? (
                  <button
                    className="linkish"
                    type="button"
                    onClick={() => setTab(c.href === "#trust" ? "trust" : "edit")}
                  >
                    تکمیل
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="profile-tabs" aria-label="بخش‌های حساب">
        {(
          [
            ["overview", "نمای کلی"],
            ["edit", "ویرایش"],
            ["activity", "حضور"],
            ["trust", "امنیت و تأیید"],
            ["inbox", unread > 0 ? `اعلان‌ها (${unread.toLocaleString("fa-IR")})` : "اعلان‌ها"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <section className="profile-panel">
          {activity ? (
            <div className="account-stats profile-stats">
              <div className="account-stat">
                <strong>{activity.stats.venuesVisited.toLocaleString("fa-IR")}</strong>
                <span>مکان تأییدشده</span>
              </div>
              <div className="account-stat">
                <strong>{activity.stats.eventsAttended.toLocaleString("fa-IR")}</strong>
                <span>چک‌این رویداد</span>
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
          ) : null}
          <div className="profile-grid-two">
            <div>
              <h3>درباره</h3>
              <p className="prose">{me.bio?.trim() || "معرفی خالی است. یک پاراگراف کوتاه بنویس تا دیگران بدانند با کی طرف‌اند."}</p>
              <p className="muted">ایمیل فقط برای خودت دیده می‌شود: {me.email}</p>
            </div>
            <div>
              <h3>میانبرها</h3>
              <ul className="profile-links">
                <li>
                  <Link href="/feed">فید شهر</Link>
                </li>
                <li>
                  <Link href="/venues">مکان‌های ایرانی</Link>
                </li>
                <li>
                  <Link href="/venues/new">پیشنهاد مکان تازه</Link>
                </li>
                <li>
                  <Link href="/safety">امنیت و قواعد</Link>
                </li>
                {(me.role === "ADMIN" || me.role === "MODERATOR") && (
                  <li>
                    <Link href="/admin">صف مدیریت</Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
          {mine.length > 0 ? (
            <div style={{ marginTop: 28 }}>
              <h3>رویدادهای من</h3>
              <div className="grid">
                {mine.slice(0, 4).map((event) => (
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
                      kind: event.kind,
                      externalTicketUrl: event.externalTicketUrl,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "edit" ? (
        <section id="edit" className="profile-panel">
          <h2>ویرایش پروفایل</h2>
          <p className="muted">نام و معرفی در پروفایل عمومی دیده می‌شود. ایمیل هرگز عمومی نیست.</p>
          <form className="form wide profile-edit-form" onSubmit={saveProfile}>
            <label>
              نام نمایشی
              <input name="displayName" defaultValue={me.displayName} minLength={2} maxLength={40} required />
            </label>
            <label>
              معرفی
              <textarea
                name="bio"
                defaultValue={me.bio ?? ""}
                maxLength={280}
                rows={4}
                placeholder="مثلاً: مقیم کادیکوی، علاقه به رویدادهای فارسی‌زبان و شام جمعه."
              />
            </label>
            <div className="profile-edit-row">
              <label>
                شهر
                <select name="city" defaultValue={me.city}>
                  <option value="istanbul">استانبول</option>
                  <option value="ankara">آنکارا</option>
                  <option value="izmir">ازمیر</option>
                </select>
              </label>
              <label>
                زبان رابط
                <select name="locale" defaultValue={me.locale}>
                  <option value="FA">فارسی</option>
                  <option value="EN">English</option>
                  <option value="TR">Türkçe</option>
                </select>
              </label>
            </div>
            <div className="row">
              <button className="btn" type="submit" disabled={me.status === "PAUSED" || saving}>
                {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
              </button>
              <button className="btn ghost" type="button" onClick={() => photoInput.current?.click()} disabled={me.status === "PAUSED"}>
                تعویض عکس
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === "activity" ? (
        <section className="profile-panel" aria-label="حضور در شهر">
          <h2>حضور در شهر</h2>
          {!activity ? (
            <p className="muted">آمار هنوز بارگذاری نشده.</p>
          ) : (
            <>
              {activity.stats.pendingVenueVisits > 0 ? (
                <p className="muted">
                  {activity.stats.pendingVenueVisits.toLocaleString("fa-IR")} درخواست حضور در انتظار تأیید صاحب مکان.
                </p>
              ) : null}
              <h3>مکان‌های تأییدشده</h3>
              {activity.venues.length === 0 ? (
                <p className="muted">هنوز مکانی با تأیید صاحب کسب‌وکار نداری.</p>
              ) : (
                <ul className="account-history profile-history">
                  {activity.venues.map((v) => (
                    <li key={v.id}>
                      <Link href={`/venues/${v.venueSlug}`}>{v.venueName}</Link>
                      <span className="muted">
                        {" "}
                        · {v.visitCount.toLocaleString("fa-IR")} بار · {new Date(v.lastVisitedAt).toLocaleDateString("fa-IR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <h3>رویدادهایی که وارد شده‌ای</h3>
              {activity.eventsAttended.length === 0 ? (
                <p className="muted">هنوز چک‌این نداری.</p>
              ) : (
                <ul className="account-history profile-history">
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
              <h3>برنامه‌های حضور آینده</h3>
              {(activity.hangPlans ?? []).length === 0 ? (
                <p className="muted">برنامه‌ای ثبت نکرده‌ای.</p>
              ) : (
                <ul className="account-history profile-history">
                  {(activity.hangPlans ?? []).map((plan) => (
                    <li key={plan.id}>
                      <Link href={`/venues/${plan.venueSlug}`}>{plan.venueName}</Link>
                      <span className="muted">
                        {" "}
                        ·{" "}
                        {new Date(plan.startsAt).toLocaleString("fa-IR", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>{" "}
                      <button
                        className="btn ghost"
                        type="button"
                        style={{ padding: "2px 8px", fontSize: "0.85rem" }}
                        onClick={async () => {
                          try {
                            await api(`/venues/plans/${plan.id}`, { method: "DELETE" });
                            await reload();
                            setNotice("برنامه لغو شد.");
                          } catch (err) {
                            setError(err instanceof ApiError ? err.message : "لغو نشد.");
                          }
                        }}
                      >
                        لغو
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      ) : null}

      {tab === "trust" ? (
        <section id="trust" className="profile-panel">
          <h2>امنیت و تأیید هویت</h2>
          <div className="profile-trust-grid">
            <article className="profile-trust-card">
              <h3>ایمیل</h3>
              <p className="muted">{me.email}</p>
              {me.emailVerified ? (
                <p>
                  <span className="badge ok">تأیید شده</span>
                </p>
              ) : (
                <>
                  <p className="muted">تا تأیید ایمیل، برخی کارها محدود می‌مانند.</p>
                  <button className="btn" type="button" onClick={() => resend().catch((err: unknown) => setError(err instanceof ApiError ? err.message : "ارسال نشد."))}>
                    ارسال لینک تأیید
                  </button>
                </>
              )}
            </article>
            <article className="profile-trust-card">
              <h3>تأیید دست‌نویس</h3>
              <p className="muted">
                روی کاغذ بنویس «دورهم» و نام نمایشی، عکس بگیر. عکس عمومی نمی‌شود. هدف هزینه ۲۵۰ لیر در سال است؛ فعلاً برای
                جمعه‌های اول رایگان.
              </p>
              <p>
                وضعیت:{" "}
                {(verification?.status ?? me.verificationStatus) === "VERIFIED" ? (
                  <span className="verify-badge">{verifyFa.VERIFIED}</span>
                ) : (
                  verifyFa[verification?.status ?? me.verificationStatus] ?? verification?.status
                )}
              </p>
              {verification?.notes ? <p className="muted">{verification.notes}</p> : null}
              <button
                className="btn ghost"
                type="button"
                disabled={me.status === "PAUSED"}
                onClick={() => verifyInput.current?.click()}
              >
                ارسال / به‌روزرسانی عکس تأیید
              </button>
              <input
                ref={verifyInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    upload("VERIFICATION", file).catch((err: unknown) =>
                      setError(err instanceof ApiError ? err.message : "ارسال نشد."),
                    );
                  }
                  e.target.value = "";
                }}
              />
            </article>
          </div>
          <div className="profile-danger">
            <h3>کنترل حساب</h3>
            <div className="row">
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
                  if (!confirm("حساب برای همیشه حذف شود؟ این کار برگشت‌پذیر نیست.")) return;
                  await api("/users/me", { method: "DELETE" });
                  clearSession();
                  router.replace("/");
                }}
              >
                حذف حساب
              </button>
            </div>
            <p className="muted" style={{ marginTop: 12 }}>
              <Link href="/privacy">حریم خصوصی</Link> · <Link href="/terms">قوانین</Link> · <Link href="/safety">امنیت</Link>
            </p>
          </div>
        </section>
      ) : null}

      {tab === "inbox" ? (
        <section id="notifications" className="profile-panel">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>اعلان‌ها</h2>
            {notes && notes.items.length > 0 ? (
              <button
                className="btn ghost"
                type="button"
                onClick={async () => {
                  await api("/users/me/notifications/read", { method: "POST", body: "{}" });
                  await reload();
                }}
              >
                همه خوانده شد
              </button>
            ) : null}
          </div>
          {!notes || notes.items.length === 0 ? (
            <p className="muted">اعلانی نیست. وقتی نظر/عکس تأیید شود اینجا می‌آید.</p>
          ) : (
            <ul className="account-history profile-history">
              {notes.items.map((n) => (
                <li key={n.id} style={{ opacity: n.readAt ? 0.65 : 1 }}>
                  <strong>{n.title}</strong>
                  <span className="muted"> — {n.body}</span>
                  {n.href ? (
                    <>
                      {" "}
                      <Link href={n.href}>باز کن</Link>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="wrap">
          <SiteHeader />
          <p className="muted">در حال بارگذاری…</p>
        </main>
      }
    >
      <AccountBody />
    </Suspense>
  );
}
