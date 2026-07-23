"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="container" style={{ paddingTop: 100, maxWidth: 360 }}>
      <div className="eyebrow">ACCESO RESTRINGIDO</div>
      <h1 style={{ fontSize: 28, marginTop: 8, marginBottom: 24 }}>Panel de admin</h1>
      <form onSubmit={handleSubmit} className="card">
        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            background: "var(--bg)",
            border: "1px solid var(--line)",
            borderRadius: 4,
            padding: "10px 12px",
            color: "var(--text)",
            fontFamily: "inherit",
          }}
        />
        {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>{error}</p>}
        <button className="btn" type="submit" disabled={loading} style={{ marginTop: 16, width: "100%" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
