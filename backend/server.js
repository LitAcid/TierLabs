const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

let players = {};

// ✅ SAVE RESULT FROM BOT
app.post("/result", (req, res) => {
  const { player, gamemode, tier } = req.body;

  if (!player || !gamemode || !tier) {
    return res.status(400).json({ error: "Missing data" });
  }

  if (!players[player]) players[player] = {};
  players[player][gamemode] = tier;

  console.log("Saved:", player, gamemode, tier);

  res.json({ success: true });
});

// ✅ GET ALL PLAYERS
app.get("/data", (req, res) => {
  res.json(players);
});

// ✅ GET SINGLE PLAYER
app.get("/player/:name", (req, res) => {
  const name = req.params.name;
  res.json(players[name] || {});
});

// ✅ ROOT (IMPORTANT FOR RENDER)
app.get("/", (req, res) => {
  res.send("TierLabs Backend Running");
});

// ✅ PORT FIX FOR RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on port " + PORT));