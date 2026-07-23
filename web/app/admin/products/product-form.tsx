"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductFormData = {
  id?: string;
  name: string;
  description: string;
  priceUsd: number | string;
  deliveryContent: string;
  stock: number | string | null;
  active: boolean;
};

export default function ProductForm({ initial }: { initial?: ProductFormData }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<ProductFormData>(
    initial ?? { name: "", description: "", priceUsd: "", deliveryContent: "", stock: "", active: true }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      setError("No se pudo guardar");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={labelStyle}>Nombre</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Descripcion (se ve en el catalogo)</label>
        <textarea
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Precio USD</label>
          <input
            required
            type="number"
            step="0.01"
            value={form.priceUsd}
            onChange={(e) => setForm({ ...form, priceUsd: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Stock (vacio = ilimitado)</label>
          <input
            type="number"
            value={form.stock ?? ""}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Contenido a entregar (key, link, texto, instrucciones...)</label>
        <textarea
          required
          value={form.deliveryContent}
          onChange={(e) => setForm({ ...form, deliveryContent: e.target.value })}
          style={{ ...inputStyle, minHeight: 100, resize: "vertical", fontFamily: "monospace" }}
        />
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          Esto se le manda tal cual al comprador (en el ticket y por DM) apenas se confirma el pago.
        </p>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        Visible en la tienda
      </label>

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, marginBottom: 4 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--line)",
  borderRadius: 4,
  padding: "10px 12px",
  color: "var(--text)",
  fontFamily: "inherit",
};
