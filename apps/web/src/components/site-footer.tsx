import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <p className="footer-line">دورهم محصول جامعه است، نه کازینوی سوایپ. اول استانبول.</p>
      <p>
        <Link href="/register">عضویت</Link>
        {" · "}
        <Link href="/feed">فید شهر</Link>
        {" · "}
        <Link href="/safety">امنیت</Link>
        {" · "}
        <Link href="/privacy">حریم خصوصی</Link>
        {" · "}
        <Link href="/terms">قوانین</Link>
      </p>
    </footer>
  );
}
