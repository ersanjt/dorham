"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { VenueHangPlanDto, VenuePhotoDto } from "@dorham/shared";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";

const INTENT_FA: Record<string, string> = {
  LUNCH: "ناهار",
  DINNER: "شام",
  COFFEE: "قهوه",
  OTHER: "دورهم",
};

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function VenueCommunity({ slug }: { slug: string }) {
  const [plans, setPlans] = useState<VenueHangPlanDto[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  async function loadPlans() {
    const data = await api<VenueHangPlanDto[]>(`/venues/${slug}/plans`);
    setPlans(data);
  }

  useEffect(() => {
    setSignedIn(isSignedIn());
    loadPlans().catch(() => setPlans([]));
  }, [slug]);

  async function onPhoto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    const form = e.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement)?.files?.[0];
    const caption = String(new FormData(form).get("caption") ?? "").trim();
    if (!file) {
      setError("یک عکس انتخاب کن.");
      return;
    }
    try {
      const body = new FormData();
      body.append("file", file);
      const media = await api<{ id: string }>("/media?kind=VENUE_PHOTO", { method: "POST", body });
      await api<VenuePhotoDto>(`/venues/${slug}/photos`, {
        method: "POST",
        body: JSON.stringify({ mediaId: media.id, caption: caption || undefined }),
      });
      setNotice("عکس ثبت شد و بعد از بررسی مدیر در گالری می‌آید.");
      form.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "آپلود نشد.");
    }
  }

  async function onPlan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    const form = new FormData(e.currentTarget);
    const local = String(form.get("startsAt") ?? "");
    const intent = String(form.get("intent") ?? "OTHER");
    const note = String(form.get("note") ?? "").trim();
    if (!local) {
      setError("زمان را انتخاب کن.");
      return;
    }
    try {
      await api(`/venues/${slug}/plans`, {
        method: "POST",
        body: JSON.stringify({
          startsAt: new Date(local).toISOString(),
          intent,
          note: note || undefined,
        }),
      });
      setNotice("برنامه‌ات ثبت شد. دیگران می‌توانند ببینند.");
      e.currentTarget.reset();
      await loadPlans();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "برنامه ثبت نشد.");
    }
  }

  const defaultTime = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(13, 0, 0, 0);
    return toLocalInputValue(d);
  })();

  return (
    <section className="stack" style={{ marginTop: 28 }}>
      <h2>عکس و برنامهٔ حضور</h2>
      <p className="muted">
        عکس‌ها بعد از تأیید مدیر عمومی می‌شوند. برنامهٔ حضور برای هماهنگی است — نه نقشهٔ زندهٔ «الان کی اینجاست».
      </p>
      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}

      {signedIn ? (
        <>
          <form className="form wide" onSubmit={onPhoto}>
            <label>
              عکس از مکان
              <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
            </label>
            <label>
              توضیح کوتاه (اختیاری)
              <input name="caption" maxLength={120} placeholder="مثلاً میز کنار پنجره" />
            </label>
            <button className="btn" type="submit">
              ارسال عکس برای بررسی
            </button>
          </form>

          <form className="form wide" onSubmit={onPlan}>
            <label>
              کی می‌آیی؟
              <input name="startsAt" type="datetime-local" defaultValue={defaultTime} required />
            </label>
            <label>
              برای چه
              <select name="intent" defaultValue="LUNCH">
                <option value="LUNCH">ناهار</option>
                <option value="DINNER">شام</option>
                <option value="COFFEE">قهوه</option>
                <option value="OTHER">دورهم</option>
              </select>
            </label>
            <label>
              یادداشت (اختیاری)
              <input name="note" maxLength={120} placeholder="مثلاً میز برای ۴ نفر" />
            </label>
            <button className="btn" type="submit">
              ثبت برنامه
            </button>
          </form>
        </>
      ) : (
        <p className="muted">
          برای عکس یا برنامه <Link href={`/login?next=/venues/${slug}`}>وارد شو</Link>.
        </p>
      )}

      <h3 style={{ marginTop: 8 }}>چه کسی کی می‌آید</h3>
      <div className="stack">
        {plans.length === 0 ? <p className="muted">هنوز برنامه‌ای برای دو هفتهٔ آینده نیست.</p> : null}
        {plans.map((plan) => (
          <article className="card" key={plan.id}>
            <p>
              <Link href={`/people/${plan.user.id}`}>{plan.user.displayName}</Link>
              {plan.user.verificationStatus === "VERIFIED" ? (
                <>
                  {" "}
                  <span className="verify-badge">تأییدشده</span>
                </>
              ) : null}
            </p>
            <p className="muted">
              {INTENT_FA[plan.intent] ?? plan.intent} ·{" "}
              {new Date(plan.startsAt).toLocaleString("fa-IR", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {plan.note ? <p>{plan.note}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
