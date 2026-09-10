import { ReactNode } from "react";
import {
  ActivityIndicator,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBg } from "./paper-bg";
import { resolveApiBase } from "../lib/api-base";
import { color, fontSize, radius, space, type } from "../lib/theme";

type Align = { align?: "right" | "center" | "left" };

/** Physical edge for Persian copy. Android RTL often mirrors left/right gravity. */
function physicalAlign(align: "right" | "center" | "left"): "right" | "center" | "left" {
  if (align === "center") return "center";
  if (!I18nManager.isRTL) return align;
  return align === "right" ? "left" : "right";
}

export function AppText({
  children,
  muted,
  bold,
  size = "body",
  align = "right",
  style,
  ...rest
}: TextProps & Align & { muted?: boolean; bold?: boolean; size?: keyof typeof fontSize }) {
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={1.35}
      style={[
        {
          color: muted ? color.muted : color.ink,
          fontFamily:
            size === "display" || size === "title" ? type.display : bold ? type.bold : type.regular,
          fontSize: fontSize[size],
          lineHeight:
            size === "display"
              ? fontSize.display * 1.12
              : size === "title"
                ? fontSize.title * 1.22
                : fontSize[size] * 1.72,
          textAlign: physicalAlign(align),
          writingDirection: "rtl",
          ...(align === "center" ? null : { alignSelf: "stretch" as const, width: "100%" as const }),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Short clay bar with diamond knot — sofreh divider, not a Material underline. */
export function OrnateRule({ align = "start" }: { align?: "start" | "center" }) {
  return (
    <View
      style={{
        // Native forcesRTL: use `row` (not row-reverse) so the knot sits at reading start.
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: align === "center" ? "center" : "flex-start",
        marginTop: space.xs,
      }}
    >
      <View style={styles.ruleLine} />
      <View style={styles.ruleDiamond} />
      <View style={[styles.ruleLine, { width: 28 }]} />
    </View>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const size = compact ? 30 : 52;
  const dot = compact ? 5 : 8;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="دورهم"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color.clay,
        borderWidth: 2,
        borderColor: color.paperDeep,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ width: size * 0.55, height: size * 0.5, alignItems: "center" }}>
        <View style={[styles.seat, { width: dot, height: dot, marginBottom: compact ? 3 : 5 }]} />
        <View style={{ flexDirection: "row", gap: compact ? 5 : 8 }}>
          <View style={[styles.seat, { width: dot, height: dot }]} />
          <View style={[styles.seat, { width: dot, height: dot }]} />
        </View>
      </View>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <View style={{ gap: 4, marginTop: space.sm }}>
      <AppText bold size="title">
        {children}
      </AppText>
      <OrnateRule />
    </View>
  );
}

export function Screen({
  children,
  kicker,
  title,
  subtitle,
  back,
  scroll = true,
  brand,
}: {
  children: ReactNode;
  kicker?: string;
  title?: string;
  subtitle?: string;
  back?: boolean;
  scroll?: boolean;
  brand?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const body = (
    <View style={{ paddingHorizontal: space.screen, paddingBottom: space.xl, gap: space.md }}>
      {back || title || kicker || brand ? (
        <View style={{ gap: space.xs, paddingTop: space.sm }}>
          {back ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="بازگشت"
              style={styles.back}
            >
              <Ionicons name="chevron-forward" size={22} color={color.ink} />
              <AppText bold>بازگشت</AppText>
            </Pressable>
          ) : null}
          {brand ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: 4 }}>
              <BrandMark />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText style={{ fontFamily: type.display, fontSize: 30, lineHeight: 34, color: color.clay }}>
                  دورهم
                </AppText>
                <AppText muted size="caption" style={{ letterSpacing: 1.2 }}>
                  DORHAM · ISTANBUL
                </AppText>
              </View>
            </View>
          ) : null}
          {kicker ? (
            <AppText bold size="caption" style={{ color: color.clay, lineHeight: 18 }}>
              {kicker}
            </AppText>
          ) : null}
          {title ? (
            <AppText bold size="display">
              {title}
            </AppText>
          ) : null}
          {subtitle ? <AppText muted>{subtitle}</AppText> : null}
          {title || kicker || brand ? <OrnateRule /> : null}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <PaperBg />
      {scroll ? (
        <ScrollView
          style={styles.screenClear}
          contentContainerStyle={{ paddingTop: insets.top, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingTop: insets.top }}>{body}</View>
      )}
    </KeyboardAvoidingView>
  );
}

export function Card({
  children,
  style,
  accent,
}: {
  children: ReactNode;
  style?: ViewStyle;
  accent?: boolean;
}) {
  return (
    <View style={[styles.card, accent ? styles.cardAccent : null, style]}>
      {accent ? <View pointerEvents="none" style={styles.cardRibbon} /> : null}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      android_ripple={{ color: "rgba(18,12,9,0.08)" }}
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" && { backgroundColor: pressed ? color.clayPressed : color.clay },
        variant === "ghost" && {
          backgroundColor: pressed ? color.paperDeep : color.cream,
          borderWidth: 1.5,
          borderColor: color.lineStrong,
        },
        variant === "danger" && { backgroundColor: pressed ? "#6E171B" : color.danger },
        disabled && { opacity: 0.5 },
      ]}
    >
      <AppText
        bold
        align="center"
        style={{ color: variant === "ghost" ? color.ink : color.cream, lineHeight: 22 }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <AppText bold size="caption">
        {label}
      </AppText>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={color.muted}
        style={[styles.input, props.multiline ? { minHeight: 112, textAlignVertical: "top" } : null, props.style]}
      />
    </View>
  );
}

