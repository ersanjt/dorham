import { Stack } from "expo-router";
import { color } from "../../../lib/theme";

export default function FeedStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: color.paper },
      }}
    />
  );
}
