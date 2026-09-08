import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { registerBodySchema } from "@dorham/shared";
import { Banner, Button, CheckRow, Field, Screen } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { safeNext } from "../lib/paths";
import { setSession } from "../lib/session";

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ next?: string }>();
  const next = safeNext(params.next);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!adult) {
      setError("باید ۱۸ سال یا بیشتر باشی. این الزام استور است.");
      return;
    }
    if (!accepted) {
      setError("قواعد جامعه و حریم خصوصی را بپذیر.");
      return;
    }
    const parsed = registerBodySchema.safeParse({ displayName, email, password, locale: "FA" });
    if (!parsed.success) {
      setError("نام، ایمیل و رمز ۱۰ کاراکتری با حرف و عدد.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const data = await api<{ accessToken: string; refreshToken: string; verifyEmailToken?: string }>(
        "/auth/register",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify(parsed.data),
        },
      );
      await setSession(data.accessToken, data.refreshToken);
      if (data.verifyEmailToken) {
        router.replace(
          `/verify-email?token=${encodeURIComponent(data.verifyEmailToken)}&next=${encodeURIComponent(next)}`,
        );
      } else {
        router.replace(next);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ثبت‌نام نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen
      back
      kicker="عضو شهر"
      title="ساخت حساب"
      subtitle="برای ساکنان ترکیه. یک حساب. استانبول قفل است. دیتینگ بعداً و فقط اگر بخواهی."
    >
      <Banner text={error} />
      <Field
        label="نام نمایشی"
        value={displayName}
        onChangeText={setDisplayName}
        autoComplete="name"
        textContentType="name"
      />
      <Field
        label="ایمیل"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="رمز"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
      />
      <CheckRow label="۱۸ سال یا بیشتر دارم." checked={adult} onToggle={() => setAdult((v) => !v)} />
      <CheckRow
        label="قواعد جامعه و حریم خصوصی را خواندم و می‌پذیرم."
        checked={accepted}
        onToggle={() => setAccepted((v) => !v)}
      />
      <Button label="خواندن امنیت" variant="ghost" onPress={() => router.push("/safety")} />
      <Button label="حریم خصوصی" variant="ghost" onPress={() => router.push("/privacy")} />
      <Button
        label={pending ? "…" : "ادامه"}
        onPress={submit}
        disabled={pending || !adult || !accepted}
      />
    </Screen>
  );
}
