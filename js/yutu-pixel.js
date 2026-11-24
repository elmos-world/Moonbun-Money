// Yutu the Jade Rabbit — arcade pixel-art edition.
// She is drawn pixel by pixel into a tiny 64×64 canvas every frame (12 fps, like an
// old arcade sprite) and scaled up with crisp pixels. Every part (ears, eyes, paws,
// pestle) is its own shape, so animations never misalign.
//   yutuSVG(mood, opts)  → HTML for a Yutu sprite (name kept for compatibility)
//   initYutu({ say })    → starts the animation loop + pointer/idle/petting behaviour
//   yutuReact(kind)      → plays a reaction: hello, pet, giggle, expense, over,
//                          income, saving, party, deleted, peek, yawn, wake

const W = 64, H = 64, FPS = 12;
const HEX = {
  o: '#3b2340', w: '#ffffff', pkl: '#ffd0dc', s1: '#efe6f3', s2: '#d2c1df', pk: '#ff9fb8', pkd: '#e0607e',
  j1: '#a6f0cc', j2: '#4fbf8c', j3: '#1f6b4e', g1: '#ffe08a', g2: '#d9a12a', eye: '#2a1530', eye2: '#7a4a78',
  m1: '#fff1c2', m2: '#ffd98a', m3: '#e8b75a', red: '#b83a55', bl: '#8fd3ff', bl2: '#3a7fb8', z: '#e8e2ff',
  sh: '#0d0a24', glow: '#ffd98a', st: '#fff6d6',
};
// colours as little-endian ABGR uint32 for ImageData
const C = {};
for (const [k, h] of Object.entries(HEX)) {
  const n = parseInt(h.slice(1), 16);
  C[k] = (255 << 24 | (n & 255) << 16 | (n >> 8 & 255) << 8 | n >> 16) >>> 0;
}
const withAlpha = (c, a) => ((c & 0x00ffffff) | (Math.round(a * 255) << 24)) >>> 0;

/* ---------------- tiny raster helpers ---------------- */
function blend(buf, x, y, c) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const a = c >>> 24;
  if (a === 255) { buf[y * W + x] = c; return; }
  if (!a) return;
  const d = buf[y * W + x], da = d >>> 24, t = a / 255;
  if (!da) { buf[y * W + x] = c; return; }
  const mix = s => Math.round(((c >> s) & 255) * t + ((d >> s) & 255) * (1 - t));
  buf[y * W + x] = ((Math.max(a, da) << 24) | (mix(16) << 16) | (mix(8) << 8) | mix(0)) >>> 0;
}
// ellipse membership with optional rotation (deg) around its centre
const ell = (cx, cy, rx, ry, rot = 0) => {
  const r = rot * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r);
  return (x, y) => {
    const dx = x + .5 - cx, dy = y + .5 - cy;
    const u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry;
    return u * u + v * v <= 1;
  };
};
// fill a shape; boundary pixels become outline (classic pixel-art layering)
function shape(buf, inside, box, fill, outline = C.o, soft = null) {
  const [x0, y0, x1, y1] = box.map(Math.round);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!inside(x, y)) continue;
    const out = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([u, v]) => !inside(u, v));
    let c = typeof fill === 'function' ? fill(x, y) : fill;
    if (outline && out.length) c = soft && out.every(([u, v]) => soft(u, v)) ? C.s2 : outline;   // soft seam where parts meet
    blend(buf, x, y, c);
  }
}
const furShade = (cx, cy, rx, ry) => (x, y) => {
  const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry, k = u * .45 + v * .75;
  return k > .62 ? C.s2 : k > .2 ? C.s1 : C.w;
};
const px = (buf, list, c) => list.forEach(([x, y]) => blend(buf, x, y, c));
// stamp a little sprite from strings; legend maps characters to colours
function stamp(buf, x, y, rows, legend, alpha = 1) {
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    const c = legend[ch]; if (c) blend(buf, x + i, y + j, alpha < 1 ? withAlpha(c, alpha) : c);
  }));
}
const HEART = ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'];
const COIN = ['.yy.', 'yllY', 'ylYY', '.YY.'];
const ZED = ['xxxx', '..x.', '.x..', 'xxxx'];
const DROP = ['.b.', 'bbb', 'bwb', '.b.'];

