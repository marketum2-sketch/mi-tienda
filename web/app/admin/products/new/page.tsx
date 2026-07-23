import ProductForm from "../product-form";

export default function NewProductPage() {
  return (
    <div>
      <div className="eyebrow">NUEVO PRODUCTO</div>
      <h1 style={{ fontSize: 28, margin: "8px 0 24px" }}>Crear producto</h1>
      <ProductForm />
    </div>
  );
}
