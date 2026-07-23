import "./globals.css";

export const metadata = {
  title: "Tienda",
  description: "Productos digitales de entrega inmediata",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
