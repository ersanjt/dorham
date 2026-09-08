import { useEffect, useState } from "react";
import { Linking, Share } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { EventDoor, EventGuest } from "@dorham/shared";
import { AppText, Banner, Button, Card, Loading, Screen } from "../../../../components/ui";
import { api, ApiError } from "../../../../lib/api";
import { isSignedIn } from "../../../../lib/session";

export default function DoorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [door, setDoor] = useState<EventDoor | null>(null);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function reload() {
    const [nextDoor, nextGuests] = await Promise.all([
      api<EventDoor>(`/events/${id}/door`),
      api<EventGuest[]>(`/events/${id}/guests`),
    ]);
    setDoor(nextDoor);
    setGuests(nextGuests.filter((guest) => guest.status === "GOING"));
  }

  useEffect(() => {
    if (!isSignedIn()) {
      setError("برای در باید وارد شوی.");
      return;
    }
    reload().catch((err: unknown) => setError(err instanceof ApiError ? err.message : "در خوانده نشد."));
  }, [id]);

  if (!door && !error) {
    return (
      <Screen back title="در ورودی">
        <Loading />
      </Screen>
    );
  }

  const due = guests.filter((guest) => guest.ticketStatus === "DUE" && !guest.checkedInAt);

  return (
    <Screen back kicker="میزبان" title="در ورودی" subtitle="نقد را همین‌جا بگیر. QR کامل روی وب است.">
      <Banner text={error} />
      <Banner text={notice} tone="ok" />
      {door ? (
        <Card>
          <AppText bold size="title">
            {door.title}
          </AppText>
          <AppText muted>
            {door.checkedInCount} از {door.goingCount} وارد شده‌اند
            {door.dueCount ? ` · ${door.dueCount} بلیت دم در` : ""}
            {door.paidCount ? ` · ${door.paidCount} گرفته شد` : ""}
          </AppText>
          <AppText muted size="caption">
            {door.url}
          </AppText>
          <Button label="باز کردن QR وب" onPress={() => Linking.openURL(door.url).catch(() => undefined)} />
          <Button
            label="فرستادن لینک در"
            variant="ghost"
            onPress={() => Share.share({ message: door.url }).catch(() => undefined)}
          />
        </Card>
      ) : null}
      {due.map((guest) => (
        <Card key={guest.id}>
          <AppText bold>{guest.displayName}</AppText>
          <AppText muted size="caption">
            بلیت دم در
          </AppText>
          <Button
            label="ورود + نقد گرفت"
            onPress={async () => {
              try {
                await api(`/events/${id}/checkin`, {
                  method: "POST",
                  body: JSON.stringify({ userId: guest.id }),
                });
                setNotice(`${guest.displayName} وارد شد.`);
                await reload();
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "چک‌این نشد.");
              }
            }}
          />
        </Card>
      ))}
    </Screen>
  );
}