/* ---------------- drawing Yutu ---------------- */
function drawScene(buf, s, t) {
  buf.fill(0);
  // moon with a soft dithered glow
  const mx = 50, my = 13, mr = 9 + (s.glow ? 1 : 0);
  const gr = mr + (s.glow ? 5 : 3);
  for (let y = my - gr; y <= my + gr; y++) for (let x = mx - gr; x <= mx + gr; x++) {
    const d = Math.hypot(x + .5 - mx, y + .5 - my);
    if (d > mr && d <= gr && (x + y + (s.glow ? (t >> 2) : 0)) % 2 === 0) blend(buf, x, y, withAlpha(C.glow, s.glow ? .55 : .3));
  }
  shape(buf, ell(mx, my, mr, mr), [mx - mr, my - mr, mx + mr, my + mr], (x, y) => {
    const u = (x + .5 - mx) / mr, v = (y + .5 - my) / mr; return u * .5 + v * .6 > .45 ? C.m2 : C.m1;
  }, C.m3);
  px(buf, [[47, 10], [48, 10], [47, 11], [53, 15], [54, 15], [53, 16], [54, 16], [50, 18]], C.m3);

  // twinkling stars
  [[6, 8, 0], [58, 33, 3], [5, 37, 5], [60, 54, 2], [15, 4, 6]].forEach(([x, y, ph]) => {
    const k = (t + ph * 3) % 12;
    if (k < 4) blend(buf, x, y, C.st);
    else if (k < 8) { px(buf, [[x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]], C.g1); blend(buf, x, y, C.st); }
    else blend(buf, x, y, withAlpha(C.st, .5));
  });

  // ground shadow (shrinks while hopping)
  const sw = 15 + Math.round(s.hop / 2);
  shape(buf, ell(30, 60.5, sw, 1.8), [30 - sw, 58, 30 + sw, 63], withAlpha(C.sh, .45), 0);

  const b = new Uint32Array(W * H);               // bunny on her own layer (so she can flip)
  const dx = s.shake, dy = s.bob + s.hop;
  const st = s.stretch;
  // tail
  shape(b, ell(17 + dx, 54 + dy, 3.6, 3.6), [12, 49 + dy, 22, 59 + dy], furShade(17, 54 + dy, 3.6, 3.6));
  // ears (behind the head), rotate from their base
  const ear = (bx, by, ang, len) => {
    const r = ang * Math.PI / 180, cx = bx + Math.sin(r) * len, cy = by - Math.cos(r) * len;
    shape(b, ell(cx, cy, 4.2, len + .5, ang), [cx - len - 2, cy - len - 2, cx + len + 2, cy + len + 2], furShade(cx, cy, 4.2, len));
    shape(b, ell(cx + Math.sin(r) * .4, cy + .6, 2, len - 2.6, ang), [cx - len, cy - len, cx + len, cy + len], C.pk, 0);
    shape(b, ell(cx + Math.sin(r) * .4, cy - len * .35, 1, len * .35, ang), [cx - len, cy - len, cx + len, cy + len], C.pkl || C.pk, 0);
  };
  ear(22.5 + dx, 21 + dy - st, s.earL, s.earLen);
  ear(33.5 + dx, 21 + dy - st, s.earR, s.earLen);
  // body
  const chest = ell(29 + dx, 46 + dy - st, 9, 9 + st), lower = ell(28 + dx, 54 + dy, 13, 7), thigh = ell(20 + dx, 53 + dy, 7.5, 7);
  const bodyIn = (x, y) => y <= 61 && (chest(x, y) || lower(x, y) || thigh(x, y));
  shape(b, bodyIn, [10, 34 + dy - st, 44, 62], furShade(28, 50 + dy, 13, 12));
  shape(b, ell(30 + dx, 51 + dy, 5.5, 6), [23, 44 + dy, 37, 58 + dy], C.w, 0);      // fluffy belly
  for (let a = -70; a <= 55; a += 6) {                                                // thigh contour
    const r = a * Math.PI / 180; blend(b, Math.round(20 + dx + Math.cos(r) * 6.5), Math.round(53 + dy + Math.sin(r) * 6), C.s2);
  }
  // feet
  shape(b, ell(34 + dx, 59.6 + dy, 4.2, 2.3), [28, 56 + dy, 40, 63 + dy], C.w);
  shape(b, ell(22 + dx, 59.4 + dy, 6.4, 2.6), [14, 56 + dy, 30, 63 + dy], C.w);
  px(b, [[18 + dx, 59 + dy], [20 + dx, 59 + dy], [22 + dx, 59 + dy], [33 + dx, 59 + dy], [35 + dx, 59 + dy]], C.pk);
  // head
  const hy = dy - st;
  shape(b, ell(28 + dx, 29 + hy, 15.5, 12.5), [11, 15 + hy, 45, 43 + hy], furShade(28, 29 + hy, 15.5, 12.5), C.o, (x, y) => bodyIn(x, y - hy + dy));
  // chest fluff spilling over the chin
  px(b, [[25, 41], [26, 42], [27, 41], [28, 42], [29, 41], [30, 42]].map(([x, y]) => [x + dx, y + hy]), C.w);
  px(b, [[25, 42], [27, 42], [29, 42]].map(([x, y]) => [x + dx, y + hy + 1]), C.s1);
  px(b, [[27 + dx, 16 + hy], [28 + dx, 16 + hy], [27 + dx, 17 + hy], [28 + dx, 17 + hy]], C.w);   // tuft
  px(b, [[27 + dx, 15 + hy], [28 + dx, 15 + hy], [26 + dx, 16 + hy], [29 + dx, 16 + hy]], C.o);
  // jade crescent on the forehead
  px(b, [[28 + dx, 19 + hy], [27 + dx, 20 + hy], [27 + dx, 21 + hy], [28 + dx, 22 + hy]], C.j2); blend(b, 29 + dx, 19 + hy, C.j1);
  // jade flower hairpin with a gold tassel
  const fx = 38 + dx, fy = 19 + hy;
  stamp(b, fx - 2, fy - 2, ['.JJ..', 'JjjJ.', 'JjgjJ', '.JjjJ', '..JJ.'], { J: C.j2, j: C.j1, g: C.g1 });
  px(b, [[fx - 2, fy - 1], [fx + 2, fy + 1], [fx - 1, fy + 2], [fx + 1, fy - 2]], C.j3);
  const sway = (t >> 2) % 2;
  px(b, [[fx + 2, fy + 3], [fx + 2 + sway, fy + 4]], C.g2); blend(b, fx + 2 + sway, fy + 5, C.j2);
  // face
  drawFace(b, s, 28 + dx, hy, t);
  // jade bead necklace + bi-disc pendant (sits on the chest, no hard band)
  for (let i = 0; i < 6; i++) {
    const x = 20 + i * 3 + (i > 2 ? 1 : 0), y = 41 + [0, 1, 2, 2, 1, 0][i];
    blend(b, x + dx, y + hy, C.j2); blend(b, x + dx, y + hy - 1, C.j1); blend(b, x + dx + 1, y + hy, C.j3);
  }
  const pdx = ((t >> 2) % 4 === 1) ? 1 : ((t >> 2) % 4 === 3) ? -1 : 0;
  stamp(b, 26 + dx + pdx, 44 + hy, ['.jj.', 'jwwj', '.jj.', '.gg.', '..g.'], { j: C.j2, w: C.s1, g: C.g1 });
  // pestle (paws hold it; they move together when pounding)
  const p = s.paw;
  for (let i = 0; i <= 13; i++) {
    const x = Math.round(43 + i * .3) + dx, y = 36 + i + p + dy * 0;
    blend(b, x, y + dy, C.j3); blend(b, x + 1, y + dy, C.j2); blend(b, x + 2, y + dy, C.j3);
  }
  px(b, [[43 + dx, 38 + p + dy], [44 + dx, 38 + p + dy], [45 + dx, 38 + p + dy]], C.g1);
  px(b, [[44 + dx, 36 + p + dy]], C.j1);
  // mortar (stays on the ground)
  shape(b, (x, y) => y >= 50 && y <= 58 && Math.abs(x + .5 - 47) <= 9.5 - (y - 50) * .62, [37, 50, 57, 58], (x, y) => x < 43 ? C.j1 : x > 52 ? C.j3 : C.j2, C.j3);
  shape(b, ell(47, 50, 10, 2.2), [36, 47, 58, 53], C.g1, C.g2);
  shape(b, ell(47, 50, 7.5, 1.2), [39, 48, 55, 52], C.j3, 0);
  px(b, [[44, 49], [45, 49], [49, 49], [50, 49]], C.g1);
  px(b, [[42, 59], [43, 59], [44, 59], [45, 59], [46, 59], [47, 59], [48, 59], [49, 59], [50, 59], [51, 59], [52, 59]], C.j3);
  px(b, [[44, 54], [45, 53], [46, 54], [47, 53], [48, 54], [49, 53], [50, 54]], C.g2);
  // paws (in front of the pestle)
  if (s.wave >= 0) {
    const wx = 48 + dx + (s.wave % 2 ? 1 : -1), wy = 30 + hy;
    shape(b, ell(wx, wy, 3.1, 2.8), [wx - 4, wy - 4, wx + 4, wy + 4], C.w);
    px(b, [[wx - 1, wy - 2], [wx + 1, wy - 2]], C.s2);
  } else shape(b, ell(42 + dx, 41 + p + dy, 3.1, 2.7), [38, 37 + p + dy, 46, 45 + p + dy], C.w);
  shape(b, ell(45 + dx, 45 + p + dy, 3.1, 2.7), [41, 41 + p + dy, 49, 49 + p + dy], C.w);

  // composite the bunny (mirrored when spinning)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = s.flip ? Math.round(2 * 29 - x) : x;
    if (sx < 0 || sx >= W) continue;
    const c = b[y * W + sx]; if (c >>> 24) blend(buf, x, y, c);
  }

  // effects: sweat, sleepy z's, particles
  if (s.face === 'worried') stamp(buf, 42 + dx, 17 + hy + ((t >> 1) % 2), DROP, { b: C.bl, w: C.w });
  s.parts.forEach(q => {
    const a = Math.max(0, Math.min(1, (q.life - q.age) / 6));
    if (q.kind === 'heart') stamp(buf, q.x, q.y, HEART, { x: q.c }, a);
    else if (q.kind === 'coin') stamp(buf, q.x, q.y, COIN, { y: C.g1, l: C.st, Y: C.g2 }, a);
    else if (q.kind === 'z') stamp(buf, q.x, q.y, ZED, { x: C.z }, a);
    else if (q.kind === 'conf') { blend(buf, q.x, q.y, withAlpha(q.c, a)); blend(buf, q.x, q.y + 1, withAlpha(q.c, a)); }
    else if (q.kind === 'spark') { px(buf, [[q.x, q.y], [q.x - 1, q.y], [q.x + 1, q.y], [q.x, q.y - 1], [q.x, q.y + 1]], withAlpha(C.g1, a)); blend(buf, q.x, q.y, withAlpha(C.st, a)); }
  });
}

