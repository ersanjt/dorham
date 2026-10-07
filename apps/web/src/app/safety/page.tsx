import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { t } from "../../lib/copy";
import { getLocale } from "../../lib/locale-server";

export default async function SafetyPage() {
  const copy = t(await getLocale()).safetyPage;
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.kicker} title={copy.title}>
        <p className="muted">{copy.lead}</p>
      </PageIntro>
      <article className="card">
        <p>{copy.age}</p>
        <p>{copy.private}</p>
        <p>{copy.report}</p>
        <p>{copy.guests}</p>
        <p>{copy.notSwipe}</p>
      </article>
      <SiteFooter />
    </main>
  );
}
