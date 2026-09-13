import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { router } from "expo-router";
import type { Me, VenueHangPlanDto } from "@dorham/shared";
import { AppText, Banner, Button, Card, Field } from "./ui";
import { api, ApiError } from "../lib/api";
import { publicMediaUrl } from "../lib/api-base";
import { formatDayChip } from "../lib/format";
import { loginHref } from "../lib/paths";
import { isSignedIn } from "../lib/session";
import { color, radius, space } from "../lib/theme";

const INTENT_FA: Record<string, string> = {
  LUNCH: "ناهار",
  DINNER: "شام",
  COFFEE: "قهوه",
  OTHER: "دورهم",
};

const INTENTS = ["COFFEE", "LUNCH", "DINNER", "OTHER"] as const;

function slotKey(plan: Pick<VenueHangPlanDto, "startsAt" | "intent">) {
  const d = new Date(plan.startsAt);
  return `${d.toISOString().slice(0, 13)}|${plan.intent}`;
}

function defaultLocalTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(13, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function VenueHangPlans({ slug }: { slug: string }) {
  const [plans, setPlans] = useState<VenueHangPlanDto[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [joining, setJoining] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState(defaultLocalTime());
  const [intent, setIntent] = useState<(typeof INTENTS)[number]>("COFFEE");
  const [note, setNote] = useState("");
  const signedIn = isSignedIn();

  async function load() {
    const data = await api<VenueHangPlanDto[]>(`/venues/${slug}/plans`, { auth: false });
    setPlans(data);
  }

  useEffect(() => {
    load().catch(() => setPlans([]));
  }, [slug]);

  useEffect(() => {
    if (!signedIn) {
      setMeId(null);
      return;
    }
    api<Me>("/users/me")
      .then((m) => setMeId(m.id))
      .catch(() => setMeId(null));
  }, [signedIn, slug]);

  const slots = useMemo(() => {
    const map = new Map<
      string,
      { key: string; startsAt: string; intent: VenueHangPlanDto["intent"]; plans: VenueHangPlanDto[] }
    >();
    for (const plan of plans) {
      const key = slotKey(plan);
      const existing = map.get(key);
      if (existing) existing.plans.push(plan);
      else map.set(key, { key, startsAt: plan.startsAt, intent: plan.intent, plans: [plan] });
    }
    return [...map.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [plans]);

  async function joinSlot(slot: { key: string; startsAt: string; intent: VenueHangPlanDto["intent"] }) {
    if (!signedIn) {
      router.push(loginHref(`/venues/${slug}`));
      return;
    }
    setError("");
    setJoining(slot.key);
    try {
      await api(`/venues/${slug}/plans`, {
        method: "POST",
        body: JSON.stringify({ startsAt: slot.startsAt, intent: slot.intent }),
      });
      setNotice("به این زمان پیوستی.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "پیوستن ممکن نشد.");
    } finally {
      setJoining(null);
    }
  }

  async function createPlan() {
    if (!signedIn) {
      router.push(loginHref(`/venues/${slug}`));
      return;
    }
    setError("");
    try {
      const iso = new Date(startsAt).toISOString();
      await api(`/venues/${slug}/plans`, {
        method: "POST",
        body: JSON.stringify({
          startsAt: iso,
          intent,
          note: note.trim() || undefined,
        }),
      });
      setNotice("برنامه‌ات ثبت شد.");
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "برنامه ثبت نشد.");
    }
  }

  return (
    <View style={{ gap: space.md, marginTop: space.sm }}>
      <AppText bold size="title">
        کی می‌آید اینجا؟
      </AppText>
      <AppText muted>هماهنگی حضور — نه نقشهٔ زنده. ببین و بپیوند.</AppText>
      <Banner text={error} />
      <Banner text={notice} tone="ok" />

      {slots.length === 0 ? <AppText muted>هنوز برنامه‌ای برای دو هفتهٔ آینده نیست.</AppText> : null}

      {slots.map((slot) => {
        const iAmIn = meId ? slot.plans.some((p) => p.user.id === meId) : false;
        return (
          <Card key={slot.key}>
            <AppText bold>
              {INTENT_FA[slot.intent] ?? slot.intent} · {formatDayChip(slot.startsAt)}
            </AppText>
            <AppText muted size="caption">
              {slot.plans.length} نفر
            </AppText>
            <View style={{ gap: 10, marginTop: 8 }}>
              {slot.plans.map((plan) => {
                const photo = publicMediaUrl(plan.user.photoUrl);
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => router.push(`/people/${plan.user.id}`)}
                    style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
                  >
                    {photo ? (
                      <Image
                        source={{ uri: photo }}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color.paperDeep }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: color.paperDeep,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AppText bold>{plan.user.displayName.slice(0, 1)}</AppText>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <AppText bold>{plan.user.displayName}</AppText>
                      {plan.user.verificationStatus === "VERIFIED" ? (
                        <AppText muted size="caption">
                          تأییدشده
                        </AppText>
                      ) : null}
                      {plan.note ? (
                        <AppText muted size="caption">
                          {plan.note}
                        </AppText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {iAmIn ? (
              <AppText muted size="caption" style={{ marginTop: 8 }}>
                تو هم در این زمان هستی.
              </AppText>
            ) : (
              <Button
                label={joining === slot.key ? "…" : "من هم می‌آیم"}
                onPress={() => joinSlot(slot)}
                disabled={joining === slot.key}
              />
            )}
          </Card>
        );
      })}

      <Card>
        <AppText bold>اعلام حضور تازه</AppText>
        {!signedIn ? (
          <Button label="برای اعلام وارد شو" variant="ghost" onPress={() => router.push(loginHref(`/venues/${slug}`))} />
        ) : (
          <>
            <Field
              label="زمان (YYYY-MM-DDTHH:mm)"
              value={startsAt}
              onChangeText={setStartsAt}
              autoCapitalize="none"
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 }}>
              {INTENTS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setIntent(item)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: radius.pill,
                    borderWidth: 1.5,
                    borderColor: intent === item ? color.clay : color.line,
                    backgroundColor: intent === item ? color.clay : color.cream,
                  }}
                >
                  <AppText style={{ color: intent === item ? color.paper : color.ink }}>
                    {INTENT_FA[item]}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <Field label="یادداشت (اختیاری)" value={note} onChangeText={setNote} />
            <Button label="ثبت برنامه" onPress={createPlan} />
          </>
        )}
      </Card>
    </View>
  );
}