function drawFace(b, s, cx, hy, t) {
  // features mirror across the head's centre line (x ↔ 55 - x)
  const L = cx - 9, R = cx + 5, ey = 29 + hy;          // big eyes: 4 wide × 6 tall, set low and wide
  const lx = s.lookX, ly = s.lookY;
  const face = s.blink && ['smile', 'worried', 'surprised'].includes(s.face) ? 'blink' : s.face;
  const rosy = ['happy', 'happy-open', 'star'].includes(face);
  // rosy cheeks (2 rows, a bit bigger when happy) + tiny nose
  const blush = [[cx - 12, 36], [cx - 11, 36], [cx - 10, 36], [cx - 11, 37]];
  if (rosy) blush.push([cx - 12, 37], [cx - 10, 37], [cx - 13, 36]);
  px(b, blush.flatMap(([x, y]) => [[x, y + hy], [55 - x, y + hy]]), C.pk);
  px(b, [[cx - 1, 35 + hy], [cx, 35 + hy]], C.pkd);
  const openEye = (x, y, big) => {
    const h = big ? 7 : 6, top = y - (big ? 1 : 0);
    for (let j = 0; j < h; j++) for (let i = 0; i < 4; i++) {
      if ((j === 0 || j === h - 1) && (i === 0 || i === 3)) continue;
      blend(b, x + i, top + j, j >= h - 2 ? C.eye2 : C.eye);
    }
    const hx = x + 1 + Math.max(0, lx), hy2 = top + 1 + Math.max(0, ly);
    px(b, [[hx, hy2], [hx + 1, hy2], [hx, hy2 + 1], [hx + 1, hy2 + 1]], C.w);
    blend(b, x + (lx > 0 ? 3 : 2), top + h - 2, C.pkl);
  };
  const eyes = fn => { fn(L, ey); fn(R, ey); };
  switch (face) {
    case 'smile': case 'surprised': case 'worried':
      eyes((x, y) => openEye(x + lx, y + ly, face === 'surprised'));
      if (face === 'worried') {
        px(b, [[L, ey - 2], [L + 1, ey - 2], [L + 2, ey - 3], [L + 3, ey - 3]], C.o);
        px(b, [[R, ey - 3], [R + 1, ey - 3], [R + 2, ey - 2], [R + 3, ey - 2]], C.o);
      }
      break;
    case 'blink': eyes((x, y) => px(b, [[x, y + 3], [x + 1, y + 4], [x + 2, y + 4], [x + 3, y + 3]], C.o)); break;
    case 'happy': case 'happy-open': eyes((x, y) => px(b, [[x, y + 4], [x + 1, y + 3], [x + 2, y + 3], [x + 3, y + 4]], C.o)); break;
    case 'sleepy': case 'yawn': eyes((x, y) => px(b, [[x, y + 3], [x + 1, y + 4], [x + 2, y + 4], [x + 3, y + 3]], C.o)); break;
    case 'star': eyes((x, y) => {
      px(b, [[x + 1, y], [x + 2, y], [x + 1, y + 1], [x + 2, y + 1], [x, y + 2], [x + 1, y + 2], [x + 2, y + 2], [x + 3, y + 2],
        [x, y + 3], [x + 1, y + 3], [x + 2, y + 3], [x + 3, y + 3], [x + 1, y + 4], [x + 2, y + 4], [x + 1, y + 5], [x + 2, y + 5]], C.g1);
      px(b, [[x + 1, y + 2], [x + 2, y + 2]], C.st); px(b, [[x + 1, y + 5], [x + 2, y + 5]], C.g2);
    }); break;
  }
  const my = 37 + hy, a = cx - 2;                     // small mouths, 4 wide: a … a+3
  if (face === 'smile' || face === 'blink') px(b, [[a - 1, my - 1], [a, my], [a + 1, my - 1], [a + 2, my - 1], [a + 3, my], [a + 4, my - 1]], C.o);
  else if (rosy) {
    px(b, [[a, my - 1], [a + 3, my - 1], [a, my], [a + 3, my], [a + 1, my + 1], [a + 2, my + 1]], C.o);
    px(b, [[a + 1, my - 1], [a + 2, my - 1]], C.red); px(b, [[a + 1, my], [a + 2, my]], C.pk);
  } else if (face === 'surprised' || face === 'sleepy') {
    px(b, [[a + 1, my - 1], [a + 2, my - 1], [a, my], [a + 3, my], [a + 1, my + 1], [a + 2, my + 1]], C.o);
    px(b, [[a + 1, my], [a + 2, my]], C.red);
  } else if (face === 'worried') px(b, [[a - 1, my], [a, my - 1], [a + 1, my], [a + 2, my], [a + 3, my - 1], [a + 4, my]], C.o);
  else if (face === 'yawn') {
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) blend(b, a + i, my + j, C.red);
    px(b, [[a - 1, my], [a - 1, my + 1], [a - 1, my + 2], [a + 4, my], [a + 4, my + 1], [a + 4, my + 2],
      [a, my - 1], [a + 1, my - 1], [a + 2, my - 1], [a + 3, my - 1], [a, my + 3], [a + 1, my + 3], [a + 2, my + 3], [a + 3, my + 3]], C.o);
    px(b, [[a + 1, my + 2], [a + 2, my + 2]], C.pk);
  }
}

