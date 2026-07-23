import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Verifica la firma HMAC que envia NOWPayments (ver docs: header x-nowpayments-sig)
function isValidSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const sorted = JSON.stringify(JSON.parse(rawBody), Object.keys(JSON.parse(rawBody)).sort());
  const hmac = crypto
    .createHmac("sha512", process.env.NOWPAYMENTS_IPN_SECRET!)
    .update(sorted)
    .digest("hex");
  return hmac === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-nowpayments-sig");

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const orderId = payload.order_id;
  const paymentStatus = payload.payment_status; // waiting, confirming, confirmed, finished, failed, expired

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  if (["finished", "confirmed"].includes(paymentStatus) && order.status === "PENDING") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date(), payCurrency: payload.pay_currency },
    });

    // Avisar al bot para que abra/actualice el ticket y entregue el producto
    await fetch(`${process.env.BOT_INTERNAL_URL}/internal/order-paid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_SECRET!,
      },
      body: JSON.stringify({ orderId }),
    });
  } else if (["failed", "expired"].includes(paymentStatus)) {
    await prisma.order.update({ where: { id: orderId }, data: { status: paymentStatus === "expired" ? "EXPIRED" : "FAILED" } });
  }

  return NextResponse.json({ received: true });
}
