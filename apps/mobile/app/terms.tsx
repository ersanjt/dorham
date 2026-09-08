import { AppText, Card, Screen } from "../components/ui";

export default function TermsScreen() {
  return (
    <Screen back kicker="قواعد" title="قوانین" subtitle="جامعه برای آدم واقعی ساکن ترکیه.">
      <Card>
        <AppText bold>عضویت</AppText>
        <AppText>۱۸ سال به بالا. یک حساب. بدون اسکرپ، ربات، آزار، و هویت جعلی.</AppText>
      </Card>
      <Card>
        <AppText bold>بازار</AppText>
        <AppText>لانچ برای ساکنان ترکیه است. ایران بازار v1 نیست.</AppText>
      </Card>
      <Card>
        <AppText bold>رویداد</AppText>
        <AppText>RSVP یعنی پذیرش مهمان‌لیست واقعی و نقد دم در اگر قیمت داشته باشد.</AppText>
      </Card>
      <Card>
        <AppText bold>طبقه‌بندی استور</AppText>
        <AppText muted>Social Networking، نه Dating. سوییپ و پرداخت برای لایک در این محصول نیست.</AppText>
      </Card>
    </Screen>
  );
}
