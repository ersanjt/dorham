import { Suspense } from "react";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { PageIntro } from "../../components/page-intro";
import { FeedPostCard } from "../../components/feed-post";
import type { FeedPost } from "@dorham/shared";
import { FeedCompose } from "./compose";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
  const posts = await loadFeed();
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker="خبر شهر" title="فید استانبول">
        <p className="muted">وسط هفته، پیشنهاد مکان، حرف بعد از دورهم. سوایپ نیست.</p>
      </PageIntro>
      <div className="form-card">
        <Suspense fallback={<p className="muted">در حال بارگذاری فرم…</p>}>
          <FeedCompose />
        </Suspense>
      </div>
      {posts.length === 0 ? (
        <p className="muted">هنوز پستی نیست. API را روشن کن یا اولین یادداشت را بنویس.</p>
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
