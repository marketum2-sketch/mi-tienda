import Link from "next/link";

export default function Navbar() {
  return (
    <div className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="logo">
          <span className="logo-mark" />
          TIENDA
        </Link>
        <div className="navbar-links">
          <Link href="/">Catalogo</Link>
        </div>
        <Link href="/admin/login" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: 14 }}>
          Admin
        </Link>
      </div>
    </div>
  );
}
