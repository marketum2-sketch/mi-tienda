import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "../product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) notFound();

  return (
    <div>
      <div className="eyebrow">EDITAR PRODUCTO</div>
      <h1 style={{ fontSize: 28, margin: "8px 0 24px" }}>{product.name}</h1>
      <ProductForm
        initial={{
          id: product.id,
          name: product.name,
          description: product.description,
          priceUsd: product.priceUsd,
          deliveryContent: product.deliveryContent,
          stock: product.stock,
          active: product.active,
        }}
      />
    </div>
  );
}
