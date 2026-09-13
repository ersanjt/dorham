import { Pressable, View } from "react-native";
import { AppText, Card } from "./ui";
import { capacityWidth, formatDayChip } from "../lib/format";
import { color, radius, space } from "../lib/theme";

export type MobileEventCardData = {
  id: string;
  title: string;
  description?: string;
  venue: string | null;
  startsAt: string;
  goingCount: number;
  capacity?: number | null;
  waitlistCount?: number;
  hostName?: string;
  priceTry?: number;
  kind?: "COMMUNITY" | "CITY_SHOW";
};

export function EventCard({
  event,
  onPress,
}: {
  event: MobileEventCardData;
  onPress: () => void;
}) {
  const cityShow = event.kind === "CITY_SHOW";
  const filled = !cityShow ? capacityWidth(event.goingCount, event.capacity) : null;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={event.title}>
      <Card accent>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.sm }}>
          <View
            style={{
              borderWidth: 1.5,
              borderColor: color.clay,
              backgroundColor: color.claySoft,
              borderRadius: radius.sm,
              paddingHorizontal: 10,
              paddingVertical: 6,
              minWidth: 72,
              alignItems: "center",
            }}
          >
            <AppText size="caption" bold style={{ color: color.clay, lineHeight: 18 }}>
              {formatDayChip(event.startsAt)}
            </AppText>
          </View>
          <AppText muted size="caption" style={{ flex: 1 }}>
            {cityShow ? "تقویم شهر · " : ""}
            {event.venue ?? "استانبول"}
          </AppText>
        </View>
        <AppText bold size="title">
          {event.title}
        </AppText>
        {cityShow ? (
          <AppText muted>هماهنگی دوستان — نه فروش بلیط</AppText>
        ) : event.description ? (
          <AppText muted numberOfLines={3}>
            {event.description}
          </AppText>
        ) : null}
        <AppText muted size="caption">
          {cityShow
            ? event.goingCount === 0
              ? "هنوز کسی برای هماهنگی علامت نزده"
              : `${event.goingCount.toLocaleString("fa-IR")} نفر علاقه‌مند به هماهنگی`
            : `${event.hostName ? `میزبان: ${event.hostName} · ` : ""}${
                event.goingCount === 0
                  ? event.capacity
                    ? `ظرفیت ${event.capacity.toLocaleString("fa-IR")} نفر · هنوز خالی`
                    : "هنوز خالی"
                  : `${event.goingCount.toLocaleString("fa-IR")}${
                      event.capacity ? ` از ${event.capacity.toLocaleString("fa-IR")}` : ""
                    } نفر`
              }${event.waitlistCount ? ` · ${event.waitlistCount.toLocaleString("fa-IR")} در انتظار` : ""}${
                event.priceTry ? ` · ${event.priceTry.toLocaleString("fa-IR")} لیر` : ""
              }`}
        </AppText>
        {filled != null && event.goingCount > 0 ? (
          <View
            style={{
              height: 5,
              borderRadius: 2,
              backgroundColor: color.paperDeep,
              overflow: "hidden",
              marginTop: 4,
              position: "relative",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                width: `${Math.max(filled, 8)}%`,
                minWidth: 12,
                backgroundColor: color.clay,
              }}
            />
          </View>
        ) : null}
        <AppText bold size="caption" style={{ color: color.clay, marginTop: 6 }}>
          {cityShow ? "هماهنگی با دوستان" : "جزئیات و ثبت حضور"}
        </AppText>
      </Card>
    </Pressable>
  );
}
