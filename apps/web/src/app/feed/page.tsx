import { Suspense } from "react";
import Link from "next/link";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { PageIntro } from "../../components/page-intro";
import { FeedPostCard } from "../../components/feed-post";
import type { FeedPost } from "@dorham/shared";
import { resolveApiBase } from "../../lib/api-base";
import { t } from "../../lib/copy";
import { getLocale } from "../../lib/locale-server";
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
  const locale = await getLocale();
  const copy = t(locale);
  const posts = (await loadFeed()).filter((post) => post.body.trim().length >= 20);
  return (
    <main className="wrap">
      <SiteHeader />
      <PageIntro kicker={copy.feed.kicker} title={copy.feed.title}>
        <p className="muted">{copy.feed.lead}</p>
      </PageIntro>
      <div className="form-card">
        <Suspense fallback={<p className="muted">{copy.feed.loading}</p>}>
          <FeedCompose />
        </Suspense>
      </div>
      {posts.length === 0 ? (
        <div className="feed-empty card">
          <p className="muted">{copy.feed.empty}</p>
          <div className="feed-prompt-row">
            <Link className="pill solid" href="/venues">
              {copy.feed.suggest}
            </Link>
            <Link className="pill" href="/events">
              {copy.feed.afterEvent}
            </Link>
            <Link className="pill" href="/account?tab=trust">
              {copy.feed.verifyFirst}
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
