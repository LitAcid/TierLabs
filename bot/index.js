require("http").createServer((req, res) => {
  res.write("Bot is alive");
  res.end();
}).listen(3000);

const fetch = require("node-fetch");
require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== CONFIG =====
const QUEUE_CHANNEL_ID = '1486643483757248563';
const RESULT_CHANNEL_ID = '1486644407943037039';
const TEST_CATEGORY_NAME = 'tests';

const BACKEND_URL = 'http://localhost:3000';

const modes = ['crystal', 'axe', 'nethpot', 'sword', 'uhc', 'pot', 'smp'];

// ===== DATA =====
let queues = {};
let testerStatus = {};
let activeTesterMode = null;
let queueMessage = null;

modes.forEach(m => {
  queues[m] = [];
  testerStatus[m] = false;
});

// ===== UI =====
function createRows() {
  const buttons = modes.map(mode =>
    new ButtonBuilder()
      .setCustomId(`join_${mode}`)
      .setLabel(`${mode.toUpperCase()} (${queues[mode].length})`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!testerStatus[mode])
  );

  const leaveBtn = new ButtonBuilder()
    .setCustomId('leave_queue')
    .setLabel('Leave Queue')
    .setStyle(ButtonStyle.Danger);

  const rows = [];

  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }

  rows.push(new ActionRowBuilder().addComponents(leaveBtn));

  return rows;
}

async function updateUI(channel, ping = false) {
  const status = modes.map(m =>
    `${testerStatus[m] ? '🟢' : '🔴'} ${m.toUpperCase()}`
  ).join('\n');

  let content = `🎟️ **TierLabs Queue**\n\n${status}`;

  if (ping) content = `@everyone\n` + content;

  if (queueMessage) {
    await queueMessage.edit({
      content,
      components: createRows()
    });
  } else {
    queueMessage = await channel.send({
      content,
      components: createRows()
    });
  }
}

// ===== READY =====
client.once('clientReady', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(QUEUE_CHANNEL_ID);
    console.log(`✅ Queue channel found: ${channel.name}`);
    await updateUI(channel);
  } catch (err) {
    console.error('❌ Channel fetch failed:', err);
  }
});

// ===== HELPERS =====
function removeUserFromAllQueues(userId) {
  for (let m of modes) {
    queues[m] = queues[m].filter(id => id !== userId);
  }
}

// ===== MAIN =====
client.on('interactionCreate', async interaction => {

  try {

    // ===== BUTTONS =====
    if (interaction.isButton()) {
      await interaction.deferUpdate();

      const userId = interaction.user.id;

      console.log(`🔘 ${interaction.user.tag} clicked ${interaction.customId}`);

      // LEAVE QUEUE
      if (interaction.customId === 'leave_queue') {
        removeUserFromAllQueues(userId);

        const channel = await client.channels.fetch(QUEUE_CHANNEL_ID);
        await updateUI(channel);
        return;
      }

      const mode = interaction.customId.replace('join_', '');

      if (!testerStatus[mode]) return;
      if (queues[mode].includes(userId)) return;

      removeUserFromAllQueues(userId);
      queues[mode].push(userId);

      const channel = await client.channels.fetch(QUEUE_CHANNEL_ID);
      await updateUI(channel);
    }

    // ===== COMMANDS =====
    if (interaction.isChatInputCommand()) {

      // ===== NEXT =====
      if (interaction.commandName === 'next') {
        await interaction.deferReply({ ephemeral: true });

        const mode = interaction.options.getString('mode');

        if (queues[mode].length === 0) {
          return interaction.editReply('❌ Queue empty.');
        }

        const playerId = queues[mode].shift();
        const member = await interaction.guild.members.fetch(playerId);

        const category = interaction.guild.channels.cache.find(
          c => c.name === TEST_CATEGORY_NAME && c.type === 4
        );

        const testChannel = await interaction.guild.channels.create({
          name: `test-${member.user.username}`,
          parent: category?.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
              id: member.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages
              ]
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages
              ]
            }
          ]
        });

        await testChannel.send(
          `🔔 ${member} your ${mode.toUpperCase()} test is ready!`
        );

        setTimeout(() => testChannel.delete().catch(() => {}), 120000);

        const channel = await client.channels.fetch(QUEUE_CHANNEL_ID);
        await updateUI(channel);

        return interaction.editReply(`✅ Player sent to test.`);
      }

      // ===== TESTER =====
      if (interaction.commandName === 'tester') {
        await interaction.deferReply({ ephemeral: true });

        const action = interaction.options.getString('action');
        const mode = interaction.options.getString('mode');

        const channel = await client.channels.fetch(QUEUE_CHANNEL_ID);

        if (action === 'online') {
          modes.forEach(m => testerStatus[m] = false);

          testerStatus[mode] = true;
          activeTesterMode = mode;

          await updateUI(channel, true); // 🔔 ping everyone

          return interaction.editReply(`✅ Now testing ${mode.toUpperCase()}`);
        }

        if (action === 'offline') {
          if (!activeTesterMode) {
            return interaction.editReply('❌ No active tester.');
          }

          testerStatus[activeTesterMode] = false;
          activeTesterMode = null;

          await updateUI(channel, false);

          return interaction.editReply(`🔴 Tester offline`);
        }
      }

      // ===== RESULT =====
      if (interaction.commandName === 'result') {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('user');
        const mode = interaction.options.getString('mode');
        const tier = interaction.options.getString('tier');

        const resultChannel = await client.channels.fetch(RESULT_CHANNEL_ID);

        // SEND TO DISCORD
        await resultChannel.send(
          `🏆 **Test Result**\n\n👤 ${user}\n⚔️ Mode: ${mode.toUpperCase()}\n🎯 Tier: **${tier}**`
        );

        // SEND TO BACKEND
        await fetch(`${BACKEND_URL}/result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            username: user.username,
            mode: mode,
            tier: tier
          })
        });

        return interaction.editReply('✅ Result posted & saved.');
      }

    }

  } catch (err) {
    console.error('❌ ERROR:', err);
  }
});

client.login(process.env.TOKEN);