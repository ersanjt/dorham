import { useState } from "react";
import { ApiError } from "../lib/api";
import { startSocialLogin } from "../lib/social-auth";
import { AppText, Banner, Button } from "./ui";

export function SocialAuth({
  next,
  adult = false,
  requireAdult = false,
  termsAccepted = true,
}: {
  next: string;
  adult?: boolean;
  requireAdult?: boolean;
  termsAccepted?: boolean;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  async function start(provider: "google" | "apple" | "facebook") {
    if (requireAdult && !adult) {
      setError("برای عضویت باید ۱۸ سال یا بیشتر داشته باشی.");
      return;
    }
    if (requireAdult && !termsAccepted) {
      setError("برای ادامه، قواعد و حریم خصوصی را بپذیر.");
      return;
    }
    setError("");
    setPending(provider);
    try {
      await startSocialLogin({ provider, next, adult: requireAdult ? true : undefined });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ورود با این سرویس انجام نشد.");
    } finally {
      setPending("");
    }
  }

  return (
    <>
      <Banner text={error} />
      <Button label={pending === "google" ? "…" : "ادامه با گوگل"} variant="ghost" onPress={() => start("google")} disabled={Boolean(pending)} />
      <Button label={pending === "apple" ? "…" : "ادامه با اپل"} variant="ghost" onPress={() => start("apple")} disabled={Boolean(pending)} />
      <Button label={pending === "facebook" ? "…" : "ادامه با فیسبوک"} variant="ghost" onPress={() => start("facebook")} disabled={Boolean(pending)} />
      <AppText muted align="center">یا با ایمیل</AppText>
    </>
  );
}
