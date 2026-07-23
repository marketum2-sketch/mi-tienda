import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: body.name,
      description: body.description,
      priceUsd: parseFloat(body.priceUsd),
      deliveryContent: body.deliveryContent,
      stock: body.stock === "" || body.stock == null ? null : parseInt(body.stock, 10),
      active: body.active,
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
