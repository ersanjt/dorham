import { useEffect, useState } from "react";
import { Linking, Share, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import type { EventDoor, EventGuest } from "@dorham/shared";
import { AppText, Banner, Button, Card, Loading, Screen } from "../../../../components/ui";
import { api, ApiError } from "../../../../lib/api";
import { isSignedIn } from "../../../../lib/session";
import { color, space } from "../../../../lib/theme";

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

  const waiting = guests.filter((guest) => !guest.checkedInAt);
  const checked = guests.filter((guest) => guest.checkedInAt);

  async function checkIn(guest: EventGuest) {
    try {
      await api(`/events/${id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ userId: guest.id }),
      });
      setNotice(
        guest.ticketStatus === "DUE"
          ? `${guest.displayName} وارد شد · نقد گرفته شد.`
          : `${guest.displayName} وارد شد.`,
      );
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "چک‌این نشد.");
    }
  }

  return (
    <Screen
      back
      kicker="میزبان"
      title="در ورودی"
      subtitle="مهمان QR را اسکن می‌کند یا تو ورود دستی می‌زنی."
    >
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
          <View style={{ alignItems: "center", paddingVertical: space.md, backgroundColor: color.cream, borderRadius: 12 }}>
            <QRCode value={door.url} size={220} backgroundColor={color.cream} color={color.ink} />
          </View>
          <AppText muted size="caption" align="center">
            لینک ورود مهمان — دعوت عمومی نیست
          </AppText>
          <Button label="باز کردن صفحهٔ وب در" onPress={() => Linking.openURL(door.url).catch(() => undefined)} />
          <Button
            label="فرستادن لینک در به هم‌میزبان"
            variant="ghost"
            onPress={() =>
              Share.share({
                message: `لینک در رویداد (فقط میزبان):\n${door.url}`,
              }).catch(() => undefined)
            }
          />
        </Card>
      ) : null}
      {waiting.length > 0 ? (
        <AppText bold size="title">
          منتظر ورود
        </AppText>
      ) : null}
      {waiting.map((guest) => (
        <Card key={guest.id}>
          <AppText bold>{guest.displayName}</AppText>
          <AppText muted size="caption">
            {guest.ticketStatus === "DUE"
              ? "بلیت دم در"
              : guest.ticketStatus === "PAID_DOOR"
                ? "بلیت گرفته شده"
                : "ورود رایگان"}
          </AppText>
          <Button
            label={guest.ticketStatus === "DUE" ? "ورود + نقد گرفت" : "ورود دستی"}
            onPress={() => checkIn(guest)}
          />
        </Card>
      ))}
      {checked.length > 0 ? (
        <AppText bold size="title">
          وارد شده
        </AppText>
      ) : null}
      {checked.map((guest) => (
        <Card key={guest.id}>
          <AppText bold>{guest.displayName}</AppText>
          <AppText muted size="caption">
            وارد شد
            {guest.ticketStatus === "PAID_DOOR" ? " · بلیت گرفته شد" : ""}
          </AppText>
        </Card>
      ))}
    </Screen>
  );
}
