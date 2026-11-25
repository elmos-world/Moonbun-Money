// Icon set for Moonbun Money — hand-drawn in SVG (24×24) like the rest of the site: a fine ink
// pen line on white paper, grey screentone dots for shading and one soft rose wash. Use icon(name, size?).
const L = 'var(--ic-line, #2f2a33)';
const SW = 'stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"';
const o = (fill) => `fill="${fill}" stroke="${L}" ${SW}`;
const blush = () => '';
// little face centred at (x, y); w = half distance between the eyes
const face = () => '';   // the drawings no longer have little faces
const sparkle = (x, y, r, c = '#ffd166') => `<path d="M${x} ${y - r}Q${x + r * .2} ${y - r * .2} ${x + r} ${y}Q${x + r * .2} ${y + r * .2} ${x} ${y + r}Q${x - r * .2} ${y + r * .2} ${x - r} ${y}Q${x - r * .2} ${y - r * .2} ${x} ${y - r}Z" fill="${c}"/>`;

const D = {
  /* ---- money ---- */
  coin: `<circle cx="12" cy="12" r="8.5" ${o('#ffe08a')}/><circle cx="12" cy="12" r="6" fill="none" stroke="#e8b75a" stroke-width="1.2"/>${face(12, 12, 2.1)}`,
  purse: `<path d="M4.5 10.5h15l-1 8.5a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8z" ${o('#ffd3e6')}/><path d="M8 10.5a4 4 0 0 1 8 0" fill="none" stroke="${L}" ${SW}/><circle cx="10.6" cy="6.9" r="1.3" ${o('#ffe08a')}/><circle cx="13.4" cy="6.9" r="1.3" ${o('#ffe08a')}/>${face(12, 15, 2.2)}`,
  dango: `<path d="M5 20L19 5" stroke="#c89b6d" stroke-width="1.44" stroke-linecap="round"/><circle cx="8" cy="16.6" r="3.2" ${o('#a6e8c4')}/><circle cx="12" cy="12.2" r="3.2" ${o('#ffffff')}/><circle cx="16" cy="7.8" r="3.2" ${o('#ffb8d2')}/>${face(12, 12.2, 1.3)}`,
  clover: `<g ${o('#bdf0d4')}><circle cx="9" cy="9" r="3.6"/><circle cx="15" cy="9" r="3.6"/><circle cx="9" cy="14.6" r="3.6"/><circle cx="15" cy="14.6" r="3.6"/></g><path d="M12 17v4.5" stroke="${L}" ${SW}/>${face(12, 11.8, 1.6)}`,

  /* ---- categories ---- */
  food: `<path d="M8 4.5q-1 1.5 0 3M12 3.8q-1 1.5 0 3M16 4.5q-1 1.5 0 3" fill="none" stroke="#c9b8e8" ${SW}/><path d="M3.5 11h17a8.5 8 0 0 1-17 0z" ${o('#ffffff')}/><path d="M6 13.4h12" stroke="#ffb8d2" stroke-width="1.6" stroke-linecap="round"/><path d="M15 3.5L19.5 11M17.5 3L20.5 10" stroke="#c89b6d" stroke-width="1.12" stroke-linecap="round"/>${face(12, 15.6, 2.3)}`,
  fun: `<path d="M5.5 8.5h13a3.5 3.5 0 0 1 3.3 4.6l-1.2 3.6a2.3 2.3 0 0 1-3.9.8L14.5 15h-5l-2.2 2.5a2.3 2.3 0 0 1-3.9-.8l-1.2-3.6a3.5 3.5 0 0 1 3.3-4.6z" ${o('#e2d6ff')}/><path d="M7.5 10.6v3M6 12.1h3" stroke="${L}" ${SW}/><circle cx="16" cy="11.2" r="1" fill="#ff9fb8"/><circle cx="18" cy="13" r="1" fill="#8fd3ff"/>`,
  shopping: `<path d="M5 8.5h14l-1.2 11a1.6 1.6 0 0 1-1.6 1.4H7.8a1.6 1.6 0 0 1-1.6-1.4z" ${o('#ffd3e6')}/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" fill="none" stroke="${L}" ${SW}/><path d="M12 17.4c-2.6-1.6-3-3.6-1.6-4.3.8-.4 1.4 0 1.6.6.2-.6.8-1 1.6-.6 1.4.7 1 2.7-1.6 4.3z" fill="#ff7eb3"/>`,
  transport: `<rect x="4" y="5" width="16" height="13" rx="3.5" ${o('#ffe7a3')}/><rect x="6.5" y="7.5" width="11" height="4" rx="1.5" fill="#d6f0ff" stroke="${L}" stroke-width="1.2"/><circle cx="8" cy="19.5" r="1.7" ${o('#c9b8e8')}/><circle cx="16" cy="19.5" r="1.7" ${o('#c9b8e8')}/>${face(12, 14.4, 2.3)}`,
  school: `<path d="M12 6.5C9.5 4.8 6.5 4.6 3.5 5.5v13c3-.9 6-.7 8.5 1 2.5-1.7 5.5-1.9 8.5-1v-13c-3-.9-6-.7-8.5 1z" ${o('#d6f0ff')}/><path d="M12 6.5v13" stroke="${L}" ${SW}/><path d="M6 9h3.5M6 11.5h3.5M14.5 9H18" stroke="#9cc6e6" stroke-width="1.3" stroke-linecap="round"/><path d="M16.2 14.6c-1.7-1-2-2.4-1.1-2.9.5-.3 1 0 1.1.4.1-.4.6-.7 1.1-.4.9.5.6 1.9-1.1 2.9z" fill="#ff9fb8"/>`,
  bills: `<path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z" ${o('#ffffff')}/><path d="M9 8h6M9 11h6M9 14h3.5" stroke="#c9b8e8" stroke-width="1.12" stroke-linecap="round"/><circle cx="15.3" cy="14.2" r="1.4" fill="#ffd166"/>`,
  selfcare: `<g ${o('#ffc2d9')}>${[0, 72, 144, 216, 288].map(a => `<path d="M12 12c-2.6-2.2-2.8-6.2 0-7.6 2.8 1.4 2.6 5.4 0 7.6z" transform="rotate(${a} 12 12)"/>`).join('')}</g><circle cx="12" cy="12" r="2.2" ${o('#ffe08a')}/>`,
  other: `<path d="M12 3.6l2.3 4.9 5.3.6-3.9 3.6 1 5.3L12 15.4 7.3 18l1-5.3-3.9-3.6 5.3-.6z" ${o('#fff2a8')}/>${face(12, 11.6, 1.8)}`,

  /* ---- tabs & navigation ---- */
  moon: `<circle cx="12" cy="12" r="8.5" ${o('#fff1c2')}/><circle cx="8.2" cy="8.4" r="1.3" fill="#f3d98f"/><circle cx="16.4" cy="15.8" r="1.6" fill="#f3d98f"/>${face(12, 12.3, 2.2)}${sparkle(20.5, 4, 2.2)}`,
  chart: `<circle cx="12" cy="12.5" r="8" ${o('#ffd3e6')}/><path d="M12 12.5V4.5a8 8 0 0 1 7.6 5.5z" ${o('#bdf0d4')}/><path d="M12 12.5l7.6-2.5a8 8 0 0 1-1.8 8z" ${o('#e2d6ff')}/>`,
  chest: `<path d="M4 10.5h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" ${o('#f6c36b')}/><path d="M4 10.5a8 5.5 0 0 1 16 0z" ${o('#ffd98a')}/><path d="M4 13h16" stroke="${L}" ${SW}/><rect x="10.5" y="11.5" width="3" height="3.4" rx="1" ${o('#fff1c2')}/>${sparkle(18.5, 4.5, 2.2)}${sparkle(6, 5.5, 1.5, '#fff6d6')}`,
  scroll: `<path d="M7 5h11a2 2 0 0 1 0 4h-1v9a3 3 0 0 1-3 3H6a2 2 0 0 1 0-4h1z" ${o('#fff4d6')}/><path d="M9.5 10h5M9.5 13h5M9.5 16h3" stroke="#e0b76a" stroke-width="1.3" stroke-linecap="round"/><path d="M6 21a2 2 0 0 1 0-4h1" fill="none" stroke="${L}" ${SW}/>`,
  gear: `<path d="M12 3.5l1.6 1.9 2.4-.6.7 2.4 2.4.7-.6 2.4 1.9 1.6-1.9 1.6.6 2.4-2.4.7-.7 2.4-2.4-.6L12 20.5l-1.6-1.9-2.4.6-.7-2.4-2.4-.7.6-2.4L3.5 12l1.9-1.6-.6-2.4 2.4-.7.7-2.4 2.4.6z" ${o('#e2d6ff')}/><path d="M12 15.2c-2.6-1.6-3-3.6-1.6-4.3.8-.4 1.4 0 1.6.6.2-.6.8-1 1.6-.6 1.4.7 1 2.7-1.6 4.3z" fill="#ff7eb3"/>`,
  download: `<path d="M12 4v10M8 10.5l4 4 4-4" fill="none" stroke="${L}" stroke-width="1.44" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 15.5v2a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-2" fill="none" stroke="${L}" ${SW}/>`,
  trash: `<path d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19z" ${o('#ffe0ea')}/><path d="M4.5 8h15M9.5 8V5.5h5V8" fill="none" stroke="${L}" ${SW}/>${face(12, 14, 1.8, 'o')}`,

  capsule: `<path d="M4.5 12a7.5 7.5 0 0 1 15 0z" ${o('#ffb8d2')}/><path d="M4.5 12h15a7.5 7.5 0 0 1-15 0z" ${o('#ffffff')}/><circle cx="9" cy="8.4" r="1.4" fill="#fff" opacity=".9"/>${sparkle(20, 4, 2.4)}`,
  ticket: `<path d="M3.5 7.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v2.3a2.2 2.2 0 0 0 0 4.4v2.3a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-2.3a2.2 2.2 0 0 0 0-4.4z" ${o('#fff2a8')}/><path d="M15 6.5v11" stroke="${L}" stroke-width="1.2" stroke-dasharray="1.5 1.8"/><path d="M9.5 10.2a2.5 2.5 0 1 0 1.8 4.3 2 2 0 1 1-1.8-4.3z" fill="#f2a300"/>`,
  envelope: `<rect x="3.5" y="6" width="17" height="12.5" rx="2" ${o('#fff')}/><path d="M3.8 6.8L12 13l8.2-6.2" fill="none" stroke="${L}" ${SW}/><path d="M12 16.6c-2.2-1.4-2.6-3-1.4-3.6.7-.3 1.2 0 1.4.5.2-.5.7-.8 1.4-.5 1.2.6.8 2.2-1.4 3.6z" fill="#ff7eb3"/>`,
  omikuji: `<path d="M6 8h12v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20z" ${o('#ffb8d2')}/><path d="M6 8l6-3.5L18 8z" ${o('#ff9cc5')}/><rect x="10.2" y="11" width="3.6" height="7" rx="1" ${o('#fff')}/><rect x="11" y="1.5" width="2" height="5" rx="1" ${o('#fff1c2')}/>`,
  diary: `<rect x="5" y="3.5" width="14" height="17" rx="2.5" ${o('#e2d6ff')}/><path d="M8.5 3.5v17" stroke="${L}" ${SW}/><circle cx="14" cy="10" r="3" ${o('#fff2a8')}/><path d="M12.8 9.6h.01M15.2 9.6h.01" stroke="${L}" stroke-width="1.28" stroke-linecap="round"/><path d="M13.2 11.1q.8.7 1.6 0" fill="none" stroke="${L}" stroke-width="1"/>`,
  sound: `<path d="M4 10h3.5L12 6v12l-4.5-4H4z" ${o('#ffd3e6')}/><path d="M15 9.5q2 2.5 0 5M17.5 7.5q3.6 4.5 0 9" fill="none" stroke="${L}" ${SW}/>`,
  planner: `<rect x="5" y="4.5" width="14" height="16.5" rx="2.5" ${o('#d6f0ff')}/><rect x="9" y="3" width="6" height="3.4" rx="1.2" ${o('#ffd3e6')}/><path d="M8.5 10.5l1.2 1.2 2.2-2.4M8.5 15l1.2 1.2 2.2-2.4" fill="none" stroke="${L}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.5 11h2.5M13.5 15.5h2.5" stroke="#9cc6e6" stroke-width="1.12" stroke-linecap="round"/>`,
  jar: `<path d="M7 7.5h10v1.5c1.8 1 2.5 2.6 2.5 4.6v4.4a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-4.4c0-2 .7-3.6 2.5-4.6z" ${o('#e4f7ff')}/><rect x="6.5" y="4" width="11" height="3.5" rx="1.5" ${o('#ffd3e6')}/><circle cx="10" cy="16.4" r="2.2" ${o('#ffe08a')}/><circle cx="14.4" cy="17.4" r="1.8" ${o('#ffe08a')}/><path d="M13.6 13.6c-1.7-1-2-2.4-1.1-2.9.5-.3 1 0 1.1.4.1-.4.6-.7 1.1-.4.9.5.6 1.9-1.1 2.9z" fill="#ff7eb3"/>`,
  shield: `<path d="M12 3.5l7 2.8v5.2c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6.3z" ${o('#d2f5e5')}/>${face(12, 12, 2)}`,
  upload: `<path d="M12 15V5M8 8.5l4-4 4 4" fill="none" stroke="${L}" stroke-width="1.44" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 14.5v3a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-3" fill="none" stroke="${L}" ${SW}/>`,
  clip: `<path d="M15.5 7.5l-6.4 6.4a2 2 0 0 0 2.8 2.8l7-7a3.6 3.6 0 0 0-5.1-5.1l-7.2 7.2a5.1 5.1 0 0 0 7.2 7.2l5.4-5.4" fill="none" stroke="${L}" stroke-width="1.36" stroke-linecap="round"/>`,
  chain: `<rect x="3" y="9" width="10" height="6" rx="3" fill="none" stroke="${L}" stroke-width="1.44"/><rect x="11" y="9" width="10" height="6" rx="3" fill="none" stroke="#ff9fb8" stroke-width="1.44"/>${sparkle(19, 4.5, 2)}`,
  hourglass: `<path d="M7 3.5h10M7 20.5h10" stroke="${L}" ${SW}/><path d="M8 3.5c0 4 4 5.5 4 8.5s-4 4.5-4 8.5h8c0-4-4-5.5-4-8.5s4-4.5 4-8.5z" ${o('#e4f7ff')}/><path d="M9.5 18.6c.6-1.6 2.5-2.4 2.5-3.4 0 1 1.9 1.8 2.5 3.4z" fill="#ffd166"/>`,
  /* ---- badges ---- */
  mooncake: `<g ${o('#f6c36b')}><path d="M12 3.8c1.3 0 2 1 3 1.1s2-.5 2.8.4.4 1.9 1 2.8 1.6 1.4 1.6 2.6-1 1.8-1.1 2.9.5 2-.4 2.8-1.9.4-2.8 1-1.4 1.6-2.6 1.6-1.8-1-2.9-1.1-2 .5-2.8-.4-.4-1.9-1-2.8-1.6-1.4-1.6-2.6 1-1.8 1.1-2.9-.5-2 .4-2.8 1.9-.4 2.8-1S10.8 3.8 12 3.8z"/></g><circle cx="12" cy="12" r="4.4" fill="none" stroke="#d99a3a" stroke-width="1.2"/>${face(12, 12, 1.7)}`,
  calendar: `<rect x="4" y="5.5" width="16" height="15" rx="3" ${o('#ffffff')}/><path d="M4 10h16" stroke="${L}" ${SW}/><path d="M4 9a3.5 3.5 0 0 1 3.5-3.5h9A3.5 3.5 0 0 1 20 9v1H4z" fill="#ffb8d2"/><path d="M8.5 3.5v4M15.5 3.5v4" stroke="${L}" ${SW}/><path d="M12 18c-2.6-1.6-3-3.6-1.6-4.3.8-.4 1.4 0 1.6.6.2-.6.8-1 1.6-.6 1.4.7 1 2.7-1.6 4.3z" fill="#ff7eb3"/>`,
  sprout: `<path d="M12 21v-8" stroke="#5fae86" stroke-width="1.44" stroke-linecap="round"/><path d="M12 13c-1-4-4.5-5.5-8-5 0 3.5 3 6 8 5z" ${o('#bdf0d4')}/><path d="M12 11c.5-4 4-6 8-5.5 0 4-3.5 6.5-8 5.5z" ${o('#a6e8c4')}/><path d="M7 21h10" stroke="${L}" ${SW}/>`,
  lantern: `<path d="M12 2.5v2" stroke="${L}" ${SW}/><rect x="8.5" y="4.3" width="7" height="2" rx="1" ${o('#ffd166')}/><ellipse cx="12" cy="12.5" rx="7" ry="6.5" ${o('#ffb8d2')}/><path d="M12 6v13M8 7.5q-2 5 0 10M16 7.5q2 5 0 10" fill="none" stroke="#f08fb8" stroke-width="1.1"/><rect x="8.5" y="18.6" width="7" height="2" rx="1" ${o('#ffd166')}/><path d="M12 20.6v1.6" stroke="#e0a92e" stroke-width="1.2" stroke-linecap="round"/>`,
  gem: `<path d="M7 4.5h10l3.5 5L12 20.5 3.5 9.5z" ${o('#c8f0ff')}/><path d="M3.5 9.5h17M9.5 4.5L8 9.5l4 11 4-11-1.5-5" fill="none" stroke="${L}" stroke-width="1.1" stroke-linejoin="round"/><path d="M6 7.4l1.2-1.6" stroke="#fff" stroke-width="1.12" stroke-linecap="round"/>`,
  dragon: `<path d="M6.5 8.5L5 4l3.6 2.6M17.5 8.5L19 4l-3.6 2.6" ${o('#fff1c4')}/><ellipse cx="12" cy="13" rx="7.8" ry="7" ${o('#ff9a7a')}/><ellipse cx="12" cy="16" rx="3.8" ry="2.6" fill="#ffc4a8"/><circle cx="10.8" cy="15.8" r=".55" fill="${L}"/><circle cx="13.2" cy="15.8" r=".55" fill="${L}"/>${face(12, 11.5, 2.8)}`,
  heart: `<path d="M12 20c-6-3.7-8.5-8.2-6.3-10.9 1.6-1.9 4.6-1.6 6.3.8 1.7-2.4 4.7-2.7 6.3-.8 2.2 2.7-.3 7.2-6.3 10.9z" ${o('#ffb8d2')}/><path d="M8.2 10.2q.8-1 2 -.6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
  sparkles: `${sparkle(10, 13, 7, '#ffe08a')}${sparkle(18.5, 6, 3.5, '#ffc2d9')}${sparkle(18.5, 18.5, 2.3, '#c9b8ff')}`,
  leaf: `<path d="M5 19C5 10 10 5 19.5 4.5 19.5 14 14 19 5 19z" ${o('#bdf0d4')}/><path d="M5 19L14 10" stroke="${L}" ${SW}/>${face(12.8, 12.2, 1.5)}`,

  /* ---- goals ---- */
  laptop: `<rect x="5" y="5" width="14" height="10" rx="2" ${o('#e2d6ff')}/><path d="M2.5 18.5h19l-1.5-3.5H4z" ${o('#ffffff')}/>${face(12, 9.6, 2.2)}`,
  plane: `<path d="M2.8 12.4l17.4-6.6c1.4-.5 2.3 1.1 1.2 2.1L8.6 18.3l-1.2-4.1z" ${o('#d6f0ff')}/><path d="M7.4 14.2l5.5-4.6" stroke="${L}" ${SW}/><path d="M8.6 18.3l2.2-2.9" stroke="${L}" ${SW}/><circle cx="16.8" cy="9.3" r=".7" fill="${L}"/>`,
  headphones: `<path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" fill="none" stroke="${L}" stroke-width="1.44" stroke-linecap="round"/><rect x="3.5" y="13.5" width="4.5" height="7" rx="2" ${o('#ffb8d2')}/><rect x="16" y="13.5" width="4.5" height="7" rx="2" ${o('#ffb8d2')}/>${sparkle(12, 16.5, 2.4, '#c9b8ff')}`,
  car: `<path d="M3.5 15.5v-2.4c0-.9.6-1.7 1.4-2l2.3-.8 2-3.4c.4-.6 1-1 1.8-1h4c.8 0 1.4.4 1.8 1l2 3.4 1.6.6c.9.3 1.4 1.1 1.4 2v2.6a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5z" ${o('#bdf0d4')}/><circle cx="7.5" cy="17.5" r="2" ${o('#e2d6ff')}/><circle cx="16.5" cy="17.5" r="2" ${o('#e2d6ff')}/>${face(12, 12.6, 2.2)}`,
  house: `<path d="M4.5 11L12 4.5l7.5 6.5v8.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5z" ${o('#fff1c2')}/><path d="M3 12l9-8 9 8" fill="none" stroke="${L}" stroke-width="1.28" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 21v-4.5h4V21" ${o('#ffb8d2')}/>${face(12, 12.2, 2)}`,
  gradcap: `<path d="M2.5 9.5L12 5l9.5 4.5L12 14z" ${o('#e2d6ff')}/><path d="M6.5 11.5v4c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4" ${o('#e2d6ff')}/><path d="M21.5 9.5v5" stroke="${L}" ${SW}/><circle cx="21.5" cy="15.4" r="1" fill="#ffd166"/>`,
  piggy: `<ellipse cx="12" cy="13" rx="8" ry="6.5" ${o('#ffc2d9')}/><path d="M7.5 7.5l1.2 2.4M10 6.6h4" stroke="${L}" ${SW}/><rect x="10" y="5.4" width="4" height="1.6" rx=".8" fill="#ffd166"/><ellipse cx="18.6" cy="13.4" rx="2" ry="1.7" ${o('#ffd3e6')}/><path d="M8 19v1.8M15 19v1.8" stroke="${L}" stroke-width="1.44" stroke-linecap="round"/>${face(13, 12, 1.8)}`,
  gift: `<rect x="4" y="9.5" width="16" height="11" rx="2" ${o('#ffd3e6')}/><rect x="3" y="7" width="18" height="3.5" rx="1.5" ${o('#ffb8d2')}/><path d="M12 7v13.5" stroke="#9ff0c8" stroke-width="1.92"/><path d="M12 7c-1-3-5-3.5-4.5-1 .3 1.3 2.5 1 4.5 1zm0 0c1-3 5-3.5 4.5-1-.3 1.3-2.5 1-4.5 1z" ${o('#9ff0c8')}/>`,
  paw: `<ellipse cx="12" cy="15.5" rx="4.6" ry="3.8" ${o('#ffd3e6')}/><circle cx="6.5" cy="10.5" r="1.9" ${o('#ffd3e6')}/><circle cx="10" cy="7.2" r="1.9" ${o('#ffd3e6')}/><circle cx="14" cy="7.2" r="1.9" ${o('#ffd3e6')}/><circle cx="17.5" cy="10.5" r="1.9" ${o('#ffd3e6')}/>`,
};

