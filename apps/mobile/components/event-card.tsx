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
};

export function EventCard({
  event,
  onPress,
}: {
  event: MobileEventCardData;
  onPress: () => void;
}) {
  const filled = capacityWidth(event.goingCount, event.capacity);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={event.title}>
      <Card>
        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", gap: space.sm }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: color.line,
              backgroundColor: color.paper,
              borderRadius: radius.pill,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <AppText size="caption" bold style={{ color: color.clay, lineHeight: 18 }}>
              {formatDayChip(event.startsAt)}
            </AppText>
          </View>
          <AppText muted size="caption">
            {event.venue ?? "استانبول"}
          </AppText>
        </View>
        <AppText bold size="title">
          {event.title}
        </AppText>
        {event.description ? <AppText muted>{event.description}</AppText> : null}
        <AppText muted size="caption">
          {event.hostName ? `میزبان: ${event.hostName} · ` : ""}
          {event.goingCount}
          {event.capacity ? ` از ${event.capacity}` : ""} نفر
          {event.waitlistCount ? ` · ${event.waitlistCount} در انتظار` : ""}
          {event.priceTry ? ` · ${event.priceTry.toLocaleString("fa-IR")} لیر` : ""}
        </AppText>
        {filled != null ? (
          <View
            style={{
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: color.paper,
              overflow: "hidden",
              marginTop: 4,
            }}
          >
            <View style={{ width: `${Math.max(filled, 8)}%`, minWidth: 12, height: "100%", backgroundColor: color.clay, borderRadius: radius.pill }} />
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
