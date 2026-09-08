import { AppText, Card, Screen } from "../components/ui";

export default function SafetyScreen() {
  return (
    <Screen back kicker="اعتماد شهر" title="امنیت و قواعد" subtitle="این متن برای بررسی استور و برای مهمان جمعه یکی است.">
      <Card>
        <AppText bold>سن و هویت</AppText>
        <AppText>۱۸ سال به بالا. یک حساب برای هر نفر. بدون عکس هوش مصنوعی به‌عنوان چهره.</AppText>
      </Card>
      <Card>
        <AppText bold>چه چیزی نشان داده نمی‌شود</AppText>
        <AppText>ایمیل، تلفن، موقعیت دقیق و عکس تأیید هویت به بقیه نشان داده نمی‌شود.</AppText>
      </Card>
      <Card>
        <AppText bold>گزارش و توقف</AppText>
        <AppText>گزارش و بلاک در رویداد هست. حساب را از «من» می‌توانی متوقف یا حذف کنی. حذف واقعی است.</AppText>
      </Card>
      <Card>
        <AppText bold>چه محصولی نیست</AppText>
        <AppText muted>دورهم جمعه و مکان واقعی است. سوایپ، بوست، لایک پولی و گرید دوستیابی ندارد.</AppText>
      </Card>
    </Screen>
  );
}