export const ICON_NAMES = Object.keys(D);
// Manga ink look in the site's own palette: every colour in the drawings is swapped for ink, white
// paper, a grey screentone (the #ic-tone pattern in index.html) or a soft rose wash, picked by how
// light it is and whether it was pink. Because they are CSS variables, icons follow the palette.
// The slight hand-drawn wobble comes from the #ink-rough filter in index.html (applied to .ic).
const muteCache = new Map();
export function mute(hex) {
  if (muteCache.has(hex)) return muteCache.get(hex);
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const lum = .299 * r + .587 * g + .114 * b;
  let h = 0;
  if (max !== min) h = max === r ? ((g - b) / (max - min) + 6) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
  const pinkish = max === r && (h >= 4.6 || h < .3) && max - min > 30;
  let res;
  if (lum < 110) res = 'var(--mm-ink, #2f2a33)';                                   // pen lines
  else if (lum > 245) res = '#fff';                                                // white paper
  else if (pinkish) res = lum > 205 ? 'var(--mm-pink-soft, #f3e2e5)' : 'var(--mm-pink, #d9a7b0)'; // one soft rose wash
  else if (lum > 196) res = 'url(#ic-tone)';                                       // grey screentone dots
  else res = 'var(--mm-grey, #8a8390)';                                            // darker tone / accent lines
  muteCache.set(hex, res);
  return res;
}
const bodyCache = new Map();
const inked = name => {
  if (!bodyCache.has(name)) bodyCache.set(name, (D[name] || D.other).replace(/#[0-9a-fA-F]{6}\b/g, mute));
  return bodyCache.get(name);
};
export function icon(name, size = 22, label = '') {
  const body = inked(D[name] ? name : 'other');
  return `<svg class="ic ic-${name}" viewBox="0 0 24 24" width="${size}" height="${size}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"'}>${body}</svg>`;
}
// old saved goals used emoji: map them to drawings
export const EMOJI_TO_ICON = { '💎': 'gem', '💻': 'laptop', '✈️': 'plane', '🎧': 'headphones', '🚗': 'car', '🏠': 'house', '🎓': 'gradcap', '🛟': 'piggy', '🎁': 'gift', '🐉': 'chest' };
export const iconFor = v => (D[v] ? v : EMOJI_TO_ICON[v] || 'gem');
