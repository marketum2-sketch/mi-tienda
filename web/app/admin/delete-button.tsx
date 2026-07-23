"use client";

import { useRouter } from "next/navigation";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("¿Borrar este producto?")) return;
    await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="btn-outline btn" style={{ color: "var(--danger)" }}>
      Borrar
    </button>
  );
}
