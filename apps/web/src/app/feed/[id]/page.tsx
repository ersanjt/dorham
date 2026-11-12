import Link from "next/link";
import { notFound } from "next/navigation";
import type { FeedComment, FeedPost } from "@dorham/shared";
import { PageIntro } from "../../../components/page-intro";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { formatWhen, verifyLabel } from "../../../lib/format";
import { resolveApiBase } from "../../../lib/api-base";
import { t } from "../../../lib/copy";
import { getLocale } from "../../../lib/locale-server";
import { PostActions } from "./actions";

const API = resolveApiBase();

async function loadPost(id: string): Promise<{ post: FeedPost; comments: FeedComment[] } | null> {
  try {
    const [postRes, commentsRes] = await Promise.all([
      fetch(`${API}/v1/feed/${id}`, { cache: "no-store" }),
      fetch(`${API}/v1/feed/${id}/comments`, { cache: "no-store" }),
    ]);
    if (!postRes.ok) return null;
    const postJson = (await postRes.json()) as { data: FeedPost };
    const commentsJson = commentsRes.ok ? ((await commentsRes.json()) as { data: FeedComment[] }) : { data: [] };
    return { post: postJson.data, comments: commentsJson.data ?? [] };
  } catch {
    return null;
  }
}

export default async function FeedPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const copy = t(locale).feed;
  const loaded = await loadPost(id);
  if (!loaded) notFound();
  const { post, comments } = loaded;

  return (
    <main className="wrap">
      <SiteHeader />
      <p>
        <Link className="card-cta" href="/feed">
          {copy.back}
        </Link>
      </p>
      <PageIntro kicker={copy.kicker} title={post.author.displayName}>
        <p className="muted">
          <Link href={`/people/${post.author.id}`}>{post.author.displayName}</Link>
          {post.author.verificationStatus === "VERIFIED" ? (
            <>
              {" "}
              <span className="verify-badge">{verifyLabel("VERIFIED", locale)}</span>
            </>
          ) : null}{" "}
          {formatWhen(post.createdAt, locale)}
        </p>
      </PageIntro>
      <article className="card">
        <p className="post-body">{post.body}</p>
        <p className="muted">
          {post.venueSlug ? <Link href={`/venues/${post.venueSlug}`}>{copy.relatedPlace}</Link> : null}
          {post.venueSlug && post.eventId ? " · " : null}
          {post.eventId ? <Link href={`/events/${post.eventId}`}>{copy.event}</Link> : null}
        </p>
      </article>
      <PostActions postId={post.id} authorId={post.author.id} comments={comments} />
      <SiteFooter />
    </main>
  );
}
