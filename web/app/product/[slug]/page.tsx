import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import CheckoutForm from "./checkout-form";
import { MIN_ORDER_USD } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product || !product.active) notFound();

  const inStock = product.stock === null || product.stock > 0;

  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="product-layout" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 48, alignItems: "start" }}>
          <div>
            <span className={`badge ${inStock ? "ok" : ""}`}>
              {product.stock === null ? "En stock" : inStock ? `${product.stock} en stock` : "Agotado"}
            </span>
            <h1 style={{ fontSize: 38, marginTop: 14, lineHeight: 1.08 }}>{product.name}</h1>

            <div
              className="zone-frame"
              style={{
                marginTop: 28,
                minHeight: 340,
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--surface)",
                border: "1px solid var(--line)",
              }}
            >
              <span className="zc-tr" />
              <span className="zc-bl" />
              <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 26, color: "var(--muted)" }}>
                {product.name}
              </span>
            </div>

            <p style={{ color: "var(--muted)", marginTop: 28, lineHeight: 1.75, whiteSpace: "pre-wrap", fontSize: 15 }}>
              {product.description}
            </p>
          </div>

          <div className="card" style={{ position: "sticky", top: 100 }}>
            <div className="price" style={{ fontSize: 30 }}>${product.priceUsd.toFixed(2)}</div>

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "18px 0" }} />

            <CheckoutForm
              productId={product.id}
              productName={product.name}
              priceUsd={product.priceUsd}
              minOrderUsd={MIN_ORDER_USD}
              disabled={!inStock}
            />

            <div style={{ display: "flex", gap: 18, marginTop: 22, fontSize: 12, color: "var(--muted)" }}>
              <span>⚡ Entrega instantanea</span>
              <span>🔒 Pago seguro</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
