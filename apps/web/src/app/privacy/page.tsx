import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export default function PrivacyPage() {
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="حریم" title="حریم خصوصی">
        <p className="muted">تا پیش از لانچ عمومی، این متن پیش‌نویس است.</p>
      </PageIntro>
      <article className="card">
        <p>حداقل داده برای رویداد و حساب ذخیره می‌شود: نام نمایشی، ایمیل، شهر، و RSVP.</p>
        <p>ایمیل، تلفن و مختصات دقیق به بقیهٔ اعضا داده نمی‌شود.</p>
        <p>عکس تأیید دست‌نویس فقط برای صف میزبان است، نه پروفایل عمومی و نه فید.</p>
        <p>حساب را می‌توانی موقتاً متوقف یا برای همیشه حذف کنی.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
