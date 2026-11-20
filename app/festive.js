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

  // Two seconds of 80s stadium-rock Christmas, built from scratch with Web
  // Audio: "Jingle Bells" as a synth-brass fanfare over galloping guitar, with
  // drums, sleigh bells, church bells and a deep "ho ho ho". Browsers only allow sound after a tap, which is why the splash
  // waits for one.
  function rock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    const t0 = ac.currentTime + 0.06;
    const master = ac.createGain(); master.gain.value = 0.55;
    const squash = ac.createDynamicsCompressor();
    master.connect(squash); squash.connect(ac.destination);

    // Guitar: sawtooth power chords into heavy distortion.
    const shaper = ac.createWaveShaper(), curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) curve[i] = Math.tanh((i / 512 - 1) * 7);
    shaper.curve = curve;
    const tone = ac.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 3400;
    const amp = ac.createGain(); amp.gain.value = 0.5;
    shaper.connect(tone); tone.connect(amp); amp.connect(master);
    // Rhythm guitar: chugging power chords.
    function chord(freq, at, len) {
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.5, at + 0.008);
      g.gain.setValueAtTime(0.5, at + len * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      g.connect(shaper);
      [1, 1.004, 1.5, 2].forEach((m) => { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq * m; o.connect(g); o.start(at); o.stop(at + len + 0.05); });
    }

    // The star: a big, bright 80s synth-brass fanfare. Detuned saws through a
    // filter that opens on every note, with vibrato on the long ones.
    function brass(freq, at, len) {
      const f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = "lowpass"; f.Q.value = 3;
      f.frequency.setValueAtTime(500, at); f.frequency.exponentialRampToValueAtTime(5200, at + 0.05); f.frequency.exponentialRampToValueAtTime(2600, at + Math.max(0.08, len));
      g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(0.2, at + 0.015);
      g.gain.setValueAtTime(0.2, at + len * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, at + len + 0.04);
      f.connect(g); g.connect(master);
      const wobble = ac.createOscillator(), depth = ac.createGain();
      wobble.frequency.value = 6; depth.gain.setValueAtTime(0, at); depth.gain.linearRampToValueAtTime(len > 0.3 ? freq * 0.012 : 0, at + 0.3);
      wobble.connect(depth); wobble.start(at); wobble.stop(at + len + 0.1);
      [[1, -9], [1, 0], [1, 9], [0.5, 0], [1.5, 4]].forEach(([m, cents]) => {
        const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq * m; o.detune.value = cents;
        depth.connect(o.frequency); o.connect(f); o.start(at); o.stop(at + len + 0.1);
      });
    }

    // Drums and bells from one buffer of noise.
    const noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    function hiss(at, type, freq, level, len) {
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = noise; f.type = type; f.frequency.value = freq;
      g.gain.setValueAtTime(level, at); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      src.connect(f); f.connect(g); g.connect(master); src.start(at); src.stop(at + len + 0.02);
    }
    function drum(at, from, to, level, len) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(from, at); o.frequency.exponentialRampToValueAtTime(to, at + len * 0.6);
      g.gain.setValueAtTime(level, at); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      o.connect(g); g.connect(master); o.start(at); o.stop(at + len + 0.02);
    }
    function chime(at, freq) {
      [[1, 0.16], [2.76, 0.07], [5.4, 0.03]].forEach(([m, level]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = freq * m; g.gain.setValueAtTime(level, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
        o.connect(g); g.connect(master); o.start(at); o.stop(at + 1.45);
      });
    }

    // "Jingle Bells" as a stadium-rock fanfare in A minor: each "jingle" is a
    // quick two-note pickup into a long held note. Beats are 0.14 s.
    const B = 0.14, at = (beat) => t0 + beat * B;
    const D5 = 587.33, E5 = 659.25, G5 = 783.99, C5 = 523.25;
    [[D5, 0, 0.5], [E5, 0.5, 0.5], [E5, 1, 2.8], [D5, 4, 0.5], [E5, 4.5, 0.5], [E5, 5, 2.8],
      [E5, 8, 0.95], [G5, 9, 0.95], [C5, 10, 0.95], [D5, 11, 0.95], [E5, 12, 8]]
      .forEach(([f, beat, beats]) => brass(f, at(beat), beats * B));
    // Galloping rhythm guitar underneath: Am, C, then G F G back home to Am.
    const A2 = 110, C3 = 130.81, G2 = 98, F2 = 87.31;
    [A2, A2, A2, A2, C3, C3, C3, C3, G2, G2, F2, G2].forEach((root, beat) => {
      chord(root, at(beat), B * 0.5); chord(root, at(beat + 0.5), B * 0.24); chord(root, at(beat + 0.75), B * 0.24);
    });
    chord(A2, at(12), B * 8);
    for (let beat = 0; beat <= 12; beat++) drum(at(beat), 170, 42, 1, 0.2);                       // kick on every beat
    [2, 6, 10].forEach((beat) => { hiss(at(beat), "bandpass", 1500, 0.7, 0.24); drum(at(beat), 240, 180, 0.3, 0.1); });  // big snare
    [[11, 230, 120], [11.5, 170, 85], [11.75, 130, 65]].forEach(([beat, from, to]) => drum(at(beat), from, to, 0.8, 0.18));  // tom fill
    for (let beat = 0; beat <= 12; beat += 0.5) hiss(at(beat), "highpass", 7500, 0.18, 0.05);     // sleigh bells
    hiss(at(0), "highpass", 5200, 0.3, 0.7); hiss(at(12), "highpass", 5200, 0.42, 1.4);           // crashes
    chime(at(0), 1318.5); chime(at(4), 1318.5); chime(at(12), 1318.5); chime(at(12), 1975.5);     // church bells

    try {
      const ho = new SpeechSynthesisUtterance("Ho! Ho! Ho!");
      ho.pitch = 0; ho.rate = 1.1; ho.volume = 1; ho.lang = "en-US";
      speechSynthesis.cancel(); speechSynthesis.speak(ho);
    } catch {
      // No voice on this phone; the band plays on.
    }
    timers.push(setTimeout(() => ac.close().catch(() => {}), 4500));
  }

  // The two crazy seconds: confetti from everywhere while the CSS splash runs.
  function chaos(ms) {
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
    timers.push(setTimeout(() => clearInterval(burst), ms));
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

  // Rudolf walks in above the form and hops when booped.
  const hero = $("hero");
  function arrive() {
    if (hero && !reduced) {
      hero.style.visibility = "";
      hero.classList.add("enter", "run");
      timers.push(setTimeout(() => hero.classList.remove("run"), 1900));
    }
    timers.push(setTimeout(gallop, 3500));
    timers.push(setInterval(gallop, 11000));
  }
  if (hero) {
    on(hero, "click", () => {
      const r = hero.getBoundingClientRect();
      hero.classList.remove("hop"); void hero.offsetWidth; hero.classList.add("hop");
      sparkle(r.left + r.width * 0.91, r.top + r.height * 0.33, 40);
    });
  }

  // With a splash, everything waits for the tap that starts it.
  const splash = $("splash"), startButton = $("splash-go");
  if (splash && startButton && !reduced) {
    if (hero) hero.style.visibility = "hidden";
    // A real recording beats the synth. If public/audio/splash.mp3 exists, the
    // splash plays that instead and lasts as long as the clip (2 to 8 seconds).
    let clip = null;
    try {
      clip = new Audio("/audio/splash.mp3");
      clip.preload = "auto";
      on(clip, "error", () => { clip = null; });
    } catch {
      clip = null;
    }
    const synth = () => { try { rock(); } catch { /* silent party */ } };

    on(startButton, "click", () => {
      if (splash.classList.contains("go")) return;
      let ms = 2000;
      if (clip && clip.readyState >= 1 && Number.isFinite(clip.duration)) {
        const song = clip;
        ms = Math.min(8000, Math.max(2000, song.duration * 1000));
        song.currentTime = 0;
        song.play().catch(synth);
        // Fade out as the splash leaves. iPhones ignore volume, so it is also cut off after the fade.
        timers.push(setTimeout(() => {
          const fade = setInterval(() => { try { song.volume = Math.max(0, song.volume - 0.1); } catch { /* fixed volume */ } }, 50);
          timers.push(fade);
          timers.push(setTimeout(() => { clearInterval(fade); song.pause(); }, 600));
        }, ms - 150));
      } else {
        synth();
      }
      splash.style.setProperty("--len", ms + "ms");
      splash.classList.add("go");
      chaos(ms);
      timers.push(setTimeout(arrive, ms));
    });
  } else {
    arrive();
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
