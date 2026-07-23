import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import { listOrdersByEmail, listOrders, getOrder } from "./shoppex.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
const OWNER_ID = process.env.OWNER_DISCORD_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const PUBLIC_REVIEWS_CHANNEL_ID = process.env.PUBLIC_REVIEWS_CHANNEL_ID;
const INACTIVITY_HOURS = parseFloat(process.env.INACTIVITY_HOURS || "48");

function isStaff(interaction) {
  return !STAFF_ROLE_ID || interaction.member.roles.cache.has(STAFF_ROLE_ID);
}

const reasonLabels = {
  comprar: "Comprar",
  estado: "Estado de pedido",
  soporte: "Soporte",
  reposicion: "Reposicion",
  entrega: "Entrega manual",
  otro: "Otro motivo",
};

// channelId -> timestamp del ultimo mensaje visto (en memoria, se resetea si el bot reinicia)
const lastActivity = new Map();
// channelId -> ya se le mando el aviso de "se va a cerrar por inactividad"
const warnedInactive = new Set();

function isTicketChannel(channel) {
  return TICKET_CATEGORY_ID && channel.parentId === TICKET_CATEGORY_ID;
}

function getTicketOwnerId(channel) {
  const match = channel.topic?.match(/ticket_owner:(\d+)/);
  return match?.[1] || null;
}

// ---------- Transcript + borrado ----------
async function buildTranscript(channel) {
  let all = [];
  let before;
  for (let i = 0; i < 5; i++) {
    const batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (batch.size === 0) break;
    all.push(...batch.values());
    before = batch.last().id;
    if (batch.size < 100) break;
  }
  all.reverse();
  const lines = all.map(
    (m) => `[${new Date(m.createdTimestamp).toLocaleString("es-ES")}] ${m.author.tag}: ${m.content || "(sin texto / adjunto)"}`
  );
  return lines.join("\n") || "Sin mensajes.";
}

async function closeTicket(channel, closedBy) {
  try {
    const transcript = await buildTranscript(channel);
    if (LOG_CHANNEL_ID) {
      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
      if (logChannel) {
        await logChannel.send({
          content: `📄 Transcript de **${channel.name}** (cerrado por ${closedBy})`,
          files: [{ attachment: Buffer.from(transcript, "utf-8"), name: `${channel.name}.txt` }],
        });
      }
    }
  } catch (err) {
    console.error("No se pudo generar/enviar el transcript:", err);
  }
  lastActivity.delete(channel.id);
  warnedInactive.delete(channel.id);
  await channel.delete().catch(() => {});
}

