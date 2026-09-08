import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { EventDto, FeedPost, Me } from "@dorham/shared";
import { AppText, AuthorMeta, Banner, Button, Card, Chip, Empty, Field, Screen } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
import { canPost } from "../../../lib/can-post";
import { formatWhen } from "../../../lib/format";
import { loginHref } from "../../../lib/paths";
import { isSignedIn } from "../../../lib/session";
import { space } from "../../../lib/theme";

function firstParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ? raw : undefined;
}

export default function FeedScreen() {
  const params = useLocalSearchParams<{
    event?: string;
    eventId?: string;
    venue?: string;
    venueSlug?: string;
  }>();
  const attachedEvent = firstParam(params.event) ?? firstParam(params.eventId) ?? "";
  const attachedVenue = firstParam(params.venue) ?? firstParam(params.venueSlug) ?? "";
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [body, setBody] = useState("");
  const [eventId, setEventId] = useState(attachedEvent);
  const [venueSlug, setVenueSlug] = useState(attachedVenue);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(() => {
    api<FeedPost[]>("/feed?city=istanbul&limit=20", { auth: false })
      .then(setPosts)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "API روشن است؟"));
    api<EventDto[]>("/events?city=istanbul&limit=5", { auth: false })
      .then(setEvents)
      .catch(() => undefined);
    if (isSignedIn()) {
      api<Me>("/users/me")
        .then(setMe)
        .catch(() => setMe(null));
    } else {
      setMe(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (attachedEvent) setEventId(attachedEvent);
      if (attachedVenue) setVenueSlug(attachedVenue);
      load();
    }, [load, attachedEvent, attachedVenue]),
  );

  async function publish() {
    setError("");
    setNotice("");
    setPending(true);
    try {
      const post = await api<FeedPost>("/feed", {
        method: "POST",
        body: JSON.stringify({
          body,
          city: "istanbul",
          eventId: eventId || undefined,
          venueSlug: venueSlug || undefined,
        }),
      });
      setBody("");
      setNotice("منتشر شد.");
      setPosts((rows) => [post, ...rows]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "پست ذخیره نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen kicker="خبر شهر" title="فید استانبول" subtitle="وسط هفته، پیشنهاد مکان. سوایپ نیست.">
      <Banner text={error} />
      <Banner text={notice} tone="ok" />
      {!isSignedIn() ? (
        <Card>
          <AppText muted>برای نوشتن وارد شو. فقط میزبان و عضو تأییدشده پست می‌گذارند.</AppText>
          <Button label="ورود" variant="ghost" onPress={() => router.push(loginHref("/feed"))} />
        </Card>
      ) : canPost(me) ? (
        <>
          <Field label="برای استانبول بنویس" value={body} onChangeText={setBody} multiline />
          {events.length > 0 ? (
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: space.sm }}>
              {events.map((event) => (
                <Chip
                  key={event.id}
                  label={event.title}
                  selected={eventId === event.id}
                  onPress={() => setEventId((current) => (current === event.id ? "" : event.id))}
                />
              ))}
            </View>
          ) : null}
          {venueSlug ? (
            <AppText muted size="caption">
              وصل به مکان: {venueSlug}
            </AppText>
          ) : null}
          <Button label={pending ? "…" : "انتشار"} onPress={publish} disabled={pending || body.trim().length < 10} />
        </>
      ) : (
        <AppText muted>نوشتن پست برای میزبان و اعضای تأییدشده است. نظر برای همه آزاد است.</AppText>
      )}
      {posts.length === 0 && !error ? <Empty text="هنوز پستی نیست." /> : null}
      {posts.map((post) => (
        <Pressable key={post.id} onPress={() => router.push(`/feed/${post.id}`)}>
          <Card>
            <AuthorMeta
              name={post.author.displayName}
              verified={post.author.verificationStatus === "VERIFIED"}
              extra={formatWhen(post.createdAt)}
              onPress={() => router.push(`/people/${post.author.id}`)}
            />
            <AppText>{post.body}</AppText>
            <AppText muted size="caption">
              {post.venueSlug ? "مکان · " : ""}
              {post.eventId ? "رویداد · " : ""}
              {post.commentCount} نظر
            </AppText>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
