import { ReactNode } from "react";
import {
  ActivityIndicator,
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
import { color, fontSize, radius, space, type } from "../lib/theme";

type Align = { align?: "right" | "center" };

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
              ? fontSize.display * 1.18
              : size === "title"
                ? fontSize.title * 1.28
                : fontSize[size] * 1.7,
          textAlign: align,
          writingDirection: "rtl",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const size = compact ? 28 : 44;
  const dot = compact ? 5 : 7;
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
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ width: size * 0.55, height: size * 0.5, alignItems: "center" }}>
        <View style={[styles.seat, { width: dot, height: dot, marginBottom: compact ? 3 : 4 }]} />
        <View style={{ flexDirection: "row", gap: compact ? 5 : 7 }}>
          <View style={[styles.seat, { width: dot, height: dot }]} />
          <View style={[styles.seat, { width: dot, height: dot }]} />
        </View>
      </View>
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
}: {
  children: ReactNode;
  kicker?: string;
  title?: string;
  subtitle?: string;
  back?: boolean;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const body = (
    <View style={{ paddingHorizontal: space.screen, paddingBottom: space.xl, gap: space.md }}>
      {back || title || kicker ? (
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
        </View>
      ) : null}
      {children}
    </View>
  );

  const frame = (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {scroll ? (
        <ScrollView
          style={styles.screen}
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

  return frame;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
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
          backgroundColor: pressed ? color.paper : "transparent",
          borderWidth: 1,
          borderColor: color.line,
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

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
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
            borderColor: checked ? color.clay : color.line,
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
  const background = verified ? color.saffronSoft : ok ? color.okSoft : color.line;
  const foreground = verified ? color.saffron : ok ? color.ok : color.muted;
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
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
        borderWidth: 1,
        borderColor: selected ? color.clay : color.line,
        backgroundColor: selected ? color.clay : color.cream,
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 10,
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
    <Card>
      <AppText>{text}</AppText>
      {onRetry ? <Button label="تلاش دوباره" variant="ghost" onPress={onRetry} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  card: {
    backgroundColor: color.cream,
    borderColor: color.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  btn: {
    minHeight: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  input: {
    backgroundColor: color.white,
    borderColor: color.line,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    minHeight: 52,
    color: color.ink,
    fontFamily: type.regular,
    fontSize: fontSize.body,
    textAlign: "right",
    writingDirection: "rtl",
  },
  banner: {
    backgroundColor: color.cream,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: space.md,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: color.line,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  back: { flexDirection: "row-reverse", alignItems: "center", gap: 4, alignSelf: "flex-start", minHeight: 44 },
  center: { paddingVertical: space.xl, alignItems: "center", gap: space.sm },
  authorMeta: { flexDirection: "row-reverse", flexWrap: "wrap", alignItems: "center", gap: 6 },
  checkRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: space.sm, minHeight: 44 },
  box: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  seat: { backgroundColor: color.cream, borderRadius: 999 },
});
