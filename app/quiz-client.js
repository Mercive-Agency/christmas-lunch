import { TEAMS } from "@/lib/teams";

// The quiz as it runs in the browser. It builds the slides, draws the snow,
// sparkles and Rudolf, and follows the shared game on the server:
//
// - Every phone polls /api/state and shows what it says: the slide, the
//   unwrapped answers, the score and the stopwatch.
// - Hosts also send actions to it (next slide, unwrap, score). Guests cannot.
//
// No answer is in this file. An answer arrives from the server only after a
// host has unwrapped it (lib/quiz-answers.ts, lib/quiz-state.ts).

const POLL_MS = 1000;
const COLORS = ["#ff6b78", "#f1c46b", "#3fa877", "#9fd8ee", "#fbf3e4"];
const HEX = ["#fbf3e4", "#f1c46b", "#3fa877", "#ff6b78", "#ffffff"];

const ROUNDS = [
  ["r1", "Who has the best stamina?"],
  ["r2", "Who is the best listener?"],
  ["r3", "Who knows everyone best?"],
  ["r4", "Who is the best swallower?"],
  ["r5", "Simon says"],
];
const CRIME_PARTS = ["Person", "Location", "Weapon", "Body"];
// [job, personality, clues, party forecast]. The names are answers and live on the server.
const PEOPLE = [
  ["Developer. Arms crossed in the classic pose of “it works on my machine.”",
    "Replies to a DM in four seconds and an email in four business days. The hair says “just woke up.” The commit history says “never slept.”",
    "A striped shirt somewhere between Copenhagen-cool and pyjamas, plus a tiny pink embroidered logo nobody can identify. Shrimp? Seahorse? A lowercase S having a moment?",
    "“Just one drink” at 19:00. Spotted at 02:00 pushing straight to the Spotify queue. No code review."],
  ["Management consultant. Has already sorted everyone at this party into a 2x2 matrix.",
    "Has a five-year plan. It’s laminated. Can say “per my last email” out loud, with a smile.",
    "A navy blazer in an office where crewnecks count as formalwear. A square gold watch that gets checked once per meeting, and that’s when the meeting ends.",
    "Arrives with a seating plan nobody asked for. Everyone follows it. Before the taxis come, there’s a Monday debrief in the calendar."],
  ["Yacht broker. Has already sold two boats today, using only that smile.",
    "Firm handshake, firmer calendar. Remembers your name, your dog’s name and your Q3 numbers.",
    "A dive watch rated to 300 metres, angled perfectly for the camera, that has seen more board meetings than coral reefs. A shirt ironed sharp enough to cut the crackling on the flæskesteg.",
    "Arrives with a wine nobody can pronounce. Gives a toast nobody asked for. It’s annoyingly good."],
  ["Data analyst. Knows how many carts were abandoned this week and is waiting for the right moment to tell you.",
    "Speaks once per meeting, and it’s always the line everyone quotes afterwards. Says “no stress” and means it, which is somehow worse.",
    "A navy knit with a tiny chest logo the AI is fairly sure belongs to a Mercive client. Wearing the client’s brand to the photo shoot: a power move. Also missed the memo about crossing the arms.",
    "Never seen dancing, never seen leaving. Somehow in the background of every photo from the night."],
  ["Designer. That half-smile means something on this slide is two pixels off.",
    "Has never used an exclamation mark. Not even in “Happy birthday.” Says “interesting” in a tone that means “let’s start over.”",
    "A grey crewneck, one of five identical ones known collectively as “the design system.” Hair engineered to survive a Copenhagen headwind. One thin silver bracelet, the only accessory that made it through approval.",
    "Quiet through dinner. At midnight, owns the dance floor without changing facial expression once. The office hasn’t had a ping pong table since that one Friday bar. Coincidence, says the defence."],
];
// [quote, floating music notes?]. Who says each one is an answer on the server (q0 to q4).
const QUOTES = [
  ["“Have a great day”", false],
  ["“Skal vi …” (fløjt)", true],
  ["“Jeg skal bare have min livret i aften, en BIF stadion pølse”", false],
  ["“Ej, Frank. Det er jo helt skanda det der”", false],
  ["“Ikke lige nu”", false],
];

