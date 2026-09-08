import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export default function TermsPage() {
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="قواعد" title="قوانین">
        <p className="muted">جامعه برای آدم واقعی در ترکیه.</p>
      </PageIntro>
      <article className="card">
        <p>۱۸ سال به بالا. یک حساب. بدون اسکرپ، ربات، و آزار.</p>
        <p>دورهم محصول جامعه است برای ساکنان ترکیه. ایران بازار لانچ نیست.</p>
        <p>ورود به رویداد یعنی پذیرش مهمان‌لیست واقعی و نقد دم در، اگر قیمت داشته باشد.</p>
        <p>میزبان می‌تواند مهمان را دم در چک‌این کند. سوایپ، بوست و لایک پولی در این محصول نیست.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
