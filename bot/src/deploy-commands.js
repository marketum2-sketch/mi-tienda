import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder().setName("ticket").setDescription("Abre un ticket de soporte"),
  new SlashCommandBuilder()
    .setName("estado")
    .setDescription("Consulta el estado de un pedido")
    .addStringOption((opt) =>
      opt.setName("pedido").setDescription("ID corto del pedido (los ultimos 6 caracteres)").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("entregar")
    .setDescription("(Staff) Entrega manualmente un pedido")
    .addStringOption((opt) => opt.setName("pedido").setDescription("ID del pedido").setRequired(true)),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

const data = await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
  { body: commands }
);

console.log(`Registrados ${data.length} comandos.`);
