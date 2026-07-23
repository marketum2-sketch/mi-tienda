import { prisma } from "@/lib/prisma";
import type { Product } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });

  return (
    <main className="container" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <div className="eyebrow">// ENTREGA DIGITAL INSTANTANEA</div>
      <h1 style={{ fontSize: 48, marginTop: 8 }}>Catalogo</h1>
      <p style={{ color: "var(--muted)", maxWidth: 520 }}>
        Compra, paga con crypto y recibe tu producto al instante en tu ticket de Discord.
      </p>

      <hr className="receipt-divider" />

      <div className="grid">
        {products.map((p: Product) => (
          <Link key={p.id} href={`/product/${p.slug}`} className="card" style={{ textDecoration: "none" }}>
            <div className="eyebrow">{p.stock === null ? "STOCK ILIMITADO" : `STOCK: ${p.stock}`}</div>
            <h3 style={{ fontSize: 20, margin: "8px 0" }}>{p.name}</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, minHeight: 40 }}>{p.description}</p>
            <div className="price" style={{ fontSize: 22, marginTop: 12 }}>${p.priceUsd.toFixed(2)}</div>
          </Link>
        ))}
        {products.length === 0 && (
          <p style={{ color: "var(--muted)" }}>Aun no hay productos publicados.</p>
        )}
      </div>
    </main>
  );
}