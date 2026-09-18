"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Me, VenueHangPlanDto, VenuePhotoDto } from "@dorham/shared";
import { api, ApiError } from "../../../lib/api";
import { formatDayChip } from "../../../lib/format";
import { publicMediaUrl } from "../../../lib/media-url";
import { useSession } from "../../../lib/use-session";

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

function slotKey(plan: Pick<VenueHangPlanDto, "startsAt" | "intent">) {
  const d = new Date(plan.startsAt);
  return `${d.toISOString().slice(0, 13)}|${plan.intent}`;
}

type Slot = {
  key: string;
  startsAt: string;
  intent: VenueHangPlanDto["intent"];
  plans: VenueHangPlanDto[];
};

export function VenueCommunity({ slug }: { slug: string }) {
  const { signedIn, ready } = useSession();
  const [meId, setMeId] = useState<string | null>(null);
  const [plans, setPlans] = useState<VenueHangPlanDto[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [joining, setJoining] = useState<string | null>(null);
  const [showPhoto, setShowPhoto] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(false);

  async function loadPlans() {
    const data = await api<VenueHangPlanDto[]>(`/venues/${slug}/plans`);
    setPlans(data);
  }

  useEffect(() => {
    loadPlans().catch(() => setPlans([]));
  }, [slug]);

  useEffect(() => {
    if (!signedIn) {
      setMeId(null);
      return;
    }
    api<Me>("/users/me")
      .then((m) => setMeId(m.id))
      .catch(() => setMeId(null));
  }, [signedIn]);

  const slots = useMemo(() => {
    const map = new Map<string, Slot>();
    for (const plan of plans) {
      const key = slotKey(plan);
      const existing = map.get(key);
      if (existing) existing.plans.push(plan);
      else {
        map.set(key, {
          key,
          startsAt: plan.startsAt,
          intent: plan.intent,
          plans: [plan],
        });
      }
    }
    return [...map.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [plans]);

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
    setPendingPlan(true);
    const form = new FormData(e.currentTarget);
    const local = String(form.get("startsAt") ?? "");
    const intent = String(form.get("intent") ?? "OTHER");
    const note = String(form.get("note") ?? "").trim();
    if (!local) {
      setError("زمان را انتخاب کن.");
      setPendingPlan(false);
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
      setNotice("برنامه‌ات ثبت شد. دیگران می‌توانند ببینند و بپیوندند.");
      e.currentTarget.reset();
      await loadPlans();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "برنامه ثبت نشد.");
    } finally {
      setPendingPlan(false);
    }
  }

  async function joinSlot(slot: Slot) {
    setError("");
    setNotice("");
    setJoining(slot.key);
    try {
      await api(`/venues/${slug}/plans`, {
        method: "POST",
        body: JSON.stringify({
          startsAt: slot.startsAt,
          intent: slot.intent,
        }),
      });
      setNotice("به این زمان پیوستی.");
      await loadPlans();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "پیوستن ممکن نشد.");
    } finally {
      setJoining(null);
    }
  }

  const defaultTime = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(13, 0, 0, 0);
    return toLocalInputValue(d);
  })();

  return (
    <section className="venue-community" aria-label="هماهنگی حضور">
      <div className="section-head">
        <p className="kicker">دلیل برگشتن به دورهم</p>
        <h2>کی می‌آید اینجا؟</h2>
      </div>
      <p className="muted venue-community-lead">
        برنامهٔ حضور برای هماهنگی است — نه نقشهٔ زنده. اگر کسی زمان گذاشته، بپیوند؛ اگر نه، خودت اعلام کن.
      </p>
      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}

      <div className="hang-slots">
        {slots.length === 0 ? (
          <p className="muted">هنوز کسی برای دو هفتهٔ آینده اعلام نکرده. اولین نفر باش.</p>
        ) : (
          slots.map((slot) => {
            const iAmIn = meId ? slot.plans.some((p) => p.user.id === meId) : false;
            return (
              <article className="hang-slot" key={slot.key}>
                <header className="hang-slot-head">
                  <div>
                    <strong>{INTENT_FA[slot.intent] ?? slot.intent}</strong>
                    <span className="muted"> · {formatDayChip(slot.startsAt)}</span>
                  </div>
                  <span className="hang-slot-count">{slot.plans.length.toLocaleString("fa-IR")} نفر</span>
                </header>
                <ul className="hang-people">
                  {slot.plans.map((plan) => {
                    const photo = publicMediaUrl(plan.user.photoUrl);
                    return (
                      <li key={plan.id}>
                        <Link className="hang-person" href={`/people/${plan.user.id}`}>
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo} alt="" />
                          ) : (
                            <span className="hang-avatar-fallback" aria-hidden>
                              {plan.user.displayName.slice(0, 1)}
                            </span>
                          )}
                          <span className="hang-person-meta">
                            <span className="hang-person-name">{plan.user.displayName}</span>
                            {plan.user.verificationStatus === "VERIFIED" ? (
                              <span className="verify-badge">تأییدشده</span>
                            ) : null}
                            {plan.note ? <span className="muted hang-person-note">{plan.note}</span> : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {!ready ? null : signedIn ? (
                  iAmIn ? (
                    <p className="meta">تو هم در این زمان هستی.</p>
                  ) : (
                    <button
                      className="btn"
                      type="button"
                      disabled={joining === slot.key}
                      onClick={() => joinSlot(slot)}
                    >
                      {joining === slot.key ? "…" : "من هم می‌آیم"}
                    </button>
                  )
                ) : (
                  <p className="muted">
                    برای پیوستن <Link href={`/login?next=/venues/${slug}`}>وارد شو</Link>.
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>

      {!ready ? null : signedIn ? (
        <form className="form wide hang-plan-form" onSubmit={onPlan}>
          <h3>اعلام حضور تازه</h3>
          <div className="hang-plan-fields">
            <label>
              کی می‌آیی؟
              <input name="startsAt" type="datetime-local" defaultValue={defaultTime} required />
            </label>
            <label>
              برای چه
              <select name="intent" defaultValue="COFFEE">
                <option value="COFFEE">قهوه</option>
                <option value="LUNCH">ناهار</option>
                <option value="DINNER">شام</option>
                <option value="OTHER">دورهم</option>
              </select>
            </label>
          </div>
          <label>
            یادداشت (اختیاری)
            <input name="note" maxLength={120} placeholder="مثلاً میز برای ۴ نفر" />
          </label>
          <button className="btn" type="submit" disabled={pendingPlan}>
            {pendingPlan ? "در حال ثبت…" : "ثبت برنامه"}
          </button>
        </form>
      ) : (
        <p className="muted">
          برای اعلام حضور <Link href={`/login?next=/venues/${slug}`}>وارد شو</Link>.
        </p>
      )}

      <div className="venue-photo-box">
        <button className="linkish" type="button" onClick={() => setShowPhoto((v) => !v)}>
          {showPhoto ? "بستن ارسال عکس" : "ارسال عکس از مکان (بعد از تأیید مدیر)"}
        </button>
        {showPhoto && signedIn ? (
          <form className="form wide" onSubmit={onPhoto} style={{ marginTop: 12 }}>
            <label>
              عکس
              <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
            </label>
            <label>
              توضیح کوتاه (اختیاری)
              <input name="caption" maxLength={120} placeholder="مثلاً میز کنار پنجره" />
            </label>
            <button className="btn ghost" type="submit">
              ارسال برای بررسی
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
