import { useEffect, useState } from "react";
import { Alert, Pressable, Share, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { EventDto, EventGuest, Me, RsvpResult } from "@dorham/shared";
import { AppText, Banner, Button, Card, Empty, ErrorState, Loading, Screen } from "../../../../components/ui";
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
    setError("");
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
  const mineStatus = mine && "status" in mine ? mine.status : undefined;
  const ticketStatus = mine && "ticketStatus" in mine ? mine.ticketStatus : undefined;
  const paused = me?.status === "PAUSED";
  const filled = event ? capacityWidth(event.goingCount, event.capacity) : null;
  const here = `/events/${id}`;
  const alreadyGoing = mineStatus === "GOING";
  const waitlisted = mineStatus === "INTERESTED";

  async function rsvp() {
    if (!isSignedIn()) {
      router.push(loginHref(here));
      return;
    }
    if (paused) {
      setError("حساب متوقف است. از حساب، از سر بگیر.");
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
    try {
      await api(`/events/${id}/rsvp`, { method: "DELETE", body: JSON.stringify({}) });
      setNotice("لغو شد.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "لغو نشد.");
    }
  }

  if (!event && !error) {
    return (
      <Screen back title="رویداد">
        <Loading />
      </Screen>
    );
  }

  if (!event && error) {
    return (
      <Screen back title="رویداد">
        <ErrorState text={error} onRetry={() => load().catch(() => undefined)} />
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
      {paused ? (
        <Banner text="حساب متوقف است. ثبت حضور تازه بسته است؛ لغو هنوز ممکن است." />
      ) : null}
      {waitlisted ? <Banner text="در لیست انتظاری. اگر جا باز شود، وضعیتت در همین صفحه عوض می‌شود." /> : null}
      {alreadyGoing && ticketStatus === "DUE" && event?.priceTry ? (
        <Banner text={`بلیت تو: ${event.priceTry.toLocaleString("fa-IR")} لیر نقد دم در.`} />
      ) : null}
      {ticketStatus === "PAID_DOOR" ? <Banner text="بلیت‌ات دم در گرفته شد." tone="ok" /> : null}
      {alreadyGoing && ticketStatus !== "DUE" && ticketStatus !== "PAID_DOOR" ? (
        <Banner text="ثبت شدی. می‌آیی." tone="ok" />
      ) : null}
      {event ? (
        <>
          <Pressable onPress={() => router.push(`/people/${event.host.id}`)}>
            <AppText muted>میزبان: {event.host.displayName}</AppText>
          </Pressable>
          <AppText>{event.description}</AppText>
          {event.venueSlug ? (
            <Button
              label={`مکان: ${event.venue ?? "باز کردن"}`}
              variant="ghost"
              onPress={() => router.push(`/venues/${event.venueSlug}`)}
            />
          ) : null}
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
      {!alreadyGoing && !waitlisted ? (
        <Button
          label={
            !isSignedIn()
              ? "ورود برای ثبت حضور"
              : event?.priceTry
                ? `می‌آیم · ${event.priceTry} لیر دم در`
                : "می‌آیم"
          }
          onPress={rsvp}
          disabled={paused}
        />
      ) : null}
      {waitlisted && !paused ? (
        <Button label="در لیست انتظار هستی" disabled onPress={() => undefined} />
      ) : null}
      {alreadyGoing || waitlisted ? <Button label="لغو حضور" variant="ghost" onPress={cancel} /> : null}
      {paused ? (
        <Button label="از سر گرفتن حساب" variant="ghost" onPress={() => router.push("/account")} />
      ) : null}
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
        <Button label="در ورودی" onPress={() => router.push(`/events/${id}/door`)} />
      ) : null}
      {event && me && !isHost && !paused ? (
        <>
          <Button
            label="بلاک میزبان"
            variant="ghost"
            onPress={() => {
              Alert.alert("بلاک", "میزبان بلاک شود؟", [
                { text: "نه", style: "cancel" },
                {
                  text: "بلاک",
                  style: "destructive",
                  onPress: () => {
                    api(`/users/${event.host.id}/block`, { method: "POST" })
                      .then(() => setNotice("میزبان بلاک شد."))
                      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "بلاک نشد."));
                  },
                },
              ]);
            }}
          />
          <Button
            label="گزارش"
            variant="ghost"
            onPress={() => {
              Alert.alert("گزارش", "این رویداد / میزبان گزارش شود؟", [
                { text: "نه", style: "cancel" },
                {
                  text: "گزارش",
                  style: "destructive",
                  onPress: () => {
                    api("/reports", {
                      method: "POST",
                      body: JSON.stringify({ targetId: event.host.id, reason: "other", details: "event host" }),
                    })
                      .then(() => setNotice("گزارش ثبت شد."))
                      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "گزارش نشد."));
                  },
                },
              ]);
            }}
          />
        </>
      ) : null}
      <AppText bold size="title">
        مهمان‌ها
      </AppText>
      {guests.length === 0 ? <Empty text="هنوز کسی ثبت‌نام نکرده." /> : null}
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
      <View style={{ height: space.lg }} />
    </Screen>
  );
}
