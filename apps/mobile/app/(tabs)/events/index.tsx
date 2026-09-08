import { useEffect, useState } from "react";
import { router } from "expo-router";
import type { EventDto, Me } from "@dorham/shared";
import { EventCard } from "../../../components/event-card";
import { Button, Empty, ErrorState, Screen } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";

export default function EventsScreen() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");

  function load() {
    setError("");
    api<EventDto[]>("/events?city=istanbul&limit=20", { auth: false })
      .then(setEvents)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "API روشن است؟"));
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
    <Screen kicker="صفحهٔ اول دورهم" title="رویدادهای استانبول" subtitle="بهانهٔ حضوری. مهمان‌لیست واقعی — نه کارت سوایپ.">
      {error ? <ErrorState text={error} onRetry={load} /> : null}
      {canHost ? <Button label="رویداد تازه" onPress={() => router.push("/events/new")} /> : null}
      {events.length === 0 && !error ? <Empty text="هنوز رویدادی منتشر نشده." /> : null}
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={{ ...event, hostName: event.host.displayName }}
          onPress={() => router.push(`/events/${event.id}`)}
        />
      ))}
    </Screen>
  );
}
