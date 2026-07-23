const FROM = process.env.RESEND_FROM_EMAIL || "Tienda <onboarding@resend.dev>";

export async function sendOrderEmail(opts: {
  to: string;
  orderId: string;
  productName: string;
  priceUsd: number;
  invoiceUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY no configurada, se omite el envio de email.");
    return;
  }

  const shortId = opts.orderId.slice(-6).toUpperCase();

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Tu pedido #${shortId}</h2>
      <p>Producto: <strong>${opts.productName}</strong></p>
      <p>Total: <strong>$${opts.priceUsd.toFixed(2)} USD</strong></p>
      <p>
        <a href="${opts.invoiceUrl}" style="display:inline-block;background:#e920c9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
          Completar el pago
        </a>
      </p>
      <p style="color:#666;font-size:13px;">
        Guarda este numero de pedido: <strong>${shortId}</strong>. Podes usarlo en tu ticket de Discord
        con el comando <code>/estado ${shortId}</code> para consultar el estado de tu compra.
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: opts.to,
      subject: `Tu pedido #${shortId}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error("Error enviando email:", await res.text());
  }
}
