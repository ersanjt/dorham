import { Stack } from "expo-router";
import { color } from "../../../lib/theme";

export default function VenuesStack() {
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
