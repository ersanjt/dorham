import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { submitVenueBodySchema, type VenueKind } from "@dorham/shared";
import { AppText, Banner, Button, Field, Screen } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
import { loginHref } from "../../../lib/paths";
import { isSignedIn } from "../../../lib/session";
import { color, radius, space } from "../../../lib/theme";

const KINDS: { id: VenueKind; label: string }[] = [
  { id: "RESTAURANT", label: "رستوران" },
  { id: "CAFE", label: "کافه" },
  { id: "MARKET", label: "مارکت" },
  { id: "CULTURAL", label: "فرهنگی" },
];

export default function SubmitVenueScreen() {
  const [kind, setKind] = useState<VenueKind>("RESTAURANT");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [menuNotes, setMenuNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!isSignedIn()) {
      router.push(loginHref("/venues/new"));
      return;
    }
    const parsed = submitVenueBodySchema.safeParse({
      name,
      kind,
      area,
      address,
      mapsUrl,
      description,
      priceRange: priceRange || undefined,
      menuNotes: menuNotes || undefined,
    });
    if (!parsed.success) {
      setError("نام، آدرس، توضیح و لینک گوگل‌مپ را کامل کن.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const venue = await api<{ slug: string }>("/venues", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      router.replace(`/venues/${venue.slug}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ثبت نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen back kicker="صاحب‌کار" title="ثبت مکان" subtitle="لینک گوگل‌مپ اجباری است. دیسکو دوستیابی نیست.">
      <Banner text={error} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {KINDS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setKind(item.id)}
            style={{
              borderWidth: 1,
              borderColor: kind === item.id ? color.clay : color.line,
              backgroundColor: kind === item.id ? color.clay : color.cream,
              borderRadius: radius.pill,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <AppText bold size="caption" style={{ color: kind === item.id ? color.white : color.ink, lineHeight: 18 }}>
              {item.label}
            </AppText>
          </Pressable>
        ))}
      </View>
      <Field label="نام" value={name} onChangeText={setName} />
      <Field label="محله لاتین" value={area} onChangeText={setArea} placeholder="kadikoy" />
      <Field label="آدرس" value={address} onChangeText={setAddress} />
      <Field label="لینک گوگل‌مپ" value={mapsUrl} onChangeText={setMapsUrl} autoCapitalize="none" />
      <Field label="توضیح" value={description} onChangeText={setDescription} multiline />
      <Field label="حدود قیمت" value={priceRange} onChangeText={setPriceRange} />
      <Field
        label="غذای شاخص / توضیح منو"
        value={menuNotes}
        onChangeText={setMenuNotes}
        multiline
        placeholder="عکس منو را بعداً از وب اضافه کن"
      />
      <AppText muted style={{ marginBottom: space.md }}>
        آپلود عکس منو روی وب (صفحهٔ مکان → صاحب‌کار) کامل‌تر است.
      </AppText>
      <Button label={pending ? "…" : "انتشار مکان"} onPress={submit} disabled={pending} />
    </Screen>
  );
}
