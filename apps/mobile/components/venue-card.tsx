import { Image, Linking, Pressable, View } from "react-native";
import type { VenueDto } from "@dorham/shared";
import { AppText, Card } from "./ui";
import { publicMediaUrl } from "../lib/api-base";
import { venueKindFa } from "../lib/format";
import { color, radius, space } from "../lib/theme";

export function VenueCard({
  venue,
  onPress,
}: {
  venue: VenueDto;
  onPress: () => void;
}) {
  const cover = publicMediaUrl(venue.photos?.[0] || venue.mapImageUrl);
  const coverIsMap = Boolean(cover && venue.mapImageUrl && publicMediaUrl(venue.mapImageUrl) === cover);
  const coverIsStreet = Boolean(cover && /\/v1\/maps\/streetview/i.test(cover));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={venue.name}>
      <Card accent style={{ padding: 0, overflow: "hidden" }}>
        {cover ? (
          <View>
            <Image
              source={{ uri: cover }}
              accessibilityLabel={coverIsMap ? `نقشه ${venue.name}` : venue.name}
              style={{ width: "100%", height: 148, backgroundColor: color.paperDeep }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                right: 10,
                bottom: 10,
                backgroundColor: "rgba(18,12,9,0.72)",
                borderRadius: radius.pill,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <AppText size="caption" bold style={{ color: color.cream }}>
                {coverIsMap ? "نقشه" : coverIsStreet ? "نمای خیابان" : "عکس مکان"}
              </AppText>
            </View>
          </View>
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
          <AppText muted numberOfLines={2}>
            {venue.description}
          </AppText>
          <AppText muted size="caption" numberOfLines={2}>
            {venue.address}
          </AppText>
          {venue.priceRange ? (
            <AppText muted size="caption">
              {venue.priceRange}
            </AppText>
          ) : null}
          <View style={{ flexDirection: "row", gap: space.sm, marginTop: 4, flexWrap: "wrap" }}>
            <Pressable
              onPress={onPress}
              accessibilityRole="button"
              style={{
                alignSelf: "flex-start",
                paddingVertical: 8,
              }}
            >
              <AppText bold size="caption" style={{ color: color.clay }}>
                جزئیات
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL(venue.mapsUrl)}
              accessibilityRole="link"
              accessibilityLabel="باز کردن در گوگل‌مپ"
              style={{
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
        </View>
      </Card>
    </Pressable>
  );
}
