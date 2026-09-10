import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import type { VenueDto, VenueKind } from "@dorham/shared";
import { AppText, Button, Card, Chip, Empty, ErrorState, Loading, Screen } from "../../../components/ui";
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
  const [loading, setLoading] = useState(true);

  function load(nextKind: VenueKind | "" = kind) {
    setError("");
    setLoading(true);
    const query = new URLSearchParams({ city: "istanbul", limit: "80" });
    if (nextKind) query.set("kind", nextKind);
    api<VenueDto[]>(`/venues?${query}`, { auth: false })
      .then(setVenues)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "مکان‌ها خوانده نشد."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(kind);
  }, [kind]);

  return (
    <Screen kicker="سفرهٔ شهر" title="مکان‌های ایرانی" subtitle="رستوران، کافه، مارکت. آدرس واقعی، لینک گوگل‌مپ.">
      {error ? <ErrorState text={error} onRetry={() => load()} /> : null}
      <Button label="ثبت مکان من" onPress={() => router.push("/venues/new")} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {KINDS.map((item) => (
          <Chip key={item.id || "all"} label={item.label} selected={kind === item.id} onPress={() => setKind(item.id)} />
        ))}
      </View>
      {loading && !error ? <Loading /> : null}
      {!loading && venues.length === 0 && !error ? <Empty text="فهرست مکان‌ها نرسید." /> : null}
      {venues.map((venue) => (
        <Pressable
          key={venue.id}
          onPress={() => router.push(`/venues/${venue.slug}`)}
          accessibilityRole="button"
          accessibilityLabel={venue.name}
        >
          <Card accent>
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
