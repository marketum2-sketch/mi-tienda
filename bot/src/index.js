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
import { listOrdersByEmail, listOrders } from "./shoppex.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
const OWNER_ID = process.env.OWNER_DISCORD_ID;

function isStaff(interaction) {
  return !STAFF_ROLE_ID || interaction.member.roles.cache.has(STAFF_ROLE_ID);
}

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton() && interaction.customId === "close_ticket") {
    await interaction.reply("Cerrando ticket en 5 segundos...");
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_reason_select") {
    const reasonLabels = {
      comprar: "Comprar",
      estado: "Estado de pedido",
      soporte: "Soporte",
      reposicion: "Reposicion",
      entrega: "Entrega manual",
      otro: "Otro motivo",
    };
    const reasonKey = interaction.values[0];
    const reasonLabel = reasonLabels[reasonKey] || "Otro motivo";

    const guild = interaction.guild;
    const channelName = `${reasonKey}-${interaction.user.username}`.toLowerCase().slice(0, 90);
    const existing = guild.channels.cache.find((c) => c.name === channelName);
    if (existing) {
      return interaction.reply({ content: `Ya tenes un ticket abierto: ${existing}`, ephemeral: true });
    }

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID || undefined,
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

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("close_ticket").setLabel("Cerrar ticket").setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle(`Ticket: ${reasonLabel}`)
      .setDescription(`Motivo: **${reasonLabel}**\n\nContanos que necesitas, el staff te atiende pronto.`)
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
            { name: "Motivo", value: reasonLabel, inline: true },
            { name: "Canal", value: `${channel}`, inline: false }
          )
          .setColor(0x3355ff)
          .setFooter({ text: "ZoneSell" })
          .setTimestamp();
        await owner.send({ embeds: [dmEmbed] });
      } catch {
        // Si el owner tiene los DMs cerrados, no pasa nada, ya tiene acceso al canal.
      }
    }

    return interaction.reply({ content: `Ticket creado: ${channel}`, ephemeral: true });
  }

  if (!interaction.isChatInputCommand()) return;

  // ---------- /ticket ----------
  if (interaction.commandName === "ticket") {
    const guild = interaction.guild;
    const existing = guild.channels.cache.find(
      (c) => c.name === `ticket-${interaction.user.username}`.toLowerCase()
    );
    if (existing) {
      return interaction.reply({ content: `Ya tenes un ticket abierto: ${existing}`, ephemeral: true });
    }

    const channel = await guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID || undefined,
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

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("close_ticket").setLabel("Cerrar ticket").setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `<@${interaction.user.id}>${OWNER_ID ? ` <@${OWNER_ID}>` : ""} bienvenido, contanos en que te ayudamos.`,
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
            { name: "Canal", value: `${channel}`, inline: true }
          )
          .setColor(0x3355ff)
          .setFooter({ text: "ZoneSell" })
          .setTimestamp();
        await owner.send({ embeds: [dmEmbed] });
      } catch {
        // Si el owner tiene los DMs cerrados, no pasa nada, ya tiene acceso al canal.
      }
    }

    return interaction.reply({ content: `Ticket creado: ${channel}`, ephemeral: true });
  }

  // ---------- /panel ----------
  if (interaction.commandName === "panel") {
    if (!isStaff(interaction)) {
      return interaction.reply({ content: "No tenes permiso para esto.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: "ZoneSell", iconURL: interaction.guild.iconURL() || undefined })
      .setTitle("🛍️ Centro de soporte")
      .setDescription("**Bienvenido.** Elegi abajo la categoria que mejor describe por que abris el ticket.\n⚡ Respuesta rapida · 🔒 Atencion privada")
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
      const topProducts = Object.entries(byProduct)
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
    const mensaje = interaction.options.getString("mensaje") || "Te hemos respondido, revisa el mensaje cuando puedas.";

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

      const embed = new EmbedBuilder()
        .setTitle(`Pedidos de ${email}`)
        .setColor(0x3355ff);

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

client.once("clientReady", () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
