import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export default function SafetyPage() {
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="اعتماد شهر" title="امنیت و قواعد">
        <p className="muted">زن‌ها می‌مانند اگر پروفایل واقعی باشد و فید ازدحام مردانه نشود.</p>
      </PageIntro>
      <article className="card">
        <p>۱۸ سال به بالا. یک حساب. بدون عکس هوش مصنوعی به‌عنوان چهره.</p>
        <p>ایمیل، تلفن و موقعیت دقیق به بقیه نشان داده نمی‌شود.</p>
        <p>گزارش و بلاک همیشه در دسترس است. عکس تأیید هویت عمومی نمی‌شود.</p>
        <p>مهمان‌لیست رویداد عمومی است تا بدانی با چه کسانی جمع می‌شوی. وضعیت بلیت و ورود فقط بعد از ورود به حساب دیده می‌شود.</p>
        <p>دورهم جمعه و مکان واقعی است، نه سوایپ و نه گرید دوستیابی.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