/* ---------------- state + loop ---------------- */
const BASE_FACE = { calm: 'smile', happy: 'smile', worried: 'worried', party: 'star', sleepy: 'sleepy' };
const STATE = new WeakMap();
const getState = cv => {
  let s = STATE.get(cv);
  if (!s) {
    s = { face: null, act: null, actStart: 0, actUntil: 0, lookX: 0, lookY: 0, blinkUntil: 0, nextBlink: performance.now() + 1500 + Math.random() * 2000,
      twitch: null, parts: [], dozing: false, glowUntil: 0, nextZ: 0, ctx: cv.getContext('2d'), img: null };
    s.img = s.ctx.createImageData(W, H); s.buf = new Uint32Array(s.img.data.buffer);
    STATE.set(cv, s);
  }
  return s;
};
const sprites = () => [...document.querySelectorAll('canvas.yutu-px')];
const live = () => sprites().filter(c => c.classList.contains('interactive'));
const calm = () => document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);

function frameParams(cv, s, now, t) {
  const mood = cv.dataset.mood || 'calm';
  const face = s.dozing ? 'sleepy' : (now < s.actUntil && s.face) || BASE_FACE[mood] || 'smile';
  const af = Math.floor((now - s.actStart) / (1000 / FPS));
  const act = now < s.actUntil ? s.act : (mood === 'party' ? 'hop' : null);
  const still = calm();
  const p = { face, bob: still ? 0 : ((t >> 3) % 2), hop: 0, shake: 0, stretch: 0, paw: 0, wave: -1, flip: false,
    earL: -16, earR: 16, earLen: 8.5, lookX: s.lookX, lookY: s.lookY, blink: now < s.blinkUntil, glow: now < s.glowUntil, parts: s.parts };
  if (!still) { p.earL += Math.sin(now / 900) * 2; p.earR += Math.sin(now / 1000 + 1) * 2; }
  if (mood === 'worried' || face === 'worried') { p.earL = -34; p.earR = 34; }
  if (mood === 'sleepy' || s.dozing) { p.earL = -50; p.earR = 50; p.earLen = 8; p.bob = still ? 0 : ((t >> 4) % 2); }
  if (s.twitch && now < s.twitch.until) p[s.twitch.side] += (af % 2 ? 1 : -1) * 10;
  if (!still && act) {
    const ph = af;
    if (act === 'pound') p.paw = [0, 2, 3, 1][ph % 4];
    if (act === 'hop') { const h = [0, 3, 6, 7, 6, 3, 0, 0][ph % 8]; p.hop = -h; p.stretch = h > 4 ? 1 : 0; p.bob = 0; }
    if (act === 'wave') p.wave = ph;
    if (act === 'wiggle') { p.earL = -16 + (ph % 2 ? 12 : -8); p.earR = 16 + (ph % 2 ? -12 : 8); }
    if (act === 'spin') { p.flip = [false, true, true, false][ph % 4]; p.hop = -[0, 2, 3, 2][ph % 4]; }
    if (act === 'shiver') p.shake = ph % 2 ? 1 : -1;
    if (act === 'perk') { p.earL = -6; p.earR = 6; p.earLen = 9.5; }
    if (act === 'stretch') { p.stretch = ph > 2 && ph < 14 ? 2 : 0; p.earL = -8; p.earR = 8; p.earLen = 9.5; }
  }
  return p;
}

