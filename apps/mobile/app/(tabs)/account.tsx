import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect, router } from "expo-router";
import type { EventDto, Me } from "@dorham/shared";
import { EventCard } from "../../components/event-card";
import { AppText, Badge, Banner, Button, Card, Field, Loading, Screen } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { verifyFa } from "../../lib/format";
import { clearSession, isSignedIn } from "../../lib/session";

export default function AccountScreen() {
  const [me, setMe] = useState<Me | null>(null);
  const [mine, setMine] = useState<EventDto[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const ok = isSignedIn();
      setSignedIn(ok);
      if (!ok) {
        setMe(null);
        setMine([]);
        return;
      }
      Promise.all([api<Me>("/users/me"), api<EventDto[]>("/events/mine")])
        .then(([profile, events]) => {
          setMe(profile);
          setMine(events);
          setDisplayName(profile.displayName);
          setBio(profile.bio ?? "");
        })
        .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "حساب خوانده نشد."));
    }, []),
  );

  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      const next = await api<Me>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ displayName, bio: bio || null }),
      });
      setMe(next);
      setNotice("پروفایل ذخیره شد.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیره نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePause() {
    if (!me) return;
    try {
      const next = await api<Me>(me.status === "PAUSED" ? "/users/me/resume" : "/users/me/pause", {
        method: "POST",
      });
      setMe(next);
      setNotice(next.status === "PAUSED" ? "حساب موقتاً متوقف شد." : "حساب دوباره فعال شد.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "وضعیت عوض نشد.");
    }
  }

  function confirmDelete() {
    Alert.alert("حذف حساب", "حساب برای همیشه حذف شود؟", [
      { text: "نه", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: () => {
          api("/users/me", { method: "DELETE" })
            .catch(() => undefined)
            .finally(async () => {
              await clearSession();
              setMe(null);
              setMine([]);
              setSignedIn(false);
            });
        },
      },
    ]);
  }

  if (!signedIn) {
    return (
      <Screen kicker="پروفایل" title="حساب من" subtitle="ورود برای ثبت حضور، نظر، و نوشتن در فید.">
        <Card accent>
          <AppText bold size="title">
            یک حساب برای شهر
          </AppText>
          <AppText muted>وب و موبایل همان API را می‌زنند. اول وارد شو، بعد جمعه را باز کن.</AppText>
        </Card>
        <Button label="ورود" onPress={() => router.push("/login")} />
        <Button label="ساخت حساب" variant="ghost" onPress={() => router.push("/register")} />
        <Button label="امنیت و قواعد" variant="ghost" onPress={() => router.push("/safety")} />
      </Screen>
    );
  }

  if (!me) {
    return (
      <Screen kicker="پروفایل" title="حساب من">
        <Banner text={error} />
        <Loading />
      </Screen>
    );
  }

  const canHost = me.role === "HOST" || me.role === "MODERATOR" || me.role === "ADMIN";

  return (
    <Screen kicker="پروفایل" title="حساب من">
      <Banner text={error} />
      <Banner text={notice} tone="ok" />
      <Card accent>
        <AppText bold size="title">
          {me.displayName}
        </AppText>
        <AppText muted>{me.email}</AppText>
        <Badge
          label={verifyFa[me.verificationStatus] ?? me.verificationStatus}
          verified={me.verificationStatus === "VERIFIED"}
        />
        <Badge label={me.emailVerified ? "ایمیل تأیید شد" : "ایمیل تأیید نشده"} ok={me.emailVerified} />
        {me.status === "PAUSED" ? <Badge label="متوقف" /> : null}
        <AppText muted size="caption">
          تأیید دست‌نویس روی وب کامل می‌شود. هدف ۲۵۰ لیر در سال؛ جمعه‌های اول رایگان.
        </AppText>
      </Card>
      {!me.emailVerified || me.verificationStatus === "NONE" || me.verificationStatus === "REJECTED" ? (
        <Card accent>
          <AppText bold size="title">
            قدم بعدی در دورهم
          </AppText>
          <AppText muted>
            بعد از ساخت حساب: ایمیل را تأیید کن، یک جمعه را باز کن، یا مکان ایرانی نزدیکت را پیدا کن.
          </AppText>
          {!me.emailVerified ? (
            <Button
              label="تأیید ایمیل"
              onPress={() => {
                api<{ verifyEmailToken?: string }>("/auth/resend-verification", { method: "POST" })
                  .then((data) => {
                    if (data.verifyEmailToken) {
                      router.push(`/verify-email?token=${encodeURIComponent(data.verifyEmailToken)}`);
                    } else {
                      setNotice("اگر ایمیل تأیید نشده باشد، لینک جدید ساخته شد.");
                    }
                  })
                  .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "ارسال نشد."));
              }}
            />
          ) : null}
          <Button label="رویدادهای این هفته" variant="ghost" onPress={() => router.push("/events")} />
          <Button label="مکان‌های ایرانی" variant="ghost" onPress={() => router.push("/venues")} />
        </Card>
      ) : null}
      {me.status === "PAUSED" ? (
        <Banner text="حساب متوقف است. از سر بگیر تا پروفایل، ثبت حضور و فید دوباره باز شوند." />
      ) : null}
      <Field
        label="نام نمایشی"
        value={displayName}
        onChangeText={setDisplayName}
        editable={me.status !== "PAUSED"}
      />
      <Field
        label="معرفی کوتاه"
        value={bio}
        onChangeText={setBio}
        multiline
        editable={me.status !== "PAUSED"}
      />
      <Button
        label={saving ? "…" : "ذخیره پروفایل"}
        onPress={saveProfile}
        disabled={saving || me.status === "PAUSED"}
      />
      <Button label="پروفایل عمومی" variant="ghost" onPress={() => router.push(`/people/${me.id}`)} />
      <Button label="ثبت مکان" variant="ghost" onPress={() => router.push("/venues/new")} />
      {canHost ? <Button label="رویداد تازه" onPress={() => router.push("/events/new")} /> : null}
      {mine.length > 0 ? (
        <AppText bold size="title">
          جمعه‌های من
        </AppText>
      ) : null}
      {mine.map((event) => (
        <EventCard
          key={event.id}
          event={{ ...event, hostName: event.host.displayName }}
          onPress={() => router.push(`/events/${event.id}`)}
        />
      ))}
      <Button label="امنیت و قواعد" variant="ghost" onPress={() => router.push("/safety")} />
      <Button label="حریم خصوصی" variant="ghost" onPress={() => router.push("/privacy")} />
      <Button label="قوانین" variant="ghost" onPress={() => router.push("/terms")} />
      <Button
        label={me.status === "PAUSED" ? "از سر گرفتن حساب" : "توقف موقت"}
        variant="ghost"
        onPress={togglePause}
      />
      <Button
        label="خروج"
        variant="ghost"
        onPress={() => {
          api("/auth/logout", { method: "POST" })
            .catch(() => undefined)
            .finally(async () => {
              await clearSession();
              setMe(null);
              setMine([]);
              setSignedIn(false);
            });
        }}
      />
      <Button label="حذف حساب" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}