function leg(x, c, cls) {
  return '<g class="leg ' + cls + '"><rect x="' + x + '" y="112" width="11" height="58" rx="5.5" fill="' + c + '"/><rect x="' + x + '" y="160" width="11" height="10" rx="3" fill="#3a2114"/></g>';
}
export const RUDOLF = '<svg class="rud" viewBox="0 0 220 176" aria-hidden="true">' +
  leg(54, "#7d4a28", "a") + leg(120, "#7d4a28", "b") +
  '<ellipse class="tail" cx="40" cy="96" rx="10" ry="6" fill="#f3e3c8"/>' +
  '<ellipse cx="96" cy="104" rx="54" ry="30" fill="#b06f42"/><ellipse cx="98" cy="119" rx="34" ry="12" fill="#d9a877" opacity=".65"/>' +
  leg(68, "#99603a", "b") + leg(132, "#99603a", "a") +
  '<path d="M120 100 L140 50 L170 60 L148 114 Z" fill="#b06f42"/>' +
  '<path d="M131 76 l35 11 l-4 13 l-35 -11 z" fill="#1f7a55"/><path d="M135 88 l-7 28 l12 3 l6 -27 z" fill="#1f7a55"/>' +
  '<g fill="none" stroke="#ecd6ae" stroke-width="5" stroke-linecap="round"><path d="M150 36 C146 22 150 10 160 4 M149 24 l-12 -8 M153 13 l-9 -8"/><path d="M165 36 C171 22 181 16 193 16 M173 24 l1 -14 M183 18 l8 -10"/></g>' +
  '<ellipse cx="143" cy="42" rx="12" ry="6" transform="rotate(-25 143 42)" fill="#99603a"/>' +
  '<ellipse cx="162" cy="54" rx="24" ry="20" fill="#b06f42"/><ellipse cx="184" cy="64" rx="18" ry="13" fill="#d9a877"/>' +
  '<circle cx="159" cy="63" r="5" fill="#ff8f9a" opacity=".5"/>' +
  '<g class="eye"><circle cx="168" cy="48" r="4.2" fill="#1a1210"/><circle cx="169.4" cy="46.6" r="1.4" fill="#fff"/></g>' +
  '<path d="M178 71 q8 6 16 0" stroke="#7d4a28" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
  '<g class="nose"><circle cx="200" cy="58" r="9" fill="#ff2d3f"/><circle cx="197" cy="55" r="2.6" fill="#ffc2c8"/></g></svg>';
// Christmas dress-up for the photos. Each is drawn in a 100 x 100 box laid
// over the round photo, so nothing depends on where the face is.
function hat(body, trim) {
  return '<path d="M14 60 Q30 6 70 12 Q90 16 92 46 L82 44 Q78 30 64 30 Q76 44 80 60 Z" fill="' + body + '"/><rect x="6" y="56" width="80" height="17" rx="8.5" fill="#fbf3e4"/><circle cx="90" cy="48" r="9" fill="' + trim + '"/>';
}
function around(n, radius, draw) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    out += draw(50 + Math.cos(a) * radius, 50 + Math.sin(a) * radius, (a * 180) / Math.PI, i);
  }
  return out;
}
const BULBS = ["#ffe9b8", "#ff6b78", "#6fdc9c", "#9fd8ee"];
const DECOS = [
  // Santa hat
  '<g transform="translate(2,-17) rotate(-16 29 23) scale(.58)">' + hat("#e0263a", "#fbf3e4") + "</g>",
  // Reindeer antlers and a red nose hanging from the frame
  '<g fill="none" stroke="#ecd6ae" stroke-width="4.5" stroke-linecap="round"><path d="M30 8 C22 -2 20 -12 26 -20 M25 -4 l-11 -4 M23 -13 l-8 -6"/><path d="M70 8 C78 -2 80 -12 74 -20 M75 -4 l11 -4 M77 -13 l8 -6"/></g>' +
    '<circle class="nose" cx="50" cy="99" r="8" fill="#ff2d3f"/><circle cx="47.5" cy="96.5" r="2.2" fill="#ffc2c8"/>',
  // Elf hat with a bell
  '<g transform="translate(98,-17) scale(-1,1) rotate(-16 29 23) scale(.58)">' + hat("#2f9e6a", "#f1c46b") + "</g>",
  // Fairy lights around the frame
  around(14, 51, (x, y, deg, i) => '<circle class="bulb" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.4" fill="' + BULBS[i % 4] + '" style="animation-delay:' + ((i * 0.23) % 1.4).toFixed(2) + 's"/>'),
  // Wreath with berries and a bow
  around(22, 51, (x, y, deg, i) => '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="8" ry="4.2" fill="' + (i % 2 ? "#2f9e6a" : "#1f7a55") + '" transform="rotate(' + (deg + 60).toFixed(0) + " " + x.toFixed(1) + " " + y.toFixed(1) + ')"/>') +
    around(7, 51, (x, y) => '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.6" fill="#ff2d3f"/>') +
    '<path d="M50 96 L36 88 L36 104 Z M50 96 L64 88 L64 104 Z" fill="#e0263a"/><circle cx="50" cy="96" r="4" fill="#c81f30"/>',
];
function deco(photo) {
  let n = 0;
  for (let i = 0; i < photo.length; i++) n += photo.charCodeAt(i);
  return '<svg class="deco" viewBox="0 0 100 100" aria-hidden="true">' + DECOS[n % DECOS.length] + "</svg>";
}

