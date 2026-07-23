import { prisma } from "@/lib/prisma";
import type { Product } from "@prisma/client";
import Link from "next/link";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: 72, paddingBottom: 80 }}>
        <div className="zone-frame" style={{ display: "inline-block", padding: "6px 2px" }}>
          <span className="zc-tr" />
          <span className="zc-bl" />
          <div className="eyebrow">Entrega digital al instante</div>
        </div>
        <h1 style={{ fontSize: 52, marginTop: 10, maxWidth: 640, lineHeight: 1.05 }}>
          Lo que buscas, en tu zona de entrega.
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 480, marginTop: 14, fontSize: 16 }}>
          Elegi un producto, paga, y recibilo al instante en tu ticket de Discord.
        </p>

        <div className="grid" style={{ marginTop: 48 }}>
          {products.map((p: Product) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="card zone-frame"
              style={{ display: "block" }}
            >
              <span className="zc-tr" />
              <span className="zc-bl" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span className={`badge ${p.stock === null || p.stock > 0 ? "ok" : ""}`}>
                  {p.stock === null ? "En stock" : p.stock > 0 ? `${p.stock} en stock` : "Agotado"}
                </span>
              </div>
              <h3 style={{ fontSize: 18 }}>{p.name}</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, minHeight: 40, marginTop: 8, lineHeight: 1.5 }}>
                {p.description}
              </p>
              <div className="price" style={{ fontSize: 22, marginTop: 16 }}>${p.priceUsd.toFixed(2)}</div>
            </Link>
          ))}
          {products.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              Todavia no hay productos publicados. Volve pronto.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
