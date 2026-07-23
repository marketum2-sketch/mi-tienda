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
    <div style={{ minHeight: "100vh" }}>
      <div className="navbar">
        <div className="navbar-inner">
          <Link href="/admin" className="logo">Admin · ZoneSell</Link>
          <div className="navbar-links">
            <Link href="/admin">Panel</Link>
            <Link href="/admin/products/new">+ Producto</Link>
            <Link href="/">Ver tienda</Link>
          </div>
          <button onClick={logout} className="btn-outline btn" style={{ padding: "8px 16px", fontSize: 14 }}>
            Salir
          </button>
        </div>
      </div>
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {children}
      </div>
    </div>
  );
}
