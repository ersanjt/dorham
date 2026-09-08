import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

const EXPO = process.env.NEXT_PUBLIC_EXPO_URL ?? "exp://192.168.1.114:8081";

export default function GetAppPage() {
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="اپ شهر" title="دورهم روی گوشی">
        <p className="lead">یک اپ Expo برای آیفون و اندروید. صفحهٔ اول شهر است، نه سوایپ.</p>
      </PageIntro>
      <article className="card">
        <h2>الان روی همین شبکه</h2>
        <p>روی گوشی Expo Go را نصب کن، بعد این آدرس را باز کن:</p>
        <p className="strong" style={{ wordBreak: "break-all" }}>
          <a href={EXPO}>{EXPO}</a>
        </p>
        <p className="muted">گوشی و لپ‌تاپ باید همان وای‌فای را داشته باشند. API روی پورت ۴۰۰۰ است.</p>
      </article>
      <article className="card">
        <h2>TECNO / اندروید</h2>
        <p>تنظیمات → درباره گوشی → شماره ساخت را ۷ بار بزن.</p>
        <p>Developer options → USB debugging + Install via USB.</p>
        <p>نوار اعلان → USB را بگذار انتقال فایل. اگر پرسید Allow USB debugging، Allow را بزن.</p>
      </article>
      <article className="card">
        <h2>آیفون</h2>
        <p>گوشی را باز کن. اگر پرسید به این رایانه اعتماد کن، Trust را بزن.</p>
        <p>از App Store برنامه Expo Go را نصب کن. از ویندوز نمی‌شود فایل iOS نصب کرد.</p>
      </article>
      <article className="card">
        <h2>استور</h2>
        <p className="muted">
          نام استور Dorham است، طبقه Social Networking، سن ۱۷+. انتشار Play و App Store بعد از جمعهٔ واقعی.
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
