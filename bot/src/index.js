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
import { SERVER_STRUCTURE, SERVER_ROLES } from "./serverStructure.js";

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
  if (STAFF_ROLE_ID && interaction.member.roles.cache.has(STAFF_ROLE_ID)) return true;
  return interaction.member.roles.cache.some((r) => ["🛠️ Staff", "🎫 Support"].includes(r.name));
}

const reasonLabels = {
  purchase: "Purchase",
  status: "Order status",
  support: "Support",
  replacement: "Replacement",
  delivery: "Manual delivery",
  other: "Other",
};

// channelId -> timestamp del ultimo mensaje visto (en memoria, se resetea si el bot reinicia)
const lastActivity = new Map();
// channelId -> ya se le mando el aviso de "se va a cerrar por inactividad"
const warnedInactive = new Set();

function isTicketChannel(channel) {
  return TICKET_CATEGORY_ID && channel.parentId === TICKET_CATEGORY_ID;
}

const STATUS_EMOJI = {
  COMPLETED: "✅",
  PAID: "✅",
  PENDING: "⏳",
  FAILED: "❌",
  EXPIRED: "⌛",
  REFUNDED: "↩️",
  CANCELLED: "🚫",
};

function statusLabel(status) {
  if (!status) return "—";
  const emoji = STATUS_EMOJI[status] || "❔";
  return `${emoji} ${status}`;
}

