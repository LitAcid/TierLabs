const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const DATA_FILE = 'data.json';

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// SAVE RESULT
app.post('/result', (req, res) => {
  const { userId, username, mode, tier } = req.body;

  let data = loadData();

  if (!data[userId]) {
    data[userId] = { username, tiers: {} };
  }

  data[userId].tiers[mode] = tier;

  saveData(data);
  res.json({ success: true });
});

// GET ALL
app.get('/players', (req, res) => {
  res.json(loadData());
});

// GET BY USERNAME
app.get('/player/name/:username', (req, res) => {
  const data = loadData();

  const player = Object.values(data).find(
    p => p.username.toLowerCase() === req.params.username.toLowerCase()
  );

  res.json(player || null);
});

app.listen(PORT, () => {
  console.log(`✅ Backend running`);
});