"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

export default function GalleryPage() {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPhotos() {
    setLoading(true);

    const { data } = await client.models.Post.list();
    const keys = (data ?? [])
      .flatMap((p: any) => p.photoKeys ?? [])
      .filter(Boolean);

    const urls = await Promise.all(
      keys.map(async (key: string) => {
        const { url } = await getUrl({ key });
        return url.toString();
      })
    );

    setPhotoUrls(urls.reverse()); // newest-ish last → flip if you want
    setLoading(false);
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <h1>Aleks & Ricardo Feed</h1>
  <a href="/gallery" style={{ textDecoration: "underline" }}>Gallery</a>
</div>
</h1>
        <a href="/" style={{ textDecoration: "underline" }}>← Back to feed</a>
      </div>

      {loading && <p>Loading photos…</p>}

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {photoUrls.map((u) => (
          <img
            key={u}
            src={u}
            alt=""
            style={{
              width: "100%",
              height: 220,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #eee",
            }}
          />
        ))}
      </div>
    </main>
  );
}
