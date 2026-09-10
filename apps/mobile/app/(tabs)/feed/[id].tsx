import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { FeedComment, FeedPost, Me } from "@dorham/shared";
import { AppText, AuthorMeta, Banner, Button, Card, Field, Loading, Screen } from "../../../components/ui";
import { api, ApiError } from "../../../lib/api";
import { formatWhen } from "../../../lib/format";
import { loginHref } from "../../../lib/paths";
import { isSignedIn } from "../../../lib/session";

export default function FeedPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api<FeedPost>(`/feed/${id}`, { auth: false }),
      api<FeedComment[]>(`/feed/${id}/comments`, { auth: false }),
    ])
      .then(([next, rows]) => {
        setPost(next);
        setComments(rows);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "پست خوانده نشد."));
    if (isSignedIn()) {
      api<Me>("/users/me")
        .then(setMe)
        .catch(() => setMe(null));
    }
  }, [id]);

  async function comment() {
    if (!isSignedIn()) {
      router.push(loginHref(`/feed/${id}`));
      return;
    }
    try {
      const row = await api<FeedComment>(`/feed/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setComments((rows) => [...rows, row]);
      setBody("");
      setNotice("نظر ثبت شد.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "نظر ثبت نشد.");
    }
  }

  function reportPost() {
    if (!isSignedIn()) {
      router.push(loginHref(`/feed/${id}`));
      return;
    }
    Alert.alert("گزارش پست", "این پست گزارش شود؟", [
      { text: "نه", style: "cancel" },
      {
        text: "گزارش",
        style: "destructive",
        onPress: () => {
          api(`/feed/${id}/report`, { method: "POST", body: JSON.stringify({ reason: "other" }) })
            .then(() => setNotice("گزارش ثبت شد."))
            .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "گزارش نشد."));
        },
      },
    ]);
  }

  function hidePost() {
    Alert.alert("برداشتن پست", "این پست از فید برداشته شود؟", [
      { text: "نه", style: "cancel" },
      {
        text: "بردار",
        style: "destructive",
        onPress: () => {
          api(`/feed/${id}`, { method: "DELETE" })
            .then(() => router.replace("/feed"))
            .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "حذف نشد."));
        },
      },
    ]);
  }

  if (!post && !error) {
    return (
      <Screen back title="فید">
        <Loading />
      </Screen>
    );
  }

  const canHide = me && post && (me.id === post.author.id || me.role === "MODERATOR" || me.role === "ADMIN");
  const canReport = me && post && me.id !== post.author.id;

  return (
    <Screen back kicker="خبر شهر" title="فید استانبول">
      <Banner text={error} />
      <Banner text={notice} tone="ok" />
      {post ? (
        <Card>
          <AuthorMeta
            name={post.author.displayName}
            verified={post.author.verificationStatus === "VERIFIED"}
            extra={formatWhen(post.createdAt)}
            onPress={() => router.push(`/people/${post.author.id}`)}
          />
          <AppText>{post.body}</AppText>
          {post.venueSlug ? (
            <Button label="مکان مرتبط" variant="ghost" onPress={() => router.push(`/venues/${post.venueSlug}`)} />
          ) : null}
          {post.eventId ? (
            <Button label="رویداد مرتبط" variant="ghost" onPress={() => router.push(`/events/${post.eventId}`)} />
          ) : null}
        </Card>
      ) : null}
      <AppText bold size="title">
        نظرها
      </AppText>
      {comments.length === 0 ? (
        <AppText muted>هنوز نظری نیست.</AppText>
      ) : (
        comments.map((row) => (
          <Card key={row.id}>
            <AuthorMeta
              name={row.author.displayName}
              extra={formatWhen(row.createdAt)}
              onPress={() => router.push(`/people/${row.author.id}`)}
            />
            <AppText>{row.body}</AppText>
          </Card>
        ))
      )}
      {isSignedIn() ? (
        <>
          <Field label="نظر" value={body} onChangeText={setBody} multiline />
          <Button label="ارسال نظر" onPress={comment} />
        </>
      ) : (
        <Button label="برای نظر وارد شو" variant="ghost" onPress={() => router.push(loginHref(`/feed/${id}`))} />
      )}
      {canReport ? <Button label="گزارش پست" variant="ghost" onPress={reportPost} /> : null}
      {canHide ? <Button label="برداشتن پست" variant="danger" onPress={hidePost} /> : null}
    </Screen>
  );
}
