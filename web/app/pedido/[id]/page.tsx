import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { product: true } });
  if (!order) notFound();

  return (
    <main className="container" style={{ paddingTop: 64, maxWidth: 520 }}>
      <div className="eyebrow">PEDIDO #{order.id.slice(-6)}</div>
      <h1 style={{ fontSize: 32, marginTop: 8 }}>{order.product.name}</h1>
      <hr className="receipt-divider" />
      <p>Estado: <span className="status-pill">{order.status}</span></p>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>
        En cuanto la red confirme el pago se creara tu ticket en Discord y recibiras el producto ahi y por DM.
        Esta pagina no se actualiza sola, puedes recargarla en unos minutos.
      </p>
    </main>
  );
}
