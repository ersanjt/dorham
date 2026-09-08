"use client";

import { useState } from "react";

type Screen =
  | "city"
  | "events"
  | "event"
  | "feed"
  | "venues"
  | "login"
  | "account"
  | "web";

type Skin = "copper" | "legacy" | "night";

const SCREENS: { id: Screen; label: string }[] = [
  { id: "city", label: "موبایل · شهر" },
  { id: "events", label: "موبایل · رویدادها" },
  { id: "event", label: "موبایل · جزئیات رویداد" },
  { id: "feed", label: "موبایل · فید" },
  { id: "venues", label: "موبایل · مکان‌ها" },
  { id: "login", label: "موبایل · ورود" },
  { id: "account", label: "موبایل · حساب" },
  { id: "web", label: "وب · خانه" },
];

const SKINS: { id: Skin; label: string; note: string }[] = [
  { id: "copper", label: "مس و انار", note: "قفل محصول — غلیظ‌تر" },
  { id: "legacy", label: "کاغذ قبلی", note: "کم‌کنتراست، شبیه وایرفریم" },
  { id: "night", label: "شب استانبول", note: "فقط مقایسه؛ صفحهٔ اول شهر نیست" },
];

export default function DesignStudioPage() {
  const [screen, setScreen] = useState<Screen>("city");
  const [skin, setSkin] = useState<Skin>("copper");

  return (
    <div className="studio" data-skin={skin === "copper" ? undefined : skin}>
      <aside className="studio-rail">
        <p className="studio-kicker">قفل طراحی</p>
        <h1>دورهم</h1>
        <p className="muted">
          جامعه برای ایرانی‌های استانبول. صفحهٔ اول شهر است، نه کارت. دیتینگ تب بعدی است و در v1 ساخته نمی‌شود.
        </p>
        <div className="studio-skins">
          {SKINS.map((item) => (
            <button
              key={item.id}
              className={skin === item.id ? "on" : ""}
              type="button"
              onClick={() => setSkin(item.id)}
            >
              {item.label}
              <small>{item.note}</small>
            </button>
          ))}
        </div>
        <div className="studio-swatches">
          <span className="swatch-ink" title="ink" />
          <span className="swatch-paper" title="paper" />
          <span className="swatch-clay" title="clay" />
          <span className="swatch-cream" title="cream" />
          <span className="swatch-saffron" title="saffron" />
        </div>
        <p className="muted studio-meta">
          مرکزی برای عنوان · وزیرمتن برای بدنه · Fraunces برای Dorham · RTL · شعاع ۱۸ · زعفران فقط تأیید · بدون سایه
        </p>
        <nav className="studio-nav">
          {SCREENS.map((item) => (
            <button
              key={item.id}
              className={screen === item.id ? "on" : ""}
              type="button"
              onClick={() => setScreen(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <ul className="studio-rules">
          <li>یک ظاهر برای iOS و Android</li>
          <li>وب همان زبان، عرض بیشتر</li>
          <li>تأییدشده زعفرانی است، ایمیل نه</li>
          <li>Boost / Super Like / گرید آشنا ممنوع</li>
        </ul>
      </aside>

      <main className="studio-stage">
        {screen === "web" ? (
          <WebHome onOpen={(next) => setScreen(next)} />
        ) : (
          <div className="phone">
            <div className="phone-notch" />
            <div className="phone-body">
              {screen === "city" ? <CityPhone go={setScreen} /> : null}
              {screen === "events" ? <EventsPhone go={setScreen} /> : null}
              {screen === "event" ? <EventPhone go={setScreen} /> : null}
              {screen === "feed" ? <FeedPhone go={setScreen} /> : null}
              {screen === "venues" ? <VenuesPhone go={setScreen} /> : null}
              {screen === "login" ? <LoginPhone go={setScreen} /> : null}
              {screen === "account" ? <AccountPhone go={setScreen} /> : null}
            </div>
            <TabBar screen={screen} go={setScreen} />
          </div>
        )}
      </main>
    </div>
  );
}

function TabBar({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const tabs: { id: Screen; label: string }[] = [
    { id: "city", label: "شهر" },
    { id: "events", label: "رویداد" },
    { id: "feed", label: "فید" },
    { id: "venues", label: "مکان" },
    { id: "account", label: "من" },
  ];
  return (
    <div className="phone-tabs">
      {tabs.map((tab) => (
        <button key={tab.id} className={screen === tab.id ? "on" : ""} type="button" onClick={() => go(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function CityPhone({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="phone-scroll">
      <p className="kicker">استانبول · این هفته</p>
      <p className="brand-line">Dorham</p>
      <h2>دورهم، توی همین شهر</h2>
      <p className="muted">برای ایرانی‌های ترکیه. اول استانبول. جمعه دور هم — نه سوایپ.</p>
      <div className="chip-row">
        <button className="pill solid" type="button" onClick={() => go("events")}>
          رویداد بعدی
        </button>
        <button className="pill" type="button" onClick={() => go("feed")}>
          فید شهر
        </button>
        <button className="pill" type="button" onClick={() => go("venues")}>
          مکان‌ها
        </button>
      </div>
      <h3>حرف‌های این هفته</h3>
      <article className="mini-card" onClick={() => go("feed")}>
        <div className="card-top">
          <span className="muted">دورهم استانبول</span>
          <span className="verify-badge">تأییدشده</span>
        </div>
        <p>وسط هفته اکسره هنوز خیابان ایرانی این شهر است.</p>
      </article>
      <h3>این هفته در استانبول</h3>
      <article className="mini-card" onClick={() => go("event")}>
        <div className="card-top">
          <span className="date-chip">جمعه ۲۲</span>
          <span className="muted">کادیکوی</span>
        </div>
        <p className="strong">جمعه دورهم — کافه در کادیکوی</p>
        <p className="muted">چای، معرفی کوتاه، ۲۴ نفر ظرفیت</p>
        <div className="capacity" aria-hidden>
          <i style={{ width: "38%" }} />
        </div>
      </article>
    </div>
  );
}

function EventsPhone({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="phone-scroll">
      <p className="kicker">صفحهٔ اول دورهم</p>
      <h2>رویدادهای استانبول</h2>
      <p className="muted">بهانهٔ حضوری. مهمان‌لیست واقعی.</p>
      <article className="mini-card" onClick={() => go("event")}>
        <div className="card-top">
          <span className="date-chip">جمعه ۲۲ · ۱۹:۰۰</span>
          <span className="verify-badge">میزبان تأییدشده</span>
        </div>
        <p className="strong">جمعه دورهم — کافه در کادیکوی</p>
        <p className="muted">Kadıköy · ۹ از ۲۴ نفر</p>
        <p>چای، معرفی کوتاه، بدون سوایپ. فقط آدم‌های واقعی.</p>
        <div className="capacity" aria-hidden>
          <i style={{ width: "38%" }} />
        </div>
      </article>
      <article className="mini-card">
        <div className="card-top">
          <span className="date-chip">یکشنبه</span>
          <span className="muted">آکسارای</span>
        </div>
        <p className="strong">ناهار جمع ایرانی</p>
        <p className="muted">لیست انتظار · ظرفیت پر</p>
        <div className="capacity" aria-hidden>
          <i style={{ width: "100%" }} />
        </div>
      </article>
    </div>
  );
}

function EventPhone({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="phone-scroll">
      <button className="text-link" type="button" onClick={() => go("events")}>
        بازگشت به رویدادها
      </button>
      <p className="kicker">Kadıköy · جمعه ۲۲ شهریور</p>
      <h2>جمعه دورهم — کافه در کادیکوی</h2>
      <p className="muted">میزبان: دورهم استانبول</p>
      <p>اولین دورهم رسمی. چای، معرفی کوتاه، بدون سوایپ.</p>
      <article className="mini-card">
        <p className="strong">۹ نفر می‌آیند</p>
        <p className="muted">۲۴ ظرفیت · هنوز جا هست</p>
        <div className="capacity" aria-hidden>
          <i style={{ width: "38%" }} />
        </div>
      </article>
      <button className="pill solid wide" type="button" onClick={() => go("login")}>
        می‌آیم
      </button>
    </div>
  );
}

function FeedPhone({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="phone-scroll">
      <p className="kicker">خبر شهر</p>
      <h2>فید استانبول</h2>
      <p className="muted">وسط هفته. سوایپ نیست.</p>
      <textarea className="studio-input" defaultValue="" placeholder="برای استانبول بنویس…" readOnly />
      <button className="pill solid wide" type="button" onClick={() => go("login")}>
        انتشار
      </button>
      <article className="mini-card">
        <div className="card-top">
          <span className="muted">دورهم استانبول</span>
          <span className="verify-badge">تأییدشده</span>
        </div>
        <p>جمعه کادیکوی دور هم می‌شویم. اگر تازه‌واردی، بیا.</p>
        <p className="muted">۳ نظر</p>
      </article>
      <article className="mini-card" onClick={() => go("venues")}>
        <div className="card-top">
          <span className="muted">میزبان کادیکوی</span>
          <span className="verify-badge">تأییدشده</span>
        </div>
        <p>شیراز کادیکوی برای ناهار یکشنبه جا دارد اگر زود برسی.</p>
        <p className="muted">۰ نظر</p>
      </article>
    </div>
  );
}

function VenuesPhone({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="phone-scroll">
      <p className="kicker">نقشهٔ خوردنی</p>
      <h2>مکان‌های ایرانی</h2>
      <p className="muted">آدرس واقعی، لینک گوگل‌مپ.</p>
      <article className="mini-card" onClick={() => go("city")}>
        <p className="muted">رستوران · آکسارای</p>
        <p className="strong">رستوران سفیر — آکسارای</p>
        <p className="muted">Namık Kemal Cad. No:23, Fatih</p>
      </article>
      <article className="mini-card">
        <p className="muted">رستوران · کادیکوی</p>
        <p className="strong">شیراز کادیکوی</p>
        <p className="muted">Moda Caddesi، نزدیک اسکله</p>
      </article>
    </div>
  );
}

function LoginPhone({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="phone-scroll">
      <button className="text-link" type="button" onClick={() => go("city")}>
        بازگشت
      </button>
      <p className="kicker">یک حساب</p>
      <h2>ورود</h2>
      <p className="muted">وب و اپ همان حساب را دارند.</p>
      <label>
        ایمیل
        <input className="studio-input" defaultValue="host@dorham.app" readOnly />
      </label>
      <label>
        رمز
        <input className="studio-input" type="password" defaultValue="xxxxxxxx" readOnly />
      </label>
      <button className="pill solid wide" type="button" onClick={() => go("account")}>
        ورود
      </button>
    </div>
  );
}

function AccountPhone({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="phone-scroll">
      <p className="kicker">پروفایل</p>
      <h2>حساب من</h2>
      <article className="mini-card">
        <p className="strong">دورهم استانبول</p>
        <p className="muted">ایمیل اینجا دیده نمی‌شود</p>
        <span className="verify-badge">تأییدشده</span>
      </article>
      <button className="pill wide" type="button" onClick={() => go("city")}>
        خروج
      </button>
    </div>
  );
}

function WebHome({ onOpen }: { onOpen: (s: Screen) => void }) {
  return (
    <div className="web-frame">
      <header className="web-nav">
      <strong>
        <span className="brand-latin">Dorham</span>
        <span className="brand-sep"> · </span>
        <span className="brand-fa">دورهم</span>
      </strong>
        <div>
          <button type="button" onClick={() => onOpen("events")}>
            رویدادها
          </button>
          <button type="button" onClick={() => onOpen("feed")}>
            فید شهر
          </button>
          <button type="button" onClick={() => onOpen("venues")}>
            مکان‌ها
          </button>
          <button className="pill" type="button" onClick={() => onOpen("login")}>
            ورود
          </button>
        </div>
      </header>
      <section className="web-hero">
        <p className="kicker">جامعهٔ ایرانی · استانبول</p>
        <h2>دورهم، توی همین شهر</h2>
        <p className="muted">برای ایرانی‌های ترکیه. اول استانبول. جمعه دور هم جمع می‌شویم — نه کارت سوایپ.</p>
        <div className="chip-row">
          <button className="pill solid" type="button" onClick={() => onOpen("events")}>
            رویداد بعدی
          </button>
          <button className="pill" type="button" onClick={() => onOpen("feed")}>
            فید شهر
          </button>
          <button className="pill" type="button" onClick={() => onOpen("venues")}>
            رستوران و کافه ایرانی
          </button>
        </div>
      </section>
      <section className="web-grid">
        <article className="mini-card">
          <h3>رویداد شهری</h3>
          <p className="muted">بهانهٔ حضوری. مهمان‌لیست واقعی.</p>
        </article>
        <article className="mini-card">
          <h3>آدم تأییدشده</h3>
          <p className="muted">عکس دست‌نویس. نشان زعفرانی.</p>
        </article>
        <article className="mini-card">
          <h3>دیتینگ بعداً</h3>
          <p className="muted">یک تب اختیاری. نه صفحهٔ اول.</p>
        </article>
      </section>
    </div>
  );
}
