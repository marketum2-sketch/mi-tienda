import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { capturePaypalOrder } from "@/lib/paypal";
import { sendOrderEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { paypalOrderId } = await req.json();
  if (!paypalOrderId) {
    return NextResponse.json({ error: "Falta el ID de PayPal" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { paymentId: paypalOrderId },
    include: { product: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const capture = await capturePaypalOrder(paypalOrderId);

  if (capture.status !== "COMPLETED") {
    return NextResponse.json({ error: "El pago no se pudo confirmar" }, { status: 400 });
  }

  if (order.status === "PENDING") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() } });

    sendOrderEmail({
      to: order.email,
      orderId: order.id,
      productName: `${order.product.name}${order.quantity > 1 ? ` x${order.quantity}` : ""}`,
      priceUsd: order.priceUsd,
      invoiceUrl: `${process.env.PUBLIC_URL}/pedido/${order.id}`,
    }).catch((err) => console.error("Fallo el envio de email:", err));

    fetch(`${process.env.BOT_INTERNAL_URL}/internal/order-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": process.env.INTERNAL_SECRET! },
      body: JSON.stringify({ orderId: order.id }),
    }).catch((err) => console.error("No se pudo avisar al bot:", err));
  }

  return NextResponse.json({ ok: true, orderId: order.id });
}
