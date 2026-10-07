import Link from "next/link";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { t } from "../../lib/copy";
import { getLocale } from "../../lib/locale-server";

export default async function TermsPage() {
  const copy = t(await getLocale()).terms;
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.kicker} title={copy.title}>
        <p className="muted">{copy.updated}</p>
      </PageIntro>
      <article className="card stack">
        <h2>{copy.joinTitle}</h2>
        <p>{copy.join}</p>

        <h2>{copy.communityTitle}</h2>
        <p>{copy.community}</p>

        <h2>{copy.eventTitle}</h2>
        <p>{copy.event}</p>

        <h2>{copy.placesTitle}</h2>
        <p>{copy.places}</p>

        <h2>{copy.suspendTitle}</h2>
        <p>{copy.suspend}</p>

        <h2>{copy.contactTitle}</h2>
        <p>
          <a href="mailto:hello@dorham.app">hello@dorham.app</a> ·{" "}
          <Link href="/safety">{copy.safety}</Link>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
