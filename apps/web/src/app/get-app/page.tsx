import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

const PLAY = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim();
const APPLE = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim();
const EXPO = process.env.NEXT_PUBLIC_EXPO_URL?.trim();

export default function GetAppPage() {
  const hasStores = Boolean(PLAY || APPLE);

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="اپ شهر" title="دورهم روی گوشی">
        <p className="lead">یک اپ برای آیفون و اندروید. صفحهٔ اول شهر و رویداد است، نه سوایپ.</p>
      </PageIntro>

      <article className="card">
        <h2>همین حالا روی وب</h2>
        <p>
          تا انتشار استور، همهٔ کارها از وب انجام می‌شود:{" "}
          <a href="https://www.dorham.app">www.dorham.app</a>
        </p>
        <p className="muted">ثبت‌نام، رویداد، RSVP، فید شهر، مکان‌ها و تأیید دست‌نویس روی وب آماده است.</p>
      </article>

      {hasStores ? (
        <article className="card">
          <h2>دانلود</h2>
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
          <h2>استور</h2>
          <p>
            نام استور <strong>Dorham</strong>، دستهٔ شبکه‌های اجتماعی، سن ۱۷+. انتشار Play و App Store بعد از
            اولین جمعهٔ واقعی استانبول.
          </p>
          <p className="muted">الان از وب استفاده کن؛ لینک دانلود اینجا اضافه می‌شود.</p>
        </article>
      )}

      {EXPO && process.env.NODE_ENV !== "production" ? (
        <article className="card">
          <h2>توسعه (Expo Go)</h2>
          <p className="strong" style={{ wordBreak: "break-all" }}>
            <a href={EXPO}>{EXPO}</a>
          </p>
          <p className="muted">فقط برای تیم — روی شبکهٔ محلی.</p>
        </article>
      ) : null}

      <SiteFooter />
    </main>
  );
}