function tick(now) {
  const t = Math.floor(now / (1000 / FPS));
  sprites().forEach(cv => {
    const s = getState(cv);
    if (!calm()) {
      if (now > s.nextBlink) { s.blinkUntil = now + 140; s.nextBlink = now + rnd(2200, 5200); if (Math.random() < .25) s.nextBlink = now + 320; }
      if (!s.twitch || now > s.twitch.until + rnd(3000, 7000)) if (Math.random() < .01) s.twitch = { side: Math.random() < .5 ? 'earL' : 'earR', until: now + 450 };
      if ((cv.dataset.mood === 'sleepy' || s.dozing) && now > s.nextZ) { s.parts.push({ kind: 'z', x: 40, y: 20, vx: .25, vy: -.35, age: 0, life: 22 }); s.nextZ = now + 1300; }
      s.parts.forEach(q => { q.age++; q.x += q.vx; q.y += q.vy; q.vy += q.g || 0; });
      s.parts = s.parts.filter(q => q.age < q.life && q.y < H + 4);
      s.parts.forEach(q => { q.x = Math.round(q.x * 4) / 4; });
    } else s.parts = [];
    const p = frameParams(cv, s, now, t);
    p.parts = s.parts.map(q => ({ ...q, x: Math.round(q.x), y: Math.round(q.y) }));
    drawScene(s.buf, p, t);
    s.ctx.putImageData(s.img, 0, 0);
  });
}

