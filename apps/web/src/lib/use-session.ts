"use client";

import { useEffect, useState } from "react";
import { isSignedIn } from "./session";

/** Client session flag — waits for hydration so UI does not flash the wrong CTA. */
export function useSession() {
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSignedIn(isSignedIn());
    sync();
    setReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener("dorham-auth", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("dorham-auth", sync);
    };
  }, []);

  return { signedIn, ready };
}
