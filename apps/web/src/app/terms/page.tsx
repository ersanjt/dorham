import { PageIntro } from "../../components/page-intro";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export default function TermsPage() {
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="قواعد" title="قوانین استفاده">
        <p className="muted">جامعه برای آدم واقعی در ترکیه · آخرین به‌روزرسانی سپتامبر ۲۰۲۶</p>
      </PageIntro>
      <article className="card stack">
        <h2>عضویت</h2>
        <p>۱۸ سال به بالا. یک حساب برای هر نفر. ربات، اسکرپ، هویت جعلی و آزار ممنوع است.</p>

        <h2>جامعه، نه سوایپ</h2>
        <p>
          دورهم محصول جامعه برای ایرانی‌های ساکن ترکیه است (اول استانبول). صفحهٔ اول شهر و رویداد است.
          Boost، Super Like، لایک پولی و شبکهٔ سوایپ در این محصول نیست.
        </p>

        <h2>رویداد و بلیت</h2>
        <p>
          ثبت حضور یعنی پذیرش مهمان‌لیست واقعی. اگر رویداد قیمت داشته باشد، پرداخت فعلاً نقد دم در است مگر
          خلاف آن اعلام شود. میزبان می‌تواند ورود را با QR یا دستی ثبت کند.
        </p>

        <h2>مکان‌ها و فید</h2>
        <p>ثبت مکان پس از بررسی منتشر می‌شود. پست و نظر باید محترمانه باشد؛ گزارش‌ها بررسی می‌شود.</p>

        <h2>تعلیق</h2>
        <p>تیم می‌تواند حساب را برای نقض قواعد تعلیق یا حذف کند. تصمیم نهایی با میزبان/مدیر است.</p>

        <h2>تماس</h2>
        <p>
          <a href="mailto:hello@dorham.app">hello@dorham.app</a> ·{" "}
          <a href="/safety">صفحهٔ امنیت</a>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
