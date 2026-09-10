import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { createEventBodySchema, type VenueDto } from "@dorham/shared";
import { AppText, Banner, Button, Chip, Field, Screen } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";
import { space } from "../../../lib/theme";

export default function NewEventScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venueSlug, setVenueSlug] = useState("shiraz-kadikoy");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("24");
  const [priceTry, setPriceTry] = useState("200");
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<VenueDto[]>("/venues?city=istanbul&limit=80", { auth: false })
      .then(setVenues)
      .catch(() => setVenues([]));
  }, []);

  async function publish() {
    if (!isSignedIn()) {
      router.push("/login?next=/events/new");
      return;
    }
    const parsed = createEventBodySchema.safeParse({
      title,
      description,
      city: "istanbul",
      venueSlug: venueSlug || undefined,
      venue: venueSlug ? undefined : venue || undefined,
      address: venueSlug ? undefined : address || undefined,
      startsAt: startsAt ? new Date(startsAt).toISOString() : "",
      capacity: Number(capacity || 24),
      priceTry: Number(priceTry || 0),
    });
    if (!parsed.success) {
      setError("عنوان، توضیح و زمان میلادی را کامل کن. مثال زمان: 2026-09-11T19:00");
      return;
    }
    setPending(true);
    try {
      const event = await api<{ id: string }>("/events", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      router.replace(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ساخته نشد. فقط میزبان و ادمین.");
    } finally {
      setPending(false);
    }
  }

  const picks = venues.slice(0, 12);

  return (
    <Screen back kicker="میزبان" title="رویداد تازه" subtitle="مکان را از فهرست ایرانی انتخاب کن. تاریخ میلادی.">
      <Banner text={error} />
      <Field label="عنوان" value={title} onChangeText={setTitle} />
      <Field label="توضیح" value={description} onChangeText={setDescription} multiline />
      <AppText bold size="caption">
        مکان از فهرست
      </AppText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {picks.map((item) => (
          <Chip
            key={item.id}
            label={item.name}
            selected={venueSlug === item.slug}
            onPress={() => setVenueSlug((current) => (current === item.slug ? "" : item.slug))}
          />
        ))}
      </View>
      {!venueSlug ? (
        <>
          <Field label="مکان آزاد" value={venue} onChangeText={setVenue} />
          <Field label="آدرس" value={address} onChangeText={setAddress} />
        </>
      ) : null}
      <Field
        label="شروع (میلادی، مثل 2026-09-11T19:00)"
        value={startsAt}
        onChangeText={setStartsAt}
        autoCapitalize="none"
      />
      <Field label="ظرفیت" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />
      <Field label="بلیت لیر (۰ رایگان)" value={priceTry} onChangeText={setPriceTry} keyboardType="number-pad" />
      <Button label={pending ? "..." : "انتشار"} onPress={publish} disabled={pending} />
    </Screen>
  );
}
