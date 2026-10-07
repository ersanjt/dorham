"use client";

import Link from "next/link";
import { useState } from "react";
import { useCopy } from "./locale-provider";

export type VenueCoverKind = "photo" | "street" | "map";

function classifyCover(src: string | null | undefined, mapImageUrl: string | null | undefined): VenueCoverKind {
  if (!src) return "map";
  if (mapImageUrl && src === mapImageUrl) return "map";
  if (/\/v1\/maps\/static(\?|$)/i.test(src)) return "map";
  if (/\/v1\/maps\/streetview(\?|$)|streetview|maps\.googleapis\.com\/maps\/api\/streetview/i.test(src)) {
    return "street";
  }
  return "photo";
}

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
  const copy = useCopy();
  const [failed, setFailed] = useState(false);
  const kind = classifyCover(src, mapImageUrl);
  const showImage = Boolean(src) && !failed;
  const tag = showImage
    ? kind === "photo"
      ? copy.venues.coverPhoto
      : kind === "street"
        ? copy.venues.coverStreet
        : copy.venues.coverMap
    : copy.venues.coverMap;

  return (
    <Link className="venue-map-link" href={href} aria-label={name}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="venue-map"
          src={src!}
          alt={kind === "map" ? copy.venues.mapAlt(name) : name}
          width={640}
          height={360}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="venue-cover-fallback" aria-hidden>
          <span className="venue-cover-fallback-area">{areaLabel}</span>
          <span className="venue-cover-fallback-name">{name}</span>
        </div>
      )}
      {showImage && kind === "map" ? <span className="venue-map-pin" aria-hidden /> : null}
      <span className="venue-cover-tag">{tag}</span>
    </Link>
  );
}
