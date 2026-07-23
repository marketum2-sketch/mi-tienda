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
} from "discord.js";
import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

// ---------- Utilidad: abrir un ticket para un pedido ----------
async function openOrderTicket(guild, order, product) {
  const channel = await guild.channels.create({
    name: `pedido-${order.id.slice(-6)}`,
    type: ChannelType.GuildText,
    parent: TICKET_CATEGORY_ID || undefined,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: order.discordUserId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      ...(STAFF_ROLE_ID
        ? [{ id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
        : []),
    ],
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { ticketChannelId: channel.id },
  });

  const embed = new EmbedBuilder()
    .setTitle(`Pedido #${order.id.slice(-6)}`)
    .setDescription(`Producto: **${product.name}**\nPrecio: $${order.priceUsd} USD\nEstado: **${order.status}**`)
    .setColor(0x5865f2);

  await channel.send({ content: `<@${order.discordUserId}>`, embeds: [embed] });
  return channel;
}

// ---------- Entregar producto cuando se confirma el pago ----------
async function deliverOrder(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
  if (!order) return;

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  let channel = order.ticketChannelId ? guild.channels.cache.get(order.ticketChannelId) : null;
  if (!channel) channel = await openOrderTicket(guild, order, order.product);

  const embed = new EmbedBuilder()
    .setTitle("Pago confirmado ✅")
    .setDescription(`Aqui tienes tu producto:\n\n${order.product.deliveryContent}`)
    .setColor(0x57f287);

  await channel.send({ embeds: [embed] });

  // Tambien por DM como respaldo
  try {
    const user = await client.users.fetch(order.discordUserId);
    await user.send({ embeds: [embed] });
  } catch {
    // El usuario puede tener DMs cerrados, no pasa nada, ya lo tiene en el ticket.
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });
}

// ---------- Comandos ----------
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "ticket") {
      const guild = interaction.guild;
      const existing = guild.channels.cache.find(
        (c) => c.name === `ticket-${interaction.user.username}`.toLowerCase()
      );
      if (existing) {
        return interaction.reply({ content: `Ya tienes un ticket abierto: ${existing}`, ephemeral: true });
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
        ],
      });
      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("close_ticket").setLabel("Cerrar ticket").setStyle(ButtonStyle.Danger)
      );
      await channel.send({ content: `<@${interaction.user.id}> bienvenido, el staff te atendera pronto.`, components: [closeRow] });
      return interaction.reply({ content: `Ticket creado: ${channel}`, ephemeral: true });
    }

    if (interaction.commandName === "estado") {
      const shortId = interaction.options.getString("pedido").trim().toLowerCase();
      const order = await prisma.order.findFirst({
        where: { id: { endsWith: shortId } },
        include: { product: true },
      });

      if (!order) {
        return interaction.reply({ content: `No encontre ningun pedido con ID "${shortId}".`, ephemeral: true });
      }

      const estadoTexto = {
        PENDING: "Esperando el pago",
        PAID: "Pago confirmado, preparando entrega",
        DELIVERED: "Entregado",
        EXPIRED: "Factura expirada",
        FAILED: "Fallo el pago",
      }[order.status] || order.status;

      const embed = new EmbedBuilder()
        .setTitle(`Pedido #${order.id.slice(-6).toUpperCase()}`)
        .addFields(
          { name: "Producto", value: order.product.name },
          { name: "Estado", value: estadoTexto },
          { name: "Total", value: `$${order.priceUsd.toFixed(2)} USD` }
        )
        .setColor(order.status === "DELIVERED" ? 0x57f287 : 0x5865f2);

      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === "entregar") {
      if (STAFF_ROLE_ID && !interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
        return interaction.reply({ content: "No tienes permiso.", ephemeral: true });
      }
      const orderId = interaction.options.getString("pedido");
      await deliverOrder(orderId);
      return interaction.reply({ content: `Pedido ${orderId} entregado.`, ephemeral: true });
    }
  }

  if (interaction.isButton() && interaction.customId === "close_ticket") {
    await interaction.reply("Cerrando ticket en 5 segundos...");
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
});

client.once("ready", () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

// ---------- Servidor interno: la web avisa aqui cuando un pago se confirma ----------
const app = express();
app.use(express.json());

app.post("/internal/order-paid", async (req, res) => {
  const auth = req.headers["x-internal-secret"];
  if (auth !== process.env.INTERNAL_SECRET) return res.sendStatus(401);

  const { orderId } = req.body;
  if (!orderId) return res.sendStatus(400);

  try {
    await deliverOrder(orderId);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(process.env.BOT_INTERNAL_PORT || 4001, () => {
  console.log("Servidor interno del bot escuchando");
});
