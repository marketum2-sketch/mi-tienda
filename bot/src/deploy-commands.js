import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder().setName("ticket").setDescription("Abre un ticket de soporte privado"),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("(Staff) Publica el panel fijo para abrir tickets con menu de motivos"),

  new SlashCommandBuilder()
    .setName("reclamar")
    .setDescription("(Staff) Te asignas este ticket, usalo dentro del canal del ticket"),

  new SlashCommandBuilder()
    .setName("cerrar-todos")
    .setDescription("(Staff) Cierra tickets inactivos hace mas de X horas")
    .addIntegerOption((opt) =>
      opt.setName("horas").setDescription("Horas de inactividad (por defecto 48)").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("Deja una resena publica sobre tu compra")
    .addUserOption((opt) => opt.setName("vendedor").setDescription("Quien te atendio").setRequired(true))
    .addStringOption((opt) => opt.setName("producto").setDescription("Que compraste").setRequired(true))
    .addIntegerOption((opt) =>
      opt
        .setName("calificacion")
        .setDescription("Del 1 al 5")
        .setRequired(true)
        .addChoices(
          { name: "⭐", value: 1 },
          { name: "⭐⭐", value: 2 },
          { name: "⭐⭐⭐", value: 3 },
          { name: "⭐⭐⭐⭐", value: 4 },
          { name: "⭐⭐⭐⭐⭐", value: 5 }
        )
    )
    .addStringOption((opt) => opt.setName("comentario").setDescription("Contanos como te fue").setRequired(false)),

  new SlashCommandBuilder().setName("ayuda").setDescription("Lista todos los comandos del bot y que hacen"),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("(Staff) Muestra estadisticas de ventas de la tienda"),

  new SlashCommandBuilder()
    .setName("timer")
    .setDescription("Inicia un contador y avisa cuando termine")
    .addIntegerOption((opt) =>
      opt.setName("minutos").setDescription("Minutos (por defecto 10)").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("notificar")
    .setDescription("(Staff) Avisa por privado a alguien que le respondiste")
    .addUserOption((opt) => opt.setName("usuario").setDescription("A quien avisar").setRequired(true))
    .addStringOption((opt) =>
      opt.setName("mensaje").setDescription("Mensaje opcional, por defecto uno generico").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("factura")
    .setDescription("(Staff) Busca una compra por su ID de factura completo")
    .addStringOption((opt) => opt.setName("id").setDescription("ID de la factura (invoice)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("pedido")
    .setDescription("(Staff) Busca el estado de las compras de un cliente por email")
    .addStringOption((opt) => opt.setName("email").setDescription("Email del comprador").setRequired(true)),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

const data = await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
  { body: commands }
);

console.log(`Registrados ${data.length} comandos.`);
