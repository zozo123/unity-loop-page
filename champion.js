// Pull champion.json from the code repo's main branch and animate trajectory.
// If the live islo share has expired (24h–7d TTL), gracefully fall back so the
// stage shows the launch reel instead of a dead iframe.
const CHAMPION_URL = "https://raw.githubusercontent.com/zozo123/unity-loop/main/runs/champion.json";
const REEL_MP4 = "assets/unity-loop.mp4";
const REEL_POSTER = "assets/poster.jpg";
const FALLBACK = {
  ts: 0,
  run: "20260513-refresh",
  score: 4.8,
  variant: {
    title: "S Y N T H W A V E //",
    bg: "linear-gradient(180deg,#ff006e,#8338ec 35%,#3a86ff 65%,#06002a)",
    filter: "saturate(2.2) hue-rotate(-30deg) contrast(1.25) brightness(1.05)",
    frame_color: "#ff006e",
    frame_glow: "0 0 40px #ff006e88, 0 0 80px #3a86ff44",
  },
  share_url: "https://tfz03pd24bdo8ehxe9ge9g6f4.share.islo.dev",
};
const TRAJECTORY = [1.2, 2.4, 3.1, 3.7, 4.4, 4.8];

async function probeShare(url) {
  // islo shares return 404 JSON from the gateway once expired. A short HEAD
  // (or GET with no-cors) with a timeout tells us if the iframe is worth loading.
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(url, { method: "GET", mode: "no-cors", signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    // no-cors gives opaque response: status is always 0. Treat reaching the
    // server without throwing as alive — expired shares fail TLS/DNS less,
    // but they do return 404. We can't read it, so do a second probe via
    // the raw share_id host's HEAD on cors mode (the islo gateway sets CORS *).
    try {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 4000);
      const r2 = await fetch(url, { method: "HEAD", signal: ctrl2.signal, cache: "no-store" });
      clearTimeout(t2);
      return r2.ok;
    } catch (_) {
      // CORS preflight may block HEAD; treat the no-cors success as a soft pass.
      return r.type === "opaque";
    }
  } catch (_) {
    return false;
  }
}

function showReelFallback(reason) {
  const frame = document.getElementById("stage-frame");
  const iframe = document.getElementById("stage-iframe");
  if (iframe) iframe.remove();
  if (!frame) return;
  frame.classList.add("dead");
  frame.innerHTML = `
    <video class="stage-video" autoplay muted loop playsinline poster="${REEL_POSTER}">
      <source src="${REEL_MP4}" type="video/mp4">
    </video>
    <div class="stage-overlay">
      <div class="stage-overlay-tag">sandbox cycling</div>
      <div class="stage-overlay-msg">islo shares rotate every 7d — replaying the launch reel while a fresh sandbox boots.</div>
      <a class="stage-overlay-link" href="${REEL_MP4}">download mp4</a>
    </div>`;
  if (reason) console.info("[unity-loop] live stage offline:", reason);
}

async function render() {
  let champ = FALLBACK;
  try {
    const r = await fetch(CHAMPION_URL, { cache: "no-store" });
    if (r.ok) {
      const fetched = await r.json();
      if (fetched && fetched.share_url) champ = fetched;
    }
  } catch (_) {}

  document.getElementById("champion-score").textContent = (+champ.score).toFixed(1);
  document.getElementById("champion-title").textContent = champ.variant.title || "—";
  document.getElementById("champion-run").textContent = champ.run || "—";
  const a = document.getElementById("champion-url");
  a.href = champ.share_url;
  a.textContent = champ.share_url;

  // Apply variant CSS to the frame around the iframe.
  const frame = document.getElementById("stage-frame");
  if (champ.variant.frame_color) frame.style.borderColor = champ.variant.frame_color;
  if (champ.variant.frame_glow) frame.style.boxShadow = champ.variant.frame_glow;

  // Probe the share before pointing the iframe at it — a dead share lands the
  // user on a 404 JSON page, which looks broken.
  const alive = await probeShare(champ.share_url);
  if (alive) {
    document.getElementById("stage-iframe").src = champ.share_url;
  } else {
    showReelFallback("share dead or unreachable");
  }

  const bars = document.getElementById("bars");
  bars.innerHTML = "";
  TRAJECTORY.forEach((s, i) => {
    const b = document.createElement("div");
    b.className = "bar";
    b.dataset.score = s.toFixed(1);
    b.style.height = (s / 5 * 100) + "%";
    b.style.opacity = i === TRAJECTORY.length - 1 ? "1" : (0.4 + i * 0.1).toFixed(2);
    bars.appendChild(b);
  });
}

render();
