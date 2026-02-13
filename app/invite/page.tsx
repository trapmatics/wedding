"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "wedding_invite_ok";

// Change this any time (or we can move it to backend later)
const INVITE_CODE = "ALEKS-RICARDO-2027";

export default function InvitePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
  const ok = localStorage.getItem("wedding_invite_ok");
  if (ok !== "true") window.location.href = "/invite";
}, []);

  useEffect(() => {
    const ok = localStorage.getItem(STORAGE_KEY);
    if (ok === "true") window.location.href = "/";
  }, []);

  function submit() {
    if (code.trim().toUpperCase() === INVITE_CODE) {
      localStorage.setItem(STORAGE_KEY, "true");
      window.location.href = "/";
      return;
    }
    setError("Incorrect invite code. Please check your invite.");
  }

  return (
    <main style={{ maxWidth: 520, margin: "60px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1>Aleks & Ricardo</h1>
      <p>Enter your invite code to access the wedding app.</p>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Invite code"
        style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
      />

      <button onClick={submit} style={{ marginTop: 12, padding: "10px 14px" }}>
        Continue
      </button>

      {error && <p style={{ color: "crimson", marginTop: 10 }}>{error}</p>}
    </main>
  );
}
