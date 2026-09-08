"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "../lib/session";

export function AuthImage({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [blobSrc, setBlobSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl = "";
    const token = getAccessToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(src, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("media");
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobSrc(objectUrl);
      })
      .catch(() => setBlobSrc(null));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!blobSrc) return <p className="muted">عکس لود نشد.</p>;
  return <img src={blobSrc} alt={alt} className={className} style={{ width: "100%", borderRadius: 12 }} />;
}
