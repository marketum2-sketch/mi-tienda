import { prisma } from "@/lib/prisma";
import type { Product } from "@prisma/client";
import Link from "next/link";
import Navbar from "./components/navbar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div className="eyebrow">Entrega digital instantanea</div>
        <h1 style={{ fontSize: 44, marginTop: 8 }}>Catalogo</h1>
        <p style={{ color: "var(--muted)", maxWidth: 520, marginTop: 8 }}>
          Paga con crypto y recibi tu producto al instante en tu ticket de Discord.
        </p>

        <div className="grid" style={{ marginTop: 32 }}>
          {products.map((p: Product) => (
            <Link key={p.id} href={`/product/${p.slug}`} className="card" style={{ display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className={`badge ${p.stock === null || p.stock > 0 ? "ok" : ""}`}>
                  {p.stock === null ? "En stock" : p.stock > 0 ? `${p.stock} en stock` : "Agotado"}
                </span>
              </div>
              <h3 style={{ fontSize: 19 }}>{p.name}</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, minHeight: 40, marginTop: 6 }}>{p.description}</p>
              <div className="price" style={{ fontSize: 24, marginTop: 14 }}>${p.priceUsd.toFixed(2)}</div>
            </Link>
          ))}
          {products.length === 0 && (
            <p style={{ color: "var(--muted)" }}>Aun no hay productos publicados.</p>
          )}
        </div>
      </main>
    </>
  );
}
