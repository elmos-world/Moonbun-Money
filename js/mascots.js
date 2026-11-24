import { yutuSVG } from './yutu.js';
// Moonbun Money mascots: Yutu the Jade Rabbit, Bao the treasure dragon, and the moon.
// All original artwork drawn as inline SVG so it stays crisp and themeable.

const sparkle = (x, y, s = 1, fill = '#ffe08a', cls = 'twinkle') =>
  `<path class="${cls}" style="transform-origin:${x}px ${y}px" fill="${fill}" d="M${x} ${y - 7 * s} Q${x + 1.4 * s} ${y - 1.4 * s} ${x + 7 * s} ${y} Q${x + 1.4 * s} ${y + 1.4 * s} ${x} ${y + 7 * s} Q${x - 1.4 * s} ${y + 1.4 * s} ${x - 7 * s} ${y} Q${x - 1.4 * s} ${y - 1.4 * s} ${x} ${y - 7 * s}Z"/>`;

/* ---------------- Yutu, the Jade Rabbit ----------------
   Drawn and animated in js/yutu.js. */
export function rabbitSVG(mood = 'calm', opts = {}) { return yutuSVG(mood, opts); }

/* ---------------- Bao, the treasure dragon ----------------
   Uses the illustrated artwork in img/bao.webp (900×483) with an animated SVG
   overlay drawn in the same coordinates: twinkling sparkles, a coin glint,
   sleepy z's, and coins dropping onto the pile when you save. */
export const BAO_SRC = 'img/bao.webp';

export function dragonSVG(mood = 'happy', fill = 0, { title = 'Bao the treasure dragon' } = {}) {
  const f = Math.max(0, Math.min(1, fill));
  // sparkles where the original artwork had them, plus extras when excited
  const spots = [[303, 54, 1.5], [773, 182, 1.5], [124, 207, 1], [805, 236, .7], [96, 246, .6]];
  if (mood === 'excited') spots.push([560, 40, 1.2], [880, 120, .9], [40, 140, 1], [690, 300, .8]);
  const stars = mood === 'sleepy' ? spots.slice(0, 2) : spots;
  const sparkles = stars.map(([x, y, sc], i) =>
    `<g class="bao-spark" style="animation-delay:${(i * 0.37) % 1.6}s;transform-origin:${x}px ${y}px">${sparkle(x, y, sc * 2.6, i % 3 === 2 ? '#fff6d6' : '#ffd166', '')}</g>`).join('');
  const zzz = mood === 'sleepy'
    ? `<g class="bao-z" font-family="inherit" font-weight="900" fill="#e8e2ff">
         <text x="360" y="140" font-size="40" style="animation-delay:0s">z</text>
         <text x="385" y="100" font-size="32" style="animation-delay:1s">z</text>
         <text x="405" y="66" font-size="26" style="animation-delay:2s">z</text></g>` : '';
  // coins that fall into the pile (played when the .chomp class is added)
  const drops = [[430, 0], [500, .12], [370, .24], [560, .36], [470, .5]].map(([x, d]) =>
    `<g class="bao-drop" style="animation-delay:${d}s"><ellipse cx="${x}" cy="318" rx="26" ry="11" fill="#d99a1e"/><ellipse cx="${x}" cy="312" rx="26" ry="11" fill="#ffd166"/><ellipse cx="${x}" cy="312" rx="13" ry="5" fill="#fff0b8"/></g>`).join('');
  return `<div class="bao mood-${mood}" style="--fill:${f.toFixed(2)}" role="img"
      aria-label="${title}, ${mood === 'sleepy' ? 'napping on an empty cave' : `hugging the treasure pile (${Math.round(f * 100)}% of your goals)`}">
    <div class="bao-glow" aria-hidden="true"></div>
    <img class="bao-img" src="${BAO_SRC}" alt="" width="900" height="483" draggable="false">
    <svg class="bao-fx" viewBox="0 0 900 483" aria-hidden="true">
      <defs><clipPath id="bao-coin"><circle cx="414" cy="262" r="44"/></clipPath></defs>
      <g clip-path="url(#bao-coin)"><g transform="rotate(25 414 262)"><rect class="bao-glint" x="340" y="190" width="22" height="150" fill="#fff"/></g></g>
      ${sparkles}${zzz}${drops}
    </svg>
  </div>`;
}

/* ---------------- The moon (fills like a lunar phase) ---------------- */
export function moonSVG(fraction = 0, { size = 140, label = '' } = {}) {
  const f = Math.max(0, Math.min(1, fraction));
  const r = 60, cx = 70, cy = 70;
  const rx = Math.abs(1 - 2 * f) * r;
  const sweep = f > 0.5 ? 1 : 0;
  const lit = f >= 0.999
    ? `<circle cx="${cx}" cy="${cy}" r="${r}"/>`
    : f <= 0.001 ? '' : `<path d="M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} A${rx} ${r} 0 0 ${sweep} ${cx} ${cy - r}Z"/>`;
  const id = 'm' + Math.random().toString(36).slice(2, 8);
  return `<svg class="moon" viewBox="0 0 140 140" width="${size}" height="${size}" role="img" aria-label="${label || `Moon ${Math.round(f * 100)}% full`}">
  <defs>
    <radialGradient id="${id}g" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff6d6"/><stop offset="1" stop-color="#ffd98a"/></radialGradient>
    <clipPath id="${id}c">${lit || '<rect width="0" height="0"/>'}</clipPath>
    <filter id="${id}f" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  ${f > 0.05 ? `<circle cx="${cx}" cy="${cy}" r="${r - 4}" fill="#ffd98a" opacity="${0.15 + f * 0.35}" filter="url(#${id}f)"/>` : ''}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#3b3470"/>
  <g fill="#332c63"><circle cx="50" cy="52" r="9"/><circle cx="88" cy="88" r="12"/><circle cx="84" cy="44" r="5"/></g>
  <g clip-path="url(#${id}c)">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}g)"/>
    <g fill="#f3c96f" opacity=".55"><circle cx="50" cy="52" r="9"/><circle cx="88" cy="88" r="12"/><circle cx="84" cy="44" r="5"/><circle cx="46" cy="92" r="4"/></g>
  </g>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffe9b0" stroke-opacity=".35" stroke-width="1.5"/>
</svg>`;
}

/* Tiny app icon (used for favicon/PWA) */
export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#221d45"/><circle cx="256" cy="256" r="170" fill="#ffd98a"/><circle cx="200" cy="210" r="26" fill="#f3c96f"/><circle cx="320" cy="320" r="34" fill="#f3c96f"/></svg>`;
