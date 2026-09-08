import Link from "next/link";
import { notFound } from "next/navigation";
import type { FeedComment, FeedPost } from "@dorham/shared";
import { PageIntro } from "../../../components/page-intro";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { formatWhen } from "../../../lib/format";
import { PostActions } from "./actions";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
  const loaded = await loadPost(id);
  if (!loaded) notFound();
  const { post, comments } = loaded;

  return (
    <main className="wrap">
      <SiteHeader />
      <p>
        <Link className="card-cta" href="/feed">
          بازگشت به فید استانبول
        </Link>
      </p>
      <PageIntro kicker="خبر شهر" title={post.author.displayName}>
        <p className="muted">
          <Link href={`/people/${post.author.id}`}>{post.author.displayName}</Link>
          {post.author.verificationStatus === "VERIFIED" ? (
            <>
              {" "}
              <span className="verify-badge">تأییدشده</span>
            </>
          ) : null}{" "}
          {formatWhen(post.createdAt)}
        </p>
      </PageIntro>
      <article className="card">
        <p className="post-body">{post.body}</p>
        <p className="muted">
          {post.venueSlug ? <Link href={`/venues/${post.venueSlug}`}>مکان مرتبط</Link> : null}
          {post.venueSlug && post.eventId ? " · " : null}
          {post.eventId ? <Link href={`/events/${post.eventId}`}>رویداد</Link> : null}
        </p>
      </article>
      <PostActions postId={post.id} authorId={post.author.id} comments={comments} />
      <SiteFooter />
    </main>
  );
}
