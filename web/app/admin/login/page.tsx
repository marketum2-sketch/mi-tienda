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
    <main
      className="container"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 380 }}
    >
      <div className="zone-frame" style={{ display: "inline-block", padding: "4px 2px", marginBottom: 8 }}>
        <span className="zc-tr" />
        <span className="zc-bl" />
        <div className="eyebrow">Acceso restringido</div>
      </div>
      <h1 style={{ fontSize: 26, marginBottom: 24 }}>Panel de ZoneSell</h1>
      <form onSubmit={handleSubmit} className="card">
        <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--muted)" }}>Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          style={{
            width: "100%",
            background: "var(--bg)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "11px 14px",
            color: "var(--text)",
            fontFamily: "inherit",
            fontSize: 15,
          }}
        />
        {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>{error}</p>}
        <button className="btn btn-accent" type="submit" disabled={loading} style={{ marginTop: 18, width: "100%" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