/* ---------------- reactions ---------------- */
let sayHook = null, busyUntil = 0;
const REACTIONS = {
  hello:   { face: 'happy-open', act: 'wave', ms: 1900, say: ['Hi hi! 🌙 Ready to count some coins?', 'Welcome back! I missed you 🐾'] },
  pet:     { face: 'happy', act: 'wiggle', ms: 1200, fx: 'hearts', say: ['Hehe, that tickles! 🐰', '*happy bunny noises* 🌸', 'More pets = more savings, right? 💕', 'You’re doing great with your money ✨', 'Boop! 🌙'] },
  giggle:  { face: 'happy-open', act: 'spin', ms: 1300, fx: 'hearts', say: ['Okay okay, I’m dizzy now! 😵‍💫💕'] },
  expense: { face: 'smile', act: 'pound', ms: 1300, fx: 'puff' },
  over:    { face: 'worried', act: 'shiver', ms: 1500 },
  income:  { face: 'star', act: 'hop', ms: 1400, fx: 'coins' },
  saving:  { face: 'happy', act: 'pound', ms: 1400, fx: 'puff', glow: 2500 },
  party:   { face: 'star', act: 'hop', ms: 2400, fx: 'confetti', glow: 3000 },
  deleted: { face: 'surprised', act: 'perk', ms: 1000 },
  peek:    { face: 'surprised', act: 'perk', ms: 900 },
  yawn:    { face: 'yawn', act: 'stretch', ms: 1600 },
  wake:    { face: 'surprised', act: 'perk', ms: 900, say: ['Oh! I wasn’t sleeping, I was… budgeting 😳'] },
};
const FX = {
  hearts: s => { for (let i = 0; i < 5; i++) s.parts.push({ kind: 'heart', x: rnd(18, 36), y: rnd(14, 20), vx: rnd(-.3, .3), vy: rnd(-.7, -.4), age: -i * 2, life: 18, c: [C.pk, C.pkd, C.g1][i % 3] }); },
  coins:  s => { for (let i = 0; i < 7; i++) s.parts.push({ kind: 'coin', x: rnd(14, 40), y: 30, vx: rnd(-.8, .8), vy: rnd(-2.2, -1.4), g: .18, age: -i, life: 26 }); },
  puff:   s => { for (let i = 0; i < 6; i++) s.parts.push({ kind: 'spark', x: 47, y: 47, vx: (i - 2.5) * .45, vy: rnd(-1.4, -.8), g: .04, age: -i, life: 14 }); },
  confetti: s => { for (let i = 0; i < 22; i++) s.parts.push({ kind: 'conf', x: rnd(2, 62), y: rnd(-12, 0), vx: rnd(-.2, .2), vy: rnd(.5, 1), age: -i, life: 70, c: [C.pk, C.j1, C.g1, C.bl][i % 4] }); },
};

