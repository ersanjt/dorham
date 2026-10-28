"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrImage({ url, alt, size = 280 }: { url: string; alt: string; size?: number }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancel = false;
    QRCode.toDataURL(url, { width: size, margin: 1, color: { dark: "#120c09", light: "#fff8f0" } })
      .then((next) => {
        if (!cancel) setSrc(next);
      })
      .catch(() => {
        if (!cancel) setSrc("");
      });
    return () => {
      cancel = true;
    };
  }, [url, size]);

  if (!src) return <p className="muted">…</p>;
  return <img src={src} alt={alt} width={size} height={size} style={{ width: size, height: size }} />;
}
