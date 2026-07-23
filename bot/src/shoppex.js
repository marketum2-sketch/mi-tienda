// Cliente para la API de Shoppex.
// OJO: los nombres exactos de parametros de busqueda (ej. filtrar por email)
// estan tomados de fragmentos de su documentacion publica, no de la referencia
// completa. Si algun comando devuelve error o datos raros, lo primero a revisar
// es esto contra https://docs.shoppex.io/api-reference

const BASE = process.env.SHOPPEX_API_BASE || "https://api.shoppex.io/dev/v1";

async function shoppexFetch(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.SHOPPEX_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shoppex API error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.data ?? json;
}

export async function getOrder(id) {
  return shoppexFetch(`/orders/${id}`);
}

export async function listOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  return shoppexFetch(`/orders${query ? `?${query}` : ""}`);
}

export async function listOrdersByEmail(email) {
  return listOrders({ customer_email: email });
}
