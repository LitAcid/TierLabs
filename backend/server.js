const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return {};
    }

    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("Failed to load data:", error);
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

app.get("/", (req, res) => {
  res.send("TierLabs Backend Running");
});

app.get("/data", (req, res) => {
  res.json(loadData());
});

app.get("/players", (req, res) => {
  res.json(loadData());
});

app.get("/player/name/:username", (req, res) => {
  const data = loadData();
  const username = req.params.username.toLowerCase();

  const player = Object.values(data).find(
    (entry) => (entry.username || "").toLowerCase() === username
  );

  res.json(player || null);
});

app.post("/result", (req, res) => {
  try {
    const { userId, username, mode, tier } = req.body;

    if (!userId || !username || !mode || !tier) {
      return res.status(400).json({
        success: false,
        error: "Missing one of: userId, username, mode, tier"
      });
    }

    const data = loadData();

    if (!data[userId]) {
      data[userId] = {
        userId,
        username,
        tiers: {}
      };
    }

    data[userId].username = username;
    data[userId].tiers[mode] = tier;

    saveData(data);

    console.log("Saved result:", { userId, username, mode, tier });

    return res.json({
      success: true
    });
  } catch (error) {
    console.error("POST /result failed:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});