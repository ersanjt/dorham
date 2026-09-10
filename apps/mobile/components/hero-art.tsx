import { Image, StyleSheet, View } from "react-native";
import { AppText } from "./ui";
import { color, space } from "../lib/theme";

export function HeroBanner() {
  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel="دورهم در استانبول">
      <Image source={require("../assets/hero.png")} style={styles.image} resizeMode="cover" />
      <View style={styles.caption}>
        <AppText bold size="caption" style={{ color: color.cream }}>
          استانبول · مکان واقعی، جمع واقعی
        </AppText>
      </View>
    </View>
  );
}

export function EmptyArt({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Image source={require("../assets/empty-events.png")} style={styles.emptyImg} resizeMode="contain" />
      <AppText muted align="center">
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: color.clay,
    backgroundColor: color.cream,
  },
  image: { width: "100%", height: 160 },
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    backgroundColor: "rgba(18,12,9,0.55)",
  },
  empty: { alignItems: "center", gap: space.sm, paddingVertical: space.md },
  emptyImg: { width: 160, height: 160 },
});
