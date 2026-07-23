"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return <>{children}</>;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <nav style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 32 }}>
        <Link href="/admin" style={{ fontWeight: 700 }}>Admin</Link>
        <Link href="/admin/products/new" style={{ color: "var(--muted)" }}>+ Producto</Link>
        <Link href="/" style={{ color: "var(--muted)" }}>Ver tienda</Link>
        <button onClick={logout} className="btn-outline btn" style={{ marginLeft: "auto" }}>
          Salir
        </button>
      </nav>
      {children}
    </div>
  );
}
