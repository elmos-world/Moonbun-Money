// Magical-girl versions of Yutu's buddies, auras and backdrops, hand-drawn in SVG to match the charm
// icons: pastel fills, a plum outline, glossy white shine and gold sparkles. Drawn in her 500×500 space:
// buddies bob beside her (bottom right), auras float around her, backdrops sit behind her.
// The animation classes (pl-twinkle, pl-bob, pl-spin) are the ones play.js already uses.
const L = '#6b4672';
const O = `stroke="${L}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const o2 = `stroke="${L}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const shine = d => `<path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/>`;
const sparkle = (x, y, r, c = '#ffe28f') =>
  `<path d="M${x} ${y - r}Q${x + r * .18} ${y - r * .18} ${x + r} ${y}Q${x + r * .18} ${y + r * .18} ${x} ${y + r}Q${x - r * .18} ${y + r * .18} ${x - r} ${y}Q${x - r * .18} ${y - r * .18} ${x} ${y - r}Z" fill="${c}" ${o2}/>`;
const heart = (x, y, s, c = '#ffb3d4') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 12C-10 5-16-1-16-7c0-5 3.5-8.5 8-8.5 3.5 0 6 2.4 8 5 2-2.6 4.5-5 8-5 4.5 0 8 3.5 8 8.5 0 6-6 12-16 19z" fill="${c}" ${o2}/><path d="M-9-8c-2 .5-3 2-3 4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></g>`;
const petal = (x, y, s, c = '#ffc6de') =>
  `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map(a => `<path transform="rotate(${a})" d="M0 0C-5-6-5-13 0-16c5 3 5 10 0 16z" fill="${c}" ${o2}/>`).join('')}<circle r="2.6" fill="#ffe28f"/></g>`;
// a kawaii face: two shiny eyes, a tiny smile and blush
const face = (x, y, w, eye = 3.4) =>
  `<g><ellipse cx="${x - w}" cy="${y}" rx="${eye}" ry="${eye * 1.25}" fill="${L}"/><ellipse cx="${x + w}" cy="${y}" rx="${eye}" ry="${eye * 1.25}" fill="${L}"/>
   <circle cx="${x - w - eye * .35}" cy="${y - eye * .45}" r="${eye * .38}" fill="#fff"/><circle cx="${x + w - eye * .35}" cy="${y - eye * .45}" r="${eye * .38}" fill="#fff"/>
   <path d="M${x - 3} ${y + 5}q3 3 6 0" fill="none" stroke="${L}" stroke-width="1.8" stroke-linecap="round"/>
   <ellipse cx="${x - w - 4}" cy="${y + 6}" rx="${eye * 1.2}" ry="${eye * .7}" fill="#ff9cc7" opacity=".55"/><ellipse cx="${x + w + 4}" cy="${y + 6}" rx="${eye * 1.2}" ry="${eye * .7}" fill="#ff9cc7" opacity=".55"/></g>`;
const shadow = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * .25}" fill="#c8a4d8" opacity=".3"/>`;
const wing = (x, y, flip = 1) =>
  `<path transform="translate(${x} ${y}) scale(${flip} 1)" d="M0 0c10-12 26-12 30-4-6 2-8 6-14 7 4 3 4 7-2 8-6 1-10-4-14-11z" fill="#fff" ${o2}/>`;

