import Link from "next/link";
import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

const PLAY = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim();
const APPLE = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim();

export default function GetAppPage() {
  const hasStores = Boolean(PLAY || APPLE);

  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="شروع از وب" title="الان روی وبسایت">
        <p className="lead">
          برای لانچ استانبول همهٔ کارها از وب انجام می‌شود: ثبت‌نام، رویداد، RSVP، مکان‌ها و تأیید هویت. اپ استور هنوز
          منتشر نشده — لینک دانلود الکی نمی‌گذاریم.
        </p>
      </PageIntro>

      <article className="card">
        <h2>مسیر درست عضویت</h2>
        <ol className="prose" style={{ paddingInlineStart: "1.2rem", lineHeight: 1.9 }}>
          <li>
            برو به{" "}
            <Link href="https://www.dorham.app/register">www.dorham.app/register</Link>
          </li>
          <li>ایمیل را تأیید کن (لینک از صندوق ورودی)</li>
          <li>رویداد این هفته را RSVP کن یا در مکان‌ها هماهنگی بگذار</li>
        </ol>
        <div className="row" style={{ marginTop: 16 }}>
          <Link className="btn" href="/register">
            عضویت
          </Link>
          <Link className="btn ghost" href="/events">
            رویدادها
          </Link>
          <Link className="btn ghost" href="/venues">
            مکان‌ها
          </Link>
        </div>
      </article>

      {hasStores ? (
        <article className="card">
          <h2>دانلود اپ</h2>
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
          <h2>اپ گوشی</h2>
          <p>
            iOS و Android بعد از اولین جمعهٔ واقعی و وقتی <code>api.dorham.app</code> سالم باشد منتشر می‌شوند. تا آن
            موقع از وب استفاده کن؛ دکمهٔ دانلود ساختگی نشان نمی‌دهیم.
          </p>
          <p className="muted">اگر کسی لینک استور خواست: بگو «فعلاً فقط وب — www.dorham.app».</p>
        </article>
      )}

      <SiteFooter />
    </main>
  );
}
