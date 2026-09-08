import Link from "next/link";
import type { FeedPost } from "@dorham/shared";
import { formatWhen } from "../lib/format";

export function FeedPostCard({ post }: { post: FeedPost }) {
  return (
    <article className="card">
      <p className="meta">
        <Link className="author-name" href={`/people/${post.author.id}`}>
          {post.author.displayName}
        </Link>
        {post.author.verificationStatus === "VERIFIED" ? (
          <>
            {" "}
            <span className="verify-badge">تأییدشده</span>
          </>
        ) : null}
        {" · "}
        {formatWhen(post.createdAt)}
      </p>
      <p className="post-body">{post.body}</p>
      <p className="meta">
        {post.venueSlug ? (
          <Link href={`/venues/${post.venueSlug}`}>مکان</Link>
        ) : null}
        {post.venueSlug && post.eventId ? " · " : null}
        {post.eventId ? <Link href={`/events/${post.eventId}`}>رویداد</Link> : null}
        {post.venueSlug || post.eventId ? " · " : null}
        {post.commentCount} نظر
      </p>
      <Link className="card-cta" href={`/feed/${post.id}`}>
        خواندن و نظر
      </Link>
    </article>
  );
}
