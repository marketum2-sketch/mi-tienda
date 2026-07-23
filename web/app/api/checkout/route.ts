import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { productId, discordUserId, discordTag, email } = await req.json();

  if (!productId || !discordUserId || !discordTag || !email) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
  }

  const order = await prisma.order.create({
    data: {
      productId: product.id,
      discordUserId,
      discordTag,
      email,
      priceUsd: product.priceUsd,
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
      price_amount: product.priceUsd,
      price_currency: "usd",
      order_id: order.id,
      order_description: product.name,
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
    productName: product.name,
    priceUsd: product.priceUsd,
    invoiceUrl: invoice.invoice_url,
  }).catch((err) => console.error("Fallo el envio de email:", err));

  return NextResponse.json({ orderId: order.id, invoiceUrl: invoice.invoice_url });
}
