import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { loginBodySchema } from "@dorham/shared";
import { Banner, Button, Field, Screen } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { safeNext } from "../lib/paths";
import { setSession } from "../lib/session";

export default function LoginScreen() {
  const params = useLocalSearchParams<{ next?: string }>();
  const next = safeNext(params.next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    const parsed = loginBodySchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("ایمیل و رمز را درست بنویس.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const data = await api<{ accessToken: string; refreshToken: string }>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify(parsed.data),
      });
      await setSession(data.accessToken, data.refreshToken);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ورود نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen back kicker="یک حساب" title="ورود" subtitle="وب و اپ همان حساب را دارند. نشست روی دستگاه رمزنگاری می‌شود.">
      <Banner text={error} />
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
        autoComplete="password"
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />
      <Button label={pending ? "…" : "ورود"} onPress={submit} disabled={pending} />
      <Button
        label="حساب ندارم"
        variant="ghost"
        onPress={() => router.push(`/register?next=${encodeURIComponent(next)}`)}
      />
    </Screen>
  );
}
