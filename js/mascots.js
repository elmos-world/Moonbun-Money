import { yutuSVG } from './yutu.js';
import { baoHTML } from './bao.js';
// Moonbun Money mascots: Yutu the Jade Rabbit, Bao the treasure dragon, and the moon.
// All original artwork drawn as inline SVG so it stays crisp and themeable.

const sparkle = (x, y, s = 1, fill = '#ffe08a', cls = 'twinkle') =>
  `<path class="${cls}" style="transform-origin:${x}px ${y}px" fill="${fill}" d="M${x} ${y - 7 * s} Q${x + 1.4 * s} ${y - 1.4 * s} ${x + 7 * s} ${y} Q${x + 1.4 * s} ${y + 1.4 * s} ${x} ${y + 7 * s} Q${x - 1.4 * s} ${y + 1.4 * s} ${x - 7 * s} ${y} Q${x - 1.4 * s} ${y - 1.4 * s} ${x} ${y - 7 * s}Z"/>`;

/* ---------------- Yutu, the Jade Rabbit ----------------
   Drawn and animated in js/yutu.js. */
export function rabbitSVG(mood = 'calm', opts = {}) { return yutuSVG(mood, opts); }

/* ---------------- Bao, the treasure dragon ----------------
   A Rive animation (js/bao.js): a hand-inked magical-girl dragon on his coin hoard.
   mood: sleepy · happy · proud · excited; fill (0–1) grows the coins around him. */
export const BAO_SRC = 'img/bao.webp';   // the previous painted Bao, kept for the gacha "Mini Bao"

export function dragonSVG(mood = 'happy', fill = 0, { title = 'Bao the treasure dragon' } = {}) {
  const f = Math.max(0, Math.min(1, fill));
  const label = `${title}, ${mood === 'sleepy' ? 'napping on a small pile of coins' : `guarding the treasure hoard (${Math.round(f * 100)}% of your goals)`}`;
  return `<div class="bao mood-${mood}" style="--fill:${f.toFixed(2)}">${baoHTML(mood, f, { label })}</div>`;
}

/* ---------------- The moon (fills like a lunar phase) ---------------- */
// The savings moon, drawn like a manga ink sketch: a wobbly pen outline, sketched craters,
// grey screentone on the dark side and a soft pink wash on the lit side (the lit part is the % saved).
const MOON_INK = '#6b4672';
function wobble(cx, cy, r, seed, amt = 1.4, n = 56) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = Math.sin(a * 3 + seed) * amt * .6 + Math.sin(a * 7 + seed * 2.3) * amt * .4;
    pts.push(`${(cx + (r + w) * Math.cos(a)).toFixed(1)} ${(cy + (r + w) * Math.sin(a)).toFixed(1)}`);
  }
  return 'M' + pts.join(' L') + 'Z';
}
export function moonSVG(fraction = 0, { size = 140, label = '' } = {}) {
  // magical-girl moon: a gold-rimmed compact; the lit part fills with glowing gold as savings grow
  const f = Math.max(0, Math.min(1, fraction));
  const r = 52, cx = 70, cy = 70;
  const rx = Math.abs(1 - 2 * f) * r;
  const sweep = f > 0.5 ? 1 : 0;
  const litPath = f >= 0.999 ? `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`
    : f <= 0.001 ? '' : `M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} A${rx.toFixed(1)} ${r} 0 0 ${sweep} ${cx} ${cy - r}Z`;
  const id = 'm' + Math.random().toString(36).slice(2, 8);
  const craters = [[52, 54, 9], [90, 88, 11], [88, 46, 5], [48, 92, 5], [70, 110, 3.5]];
  const star = (x, y, k, c) => `<path d="M${x} ${y - k}L${x + k * .28} ${y - k * .28}L${x + k} ${y}L${x + k * .28} ${y + k * .28}L${x} ${y + k}L${x - k * .28} ${y + k * .28}L${x - k} ${y}L${x - k * .28} ${y - k * .28}Z" fill="${c}" stroke="${MOON_INK}" stroke-width="1" stroke-linejoin="round"/>`;
  return `<svg class="moon moon-magic" viewBox="0 0 140 140" width="${size}" height="${size}" role="img" aria-label="${label || `Moon ${Math.round(f * 100)}% full`}">
  <defs>
    <radialGradient id="${id}d" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#f6f0ff"/><stop offset="1" stop-color="#ddd0f5"/></radialGradient>
    <radialGradient id="${id}l" cx="38%" cy="32%" r="78%"><stop offset="0" stop-color="#fffbea"/><stop offset=".55" stop-color="#ffe8a6"/><stop offset="1" stop-color="#f6c766"/></radialGradient>
    <radialGradient id="${id}h" cx="50%" cy="50%" r="50%"><stop offset=".62" stop-color="#ffe9a8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c4"/><stop offset=".5" stop-color="#f2c96d"/><stop offset="1" stop-color="#d9a441"/></linearGradient>
    <clipPath id="${id}c">${litPath ? `<path d="${litPath}"/>` : '<rect width="0" height="0"/>'}</clipPath>
  </defs>
  ${f > 0.001 ? `<circle cx="${cx}" cy="${cy}" r="${r + 16}" fill="url(#${id}h)" opacity="${(.35 + f * .65).toFixed(2)}"/>` : ''}
  <circle cx="${cx}" cy="${cy}" r="${r + 7}" fill="url(#${id}r)" stroke="${MOON_INK}" stroke-width="1.6"/>
  <circle cx="${cx}" cy="${cy}" r="${r + 2.5}" fill="#fff"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}d)" stroke="${MOON_INK}" stroke-width="1.4"/>
  <g clip-path="url(#${id}c)"><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}l)"/></g>
  <g fill="#f7c6dc" fill-opacity=".55" stroke="#e9a3c3" stroke-width="1" stroke-opacity=".7">${craters.map(([x, y, k]) => `<circle cx="${x}" cy="${y}" r="${k}"/>`).join('')}</g>
  <path d="M40 46a36 36 0 0 1 18-16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
  <circle cx="${cx}" cy="${cy - r - 7}" r="5" fill="#ff9cc7" stroke="${MOON_INK}" stroke-width="1.2"/><circle cx="${cx - 1.5}" cy="${cy - r - 8.5}" r="1.5" fill="#fff"/>
  ${star(124, 22, 7, '#fff0c4')}${star(16, 112, 5, '#ffc6de')}${star(126, 112, 4, '#e6dcff')}
</svg>`;
}

/* Tiny app icon (used for favicon/PWA) */
export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#221d45"/><circle cx="256" cy="256" r="170" fill="#ffd98a"/><circle cx="200" cy="210" r="26" fill="#f3c96f"/><circle cx="320" cy="320" r="34" fill="#f3c96f"/></svg>`;
