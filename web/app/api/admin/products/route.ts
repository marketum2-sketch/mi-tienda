import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const slug = body.slug || body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      description: body.description,
      priceUsd: parseFloat(body.priceUsd),
      deliveryContent: body.deliveryContent,
      stock: body.stock === "" || body.stock == null ? null : parseInt(body.stock, 10),
      active: body.active ?? true,
    },
  });

  return NextResponse.json(product);
}
