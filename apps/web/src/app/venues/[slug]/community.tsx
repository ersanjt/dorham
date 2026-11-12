"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Me, VenueHangPlanDto, VenuePhotoDto } from "@dorham/shared";
import { useCopy, useUiLocale } from "../../../components/locale-provider";
import { api, ApiError } from "../../../lib/api";
import { formatDayChip } from "../../../lib/format";
import { publicMediaUrl } from "../../../lib/media-url";
import { useSession } from "../../../lib/use-session";

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
  const copy = useCopy();
  const locale = useUiLocale();
  const digits = locale === "en" ? "en-GB" : "fa-IR";
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
      setError(copy.venues.hangPickPhoto);
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
      setNotice(copy.venues.hangPhotoSaved);
      form.reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.venues.hangPhotoFail);
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
      setError(copy.venues.hangNeedTime);
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
      setNotice(copy.venues.hangSaved);
      e.currentTarget.reset();
      await loadPlans();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.venues.hangSaveFail);
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
      setNotice(copy.venues.hangJoined);
      await loadPlans();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.venues.hangJoinFail);
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
    <section className="venue-community" aria-label={copy.venues.hangAria}>
      <div className="section-head">
        <p className="kicker">{copy.venues.hangKicker}</p>
        <h2>{copy.venues.hangTitle}</h2>
      </div>
      <p className="muted venue-community-lead">{copy.venues.hangLead}</p>
      {notice ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}

      <div className="hang-slots">
        {slots.length === 0 ? (
          <div className="guest-empty">
            <p className="muted">{copy.venues.hangEmpty}</p>
            {!ready ? null : signedIn ? null : (
              <Link className="btn" href={`/login?next=/venues/${slug}`}>
                {copy.venues.hangBeFirst}
              </Link>
            )}
          </div>
        ) : (
          slots.map((slot) => {
            const iAmIn = meId ? slot.plans.some((p) => p.user.id === meId) : false;
            return (
              <article className="hang-slot" key={slot.key}>
                <header className="hang-slot-head">
                  <div>
                    <strong>{copy.intent[slot.intent as keyof typeof copy.intent] ?? slot.intent}</strong>
                    <span className="muted"> · {formatDayChip(slot.startsAt, locale)}</span>
                  </div>
                  <span className="hang-slot-count">{copy.venues.hangCount(slot.plans.length.toLocaleString(digits))}</span>
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
                              <span className="verify-badge">{copy.rsvp.verified}</span>
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
                    <p className="meta">{copy.venues.hangYouToo}</p>
                  ) : (
                    <button
                      className="btn"
                      type="button"
                      disabled={joining === slot.key}
                      onClick={() => joinSlot(slot)}
                    >
                      {joining === slot.key ? "…" : copy.venues.hangJoin}
                    </button>
                  )
                ) : (
                  <p className="muted">
                    <Link href={`/login?next=/venues/${slug}`}>{copy.venues.hangLoginJoin}</Link>
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>

      {!ready ? null : signedIn ? (
        <form className="form wide hang-plan-form" onSubmit={onPlan}>
          <h3>{copy.venues.hangNew}</h3>
          <div className="hang-plan-fields">
            <label>
              {copy.venues.hangWhen}
              <input name="startsAt" type="datetime-local" defaultValue={defaultTime} required />
            </label>
            <label>
              {copy.venues.hangWhy}
              <select name="intent" defaultValue="COFFEE">
                <option value="COFFEE">{copy.intent.COFFEE}</option>
                <option value="LUNCH">{copy.intent.LUNCH}</option>
                <option value="DINNER">{copy.intent.DINNER}</option>
                <option value="OTHER">{copy.intent.OTHER}</option>
              </select>
            </label>
          </div>
          <label>
            {copy.venues.hangNote}
            <input name="note" maxLength={120} placeholder={copy.venues.hangNotePh} />
          </label>
          <button className="btn" type="submit" disabled={pendingPlan}>
            {pendingPlan ? copy.venues.hangSaving : copy.venues.hangSave}
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link className="btn" href={`/login?next=/venues/${slug}`}>
            {copy.venues.hangLoginPlan}
          </Link>
        </p>
      )}

      <div className="venue-photo-box">
        <p className="muted">{copy.venues.hangPhotoLead}</p>
        <button className="btn ghost" type="button" onClick={() => setShowPhoto((v) => !v)}>
          {showPhoto ? copy.venues.hangPhotoClose : copy.venues.hangPhotoOpen}
        </button>
        {showPhoto && signedIn ? (
          <form className="form wide" onSubmit={onPhoto} style={{ marginTop: 12 }}>
            <label>
              {copy.venues.hangPhoto}
              <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
            </label>
            <label>
              {copy.venues.hangCaption}
              <input name="caption" maxLength={120} placeholder={copy.venues.hangCaptionPh} />
            </label>
            <button className="btn ghost" type="submit">
              {copy.venues.hangSubmitPhoto}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
