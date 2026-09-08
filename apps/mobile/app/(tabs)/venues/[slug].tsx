import { useEffect, useState } from "react";
import { Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { VenueDto, VenueReview } from "@dorham/shared";
import { AppText, Banner, Button, Card, Field, Loading, Screen } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
import { venueKindFa } from "../../../lib/format";
import { loginHref } from "../../../lib/paths";
import { isSignedIn } from "../../../lib/session";

export default function VenueDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [venue, setVenue] = useState<VenueDto | null>(null);
  const [reviews, setReviews] = useState<VenueReview[]>([]);
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
        <Card>
          <AppText>{venue.description}</AppText>
          <AppText muted>{venue.address}</AppText>
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
      <AppText bold size="title">
        تجربهٔ این مکان
      </AppText>
      {isSignedIn() ? (
        <>
          <Field label="تجربه‌ات" value={body} onChangeText={setBody} multiline />
          <Button label="ثبت نظر" onPress={publish} disabled={body.trim().length < 10} />
        </>
      ) : (
        <Button
          label="برای نظر وارد شو"
          variant="ghost"
          onPress={() => router.push(loginHref(`/venues/${slug}`))}
        />
      )}
      {reviews.map((row) => (
        <Card key={row.id}>
          <AppText muted size="caption">
            {row.author.displayName}
            {row.author.verificationStatus === "VERIFIED" ? " · تأییدشده" : ""}
          </AppText>
          <AppText>{row.body}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
