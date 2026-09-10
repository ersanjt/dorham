"use client";

import { useState } from "react";

export function ShareEvent({ title, text, url }: { title: string; text: string; url?: string }) {
  const [notice, setNotice] = useState("");

  async function share() {
    setNotice("");
    if (navigator.share) {
      try {
        await navigator.share(url ? { title, text, url } : { title, text });
        return;
      } catch {
        /* dismissed */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setNotice("متن دعوت کپی شد. بفرست تلگرام یا اینستا.");
    } catch {
      setNotice("کپی نشد. لینک را دستی بفرست.");
    }
  }

  return (
    <div>
      <button className="btn ghost" type="button" onClick={share}>
        فرستادن دعوت
      </button>
      {notice ? <p className="meta">{notice}</p> : null}
    </div>
  );
}
