"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadMe() {
    const { data } = await client.models.UserProfile.list({ limit: 1 });
    if (data?.[0]?.displayName) setDisplayName(data[0].displayName);
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function save() {
    if (!displayName.trim()) return;
    setSaving(true);

    const existing = await client.models.UserProfile.list({ limit: 1 });
    if (existing.data?.[0]?.id) {
      await client.models.UserProfile.update({
        id: existing.data[0].id,
        displayName: displayName.trim(),
      });
    } else {
      await client.models.UserProfile.create({
        displayName: displayName.trim(),
        createdAt: new Date().toISOString(),
      });
    }

    setSaving(false);
    window.location.href = "/";
  }

  return (
    <main style={{ maxWidth: 520, margin: "60px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Set your name</h1>
      <p>This is what other guests will see on your posts and comments.</p>

      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="e.g. Sarah + Mike"
        style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
      />

      <button
        onClick={save}
        disabled={saving}
        style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, border: "none", background: "#111", color: "white", fontWeight: 800 }}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </main>
  );
}
