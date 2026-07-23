import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "../../components/navbar";
import CheckoutForm from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product || !product.active) notFound();

  const inStock = product.stock === null || product.stock > 0;

  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 40, alignItems: "start" }}>
          <div>
            <span className={`badge ${inStock ? "ok" : ""}`}>
              {product.stock === null ? "En stock" : inStock ? `${product.stock} en stock` : "Agotado"}
            </span>
            <h1 style={{ fontSize: 36, marginTop: 12 }}>{product.name}</h1>
            <div
              className="card"
              style={{
                marginTop: 24,
                minHeight: 320,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, var(--panel), var(--panel-2))",
              }}
            >
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, color: "var(--muted)" }}>
                {product.name}
              </span>
            </div>
            <p style={{ color: "var(--muted)", marginTop: 24, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {product.description}
            </p>
          </div>

          <div className="card" style={{ position: "sticky", top: 96 }}>
            <div className="price" style={{ fontSize: 32 }}>${product.priceUsd.toFixed(2)}</div>

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "16px 0" }} />

            <CheckoutForm
              productId={product.id}
              productName={product.name}
              priceUsd={product.priceUsd}
              disabled={!inStock}
            />

            <div style={{ display: "flex", gap: 16, marginTop: 20, fontSize: 12, color: "var(--muted)" }}>
              <span>⚡ Entrega instantanea</span>
              <span>🔒 Pago seguro</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
