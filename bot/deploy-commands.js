require('dotenv').config();

const {
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const modes = ['crystal', 'axe', 'nethpot', 'sword', 'uhc', 'pot', 'smp', 'mace'];

const modeChoices = modes.map(m => ({
  name: m.toUpperCase(),
  value: m
}));

const tierChoices = [
  'HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'
].map(t => ({ name: t, value: t }));

const commands = [

  new SlashCommandBuilder()
    .setName('next')
    .setDescription('Call next player')
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Gamemode')
        .setRequired(true)
        .addChoices(...modeChoices)
    ),

  new SlashCommandBuilder()
    .setName('tester')
    .setDescription('Set tester status')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Online/Offline')
        .setRequired(true)
        .addChoices(
          { name: 'ONLINE', value: 'online' },
          { name: 'OFFLINE', value: 'offline' }
        )
    )
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Gamemode')
        .setRequired(true)
        .addChoices(...modeChoices)
    ),

  new SlashCommandBuilder()
    .setName('result')
    .setDescription('Post test result')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Player')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Gamemode')
        .setRequired(true)
        .addChoices(...modeChoices)
    )
    .addStringOption(opt =>
      opt.setName('tier')
        .setDescription('Tier')
        .setRequired(true)
        .addChoices(...tierChoices)
    )

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// 🔥 IMPORTANT: USE GUILD ID FOR INSTANT COMMANDS
(async () => {
  try {
    console.log('🔄 Registering commands (guild)...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID // ⚠️ REQUIRED
      ),
      { body: commands }
    );

    console.log('✅ Commands registered INSTANTLY!');
  } catch (err) {
    console.error(err);
  }
})();