import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteProductButton from "./delete-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, orders] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { product: true } }),
  ]);

  return (
    <div>
      <section>
        <div className="eyebrow">PRODUCTOS ({products.length})</div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {products.map((p) => (
            <div key={p.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <strong>{p.name}</strong>{" "}
                <span className="status-pill" style={{ marginLeft: 8 }}>{p.active ? "activo" : "oculto"}</span>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>/{p.slug}</div>
              </div>
              <div className="price">${p.priceUsd.toFixed(2)}</div>
              <Link href={`/admin/products/${p.id}`} className="btn btn-outline">Editar</Link>
              <DeleteProductButton productId={p.id} />
            </div>
          ))}
          {products.length === 0 && <p style={{ color: "var(--muted)" }}>No hay productos todavia.</p>}
        </div>
      </section>

      <hr className="receipt-divider" />

      <section>
        <div className="eyebrow">ULTIMOS PEDIDOS</div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {orders.map((o) => (
            <div key={o.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <strong>{o.product.name}</strong>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>{o.discordTag} · #{o.id.slice(-6)}</div>
              </div>
              <div className="price">${o.priceUsd.toFixed(2)}</div>
              <span className="status-pill">{o.status}</span>
            </div>
          ))}
          {orders.length === 0 && <p style={{ color: "var(--muted)" }}>Todavia no hay pedidos.</p>}
        </div>
      </section>
    </div>
  );
}
