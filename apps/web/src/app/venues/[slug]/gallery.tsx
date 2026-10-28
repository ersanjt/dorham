"use client";

import { useState } from "react";
import { safeHref } from "../../../lib/safe-href";

export type GalleryItem = {
  kind: "photo" | "street" | "map";
  src: string;
  label: string;
};

function embedSrc(src: string) {
  if (src.startsWith("/v1/maps/") && !src.includes("\\") && !src.includes("://")) return src;
  try {
    const url = new URL(src);
    const host = url.hostname.toLowerCase();
    const google =
      host === "maps.google.com" ||
      host === "www.google.com" ||
      host === "google.com" ||
      host.endsWith(".google.com");
    if (url.protocol === "https:" && google) return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function VenueGallery({ items, name }: { items: GalleryItem[]; name: string }) {
  const [active, setActive] = useState(0);
  if (!items.length) {
    return (
      <section className="venue-gallery">
        <div className="venue-gallery-empty">هنوز تصویری برای این مکان ثبت نشده.</div>
      </section>
    );
  }

  const current = items[Math.min(active, items.length - 1)]!;
  const frameSrc = embedSrc(current.src);
  const imageSrc = safeHref(current.src);
  const isIframe = current.kind === "map" || current.src.includes("svembed") || current.src.includes("output=embed");

  return (
    <section className="venue-gallery" aria-label={`گالری ${name}`}>
      <div className="venue-gallery-main">
        {isIframe && frameSrc ? (
          <iframe
            key={frameSrc}
            className="venue-gallery-frame"
            title={current.label}
            src={frameSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="venue-gallery-frame" src={imageSrc} alt={current.label} />
        ) : (
          <div className="venue-gallery-empty">این تصویر قابل نمایش نیست.</div>
        )}
        <p className="venue-gallery-caption">{current.label}</p>
      </div>
      {items.length > 1 ? (
        <div className="venue-gallery-thumbs" role="tablist" aria-label="انتخاب تصویر">
          {items.map((item, index) => {
            const thumbIframe = item.kind === "map" || item.src.includes("svembed");
            return (
              <button
                key={`${item.kind}-${index}`}
                type="button"
                role="tab"
                aria-selected={index === active}
                className={`venue-gallery-thumb ${index === active ? "on" : ""}`}
                onClick={() => setActive(index)}
              >
                {thumbIframe ? (
                  <span className="venue-gallery-thumb-label">
                    {item.kind === "map" ? "نقشه" : "خیابان"}
                  </span>
                ) : safeHref(item.src) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={safeHref(item.src) ?? undefined} alt="" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
