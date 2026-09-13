"use client";

import Link from "next/link";
import { useState } from "react";

export type VenueCoverKind = "photo" | "street" | "map";

function classifyCover(src: string | null | undefined, mapImageUrl: string | null | undefined): VenueCoverKind {
  if (!src) return "map";
  if (mapImageUrl && src === mapImageUrl) return "map";
  if (/streetview|maps\.googleapis\.com\/maps\/api\/streetview/i.test(src)) return "street";
  return "photo";
}

const TAG: Record<VenueCoverKind, string> = {
  photo: "عکس مکان",
  street: "نمای خیابان",
  map: "نقشه",
};

export function VenueCover({
  href,
  name,
  areaLabel,
  src,
  mapImageUrl,
}: {
  href: string;
  name: string;
  areaLabel: string;
  src: string | null | undefined;
  mapImageUrl: string | null | undefined;
}) {
  const [failed, setFailed] = useState(false);
  const kind = classifyCover(src, mapImageUrl);
  const showImage = Boolean(src) && !failed;

  return (
    <Link className="venue-map-link" href={href} aria-label={name}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="venue-map"
          src={src!}
          alt={kind === "map" ? `نقشه ${name}` : name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="venue-cover-fallback" aria-hidden>
          <span className="venue-cover-fallback-area">{areaLabel}</span>
          <span className="venue-cover-fallback-name">{name}</span>
        </div>
      )}
      {showImage && kind === "map" ? <span className="venue-map-pin" aria-hidden /> : null}
      <span className="venue-cover-tag">{TAG[showImage ? kind : "map"]}</span>
    </Link>
  );
}
