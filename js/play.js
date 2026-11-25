// Moonbun Money — play features: gacha wardrobe, omikuji, friendship hearts,
// savings plants, diary stickers, Yutu's monthly letter and soft sounds.
// Everything here is drawn in SVG; accessories float around Yutu in her
// 500×500 artboard space, so they line up with her canvas at any size.

const L = '#6b4672';
const SW = `stroke="${L}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const star = (x, y, r, c = '#ffe08a', extra = '') =>
  `<path ${extra} d="M${x} ${y - r}Q${x + r * .2} ${y - r * .2} ${x + r} ${y}Q${x + r * .2} ${y + r * .2} ${x} ${y + r}Q${x - r * .2} ${y + r * .2} ${x - r} ${y}Q${x - r * .2} ${y - r * .2} ${x} ${y - r}Z" fill="${c}"/>`;
const heart = (x, y, s, c) => `<path d="M${x} ${y + 9 * s}c${-13 * s} ${-8 * s} ${-17 * s} ${-17 * s} ${-10 * s} ${-22 * s}c${4 * s} ${-3 * s} ${8 * s} ${-1 * s} ${10 * s} ${3 * s}c${2 * s} ${-4 * s} ${6 * s} ${-6 * s} ${10 * s} ${-3 * s}c${7 * s} ${5 * s} ${3 * s} ${14 * s} ${-10 * s} ${22 * s}z" fill="${c}" stroke="${L}" stroke-width="${2.5 * Math.min(1, s * 1.2)}" stroke-linejoin="round"/>`;
const face = (x, y, w = 7) => `<circle cx="${x - w}" cy="${y}" r="2.6" fill="${L}"/><circle cx="${x + w}" cy="${y}" r="2.6" fill="${L}"/>
  <path d="M${x - 3} ${y + 4}q3 3 6 0" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>
  <ellipse cx="${x - w - 5}" cy="${y + 5}" rx="4" ry="2.4" fill="#ff9fb8" opacity=".8"/><ellipse cx="${x + w + 5}" cy="${y + 5}" rx="4" ry="2.4" fill="#ff9fb8" opacity=".8"/>`;
const sakura = (x, y, r, c = '#ffc2d9') => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a =>
  `<path d="M0 0c${-r * .8} ${-r * .6} ${-r * .9} ${-r * 1.9} 0 ${-r * 2.2} ${r * .9} ${r * .3} ${r * .8} ${r * 1.6} 0 ${r * 2.2}z" fill="${c}" stroke="${L}" stroke-width="2" transform="rotate(${a})"/>`).join('')}<circle r="${r * .45}" fill="#ffe08a" stroke="${L}" stroke-width="1.6"/></g>`;

