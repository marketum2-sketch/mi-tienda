import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder().setName("ticket").setDescription("Abre un ticket de soporte privado"),

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
