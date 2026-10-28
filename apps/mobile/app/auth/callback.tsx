import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Banner, Button, Screen } from "../../components/ui";
import { ApiError } from "../../lib/api";
import { finishSocialLogin, mobileOAuthRedirect } from "../../lib/social-auth";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string; name?: string }>();
  const [error, setError] = useState("");
  const [ageRequired, setAgeRequired] = useState(false);

  useEffect(() => {
    const code = first(params.code);
    const state = first(params.state);
    if (first(params.error) || !code || !state) {
      setError("پاسخ ورود ناقص بود. دوباره از صفحهٔ ورود شروع کن.");
      return;
    }
    let cancelled = false;
    finishSocialLogin({
      code,
      state,
      redirectUri: mobileOAuthRedirect(),
      displayName: first(params.name),
    }).catch((err: unknown) => {
      if (cancelled) return;
      if (err instanceof ApiError && err.code === "AUTH_AGE_REQUIRED") setAgeRequired(true);
      setError(err instanceof ApiError ? err.message : "ورود با این سرویس انجام نشد.");
    });
    return () => {
      cancelled = true;
    };
  }, [params.code, params.error, params.name, params.state]);

  return (
    <Screen back kicker="ورود" title={error ? "ورود انجام نشد" : "در حال ورود…"}>
      <Banner text={error} />
      {ageRequired ? <Button label="ساخت حساب" onPress={() => router.replace("/register")} /> : null}
    </Screen>
  );
}
