import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CheckoutForm from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product || !product.active) notFound();

  return (
    <main className="container" style={{ paddingTop: 64, paddingBottom: 64, maxWidth: 640 }}>
      <div className="eyebrow">PRODUCTO</div>
      <h1 style={{ fontSize: 36, marginTop: 8 }}>{product.name}</h1>
      <p style={{ color: "var(--muted)" }}>{product.description}</p>
      <div className="price" style={{ fontSize: 28, margin: "16px 0" }}>${product.priceUsd.toFixed(2)} USD</div>

      <hr className="receipt-divider" />

      <CheckoutForm productId={product.id} />
    </main>
  );
}