/* ------------------------------------------------------------------ */
/* Gacha items. slot: top (floats above her head) · buddy (bobs beside */
/* her) · aura (around her) · back (scene behind her). rarity 1–3.     */
/* `art` is drawn in Yutu's 500×500 space; `thumb` sets a viewBox crop. */
/* ------------------------------------------------------------------ */
export const ITEMS = [
  // ---- crowns & halos (float above her head, left of her bow) ----
  { id: 'sakura-crown', slot: 'top', rarity: 1, name: 'Sakura crown', thumb: '150 -20 160 110',
    art: `<path d="M170 58c20-12 100-12 120 0" fill="none" stroke="#a6e8c4" stroke-width="7" stroke-linecap="round"/>${sakura(178, 50, 12)}${sakura(208, 38, 13, '#ffd3e6')}${sakura(240, 34, 14)}${sakura(272, 38, 13, '#ffd3e6')}${sakura(300, 50, 12)}` },
  { id: 'flower-ring', slot: 'top', rarity: 1, name: 'Daisy halo', thumb: '150 -15 160 100',
    art: `<ellipse cx="236" cy="40" rx="62" ry="14" fill="none" stroke="#bdf0d4" stroke-width="6"/>${[-55, -28, 0, 28, 55].map((d, i) => `<g transform="translate(${236 + d} ${40 + Math.abs(d) * -.08 + 10 * Math.cos(d / 30)})">${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="0" cy="-8" rx="4.5" ry="8" fill="#fff" stroke="${L}" stroke-width="1.8" transform="rotate(${a})"/>`).join('')}<circle r="4.5" fill="#ffd166" stroke="${L}" stroke-width="1.6"/></g>`).join('')}` },
  { id: 'cloud-puff', slot: 'top', rarity: 1, name: 'Cloud puff', thumb: '160 -30 160 110',
    art: `<path d="M190 52c-16 0-22-20-6-26 0-18 24-24 34-10 8-16 36-14 40 4 18-2 26 22 10 30z" fill="#fff" ${SW}/>${face(236, 38, 9)}<path d="M206 62v10M236 64v14M266 62v10" stroke="#8fd3ff" stroke-width="4" stroke-linecap="round"/>` },
  { id: 'star-tiara', slot: 'top', rarity: 2, name: 'Star tiara', thumb: '160 -25 160 110',
    art: `<path d="M178 64q58-26 116 0" fill="none" stroke="#ffd166" stroke-width="8" stroke-linecap="round"/><path d="M178 64q58-26 116 0" fill="none" stroke="${L}" stroke-width="2" stroke-dasharray="0 9" stroke-linecap="round"/>${star(236, 28, 26, '#ffe08a', `stroke="${L}" stroke-width="2.5"`)}${star(196, 46, 13, '#fff6d6', `stroke="${L}" stroke-width="2"`)}${star(276, 46, 13, '#fff6d6', `stroke="${L}" stroke-width="2"`)}<circle cx="236" cy="30" r="5" fill="#ff9fb8"/>` },
  { id: 'witch-hat', slot: 'top', rarity: 2, name: 'Little witch hat', thumb: '150 -70 170 150',
    art: `<path d="M226 -50c-10 30-30 56-44 92h100c-12-34-20-62-56-92z" fill="#c8b6ff" ${SW}/><ellipse cx="236" cy="48" rx="70" ry="16" fill="#b39bff" ${SW}/><path d="M188 34h96" stroke="#ff9fb8" stroke-width="10"/>${star(236, 34, 9, '#ffe08a', `stroke="${L}" stroke-width="2"`)}${star(222, -6, 6, '#fff6d6')}` },
  { id: 'moon-halo', slot: 'top', rarity: 3, name: 'Moon-goddess halo', thumb: '140 -45 190 140',
    art: `<ellipse cx="236" cy="42" rx="74" ry="18" fill="none" stroke="#ffe7a3" stroke-width="10" opacity=".9"/><ellipse cx="236" cy="42" rx="74" ry="18" fill="none" stroke="#fff" stroke-width="3"/><path d="M236 -28a34 34 0 1 0 22 60 26 26 0 1 1-22-60z" fill="#ffe08a" ${SW}/>${star(282, -8, 10, '#fff6d6')}${star(186, 6, 8, '#ffd3e6')}${star(300, 30, 6, '#c8b6ff')}` },

  // ---- buddies (bob beside her, bottom right) ----
  { id: 'chick', slot: 'buddy', rarity: 1, name: 'Hiyoko chick', thumb: '400 330 110 110',
    art: `<g transform="translate(450 392)"><ellipse cx="0" cy="18" rx="26" ry="8" fill="#000" opacity=".08"/><path d="M-26 0a26 24 0 0 1 52 0c0 16-12 24-26 24s-26-8-26-24z" fill="#ffe7a3" ${SW}/><path d="M-4-26q4-8 8 0" fill="none" ${SW}/><path d="M-5 4l5 4 5-4z" fill="#ffb067" stroke="${L}" stroke-width="2"/>${face(0, -2, 9)}</g>` },
  { id: 'mochi', slot: 'buddy', rarity: 1, name: 'Mochi blob', thumb: '400 330 110 110',
    art: `<g transform="translate(452 396)"><path d="M-30 20c-4-30 12-44 30-44s34 14 30 44z" fill="#ffd3e6" ${SW}/><ellipse cx="0" cy="-10" rx="9" ry="4" fill="#fff" opacity=".8"/>${face(0, 6, 9)}</g>` },
  { id: 'star-sprite', slot: 'buddy', rarity: 2, name: 'Star sprite', thumb: '395 320 120 120',
    art: `<g transform="translate(452 386)">${star(0, 0, 36, '#fff2a8', `stroke="${L}" stroke-width="3"`)}${face(0, 2, 7)}${star(30, -32, 7, '#fff6d6')}${star(-34, 26, 5, '#ffd3e6')}</g>` },
  { id: 'jelly', slot: 'buddy', rarity: 2, name: 'Moon jellyfish', thumb: '395 315 120 130',
    art: `<g transform="translate(452 380)"><path d="M-30 6a30 30 0 0 1 60 0z" fill="#d9ccff" ${SW}/><path d="M-30 6h60" ${SW}/><path d="M-18 8q-6 14 0 28M-6 8q6 16 0 34M6 8q-6 16 0 30M18 8q6 14 0 26" fill="none" stroke="#c8b6ff" stroke-width="4" stroke-linecap="round"/>${face(0, -8, 8)}</g>` },
  { id: 'mini-bao', slot: 'buddy', rarity: 3, name: 'Mini Bao', thumb: '390 315 130 130',
    art: `<g transform="translate(452 386)"><path d="M-24-26l-8-20 16 12M24-26l8-20-16 12" fill="#fff1c4" ${SW}/><path d="M-36 8c-26-10-28 18-6 18" fill="#ffb8d2" ${SW}/><ellipse cx="0" cy="0" rx="34" ry="30" fill="#ff9a7a" ${SW}/><ellipse cx="0" cy="14" rx="16" ry="11" fill="#ffc4a8"/><circle cx="-5" cy="13" r="2" fill="${L}"/><circle cx="5" cy="13" r="2" fill="${L}"/>${face(0, -6, 11)}<path d="M26 18q18 6 22-10" fill="none" stroke="#ff9a7a" stroke-width="8" stroke-linecap="round"/></g>` },

  // ---- auras (around her) ----
  { id: 'sparkle-ring', slot: 'aura', rarity: 1, name: 'Sparkle ring', thumb: '20 30 200 200',
    art: [[60, 150, 14], [440, 120, 12], [470, 300, 10], [40, 330, 12], [120, 60, 9], [380, 470, 9], [100, 450, 11], [250, 490, 8]].map(([x, y, r], i) => `<g class="pl-twinkle" style="animation-delay:${i * .3}s;transform-origin:${x}px ${y}px">${star(x, y, r, i % 2 ? '#fff6d6' : '#ffe08a')}</g>`).join('') },
  { id: 'bubbles', slot: 'aura', rarity: 1, name: 'Soap bubbles', thumb: '20 160 200 200',
    art: [[70, 200, 22], [430, 220, 16], [50, 380, 14], [460, 420, 20], [140, 80, 12], [360, 60, 10]].map(([x, y, r], i) => `<g class="pl-bob" style="animation-delay:${i * .5}s"><circle cx="${x}" cy="${y}" r="${r}" fill="rgba(200,230,255,.35)" stroke="#b9dcff" stroke-width="2.5"/><path d="M${x - r * .5} ${y - r * .3}q${r * .2} ${-r * .3} ${r * .5} ${-r * .35}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>`).join('') },
  { id: 'sakura-storm', slot: 'aura', rarity: 2, name: 'Sakura flurry', thumb: '10 60 200 200',
    art: [[60, 120], [430, 90], [470, 260], [30, 300], [110, 430], [400, 440], [250, 20], [180, 480]].map(([x, y], i) => `<g class="pl-spin" style="animation-delay:${i * .4}s;transform-origin:${x}px ${y}px">${sakura(x, y, 9, i % 2 ? '#ffd3e6' : '#ffc2d9')}</g>`).join('') },
  { id: 'heart-rain', slot: 'aura', rarity: 3, name: 'Heart shower', thumb: '0 30 210 210',
    art: [[60, 110, .9, '#ffb8d2'], [440, 140, .8, '#ff9fb8'], [470, 330, .7, '#ffd3e6'], [30, 360, .8, '#ff9fb8'], [130, 40, .6, '#ffd3e6'], [370, 30, .7, '#ffb8d2'], [120, 470, .7, '#ffb8d2'], [400, 470, .6, '#ffd3e6']].map(([x, y, s, c], i) => `<g class="pl-bob" style="animation-delay:${i * .35}s">${heart(x, y, s * 1.3, c)}</g>`).join('') },

  // ---- backdrops (behind her) ----
  { id: 'big-moon', slot: 'back', rarity: 1, name: 'Harvest moon', thumb: '0 0 500 500',
    art: `<circle cx="250" cy="230" r="230" fill="#fff4cf" opacity=".9"/><circle cx="250" cy="230" r="230" fill="none" stroke="#ffe08a" stroke-width="6"/><circle cx="150" cy="150" r="30" fill="#fbe8a6"/><circle cx="360" cy="320" r="40" fill="#fbe8a6"/><circle cx="350" cy="120" r="18" fill="#fbe8a6"/>` },
  { id: 'cloud-bed', slot: 'back', rarity: 1, name: 'Cloud bed', thumb: '0 0 500 500',
    art: `<path d="M20 470c-30-40 10-90 60-70 10-50 90-60 110-10 30-40 110-30 120 20 40-30 110 0 100 50 40 0 60 60 20 80H40c-30 0-40-40-20-70z" fill="#fff" stroke="#d9e8ff" stroke-width="6"/><path d="M60 420q30-20 60 0M300 400q30-20 60 0" fill="none" stroke="#e3efff" stroke-width="6" stroke-linecap="round"/>` },
  { id: 'rainbow', slot: 'back', rarity: 2, name: 'Pastel rainbow', thumb: '0 0 500 500',
    art: ['#ffc2d9', '#ffe2b8', '#fff2a8', '#c8f7e1', '#cfe6ff', '#e2d6ff'].map((c, i) => `<path d="M${30 + i * 18} 420a${220 - i * 18} ${220 - i * 18} 0 0 1 ${440 - i * 36} 0" fill="none" stroke="${c}" stroke-width="18"/>`).join('') },
  { id: 'starry-night', slot: 'back', rarity: 3, name: 'Starry night', thumb: '0 0 500 500',
    art: `<circle cx="250" cy="250" r="245" fill="#3b2f6e"/><circle cx="250" cy="250" r="245" fill="url(#plNight)"/>${[[80, 120, 8], [400, 90, 10], [440, 300, 6], [60, 330, 7], [170, 60, 5], [330, 40, 6], [120, 420, 6], [380, 420, 8], [250, 470, 5]].map(([x, y, r]) => star(x, y, r, '#fff6d6')).join('')}<path d="M400 160a34 34 0 1 0 20 60 26 26 0 1 1-20-60z" fill="#ffe08a"/>` },
  // ---- worn on Yutu herself: these live in her .riv and switch by number (see yutuDress); `art` is only the thumbnail ----
  { id: 'crescent-tiara', slot: 'top', rarity: 2, name: 'Crescent tiara', rive: { hat: 3 }, thumb: '0 0 200 130',
    art: `<path d="M30 100q70-34 140 0" fill="none" stroke="${L}" stroke-width="13" stroke-linecap="round"/><path d="M30 100q70-34 140 0" fill="none" stroke="#ffc94a" stroke-width="7" stroke-linecap="round"/>
      <path d="M104 18a34 34 0 1 0 12 62a26 26 0 1 1-12-62z" fill="#ffe08a" ${SW}/><circle cx="100" cy="84" r="11" fill="#5fd3a5" ${SW}/>${star(46, 70, 11)}${star(154, 70, 11)}` },
  { id: 'bow-tie', slot: 'neck', rarity: 1, name: 'Ribbon bow tie', rive: { neck: 2 }, thumb: '0 0 200 130',
    art: `<path d="M100 65L44 35q-14 30 0 60zM100 65l56-30q14 30 0 60z" fill="#ff9cc5" ${SW}/><circle cx="100" cy="65" r="14" fill="#ff7eb3" ${SW}/>` },
  { id: 'coin-pendant', slot: 'neck', rarity: 2, name: 'Lucky coin pendant', rive: { neck: 3 }, thumb: '0 0 200 150',
    art: `<path d="M28 20q72 64 144 0" fill="none" stroke="#e0b060" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="88" r="34" fill="#ffd54a" ${SW}/><circle cx="100" cy="88" r="24" fill="none" stroke="#f2b230" stroke-width="4"/>${star(100, 88, 12, '#fff1c2')}` },
  { id: 'round-glasses', slot: 'eyes', rarity: 1, name: 'Round glasses', rive: { eyewear: 1 }, thumb: '0 0 200 110',
    art: `<circle cx="58" cy="58" r="34" fill="#ffffff" fill-opacity=".5" ${SW} stroke-width="6"/><circle cx="142" cy="58" r="34" fill="#ffffff" fill-opacity=".5" ${SW} stroke-width="6"/><path d="M92 54q8-8 16 0" fill="none" ${SW} stroke-width="6"/><circle cx="46" cy="46" r="7" fill="#fff"/><circle cx="130" cy="46" r="7" fill="#fff"/>` },
  { id: 'heart-shades', slot: 'eyes', rarity: 2, name: 'Heart sunglasses', rive: { eyewear: 2 }, thumb: '0 0 200 110',
    art: `${heart(56, 50, 2.3, '#ff7eb3')}${heart(144, 50, 2.3, '#ff7eb3')}<path d="M88 46q12-10 24 0" fill="none" ${SW} stroke-width="5"/><ellipse cx="44" cy="40" rx="7" ry="5" fill="#fff" opacity=".85"/><ellipse cx="132" cy="40" rx="7" ry="5" fill="#fff" opacity=".85"/>` },
  { id: 'cheek-hearts', slot: 'eyes', rarity: 1, name: 'Cheek heart stickers', rive: { eyewear: 3 }, thumb: '0 0 200 110',
    art: `<ellipse cx="56" cy="62" rx="40" ry="26" fill="#ffd3e6"/><ellipse cx="144" cy="62" rx="40" ry="26" fill="#ffd3e6"/>${heart(56, 60, 1.5, '#ff7eb3')}${heart(144, 60, 1.5, '#ff7eb3')}${star(84, 36, 8, '#fff')}${star(172, 36, 8, '#fff')}` },
];
export const SLOTS = [
  { id: 'top', name: 'Crowns' }, { id: 'neck', name: 'Necklaces' }, { id: 'eyes', name: 'Glasses' }, { id: 'buddy', name: 'Buddies' }, { id: 'aura', name: 'Auras' }, { id: 'back', name: 'Backdrops' },
];
// what Yutu wears in her .riv for the items equipped (her moon gem and ribbon collar when nothing is chosen)
export function outfitFor(equipped = {}) {
  const r = slot => itemById(equipped[slot])?.rive || {};
  return { hat: r('top').hat ?? 1, neck: r('neck').neck ?? 1, eyewear: r('eyes').eyewear ?? 0 };
}
const DEFS = `<defs><radialGradient id="plNight" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#8a72d8" stop-opacity=".6"/><stop offset="1" stop-color="#3b2f6e" stop-opacity="0"/></radialGradient></defs>`;
export const itemById = id => ITEMS.find(i => i.id === id);
export const RARITY = { 1: { name: 'Cute', stars: '★' }, 2: { name: 'Rare', stars: '★★' }, 3: { name: 'Super rare', stars: '★★★' } };

