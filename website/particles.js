function initParticles() {
  const canvas = document.getElementById("particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let rain = [];
  let flashes = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    resetRain();
  }

  function resetRain() {
    rain = [];
    for (let i = 0; i < 160; i++) {
      rain.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 10 + Math.random() * 18,
        speed: 8 + Math.random() * 9,
        alpha: 0.05 + Math.random() * 0.18,
        width: 0.7 + Math.random() * 1.3
      });
    }
  }

  function spawnFlash() {
    flashes.push({
      x: Math.random() * w,
      life: 1
    });
  }

  function drawRain() {
    for (const d of rain) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y + d.len);
      ctx.strokeStyle = `rgba(255,255,255,${d.alpha})`;
      ctx.lineWidth = d.width;
      ctx.stroke();

      d.y += d.speed;
      if (d.y > h + 20) {
        d.y = -20;
        d.x = Math.random() * w;
      }
    }
  }

  function drawFlashes() {
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];

      ctx.fillStyle = `rgba(255,255,255,${0.08 * f.life})`;
      ctx.fillRect(0, 0, w, h);

      ctx.beginPath();
      ctx.moveTo(f.x, 0);

      let currentX = f.x;
      let currentY = 0;

      for (let j = 0; j < 8; j++) {
        currentX += (Math.random() - 0.5) * 100;
        currentY += h / 8;
        ctx.lineTo(currentX, currentY);
      }

      ctx.strokeStyle = `rgba(255,255,255,${0.65 * f.life})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      f.life -= 0.08;
      if (f.life <= 0) flashes.splice(i, 1);
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    drawRain();
    drawFlashes();

    if (Math.random() < 0.0035) spawnFlash();

    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  animate();
}

document.addEventListener("DOMContentLoaded", initParticles);