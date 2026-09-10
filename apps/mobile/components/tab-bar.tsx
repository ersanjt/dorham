import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./ui";
import { color, radius, space, type } from "../lib/theme";

type TabBarProps = {
  state: { routes: { name: string }[]; index: number };
  navigation: { navigate: (name: string) => void };
};

const TABS: {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: "index", label: "شهر", icon: "home-outline", activeIcon: "home" },
  { name: "events", label: "رویداد", icon: "calendar-outline", activeIcon: "calendar" },
  { name: "feed", label: "فید", icon: "chatbubbles-outline", activeIcon: "chatbubbles" },
  { name: "venues", label: "مکان", icon: "cafe-outline", activeIcon: "cafe" },
  { name: "account", label: "من", icon: "person-outline", activeIcon: "person" },
];

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.topRule} />
      {TABS.map((tab) => {
        const route = state.routes.find((item) => item.name === tab.name);
        if (!route) return null;
        const active = state.routes[state.index]?.name === tab.name;
        return (
          <Pressable
            key={tab.name}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            android_ripple={{ color: "rgba(177,46,40,0.08)", borderless: true }}
            style={styles.item}
          >
            <View style={[styles.iconWrap, active && styles.iconActive]}>
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={20}
                color={active ? color.cream : color.muted}
              />
            </View>
            <AppText
              size="caption"
              bold={active}
              align="center"
              style={{
                color: active ? color.clay : color.muted,
                fontFamily: active ? type.bold : type.medium,
                lineHeight: 18,
              }}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: color.cream,
    borderTopWidth: 1.5,
    borderTopColor: color.lineStrong,
    paddingTop: space.sm,
    paddingHorizontal: space.xs,
  },
  topRule: {
    position: "absolute",
    top: 0,
    left: "35%",
    right: "35%",
    height: 3,
    backgroundColor: color.clay,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  item: { flex: 1, alignItems: "center", gap: 4, minHeight: 52, justifyContent: "center" },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconActive: {
    backgroundColor: color.clay,
  },
});