export function yutuReact(kind, { say, soft = false } = {}) {
  const r = REACTIONS[kind]; if (!r) return;
  const now = performance.now();
  if (soft && now < busyUntil) return;
  busyUntil = now + r.ms;
  live().forEach(cv => {
    const s = getState(cv);
    s.face = r.face; s.act = r.act; s.actStart = now; s.actUntil = now + r.ms;
    if (r.glow) s.glowUntil = now + r.glow;
    if (r.fx && !calm()) FX[r.fx](s);
  });
  const line = say || (r.say && r.say[Math.floor(Math.random() * r.say.length)]);
  if (line && sayHook) sayHook(line);
}

/* ---------------- markup ---------------- */
export function yutuSVG(mood = 'calm', { mini = false, interactive = false, title = 'Yutu the Jade Rabbit' } = {}) {
  const label = `${title}, ${{ calm: 'smiling', happy: 'smiling', worried: 'looking worried', party: 'celebrating', sleepy: 'dozing' }[mood] || 'smiling'}`;
  const role = interactive ? `role="button" tabindex="0" aria-label="${label}. Tap to pet her."` : `role="img" aria-label="${label}"`;
  return `<canvas class="yutu-px${mini ? ' mini' : ''}${interactive ? ' interactive' : ''}" width="${W}" height="${H}" data-mood="${mood}" ${role}></canvas>`;
}

