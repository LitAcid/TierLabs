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

function exportSiteData() {
  const data = loadSiteData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "tierlabs-data.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function importSiteData(file, onDone) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      saveSiteData(parsed);
      onDone(true);
    } catch (err) {
      onDone(false);
    }
  };

  reader.readAsText(file);
}