import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { resetPasswordBodySchema } from "@dorham/shared";
import { Banner, Button, Field, Screen } from "../components/ui";
import { api, ApiError } from "../lib/api";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState(token ? "" : "لینک ناقص است. از ایمیل بازیابی باز کن.");
  const [pending, setPending] = useState(false);

  async function submit() {
    const parsed = resetPasswordBodySchema.safeParse({ token, password });
    if (!parsed.success) {
      setError("رمز حداقل ۱۰ کاراکتر با حرف و عدد.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await api("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify(parsed.data),
      });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر رمز نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen back kicker="رمز" title="رمز تازه" subtitle="بعد از ذخیره دوباره وارد شو.">
      <Banner text={error} />
      <Field
        label="رمز تازه"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
      />
      <Button label={pending ? "…" : "ذخیره رمز"} onPress={submit} disabled={pending || !token} />
      <Button label="ورود" variant="ghost" onPress={() => router.push("/login")} />
    </Screen>
  );
}