export function itemThumb(it, size = 72) {
  const vb = it.thumb || '0 0 500 500';
  return `<svg class="pl-thumb" viewBox="${vb}" width="${size}" height="${size}" aria-hidden="true">${DEFS}${it.art}</svg>`;
}
// layers that sit behind and in front of Yutu's canvas
export function wearLayers(equipped = {}) {
  const pick = slot => { const it = itemById(equipped[slot]); return it && !it.rive ? it : null; };
  const back = pick('back'), top = pick('top'), buddy = pick('buddy'), aura = pick('aura');
  return {
    back: back ? `<svg class="wear wear-back" viewBox="0 0 500 500" aria-hidden="true">${DEFS}${back.art}</svg>` : '',
    front: (top || buddy || aura) ? `<svg class="wear wear-front" viewBox="0 0 500 500" aria-hidden="true">${DEFS}
      ${aura ? `<g class="wear-aura">${aura.art}</g>` : ''}${top ? `<g class="wear-top">${top.art}</g>` : ''}${buddy ? `<g class="wear-buddy">${buddy.art}</g>` : ''}</svg>` : '',
  };
}
export function rollGacha(owned = []) {
  // weights: cute 65% · rare 28% · super rare 7%
  const r = Math.random(), rarity = r < .07 ? 3 : r < .35 ? 2 : 1;
  const pool = ITEMS.filter(i => i.rarity === rarity);
  const fresh = pool.filter(i => !owned.includes(i.id));
  const list = fresh.length && Math.random() < .75 ? fresh : pool;   // nudge toward new items
  return list[Math.floor(Math.random() * list.length)];
}
// the capsule machine (drawn), with the window showing capsules inside
/* ---------- hand-drawn helpers (manga ink sketch) ---------- */
const INK = '#2f2a33';
// tiny seeded random so every drawing wobbles the same way each time
const rng = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const fx = n => n.toFixed(1);
// a closed wobbly shape through points on a circle
function wobCircle(cx, cy, r, seed = 1, amt = 1.6, n = 40) {
  const R = rng(seed * 97 + 13), pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = r + (R() - .5) * amt * 2; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  return smooth(pts, true);
}
// a wobbly polygon (corners kept, edges bent a little)
function wobPoly(pts, seed = 1, amt = 1.4, steps = 6) {
  const R = rng(seed * 31 + 7), out = [];
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    for (let t = 0; t < steps; t++) { const u = t / steps; out.push([p[0] + (q[0] - p[0]) * u + (t ? (R() - .5) * amt * 2 : 0), p[1] + (q[1] - p[1]) * u + (t ? (R() - .5) * amt * 2 : 0)]); }
  });
  return smooth(out, true, .12);
}
function smooth(pts, closed, k = .18) {
  const P = i => pts[(i + pts.length) % pts.length];
  let d = `M${fx(pts[0][0])} ${fx(pts[0][1])}`;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += `C${fx(p1[0] + (p2[0] - p0[0]) * k)} ${fx(p1[1] + (p2[1] - p0[1]) * k)} ${fx(p2[0] - (p3[0] - p1[0]) * k)} ${fx(p2[1] - (p3[1] - p1[1]) * k)} ${fx(p2[0])} ${fx(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
// ink the shape twice: a firm line plus a lighter, slightly shifted "pencil" line
const inked = (d, fill = 'none', w = 3) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const pencil = (d, dx = 1.5, dy = -1) => `<path d="${d}" transform="translate(${dx} ${dy})" fill="none" stroke="${INK}" stroke-width="1.2" stroke-opacity=".35" stroke-dasharray="40 10 14 8 70 12"/>`;
// diagonal hatching clipped to a shape, like pen shading
function hatch(id, d, gap = 7, ang = 45, op = .35, w = 1.3) {
  const lines = [];
  for (let x = -480; x < 480; x += gap) lines.push(`M${x} -40L${x + 560} 520`);
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})"><path d="${lines.join('')}" transform="rotate(${ang - 45} 210 235)" stroke="${INK}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/></g>`;
}
const screentone = (id, d, op = .3, size = 7) => `<pattern id="${id}p" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="${size / 2}" cy="${size / 2}" r="1.3" fill="${INK}" fill-opacity="${op}"/></pattern><path d="${d}" fill="url(#${id}p)"/>`;
const inkStar = (x, y, r) => `<path d="M${x} ${y - r}Q${x + r * .16} ${y - r * .16} ${x + r} ${y}Q${x + r * .16} ${y + r * .16} ${x} ${y + r}Q${x - r * .16} ${y + r * .16} ${x - r} ${y}Q${x - r * .16} ${y - r * .16} ${x} ${y - r}Z" fill="${INK}"/>`;

