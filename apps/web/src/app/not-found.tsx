import Link from "next/link";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { t } from "../lib/copy";
import { getLocale } from "../lib/locale-server";

export default async function NotFound() {
  const copy = t(await getLocale()).notFound;
  return (
    <main className="wrap">
      <SiteHeader />
      <p className="kicker">{copy.kicker}</p>
      <h1>{copy.title}</h1>
      <p className="muted">{copy.lead}</p>
      <p>
        <Link className="btn" href="/">
          {copy.home}
        </Link>
      </p>
      <SiteFooter />
    </main>
  );
}
