import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "../../components/navbar";

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { product: true } });
  if (!order) notFound();

  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: 48, maxWidth: 520 }}>
        <div className="eyebrow">Pedido #{order.id.slice(-6)}</div>
        <h1 style={{ fontSize: 32, marginTop: 8 }}>{order.product.name}</h1>
        <div className="card" style={{ marginTop: 20 }}>
          <p>Estado: <span className="badge ok">{order.status}</span></p>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            En cuanto la red confirme el pago se creara tu ticket en Discord y recibiras el producto ahi y por DM.
            Esta pagina no se actualiza sola, podes recargarla en unos minutos.
          </p>
        </div>
      </main>
    </>
  );
}
