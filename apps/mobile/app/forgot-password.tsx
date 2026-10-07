import { useState } from "react";
import { router } from "expo-router";
import { forgotPasswordBodySchema } from "@dorham/shared";
import { Banner, Button, Field, Screen } from "../components/ui";
import { api, ApiError } from "../lib/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [devToken, setDevToken] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    const parsed = forgotPasswordBodySchema.safeParse({ email });
    if (!parsed.success) {
      setError("ایمیل را درست بنویس.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const data = await api<{ ok: true; resetToken?: string }>("/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify(parsed.data),
      });
      setNotice("اگر حسابی با این ایمیل باشد، لینک بازیابی فرستاده شد. اسپم را هم چک کن.");
      setDevToken(data.resetToken ?? "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "درخواست نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen back kicker="رمز" title="بازیابی رمز" subtitle="لینک به ایمیل می‌آید. وب و اپ همان حساب را دارند.">
      <Banner text={error} />
      <Banner text={notice} tone="ok" />
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
      <Button label={pending ? "…" : "ارسال لینک"} onPress={submit} disabled={pending} />
      {devToken ? (
        <Button
          label="لینک توسعه"
          variant="ghost"
          onPress={() => router.push(`/reset-password?token=${encodeURIComponent(devToken)}`)}
        />
      ) : null}
      <Button label="بازگشت به ورود" variant="ghost" onPress={() => router.push("/login")} />
    </Screen>
  );
}
