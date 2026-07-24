import "dotenv/config";
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

const commands = [
  new SlashCommandBuilder().setName("ticket").setDescription("Abre un ticket de soporte privado"),

  new SlashCommandBuilder()
    .setName("editar-mensaje")
    .setDescription("(Staff) Publica o edita un mensaje del bot en un canal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption((opt) =>
      opt.setName("canal").setDescription("Canal donde publicar/editar").setRequired(true).addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption((opt) => opt.setName("texto").setDescription("Contenido del mensaje").setRequired(true))
    .addStringOption((opt) =>
      opt
        .setName("id_mensaje")
        .setDescription("ID de un mensaje del bot ya existente, para editarlo en vez de crear uno nuevo")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("(Staff) Publica el panel fijo para abrir tickets con menu de motivos")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("transferir")
    .setDescription("(Staff) Pasa este ticket a otra persona")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((opt) => opt.setName("usuario").setDescription("A quien se lo pasas").setRequired(true)),

  new SlashCommandBuilder()
    .setName("reclamar")
    .setDescription("(Staff) Te asignas este ticket, usalo dentro del canal del ticket")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("cerrar-todos")
    .setDescription("(Staff) Cierra tickets inactivos hace mas de X horas")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
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
    .addStringOption((opt) => opt.setName("comentario").setDescription("Cuentanos como te fue").setRequired(false)),

  new SlashCommandBuilder().setName("ayuda").setDescription("Lista todos los comandos del bot y que hacen"),

  new SlashCommandBuilder().setName("invitar").setDescription("Genera tu link de invitacion personal para el servidor"),

  new SlashCommandBuilder()
    .setName("ranking-invitados")
    .setDescription("Muestra quien ha traido mas gente al servidor con su link"),

  new SlashCommandBuilder()
    .setName("setup-servidor")
    .setDescription("(Owner) Crea toda la estructura de categorias y canales del server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("eliminar-todo")
    .setDescription("(Owner) Borra TODOS los canales y categorias del servidor. Accion irreversible.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt
        .setName("confirmar")
        .setDescription("Escribe exactamente: ELIMINAR TODO")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("(Staff) Muestra estadisticas de ventas de la tienda")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("timer")
    .setDescription("Inicia un contador y avisa cuando termine")
    .addIntegerOption((opt) =>
      opt.setName("minutos").setDescription("Minutos (por defecto 10)").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("notificar")
    .setDescription("(Staff) Avisa por privado a alguien que le respondiste")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((opt) => opt.setName("usuario").setDescription("A quien avisar").setRequired(true))
    .addStringOption((opt) =>
      opt.setName("mensaje").setDescription("Mensaje opcional, por defecto uno generico").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("factura")
    .setDescription("(Staff) Busca una compra por su ID de factura completo")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) => opt.setName("id").setDescription("ID de la factura (invoice)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("pedido")
    .setDescription("(Staff) Busca el estado de las compras de un cliente por email")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) => opt.setName("email").setDescription("Email del comprador").setRequired(true)),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

const data = await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
  { body: commands }
);

console.log(`Registrados ${data.length} comandos.`);
