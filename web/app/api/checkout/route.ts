import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderEmail } from "@/lib/email";
import { MIN_ORDER_USD } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const { productId, discordUserId, discordTag, email, quantity } = await req.json();

  if (!productId || !discordUserId || !discordTag || !email) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
  }

  if (product.stock !== null && qty > product.stock) {
    return NextResponse.json({ error: "No hay stock suficiente" }, { status: 400 });
  }

  const total = Math.round(product.priceUsd * qty * 100) / 100;

  if (total < MIN_ORDER_USD) {
    return NextResponse.json(
      { error: `El monto minimo para pagar con crypto es $${MIN_ORDER_USD.toFixed(2)}. Aumenta la cantidad.` },
      { status: 400 }
    );
  }

  const order = await prisma.order.create({
    data: {
      productId: product.id,
      discordUserId,
      discordTag,
      email,
      quantity: qty,
      priceUsd: total,
      status: "PENDING",
    },
  });

  // Crear factura en NOWPayments (pago crypto)
  const npRes = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: {
      "x-api-key": process.env.NOWPAYMENTS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: total,
      price_currency: "usd",
      order_id: order.id,
      order_description: `${product.name} x${qty}`,
      ipn_callback_url: `${process.env.PUBLIC_URL}/api/webhooks/nowpayments`,
      success_url: `${process.env.PUBLIC_URL}/pedido/${order.id}?status=ok`,
      cancel_url: `${process.env.PUBLIC_URL}/pedido/${order.id}?status=cancelado`,
    }),
  });

  if (!npRes.ok) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "No se pudo crear la factura" }, { status: 502 });
  }

  const invoice = await npRes.json();

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentId: String(invoice.id) },
  });

  sendOrderEmail({
    to: email,
    orderId: order.id,
    productName: `${product.name}${qty > 1 ? ` x${qty}` : ""}`,
    priceUsd: total,
    invoiceUrl: invoice.invoice_url,
  }).catch((err) => console.error("Fallo el envio de email:", err));

  return NextResponse.json({ orderId: order.id, invoiceUrl: invoice.invoice_url });
}
