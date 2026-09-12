"use client";

import { useState } from "react";

export type GalleryItem = {
  kind: "photo" | "street" | "map";
  src: string;
  label: string;
};

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
  const isIframe = current.kind === "map" || current.src.includes("svembed") || current.src.includes("output=embed");

  return (
    <section className="venue-gallery" aria-label={`گالری ${name}`}>
      <div className="venue-gallery-main">
        {isIframe ? (
          <iframe
            key={current.src}
            className="venue-gallery-frame"
            title={current.label}
            src={current.src}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="venue-gallery-frame" src={current.src} alt={current.label} />
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
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.src} alt="" />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
