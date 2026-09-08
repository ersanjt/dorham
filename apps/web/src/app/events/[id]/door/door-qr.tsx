"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function DoorQr({ url }: { url: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    QRCode.toDataURL(url, { width: 280, margin: 1, color: { dark: "#120c09", light: "#fff8f0" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [url]);

  if (!src) return <p className="muted">در حال ساخت QR...</p>;
  return <img src={src} alt="QR check-in" style={{ width: 280, height: 280 }} />;
}
