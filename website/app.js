function renderTopbar(active = "") {
  return `
    <div class="topbar">
      <div class="top-left">
        <a class="discord-btn" href="${TIERLABS_DISCORD}" target="_blank" rel="noopener noreferrer">Join Discord</a>
        <div class="brand">TierLabs</div>
      </div>
      <div class="nav">
        <a href="index.html" ${active === "rankings" ? 'style="color:#fff"' : ""}>Rankings</a>
        <a href="howtotest.html" ${active === "howtotest" ? 'style="color:#fff"' : ""}>How to Test</a>
        <a href="announcements.html" ${active === "announcements" ? 'style="color:#fff"' : ""}>Announcements</a>
        <a href="testers.html" ${active === "testers" ? 'style="color:#fff"' : ""}>Top Testers</a>
        <a href="admin.html" ${active === "admin" ? 'style="color:#fff"' : ""}>Admin</a>
      </div>
    </div>
  `;
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
  for (const mode in tiers) total += map[tiers[mode]] || 0;
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
    return (aBest === -1 ? 999 : aBest) - (bBest === -1 ? 999 : bBest);
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

function renderTopPlayerCard(player, rank) {
  const avatarUrl = getPlayerAvatarUrl(player.username, player.skin);
  const bestTier = getBestTier(player.tiers);
  const points = getPlayerPoints(player.tiers);
  const cls = rank === 1 ? "top-gold" : rank === 2 ? "top-silver" : "top-bronze";

  return `
    <div class="card top-player-card ${cls}">
      <div class="top-player-head">
        <div class="player-avatar">
          <img src="${avatarUrl}" alt="${player.username}" onerror="this.parentNode.innerHTML='${getFallbackAvatarLetter(player.username)}'">
        </div>
        <div>
          <div class="top-player-rank">#${rank}</div>
          <div><strong>${player.username}</strong></div>
          <div class="muted">${player.title || "Ranked Player"}</div>
        </div>
      </div>
      <div class="top-player-points">${points} Points • ${bestTier}</div>
    </div>
  `;
}

function renderRankRow(player, rank) {
  const avatarUrl = getPlayerAvatarUrl(player.username, player.skin);
  const points = getPlayerPoints(player.tiers);
  const bestTier = getBestTier(player.tiers);

  const regionClass = player.region === "EU" ? "region-eu" : "region-na";
  const regionText = player.region || "NA";

  const tierBadges = Object.entries(player.tiers || {}).map(([mode, tier]) => `
    <span class="tier-badge">
      <span>${getModeIcon(mode)}</span>
      <span>${tier}</span>
    </span>
  `).join("");

  const rankClass = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "rank-other";

  return `
    <div class="rank-row">
      <div class="rank-badge ${rankClass}">${rank}.</div>

      <div class="player-cell">
        <div class="player-avatar">
          <img src="${avatarUrl}" alt="${player.username}" onerror="this.parentNode.innerHTML='${getFallbackAvatarLetter(player.username)}'">
        </div>
        <div class="player-main">
          <div class="player-name">${player.username}</div>
          <div class="player-sub">${player.title || "Ranked Player"} (${points} points • ${bestTier})</div>
        </div>
      </div>

      <div>
        <span class="region-badge ${regionClass}">${regionText}</span>
      </div>

      <div class="tier-badges">
        ${tierBadges || `<span class="muted">No tiers</span>`}
      </div>
    </div>
  `;
}