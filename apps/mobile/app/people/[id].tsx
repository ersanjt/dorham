import { useEffect, useState } from "react";
import { Image } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import type { EventDto, PublicUser } from "@dorham/shared";
import { EventCard } from "../../components/event-card";
import { AppText, Banner, Card, Loading, Screen } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { publicMediaUrl } from "../../lib/api-base";
import { verifyFa } from "../../lib/format";

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [person, setPerson] = useState<PublicUser | null>(null);
  const [hosted, setHosted] = useState<EventDto[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api<PublicUser>(`/users/${id}`, { auth: false })
      .then(setPerson)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "پروفایل خوانده نشد."));
    api<EventDto[]>(`/events?city=istanbul&hostId=${id}&limit=20`, { auth: false })
      .then(setHosted)
      .catch(() => setHosted([]));
  }, [id]);

  if (!person && !error) {
    return (
      <Screen back title="عضو">
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen back kicker="عضو شهر" title={person?.displayName ?? "عضو"}>
      <Banner text={error} />
      {person ? (
        <Card>
          {publicMediaUrl(person.photoUrl) ? (
            <Image
              accessibilityLabel={person.displayName}
              source={{ uri: publicMediaUrl(person.photoUrl) ?? undefined }}
              style={{ width: 72, height: 72, borderRadius: 36, alignSelf: "flex-end" }}
            />
          ) : null}
          <AppText muted>{verifyFa[person.verificationStatus] ?? person.verificationStatus}</AppText>
          <AppText>{person.bio || "هنوز معرفی ننوشته."}</AppText>
        </Card>
      ) : null}
      {hosted.length > 0 ? (
        <>
          <AppText bold size="title">
            جمعه‌های این میزبان
          </AppText>
          {hosted.map((event) => (
            <EventCard
              key={event.id}
              event={{ ...event, hostName: event.host.displayName }}
              onPress={() => router.push(`/events/${event.id}`)}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
