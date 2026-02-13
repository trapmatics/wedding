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

  // 1) Invite gate
  useEffect(() => {
    const ok = localStorage.getItem("wedding_invite_ok");
    if (ok !== "true") window.location.href = "/invite";
  }, []);

  // 2) Load profile name (force /profile if missing)
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

  // 3) Admin check
  useEffect(() => {
    (async () => setIsAdmin(await isAdminUser()))();
  }, []);

  // 4) Local preview for image uploads
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
    const { data } = await client.models.Post.list({ limit: 200 });

    const postsWithUrls = await Promise.all(
      (data ?? []).map(async (post: any) => {
        if (!post.photoKeys?.length) return post;

        const urls = await Promise.all(
          post.photoKeys.map(async (key: string) => {
            const { url } = await getUrl({ key });
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
      const key = `photos/${Date.now()}-${file.name}`;
      await uploadData({ key, data: file });
      photoKey = key;
    }

    await client.models.Post.create({
      content: content.trim() || "(photo)",
      createdAt: new Date().toISOString(),
      authorName: displayName,
      photoKeys: photoKey ? [photoKey] : [],
      isAnnouncement: isAdmin ? isAnnouncement : false,
      isPinned: isAdmin ? isAnnouncement : false, // announcements auto-pin
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
      // optional: if you pin something manually, it’s not necessarily an announcement
      // isAnnouncement: post.isAnnouncement,
    });
    await loadPosts();
  }

  return (
    <main style={{ background: "#fafafa", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Top bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "white",
          borderBottom: "1px solid #eee",
          zIndex: 10,
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
          }}
        >
          <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>Aleks & Ricardo</div>
          <nav style={{ display: "flex", gap: 14 }}>
            <a href="/" style={{ textDecoration: "none", color: "#111", fontWeight: 600 }}>
              Feed
            </a>
            <a href="/gallery" style={{ textDecoration: "none", color: "#111", fontWeight: 600 }}>
              Gallery
            </a>
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "18px 16px", fontFamily: "sans-serif" }}>
        {/* Composer */}
        <section
          style={{
            background: "white",
            border: "1px solid #eee",
            borderRadius: 16,
            padding: 14,
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
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
                fontWeight: 800,
              }}
            >
              A&R
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>
                Posting as <span style={{ fontWeight: 800 }}>{displayName || "…"}</span>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share a moment…"
                style={{
                  width: "100%",
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  minHeight: 90,
                  resize: "vertical",
                  outline: "none",
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
                    border: "1px solid #eee",
                  }}
                />
              )}

              {/* admin announcement toggle */}
              {isAdmin && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  <input
                    type="checkbox"
                    checked={isAnnouncement}
                    onChange={(e) => setIsAnnouncement(e.target.checked)}
                  />
                  Mark as Announcement (pin to top)
                </label>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

                <button
                  onClick={createPost}
                  disabled={posting}
                  style={{
                    marginLeft: "auto",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: posting ? "#bbb" : "#111",
                    color: "white",
                    fontWeight: 700,
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
                background: post.isAnnouncement ? "#fffbe6" : "white",
                border: post.isAnnouncement ? "2px solid #111" : "1px solid #eee",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: post.isAnnouncement ? "0 8px 30px rgba(0,0,0,0.08)" : "0 2px 10px rgba(0,0,0,0.04)",
              }}
            >
              {/* header */}
              <div style={{ padding: 12 }}>
                {post.isAnnouncement && (
                  <div
                    style={{
                      background: "#111",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                      display: "inline-block",
                      marginBottom: 8,
                    }}
                  >
                    Announcement
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      background: "#f2f2f2",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      color: "#333",
                    }}
                  >
                    🙂
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{post.authorName}</div>
                    <div style={{ fontSize: 12, opacity: 0.65 }}>{formatTime(post.createdAt)}</div>
                  </div>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => togglePin(post)}
                        style={{
                          border: "1px solid #eee",
                          background: "white",
                          borderRadius: 10,
                          padding: "6px 10px",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        {post.isPinned ? "Unpin" : "Pin"}
                      </button>

                      <button
                        onClick={() => deletePost(post.id)}
                        style={{
                          border: "1px solid #eee",
                          background: "white",
                          borderRadius: 10,
                          padding: "6px 10px",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* image */}
              {post.photoUrls?.length ? (
                <img
                  src={post.photoUrls[0]}
                  alt=""
                  style={{ width: "100%", maxHeight: 520, objectFit: "cover", background: "#eee" }}
                />
              ) : null}

              {/* content */}
              {(post.content ?? "").length > 0 && (
                <div style={{ padding: 12, whiteSpace: "pre-wrap" }}>
                  <span style={{ fontWeight: 800, marginRight: 6 }}>{post.authorName}</span>
                  {post.content}
                </div>
              )}

              {/* actions */}
              <div style={{ padding: "0 12px 12px", display: "flex", gap: 12, alignItems: "center" }}>
                <a href={`/post/${post.id}`} style={{ textDecoration: "none", fontWeight: 800, color: "#111" }}>
                  View thread →
                </a>

                {post.isPinned && (
                  <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 6, fontWeight: 700 }}>📌 Pinned</span>
                )}

                <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.6 }}>Private wedding feed</span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
