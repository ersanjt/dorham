import { useEffect, useState } from "react";
import { Pressable, Share, View } from "react-native";
import { router } from "expo-router";
import type { EventDto, FeedPost } from "@dorham/shared";
import { EventCard } from "../../components/event-card";
import { EmptyArt, HeroBanner } from "../../components/hero-art";
import {
  AppText,
  AuthorMeta,
  Button,
  Card,
  Chip,
  ErrorState,
  Loading,
  Screen,
  SectionTitle,
} from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { eventInviteText, formatDayChip, formatPriceTry, formatWhen } from "../../lib/format";
import { color, radius, space } from "../../lib/theme";

export default function CityScreen() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setError("");
    setLoading(true);
    Promise.all([
      api<EventDto[]>("/events?city=istanbul&kind=COMMUNITY&limit=4", { auth: false }),
      api<FeedPost[]>("/feed?city=istanbul&limit=2", { auth: false }),
    ])
      .then(([nextEvents, nextPosts]) => {
        setEvents(nextEvents);
        setPosts(nextPosts);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : "شهر خوانده نشد. API یا اینترنت را چک کن."),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const next = events[0];
  const more = events.slice(1);

  return (
    <Screen
      brand
      kicker="استانبول · این هفته"
      title="دورهم، توی همین شهر"
      subtitle="ایرانی‌های استانبول. جمعه دور هم — نه سوایپ."
    >
      <HeroBanner />
      {error ? <ErrorState text={error} onRetry={load} /> : null}
      {loading && !error ? <Loading /> : null}
      {!loading && !error && next ? (
        <Card accent>
          <View style={{ flexDirection: "row", gap: space.md, alignItems: "stretch" }}>
            <View
              style={{
                width: 74,
                borderRadius: radius.sm,
                backgroundColor: color.clay,
                paddingVertical: space.sm,
                paddingHorizontal: 8,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <AppText bold size="caption" align="center" style={{ color: "rgba(255,246,236,0.85)", lineHeight: 16 }}>
                رویداد
              </AppText>
              <AppText bold align="center" style={{ color: color.cream, fontSize: 15, lineHeight: 20 }}>
                {formatDayChip(next.startsAt)}
              </AppText>
              <View
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: color.cream,
                  transform: [{ rotate: "45deg" }],
                  marginTop: 4,
                }}
              />
            </View>
            <View style={{ flex: 1, gap: space.xs }}>
              <AppText bold size="caption" style={{ color: color.clay }}>
                بعدی در شهر
              </AppText>
              <AppText bold size="title">
                {next.title}
              </AppText>
              <AppText muted>{next.venue ? next.venue : "استانبول"}</AppText>
              <AppText muted size="caption">
                {next.goingCount === 0
                  ? next.capacity
                    ? `ظرفیت ${next.capacity.toLocaleString("fa-IR")} نفر · هنوز کسی ثبت نکرده`
                    : "هنوز کسی ثبت نکرده"
                  : `${formatPriceTry(next.priceTry)} · ${next.goingCount.toLocaleString("fa-IR")}${
                      next.capacity ? ` از ${next.capacity.toLocaleString("fa-IR")}` : ""
                    } نفر`}
              </AppText>
            </View>
          </View>
          <Button label="جزئیات و ثبت حضور" onPress={() => router.push(`/events/${next.id}`)} />
          <Button
            label="فرستادن دعوت"
            variant="ghost"
            onPress={() => Share.share({ message: eventInviteText(next) }).catch(() => undefined)}
          />
        </Card>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        <Chip label="رویدادها" selected onPress={() => router.push("/events")} />
        <Chip label="فید شهر" onPress={() => router.push("/feed")} />
        <Chip label="مکان‌ها" onPress={() => router.push("/venues")} />
      </View>

      <SectionTitle>این هفته در استانبول</SectionTitle>
      {!loading && events.length === 0 && !error ? (
        <EmptyArt text="هنوز رویدادی منتشر نشده. اولین جمع واقعی را از تب رویداد بساز." />
      ) : null}
      {more.map((event) => (
        <EventCard
          key={event.id}
          event={{ ...event, hostName: event.host.displayName, kind: event.kind }}
          onPress={() => router.push(`/events/${event.id}`)}
        />
      ))}

      <SectionTitle>حرف‌های این هفته</SectionTitle>
      {!loading && posts.length === 0 && !error ? (
        <EmptyArt text="هنوز پستی نرسیده. حرف شهر را از فید بنویس." />
      ) : null}
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
