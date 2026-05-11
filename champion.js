// Pull champion.json from the code repo's main branch and animate trajectory.
const CHAMPION_URL = "https://raw.githubusercontent.com/zozo123/unity-loop/main/runs/champion.json";
const FALLBACK = {
  ts: 0,
  run: "20260511-bootstrap",
  score: 4.8,
  variant: {
    title: "S Y N T H W A V E //",
    bg: "linear-gradient(180deg,#ff006e,#8338ec 35%,#3a86ff 65%,#06002a)",
    filter: "saturate(2.2) hue-rotate(-30deg) contrast(1.25) brightness(1.05)",
    frame_color: "#ff006e",
    frame_glow: "0 0 40px #ff006e88, 0 0 80px #3a86ff44",
  },
  share_url: "https://ssotep9384qyc19npfpqg8h7q.share.islo.dev",
};
const TRAJECTORY = [1.2, 2.4, 3.1, 3.7, 4.4, 4.8];

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

  document.getElementById("stage-iframe").src = champ.share_url;

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
