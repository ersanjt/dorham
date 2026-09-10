import { useEffect, useState } from "react";
import { Alert, Image } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import type { EventDto, Me, PublicUser } from "@dorham/shared";
import { EventCard } from "../../components/event-card";
import { AppText, Banner, Button, Card, Loading, Screen } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { publicMediaUrl } from "../../lib/api-base";
import { verifyFa } from "../../lib/format";
import { loginHref } from "../../lib/paths";
import { isSignedIn } from "../../lib/session";

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [person, setPerson] = useState<PublicUser | null>(null);
  const [hosted, setHosted] = useState<EventDto[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!id) return;
    api<PublicUser>(`/users/${id}`, { auth: false })
      .then(setPerson)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "پروفایل خوانده نشد."));
    api<EventDto[]>(`/events?city=istanbul&hostId=${id}&limit=20`, { auth: false })
      .then(setHosted)
      .catch(() => setHosted([]));
    if (isSignedIn()) {
      api<Me>("/users/me")
        .then(setMe)
        .catch(() => setMe(null));
    }
  }, [id]);

  function blockUser() {
    if (!isSignedIn()) {
      router.push(loginHref(`/people/${id}`));
      return;
    }
    Alert.alert("بلاک", "این عضو بلاک شود؟", [
      { text: "نه", style: "cancel" },
      {
        text: "بلاک",
        style: "destructive",
        onPress: () => {
          api(`/users/${id}/block`, { method: "POST" })
            .then(() => setNotice("بلاک شد."))
            .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "بلاک نشد."));
        },
      },
    ]);
  }

  function reportUser() {
    if (!isSignedIn()) {
      router.push(loginHref(`/people/${id}`));
      return;
    }
    Alert.alert("گزارش", "این عضو گزارش شود؟", [
      { text: "نه", style: "cancel" },
      {
        text: "گزارش",
        style: "destructive",
        onPress: () => {
          api("/reports", {
            method: "POST",
            body: JSON.stringify({ targetId: id, reason: "other", details: "public profile" }),
          })
            .then(() => setNotice("گزارش ثبت شد."))
            .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "گزارش نشد."));
        },
      },
    ]);
  }

  if (!person && !error) {
    return (
      <Screen back title="عضو">
        <Loading />
      </Screen>
    );
  }

  const isSelf = me && person && me.id === person.id;

  return (
    <Screen back kicker="عضو شهر" title={person?.displayName ?? "عضو"}>
      <Banner text={error} />
      <Banner text={notice} tone="ok" />
      {person ? (
        <Card>
          {publicMediaUrl(person.photoUrl) ? (
            <Image
              accessibilityLabel={person.displayName}
              source={{ uri: publicMediaUrl(person.photoUrl) ?? undefined }}
              style={{ width: 72, height: 72, borderRadius: 36, alignSelf: "flex-start" }}
            />
          ) : null}
          <AppText muted>{verifyFa[person.verificationStatus] ?? person.verificationStatus}</AppText>
          <AppText>{person.bio || "هنوز معرفی ننوشته."}</AppText>
        </Card>
      ) : null}
      {person && !isSelf && isSignedIn() ? (
        <>
          <Button label="بلاک" variant="ghost" onPress={blockUser} />
          <Button label="گزارش" variant="ghost" onPress={reportUser} />
        </>
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
      ) : person ? (
        <>
          <AppText bold size="title">
            جمعه‌های این میزبان
          </AppText>
          <AppText muted>هنوز رویدادی میزبانی نکرده.</AppText>
          <Button label="رویدادهای شهر" variant="ghost" onPress={() => router.push("/events")} />
        </>
      ) : null}
    </Screen>
  );
}
