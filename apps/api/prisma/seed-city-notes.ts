/**
 * Editorial city feed notes — real soft-launch guidance, not swipe bait.
 * Upserted by stable `marker` prefix so re-seed updates copy without dupes.
 */
export type SeedCityNote = {
  marker: string;
  body: string;
  venueSlug?: string;
};

export const ISTANBUL_CITY_NOTES: SeedCityNote[] = [
  {
    marker: "[دورهم · راهنما]",
    body: "[دورهم · راهنما] استانبول را از آکسارای شروع کن: رستوران و مارکت ایرانی دور میدان و نامق‌کمال جمع‌اند. در دورهم از «مکان‌ها» مکان واقعی را باز کن، برنامهٔ حضور بگذار، و برای جمعهٔ انجمن از RSVP استفاده کن — نه سوایپ.",
    venueSlug: "aksaray-mahalle",
  },
  {
    marker: "[دورهم · این هفته]",
    body: "[دورهم · این هفته] جمعهٔ انجمن هنوز منتشر نشده. تا میزبان یکی را روی صفحهٔ اول بگذارد، از صفحهٔ سفیر برنامهٔ حضور بگذار تا بقیه ببینند.",
    venueSlug: "safir-aksaray",
  },
  {
    marker: "[دورهم · تقویم شهر]",
    body: "[دورهم · تقویم شهر] کنسرت‌های عمومی (مثل Black Coffee یا عمرو دیاب) فقط برای هماهنگی دوستان‌اند. بلیط را از فروشندهٔ خارجی بخر؛ در دورهم «علاقه‌مندم» بزن تا بقیه ایرانی‌های شهر ببینند کی می‌رود.",
  },
];
