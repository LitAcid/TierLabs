const TIERLABS_DISCORD = "https://discord.gg/aRbCqpq9N5";
const ADMIN_PASSWORD = "tierlabs2580";

const DEFAULT_DATA = {
  players: [],
  announcements: [
    {
      title: "TierLabs Website Live",
      body: "TierLabs is now online with rankings, announcements, top testers, and admin tools.",
      date: "2026-03-28"
    }
  ],
  testers: [
    {
      name: "Lead Tester",
      avatar: "",
      completed: 150,
      specialty: "Sword / Pot"
    }
  ]
};

function cloneData(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadSiteData() {
  const raw = localStorage.getItem("tierlabs_data");

  if (!raw) {
    const fresh = cloneData(DEFAULT_DATA);
    localStorage.setItem("tierlabs_data", JSON.stringify(fresh));
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!parsed.players) parsed.players = [];
    if (!parsed.announcements) parsed.announcements = [];
    if (!parsed.testers) parsed.testers = [];

    return parsed;
  } catch (err) {
    const fresh = cloneData(DEFAULT_DATA);
    localStorage.setItem("tierlabs_data", JSON.stringify(fresh));
    return fresh;
  }
}

function saveSiteData(data) {
  localStorage.setItem("tierlabs_data", JSON.stringify(data));
}

function getTierPointsMap() {
  return {
    HT1: 60,
    LT1: 54,
    HT2: 48,
    LT2: 42,
    HT3: 36,
    LT3: 30,
    HT4: 24,
    LT4: 18,
    HT5: 12,
    LT5: 6
  };
}

function getTierOrder() {
  return ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];
}

function getPlayerPoints(tiers = {}) {
  const map = getTierPointsMap();
  let total = 0;

  for (const mode in tiers) {
    total += map[tiers[mode]] || 0;
  }

  return total;
}

function getBestTier(tiers = {}) {
  const order = getTierOrder();
  let best = null;
  let bestIndex = 999;

  for (const mode in tiers) {
    const idx = order.indexOf(tiers[mode]);
    if (idx !== -1 && idx < bestIndex) {
      bestIndex = idx;
      best = tiers[mode];
    }
  }

  return best || "UNRANKED";
}

function sortPlayersByPoints(players) {
  const order = getTierOrder();

  return [...players].sort((a, b) => {
    const pointDiff = getPlayerPoints(b.tiers) - getPlayerPoints(a.tiers);
    if (pointDiff !== 0) return pointDiff;

    const aBest = order.indexOf(getBestTier(a.tiers));
    const bBest = order.indexOf(getBestTier(b.tiers));
    return (aBest === -1 ? 999 : aBest === undefined ? 999 : aBest) - (bBest === -1 ? 999 : bBest === undefined ? 999 : bBest);
  });
}

function getModeIcon(mode) {
  const map = {
    overall: "🏆",
    ltms: "⚔",
    vanilla: "⬡",
    uhc: "❤",
    pot: "🧪",
    nethpot: "◐",
    smp: "◉",
    sword: "🗡",
    axe: "🪓",
    mace: "🔨",
    crystal: "✦"
  };
  return map[mode] || "•";
}

function getPlayerAvatarUrl(username, skinUrl = "") {
  if (skinUrl && skinUrl.trim()) return skinUrl;
  return `https://mc-heads.net/avatar/${encodeURIComponent(username)}/64`;
}

function getFallbackAvatarLetter(name) {
  return (name || "?").charAt(0).toUpperCase();
}