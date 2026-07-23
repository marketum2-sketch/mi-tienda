"use client";

import { useState } from "react";

export default function CheckoutForm({ productId }: { productId: string }) {
  const [discordUserId, setDiscordUserId] = useState("");
  const [discordTag, setDiscordTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, discordUserId, discordTag }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Error al crear el pago");
      return;
    }

    window.location.href = data.invoiceUrl;
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="eyebrow" style={{ marginBottom: 12 }}>DATOS PARA LA ENTREGA</div>

      <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Tu ID de Discord</label>
      <input
        required
        value={discordUserId}
        onChange={(e) => setDiscordUserId(e.target.value)}
        placeholder="ej. 123456789012345678"
        style={inputStyle}
      />

      <label style={{ display: "block", fontSize: 13, margin: "12px 0 4px" }}>Tu usuario de Discord</label>
      <input
        required
        value={discordTag}
        onChange={(e) => setDiscordTag(e.target.value)}
        placeholder="ej. usuario"
        style={inputStyle}
      />

      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
        Activa el modo desarrollador en Discord para copiar tu ID: Ajustes → Avanzado → Modo desarrollador.
      </p>

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

      <button className="btn" type="submit" disabled={loading} style={{ marginTop: 16, width: "100%" }}>
        {loading ? "Generando factura..." : "Pagar con crypto"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--line)",
  borderRadius: 4,
  padding: "10px 12px",
  color: "var(--text)",
  fontFamily: "inherit",
};
