import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import type { VenueDto, VenueKind } from "@dorham/shared";
import { AppText, Button, Card, Chip, Empty, ErrorState, Screen } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
import { venueKindFa } from "../../../lib/format";
import { space } from "../../../lib/theme";

const KINDS: { id: VenueKind | ""; label: string }[] = [
  { id: "", label: "همه" },
  { id: "RESTAURANT", label: "رستوران" },
  { id: "CAFE", label: "کافه" },
  { id: "MARKET", label: "مارکت" },
  { id: "CULTURAL", label: "فرهنگی" },
];

export default function VenuesScreen() {
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [kind, setKind] = useState<VenueKind | "">("");
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams({ city: "istanbul", limit: "80" });
    if (kind) query.set("kind", kind);
    api<VenueDto[]>(`/venues?${query}`, { auth: false })
      .then(setVenues)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "API روشن است؟"));
  }, [kind]);

  return (
    <Screen kicker="نقشهٔ خوردنی" title="مکان‌های ایرانی" subtitle="رستوران، کافه، مارکت. آدرس واقعی، لینک گوگل‌مپ.">
      {error ? (
        <ErrorState
          text={error}
          onRetry={() => {
            const query = new URLSearchParams({ city: "istanbul", limit: "80" });
            if (kind) query.set("kind", kind);
            api<VenueDto[]>(`/venues?${query}`, { auth: false })
              .then(setVenues)
              .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "API روشن است؟"));
          }}
        />
      ) : null}
      <Button label="ثبت مکان من" onPress={() => router.push("/venues/new")} />
      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: space.sm }}>
        {KINDS.map((item) => (
          <Chip key={item.id || "all"} label={item.label} selected={kind === item.id} onPress={() => setKind(item.id)} />
        ))}
      </View>
      {venues.length === 0 && !error ? <Empty text="فهرست مکان‌ها نرسید." /> : null}
      {venues.map((venue) => (
        <Pressable
          key={venue.id}
          onPress={() => router.push(`/venues/${venue.slug}`)}
          accessibilityRole="button"
          accessibilityLabel={venue.name}
        >
          <Card>
            <AppText muted size="caption">
              {venueKindFa[venue.kind] ?? venue.kind} · {venue.area}
            </AppText>
            <AppText bold size="title">
              {venue.name}
            </AppText>
            <AppText muted>{venue.address}</AppText>
            {venue.priceRange ? <AppText muted size="caption">{venue.priceRange}</AppText> : null}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