export function machineSVG() {
  const caps = [[150, 128, 0], [207, 104, 1], [262, 128, 2], [180, 172, 3], [238, 178, 4], [290, 170, 1], [134, 186, 2]];
  const capFill = ['var(--mm-pink-soft, #f3e2e5)', '#fff', 'var(--accent-soft, #f1e3e6)', 'var(--mm-pink, #d9a7b0)', '#fff'];
  const globe = wobCircle(210, 150, 120, 3, 1.8, 48);
  const body = wobPoly([[110, 262], [310, 262], [330, 440], [90, 440]], 5, 1.6);
  const band = wobPoly([[94, 240], [326, 240], [326, 264], [94, 264]], 8, 1.2, 8);
  const chute = wobPoly([[236, 384], [294, 384], [294, 426], [236, 426]], 9, 1.2);
  const knob = wobCircle(210, 330, 34, 11, 1.4, 28);
  const handle = wobPoly([[200, 300], [220, 300], [220, 360], [200, 360]], 12, 1, 5);
  return `<svg class="machine machine-ink" data-no-ink viewBox="0 0 420 470" role="img" aria-label="Capsule machine">
    <defs></defs>
    <!-- ground shading -->
    <path d="M86 452q60 -5 124 -2t128 1M110 461q50 -3 100 -1" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
    <!-- body -->
    ${inked(body, '#fff')}
    ${hatch('mh1', 'M111 263L168 263L158 439L92 439Z', 8, 60, .3)}
    ${screentone('mt1', 'M240 280h80l12 156h-92z', .28)}
    ${pencil(body)}
    <!-- glass globe with capsules -->
    ${inked(globe, '#fff')}
    <g class="machine-caps">${caps.map(([x, y, c], n) => {
      const cap = wobCircle(x, y, 24, 20 + n, 1, 22), top = `M${x - 24} ${y}A24 24 0 0 1 ${x + 24} ${y}Z`;
      return `<g>${inked(cap, '#fff', 2.4)}<path d="${top}" fill="${capFill[c]}"/>${c === 3 ? hatch('mc' + n, top, 5, 30, .3, 1) : ''}${inked(cap, 'none', 2.4)}
        <path d="M${x - 23} ${y + 1}q12 -2 23 0t23 -1" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M${x - 12} ${y - 12}q4 -5 10 -6" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></g>`;
    }).join('')}</g>
    ${screentone('mt2', `M300 110A120 120 0 0 1 250 262L330 262L330 110Z`, .18)}
    <path d="M118 96q18 -44 76 -66" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".95"/>
    <path d="M128 112q4 -10 10 -17" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <path d="M300 214q14 -22 18 -52" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
    ${pencil(globe, 2, -1.5)}
    <!-- collar -->
    ${inked(band, 'var(--mm-pink, #d9a7b0)')}
    ${hatch('mh2', band, 5, 30, .25, 1)}
    <!-- knob, with little manga motion marks -->
    <g class="machine-knob">${inked(knob, '#fff')}${inked(handle, 'var(--mm-pink-soft, #f3e2e5)', 2.6)}</g>
    <path d="M160 300q-8 12 -6 28M156 340q2 10 8 18M260 300q8 12 6 28M264 340q-2 10 -8 18" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    <!-- prize chute -->
    ${inked(chute, '#fff', 2.6)}
    ${hatch('mh3', wobPoly([[244, 394], [286, 394], [286, 416], [244, 416]], 14, .8), 4, 45, .55, 1.2)}
    <!-- hand-lettered sign -->
    <text x="146" y="414" font-size="27" font-family="var(--hand, 'Hachi Maru Pop'), cursive" fill="${INK}" transform="rotate(-4 170 405)">ガチャ</text>
    <path d="M144 422q30 4 62 -2" fill="none" stroke="var(--mm-pink-deep, #b47885)" stroke-width="2.2" stroke-linecap="round"/>
    <!-- sparkles -->
    ${inkStar(54, 62, 13)}${inkStar(372, 92, 9)}${inkStar(362, 300, 7)}${inkStar(70, 300, 5)}
    <g fill="var(--mm-pink, #d9a7b0)"><circle cx="390" cy="140" r="4"/><circle cx="40" cy="120" r="3"/></g>
  </svg>`;
}
export function capsuleSVG(color = '#ffc2d9') {
  const top = 'M14 60a46 46 0 0 1 92 0z', bottom = 'M14 60h92a46 46 0 0 1-92 0z';
  const outline = wobCircle(60, 60, 46, 4, 1.3, 32);
  return `<svg class="capsule capsule-ink" data-no-ink viewBox="0 0 120 120" aria-hidden="true">
    <g class="cap-top">${inked(wobPoly([[14, 60], [30, 26], [60, 14], [90, 26], [106, 60]], 2, 1, 5), 'var(--mm-pink-soft, #f3e2e5)', 2.6)}
      ${hatch('ch', top, 6, 30, .25, 1.1)}<path d="M34 38q6 -9 16 -13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>
    <g class="cap-bottom">${inked(wobPoly([[14, 60], [106, 60], [90, 94], [60, 106], [30, 94]], 3, 1, 5), '#fff', 2.6)}${screentone('ct', bottom, .22, 6)}</g>
    ${pencil(outline, 1.5, -1)}
  </svg>`;
}

/* ------------------------------------------------------------------ */
/* Omikuji (daily fortune)                                             */
/* ------------------------------------------------------------------ */
export const FORTUNES = [
  { rank: '大吉', read: 'Daikichi', en: 'Great blessing!', msg: 'A coin saved today shines twice as bright. Treat yourself to a free joy: a walk under the moon.' },
  { rank: '中吉', read: 'Chūkichi', en: 'Middle blessing', msg: 'Your budget is a garden. Water it a little today: log every treat, even the tiny ones.' },
  { rank: '小吉', read: 'Shōkichi', en: 'Small blessing', msg: 'Small savings, big smiles. Try one no-spend snack today and give the coins to Bao.' },
  { rank: '吉', read: 'Kichi', en: 'Blessing', msg: 'Lucky item: your water bottle. Bringing your own saves boba money for the weekend.' },
  { rank: '末吉', read: 'Suekichi', en: 'Future blessing', msg: 'Good things are on their way. Peek at your goals; you’re closer than you think.' },
  { rank: '大吉', read: 'Daikichi', en: 'Great blessing!', msg: 'The moon is full of luck tonight. A perfect day to add a little to a treasure.' },
  { rank: '吉', read: 'Kichi', en: 'Blessing', msg: 'Lucky color: jade green. Wait one day before any “maybe” purchase.' },
  { rank: '中吉', read: 'Chūkichi', en: 'Middle blessing', msg: 'Your future self sends a hug. Check your subscriptions; one might be napping.' },
];
export const fortuneFor = dateStr => {
  let h = 7; for (const ch of dateStr) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) % FORTUNES.length;
};
export function omikujiBoxSVG() {
  const box = wobPoly([[30, 44], [110, 44], [110, 150], [30, 150]], 21, 1.1);
  const roof = wobPoly([[24, 46], [70, 16], [116, 46]], 22, 1, 6);
  const label = wobPoly([[52, 64], [88, 64], [88, 130], [52, 130]], 23, .8, 5);
  const stick = wobPoly([[64, 2], [76, 2], [76, 36], [64, 36]], 24, .6, 4);
  return `<svg class="omikuji-box omikuji-ink" data-no-ink viewBox="0 0 140 160" aria-hidden="true">
    <g class="stick">${inked(stick, '#fff', 2)}<path d="M66 10h8" stroke="var(--mm-pink-deep, #b47885)" stroke-width="2" stroke-linecap="round"/></g>
    ${inked(box, '#fff', 2.4)}
    <!-- wood grain, drawn with a pen -->
    <path d="M36 60q4 30 0 60M42 52q3 40 -2 90M98 56q-4 34 2 84M104 70q-2 30 0 60" fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round" opacity=".35"/>
    ${hatch('oh', 'M30 120h80v30H30z', 5, 45, .3, 1)}
    ${inked(roof, 'var(--mm-pink, #d9a7b0)', 2.4)}
    ${hatch('or', 'M24 46L70 16L116 46Z', 4.5, 20, .28, 1)}
    ${inked(label, '#fff', 1.8)}
    <text x="70" y="90" text-anchor="middle" font-size="18" fill="${INK}" font-family="var(--title)">お</text>
    <text x="70" y="116" text-anchor="middle" font-size="18" fill="${INK}" font-family="var(--title)">み</text>
    ${pencil(box, 1.2, -1)}
    ${inkStar(120, 30, 7)}${inkStar(20, 78, 5)}<circle cx="18" cy="40" r="2.5" fill="var(--mm-pink, #d9a7b0)"/>
  </svg>`;
}

/* ------------------------------------------------------------------ */
/* Friendship                                                          */
/* ------------------------------------------------------------------ */
export const HEARTS_PER_LEVEL = 10;
export const friendLevel = hearts => Math.floor((hearts || 0) / HEARTS_PER_LEVEL) + 1;
export const FRIEND_TITLES = ['New friends', 'Moon buddies', 'Tea-time pals', 'Mochi partners', 'Best friends', 'Soulmates of the moon'];

/* ------------------------------------------------------------------ */
/* Savings plant: grows from seed to full bloom with a goal's progress */
/* ------------------------------------------------------------------ */
export function plantSVG(pct = 0) {
  const p = Math.max(0, Math.min(100, pct));
  const stage = p >= 100 ? 4 : p >= 66 ? 3 : p >= 33 ? 2 : p > 0 ? 1 : 0;
  const pot = `<path d="M28 78h44l-6 26a6 6 0 0 1-6 5H40a6 6 0 0 1-6-5z" fill="#ffc9a8" ${SW}/><rect x="24" y="70" width="52" height="12" rx="6" fill="#ffb38a" ${SW}/>${face(50, 92, 6)}`;
  const parts = [
    `<ellipse cx="50" cy="69" rx="7" ry="4.5" fill="#c89b6d" ${SW}/>`,
    `<path d="M50 70v-14" stroke="#5fae86" stroke-width="4" stroke-linecap="round"/><path d="M50 58c-4-9-13-10-17-7 2 7 10 10 17 7z" fill="#bdf0d4" ${SW}/><path d="M50 58c4-9 13-10 17-7-2 7-10 10-17 7z" fill="#a6e8c4" ${SW}/>`,
    `<path d="M50 70v-30" stroke="#5fae86" stroke-width="4" stroke-linecap="round"/><path d="M50 56c-6-10-17-10-21-6 3 8 13 11 21 6z" fill="#bdf0d4" ${SW}/><path d="M50 50c6-10 17-10 21-6-3 8-13 11-21 6z" fill="#a6e8c4" ${SW}/><path d="M50 40c-6-4-6-14 0-18 6 4 6 14 0 18z" fill="#ffd3e6" ${SW}/>`,
    `<path d="M50 70v-34" stroke="#5fae86" stroke-width="4" stroke-linecap="round"/><path d="M50 58c-6-10-17-10-21-6 3 8 13 11 21 6z" fill="#bdf0d4" ${SW}/><path d="M50 52c6-10 17-10 21-6-3 8-13 11-21 6z" fill="#a6e8c4" ${SW}/>${sakura(50, 30, 7, '#ffd3e6')}`,
    `<path d="M50 70v-36" stroke="#5fae86" stroke-width="4" stroke-linecap="round"/><path d="M50 58c-6-10-17-10-21-6 3 8 13 11 21 6z" fill="#bdf0d4" ${SW}/><path d="M50 52c6-10 17-10 21-6-3 8-13 11-21 6z" fill="#a6e8c4" ${SW}/>${sakura(50, 26, 11)}${star(20, 22, 7)}${star(82, 14, 6, '#fff6d6')}${star(84, 46, 5, '#ffd3e6')}`,
  ];
  const label = ['a seed', 'a sprout', 'a bud', 'nearly blooming', 'in full bloom'][stage];
  return `<svg class="plant stage-${stage}" viewBox="0 0 100 112" role="img" aria-label="Savings plant: ${label}">${parts[stage]}${pot}</svg>`;
}

/* ------------------------------------------------------------------ */
/* Diary stickers                                                      */
/* ------------------------------------------------------------------ */
const stickerFace = (fill, eyes, mouth, extra = '') => `<svg class="sticker" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="25" r="19" fill="${fill}" ${SW}/>${eyes}${mouth}<ellipse cx="12" cy="30" rx="4" ry="2.4" fill="#ff9fb8" opacity=".8"/><ellipse cx="36" cy="30" rx="4" ry="2.4" fill="#ff9fb8" opacity=".8"/>${extra}</svg>`;
const dotEyes = `<circle cx="17" cy="23" r="2.6" fill="${L}"/><circle cx="31" cy="23" r="2.6" fill="${L}"/>`;
const happyEyes = `<path d="M13 24q4-5 8 0M27 24q4-5 8 0" fill="none" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`;
export const STICKERS = [
  { id: 'happy', name: 'Happy', svg: stickerFace('#fff2a8', happyEyes, `<path d="M19 30q5 6 10 0" fill="none" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`) },
  { id: 'love', name: 'In love', svg: stickerFace('#ffd3e6', `<path d="M17 26c-4-2.6-5-5.6-3-6.6 1.2-.6 2.4 0 3 1 .6-1 1.8-1.6 3-1 2 1 1 4-3 6.6zM31 26c-4-2.6-5-5.6-3-6.6 1.2-.6 2.4 0 3 1 .6-1 1.8-1.6 3-1 2 1 1 4-3 6.6z" fill="#ff7eb3"/>`, `<path d="M20 31q4 4 8 0" fill="none" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`) },
  { id: 'proud', name: 'Proud', svg: stickerFace('#c8f7e1', happyEyes, `<path d="M18 30h12q-1 6-6 6t-6-6z" fill="#e0607e" stroke="${L}" stroke-width="2"/>`, `<path d="M38 8l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z" fill="#ffd166"/>`) },
  { id: 'calm', name: 'Calm', svg: stickerFace('#cfe6ff', `<path d="M13 24h8M27 24h8" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`, `<path d="M21 31q3 2 6 0" fill="none" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`) },
  { id: 'tired', name: 'Sleepy', svg: stickerFace('#e2d6ff', `<path d="M13 23q4 4 8 0M27 23q4 4 8 0" fill="none" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`, `<ellipse cx="24" cy="32" rx="2.6" ry="3" fill="${L}"/>`, `<text x="34" y="14" font-size="10" font-weight="900" fill="${L}">z</text>`) },
  { id: 'sad', name: 'Sad', svg: stickerFace('#d6f0ff', dotEyes, `<path d="M19 33q5-5 10 0" fill="none" stroke="${L}" stroke-width="2.6" stroke-linecap="round"/>`, `<path d="M33 27q3 5 0 7q-3-2 0-7z" fill="#8fd3ff"/>`) },
];
export const stickerById = id => STICKERS.find(s => s.id === id);

/* ------------------------------------------------------------------ */
/* Soft sounds (made on the fly with Web Audio: no files to download)  */
/* ------------------------------------------------------------------ */
let ac = null;
const ctx = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; } catch { return null; } };
function tone(freq, start, dur, { type = 'sine', vol = .08, slide = 0 } = {}) {
  const a = ctx(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + start;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
}
export const SOUNDS = {
  pop: () => { tone(660, 0, .12, { type: 'triangle', slide: 1.6 }); },
  coin: () => { tone(988, 0, .12, { type: 'square', vol: .03 }); tone(1319, .08, .25, { type: 'square', vol: .03 }); },
  chime: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .08, .5, { vol: .06 })),
  sparkle: () => [1568, 2093, 2637].forEach((f, i) => tone(f, i * .05, .25, { vol: .03 })),
  pet: () => { tone(880, 0, .15, { type: 'triangle', vol: .05, slide: 1.25 }); tone(1175, .1, .2, { type: 'triangle', vol: .04 }); },
  roll: () => { for (let i = 0; i < 8; i++) tone(300 + i * 40, i * .07, .06, { type: 'triangle', vol: .04 }); },
  oops: () => { tone(523, 0, .18, { type: 'triangle', vol: .05, slide: .8 }); tone(415, .16, .25, { type: 'triangle', vol: .05, slide: .8 }); },
  page: () => tone(1200, 0, .08, { type: 'triangle', vol: .02, slide: .5 }),
};

/* ------------------------------------------------------------------ */
/* Yutu's monthly letter                                               */
/* ------------------------------------------------------------------ */
export function letterHTML({ monthName, name, spent, saved, income, topCat, budgetTotal, bestStreak, logged, money, nextMonthName }) {
  const dear = name ? `Dear ${name},` : 'Dear friend,';
  const lines = [];
  if (!logged) lines.push(`${monthName} was a quiet month in our little ledger. That’s okay! The moon rests sometimes too.`);
  else {
    lines.push(`Can you believe ${monthName} is a whole chapter already? You visited our ledger on <b>${logged}</b> ${logged === 1 ? 'day' : 'days'} ♡`);
    if (saved > 0) lines.push(`You saved <b>${money(saved)}</b>, and Bao has been hugging every coin. I pounded extra mochi in your honor.`);
    else lines.push(`We didn’t save this time, but every chapter is a fresh start. Even one coin next month will make Bao so happy.`);
    if (budgetTotal > 0) lines.push(spent <= budgetTotal ? `You stayed inside your budget (${money(spent)} of ${money(budgetTotal, true)}). I’m so proud of you!` : `We went a little past the budget (${money(spent)} of ${money(budgetTotal, true)}). No worries; we’ll hop back on track together.`);
    if (topCat) lines.push(`Your biggest category was <b>${topCat}</b>. ${topCat === 'Food' ? 'Yummy chapter!' : 'Something to peek at next time ✧'}`);
    if (bestStreak >= 3) lines.push(`Your best no-spend streak was <b>${bestStreak} days</b>. That’s so impressive (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`);
  }
  lines.push(`I can’t wait to see what ${nextMonthName} brings.`);
  return `<div class="letter-paper"><p class="letter-dear">${dear}</p>${lines.map(l => `<p>${l}</p>`).join('')}
    <p class="letter-sign">With love from the moon,<br>Yutu ♡</p></div>`;
}
