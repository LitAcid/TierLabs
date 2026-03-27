require("dotenv").config();

const http = require("http");
const fetch = require("node-fetch");
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("TierLabs Bot Running");
  })
  .listen(process.env.PORT || 3000);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const QUEUE_CHANNEL_ID = process.env.QUEUE_CHANNEL_ID || "1486643483757248563";
const RESULT_CHANNEL_ID = process.env.RESULT_CHANNEL_ID || "1486644407943037039";
const API_URL = process.env.API_URL || "https://tierlabs-backend.onrender.com";
const TEST_CATEGORY_NAME = "tests";

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
  const joinButtons = modes.map((mode) =>
    new ButtonBuilder()
      .setCustomId(`join_${mode}`)
      .setLabel(`${mode.toUpperCase()} (${queues[mode].length})`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!testerStatus[mode])
  );

  const leaveButton = new ButtonBuilder()
    .setCustomId("leave_queue")
    .setLabel("Leave Queue")
    .setStyle(ButtonStyle.Danger);

  const rows = [];

  for (let i = 0; i < joinButtons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(joinButtons.slice(i, i + 5)));
  }

  rows.push(new ActionRowBuilder().addComponents(leaveButton));

  return rows;
}

async function updateUI(channel, pingEveryone = false) {
  const statusLines = modes.map(
    (mode) => `${testerStatus[mode] ? "🟢" : "🔴"} ${mode.toUpperCase()}`
  );

  let content = `🎟️ **TierLabs Queue**\n\n${statusLines.join("\n")}`;
  if (pingEveryone) content = `@everyone\n${content}`;

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

function removeUserFromAllQueues(userId) {
  for (const mode of modes) {
    queues[mode] = queues[mode].filter((id) => id !== userId);
  }
}

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log("API_URL =", API_URL);

  try {
    const queueChannel = await client.channels.fetch(QUEUE_CHANNEL_ID);
    await updateUI(queueChannel);
  } catch (error) {
    console.error("Queue init failed:", error);
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

      await interaction.editReply("❌ Invalid action.");
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

      const payload = {
        userId: user.id,
        username: user.username,
        mode,
        tier
      };

      console.log("Sending payload to backend:", payload);

      const response = await fetch(`${API_URL}/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const bodyText = await response.text();
      console.log("Backend status:", response.status);
      console.log("Backend body:", bodyText);

      if (!response.ok) {
        await interaction.editReply("❌ Result posted in Discord, but backend save failed.");
        return;
      }

      await interaction.editReply("✅ Result posted and saved to website.");
      return;
    }
  } catch (error) {
    console.error("Bot error:", error);

    try {
      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("❌ Something went wrong.");
        } else {
          await interaction.reply({ content: "❌ Something went wrong.", ephemeral: true });
        }
      }
    } catch (_) {}
  }
});

client.login(process.env.TOKEN);