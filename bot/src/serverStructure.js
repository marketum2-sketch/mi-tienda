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
      { name: "como-comprar", type: "text" },
      { name: "metodos-de-pago", type: "text" },
      { name: "reseñas", type: "text" },
      { name: "ofertas", type: "text" },
      { name: "historial-precios", type: "text" },
    ],
  },
  {
    category: "🎮 COMUNIDAD",
    channels: [
      { name: "tips-gratis", type: "text" },
      { name: "resultados", type: "text" },
      { name: "clips", type: "text" },
      { name: "chat-general", type: "text" },
      { name: "memes", type: "text" },
      { name: "presentate", type: "text" },
      { name: "preguntas-estrategia", type: "text" },
      { name: "sugerencias", type: "text" },
    ],
  },
  {
    category: "🕹️ VALORANT",
    channels: [
      { name: "valorant-general", type: "text" },
      { name: "valorant-clips", type: "text" },
      { name: "valorant-lfg", type: "text" },
      { name: "valorant-ranked-help", type: "text" },
    ],
  },
  {
    category: "🕹️ LEAGUE OF LEGENDS",
    channels: [
      { name: "lol-general", type: "text" },
      { name: "lol-clips", type: "text" },
      { name: "lol-lfg", type: "text" },
      { name: "lol-builds", type: "text" },
    ],
  },
  {
    category: "🕹️ CS2",
    channels: [
      { name: "cs2-general", type: "text" },
      { name: "cs2-clips", type: "text" },
      { name: "cs2-lfg", type: "text" },
      { name: "cs2-configs", type: "text" },
    ],
  },
  {
    category: "🕹️ FORTNITE",
    channels: [
      { name: "fortnite-general", type: "text" },
      { name: "fortnite-clips", type: "text" },
      { name: "fortnite-lfg", type: "text" },
    ],
  },
  {
    category: "🕹️ APEX LEGENDS",
    channels: [
      { name: "apex-general", type: "text" },
      { name: "apex-clips", type: "text" },
      { name: "apex-lfg", type: "text" },
    ],
  },
  {
    category: "🕹️ OTROS JUEGOS",
    channels: [
      { name: "otros-juegos", type: "text" },
      { name: "sugerir-juego", type: "text" },
    ],
  },
  {
    category: "🎫 SOPORTE",
    channels: [
      { name: "panel-tickets", type: "text" },
      { name: "estado-del-servicio", type: "text" },
      { name: "preguntas-frecuentes-soporte", type: "text" },
    ],
  },
  {
    category: "🏆 EVENTOS",
    channels: [
      { name: "eventos", type: "text" },
      { name: "torneos", type: "text" },
      { name: "resultados-torneos", type: "text" },
      { name: "inscripciones", type: "text" },
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
      { name: "staff-recursos", type: "text" },
      { name: "staff-onboarding", type: "text" },
    ],
  },
  {
    category: "🚫 MODERACION",
    staffOnly: true,
    channels: [
      { name: "registro-warns", type: "text" },
      { name: "registro-baneos", type: "text" },
      { name: "logs-mensajes-borrados", type: "text" },
      { name: "logs-cambios-nombre", type: "text" },
    ],
  },
  {
    category: "🎤 VOZ",
    channels: [
      { name: "General 1", type: "voice" },
      { name: "General 2", type: "voice" },
      { name: "Estrategia en vivo", type: "voice" },
      { name: "Valorant", type: "voice" },
      { name: "LoL", type: "voice" },
      { name: "CS2", type: "voice" },
      { name: "Fortnite", type: "voice" },
      { name: "Apex", type: "voice" },
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
