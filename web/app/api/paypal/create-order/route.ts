import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPaypalOrder } from "@/lib/paypal";

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

  const paypalOrder = await createPaypalOrder(total, order.id);

  if (!paypalOrder.id) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "No se pudo iniciar el pago con PayPal" }, { status: 502 });
  }

  await prisma.order.update({ where: { id: order.id }, data: { paymentId: paypalOrder.id } });

  return NextResponse.json({ orderId: order.id, paypalOrderId: paypalOrder.id });
}
