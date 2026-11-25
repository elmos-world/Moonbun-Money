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
const MOON_INK = '#2f2a33';
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
  const f = Math.max(0, Math.min(1, fraction));
  const r = 56, cx = 70, cy = 70;
  const rx = Math.abs(1 - 2 * f) * r;
  const sweep = f > 0.5 ? 1 : 0;
  const litPath = f >= 0.999 ? wobble(cx, cy, r, 1, 0)
    : f <= 0.001 ? '' : `M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} A${rx.toFixed(1)} ${r} 0 0 ${sweep} ${cx} ${cy - r}Z`;
  const term = f > 0.001 && f < 0.999 ? `M${cx} ${cy - r} A${rx.toFixed(1)} ${r} 0 0 ${1 - sweep} ${cx} ${cy + r}` : '';
  const id = 'm' + Math.random().toString(36).slice(2, 8);
  const craters = [[50, 52, 9, .4], [90, 86, 12, 1.1], [86, 44, 5, 2], [46, 92, 4.5, 2.7], [70, 108, 3, 3.3]];
  // each crater: a wobbly ring plus two short shading hatches inside its upper-left rim
  const crater = ([x, y, cr, s]) => `<path d="${wobble(x, y, cr, s, .7, 24)}"/>${cr > 4 ? `<path d="M${(x - cr * .62).toFixed(1)} ${(y - cr * .05).toFixed(1)}l${(cr * .32).toFixed(1)} ${(-cr * .32).toFixed(1)}M${(x - cr * .38).toFixed(1)} ${(y - cr * .45).toFixed(1)}l${(cr * .3).toFixed(1)} ${(-cr * .22).toFixed(1)}" stroke-width=".8"/>` : ''}`;
  return `<svg class="moon moon-ink" viewBox="0 0 140 140" width="${size}" height="${size}" role="img" aria-label="${label || `Moon ${Math.round(f * 100)}% full`}">
  <defs>
    <pattern id="${id}t" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.5" cy="2.5" r=".95" fill="${MOON_INK}" fill-opacity=".32"/></pattern>
    <radialGradient id="${id}g" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fdf6f6"/><stop offset=".6" stop-color="#f4dfe3"/><stop offset="1" stop-color="#e7c3ca"/></radialGradient>
    <clipPath id="${id}c">${litPath ? `<path d="${litPath}"/>` : '<rect width="0" height="0"/>'}</clipPath>
    <clipPath id="${id}o"><path d="${wobble(cx, cy, r, 1)}"/></clipPath>
  </defs>
  <g clip-path="url(#${id}o)">
    <rect width="140" height="140" fill="#fbf8f3"/>
    <rect width="140" height="140" fill="url(#${id}t)"/>
    <g clip-path="url(#${id}c)"><rect width="140" height="140" fill="url(#${id}g)"/>
      <g stroke="#d9a7b0" stroke-width="1" stroke-linecap="round" opacity=".7">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${98 + i * 5} ${40 + i * 3}l-14 14"/>`).join('')}</g></g>
  </g>
  <g fill="none" stroke="${MOON_INK}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" opacity=".85">${craters.map(crater).join('')}</g>
  ${term ? `<path d="${term}" fill="none" stroke="${MOON_INK}" stroke-width="1" stroke-dasharray="7 3 2 3" stroke-linecap="round" opacity=".55"/>` : ''}
  <path d="${wobble(cx, cy, r, 1)}" fill="none" stroke="${MOON_INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="${wobble(cx + .8, cy - .6, r + 1.2, 4, 1.8)}" fill="none" stroke="${MOON_INK}" stroke-width=".8" stroke-dasharray="40 9 12 7 60 12" opacity=".5"/>
  <g fill="${MOON_INK}"><path d="M122 18l1.4 4.6 4.6 1.4-4.6 1.4-1.4 4.6-1.4-4.6-4.6-1.4 4.6-1.4z"/><path d="M14 112l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/></g>
  <g fill="#d9a7b0"><circle cx="128" cy="40" r="2"/><circle cx="10" cy="96" r="1.6"/></g>
</svg>`;
}

/* Tiny app icon (used for favicon/PWA) */
export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#221d45"/><circle cx="256" cy="256" r="170" fill="#ffd98a"/><circle cx="200" cy="210" r="26" fill="#f3c96f"/><circle cx="320" cy="320" r="34" fill="#f3c96f"/></svg>`;