function esc(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function pad(n) { return String(n).padStart(2, "0"); }
function tag(t) { return '<span class="tag">' + t + "</span>"; }
function fact(k, t) { return '<div class="fact">' + tag(k) + "<p>" + t + "</p></div>"; }
function rules(a) { return '<ul class="rows">' + a.map((x) => "<li>" + x + "</li>").join("") + "</ul>"; }
function intro(n, title, body) {
  return '<div class="in"><div class="hang"><b>' + n + '</b></div><p class="eyebrow">Round ' + n + " of 5</p><h2>" + title + "</h2>" + body + "</div>";
}
function pic(person) {
  return '<span class="ph"><img src="/api/photo/' + encodeURIComponent(person.photo) + '" alt="Photo of ' + esc(person.name) + '">' + deco(person.photo) + "</span>";
}
/** An unwrapped answer, from what the server sent. */
function answerHtml(a) {
  if (a.people && a.people.length > 1) {
    return '<span class="crew' + (a.people.length > 4 ? " three" : "") + '">' + a.people.map((p) => "<span>" + pic(p) + esc(p.name) + "</span>").join("") + "</span>";
  }
  if (a.people && a.people.length === 1) return pic(a.people[0]) + '<span class="ans">' + esc(a.people[0].name) + "</span>";
  return (a.song ? '<span class="song">' + esc(a.song) + "</span><br>" : "") + '<span class="ans">' + esc(a.text || "") + "</span>";
}

/**
 * Starts the quiz in the shell that app/Quiz.tsx renders. Returns a function
 * that stops everything again.
 */
export function start(master) {
  const stop = new AbortController();
  const on = (el, type, fn, opts) => el.addEventListener(type, fn, { ...(opts || {}), signal: stop.signal });
  const timers = [];
  let alive = true;
  const $ = (id) => document.getElementById(id);
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.toggle("host", master);

  const giftHint = master ? "Tap to unwrap" : "The hosts unwrap this one";
  function gift(id, k, hint, cls) {
    return '<button class="rev ' + (cls || "") + '" data-id="' + id + '">' + tag(k) + '<span class="hint">' + hint + '</span><span class="a"></span></button>';
  }

  // ---------- slides ----------
  const S = [];
  S.push(["title", '<div class="in center"><span class="logo" role="img" aria-label="Mercive"></span>' +
    '<div><button class="hero" id="hero" aria-label="Boop Rudolf on the nose"><span class="hopper">' + RUDOLF + "</span></button></div>" +
    '<p class="eyebrow">Christmas lunch 2026</p><h1 class="glint">Julefrokost</h1>' +
    '<p class="lead">Five teams. Five rounds. One winner.</p><p class="eyebrow" style="color:var(--rose)">Psst. Boop the nose.</p><a class="signout" href="/logout">Sign out</a></div>']);

  TEAMS.forEach((t, i) => {
    S.push(["team" + i, '<div class="in"><p class="eyebrow">Find your people · Team ' + (i + 1) + " of " + TEAMS.length + '</p><h2><i class="dot big" style="--c:' + COLORS[i] + '"></i>' + t[0] + "</h2>" +
      gift("team" + i, "Who is on " + t[0] + "?", giftHint, "name") + "</div>"]);
  });

  S.push(["teams", '<div class="in"><p class="eyebrow">Find your people</p><h2>The teams</h2><div class="rows">' +
    TEAMS.map((t, i) => '<div class="team"><span class="tag"><i class="dot" style="--c:' + COLORS[i] + '"></i>' + t[0] + '</span><p id="tm' + i + '">Still wrapped</p></div>').join("") +
    "</div></div>"]);

  let letter = 0;
  const wave = "Lad det bedste hold vinde".split(" ").map((word) =>
    '<span class="wd' + (word === "bedste" ? " hot" : "") + '">' + word.split("").map((ch) => '<span class="l" style="--i:' + letter++ + '">' + ch + "</span>").join("") + "</span>").join(" ");
  S.push(["best", '<div class="in center"><p class="eyebrow">Ready, set</p><h2 class="wave" aria-label="Lad det bedste hold vinde">' + wave + '</h2><p class="lead">May the best team win.</p></div>']);

  S.push(["rounds", '<div class="in"><p class="eyebrow">Tonight’s programme</p><h2>Five rounds</h2><div class="rows">' +
    ROUNDS.map((r, i) => '<button class="round" data-go="' + r[0] + '">' + tag("0" + (i + 1)) + "<span>" + r[1] + "</span></button>").join("") +
    "</div></div>"]);

  S.push(["r1", intro(1, "Who has the best stamina?",
    rules(["Each team picks two people to compete.", "Hold the object for as long as possible.", "Last arm standing wins."]) +
    '<div class="clock" id="clock">00:00.0</div><div class="row hostonly"><button class="btn" id="swGo">Start</button><button class="btn ghost" id="swReset">Reset</button></div>')]);

  S.push(["r2", intro(2, "Who is the best listener?",
    '<p class="lead">A music quiz where every song is a clue to a murder.</p>' + rules(["Two murders to solve.", "Name the person, the location, the weapon and the body."]))]);

  [0, 1].forEach((i) => {
    S.push(["crime" + i, '<div class="in"><p class="eyebrow">Round 2 · Crime scene ' + (i + 1) + " of 2</p><h2>" + (i ? "The second murder" : "The first murder") + '</h2><div class="grid2">' +
      CRIME_PARTS.map((part, j) => gift("c" + i + "-" + j, part, "Song " + (j + 1))).join("") +
      '</div><p class="eyebrow" style="color:var(--rose)">' + (master ? "Tap a gift to unwrap it for everyone" : "The hosts unwrap the answers") + "</p></div>"]);
  });

  S.push(["r3", intro(3, "Who knows everyone best?",
    '<p class="lead">We showed an AI the team photos. It had opinions.</p>' + rules(["Listen to the description.", "Guess which colleague it is.", "One point per correct name."]))]);

  PEOPLE.forEach((p, i) => {
    S.push(["who" + i, '<div class="in"><p class="eyebrow">Round 3 · Colleague ' + (i + 1) + " of " + PEOPLE.length + "</p><h2>Who is this?</h2>" +
      '<div class="rows">' + fact("Job", p[0]) + fact("Personality", p[1]) + fact("Clues", p[2]) + fact("Party forecast", p[3]) + "</div>" +
      gift("who" + i, "The answer", giftHint, "name") + "</div>"]);
  });

  S.push(["roast", '<div class="in"><p class="eyebrow">Round 3 · Roast the team</p><h2 class="glint">Gilet &amp; Partners</h2><div class="rows">' +
    fact("What they are, according to the AI", "The founding team of a startup selling carbon-neutral padel rackets. Pre-revenue. Post-vibe.") +
    fact("The dynamic", "The VC asks if it scales. The creative director says trust the process. Head of Sustainability asks about the carbon footprint. The padel coach books a court. Nothing gets decided, and everyone leaves happy.") +
    fact("Last offsite", "The padel coach wanted Lake Como, Head of Sustainability wanted somewhere you can cycle to, the creative director wanted “a vibe,” and the VC wanted ROI. They ended up at a padel hall in Glostrup.") +
    fact("Party forecast", "23:00, found a startup. 23:30, close a pre-seed round with the bartender. 00:15, co-founder fight. 01:00, pivot to AI.") +
    "</div>" + gift("roast", "The answer", giftHint, "name") + "</div>"]);

  S.push(["r4", intro(4, "Who is the best swallower?",
    '<p class="lead">Bund en genstand.</p>' + rules(["We bring the drinks.", "You bring the technique.", "Fastest empty glass wins. Skål!"]))]);

  S.push(["r5", intro(5, "Simon says",
    '<p class="lead">Office classics. Who says it?</p>' + rules(["Five quotes you hear every week.", "Shout the name before the hosts unwrap it.", "One point per quote."]))]);

  QUOTES.forEach((q, i) => {
    const words = q[0].split(" ").map((w, j) => '<span class="w" style="animation-delay:' + (0.35 + j * 0.13).toFixed(2) + 's">' + w + "</span>").join(" ");
    const notes = q[1] ? '<span class="notes" aria-hidden="true"><span>♪</span><span>♫</span><span>♪</span></span>' : "";
    S.push(["say" + i, '<div class="in"><p class="eyebrow">Round 5 · Quote ' + (i + 1) + " of " + QUOTES.length + "</p><h2>Who says it?</h2>" +
      '<div class="bubble">' + notes + '<span class="quote">' + words + "</span></div>" +
      gift("q" + i, "The answer", giftHint, "name") + "</div>"]);
  });

  S.push(["score", '<div class="in"><p class="eyebrow">The moment of truth</p><h2>Scoreboard</h2><div class="rows" id="board"></div>' +
    '<div id="winner" aria-live="polite"></div><div class="row hostonly"><button class="btn" id="crown">Crown the winner</button><button class="btn ghost" id="wipe">Reset the game</button></div></div>']);

  // The hosts' points panel: give points from any slide without moving anyone.
  const sheet = $("sheet"), shade = $("shade");
  sheet.innerHTML = '<p class="eyebrow">Points · only hosts see this</p><div class="rows" id="sheetBoard"></div>' +
    '<div class="row"><button class="btn" id="showScore">Show scoreboard to everyone</button><button class="btn ghost" id="sheetClose">Close</button></div>';
  let back = null;   // the slide to return to after showing the scoreboard
  function panel(open) { sheet.classList.toggle("on", open); shade.classList.toggle("on", open); }

  const deck = $("deck");
  deck.innerHTML = S.map((s) => '<section class="slide" data-k="' + s[0] + '">' + s[1] + "</section>").join("");
  const slides = [].slice.call(deck.children);
  let cur = -1;

  // ---------- garland ----------
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

  // ---------- particles: snow, sparkles, confetti ----------
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
  for (let i = 0; i < (reduced ? 0 : 60); i++) flakes.push({ x: Math.random() * 2000, y: Math.random() * 2000, r: 0.8 + Math.random() * 2.4, v: 0.3 + Math.random() * 0.9, p: Math.random() * 6.3 });
  function sparkle(x, y, n, soft) {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = soft ? Math.random() * 1.5 : 2 + Math.random() * 5;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (soft ? 0 : 2), life: 1, d: 0.015 + Math.random() * 0.02, s: (soft ? 2 : 3) + Math.random() * 5, c: HEX[i % 2], star: 1, rot: Math.random() * 6 });
    }
  }
  function confetti(n) {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      parts.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, life: 1, d: 0.004 + Math.random() * 0.004, s: 6 + Math.random() * 7, c: HEX[i % 5], star: 0, rot: Math.random() * 6 });
    }
  }
  function star(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.3 : r, a = rot + i * Math.PI / 4; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  function frame() {
    if (!alive) return;
    t += 0.016; ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.8)";
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.y += f.v; f.x += Math.sin(t + f.p) * 0.4;
      if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; }
      if (f.x > W + 5) f.x = -5; if (f.x < -5) f.x = W + 5;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.rot += 0.1; p.life -= p.d;
      if (p.star) { p.vy += 0.14; p.vx *= 0.98; } else { p.vx += Math.sin(t * 3 + p.rot) * 0.08; }
      if (p.life <= 0 || p.y > H + 30) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life * 1.5); ctx.fillStyle = p.c;
      if (p.star) star(p.x, p.y, p.s, p.rot);
      else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * Math.abs(Math.cos(p.rot)) + 2); ctx.restore(); }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  if (!reduced) requestAnimationFrame(frame);

  // ---------- Rudolf ----------
  const runner = $("runner");
  let flip = false, trail = 0, heroT = 0;
  runner.innerHTML = '<div class="bob run">' + RUDOLF + "</div>";
  function gallop() {
    if (reduced) return;
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
  const hero = $("hero");
  function heroIn() {
    if (reduced) return;
    clearTimeout(heroT);
    hero.classList.remove("enter", "run"); void hero.offsetWidth;
    hero.classList.add("enter", "run");
    heroT = setTimeout(() => hero.classList.remove("run"), 1900);
  }
  on(hero, "click", () => {
    const r = hero.getBoundingClientRect();
    hero.classList.remove("hop"); void hero.offsetWidth; hero.classList.add("hop");
    sparkle(r.left + r.width * 0.91, r.top + r.height * 0.33, 40);
  });

  const toastEl = $("toast");
  let toastT = 0;
  function toast(m) {
    toastEl.textContent = m; toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 1800);
  }

  // ---------- showing the shared game ----------
  let game = null;      // the last game the server sent
  let offset = 0;       // server clock minus this phone's clock, for the stopwatch
  let pending = 0;      // host actions on their way; polls wait for them

  function show(n) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur) return;
    cur = n;
    slides.forEach((s, i) => { s.classList.toggle("active", i === cur); s.classList.toggle("before", i < cur); });
    slides[cur].scrollTop = 0;
    $("count").textContent = (master ? "Host · " : "") + pad(cur + 1) + " / " + pad(slides.length);
    $("bar").style.width = ((cur + 1) / slides.length * 100) + "%";
    $("prev").disabled = cur === 0;
    $("next").disabled = cur === slides.length - 1;
    const k = slides[cur].dataset.k;
    if (k !== "score") back = null;
    $("showScore").textContent = k === "score" && back !== null ? "Back to slide " + pad(back + 1) : "Show scoreboard to everyone";
    if (k === "title") heroIn();
    else if (k === "best") { confetti(200); gallop(); }
    else if (/^r\d$/.test(k) || k === "score") gallop();
  }

  function board(scores) {
    const max = Math.max.apply(null, scores);
    $("board").innerHTML = $("sheetBoard").innerHTML = TEAMS.map((team, i) =>
      '<div class="score' + (max > 0 && scores[i] === max ? " lead" : "") + '"><span class="tag"><i class="dot" style="--c:' + COLORS[i] + '"></i>' + team[0] + "</span>" +
      '<button class="pm hostonly" data-i="' + i + '" data-d="-1" aria-label="Minus one for ' + team[0] + '">−</button><span class="pts">' + scores[i] + "</span>" +
      '<button class="pm plus hostonly" data-i="' + i + '" data-d="1" aria-label="Plus one for ' + team[0] + '">+</button></div>').join("");
  }

  function drawClock() {
    if (!game) return;
    const ms = Math.max(0, game.sw.acc + (game.sw.on ? Date.now() + offset - game.sw.t0 : 0)), s = Math.floor(ms / 1000);
    $("clock").textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60) + "." + Math.floor(ms % 1000 / 100);
  }

  /** Draws a game from the server. Effects play only for changes after the first draw. */
  function apply(next) {
    if (!next || next.slide === undefined) return;          // "nothing new"
    if (game && next.v < game.v) return;                    // an older answer arrived late
    const first = !game, before = game;
    offset = next.now - Date.now();
    game = next;

    show(next.slide);

    deck.querySelectorAll("button.rev").forEach((el) => {
      const a = next.answers[el.dataset.id], open = el.classList.contains("open");
      if (a && !open) {
        el.querySelector(".a").innerHTML = answerHtml(a);
        el.classList.add("open");
        if (!first) {
          const r = el.getBoundingClientRect();
          sparkle(r.left + r.width / 2, r.top + r.height / 2, 34);
          if (el.classList.contains("name")) { confetti(140); gallop(); }
        }
      } else if (!a && open) {
        el.classList.remove("open");
        el.querySelector(".a").innerHTML = "";
      }
      // An unwrapped person takes over the slide, so nobody has to scroll to see the photo.
      if (el.classList.contains("name")) {
        const slide = el.closest(".slide");
        if (!!a !== slide.classList.contains("unwrapped")) {
          slide.classList.toggle("unwrapped", !!a);
          slide.scrollTop = 0;
        }
      }
    });

    TEAMS.forEach((team, i) => {
      const members = next.answers["team" + i];
      $("tm" + i).textContent = members ? members.people.map((p) => p.name).join(", ") : "Still wrapped";
    });

    if (first || before.scores.join() !== next.scores.join()) board(next.scores);
    $("winner").textContent = next.winner || "";
    if (!first && next.winner && next.winner !== before.winner && !/^No points/.test(next.winner)) {
      confetti(280); sparkle(W / 2, H / 2, 60); gallop();
    }
    $("swGo").textContent = next.sw.on ? "Stop" : "Start";
    drawClock();
  }

  async function poll() {
    if (!alive || pending) return;
    try {
      const response = await fetch("/api/state?v=" + (game ? game.v : 0), { cache: "no-store" });
      if (response.status === 401) { location.href = "/login"; return; }
      if (response.ok && !pending) apply(await response.json());
    } catch {
      // Offline for a moment; the next poll tries again.
    }
  }

  /** A host action. The server answers with the new game. */
  async function send(action) {
    if (!master) return;
    pending++;
    try {
      const response = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) });
      pending--;
      if (response.status === 401) { location.href = "/login"; return; }
      if (!response.ok) throw new Error(String(response.status));
      if (!pending) apply(await response.json());
    } catch {
      pending = Math.max(0, pending - 1);
      toast("Could not reach the server. Try again.");
    }
  }

  function steer(n) {
    if (!master) return;
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur) return;
    show(n);
    send({ type: "slide", slide: n });
  }

  // ---------- controls ----------
  on($("prev"), "click", () => steer(cur - 1));
  on($("next"), "click", () => steer(cur + 1));
  on(document, "keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown") steer(cur + 1);
    if (e.key === "ArrowLeft" || e.key === "PageUp") steer(cur - 1);
  });
  let tx = 0, ty = 0;
  on(deck, "touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  on(deck, "touchend", (e) => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) steer(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  let armed = false;
  on(document, "click", (e) => {
    const target = e.target;
    const r = target.closest("button.rev"), g = target.closest("[data-go]"), pm = target.closest(".pm");
    if (g) {
      if (master) for (let i = 0; i < slides.length; i++) if (slides[i].dataset.k === g.dataset.go) steer(i);
      return;
    }
    if (r) {
      if (!master) {
        r.classList.remove("nope"); void r.offsetWidth; r.classList.add("nope");
        toast("No peeking. The hosts unwrap this one.");
      } else {
        send({ type: "reveal", id: r.dataset.id, on: !r.classList.contains("open") });
      }
      return;
    }
    if (pm) { send({ type: "score", team: +pm.dataset.i, delta: +pm.dataset.d }); sparkle(e.clientX, e.clientY, 10); return; }
    if (target.closest("#pts")) { panel(!sheet.classList.contains("on")); return; }
    if (target.closest("#sheetClose") || target.closest("#shade")) { panel(false); return; }
    if (target.closest("#showScore")) {
      const scoreAt = slides.length - 1;
      if (cur === scoreAt && back !== null) { const to = back; steer(to); }
      else if (cur !== scoreAt) { const from = cur; steer(scoreAt); back = from; show(cur); $("showScore").textContent = "Back to slide " + pad(from + 1); }
      panel(false);
      return;
    }
    if (target.closest("#swGo")) { send({ type: "sw", op: "toggle" }); return; }
    if (target.closest("#swReset")) { send({ type: "sw", op: "reset" }); return; }
    if (target.closest("#crown")) { send({ type: "crown" }); return; }
    const wipe = target.closest("#wipe");
    if (wipe) {
      if (!armed) {
        armed = true; wipe.textContent = "Tap again to reset";
        timers.push(setTimeout(() => { armed = false; wipe.textContent = "Reset the game"; }, 3000));
      } else {
        armed = false; wipe.textContent = "Reset the game";
        send({ type: "reset" });
      }
      return;
    }
    if (!target.closest("button")) sparkle(e.clientX, e.clientY, 12);
  });

  // ---------- go ----------
  show(0);
  board(TEAMS.map(() => 0));
  poll();
  timers.push(setInterval(poll, POLL_MS));
  timers.push(setInterval(() => { if (game && game.sw.on) drawClock(); }, 100));

  return () => {
    alive = false;
    stop.abort();
    timers.forEach((id) => { clearInterval(id); clearTimeout(id); });
    clearInterval(trail); clearTimeout(heroT); clearTimeout(toastT);
    deck.innerHTML = "";
    sheet.innerHTML = "";
    panel(false);
    runner.innerHTML = "";
    document.body.classList.remove("host");
  };
}
