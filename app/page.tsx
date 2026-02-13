"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl } from "aws-amplify/storage";
import { Schema } from "../amplify/data/resource";
import { isAdminUser } from "./lib/isAdmin";

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

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [posting, setPosting] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  // invite gate
  useEffect(() => {
    const ok = localStorage.getItem("wedding_invite_ok");
    if (ok !== "true") window.location.href = "/invite";
  }, []);

  // admin check
  useEffect(() => {
    (async () => setIsAdmin(await isAdminUser()))();
  }, []);

  // profile gate
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

  // preview image
  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function loadPosts() {
    const { data } = await client.models.Post.list();

    const postsWithUrls = await Promise.all(
      (data ?? []).map(async (post) => {
        if (!post.photoKeys?.length) return post;

        const urls = await Promise.all(
          post.photoKeys.map(async (key: string) => {
            const { url } = await getUrl({
              key,
              options: { accessLevel: "protected" },
            });

            return url.toString();
          })
        );

        return { ...post, photoUrls: urls };
      })
    );

    // pinned first, then newest first
    postsWithUrls.sort((a: any, b: any) => {
      const ap = a.isPinned ? 1 : 0;
      const bp = b.isPinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });

    setPosts(postsWithUrls);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function createPost() {
    if (!displayName) return;
    if (!content.trim() && !file) return;

    setPosting(true);

    let photoKey: string | null = null;
    if (file) {
      const key = (rawKey: string) =>
  rawKey.startsWith("protected/") ? rawKey.replace(/^protected\//, "") : rawKey;

const urls = await Promise.all(
  post.photoKeys.map(async (k: string) => {
    const { url } = await getUrl({
      key: key(k),
      options: { accessLevel: "protected" },
    });
    return url.toString();
  })
);


      await uploadData({
        key,
        data: file,
        options: { accessLevel: "protected" },
});

    }

    await client.models.Post.create({
      content: content.trim(),
      createdAt: new Date().toISOString(),
      authorName: displayName,
      photoKeys: photoKey ? [photoKey] : [],
      isPinned: isAdmin ? isAnnouncement : false,
    });

    setContent("");
    setFile(null);
    setPreviewUrl("");
    setIsAnnouncement(false);

    await loadPosts();
    setPosting(false);
  }

  async function deletePost(id: string) {
    await client.models.Post.delete({ id });
    await loadPosts();
  }

  async function togglePin(post: any) {
    await client.models.Post.update({
      id: post.id,
      isPinned: !post.isPinned,
    });
    await loadPosts();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        paddingBottom: 60,
        // full-app background image w/ dark overlay so text stays readable
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)),
          url('/background.jpg')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "sans-serif",
            color: "#0a0a0a",
          }}
        >
          <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>
            Aleks & Ricardo
          </div>
          <nav style={{ display: "flex", gap: 14 }}>
            <a
              href="/"
              style={{
                textDecoration: "none",
                color: "#0a0a0a",
                fontWeight: 800,
              }}
            >
              Feed
            </a>
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
          </nav>
        </div>
      </header>

      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "18px 16px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Composer */}
        <section
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: 18,
            padding: 14,
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            color: "#0a0a0a", // ✅ dark readable text
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "#111",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
              }}
            >
              A&R
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                Posting as <span style={{ fontWeight: 900 }}>{displayName || "…"}</span>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share a moment…"
                style={{
                  width: "100%",
                  border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 12,
                  padding: 12,
                  minHeight: 90,
                  resize: "vertical",
                  outline: "none",
                  color: "#0a0a0a",
                  background: "rgba(255,255,255,0.95)",
                }}
              />

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{
                    marginTop: 10,
                    width: "100%",
                    maxHeight: 420,
                    objectFit: "cover",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.12)",
                  }}
                />
              )}

              {isAdmin && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 10,
                    fontWeight: 800,
                    color: "#0a0a0a",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAnnouncement}
                    onChange={(e) => setIsAnnouncement(e.target.checked)}
                  />
                  Mark as Announcement (pin to top)
                </label>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 12,
                  alignItems: "center",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  style={{ color: "#0a0a0a" }}
                />

                <button
                  onClick={createPost}
                  disabled={posting}
                  style={{
                    marginLeft: "auto",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: posting ? "#777" : "#111",
                    color: "white",
                    fontWeight: 900,
                    cursor: posting ? "not-allowed" : "pointer",
                  }}
                >
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Feed */}
        <section style={{ marginTop: 18, display: "grid", gap: 16 }}>
          {posts.map((post) => (
            <article
              key={post.id}
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                color: "#0a0a0a", // ✅ makes EVERYTHING readable
              }}
            >
              {/* header */}
              <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.06)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    color: "#111",
                  }}
                >
                  🙂
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, display: "flex", gap: 8, alignItems: "center" }}>
                    {post.authorName}
                    {post.isPinned ? (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: "rgba(0,0,0,0.08)",
                        }}
                      >
                        PINNED
                      </span>
                    ) : null}
                  </div>

                  <div style={{ fontSize: 12, color: "#444", fontWeight: 700 }}>
                    {formatTime(post.createdAt)}
                  </div>
                </div>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => togglePin(post)}
                      style={{
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "rgba(255,255,255,0.9)",
                        borderRadius: 10,
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontWeight: 900,
                        color: "#111",
                      }}
                    >
                      {post.isPinned ? "Unpin" : "Pin"}
                    </button>

                    <button
                      onClick={() => deletePost(post.id)}
                      style={{
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "rgba(255,255,255,0.9)",
                        borderRadius: 10,
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontWeight: 900,
                        color: "#111",
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* image */}
              {post.photoUrls?.length ? (
                <img
                  src={post.photoUrls[0]}
                  alt=""
                  style={{
                    width: "100%",
                    maxHeight: 520,
                    objectFit: "cover",
                    background: "#eee",
                  }}
                />
              ) : null}

              {/* content */}
              {(post.content ?? "").length > 0 && (
                <div style={{ padding: 12, whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.35 }}>
                  <span style={{ fontWeight: 900, marginRight: 6 }}>{post.authorName}</span>
                  <span style={{ color: "#111", fontWeight: 700 }}>{post.content}</span>
                </div>
              )}

              {/* actions */}
              <div style={{ padding: "0 12px 12px", display: "flex", gap: 12, alignItems: "center" }}>
                <a
                  href={`/post/${post.id}`}
                  style={{ textDecoration: "none", fontWeight: 900, color: "#111" }}
                >
                  View thread →
                </a>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#444", fontWeight: 700 }}>
                  Private wedding feed
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
