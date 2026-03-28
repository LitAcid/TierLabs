require("dotenv").config();

const http = require("http");
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");

// keepalive for Render
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("TierLabs Bot Running");
}).listen(PORT, () => {
  console.log(`Keepalive server on port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

const TOKEN = process.env.TOKEN;
const QUEUE_CHANNEL_ID = process.env.QUEUE_CHANNEL_ID;
const RESULT_CHANNEL_ID = process.env.RESULT_CHANNEL_ID;
const TEST_CATEGORY_NAME = "tests";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const modes = ["crystal", "axe", "nethpot", "sword", "uhc", "pot", "smp"];
const queues = {};
const testerStatus = {};
let activeTesterMode = null;
let queueMessage = null;

for (const mode of modes) {
  queues[mode] = [];
  testerStatus[mode] = false;
}

function createRows() {
  const buttons = modes.map((mode) =>
    new ButtonBuilder()
      .setCustomId(`join_${mode}`)
      .setLabel(`${mode.toUpperCase()} (${queues[mode].length})`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!testerStatus[mode])
  );

  const leaveBtn = new ButtonBuilder()
    .setCustomId("leave_queue")
    .setLabel("Leave Queue")
    .setStyle(ButtonStyle.Danger);

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }
  rows.push(new ActionRowBuilder().addComponents(leaveBtn));
  return rows;
}

async function updateUI(channel, ping = false) {
  const status = modes.map((m) =>
    `${testerStatus[m] ? "🟢" : "🔴"} ${m.toUpperCase()}`
  ).join("\n");

  let content = `🎟️ **TierLabs Queue**\n\n${status}`;
  if (ping) content = `@everyone\n${content}`;

  if (queueMessage) {
    await queueMessage.edit({ content, components: createRows() });
  } else {
    queueMessage = await channel.send({ content, components: createRows() });
  }
}

function removeUserFromAllQueues(userId) {
  for (const mode of modes) {
    queues[mode] = queues[mode].filter((id) => id !== userId);
  }
}

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const queueChannel = await client.channels.fetch(QUEUE_CHANNEL_ID);
    await updateUI(queueChannel);
  } catch (err) {
    console.error("Queue init failed:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      await interaction.deferUpdate();
      const userId = interaction.user.id;

      if (interaction.customId === "leave_queue") {
        removeUserFromAllQueues(userId);
        const queueChannel = await client.channels.fetch(QUEUE_CHANNEL_ID);
        await updateUI(queueChannel);
        return;
      }

      const mode = interaction.customId.replace("join_", "");
      if (!modes.includes(mode)) return;
      if (!testerStatus[mode]) return;
      if (queues[mode].includes(userId)) return;

      removeUserFromAllQueues(userId);
      queues[mode].push(userId);

      const queueChannel = await client.channels.fetch(QUEUE_CHANNEL_ID);
      await updateUI(queueChannel);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "tester") {
      await interaction.deferReply({ ephemeral: true });

      const action = interaction.options.getString("action");
      const mode = interaction.options.getString("mode");
      const queueChannel = await client.channels.fetch(QUEUE_CHANNEL_ID);

      if (action === "online") {
        for (const m of modes) testerStatus[m] = false;
        testerStatus[mode] = true;
        activeTesterMode = mode;
        await updateUI(queueChannel, true);
        await interaction.editReply(`✅ Now testing ${mode.toUpperCase()}`);
        return;
      }

      if (action === "offline") {
        if (!activeTesterMode) {
          await interaction.editReply("❌ No active tester.");
          return;
        }
        testerStatus[activeTesterMode] = false;
        activeTesterMode = null;
        await updateUI(queueChannel, false);
        await interaction.editReply("🔴 Tester offline");
        return;
      }
    }

    if (interaction.commandName === "next") {
      await interaction.deferReply({ ephemeral: true });
      const mode = interaction.options.getString("mode");

      if (!mode || !modes.includes(mode)) {
        await interaction.editReply("❌ Invalid mode.");
        return;
      }

      if (queues[mode].length === 0) {
        await interaction.editReply("❌ Queue empty.");
        return;
      }

      const playerId = queues[mode].shift();
      const member = await interaction.guild.members.fetch(playerId);

      const category = interaction.guild.channels.cache.find(
        (c) => c.name === TEST_CATEGORY_NAME && c.type === 4
      );

      const testChannel = await interaction.guild.channels.create({
        name: `test-${member.user.username}`.toLowerCase(),
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

      await testChannel.send(`🔔 ${member} your ${mode.toUpperCase()} test is ready!`);
      setTimeout(() => {
        testChannel.delete().catch(() => {});
      }, 120000);

      const queueChannel = await client.channels.fetch(QUEUE_CHANNEL_ID);
      await updateUI(queueChannel);
      await interaction.editReply("✅ Player sent to test.");
      return;
    }

    if (interaction.commandName === "result") {
      await interaction.deferReply({ ephemeral: true });

      const user = interaction.options.getUser("user");
      const mode = interaction.options.getString("mode");
      const tier = interaction.options.getString("tier");

      if (!user || !mode || !tier) {
        await interaction.editReply("❌ Missing result data.");
        return;
      }

      const resultChannel = await client.channels.fetch(RESULT_CHANNEL_ID);
      await resultChannel.send(
        `🏆 **Test Result**\n\n👤 ${user}\n⚔️ Mode: ${mode.toUpperCase()}\n🎯 Tier: **${tier}**`
      );

      await interaction.editReply("✅ Result posted.");
      return;
    }
  } catch (err) {
    console.error("Interaction error:", err);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply("❌ Something went wrong.");
      } else {
        await interaction.reply({ content: "❌ Something went wrong.", ephemeral: true });
      }
    } catch {}
  }
});

console.log("Attempting Discord login...");
client.login(TOKEN).catch((err) => {
  console.error("Discord login failed:", err);
});