import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import type { VenueDto, VenueKind } from "@dorham/shared";
import { VenueCard } from "../../../components/venue-card";
import { AppText, Button, Chip, Empty, ErrorState, Field, Loading, Screen } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
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
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load(nextKind: VenueKind | "" = kind, nextQ = q) {
    setError("");
    setLoading(true);
    const query = new URLSearchParams({ city: "istanbul", limit: "80" });
    if (nextKind) query.set("kind", nextKind);
    if (nextQ.trim()) query.set("q", nextQ.trim());
    api<VenueDto[]>(`/venues?${query}`, { auth: false })
      .then(setVenues)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "مکان‌ها خوانده نشد."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(kind);
  }, [kind]);

  return (
    <Screen
      kicker="سفرهٔ شهر"
      title="مکان‌های ایرانی"
      subtitle="آدرس واقعی، منو، و هماهنگی حضور — نه عکس استوک جعلی."
    >
      {error ? <ErrorState text={error} onRetry={() => load()} /> : null}
      <Button label="ثبت مکان من" onPress={() => router.push("/venues/new")} />
      <Field label="جستجو" value={q} onChangeText={setQ} placeholder="نام، محله، غذا" onSubmitEditing={() => load(kind, q)} />
      <Button label="پیدا کن" variant="ghost" onPress={() => load(kind, q)} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {KINDS.map((item) => (
          <Chip key={item.id || "all"} label={item.label} selected={kind === item.id} onPress={() => setKind(item.id)} />
        ))}
      </View>
      {loading && !error ? <Loading /> : null}
      {!loading && venues.length === 0 && !error ? <Empty text="فهرست مکان‌ها نرسید." /> : null}
      {!loading ? (
        <AppText muted size="caption">
          {venues.length} مکان منتشرشده
        </AppText>
      ) : null}
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} onPress={() => router.push(`/venues/${venue.slug}`)} />
      ))}
    </Screen>
  );
}