export function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkRow}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? color.clay : color.lineStrong,
            backgroundColor: checked ? color.clay : color.cream,
          },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={16} color={color.cream} /> : null}
      </View>
      <AppText style={{ flex: 1 }}>{label}</AppText>
    </Pressable>
  );
}

export function Banner({ text, tone = "err" }: { text: string; tone?: "err" | "ok" }) {
  if (!text) return null;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { borderColor: tone === "ok" ? color.ok : color.danger }]}
    >
      <AppText style={{ color: tone === "ok" ? color.ok : color.danger }}>{text}</AppText>
    </View>
  );
}

export function Badge({
  label,
  ok,
  verified,
}: {
  label: string;
  ok?: boolean;
  verified?: boolean;
}) {
  const background = verified ? color.saffronSoft : ok ? color.okSoft : color.paperDeep;
  const foreground = verified ? color.saffron : ok ? color.ok : color.muted;
  return (
    <View style={[styles.badge, { backgroundColor: background, borderColor: verified ? color.saffron : color.line }]}>
      <AppText size="caption" bold style={{ color: foreground, lineHeight: 18 }}>
        {label}
      </AppText>
    </View>
  );
}

export function AuthorMeta({
  name,
  verified,
  extra,
  onPress,
}: {
  name: string;
  verified?: boolean;
  extra?: string;
  onPress?: () => void;
}) {
  const nameNode = (
    <AppText muted size="caption">
      {name}
    </AppText>
  );
  return (
    <View style={styles.authorMeta}>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={name}>
          {nameNode}
        </Pressable>
      ) : (
        nameNode
      )}
      {verified ? <Badge label="تأییدشده" verified /> : null}
      {extra ? (
        <AppText muted size="caption">
          {extra}
        </AppText>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={label}
      style={{
        borderWidth: 1.5,
        borderColor: selected ? color.clay : color.lineStrong,
        backgroundColor: selected ? color.clay : color.cream,
        borderRadius: radius.sm,
        paddingHorizontal: 14,
        paddingVertical: 9,
        minHeight: 40,
      }}
    >
      <AppText bold size="caption" style={{ lineHeight: 18, color: selected ? color.cream : color.ink }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={styles.center} accessibilityLabel="در حال بارگذاری">
      <View style={styles.ruleDiamond} />
      <ActivityIndicator color={color.clay} />
      <AppText muted>در حال بارگذاری…</AppText>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <Card>
      <AppText muted>{text}</AppText>
    </Card>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <Card accent>
      <AppText bold size="title">
        وصل نشد
      </AppText>
      <AppText>{text}</AppText>
      <AppText muted size="caption">
        گوشی و لپ‌تاپ باید همان وای‌فای باشند. آدرس API: {resolveApiBase()}
      </AppText>
      {onRetry ? <Button label="تلاش دوباره" onPress={onRetry} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  screenClear: { flex: 1, backgroundColor: "transparent" },
  ruleLine: {
    height: 2,
    width: 44,
    backgroundColor: color.clay,
    borderRadius: 1,
  },
  ruleDiamond: {
    width: 9,
    height: 9,
    backgroundColor: color.clay,
    transform: [{ rotate: "45deg" }],
  },
  card: {
    backgroundColor: color.cream,
    borderColor: color.lineStrong,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
    overflow: "hidden",
  },
  cardAccent: {
    borderColor: color.clay,
    backgroundColor: color.cream,
    paddingTop: space.md + 6,
  },
  cardRibbon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: color.clay,
  },
  corner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: color.clay,
  },
  cornerTL: { top: 8, left: 8, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 2.5, borderRightWidth: 2.5 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 2.5, borderLeftWidth: 2.5 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 2.5, borderRightWidth: 2.5 },
  btn: {
    minHeight: 52,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  input: {
    backgroundColor: color.white,
    borderColor: color.lineStrong,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    minHeight: 52,
    color: color.ink,
    fontFamily: type.regular,
    fontSize: fontSize.body,
    textAlign: physicalAlign("right"),
    writingDirection: "rtl",
  },
  banner: {
    backgroundColor: color.cream,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    padding: space.md,
  },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  // Native RTL: `row` + flex-start puts controls at reading start (right).
  back: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", minHeight: 44 },
  center: { paddingVertical: space.xl, alignItems: "center", gap: space.sm },
  authorMeta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: space.sm, minHeight: 44 },
  box: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  seat: { backgroundColor: color.cream, borderRadius: 999 },
});