function money(amount, currency) {
  if (amount == null) return "—";
  const symbol = { USD: "$", EUR: "€", GBP: "£" }[currency] || "";
  return `${symbol}${amount} ${symbol ? "" : currency || ""}`.trim();
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
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const existing = guild.channels.cache.find((c) => c.name === channelName);
  if (existing) {
    await interaction.editReply({ content: `You already have an open ticket: ${existing}` });
    return;
  }

  const supportRoleIds = guild.roles.cache
    .filter((r) => ["🛠️ Staff", "🎫 Support"].includes(r.name))
    .map((r) => r.id);

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
      ...supportRoleIds.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] })),
      ...(OWNER_ID
        ? [{ id: OWNER_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
        : []),
    ],
  });

  lastActivity.set(channel.id, Date.now());

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("close_ticket").setLabel("Close ticket").setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle(reasonLabel ? `Ticket: ${reasonLabel}` : "Support ticket")
    .setDescription(
      `${reasonLabel ? `Reason: **${reasonLabel}**\n\n` : ""}Tell us what you need, staff will be with you shortly.`
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

  await interaction.editReply({ content: `Ticket created: ${channel}` });
}

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton() && interaction.customId === "close_ticket") {
    await interaction.reply("Closing this ticket in 5 seconds...");
    setTimeout(() => closeTicket(interaction.channel, interaction.user.tag), 5000);
    return;
  }

  // ---------- Menu de motivos del panel ----------
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_reason_select") {
    const reasonKey = interaction.values[0];
    const reasonLabel = reasonLabels[reasonKey] || "Other";
    const channelName = `${reasonKey}-${interaction.user.username}`.toLowerCase().slice(0, 90);
    return createTicketChannel(interaction, channelName, reasonLabel);
  }

  if (!interaction.isChatInputCommand()) return;

  // ---------- /ticket ----------
  if (interaction.commandName === "ticket") {
    const channelName = `ticket-${interaction.user.username}`.toLowerCase();
    return createTicketChannel(interaction, channelName, null);
  }

  // ---------- /editar-mensaje ----------
  if (interaction.commandName === "editar-mensaje") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tienes permiso para esto.", ephemeral: true });
    }
    const canal = interaction.options.getChannel("canal") || interaction.channel;
    const texto = interaction.options.getString("texto");
    const idMensaje = interaction.options.getString("id_mensaje");

    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder().setDescription(texto).setColor(0x3355ff);

    try {
      if (idMensaje) {
        const msg = await canal.messages.fetch(idMensaje);
        if (msg.author.id !== client.user.id) {
          return interaction.editReply("Ese mensaje no lo escribio el bot, no lo puedo editar.");
        }
        await msg.edit({ embeds: [embed] });
        return interaction.editReply(`Mensaje editado en ${canal}.`);
      }
      const sent = await canal.send({ embeds: [embed] });
      return interaction.editReply(
        `Mensaje publicado en ${canal}.\nID: \`${sent.id}\` (guardalo si despues queres editarlo con este mismo comando)`
      );
    } catch (err) {
      console.error(err);
      return interaction.editReply("No se pudo publicar/editar el mensaje. Revisa el canal y el ID.");
    }
  }

  // ---------- /panel ----------
  if (interaction.commandName === "panel") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tienes permiso para esto.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "ZoneSell", iconURL: interaction.guild.iconURL() || undefined })
      .setTitle("🛍️ Support center")
      .setDescription(
        "**Welcome.** Pick the category below that best describes why you're opening a ticket.\n⚡ Fast response · 🔒 Private support"
      )
      .addFields(
        { name: "🛒 Purchase", value: "Check availability or pricing.", inline: true },
        { name: "📊 Order status", value: "Track your purchase.", inline: true },
        { name: "🛠️ Support", value: "General questions.", inline: true },
        { name: "🔄 Replacement", value: "Product failed or expired.", inline: true },
        { name: "📦 Manual delivery", value: "Didn't receive your order.", inline: true },
        { name: "❓ Other", value: "Anything else.", inline: true }
      )
      .setColor(0x7c5cff)
      .setThumbnail(interaction.guild.iconURL({ size: 256 }) || null)
      .setFooter({ text: "ZoneSell • Ticket system" })
      .setTimestamp();

    const select = new StringSelectMenuBuilder()
      .setCustomId("ticket_reason_select")
      .setPlaceholder("Select a reason to open your ticket")
      .addOptions(
        { label: "Purchase", value: "purchase", emoji: "🛒" },
        { label: "Order status", value: "status", emoji: "📊" },
        { label: "Support", value: "support", emoji: "🛠️" },
        { label: "Replacement", value: "replacement", emoji: "🔄" },
        { label: "Manual delivery", value: "delivery", emoji: "📦" },
        { label: "Other", value: "other", emoji: "❓" }
      );

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: "Panel publicado.", ephemeral: true });
  }

  // ---------- /transferir ----------
  if (interaction.commandName === "transferir") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tienes permiso para esto.", ephemeral: true });
    }
    if (!isTicketChannel(interaction.channel)) {
      return interaction.reply({ content: "Este comando solo funciona dentro de un ticket.", ephemeral: true });
    }

    const nuevo = interaction.options.getUser("usuario");
    await interaction.deferReply({ ephemeral: true });

    await interaction.channel.permissionOverwrites.edit(nuevo.id, {
      ViewChannel: true,
      SendMessages: true,
    });

    const embed = new EmbedBuilder()
      .setDescription(`🔁 This ticket was transferred from ${interaction.user} to ${nuevo}.`)
      .setColor(0x3355ff);
    await interaction.channel.send({ embeds: [embed] });

    try {
      await nuevo.send(`🔁 ${interaction.user.tag} te paso un ticket: ${interaction.channel}`);
    } catch {
      // DMs cerrados, no pasa nada, ya tiene acceso al canal.
    }

    return interaction.editReply({ content: `Ticket transferido a ${nuevo.tag}.` });
  }

  // ---------- /reclamar ----------
  if (interaction.commandName === "reclamar") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tienes permiso para esto.", ephemeral: true });
    }
    if (!isTicketChannel(interaction.channel)) {
      return interaction.reply({ content: "Este comando solo funciona dentro de un ticket.", ephemeral: true });
    }
    const embed = new EmbedBuilder()
      .setDescription(`🙋 This ticket was claimed by ${interaction.user}. You're being helped directly now.`)
      .setColor(0x3355ff);
    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: "Ticket reclamado.", ephemeral: true });
  }

  // ---------- /cerrar-todos ----------
  if (interaction.commandName === "cerrar-todos") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tienes permiso para esto.", ephemeral: true });
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

    const resultEmbed = new EmbedBuilder()
      .setDescription(`🧹 Cerrados **${closedCount}** tickets inactivos hace mas de **${horas}h**.`)
      .setColor(0x3355ff);
    return interaction.editReply({ embeds: [resultEmbed] });
  }

  // ---------- /stats ----------
  if (interaction.commandName === "stats") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tienes permiso para esto.", ephemeral: true });
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
        .setAuthor({ name: "ZoneSell", iconURL: interaction.guild.iconURL() || undefined })
        .setTitle("📊 Estadisticas de la tienda")
        .addFields(
          { name: "💰 Ingresos totales", value: `$${totalRevenue.toFixed(2)}`, inline: true },
          { name: "✅ Pedidos completados", value: `${totalOrders}`, inline: true },
          { name: "\u200B", value: "\u200B", inline: true },
          { name: "🏆 Top productos", value: topProducts, inline: false }
        )
        .setColor(0x3355ff)
        .setFooter({ text: "ZoneSell • Shoppex lookup" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return interaction.editReply("No se pudo consultar la API de Shoppex. Revisa SHOPPEX_API_KEY.");
    }
  }

  // ---------- /timer ----------
  if (interaction.commandName === "timer") {
    const minutos = interaction.options.getInteger("minutes") ?? 10;

    const startEmbed = new EmbedBuilder()
      .setDescription(`⏱️ Timer started: **${minutos} minute${minutos === 1 ? "" : "s"}**`)
      .setColor(0x3355ff);
    await interaction.reply({ embeds: [startEmbed] });

    setTimeout(async () => {
      try {
        const doneEmbed = new EmbedBuilder()
          .setDescription(`⏰ <@${interaction.user.id}> your **${minutos} minute${minutos === 1 ? "" : "s"}** are up.`)
          .setColor(0xffc53d);
        await interaction.followUp({ embeds: [doneEmbed] });
      } catch {
        // El canal pudo haberse borrado o el bot perdio acceso, no pasa nada.
      }
    }, minutos * 60 * 1000);
    return;
  }

  // ---------- /notificar ----------
  if (interaction.commandName === "notificar") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tienes permiso para esto.", ephemeral: true });
    }
    const user = interaction.options.getUser("usuario");
    const mensaje =
      interaction.options.getString("mensaje") || "We've replied to you, check the message when you can.";

    const embed = new EmbedBuilder()
      .setAuthor({ name: "ZoneSell | Notification" })
      .setTitle("📩 New notification")
      .addFields(
        { name: "From", value: `${interaction.user}`, inline: true },
        { name: "Channel", value: `${interaction.channel}`, inline: true },
        { name: "Message", value: mensaje, inline: false }
      )
      .setColor(0x3355ff)
      .setFooter({ text: "ZoneSell" })
      .setTimestamp();

    await interaction.deferReply({ ephemeral: true });

    try {
      await user.send({ embeds: [embed] });
      return interaction.editReply({ content: `Aviso enviado a ${user.tag}.` });
    } catch {
      return interaction.editReply({
        content: `No se pudo enviar el DM a ${user.tag} (puede tener los mensajes privados cerrados).`,
      });
    }
  }

  // ---------- /eliminar-todo ----------
  if (interaction.commandName === "eliminar-todo") {
    if (OWNER_ID && interaction.user.id !== OWNER_ID) {
      return interaction.reply({ content: "Solo el owner puede correr esto.", ephemeral: true });
    }

    const confirmacion = interaction.options.getString("confirmar");
    if (confirmacion !== "ELIMINAR TODO") {
      return interaction.reply({
        content: 'No se borro nada. Para confirmar de verdad, corre el comando de nuevo y en "confirmar" escribi exactamente: `ELIMINAR TODO`',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const channels = guild.channels.cache.filter((c) => c.id !== interaction.channel.id);
    let deleted = 0;

    for (const channel of channels.values()) {
      await channel.delete().catch(() => {});
      deleted++;
      if (deleted % 10 === 0) {
        await interaction.editReply(`Eliminando canales... ${deleted}/${channels.size}`).catch(() => {});
      }
    }

    const doneEmbed = new EmbedBuilder()
      .setDescription(
        `🗑️ Se eliminaron **${deleted}** canales/categorias. Deje este canal (${interaction.channel}) sin borrar para poder confirmarte; lo puedes borrar tú a mano si queres.`
      )
      .setColor(0xff5c5c);
    return interaction.editReply({ embeds: [doneEmbed] });
  }

  // ---------- /setup-servidor ----------
  if (interaction.commandName === "setup-servidor") {
    if (OWNER_ID && interaction.user.id !== OWNER_ID) {
      return interaction.reply({ content: "Solo el owner puede correr esto.", ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;

    // ---- Roles ----
    const roleIds = {};
    for (const roleDef of SERVER_ROLES) {
      const existing = guild.roles.cache.find((r) => r.name === roleDef.name);
      if (existing) {
        roleIds[roleDef.key] = existing.id;
        continue;
      }
      const role = await guild.roles.create({
        name: roleDef.name,
        color: roleDef.color,
        hoist: roleDef.hoist,
        permissions: roleDef.permissions.map((p) => PermissionFlagsBits[p]),
      });
      roleIds[roleDef.key] = role.id;
    }

    // ---- Categorias y canales, sin tocar permisos ----
    let created = 0;
    let ticketCategoryId = null;

    for (const cat of SERVER_STRUCTURE) {
      let category = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === cat.category
      );
      if (!category) {
        category = await guild.channels.create({ name: cat.category, type: ChannelType.GuildCategory });
        created++;
      }

      if (cat.ticketCategory) ticketCategoryId = category.id;

      for (const ch of cat.channels) {
        let channel = guild.channels.cache.find((c) => c.parentId === category.id && c.name === ch.name);
        const isNew = !channel;

        if (!channel) {
          channel = await guild.channels.create({
            name: ch.name,
            type: ch.type === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText,
            parent: category.id,
          });
          created++;
        }

        if (isNew && ch.message) {
          const msgEmbed = new EmbedBuilder().setDescription(ch.message).setColor(0x3355ff);
          await channel.send({ embeds: [msgEmbed] }).catch(() => {});
        }
      }
    }

    const warnings = [];
    if (ticketCategoryId) warnings.push(`\`TICKET_CATEGORY_ID=${ticketCategoryId}\``);
    if (!STAFF_ROLE_ID) warnings.push(`\`STAFF_ROLE_ID=${roleIds.staff}\` (recien creado, no lo teniamos)`);

    const doneEmbed = new EmbedBuilder()
      .setDescription(
        `✅ Listo. Se crearon **${created}** elementos nuevos (categorias + canales), sin tocar ningun permiso.\n\n` +
          `Roles creados/reusados: <@&${roleIds.founder}> <@&${roleIds.staff}> <@&${roleIds.verified}> <@&${roleIds.customer}> <@&${roleIds.moderator}> <@&${roleIds.support}> <@&${roleIds.bots}> <@&${roleIds.partner}>` +
          (warnings.length
            ? `\n\n⚠️ **Importante:** actualiza en Railway (servicio bot, Variables):\n${warnings.join("\n")}`
            : "")
      )
      .setColor(0x2ecc71);
    return interaction.editReply({ content: null, embeds: [doneEmbed] });
  }

  // ---------- /invitar ----------
  if (interaction.commandName === "invitar") {
    await interaction.deferReply({ ephemeral: true });
    try {
      const invite = await interaction.channel.createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: true,
      });
      const embed = new EmbedBuilder()
        .setDescription(
          `🔗 Your personal invite link:\n**https://discord.gg/${invite.code}**\n\nEveryone who joins with this link counts toward your ranking. Use \`/ranking-invitados\` to see how many you've got.`
        )
        .setColor(0x3355ff);
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return interaction.editReply(
        "Couldn't create the link. The bot needs the 'Create Invite' permission in this channel."
      );
    }
  }

  // ---------- /ranking-invitados ----------
  if (interaction.commandName === "ranking-invitados") {
    await interaction.deferReply();
    try {
      const invites = await interaction.guild.invites.fetch();
      const byInviter = new Map();

      for (const inv of invites.values()) {
        if (!inv.inviter) continue;
        const current = byInviter.get(inv.inviter.id) || 0;
        byInviter.set(inv.inviter.id, current + (inv.uses || 0));
      }

      const ranking = [...byInviter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

      if (ranking.length === 0) {
        return interaction.editReply("No invites recorded yet.");
      }

      const medals = ["🥇", "🥈", "🥉"];
      const lines = ranking.map(
        ([id, uses], i) => `${medals[i] || `${i + 1}.`} <@${id}> — **${uses}** invites`
      );

      const embed = new EmbedBuilder()
        .setAuthor({ name: "ZoneSell", iconURL: interaction.guild.iconURL() || undefined })
        .setTitle("🏆 Invite leaderboard")
        .setDescription(lines.join("\n"))
        .setColor(0xffc53d)
        .setFooter({ text: "ZoneSell" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return interaction.editReply(
        "Couldn't fetch invites. The bot needs the 'Manage Server' permission."
      );
    }
  }

  // ---------- /ayuda ----------
  if (interaction.commandName === "ayuda") {
    await interaction.deferReply({ ephemeral: true });

    const registered = await interaction.guild.commands.fetch();
    const groups = { public: [], staff: [], owner: [] };

    for (const cmd of registered.values()) {
      let bucket = "public";
      if (cmd.defaultMemberPermissions) {
        bucket = cmd.defaultMemberPermissions.has(PermissionFlagsBits.Administrator) ? "owner" : "staff";
      }
      groups[bucket].push(cmd);
    }
    for (const list of Object.values(groups)) list.sort((a, b) => a.name.localeCompare(b.name));

    const fields = [];
    if (groups.public.length) {
      fields.push({ name: "👤 Anyone", value: "\u200B" });
      for (const c of groups.public) fields.push({ name: `/${c.name}`, value: c.description || "\u200B" });
    }
    if (groups.staff.length) {
      fields.push({ name: "🛠️ Staff only", value: "\u200B" });
      for (const c of groups.staff) fields.push({ name: `/${c.name}`, value: c.description || "\u200B" });
    }
    if (groups.owner.length) {
      fields.push({ name: "👑 Owner only", value: "\u200B" });
      for (const c of groups.owner) fields.push({ name: `/${c.name}`, value: c.description || "\u200B" });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "ZoneSell | Bot" })
      .setTitle("📖 Available commands")
      .addFields(fields)
      .setColor(0x3355ff)
      .setFooter({ text: "ZoneSell • Auto-generated, always up to date" });

    return interaction.editReply({ embeds: [embed] });
  }

  // ---------- /vouch ----------
  if (interaction.commandName === "vouch") {
    const vendedor = interaction.options.getUser("seller");
    const producto = interaction.options.getString("product");
    const calificacion = interaction.options.getInteger("rating");
    const comentario = interaction.options.getString("comment");

    const targetChannel = PUBLIC_REVIEWS_CHANNEL_ID
      ? await client.channels.fetch(PUBLIC_REVIEWS_CHANNEL_ID).catch(() => null)
      : interaction.channel;

    if (!targetChannel) {
      return interaction.reply({ content: "Couldn't find the reviews channel (check PUBLIC_REVIEWS_CHANNEL_ID).", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Review by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTitle("✨ New vouch")
      .setDescription("Thanks for your feedback!")
      .addFields(
        { name: "👤 Customer", value: `${interaction.user}`, inline: true },
        { name: "🏆 Rating", value: "⭐".repeat(calificacion), inline: true },
        { name: "📦 Product", value: producto, inline: true },
        { name: "🛍️ Seller", value: `${vendedor}`, inline: false },
        ...(comentario ? [{ name: "⚡ Comment", value: comentario, inline: false }] : [])
      )
      .setColor(0xffc53d)
      .setFooter({ text: "ZoneSell" })
      .setTimestamp();

    await targetChannel.send({ embeds: [embed] });

    if (targetChannel.id !== interaction.channel.id) {
      return interaction.reply({ content: `Vouch posted in ${targetChannel}. Thanks!`, ephemeral: true });
    }
    return interaction.reply({ content: "Thanks for your vouch!", ephemeral: true });
  }

  // ---------- /factura ----------
  if (interaction.commandName === "factura") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tienes permiso para esto.", ephemeral: true });
    }
    const id = interaction.options.getString("id");
    await interaction.deferReply({ ephemeral: true });

    try {
      const order = await getOrder(id);
      if (!order || !order.id) {
        return interaction.editReply(`No encontre ninguna factura con ID "${id}".`);
      }

      const items = (order.items || []).map((i) => `• ${i.product_title} \`x${i.quantity}\``).join("\n") || "—";
      const fecha = order.created_at
        ? new Date(order.created_at * 1000 || order.created_at).toLocaleString("es-ES", {
            dateStyle: "long",
            timeStyle: "short",
          })
        : "—";

      const embed = new EmbedBuilder()
        .setAuthor({ name: "ZoneSell", iconURL: interaction.guild.iconURL() || undefined })
        .setTitle("🧾 Lookup de factura")
        .addFields(
          { name: "Estado", value: statusLabel(order.status), inline: true },
          { name: "Metodo de pago", value: order.gateway || "—", inline: true },
          { name: "Monto", value: money(order.total, order.currency), inline: true },
          { name: "🗓️ Fecha de compra", value: fecha, inline: false },
          { name: "👤 Comprador", value: order.customer_email || "—", inline: false },
          { name: "📦 Producto(s)", value: items, inline: false },
          { name: "🔑 ID", value: `\`${order.id}\``, inline: false }
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
      return interaction.reply({ content: "No tienes permiso para esto.", ephemeral: true });
    }
    const email = interaction.options.getString("email");
    await interaction.deferReply({ ephemeral: true });

    try {
      const orders = await listOrdersByEmail(email);
      const list = Array.isArray(orders) ? orders : orders.items || [];

      if (list.length === 0) {
        return interaction.editReply(`No encontre pedidos para ${email}.`);
      }

      const embed = new EmbedBuilder()
        .setAuthor({ name: "ZoneSell", iconURL: interaction.guild.iconURL() || undefined })
        .setTitle(`📬 Pedidos de ${email}`)
        .setColor(0x3355ff)
        .setFooter({ text: "ZoneSell • Shoppex lookup" })
        .setTimestamp();

      for (const o of list.slice(0, 5)) {
        const items = (o.items || []).map((i) => `${i.product_title} x${i.quantity}`).join(", ");
        embed.addFields({
          name: `#${(o.uniqid || o.id || "").slice(-6)} · ${statusLabel(o.status)}`,
          value: `${items}\n💰 ${money(o.total, o.currency)}`,
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
          .send("⏳ This ticket has been inactive for a while. It will close automatically in 1 hour if no one replies.")
          .catch(() => {});
      }
    }
  }
}, 30 * 60 * 1000);

client.once("clientReady", () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
