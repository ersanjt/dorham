"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { EventDto, Me } from "@dorham/shared";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { useCopy, useUiLocale } from "../../components/locale-provider";
import { api, ApiError } from "../../lib/api";
import { formatDayChip } from "../../lib/format";
import { isSignedIn } from "../../lib/session";

function StartBody() {
  const copy = useCopy();
  const locale = useUiLocale();
  const router = useRouter();
  const search = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [event, setEvent] = useState<EventDto | null>(null);
  const [cityShow, setCityShow] = useState<EventDto | null>(null);
  const [notice, setNotice] = useState(search.get("verify") === "1" ? copy.start.verifyBanner : "");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/start");
      return;
    }
    Promise.all([
      api<Me>("/users/me"),
      api<EventDto[]>("/events?city=istanbul&kind=COMMUNITY&limit=1", { auth: false }).catch(() => []),
      api<EventDto[]>("/events?city=istanbul&kind=CITY_SHOW&limit=1", { auth: false }).catch(() => []),
    ])
      .then(([profile, events, shows]) => {
        setMe(profile);
        setEvent(events[0] ?? null);
        setCityShow(shows[0] ?? null);
        if (!profile.emailVerified && search.get("verify") !== "1") {
          setNotice(copy.start.verifyBanner);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : copy.auth.loginFail);
      });
  }, [router, search, copy.start.verifyBanner, copy.auth.loginFail]);

  async function resend() {
    setError("");
    setResending(true);
    try {
      const data = await api<{
        verifyEmailToken?: string;
        alreadyVerified?: boolean;
      }>("/auth/resend-verification", { method: "POST" });
      if (data.alreadyVerified) {
        setNotice(copy.start.already);
        setMe((current) => (current ? { ...current, emailVerified: true } : current));
        return;
      }
      if (data.verifyEmailToken) {
        router.push(`/verify-email?token=${encodeURIComponent(data.verifyEmailToken)}&next=/start`);
        return;
      }
      setNotice(copy.start.mailed);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.auth.registerFail);
    } finally {
      setResending(false);
    }
  }

  const featured = event ?? cityShow;
  const eventHref = featured ? `/events/${featured.id}` : "/events";
  const when = featured ? formatDayChip(featured.startsAt, locale) : "";

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.start.kicker} title={me ? `${copy.start.title} · ${me.displayName}` : copy.start.title}>
        <p className="muted">{copy.start.lead}</p>
      </PageIntro>
      {notice && me && !me.emailVerified ? (
        <div className="banner">
          {notice}{" "}
          <button className="linkish" type="button" disabled={resending} onClick={resend}>
            {copy.start.resend}
          </button>
        </div>
      ) : null}
      {notice && me?.emailVerified ? <div className="banner ok">{notice}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}

      <section className="start-steps">
        <article className="card">
          <p className="kicker">{copy.start.eventKicker}</p>
          <h2>{copy.start.eventTitle}</h2>
          {!event ? <p className="muted">{copy.start.eventEmpty}</p> : null}
          {featured ? (
            <p className="muted">
              {featured.title}
              {when ? ` · ${when}` : ""}
              {featured.venue ? ` · ${featured.venue}` : ""}
            </p>
          ) : null}
          {event ? <p className="muted">{copy.start.eventBody}</p> : null}
          {!event && cityShow ? <p className="muted">{copy.start.eventCalendarBody}</p> : null}
          <Link className="btn" href={eventHref}>
            {event ? copy.start.eventCta : copy.start.eventEmptyCta}
          </Link>
        </article>
        <article className="card">
          <p className="kicker">{copy.start.placeKicker}</p>
          <h2>{copy.start.placeTitle}</h2>
          <p className="muted">{copy.start.placeBody}</p>
          <Link className="btn" href="/venues">
            {copy.start.placeCta}
          </Link>
        </article>
        <article className="card">
          <p className="kicker">{copy.start.trustKicker}</p>
          <h2>{copy.start.trustTitle}</h2>
          <p className="muted">{copy.start.trustBody}</p>
          <Link className="btn ghost" href="/account?tab=trust">
            {copy.start.trustCta}
          </Link>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<main className="wrap">…</main>}>
      <StartBody />
    </Suspense>
  );
}
