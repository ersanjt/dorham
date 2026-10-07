import Link from "next/link";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { t } from "../../lib/copy";
import { getLocale } from "../../lib/locale-server";

const PLAY = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim();
const APPLE = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim();

export default async function GetAppPage() {
  const copy = t(await getLocale()).getApp;
  const hasStores = Boolean(PLAY || APPLE);

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.kicker} title={copy.title}>
        <p className="lead">{copy.lead}</p>
      </PageIntro>

      <article className="card">
        <h2>{copy.pathTitle}</h2>
        <ol className="prose" style={{ paddingInlineStart: "1.2rem", lineHeight: 1.9 }}>
          <li>
            {copy.step1}{" "}
            <Link href="/register">dorham.app/register</Link>
          </li>
          <li>{copy.step2}</li>
          <li>{copy.step3}</li>
        </ol>
        <div className="row" style={{ marginTop: 16 }}>
          <Link className="btn" href="/register">
            {copy.join}
          </Link>
          <Link className="btn ghost" href="/events">
            {copy.events}
          </Link>
          <Link className="btn ghost" href="/venues">
            {copy.venues}
          </Link>
        </div>
      </article>

      {hasStores ? (
        <article className="card">
          <h2>{copy.download}</h2>
          <div className="row">
            {PLAY ? (
              <a className="btn" href={PLAY} rel="noopener noreferrer">
                Google Play
              </a>
            ) : null}
            {APPLE ? (
              <a className="btn" href={APPLE} rel="noopener noreferrer">
                App Store
              </a>
            ) : null}
          </div>
        </article>
      ) : (
        <article className="card">
          <h2>{copy.phoneTitle}</h2>
          <p>{copy.phoneLead}</p>
          <p className="muted">{copy.phoneHint}</p>
        </article>
      )}

      <SiteFooter />
    </main>
  );
}
