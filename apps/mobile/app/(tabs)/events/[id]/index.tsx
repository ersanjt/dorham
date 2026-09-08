import { useEffect, useState } from "react";
import { Pressable, Share, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { EventDto, EventGuest, Me, RsvpResult } from "@dorham/shared";
import { AppText, Banner, Button, Card, Loading, Screen } from "../../../../components/ui";
import { api, ApiError } from "../../../../lib/api";
import { capacityWidth, eventInviteText, formatDayChip, formatPriceTry } from "../../../../lib/format";
import { loginHref } from "../../../../lib/paths";
import { isSignedIn } from "../../../../lib/session";
import { color, radius, space } from "../../../../lib/theme";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventDto | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!id) return;
    const [next, list] = await Promise.all([
      api<EventDto>(`/events/${id}`),
      api<EventGuest[]>(`/events/${id}/guests`, { auth: isSignedIn() }).catch(() => [] as EventGuest[]),
    ]);
    setEvent(next);
    setGuests(list);
    if (!isSignedIn()) {
      setMe(null);
      return;
    }
    setMe(await api<Me>("/users/me"));
  }

  useEffect(() => {
    load().catch((err: unknown) => setError(err instanceof ApiError ? err.message : "رویداد خوانده نشد."));
  }, [id]);

  const isHost = Boolean(me && event && (me.id === event.host.id || me.role === "ADMIN" || me.role === "MODERATOR"));
  const mine = event?.myRsvp ?? guests.find((guest) => guest.id === me?.id);
  const filled = event ? capacityWidth(event.goingCount, event.capacity) : null;
  const here = `/events/${id}`;

  async function rsvp() {
    if (!isSignedIn()) {
      router.push(loginHref(here));
      return;
    }
    try {
      const data = await api<RsvpResult>(`/events/${id}/rsvp`, { method: "POST", body: JSON.stringify({}) });
      setNotice(
        data.waitlisted
          ? "ظرفیت پر بود؛ رفتی لیست انتظار."
          : data.ticketStatus === "DUE" && event?.priceTry
            ? `ثبت شد. ${event.priceTry.toLocaleString("fa-IR")} لیر را نقد دم در بده.`
            : "ثبت شد. می‌آیی.",
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ثبت نشد.");
    }
  }

  async function cancel() {
    await api(`/events/${id}/rsvp`, { method: "DELETE", body: JSON.stringify({}) });
    setNotice("لغو شد.");
    await load();
  }

  if (!event && !error) {
    return (
      <Screen back title="رویداد">
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen
      back
      kicker={event ? `${event.venue ?? "استانبول"} · ${formatDayChip(event.startsAt)}` : undefined}
      title={event?.title ?? "رویداد"}
      subtitle={event ? `میزبان: ${event.host.displayName}` : undefined}
    >
      <Banner text={error} />
      <Banner text={notice} tone="ok" />
      {mine && "ticketStatus" in mine && mine.ticketStatus === "DUE" && event?.priceTry ? (
        <Banner text={`بلیت تو: ${event.priceTry.toLocaleString("fa-IR")} لیر نقد دم در.`} tone="ok" />
      ) : null}
      {event ? (
        <>
          <Pressable onPress={() => router.push(`/people/${event.host.id}`)}>
            <AppText muted>میزبان: {event.host.displayName}</AppText>
          </Pressable>
          <AppText>{event.description}</AppText>
          {event.address ? <AppText muted>{event.address}</AppText> : null}
          <Card>
            <AppText bold>{event.priceTry ? formatPriceTry(event.priceTry) : "ورود رایگان"}</AppText>
            {event.priceTry ? <AppText muted>نقد دم در. درگاه آنلاین بعداً.</AppText> : null}
            <AppText bold>
              {event.goingCount}
              {event.capacity ? ` از ${event.capacity}` : ""} نفر می‌آیند
            </AppText>
            <AppText muted>
              {event.capacity && event.goingCount >= event.capacity
                ? "ظرفیت پر است. می‌توانی به لیست انتظار بروی."
                : "هنوز جا هست."}
              {event.waitlistCount ? ` · ${event.waitlistCount} در انتظار` : ""}
            </AppText>
            {filled != null ? (
              <View
                style={{
                  height: 6,
                  borderRadius: radius.pill,
                  backgroundColor: color.paper,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${Math.max(filled, 8)}%`,
                    minWidth: 12,
                    height: "100%",
                    backgroundColor: color.clay,
                    borderRadius: radius.pill,
                  }}
                />
              </View>
            ) : null}
          </Card>
        </>
      ) : null}
      <Button
        label={event?.priceTry ? `می‌آیم · ${event.priceTry} لیر دم در` : "می‌آیم"}
        onPress={rsvp}
      />
      {mine ? <Button label="لغو RSVP" variant="ghost" onPress={cancel} /> : null}
      {event ? (
        <Button
          label="فرستادن دعوت"
          variant="ghost"
          onPress={() => Share.share({ message: eventInviteText(event) }).catch(() => undefined)}
        />
      ) : null}
      {event ? (
        <Button
          label="نوشتن در فید شهر"
          variant="ghost"
          onPress={() => router.push(`/feed?event=${event.id}`)}
        />
      ) : null}
      {isHost ? (
        <Button label="در ورودی" variant="ghost" onPress={() => router.push(`/events/${id}/door`)} />
      ) : null}
      {guests.length > 0 ? (
        <>
          <AppText bold size="title">
            مهمان‌ها
          </AppText>
          {guests.map((guest) => (
            <Pressable key={guest.id} onPress={() => router.push(`/people/${guest.id}`)}>
              <Card>
                <AppText bold>{guest.displayName}</AppText>
                <AppText muted size="caption">
                  {guest.status === "GOING" ? "می‌آید" : "لیست انتظار"}
                  {guest.ticketStatus === "DUE" ? " · بلیت دم در" : ""}
                  {guest.ticketStatus === "PAID_DOOR" ? " · بلیت گرفته شد" : ""}
                  {guest.checkedInAt ? " · وارد شد" : ""}
                </AppText>
              </Card>
            </Pressable>
          ))}
        </>
      ) : null}
      <View style={{ height: space.lg }} />
    </Screen>
  );
}
