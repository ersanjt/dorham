import { useState } from "react";
import { router } from "expo-router";
import { createEventBodySchema } from "@dorham/shared";
import { Banner, Button, Field, Screen } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
import { isSignedIn } from "../../../lib/session";

export default function NewEventScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("Kadıköy");
  const [address, setAddress] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("24");
  const [priceTry, setPriceTry] = useState("200");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function publish() {
    if (!isSignedIn()) {
      router.push("/login?next=/events/new");
      return;
    }
    const parsed = createEventBodySchema.safeParse({
      title,
      description,
      city: "istanbul",
      venue: venue || undefined,
      address: address || undefined,
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

  return (
    <Screen back kicker="میزبان" title="رویداد تازه" subtitle="جمعهٔ شهر را بساز، نه سوایپ. تاریخ میلادی.">
      <Banner text={error} />
      <Field label="عنوان" value={title} onChangeText={setTitle} />
      <Field label="توضیح" value={description} onChangeText={setDescription} multiline />
      <Field label="مکان" value={venue} onChangeText={setVenue} />
      <Field label="آدرس" value={address} onChangeText={setAddress} />
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
