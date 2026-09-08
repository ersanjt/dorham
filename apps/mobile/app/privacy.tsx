import { AppText, Card, Screen } from "../components/ui";

export default function PrivacyScreen() {
  return (
    <Screen
      back
      kicker="حریم"
      title="حریم خصوصی"
      subtitle="پیش‌نویس KVKK / GDPR برای لانچ عمومی. داده برای رویداد است، نه تبلیغات."
    >
      <Card>
        <AppText bold>چه چیزی ذخیره می‌شود</AppText>
        <AppText>نام نمایشی، ایمیل، شهر (استانبول)، معرفی، RSVP، و اگر بفرستی عکس پروفایل.</AppText>
      </Card>
      <Card>
        <AppText bold>چه چیزی به بقیه نمی‌رود</AppText>
        <AppText>ایمیل، تلفن و مختصات دقیق عمومی نیست. عکس تأیید دست‌نویس فقط برای صف میزبان است.</AppText>
      </Card>
      <Card>
        <AppText bold>ردیابی</AppText>
        <AppText>شناسه تبلیغاتی، ATT و فروش داده نداریم. نشست فقط روی همین دستگاه در Secure Store می‌ماند.</AppText>
      </Card>
      <Card>
        <AppText bold>حق تو</AppText>
        <AppText muted>توقف موقت یا حذف حساب از تب «من». حذف، نشست‌ها را باطل می‌کند.</AppText>
      </Card>
    </Screen>
  );
}
