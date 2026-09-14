"use client";

import { FormEvent, useEffect, useState } from "react";
import type { VenueDoor, VenueDto } from "@dorham/shared";
import { api, ApiError } from "../../../lib/api";
import { useSession } from "../../../lib/use-session";

export function VenueMenuEditor({
  slug,
  menuNotes,
  menuImageUrl,
}: {
  slug: string;
  menuNotes: string | null;
  menuImageUrl: string | null;
}) {
  const { signedIn, ready } = useSession();
  const [isOwner, setIsOwner] = useState(false);
  const [notes, setNotes] = useState(menuNotes ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    api<VenueDoor>(`/venues/${slug}/door`)
      .then(() => setIsOwner(true))
      .catch(() => setIsOwner(false));
  }, [slug, signedIn]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!ready || !signedIn || !isOwner) return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem("menuImage") as HTMLInputElement)?.files?.[0];
    setPending(true);
    setError("");
    setMessage("");
    try {
      let menuMediaId: string | null | undefined;
      if (file) {
        const body = new FormData();
        body.append("file", file);
        const media = await api<{ id: string }>("/media?kind=VENUE_MENU", { method: "POST", body });
        menuMediaId = media.id;
      }
      const nextNotes = notes.trim();
      await api<VenueDto>(`/venues/${slug}/menu`, {
        method: "PATCH",
        body: JSON.stringify({
          menuNotes: nextNotes ? nextNotes : null,
          ...(menuMediaId ? { menuMediaId } : {}),
        }),
      });
      setMessage("منو به‌روز شد. صفحه را تازه کن تا همه ببینند.");
      form.reset();
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیره نشد.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="venue-menu-editor" aria-label="ویرایش منو">
      <h3>منوی مکان (صاحب‌کار)</h3>
      <p className="muted">عکس واضح منو یا توضیح غذای شاخص — برای مهمان‌ها مفید است.</p>
      {message ? <div className="banner ok">{message}</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      {menuImageUrl && !preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="venue-menu-preview" src={menuImageUrl} alt="منوی فعلی" />
      ) : null}
      <form className="form" onSubmit={onSubmit}>
        <label>
          عکس منو
          <input
            name="menuImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (preview) URL.revokeObjectURL(preview);
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </label>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="venue-menu-preview" src={preview} alt="پیش‌نمایش" />
        ) : null}
        <label>
          غذای شاخص / توضیح
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} />
        </label>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "…" : "ذخیره منو"}
        </button>
      </form>
    </section>
  );
}
