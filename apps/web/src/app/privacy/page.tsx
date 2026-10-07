import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { t } from "../../lib/copy";
import { getLocale } from "../../lib/locale-server";

export default async function PrivacyPage() {
  const copy = t(await getLocale()).privacy;
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.kicker} title={copy.title}>
        <p className="muted">{copy.updated}</p>
      </PageIntro>
      <article className="card stack">
        <h2>{copy.collectTitle}</h2>
        <p>{copy.collectAccount}</p>
        <p>{copy.collectEvent}</p>
        <p>{copy.collectTrust}</p>

        <h2>{copy.hiddenTitle}</h2>
        <p>{copy.hidden}</p>

        <h2>{copy.storeTitle}</h2>
        <p>{copy.store}</p>

        <h2>{copy.rightsTitle}</h2>
        <p>{copy.rights}</p>
        <p>
          {copy.contact}{" "}
          <a href="mailto:privacy@dorham.app">privacy@dorham.app</a>
        </p>

        <h2>{copy.adsTitle}</h2>
        <p>{copy.ads}</p>

        <h2>{copy.marketTitle}</h2>
        <p>{copy.market}</p>
      </article>
      <SiteFooter />
    </main>
  );
}
