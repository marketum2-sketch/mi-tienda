// Estructura completa que crea /setup-servidor.
// type: "text" | "voice"
// readOnly: true -> los miembros normales pueden ver pero no escribir (solo staff)
// message: si esta presente, se publica automaticamente al crear el canal
// public: true en una CATEGORIA -> visible sin necesidad de estar verificado
// isVerifyChannel: true -> aqui se publica el boton de verificacion
export const SERVER_STRUCTURE = [
  {
    category: "👋 BIENVENIDA",
    public: true,
    channels: [
      {
        name: "reglas",
        type: "text",
        readOnly: true,
        message:
          "**📜 Reglas del servidor**\n\n1. Respeto ante todo, cero insultos ni discriminacion.\n2. Nada de spam ni publicidad de otros servidores sin permiso.\n3. Las compras y consultas de soporte van por ticket (`/ticket` o el panel), no por DM al staff.\n4. El staff tiene la ultima palabra en caso de dudas.\n\n*(Edita este mensaje con tus reglas reales cuando quieras.)*",
      },
      { name: "verificacion", type: "text", readOnly: true, isVerifyChannel: true },
    ],
  },
  {
    category: "📢 INFO",
    channels: [
      { name: "anuncios", type: "text", readOnly: true },
      { name: "novedades", type: "text", readOnly: true },
      { name: "roles", type: "text", readOnly: true, message: "🎭 Aqui van los roles auto-asignables (notificaciones, juegos, etc.). Configuralo con tu sistema de reaction roles favorito." },
      {
        name: "faq",
        type: "text",
        readOnly: true,
        message: "**❓ Preguntas frecuentes**\n\n*(Completa con tus preguntas reales. Ejemplo:)*\n\n**¿Cuanto tarda la entrega?** Es instantanea apenas se confirma el pago.\n**¿Que metodos de pago aceptan?** Mira #metodos-de-pago.",
      },
    ],
  },
  {
    category: "🛍️ TIENDA",
    channels: [
      { name: "catalogo", type: "text", readOnly: true, message: "🛒 Mira el catalogo completo en la web de la tienda, o usa `/vouch` una vez que compres." },
      { name: "productos-nuevos", type: "text", readOnly: true },
      { name: "ofertas", type: "text", readOnly: true },
      {
        name: "como-comprar",
        type: "text",
        readOnly: true,
        message:
          "**🛍️ Como comprar**\n\n1. Entra al catalogo y elegi tu producto.\n2. Completa el pago.\n3. Recibis tu producto al instante.\n4. Si algo falla, abri un ticket en #panel-tickets.",
      },
      { name: "metodos-de-pago", type: "text", readOnly: true, message: "**💳 Metodos de pago aceptados**\n\n• PayPal\n\n*(Actualiza esta lista si sumas mas metodos.)*" },
      { name: "garantias-y-devoluciones", type: "text", readOnly: true, message: "**🛡️ Garantias y devoluciones**\n\n*(Completa con tu politica real: plazos, que cubre, como se pide.)*" },
      { name: "estado-de-pedidos", type: "text", readOnly: true, message: "📦 Para consultar el estado de tu pedido, abri un ticket y pedile al staff que use `/pedido` o `/factura`." },
      { name: "reseñas", type: "text" },
      { name: "preguntas-tienda", type: "text" },
    ],
  },
  {
    category: "📦 PRODUCTOS",
    channels: Array.from({ length: 30 }, (_, i) => ({ name: `producto-${i + 1}`, type: "text", readOnly: true })),
  },
  {
    category: "🎫 TICKETS",
    ticketCategory: true,
    channels: [],
  },
  {
    category: "🎫 SOPORTE",
    channels: [
      { name: "panel-tickets", type: "text", readOnly: true },
      { name: "estado-del-servicio", type: "text", readOnly: true },
    ],
  },
  {
    category: "🎮 COMUNIDAD",
    channels: [
      { name: "chat-general", type: "text" },
      { name: "tips-gratis", type: "text", readOnly: true },
      { name: "resultados", type: "text" },
      { name: "clips", type: "text" },
      { name: "presentate", type: "text" },
      { name: "memes", type: "text" },
    ],
  },
  {
    category: "🏆 EVENTOS",
    channels: [
      { name: "eventos", type: "text", readOnly: true },
      { name: "torneos", type: "text", readOnly: true },
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

// Roles que crea /setup-servidor si todavia no existen (por nombre).
export const SERVER_ROLES = [
  {
    key: "founder",
    name: "👑 Fundador",
    color: 0xffd700,
    hoist: true,
    permissions: ["Administrator"],
  },
  {
    key: "staff",
    name: "🛠️ Staff",
    color: 0x3355ff,
    hoist: true,
    permissions: [
      "ManageMessages",
      "ManageChannels",
      "ManageThreads",
      "KickMembers",
      "BanMembers",
      "ManageNicknames",
      "MuteMembers",
      "DeafenMembers",
      "ModerateMembers",
      "ViewAuditLog",
    ],
  },
  {
    key: "verified",
    name: "✅ Verificado",
    color: 0x2ecc71,
    hoist: false,
    permissions: [],
  },
  {
    key: "customer",
    name: "🛍️ Cliente",
    color: 0xffc53d,
    hoist: true,
    permissions: [],
  },
  {
    key: "moderator",
    name: "🛡️ Moderador",
    color: 0x5865f2,
    hoist: true,
    permissions: ["KickMembers", "BanMembers", "ManageMessages", "MuteMembers", "DeafenMembers", "ModerateMembers", "ManageNicknames"],
  },
  {
    key: "support",
    name: "🎫 Soporte",
    color: 0x2ecc71,
    hoist: true,
    permissions: ["ManageMessages"],
  },
  {
    key: "bots",
    name: "🤖 Bots",
    color: 0x99aab5,
    hoist: true,
    permissions: [],
  },
  {
    key: "partner",
    name: "🤝 Alianzas",
    color: 0x1abc9c,
    hoist: true,
    permissions: [],
  },
];
