import Link from "next/link";
import type { FeedPost } from "@dorham/shared";
import { t } from "../lib/copy";
import { formatCount, formatWhen, verifyLabel } from "../lib/format";
import type { UiLocale } from "../lib/locale";

export function FeedPostCard({ post, locale = "fa" }: { post: FeedPost; locale?: UiLocale }) {
  const copy = t(locale).feed;
  return (
    <article className="card">
      <p className="meta">
        <Link className="author-name" href={`/people/${post.author.id}`}>
          {post.author.displayName}
        </Link>
        {post.author.verificationStatus === "VERIFIED" ? (
          <>
            {" "}
            <span className="verify-badge">{verifyLabel("VERIFIED", locale)}</span>
          </>
        ) : null}
        {" · "}
        {formatWhen(post.createdAt, locale)}
      </p>
      <p className="post-body">{post.body}</p>
      <p className="meta">
        {post.venueSlug ? <Link href={`/venues/${post.venueSlug}`}>{copy.place}</Link> : null}
        {post.venueSlug && post.eventId ? " · " : null}
        {post.eventId ? <Link href={`/events/${post.eventId}`}>{copy.event}</Link> : null}
        {post.venueSlug || post.eventId ? " · " : null}
        {copy.comments(formatCount(post.commentCount, locale))}
      </p>
      <Link className="card-cta" href={`/feed/${post.id}`}>
        {copy.read}
      </Link>
    </article>
  );
}
