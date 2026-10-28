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
    const secondaryHref = primaryHref === "/venues" ? "/events" : "/venues";
    const secondaryLabel = primaryHref === "/venues" ? copy.nav.events : venuesLabel;
    return (
      <div className="row">
        <Link className="btn" href={primaryHref}>
          {primaryLabel}
        </Link>
        <Link className="btn ghost" href={secondaryHref}>
          {secondaryLabel}
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
