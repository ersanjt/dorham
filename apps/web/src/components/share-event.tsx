"use client";

import { useState } from "react";
import { useCopy } from "./locale-provider";

export function ShareEvent({ title, text, url }: { title: string; text: string; url?: string }) {
  const copy = useCopy();
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
      setNotice(copy.share.copied);
    } catch {
      setNotice(copy.share.copyFail);
    }
  }

  return (
    <div>
      <button className="btn ghost" type="button" onClick={share}>
        {copy.share.send}
      </button>
      {notice ? <p className="meta">{notice}</p> : null}
    </div>
  );
}
