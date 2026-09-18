import { Suspense } from "react";
import Link from "next/link";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { PageIntro } from "../../components/page-intro";
import { FeedPostCard } from "../../components/feed-post";
import type { FeedPost } from "@dorham/shared";
import { resolveApiBase } from "../../lib/api-base";
import { FeedCompose } from "./compose";

const API = resolveApiBase();

async function loadFeed(): Promise<FeedPost[]> {
  try {
    const res = await fetch(`${API}/v1/feed?city=istanbul&limit=20`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: FeedPost[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function FeedPage() {
  const posts = (await loadFeed()).filter((post) => post.body.trim().length >= 20);
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="خبر شهر" title="فید استانبول">
        <p className="muted">
          پیشنهاد مکان، حرف بعد از دورهم، هماهنگی قبل از کنسرت. حداقل چند جملهٔ واقعی — سوایپ و اسپم جایی ندارد.
        </p>
      </PageIntro>
      <div className="form-card">
        <Suspense fallback={<p className="muted">در حال بارگذاری فرم…</p>}>
          <FeedCompose />
        </Suspense>
      </div>
      {posts.length === 0 ? (
        <div className="feed-empty card">
          <p className="muted">هنوز پستی نیست. فید برای حرف وسط هفته و بعد از دورهم است — نه سوایپ.</p>
          <div className="feed-prompt-row">
            <Link className="pill solid" href="/venues">
              پیشنهاد مکان ایرانی
            </Link>
            <Link className="pill" href="/events">
              بعد از رویداد بنویس
            </Link>
            <Link className="pill" href="/account?tab=trust">
              اول تأیید هویت
            </Link>
          </div>
        </div>
      ) : (
        <div className="stack">
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      <SiteFooter />
    </main>
  );
}
