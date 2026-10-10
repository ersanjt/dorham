"use client";

import Link from "next/link";
import { useCopy } from "./locale-provider";
import { useSession } from "../lib/use-session";

export function HeroJoin({
  primaryHref,
  primaryLabel,
  venuesLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
  venuesLabel: string;
}) {
  const copy = useCopy();
  const { signedIn, ready } = useSession();

  if (!ready) {
    return (
      <div className="row">
        <Link className="btn" href={primaryHref}>
          {primaryLabel}
        </Link>
      </div>
    );
  }

  if (signedIn) {
    return (
      <div className="row">
        <Link className="btn" href={primaryHref}>
          {primaryLabel}
        </Link>
        <Link className="btn ghost" href="/venues">
          {venuesLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="row">
      <Link className="btn" href={primaryHref}>
        {primaryLabel}
      </Link>
      <Link className="btn ghost" href={`/register?next=${encodeURIComponent(primaryHref)}`}>
        {copy.nav.join}
      </Link>
    </div>
  );
}
