const API = "https://tierlabs-backend.onrender.com";

const tierOrder = ["HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5"];

function getBestTier(tiers) {
  let best = 999;

  for (let m in tiers) {
    let i = tierOrder.indexOf(tiers[m]);
    if (i !== -1 && i < best) best = i;
  }

  return best;
}

function icon(mode) {
  return `https://api.iconify.design/mdi/${mode}.svg`;
}

async function loadPlayers() {
  const res = await fetch(`${API}/players`);
  const data = await res.json();

  let players = Object.values(data);

  players.sort((a, b) => getBestTier(a.tiers) - getBestTier(b.tiers));

  render(players);
}

function render(players) {
  const container = document.getElementById("players");
  container.innerHTML = "";

  players.forEach(p => {
    let html = "";

    for (let m in p.tiers) {
      html += `
        <div class="mode">
          <span><img class="icon" src="${icon(m)}"> ${m}</span>
          <span class="tier">${p.tiers[m]}</span>
        </div>
      `;
    }

    container.innerHTML += `
      <div class="player" onclick="openProfile('${p.username}')">
        <h2>${p.username}</h2>
        ${html}
      </div>
    `;
  });
}

function openProfile(name) {
  window.location.href = `profile.html?user=${name}`;
}

// SEARCH
document.getElementById("search").addEventListener("input", e => {
  const value = e.target.value.toLowerCase();

  document.querySelectorAll(".player").forEach(p => {
    p.style.display = p.innerText.toLowerCase().includes(value) ? "block" : "none";
  });
});

loadPlayers();