// ---------- Crear ticket (compartido por /ticket y el panel) ----------
async function createTicketChannel(interaction, channelName, reasonLabel) {
  const guild = interaction.guild;
  const existing = guild.channels.cache.find((c) => c.name === channelName);
  if (existing) {
    await interaction.reply({ content: `Ya tenes un ticket abierto: ${existing}`, ephemeral: true });
    return;
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: TICKET_CATEGORY_ID || undefined,
    topic: `ticket_owner:${interaction.user.id}`,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ...(STAFF_ROLE_ID
        ? [{ id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
        : []),
      ...(OWNER_ID
        ? [{ id: OWNER_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
        : []),
    ],
  });

  lastActivity.set(channel.id, Date.now());

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("close_ticket").setLabel("Cerrar ticket").setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle(reasonLabel ? `Ticket: ${reasonLabel}` : "Ticket de soporte")
    .setDescription(
      `${reasonLabel ? `Motivo: **${reasonLabel}**\n\n` : ""}Contanos que necesitas, el staff te atiende pronto.`
    )
    .setColor(0x3355ff);

  await channel.send({
    content: `<@${interaction.user.id}>${OWNER_ID ? ` <@${OWNER_ID}>` : ""}`,
    embeds: [embed],
    components: [closeRow],
  });

  if (OWNER_ID) {
    try {
      const owner = await client.users.fetch(OWNER_ID);
      const dmEmbed = new EmbedBuilder()
        .setAuthor({ name: "ZoneSell | Sistema de tickets" })
        .setTitle("🎫 Nuevo ticket")
        .addFields(
          { name: "De", value: `${interaction.user}`, inline: true },
          ...(reasonLabel ? [{ name: "Motivo", value: reasonLabel, inline: true }] : []),
          { name: "Canal", value: `${channel}`, inline: false }
        )
        .setColor(0x3355ff)
        .setFooter({ text: "ZoneSell" })
        .setTimestamp();
      await owner.send({ embeds: [dmEmbed] });
    } catch {
      // DMs cerrados, no pasa nada, ya tiene acceso al canal.
    }
  }

  await interaction.reply({ content: `Ticket creado: ${channel}`, ephemeral: true });
}

client.on("interactionCreate", async (interaction) => {
  // ---------- Cerrar ticket (boton) ----------
  if (interaction.isButton() && interaction.customId === "close_ticket") {
    await interaction.reply("Cerrando ticket en 5 segundos...");
    setTimeout(() => closeTicket(interaction.channel, interaction.user.tag), 5000);
    return;
  }

  // ---------- Menu de motivos del panel ----------
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_reason_select") {
    const reasonKey = interaction.values[0];
    const reasonLabel = reasonLabels[reasonKey] || "Otro motivo";
    const channelName = `${reasonKey}-${interaction.user.username}`.toLowerCase().slice(0, 90);
    return createTicketChannel(interaction, channelName, reasonLabel);
  }

  if (!interaction.isChatInputCommand()) return;

  // ---------- /ticket ----------
  if (interaction.commandName === "ticket") {
    const channelName = `ticket-${interaction.user.username}`.toLowerCase();
    return createTicketChannel(interaction, channelName, null);
  }

  // ---------- /panel ----------
  if (interaction.commandName === "panel") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tenes permiso para esto.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "ZoneSell", iconURL: interaction.guild.iconURL() || undefined })
      .setTitle("🛍️ Centro de soporte")
      .setDescription(
        "**Bienvenido.** Elegi abajo la categoria que mejor describe por que abris el ticket.\n⚡ Respuesta rapida · 🔒 Atencion privada"
      )
      .addFields(
        { name: "🛒 Comprar", value: "Ver disponibilidad o precios.", inline: true },
        { name: "📊 Estado de pedido", value: "Segui tu compra.", inline: true },
        { name: "🛠️ Soporte", value: "Consultas generales.", inline: true },
        { name: "🔄 Reposicion", value: "Producto fallo o vencio.", inline: true },
        { name: "📦 Entrega manual", value: "No recibiste tu pedido.", inline: true },
        { name: "❓ Otro motivo", value: "Cualquier otra cosa.", inline: true }
      )
      .setColor(0x7c5cff)
      .setThumbnail(interaction.guild.iconURL({ size: 256 }) || null)
      .setFooter({ text: "ZoneSell • Sistema de tickets" })
      .setTimestamp();

    const select = new StringSelectMenuBuilder()
      .setCustomId("ticket_reason_select")
      .setPlaceholder("Selecciona un motivo para abrir tu ticket")
      .addOptions(
        { label: "Comprar", value: "comprar", emoji: "🛒" },
        { label: "Estado de pedido", value: "estado", emoji: "📊" },
        { label: "Soporte", value: "soporte", emoji: "🛠️" },
        { label: "Reposicion", value: "reposicion", emoji: "🔄" },
        { label: "Entrega manual", value: "entrega", emoji: "📦" },
        { label: "Otro motivo", value: "otro", emoji: "❓" }
      );

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: "Panel publicado.", ephemeral: true });
  }

  // ---------- /reclamar ----------
  if (interaction.commandName === "reclamar") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tenes permiso para esto.", ephemeral: true });
    }
    if (!isTicketChannel(interaction.channel)) {
      return interaction.reply({ content: "Este comando solo funciona dentro de un ticket.", ephemeral: true });
    }
    await interaction.channel.send(`🙋 Ticket reclamado por ${interaction.user}. Te atiende directamente desde ahora.`);
    return interaction.reply({ content: "Ticket reclamado.", ephemeral: true });
  }

  // ---------- /cerrar-todos ----------
  if (interaction.commandName === "cerrar-todos") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tenes permiso para esto.", ephemeral: true });
    }
    if (!TICKET_CATEGORY_ID) {
      return interaction.reply({ content: "No hay TICKET_CATEGORY_ID configurado.", ephemeral: true });
    }
    const horas = interaction.options.getInteger("horas") ?? 48;
    await interaction.deferReply({ ephemeral: true });

    const ticketChannels = interaction.guild.channels.cache.filter((c) => c.parentId === TICKET_CATEGORY_ID);
    let closedCount = 0;

    for (const channel of ticketChannels.values()) {
      const last = lastActivity.get(channel.id) || channel.createdTimestamp;
      const hoursSince = (Date.now() - last) / (1000 * 60 * 60);
      if (hoursSince >= horas) {
        await closeTicket(channel, `${interaction.user.tag} (cierre masivo)`);
        closedCount++;
      }
    }

    return interaction.editReply(`Cerrados ${closedCount} tickets inactivos hace mas de ${horas}h.`);
  }

  // ---------- /stats ----------
  if (interaction.commandName === "stats") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tenes permiso para esto.", ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    try {
      const orders = await listOrders({ status: "COMPLETED" });
      const list = Array.isArray(orders) ? orders : orders.items || [];

      const totalRevenue = list.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const totalOrders = list.length;

      const byProduct = {};
      for (const o of list) {
        for (const item of o.items || []) {
          byProduct[item.product_title] = (byProduct[item.product_title] || 0) + item.quantity;
        }
      }
      const topProducts =
        Object.entries(byProduct)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, qty]) => `${name} — ${qty} vendidos`)
          .join("\n") || "Sin datos todavia";

      const embed = new EmbedBuilder()
        .setTitle("Estadisticas de la tienda")
        .addFields(
          { name: "Ingresos totales", value: `$${totalRevenue.toFixed(2)}`, inline: true },
          { name: "Pedidos completados", value: `${totalOrders}`, inline: true },
          { name: "Top productos", value: topProducts }
        )
        .setColor(0x3355ff);

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return interaction.editReply("No se pudo consultar la API de Shoppex. Revisa SHOPPEX_API_KEY.");
    }
  }

  // ---------- /timer ----------
  if (interaction.commandName === "timer") {
    const minutos = interaction.options.getInteger("minutos") ?? 10;
    await interaction.reply(`⏱️ Contador de **${minutos} minuto${minutos === 1 ? "" : "s"}** iniciado.`);

    setTimeout(async () => {
      try {
        await interaction.followUp(`⏰ <@${interaction.user.id}> se cumplieron los ${minutos} minutos.`);
      } catch {
        // El canal pudo haberse borrado o el bot perdio acceso, no pasa nada.
      }
    }, minutos * 60 * 1000);
    return;
  }

  // ---------- /notificar ----------
  if (interaction.commandName === "notificar") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tenes permiso para esto.", ephemeral: true });
    }
    const user = interaction.options.getUser("usuario");
    const mensaje =
      interaction.options.getString("mensaje") || "Te hemos respondido, revisa el mensaje cuando puedas.";

    const embed = new EmbedBuilder()
      .setAuthor({ name: "ZoneSell | Notificacion" })
      .setTitle("📩 Nueva notificacion")
      .addFields(
        { name: "De", value: `${interaction.user}`, inline: true },
        { name: "Canal", value: `${interaction.channel}`, inline: true },
        { name: "Mensaje", value: mensaje, inline: false }
      )
      .setColor(0x3355ff)
      .setFooter({ text: "ZoneSell • Sistema de notificaciones" })
      .setTimestamp();

    try {
      await user.send({ embeds: [embed] });
      return interaction.reply({ content: `Aviso enviado a ${user.tag}.`, ephemeral: true });
    } catch {
      return interaction.reply({
        content: `No se pudo enviar el DM a ${user.tag} (puede tener los mensajes privados cerrados).`,
        ephemeral: true,
      });
    }
  }

  // ---------- /ayuda ----------
  if (interaction.commandName === "ayuda") {
    const embed = new EmbedBuilder()
      .setAuthor({ name: "ZoneSell | Bot" })
      .setTitle("📖 Comandos disponibles")
      .addFields(
        { name: "👤 Para cualquiera", value: "\u200B" },
        { name: "/ticket", value: "Abre un ticket de soporte privado directo (sin pasar por el panel)." },
        { name: "/vouch vendedor producto calificacion [comentario]", value: "Deja tu resena publica despues de comprar." },
        { name: "/timer [minutos]", value: "Inicia un contador (10 min por defecto) y te avisa en el canal cuando termina." },
        { name: "\u200B", value: "\u200B" },
        { name: "🛠️ Solo staff", value: "\u200B" },
        { name: "/panel", value: "Publica el panel fijo con el menu de motivos para abrir tickets. Se usa una sola vez por canal." },
        { name: "/reclamar", value: "Usalo DENTRO de un ticket para avisar que vos lo estas atendiendo." },
        { name: "/cerrar-todos [horas]", value: "Cierra de una todos los tickets sin actividad hace mas de X horas (48 por defecto)." },
        { name: "/notificar usuario [mensaje]", value: "Le manda un DM prolijo a alguien avisando que le respondiste." },
        { name: "/factura id", value: "Busca una compra por su ID de factura completo: estado, metodo de pago, monto, fecha, comprador y producto." },
        { name: "/pedido email", value: "Busca en Shoppex las compras de ese email y muestra su estado." },
        { name: "/stats", value: "Ingresos totales, pedidos completados y top productos, sacado de Shoppex." }
      )
      .setColor(0x3355ff)
      .setFooter({ text: "ZoneSell • /ayuda para ver esto de nuevo" });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ---------- /vouch ----------
  if (interaction.commandName === "vouch") {
    const vendedor = interaction.options.getUser("vendedor");
    const producto = interaction.options.getString("producto");
    const calificacion = interaction.options.getInteger("calificacion");
    const comentario = interaction.options.getString("comentario");

    const targetChannel = PUBLIC_REVIEWS_CHANNEL_ID
      ? await client.channels.fetch(PUBLIC_REVIEWS_CHANNEL_ID).catch(() => null)
      : interaction.channel;

    if (!targetChannel) {
      return interaction.reply({ content: "No encontre el canal de resenas (revisa PUBLIC_REVIEWS_CHANNEL_ID).", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Resena de ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTitle("✨ Nuevo vouch")
      .setDescription("¡Gracias por tu feedback!")
      .addFields(
        { name: "👤 Cliente", value: `${interaction.user}`, inline: true },
        { name: "🏆 Calificacion", value: "⭐".repeat(calificacion), inline: true },
        { name: "📦 Producto", value: producto, inline: true },
        { name: "🛍️ Vendedor", value: `${vendedor}`, inline: false },
        ...(comentario ? [{ name: "⚡ Comentario", value: comentario, inline: false }] : [])
      )
      .setColor(0xffc53d)
      .setFooter({ text: "ZoneSell" })
      .setTimestamp();

    await targetChannel.send({ embeds: [embed] });

    if (targetChannel.id !== interaction.channel.id) {
      return interaction.reply({ content: `Vouch publicado en ${targetChannel}. ¡Gracias!`, ephemeral: true });
    }
    return interaction.reply({ content: "¡Gracias por tu vouch!", ephemeral: true });
  }

  // ---------- /factura ----------
  if (interaction.commandName === "factura") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tenes permiso para esto.", ephemeral: true });
    }
    const id = interaction.options.getString("id");
    await interaction.deferReply({ ephemeral: true });

    try {
      const order = await getOrder(id);
      if (!order || !order.id) {
        return interaction.editReply(`No encontre ninguna factura con ID "${id}".`);
      }

      const items = (order.items || []).map((i) => `${i.product_title} x${i.quantity}`).join("\n") || "—";
      const fecha = order.created_at
        ? new Date(order.created_at * 1000 || order.created_at).toLocaleString("es-ES")
        : "—";

      const embed = new EmbedBuilder()
        .setTitle("🧾 Lookup de factura")
        .addFields(
          { name: "ID", value: `\`${order.id}\``, inline: false },
          { name: "Estado", value: order.status || "—", inline: true },
          { name: "Metodo de pago", value: order.gateway || "—", inline: true },
          { name: "Monto", value: `$${order.total ?? "—"} ${order.currency || ""}`, inline: true },
          { name: "Fecha de compra", value: fecha, inline: false },
          { name: "Comprador", value: order.customer_email || "—", inline: false },
          { name: "Producto(s)", value: items, inline: false }
        )
        .setColor(order.status === "COMPLETED" ? 0x2ecc71 : 0x3355ff)
        .setFooter({ text: "ZoneSell • Shoppex lookup" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return interaction.editReply("No se pudo consultar esa factura. Revisa el ID y el SHOPPEX_API_KEY.");
    }
  }

  // ---------- /pedido ----------
  if (interaction.commandName === "pedido") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tenes permiso para esto.", ephemeral: true });
    }
    const email = interaction.options.getString("email");
    await interaction.deferReply({ ephemeral: true });

    try {
      const orders = await listOrdersByEmail(email);
      const list = Array.isArray(orders) ? orders : orders.items || [];

      if (list.length === 0) {
        return interaction.editReply(`No encontre pedidos para ${email}.`);
      }

      const embed = new EmbedBuilder().setTitle(`Pedidos de ${email}`).setColor(0x3355ff);

      for (const o of list.slice(0, 5)) {
        const items = (o.items || []).map((i) => `${i.product_title} x${i.quantity}`).join(", ");
        embed.addFields({
          name: `#${(o.uniqid || o.id || "").slice(-6)} — ${o.status}`,
          value: `${items}\nTotal: $${o.total}`,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return interaction.editReply("No se pudo consultar la API de Shoppex. Revisa SHOPPEX_API_KEY.");
    }
  }
});

// ---------- Seguimiento de actividad en tickets (para el auto-cierre) ----------
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (!isTicketChannel(message.channel)) return;
  lastActivity.set(message.channel.id, Date.now());
  warnedInactive.delete(message.channel.id);
});

// ---------- Auto-cierre por inactividad ----------
setInterval(async () => {
  if (!TICKET_CATEGORY_ID) return;
  for (const guild of client.guilds.cache.values()) {
    const ticketChannels = guild.channels.cache.filter((c) => c.parentId === TICKET_CATEGORY_ID);
    for (const channel of ticketChannels.values()) {
      const last = lastActivity.get(channel.id) || channel.createdTimestamp;
      const hoursSince = (Date.now() - last) / (1000 * 60 * 60);

      if (hoursSince >= INACTIVITY_HOURS + 1) {
        await closeTicket(channel, "auto (inactividad)");
      } else if (hoursSince >= INACTIVITY_HOURS && !warnedInactive.has(channel.id)) {
        warnedInactive.add(channel.id);
        await channel
          .send("⏳ Este ticket lleva mucho tiempo sin actividad. Se va a cerrar solo en 1 hora si nadie escribe.")
          .catch(() => {});
      }
    }
  }
}, 30 * 60 * 1000);

client.once("clientReady", () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
