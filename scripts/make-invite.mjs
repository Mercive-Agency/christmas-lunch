// Makes a shareable invitation image for the julefrokost quiz.
//
//   node scripts/make-invite.mjs <link shown on the image> <output.png>
//
// Needs Google Chrome installed (it renders the image). Example:
//   node scripts/make-invite.mjs julefrokost.mercive.com invites/invite.png
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const [link, out] = process.argv.slice(2);
if (!link || !out) {
  console.error("Usage: node scripts/make-invite.mjs <link> <output.png>");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = (p) => pathToFileURL(path.join(root, p)).href;

// Rudolf is drawn in app/quiz-client.js; reuse that drawing.
const source = readFileSync(path.join(root, "app/quiz-client.js"), "utf8");
const drawing = source.slice(source.indexOf("function leg("), source.indexOf("// Christmas dress-up")).replace("export const RUDOLF", "const RUDOLF");
const RUDOLF = new Function(drawing + "; return RUDOLF;")();

const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const snow = Array.from({ length: 150 }, () => `<i style="left:${(rand() * 100).toFixed(1)}%;top:${(rand() * 100).toFixed(1)}%;width:${(4 + rand() * 12).toFixed(0)}px;opacity:${(0.35 + rand() * 0.6).toFixed(2)}"></i>`).join("");
const W = 1080, n = 6, sw = W / n;
let wire = "M0 6", bulbs = "", k = 0;
for (let i = 0; i < n; i++) {
  wire += ` Q${i * sw + sw / 2} 120 ${(i + 1) * sw} 6`;
  for (const t of [0.2, 0.5, 0.8]) {
    const y = 6 * (1 - t) ** 2 + 2 * 120 * t * (1 - t) + 6 * t * t;
    bulbs += `<circle cx="${(i * sw + sw * t).toFixed(0)}" cy="${(y + 12).toFixed(0)}" r="11" fill="${k % 4 === 1 ? "#ff6b78" : "#ffe9b8"}" filter="url(#glow)"/>`;
    k++;
  }
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Mabry; src: url(${file("app/fonts/mabry-light.woff2")}); font-weight: 300; }
@font-face { font-family: Mabry; src: url(${file("app/fonts/mabry-regular.woff2")}); font-weight: 400; }
@font-face { font-family: Mabry; src: url(${file("app/fonts/mabry-medium.woff2")}); font-weight: 500; }
* { box-sizing: border-box; margin: 0; }
body { width: 1080px; height: 1350px; overflow: hidden; position: relative; font-family: Mabry, Helvetica, Arial, sans-serif; color: #fbf3e4;
  background: radial-gradient(130% 75% at 50% 0%, #8a1826 0%, #4d0c16 45%, #24060b 100%); }
.snow i { position: absolute; aspect-ratio: 1; border-radius: 50%; background: #fff; }
.garland { position: absolute; top: 0; left: 0; }
.hill { position: absolute; left: 0; right: 0; bottom: 0; height: 330px;
  background: radial-gradient(65% 100% at 15% 100%, rgba(255,255,255,.16) 0 99%, transparent 100%), radial-gradient(75% 80% at 88% 100%, rgba(255,255,255,.1) 0 99%, transparent 100%); }
main { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 190px 70px 0; }
.logo { width: 300px; height: 66px; background: #fbf3e4; -webkit-mask: url(${file("public/img/mercive-logo.svg")}) center / contain no-repeat; }
.rud { width: 470px; margin-top: 46px; overflow: visible; filter: drop-shadow(0 24px 30px rgba(0,0,0,.35)); }
.rud .nose { filter: drop-shadow(0 0 22px #ff5a68); }
.eyebrow { font: 500 30px/1 ui-monospace, Menlo, monospace; letter-spacing: .16em; text-transform: uppercase; color: #f1c46b; margin-top: 38px; }
h1 { font-weight: 300; font-size: 214px; line-height: .95; letter-spacing: -.04em; margin-top: 14px;
  background: linear-gradient(100deg, #fbf3e4 30%, #f1c46b 52%, #fbf3e4 74%); -webkit-background-clip: text; color: transparent; padding-bottom: 14px; }
.lead { font-weight: 300; font-size: 48px; color: #e6c3bc; margin-top: 6px; }
.pill { margin-top: 50px; background: #fbf3e4; color: #4d0c16; border-radius: 999px; padding: 30px 62px; font-weight: 500; font-size: ${link.length > 26 ? 46 : 58}px; letter-spacing: -.01em;
  box-shadow: 0 0 0 10px rgba(241,196,107,.28), 0 26px 60px rgba(0,0,0,.4); }
.how { font: 400 28px/1.3 ui-monospace, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; color: #e6c3bc; margin-top: 34px; }
</style>
<div class="snow">${snow}</div>
<div class="hill"></div>
<svg class="garland" width="1080" height="170" viewBox="0 0 1080 170"><defs><filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="${wire}" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="4"/>${bulbs}</svg>
<main>
  <div class="logo"></div>
  ${RUDOLF}
  <p class="eyebrow">Christmas lunch 2026</p>
  <h1>Julefrokost</h1>
  <p class="lead">Five teams. Five rounds. One winner.</p>
  <div class="pill">${esc(link)}</div>
  <p class="how">Open it on your phone · Sign in with your Mercive email</p>
</main>`;

const dir = mkdtempSync(path.join(tmpdir(), "invite-"));
const page = path.join(dir, "invite.html");
writeFileSync(page, html);
execFileSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--window-size=1080,1350", "--virtual-time-budget=3000",
  `--screenshot=${path.resolve(out)}`, pathToFileURL(page).href,
], { stdio: "ignore" });
console.log("Wrote", path.resolve(out));
