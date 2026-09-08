import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { AppText, Button, Card, Screen } from "../../../../components/ui";
import { api, ApiError } from "../../../../lib/api";
import { loginHref } from "../../../../lib/paths";
import { isSignedIn } from "../../../../lib/session";

export default function CheckInScreen() {
  const { id, s } = useLocalSearchParams<{ id: string; s?: string }>();
  const [message, setMessage] = useState("در حال ثبت ورود…");
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    if (!isSignedIn()) {
      setNeedLogin(true);
      setMessage("اول وارد شو، بعد QR را دوباره اسکن کن.");
      return;
    }
    if (!s) {
      setMessage("کد ورودی ناقص است.");
      return;
    }
    api<{ already: boolean; displayName: string; ticketStatus?: string }>(`/events/${id}/checkin`, {
      method: "POST",
      body: JSON.stringify({ secret: s }),
    })
      .then((data) =>
        setMessage(
          data.already
            ? "قبلاً وارد شده‌ای."
            : data.ticketStatus === "PAID_DOOR"
              ? `خوش آمدی ${data.displayName}. بلیت دم در گرفته شد.`
              : `خوش آمدی ${data.displayName}.`,
        ),
      )
      .catch((err: unknown) => setMessage(err instanceof ApiError ? err.message : "ورود ثبت نشد."));
  }, [id, s]);

  return (
    <Screen back title="ورود به دورهم">
      <Card>
        <AppText>{message}</AppText>
      </Card>
      {needLogin ? (
        <Button
          label="ورود"
          onPress={() =>
            router.push(loginHref(`/events/${id}/checkin${s ? `?s=${encodeURIComponent(s)}` : ""}`))
          }
        />
      ) : null}
    </Screen>
  );
}
