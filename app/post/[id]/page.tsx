"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import { Schema } from "../../../amplify/data/resource";
import { isAdminUser } from "../../lib/isAdmin";

const client = generateClient<Schema>();

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PostThreadPage() {
  const params = useParams<{ id: string }>();
  const postId = params.id;

  const [post, setPost] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>("");

  async function load() {
    setLoading(true);

    const p = await client.models.Post.get({ id: postId });
    const postData = p.data;
    setPost(postData);

    // Load photo (first photo only)
    if (postData?.photoKeys?.length) {
      const { url } = await getUrl({ key: postData.photoKeys[0] });
      setPhotoUrl(url.toString());
    } else {
      setPhotoUrl("");
    }

    // Load comments
    const c = await client.models.Comment.list({
      filter: { postId: { eq: postId } },
      limit: 300,
    });

    setComments(
      (c.data ?? []).sort(
        (a, b) =>
          new Date(a.createdAt ?? "").getTime() -
          new Date(b.createdAt ?? "").getTime()
      )
    );

    setLoading(false);
  }

  useEffect(() => {
    (async () => setIsAdmin(await isAdminUser()))();
  }, []);

  useEffect(() => {
    (async () => {
      const me = await client.models.UserProfile.list({ limit: 1 });
      const name = me.data?.[0]?.displayName ?? "";
      if (!name) {
        window.location.href = "/profile";
        return;
      }
      setDisplayName(name);
    })();
  }, []);

  useEffect(() => {
    if (postId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function addComment() {
    if (!displayName) return;
    if (!comment.trim()) return;

    await client.models.Comment.create({
      postId,
      content: comment.trim(),
      createdAt: new Date().toISOString(),
      authorName: displayName,
    });

    setComment("");
    load();
  }

  async function deleteComment(id: string) {
    await client.models.Comment.delete({ id });
    load();
  }

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (!post) return <p style={{ padding: 16 }}>Post not found.</p>;

  return (
    <main
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)),
          url('/background.jpg')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        paddingBottom: 60,
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "sans-serif",
            color: "#0a0a0a",
          }}
        >
          <a
            href="/"
            style={{
              textDecoration: "none",
              color: "#0a0a0a",
              fontWeight: 800,
            }}
          >
            ← Feed
          </a>
          <div style={{ fontWeight: 900 }}>Thread</div>
          <a
            href="/gallery"
            style={{
              textDecoration: "none",
              color: "#0a0a0a",
              fontWeight: 800,
            }}
          >
            Gallery
          </a>
        </div>
      </header>

      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "18px 16px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.96)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            color: "#0a0a0a",
          }}
        >
          {/* Top: image */}
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              style={{
                width: "100%",
                maxHeight: 620,
                objectFit: "cover",
                background: "#eee",
              }}
            />
          ) : null}

          {/* Caption + meta */}
          <div
            style={{
              padding: 14,
              borderBottom: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "#f2f2f2",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  color: "#0a0a0a",
                }}
              >
                🙂
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, color: "#0a0a0a" }}>
                  {post.authorName}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {formatTime(post.createdAt)}
                </div>
              </div>
            </div>

            {(post.content ?? "").length > 0 && (
              <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
                <span style={{ fontWeight: 900, marginRight: 6 }}>
                  {post.authorName}
                </span>
                <span style={{ color: "#0a0a0a" }}>{post.content}</span>
              </div>
            )}
          </div>

          {/* Comments list */}
          <div style={{ padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Comments ({comments.length})
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      background: "#f2f2f2",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 900,
                      color: "#0a0a0a",
                      flexShrink: 0,
                    }}
                  >
                    🙂
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "baseline",
                      }}
                    >
                      <div style={{ fontWeight: 900, color: "#0a0a0a" }}>
                        {c.authorName}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {formatTime(c.createdAt)}
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          style={{
                            marginLeft: "auto",
                            border: "1px solid rgba(0,0,0,0.12)",
                            background: "#fff",
                            borderRadius: 10,
                            padding: "6px 10px",
                            cursor: "pointer",
                            fontWeight: 800,
                            color: "#0a0a0a",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: 4, whiteSpace: "pre-wrap", color: "#0a0a0a" }}>
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment composer */}
          <div
            style={{
              borderTop: "1px solid rgba(0,0,0,0.08)",
              padding: 12,
              display: "flex",
              gap: 10,
              background: "rgba(255,255,255,0.98)",
            }}
          >
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
                color: "#0a0a0a",
                background: "#fff",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") addComment();
              }}
            />
            <button
              onClick={addComment}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "none",
                background: "#111",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
