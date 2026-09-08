import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import type { EventDto, FeedPost } from "@dorham/shared";
import { EventCard } from "../../components/event-card";
import { AppText, AuthorMeta, BrandMark, Button, Card, Chip, Empty, ErrorState, Screen } from "../../components/ui";
import { api } from "../../lib/api";
import { formatWhen } from "../../lib/format";
import { space, type } from "../../lib/theme";

export default function CityScreen() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [error, setError] = useState("");

  function load() {
    setError("");
    Promise.all([
      api<EventDto[]>("/events?city=istanbul&limit=3", { auth: false }),
      api<FeedPost[]>("/feed?city=istanbul&limit=2", { auth: false }),
    ])
      .then(([nextEvents, nextPosts]) => {
        setEvents(nextEvents);
        setPosts(nextPosts);
      })
      .catch(() => setError("شهر خوانده نشد. API یا اینترنت را چک کن."));
  }

  useEffect(() => {
    load();
  }, []);

  const next = events[0];

  return (
    <Screen
      kicker="استانبول · این هفته"
      title="دورهم، توی همین شهر"
      subtitle="ایرانی‌های استانبول. جمعه دور هم — نه سوایپ."
    >
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: space.sm }}>
        <BrandMark />
        <AppText style={{ fontFamily: type.display, fontSize: 28, lineHeight: 34 }}>Dorham</AppText>
      </View>
      {error ? <ErrorState text={error} onRetry={load} /> : null}
      {next ? (
        <Card>
          <AppText muted size="caption">
            رویداد بعدی
          </AppText>
          <AppText bold size="title">
            {next.title}
          </AppText>
          <AppText muted>
            {next.venue ?? "استانبول"} · {next.goingCount} نفر می‌آیند
          </AppText>
          <Button label="جزئیات و RSVP" onPress={() => router.push(`/events/${next.id}`)} />
        </Card>
      ) : null}

      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: space.sm }}>
        <Chip label="رویدادها" selected onPress={() => router.push("/events")} />
        <Chip label="فید شهر" onPress={() => router.push("/feed")} />
        <Chip label="مکان‌ها" onPress={() => router.push("/venues")} />
      </View>

      <AppText bold size="title">
        این هفته در استانبول
      </AppText>
      {events.length === 0 ? <Empty text="هنوز رویدادی منتشر نشده." /> : null}
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={{ ...event, hostName: event.host.displayName }}
          onPress={() => router.push(`/events/${event.id}`)}
        />
      ))}

      <AppText bold size="title">
        حرف‌های این هفته
      </AppText>
      {posts.length === 0 ? <Empty text="هنوز پستی نرسیده." /> : null}
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
              {post.commentCount} نظر
            </AppText>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