/* ---------------- behaviour ---------------- */
let started = false;
export function initYutu({ say } = {}) {
  sayHook = say || null;
  if (started) return; started = true;
  let last = 0;
  const loop = now => { if (now - last >= 1000 / FPS) { last = now; tick(now); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);

  let lastMove = performance.now(), dozing = false;
  const look = (cx, cy) => live().forEach(cv => {
    const r = cv.getBoundingClientRect(), s = getState(cv);
    const dx = cx - (r.left + r.width * .44), dy = cy - (r.top + r.height * .47);
    s.lookX = Math.abs(dx) < r.width * .15 ? 0 : Math.sign(dx);
    s.lookY = Math.abs(dy) < r.height * .2 ? 0 : Math.sign(dy);
  });
  const activity = () => {
    lastMove = performance.now();
    if (dozing) { dozing = false; live().forEach(cv => { getState(cv).dozing = false; }); yutuReact('wake'); }
  };
  document.addEventListener('pointermove', e => { activity(); look(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener('keydown', activity);
  document.addEventListener('focusin', e => { activity(); const r = e.target.getBoundingClientRect?.(); if (r && r.width) look(r.left + r.width / 2, r.top + r.height / 2); });
  document.addEventListener('pointerover', e => { if (e.target.closest?.('.fab') && !e.relatedTarget?.closest?.('.fab')) yutuReact('peek', { soft: true }); });
  setInterval(() => {
    if (dozing || performance.now() - lastMove < 30000) return;
    const rigs = live().filter(cv => cv.dataset.mood !== 'sleepy');
    if (!rigs.length) return;
    dozing = true; yutuReact('yawn');
    setTimeout(() => { if (dozing) rigs.forEach(cv => { getState(cv).dozing = true; }); }, 1600);
  }, 5000);

  let pets = [];
  const pet = () => {
    pets = pets.filter(t => Date.now() - t < 2500); pets.push(Date.now());
    yutuReact(pets.length >= 5 ? 'giggle' : 'pet');
    if (pets.length >= 5) pets = [];
  };
  document.addEventListener('click', e => { const c = e.target.closest?.('canvas.yutu-px.interactive'); if (c) { if (e.detail) c.blur(); pet(); } });
  document.addEventListener('keydown', e => {
    const c = e.target.closest?.('canvas.yutu-px.interactive');
    if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pet(); }
  });
}

// for tests/tools: read or tweak a sprite's state
export const __yutuState = getState;
