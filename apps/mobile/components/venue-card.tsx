import { Image, Linking, Pressable, View } from "react-native";
import type { VenueDto } from "@dorham/shared";
import { AppText, Card } from "./ui";
import { venueKindFa } from "../lib/format";
import { color, radius, space } from "../lib/theme";

export function VenueCard({
  venue,
  onPress,
}: {
  venue: VenueDto;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={venue.name}>
      <Card accent style={{ padding: 0, overflow: "hidden" }}>
        {venue.mapImageUrl ? (
          <Image
            source={{ uri: venue.mapImageUrl }}
            accessibilityLabel={`نقشه ${venue.name}`}
            style={{ width: "100%", height: 148, backgroundColor: color.paperDeep }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ height: 72, backgroundColor: color.claySoft, alignItems: "center", justifyContent: "center" }}>
            <AppText muted size="caption" align="center">
              مختصات ثبت نشده
            </AppText>
          </View>
        )}
        <View style={{ padding: space.md, gap: space.xs }}>
          <AppText muted size="caption">
            {venueKindFa[venue.kind] ?? venue.kind} · {venue.area}
          </AppText>
          <AppText bold size="title">
            {venue.name}
          </AppText>
          <AppText muted>{venue.address}</AppText>
          {venue.priceRange ? (
            <AppText muted size="caption">
              {venue.priceRange}
            </AppText>
          ) : null}
          <Pressable
            onPress={() => Linking.openURL(venue.mapsUrl)}
            accessibilityRole="link"
            accessibilityLabel="باز کردن در گوگل‌مپ"
            style={{
              marginTop: 4,
              alignSelf: "flex-start",
              borderWidth: 1.5,
              borderColor: color.clay,
              borderRadius: radius.sm,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <AppText bold size="caption" style={{ color: color.clay }}>
              گوگل‌مپ
            </AppText>
          </Pressable>
        </View>
      </Card>
    </Pressable>
  );
}
