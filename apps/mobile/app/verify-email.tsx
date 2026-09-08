import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Banner, Button, Screen } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { safeNext } from "../lib/paths";

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ token?: string; next?: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const next = safeNext(params.next);
  const [state, setState] = useState<"pending" | "ok" | "err">("pending");
  const [message, setMessage] = useState("در حال تأیید ایمیل...");

  useEffect(() => {
    if (!token) {
      setState("err");
      setMessage("لینک تأیید ناقص است.");
      return;
    }
    api<{ ok: boolean }>("/auth/verify-email", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setState("ok");
        setMessage("ایمیل تأیید شد.");
      })
      .catch((err: unknown) => {
        setState("err");
        setMessage(err instanceof ApiError ? err.message : "تأیید نشد.");
      });
  }, [token]);

  return (
    <Screen back kicker="حساب" title="تأیید ایمیل" subtitle="یک حساب. همان ایمیل وب و اپ.">
      <Banner text={state === "err" ? message : ""} />
      <Banner text={state === "ok" ? message : state === "pending" ? "در حال تأیید ایمیل..." : ""} tone="ok" />
      {state === "ok" ? <Button label="ادامه" onPress={() => router.replace(next)} /> : null}
      {state === "err" ? <Button label="حساب من" variant="ghost" onPress={() => router.replace("/account")} /> : null}
    </Screen>
  );
}
