import { RUDOLF } from "./quiz-client";

// The Christmas scene on its own, for the sign-in screen: the garland, snow,
// sparkles where you tap, Rudolf walking in (boop his nose) and galloping
// past now and then. Draws into the elements app/login/Scene.tsx renders.
// Returns a function that stops it.
export function festive() {
  const stop = new AbortController();
  const on = (el, type, fn) => el.addEventListener(type, fn, { signal: stop.signal });
  const $ = (id) => document.getElementById(id);
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timers = [];
  let alive = true;

  function garland() {
    const w = window.innerWidth, n = Math.max(3, Math.round(w / 110)), sw = w / n;
    let d = "M0 2", c = "", k = 0;
    for (let i = 0; i < n; i++) {
      const x0 = i * sw;
      d += " Q" + (x0 + sw / 2) + " 40 " + (x0 + sw) + " 2";
      [0.2, 0.5, 0.8].forEach((t) => {
        const y = 2 * (1 - t) * (1 - t) + 2 * 40 * t * (1 - t) + 2 * t * t;
        c += "<circle" + (k % 4 === 1 ? ' class="r"' : "") + ' cx="' + (x0 + sw * t).toFixed(1) + '" cy="' + (y + 4).toFixed(1) + '" r="3.6" style="animation-delay:' + ((k * 0.37) % 1.8).toFixed(2) + 's"/>';
        k++;
      });
    }
    $("garland").innerHTML = '<path d="' + d + '"/>' + c;
  }
  garland();

  const cv = $("fx"), ctx = cv.getContext("2d");
  let W = 0, H = 0, t = 0;
  const flakes = [], parts = [];
  function size() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  size();
  on(window, "resize", () => { size(); garland(); });
  for (let i = 0; i < (reduced ? 0 : 70); i++) flakes.push({ x: Math.random() * 2000, y: Math.random() * 2000, r: 0.8 + Math.random() * 2.6, v: 0.3 + Math.random() * 0.9, p: Math.random() * 6.3 });
  function sparkle(x, y, n, soft) {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = soft ? Math.random() * 1.5 : 2 + Math.random() * 5;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (soft ? 0 : 2), life: 1, d: 0.015 + Math.random() * 0.02, s: (soft ? 2 : 3) + Math.random() * 5, c: i % 2 ? "#f1c46b" : "#fbf3e4", rot: Math.random() * 6 });
    }
  }
  function frame() {
    if (!alive) return;
    t += 0.016; ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.8)";
    for (const f of flakes) {
      f.y += f.v; f.x += Math.sin(t + f.p) * 0.4;
      if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; }
      if (f.x > W + 5) f.x = -5; if (f.x < -5) f.x = W + 5;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.vx *= 0.98; p.rot += 0.1; p.life -= p.d;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life * 1.5); ctx.fillStyle = p.c;
      if (p.rect) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * 2); ctx.fillRect(-p.s, -p.s / 2, p.s * 2, p.s); ctx.restore(); ctx.globalAlpha = 1; continue; }
      ctx.beginPath();
      for (let j = 0; j < 8; j++) { const rr = j % 2 ? p.s * 0.3 : p.s, a = p.rot + j * Math.PI / 4; ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  if (!reduced) requestAnimationFrame(frame);

  // The two crazy seconds before the sign-in screen: confetti from everywhere.
  // The splash itself is CSS (it leaves on its own, even if this never runs).
  const splash = $("splash");
  const wait = splash && !reduced ? 2000 : 0;
  if (wait) {
    const COLORS = ["#fbf3e4", "#f1c46b", "#3fa877", "#ff6b78", "#ffffff"];
    const burst = setInterval(() => {
      const x = Math.random() * W, y = Math.random() * H * 0.8;
      sparkle(x, y, 18);
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * 6.283, v = 3 + Math.random() * 9;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, life: 1, d: 0.012 + Math.random() * 0.012, s: 4 + Math.random() * 5, c: COLORS[i % 5], rot: Math.random() * 6, rect: true });
      }
    }, 110);
    timers.push(burst);
    timers.push(setTimeout(() => clearInterval(burst), wait));
  }

  // Rudolf gallops past along the bottom, leaving sparkles.
  const runner = $("runner");
  let flip = false, trail = 0;
  runner.innerHTML = '<div class="bob run">' + RUDOLF + "</div>";
  function gallop() {
    if (reduced || !alive) return;
    clearInterval(trail);
    runner.classList.remove("go"); void runner.offsetWidth;
    flip = !flip; runner.classList.toggle("flip", flip); runner.classList.add("go");
    const t0 = Date.now();
    trail = setInterval(() => {
      const r = runner.getBoundingClientRect();
      sparkle(flip ? r.right : r.left, r.top + r.height * 0.55, 2, true);
      if (Date.now() - t0 > 3200) clearInterval(trail);
    }, 60);
  }
  timers.push(setTimeout(gallop, 3500 + wait));
  timers.push(setInterval(gallop, 11000));

  // Rudolf walks in above the form and hops when booped.
  const hero = $("hero");
  if (hero && !reduced) {
    // After the splash, so the walk-in is not hidden behind it.
    hero.style.visibility = wait ? "hidden" : "";
    timers.push(setTimeout(() => {
      hero.style.visibility = "";
      hero.classList.add("enter", "run");
      timers.push(setTimeout(() => hero.classList.remove("run"), 1900));
    }, wait));
  }
  if (hero) {
    on(hero, "click", () => {
      const r = hero.getBoundingClientRect();
      hero.classList.remove("hop"); void hero.offsetWidth; hero.classList.add("hop");
      sparkle(r.left + r.width * 0.91, r.top + r.height * 0.33, 40);
    });
  }

  on(document, "click", (e) => {
    if (!e.target.closest("button, input, a, label")) sparkle(e.clientX, e.clientY, 14);
  });
  on(document, "submit", () => sparkle(W / 2, H * 0.6, 30));

  return () => {
    alive = false;
    stop.abort();
    timers.forEach((id) => { clearInterval(id); clearTimeout(id); });
    clearInterval(trail);
    runner.innerHTML = "";
  };
}
