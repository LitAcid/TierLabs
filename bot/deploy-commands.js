require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const modes = ["crystal", "axe", "nethpot", "sword", "uhc", "pot", "smp"];
const modeChoices = modes.map((m) => ({ name: m.toUpperCase(), value: m }));
const tierChoices = [
  "HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"
].map((t) => ({ name: t, value: t }));

const commands = [
  new SlashCommandBuilder()
    .setName("tester")
    .setDescription("Set tester status")
    .addStringOption((opt) =>
      opt.setName("action")
        .setDescription("Online or offline")
        .setRequired(true)
        .addChoices(
          { name: "ONLINE", value: "online" },
          { name: "OFFLINE", value: "offline" }
        )
    )
    .addStringOption((opt) =>
      opt.setName("mode")
        .setDescription("Gamemode")
        .setRequired(true)
        .addChoices(...modeChoices)
    ),

  new SlashCommandBuilder()
    .setName("next")
    .setDescription("Call next player")
    .addStringOption((opt) =>
      opt.setName("mode")
        .setDescription("Gamemode")
        .setRequired(true)
        .addChoices(...modeChoices)
    ),

  new SlashCommandBuilder()
    .setName("result")
    .setDescription("Post test result")
    .addUserOption((opt) =>
      opt.setName("user")
        .setDescription("Player")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("mode")
        .setDescription("Gamemode")
        .setRequired(true)
        .addChoices(...modeChoices)
    )
    .addStringOption((opt) =>
      opt.setName("tier")
        .setDescription("Tier")
        .setRequired(true)
        .addChoices(...tierChoices)
    )
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registering commands...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Commands registered.");
  } catch (err) {
    console.error(err);
  }
})();