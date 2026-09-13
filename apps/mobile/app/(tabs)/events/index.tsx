import { useEffect, useState } from "react";
import { router } from "expo-router";
import type { EventDto, Me } from "@dorham/shared";
import { EventCard } from "../../../components/event-card";
import { AppText, Button, Empty, ErrorState, Loading, Screen, SectionTitle } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";

export default function EventsScreen() {
  const [community, setCommunity] = useState<EventDto[]>([]);
  const [cityShows, setCityShows] = useState<EventDto[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setError("");
    setLoading(true);
    Promise.all([
      api<EventDto[]>("/events?city=istanbul&kind=COMMUNITY&when=upcoming&limit=40", { auth: false }),
      api<EventDto[]>("/events?city=istanbul&kind=CITY_SHOW&when=upcoming&limit=40", { auth: false }),
    ])
      .then(([c, shows]) => {
        setCommunity(c);
        setCityShows(shows);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "رویدادها خوانده نشد."))
      .finally(() => setLoading(false));
    if (isSignedIn()) {
      api<Me>("/users/me")
        .then(setMe)
        .catch(() => undefined);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const canHost = me && (me.role === "HOST" || me.role === "MODERATOR" || me.role === "ADMIN");

  return (
    <Screen
      kicker="صفحهٔ اول دورهم"
      title="دورهمی‌های استانبول"
      subtitle="اینجا برای جمع شدن است — RSVP و دمِ در. فروش بلیط کنسرت کار دورهم نیست."
    >
      {error ? <ErrorState text={error} onRetry={load} /> : null}
      {canHost ? <Button label="ثبت دورهمی" onPress={() => router.push("/events/new")} /> : null}
      {loading && !error ? <Loading /> : null}

      <SectionTitle>جمع‌های جامعه</SectionTitle>
      {!loading && community.length === 0 && !error ? (
        <Empty text="هنوز دورهمی منتشر نشده. میزبان می‌تواند یکی بسازد." />
      ) : null}
      {community.map((event) => (
        <EventCard
          key={event.id}
          event={{ ...event, hostName: event.host.displayName, kind: event.kind }}
          onPress={() => router.push(`/events/${event.id}`)}
        />
      ))}

      {cityShows.length > 0 ? (
        <>
          <SectionTitle>تقویم شهر (هماهنگی)</SectionTitle>
          <AppText muted>
            کنسرت‌های عمومی فقط برای هماهنگی دوستان است — CTA داخل دورهم «علاقه‌مندم»، نه فروشگاه بلیط.
          </AppText>
          {cityShows.map((event) => (
            <EventCard
              key={event.id}
              event={{ ...event, kind: event.kind }}
              onPress={() => router.push(`/events/${event.id}`)}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
