// Estructura completa que crea /setup-servidor.
// type: "text" | "voice"
export const SERVER_STRUCTURE = [
  {
    category: "📢 INFO",
    channels: [
      { name: "reglas", type: "text" },
      { name: "anuncios", type: "text" },
      { name: "novedades", type: "text" },
      { name: "roles", type: "text" },
      { name: "faq", type: "text" },
    ],
  },
  {
    category: "🛍️ TIENDA",
    channels: [
      { name: "catalogo", type: "text" },
      { name: "productos-nuevos", type: "text" },
      { name: "ofertas", type: "text" },
      { name: "como-comprar", type: "text" },
      { name: "metodos-de-pago", type: "text" },
      { name: "garantias-y-devoluciones", type: "text" },
      { name: "estado-de-pedidos", type: "text" },
      { name: "reseñas", type: "text" },
      { name: "preguntas-tienda", type: "text" },
    ],
  },
  {
    category: "📦 PRODUCTOS",
    channels: Array.from({ length: 30 }, (_, i) => ({ name: `producto-${i + 1}`, type: "text" })),
  },
  {
    category: "🎮 COMUNIDAD",
    channels: [
      { name: "chat-general", type: "text" },
      { name: "tips-gratis", type: "text" },
      { name: "resultados", type: "text" },
      { name: "clips", type: "text" },
      { name: "presentate", type: "text" },
      { name: "memes", type: "text" },
    ],
  },
  {
    category: "🎫 TICKETS",
    ticketCategory: true,
    channels: [],
  },
  {
    category: "🎫 SOPORTE",
    channels: [
      { name: "panel-tickets", type: "text" },
      { name: "estado-del-servicio", type: "text" },
    ],
  },
  {
    category: "🏆 EVENTOS",
    channels: [
      { name: "eventos", type: "text" },
      { name: "torneos", type: "text" },
    ],
  },
  {
    category: "🔒 STAFF",
    staffOnly: true,
    channels: [
      { name: "staff-chat", type: "text" },
      { name: "logs-tickets", type: "text" },
      { name: "logs-ventas", type: "text" },
      { name: "tareas-pendientes", type: "text" },
      { name: "anuncios-staff", type: "text" },
      { name: "feedback-interno", type: "text" },
    ],
  },
  {
    category: "🚫 MODERACION",
    staffOnly: true,
    channels: [
      { name: "registro-warns", type: "text" },
      { name: "registro-baneos", type: "text" },
    ],
  },
  {
    category: "🎤 VOZ",
    channels: [
      { name: "General", type: "voice" },
      { name: "Estrategia en vivo", type: "voice" },
      { name: "Streaming", type: "voice" },
      { name: "AFK", type: "voice" },
    ],
  },
  {
    category: "🔒 VOZ STAFF",
    staffOnly: true,
    channels: [
      { name: "Staff", type: "voice" },
      { name: "Reuniones", type: "voice" },
    ],
  },
];