export const WEAR_MAGIC = {
  /* ---------- buddies ---------- */
  chick: `<g transform="translate(450 392)">${shadow(0, 26, 26)}${wing(-28, 0, -1)}${wing(28, 0)}
    <path d="M-27 2a27 25 0 0 1 54 0c0 17-12 25-27 25s-27-8-27-25z" fill="#ffe58f" ${O}/>
    <path d="M-4-23c1-8 7-10 10-6-3 0-5 2-6 6" fill="#ffe58f" ${o2}/>
    <path d="M-12-20c-6-6-4-12 2-10 4 1 5 6 2 10zM-12-20c2-8 8-9 10-4-2 3-6 4-10 4z" fill="#ff9cc7" ${o2}/>
    <path d="M-5 6l5 5 5-5z" fill="#ffb36b" ${o2}/>${face(0, 0, 10)}${shine('M-18-6c2-6 6-10 11-12')}${sparkle(30, -26, 7)}</g>`,
  mochi: `<g transform="translate(452 396)">${shadow(0, 22, 30)}
    <path d="M-32 20c-6-32 12-46 32-46s38 14 32 46z" fill="#fff4f8" ${O}/>
    <path d="M-26 18c-2-10 0-18 6-24" fill="none" stroke="#ffd0e4" stroke-width="5" stroke-linecap="round"/>
    ${petal(14, -24, .9)}${face(0, 4, 10)}${shine('M-16-14c4-5 9-7 14-8')}${sparkle(-34, -18, 6, '#ffc6de')}</g>`,
  'star-sprite': `<g transform="translate(452 386)">${shadow(0, 40, 24)}${wing(-30, 4, -1)}${wing(30, 4)}
    <path d="M0-38l11 22 24 4-17 17 4 24L0 18l-22 11 4-24-17-17 24-4z" fill="#ffe58f" ${O}/>
    ${face(0, 2, 8, 3)}${shine('M-8-18l4-9')}${sparkle(32, -34, 8, '#fff7d6')}${sparkle(-34, 30, 6, '#ffc6de')}</g>`,
  jelly: `<g transform="translate(452 380)">${shadow(0, 52, 22)}
    ${['#ffb3d4', '#b9f0dc', '#d9c8ff', '#ffe58f'].map((c, i) => `<path d="M${-18 + i * 12} 8q${i % 2 ? 7 : -7} 12 0 22t0 20" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`).join('')}
    <path d="M-32 8a32 32 0 0 1 64 0q-8 6-16 0t-16 0-16 0-16 0z" fill="#e6dcff" fill-opacity=".92" ${O}/>
    ${face(0, -6, 9)}${shine('M-20-12c3-8 9-13 16-15')}${sparkle(0, -34, 6)}<circle cx="18" cy="-16" r="3" fill="#fff" opacity=".8"/></g>`,
  'mini-bao': `<g transform="translate(452 386)">${shadow(0, 34, 30)}
    <path d="M30 14c22-6 26 14 10 18" fill="none" stroke="#f08a84" stroke-width="7" stroke-linecap="round"/>${heart(44, 30, .55, '#fa958e')}
    ${wing(-30, -6, -1)}${wing(30, -6)}
    <path d="M-20-24l-6-18 14 10M20-24l6-18-14 10" fill="#fff3dc" ${o2}/>
    <ellipse cx="0" cy="2" rx="34" ry="31" fill="#fa958e" ${O}/>
    <ellipse cx="0" cy="18" rx="17" ry="12" fill="#ffe3cf" ${o2}/>
    <path d="M-30-6l-10-4 4 10M30-6l10-4-4 10" fill="#f6807a" ${o2}/>
    ${face(0, -2, 11, 3.6)}<path d="M2 7l2 4 2-4" fill="#fff" stroke="${L}" stroke-width="1"/>${shine('M-22-14c3-6 8-10 14-12')}${sparkle(-34, -30, 7)}</g>`,

  /* ---------- auras ---------- */
  'sparkle-ring': [[60, 150, 15], [440, 120, 13], [470, 300, 11], [40, 330, 13], [120, 60, 10], [380, 470, 10], [100, 450, 12], [250, 490, 9]]
    .map(([x, y, r], i) => `<g class="pl-twinkle" style="animation-delay:${i * .3}s;transform-origin:${x}px ${y}px">${sparkle(x, y, r, ['#ffe28f', '#fff7d6', '#ffc6de', '#e6dcff'][i % 4])}<circle cx="${x + r + 4}" cy="${y - r}" r="2.4" fill="#ffe28f"/></g>`).join(''),
  bubbles: [[70, 200, 22], [430, 220, 17], [50, 380, 15], [460, 420, 21], [140, 80, 13], [360, 60, 11]]
    .map(([x, y, r], i) => `<g class="pl-bob" style="animation-delay:${i * .5}s"><circle cx="${x}" cy="${y}" r="${r}" fill="#f3ecff" fill-opacity=".55" stroke="#c8b2ff" stroke-width="2.4"/>
      <path d="M${x - r * .55} ${y - r * .2}a${r * .6} ${r * .6} 0 0 1 ${r * .45} ${-r * .4}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <path d="M${x + r * .35} ${y + r * .55}a${r * .5} ${r * .5} 0 0 0 ${r * .3} ${-r * .3}" fill="none" stroke="#ffb3d4" stroke-width="2" stroke-linecap="round"/></g>`).join(''),
  'sakura-storm': [[60, 120], [430, 90], [470, 260], [30, 300], [110, 430], [400, 440], [250, 20], [180, 480]]
    .map(([x, y], i) => `<g class="pl-spin" style="animation-delay:${i * .4}s;transform-origin:${x}px ${y}px">${petal(x, y, .85, i % 2 ? '#ffd6e8' : '#ffb3d4')}</g>`).join(''),
  'heart-rain': [[60, 110, .95, '#ffb3d4'], [440, 140, .85, '#ff9cc7'], [470, 330, .75, '#ffd6e8'], [30, 360, .85, '#ff9cc7'], [130, 40, .65, '#e6dcff'], [370, 30, .75, '#ffb3d4'], [120, 470, .75, '#ffd6e8'], [400, 470, .65, '#ffb3d4']]
    .map(([x, y, s, c], i) => `<g class="pl-bob" style="animation-delay:${i * .35}s">${heart(x, y, s * 1.3, c)}</g>`).join(''),

  /* ---------- backdrops ---------- */
  'big-moon': `<circle cx="250" cy="230" r="236" fill="#fff3c4" opacity=".55"/>
    <circle cx="250" cy="230" r="214" fill="#fff8dc" stroke="#f2c96d" stroke-width="10"/><circle cx="250" cy="230" r="214" fill="none" stroke="#fff" stroke-width="3"/>
    <circle cx="150" cy="150" r="30" fill="#ffe3ef" stroke="#f7bfd8" stroke-width="3"/><circle cx="360" cy="320" r="40" fill="#ffe3ef" stroke="#f7bfd8" stroke-width="3"/><circle cx="350" cy="120" r="18" fill="#ffe3ef" stroke="#f7bfd8" stroke-width="3"/>
    <path d="M90 170a170 170 0 0 1 70-110" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".8"/>
    ${sparkle(470, 40, 14)}${sparkle(30, 420, 11, '#ffc6de')}`,
  'cloud-bed': `<path d="M20 470c-30-40 10-90 60-70 10-50 90-60 110-10 30-40 110-30 120 20 40-30 110 0 100 50 40 0 60 60 20 80H40c-30 0-40-40-20-70z" fill="#fff" ${O}/>
    <path d="M40 470c40 14 380 14 420 0" fill="none" stroke="#e6dcff" stroke-width="14" stroke-linecap="round"/>
    <path d="M70 430q30-22 62 0M290 412q30-22 62 0" fill="none" stroke="#ffd6e8" stroke-width="6" stroke-linecap="round"/>
    ${sparkle(60, 340, 10)}${sparkle(440, 350, 12, '#ffc6de')}${sparkle(250, 380, 8, '#e6dcff')}`,
  rainbow: `${['#ffb3d4', '#ffd3b0', '#fff0a8', '#c3f1df', '#cfe2ff', '#dccbff'].map((c, i) => `<path d="M${30 + i * 18} 420a${220 - i * 18} ${220 - i * 18} 0 0 1 ${440 - i * 36} 0" fill="none" stroke="${c}" stroke-width="18"/>`).join('')}
    <path d="M30 420a220 220 0 0 1 440 0M138 420a112 112 0 0 1 224 0" fill="none" ${O}/>
    <path d="M10 436c-6-20 18-32 32-20 8-14 34-12 38 4 14-6 26 8 18 20z" fill="#fff" ${O}/><path d="M402 436c-6-20 18-32 32-20 8-14 34-12 38 4 14-6 26 8 18 20z" fill="#fff" ${O}/>
    ${sparkle(250, 170, 12)}${sparkle(130, 250, 8, '#ffc6de')}${sparkle(370, 250, 8, '#e6dcff')}`,
  'starry-night': `<defs><radialGradient id="sn-glow" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#b9a0f5" stop-opacity=".7"/><stop offset="1" stop-color="#4b3d8f" stop-opacity="0"/></radialGradient></defs>
    <circle cx="250" cy="250" r="245" fill="#4b3d8f"/><circle cx="250" cy="250" r="245" fill="url(#sn-glow)"/>
    <circle cx="250" cy="250" r="239" fill="none" stroke="#f2c96d" stroke-width="6"/>
    ${[[80, 120, 9], [400, 90, 11], [440, 300, 7], [60, 330, 8], [170, 60, 6], [330, 40, 7], [120, 420, 7], [380, 420, 9], [250, 470, 6]].map(([x, y, r], i) => sparkle(x, y, r, i % 3 ? '#fff7d6' : '#ffe28f')).join('')}
    <path d="M412 150a38 38 0 1 0 22 66 30 30 0 1 1-22-66z" fill="#ffe58f" ${O}/>
    ${[[100, 220], [420, 380], [300, 120], [200, 400]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#ffd6e8"/>`).join('')}`,
};

// close-up wardrobe pictures for the auras (their real art is spread around her whole 500×500 space)
export const WEAR_MAGIC_THUMB = {
  'sparkle-ring': ['0 0 100 100', sparkle(50, 46, 24) + sparkle(20, 22, 10, '#ffc6de') + sparkle(80, 78, 12, '#e6dcff') + sparkle(82, 20, 8, '#fff7d6')],
  bubbles: ['0 0 100 100', [[42, 52, 26], [78, 28, 14], [80, 78, 11], [16, 20, 8]].map(([x, y, r]) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#f3ecff" fill-opacity=".7" stroke="#c8b2ff" stroke-width="2.4"/><path d="M${x - r * .55} ${y - r * .2}a${r * .6} ${r * .6} 0 0 1 ${r * .45} ${-r * .4}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`).join('')],
  'sakura-storm': ['0 0 100 100', petal(46, 50, 1.6) + petal(80, 22, .9, '#ffd6e8') + petal(18, 80, .8, '#ffd6e8') + petal(84, 80, .6)],
  'heart-rain': ['0 0 100 100', heart(46, 46, 1.9) + heart(80, 20, .9, '#ff9cc7') + heart(18, 82, .8, '#ffd6e8') + heart(84, 80, .7, '#e6dcff')],
};
