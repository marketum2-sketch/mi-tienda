"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PaypalButton from "./paypal-button";

type Props = {
  productId: string;
  productName: string;
  priceUsd: number;
  minOrderUsd: number;
  disabled?: boolean;
};

export default function CheckoutForm({ productId, productName, priceUsd, disabled }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "summary">("info");
  const [quantity, setQuantity] = useState(1);
  const [discordUserId, setDiscordUserId] = useState("");
  const [discordTag, setDiscordTag] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = Math.round(priceUsd * quantity * 100) / 100;

  async function handleCreateOrder(): Promise<string> {
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, discordUserId, discordTag, email, quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago");
    return data.paypalOrderId;
  }

  function handleSuccess(orderId: string) {
    router.push(`/pedido/${orderId}?status=ok`);
  }

  if (disabled) {
    return (
      <button className="btn" disabled style={{ width: "100%" }}>
        Agotado
      </button>
    );
  }

  if (step === "info") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStep("summary");
        }}
      >
        <label style={labelStyle}>Cantidad</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: 36, height: 36, padding: 0 }}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span style={{ minWidth: 24, textAlign: "center" }}>{quantity}</span>
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: 36, height: 36, padding: 0 }}
            onClick={() => setQuantity((q) => q + 1)}
          >
            +
          </button>
          <span className="price" style={{ marginLeft: "auto" }}>${total.toFixed(2)}</span>
        </div>

        <label style={{ ...labelStyle, marginTop: 12 }}>Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 12 }}>Tu ID de Discord</label>
        <input
          required
          value={discordUserId}
          onChange={(e) => setDiscordUserId(e.target.value)}
          placeholder="ej. 123456789012345678"
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 12 }}>Tu usuario de Discord</label>
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

        <button className="btn" type="submit" style={{ marginTop: 16, width: "100%" }}>
          Continuar →
        </button>
      </form>
    );
  }

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Resumen del pedido</div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
        <span>{productName} {quantity > 1 ? `x${quantity}` : ""}</span>
        <span className="price">${total.toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, color: "var(--muted)" }}>
        <span>Se enviara a</span>
        <span>{email}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 700 }}>
        <span>Total</span>
        <span className="price">${total.toFixed(2)}</span>
      </div>

      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--muted)", margin: "12px 0 16px" }}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />
        Confirmo que mis datos de Discord son correctos, ahi se entrega el producto.
      </label>

      {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{error}</p>}

      {agreed ? (
        <PaypalButton onCreateOrder={handleCreateOrder} onSuccess={handleSuccess} onError={setError} />
      ) : (
        <button className="btn" disabled style={{ width: "100%" }}>
          Confirma los datos para pagar
        </button>
      )}

      <button
        className="btn btn-outline"
        onClick={() => setStep("info")}
        type="button"
        style={{ marginTop: 8, width: "100%" }}
      >
        Volver
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, marginBottom: 4, color: "var(--muted)" };
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "var(--text)",
  fontFamily: "inherit",
};
