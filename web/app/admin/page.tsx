import { prisma } from "@/lib/prisma";
import type { Product } from "@prisma/client";
import Link from "next/link";
import DeleteProductButton from "./delete-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, orders, revenueAgg, pendingCount] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { product: true } }),
    prisma.order.aggregate({
      _sum: { priceUsd: true },
      where: { status: { in: ["PAID", "DELIVERED"] } },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  const activeProducts = products.filter((p: Product) => p.active).length;

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Ingresos totales</div>
          <div className="stat-value">${(revenueAgg._sum.priceUsd || 0).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Productos activos</div>
          <div className="stat-value">{activeProducts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pedidos totales</div>
          <div className="stat-value">{orders.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes de pago</div>
          <div className="stat-value">{pendingCount}</div>
        </div>
      </div>

      <section style={{ marginTop: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="eyebrow">Productos ({products.length})</div>
          <Link href="/admin/products/new" className="btn btn-accent" style={{ padding: "9px 16px", fontSize: 14 }}>
            + Nuevo producto
          </Link>
        </div>
        <div className="row-list">
          {products.map((p: Product) => (
            <div key={p.id} className="row-item">
              <div style={{ flex: 1 }}>
                <strong>{p.name}</strong>{" "}
                <span className="badge" style={{ marginLeft: 8 }}>{p.active ? "activo" : "oculto"}</span>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>/{p.slug}</div>
              </div>
              <div className="price">${p.priceUsd.toFixed(2)}</div>
              <Link href={`/admin/products/${p.id}`} className="btn btn-outline" style={{ padding: "8px 14px", fontSize: 14 }}>
                Editar
              </Link>
              <DeleteProductButton productId={p.id} />
            </div>
          ))}
          {products.length === 0 && (
            <div className="empty-state">
              No hay productos todavia. Creá el primero con "+ Nuevo producto".
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Ultimos pedidos</div>
        <div className="row-list">
          {orders.map((o: (typeof orders)[number]) => (
            <div key={o.id} className="row-item">
              <div style={{ flex: 1 }}>
                <strong>{o.product.name}</strong>
                {o.quantity > 1 && <span style={{ color: "var(--muted)" }}> x{o.quantity}</span>}
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                  {o.discordTag} · #{o.id.slice(-6)}
                </div>
              </div>
              <div className="price">${o.priceUsd.toFixed(2)}</div>
              <span className={`badge ${o.status === "DELIVERED" ? "ok" : ""}`}>{o.status}</span>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="empty-state">Todavia no hay pedidos.</div>
          )}
        </div>
      </section>
    </div>
  );
}
