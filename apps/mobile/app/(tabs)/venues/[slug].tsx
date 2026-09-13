import { useEffect, useState } from "react";
import { Image, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { EventDto, VenueDto, VenueReview } from "@dorham/shared";
import { EventCard } from "../../../components/event-card";
import { VenueHangPlans } from "../../../components/venue-hang-plans";
import { AppText, Banner, Button, Card, Field, Loading, Screen } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
import { publicMediaUrl } from "../../../lib/api-base";
import { venueKindFa } from "../../../lib/format";
import { loginHref } from "../../../lib/paths";
import { isSignedIn } from "../../../lib/session";
import { color } from "../../../lib/theme";

export default function VenueDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [venue, setVenue] = useState<VenueDto | null>(null);
  const [reviews, setReviews] = useState<VenueReview[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!slug) return;
    api<VenueDto>(`/venues/${slug}`, { auth: false })
      .then(setVenue)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "مکان خوانده نشد."));
    api<VenueReview[]>(`/venues/${slug}/reviews`, { auth: false })
      .then(setReviews)
      .catch(() => setReviews([]));
    api<EventDto[]>(`/events?city=istanbul&kind=COMMUNITY&venueSlug=${encodeURIComponent(slug)}&limit=10`, { auth: false })
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [slug]);

  async function publish() {
    if (!isSignedIn()) {
      setError("برای نظر وارد شو.");
      return;
    }
    try {
      const row = await api<VenueReview>(`/venues/${slug}/reviews`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setReviews((rows) => [row, ...rows]);
      setBody("");
      setNotice("تجربه‌ات ثبت شد.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "نظر ثبت نشد.");
    }
  }

  if (!venue && !error) {
    return (
      <Screen back title="مکان">
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen
      back
      kicker={venue ? `${venueKindFa[venue.kind] ?? venue.kind} · ${venue.area}` : undefined}
      title={venue?.name ?? "مکان"}
    >
      <Banner text={error} />
      <Banner text={notice} tone="ok" />
      {venue ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {publicMediaUrl(venue.photos?.[0] || venue.mapImageUrl) ? (
            <Image
              source={{ uri: publicMediaUrl(venue.photos?.[0] || venue.mapImageUrl)! }}
              accessibilityLabel={venue.name}
              style={{ width: "100%", height: 180, backgroundColor: color.paperDeep }}
              resizeMode="cover"
            />
          ) : null}
        </Card>
      ) : null}
      {venue ? (
        <Card>
          <AppText>{venue.description}</AppText>
          <AppText muted>{venue.address}</AppText>
          {venue.lat != null && venue.lng != null ? (
            <AppText muted size="caption">
              مختصات: {venue.lat.toFixed(5)}, {venue.lng.toFixed(5)}
            </AppText>
          ) : null}
          {venue.hours ? <AppText muted>ساعت: {venue.hours}</AppText> : null}
          {venue.priceRange ? <AppText muted>قیمت: {venue.priceRange}</AppText> : null}
          {venue.menuNotes ? <AppText muted>منو: {venue.menuNotes}</AppText> : null}
          <AppText muted>{venue.reviewCount} نظر</AppText>
        </Card>
      ) : null}
      {venue ? <Button label="باز کردن در گوگل‌مپ" onPress={() => Linking.openURL(venue.mapsUrl)} /> : null}
      {venue ? (
        <Button
          label="نوشتن در فید شهر"
          variant="ghost"
          onPress={() => router.push(`/feed?venue=${venue.slug}`)}
        />
      ) : null}
      {slug ? <VenueHangPlans slug={slug} /> : null}
      <AppText bold size="title">
        رویدادها در این مکان
      </AppText>
      {events.length === 0 ? <AppText muted>هنوز رویدادی برای اینجا اعلام نشده.</AppText> : null}
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={{ ...event, hostName: event.host.displayName }}
          onPress={() => router.push(`/events/${event.id}`)}
        />
      ))}
      <AppText bold size="title">
        تجربه‌ها
      </AppText>
      {reviews.map((row) => (
        <Card key={row.id}>
          <AppText muted size="caption">
            {row.author.displayName}
          </AppText>
          <AppText>{row.body}</AppText>
        </Card>
      ))}
      {isSignedIn() ? (
        <>
          <Field label="تجربه‌ات از این مکان" value={body} onChangeText={setBody} multiline />
          <Button label="ثبت تجربه" onPress={publish} disabled={body.trim().length < 10} />
        </>
      ) : (
        <Button label="برای نظر وارد شو" variant="ghost" onPress={() => router.push(loginHref(`/venues/${slug}`))} />
      )}
    </Screen>
  );
}
