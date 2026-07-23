import Link from "next/link";

function ZoneMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M1 7V1H7" stroke="#3355ff" strokeWidth="2" strokeLinecap="round" />
      <path d="M25 7V1H19" stroke="#3355ff" strokeWidth="2" strokeLinecap="round" />
      <path d="M1 19V25H7" stroke="#3355ff" strokeWidth="2" strokeLinecap="round" />
      <path d="M25 19V25H19" stroke="#3355ff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="13" cy="13" r="3" fill="#17171a" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <div className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="logo">
          <ZoneMark />
          ZoneSell
        </Link>
        <div className="navbar-links">
          <Link href="/">Catalogo</Link>
        </div>
        <Link href="/admin/login" className="btn btn-outline" style={{ padding: "9px 16px", fontSize: 14 }}>
          Admin
        </Link>
      </div>
    </div>
  );
}
