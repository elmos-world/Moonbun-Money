import { openScanner } from './scanner.js';
import { createStore, isCloudConfigured } from './store.js';
import { rabbitSVG, dragonSVG, moonSVG } from './mascots.js';
import { initYutu, yutuReact, yutuDress } from './yutu.js';
import { baoChomp, baoDress } from './bao.js';
import { icon, iconFor, mute } from './icons.js';
import { ITEMS, SLOTS, BAO_ITEMS, BAO_SLOTS, baoOutfitFor, RARITY, itemById, itemThumb, wearLayers, outfitFor, rollGacha, machineSVG, capsuleSVG, FORTUNES, fortuneFor, omikujiBoxSVG,
  HEARTS_PER_LEVEL, friendLevel, FRIEND_TITLES, plantSVG, STICKERS, stickerById, SOUNDS, letterHTML } from './play.js';
import { parseAmount, parseCSV, guessColumns, rowsToEntries, nextDue, daysUntil, monthlyCost, cycleKey, payoff, payoffPlan, insights, compressImage, roundUp } from './plan.js';

/* ================= constants & helpers ================= */
// Fixed order = fixed color (--c1..--c8). A category keeps its color everywhere.
const CATS = [
  { id: 'food', label: 'Food', emoji: 'food' },
  { id: 'fun', label: 'Fun', emoji: 'fun' },
  { id: 'shopping', label: 'Shopping', emoji: 'shopping' },
  { id: 'transport', label: 'Getting around', emoji: 'transport' },
  { id: 'school', label: 'School', emoji: 'school' },
  { id: 'bills', label: 'Bills', emoji: 'bills' },
  { id: 'selfcare', label: 'Self-care', emoji: 'selfcare' },
  { id: 'other', label: 'Other', emoji: 'other' },
];
const catById = id => CATS.find(c => c.id === id) || CATS[7];
// category colours, softened toward paper so they sit with the ink-and-paper look
const catColor = id => `color-mix(in srgb, var(--c${CATS.indexOf(catById(id)) + 1}) 55%, #fbf8f3)`;
const GOAL_EMOJI = ['gem', 'laptop', 'plane', 'headphones', 'car', 'house', 'gradcap', 'piggy', 'gift', 'chest'];
const THEMES = [
  { id: 'sakura', name: 'Sakura', a: '#f77fb0', b: '#ffd9e8' },
  { id: 'lavender', name: 'Lavender dream', a: '#a78bfa', b: '#e9e0ff' },
  { id: 'melon', name: 'Melon soda', a: '#3cc794', b: '#d2f5e5' },
  { id: 'peach', name: 'Peach mochi', a: '#ff9b73', b: '#ffe2d4' },
  { id: 'sky', name: 'Ramune sky', a: '#6cb6f5', b: '#dbeeff' },
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'KRW', 'MXN', 'ISK', 'SEK', 'NOK', 'DKK', 'INR', 'BRL'];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const pad = n => String(n).padStart(2, '0');
const dateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => dateStr(new Date());
const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const parseYM = mk => mk.split('-').map(Number);
const daysInMonth = mk => { const [y, m] = parseYM(mk); return new Date(y, m, 0).getDate(); };
const shiftMonth = (mk, n) => { const [y, m] = parseYM(mk); return monthKey(new Date(y, m - 1 + n, 1)); };
const monthLabel = mk => { const [y, m] = parseYM(mk); return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); };
const fmtDate = ds => { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };
const sum = (arr, f = t => +t.amount || 0) => arr.reduce((a, t) => a + f(t), 0);
// Firestore write promises only resolve once the server confirms, which never happens offline.
// The local cache updates instantly, so wait briefly and move on; surface real errors.
const fire = p => Promise.race([Promise.resolve(p).catch(err => { console.error(err); toast('Couldn’t save that. Check your connection?'); }), new Promise(r => setTimeout(r, 350))]);
const pick = (arr, seed) => arr[Math.abs([...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % arr.length];

function money(n, round = false) {
  const cur = S.settings.currency || 'USD';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, ...(round ? { maximumFractionDigits: 0, minimumFractionDigits: 0 } : {}) }).format(n || 0);
  } catch { return `${(n || 0).toFixed(round ? 0 : 2)} ${cur}`; }
}

/* ================= state ================= */
let store;
let S = { transactions: [], goals: [], settings: { budgets: {} } };
const ui = { tab: 'home', month: monthKey(new Date()), histFilter: 'all', reaction: null, user: null, authMode: 'signin', authMsg: '' };

/* ================= calculations ================= */
const txInMonth = mk => S.transactions.filter(t => t.date && t.date.startsWith(mk));

function monthStats(mk) {
  const tx = txInMonth(mk);
  const of = type => tx.filter(t => t.type === type);
  const byCat = Object.fromEntries(CATS.map(c => [c.id, 0]));
  of('expense').forEach(t => { byCat[catById(t.category).id] += +t.amount || 0; });
  const budgets = S.settings.budgets || {};
  const budgetTotal = CATS.reduce((a, c) => a + (+budgets[c.id] || 0), 0);
  const income = sum(of('income')), spent = sum(of('expense')), saved = sum(of('saving'));
  return { tx, income, spent, saved, byCat, budgetTotal, left: income - spent - saved };
}
function monthProgress(mk) {
  const now = monthKey(new Date());
  if (mk < now) return 1;
  if (mk > now) return 0;
  return new Date().getDate() / daysInMonth(mk);
}
const goalSaved = id => sum(S.transactions.filter(t => t.type === 'saving' && t.goalId === id));
const totalHoard = () => sum(S.transactions.filter(t => t.type === 'saving'));

function spendByDay() {
  const m = new Map();
  S.transactions.filter(t => t.type === 'expense').forEach(t => m.set(t.date, (m.get(t.date) || 0) + (+t.amount || 0)));
  return m;
}
// no-spend streak: consecutive days ending today (or yesterday) without expenses, since first log
function streaks() {
  if (!S.transactions.length) return { current: 0, best: 0, loggedDays: 0 };
  const byDay = spendByDay();
  const first = S.transactions.map(t => t.date).sort()[0];
  const d = new Date(first + 'T12:00:00');
  const end = new Date(); end.setHours(12, 0, 0, 0);
  let run = 0, best = 0;
  for (; d <= end; d.setDate(d.getDate() + 1)) {
    if (byDay.get(dateStr(d))) run = 0; else { run++; best = Math.max(best, run); }
  }
  const loggedDays = new Set(S.transactions.map(t => t.date)).size;
  return { current: run, best, loggedDays };
}

function rabbitMood(mk) {
  const st = monthStats(mk);
  const target = +S.settings.savingsTarget || 0;
  if (!st.tx.length) return 'sleepy';
  if (target > 0 && st.saved >= target) return 'party';
  if (!st.budgetTotal) return 'happy';
  if (st.spent > st.budgetTotal) return 'worried';
  const pace = st.spent / (st.budgetTotal * Math.max(monthProgress(mk), 0.05));
  return pace < 0.9 ? 'happy' : pace <= 1.1 ? 'calm' : 'worried';
}
const RABBIT_LINES = {
  sleepy: ['*yawn* Nothing logged this month yet. Tap the + and I’ll start pounding! (っ˘ω˘ς )', 'The moon is quiet… add your first coins to wake me up ☾'],
  happy: ['You’re spending gently this month. The moon approves! ☆', 'Look at you, being careful with your coins ✧', 'Pound, pound! Your budget is in lovely shape.'],
  calm: ['Right on pace with your budget. Steady little hops ♪', 'Everything looks balanced. Keep it up! (◕‿◕)♡'],
  worried: ['Eep! Spending is running ahead of the budget (⊙_⊙;)', 'Maybe a few no-spend days to let the moon catch up? (｡•́︿•̀｡)'],
  party: ['FULL MOON!! You hit your savings target! ٩(◕‿◕)۶', 'The elixir is brewed! Savings target reached ✿'],
};

function badges() {
  const st = streaks();
  const months = [...new Set(S.transactions.map(t => t.date.slice(0, 7)))];
  const thisMonth = monthKey(new Date());
  const target = +S.settings.savingsTarget || 0;
  const list = [
    { id: 'first', ic: 'mooncake', name: 'First coin', got: S.transactions.length > 0, how: 'Log anything' },
    { id: 'save', ic: 'coin', name: 'Fed the dragon', got: S.transactions.some(t => t.type === 'saving'), how: 'Save some money' },
    { id: 'week', ic: 'calendar', name: '7 days logged', got: st.loggedDays >= 7, how: 'Log on 7 different days' },
    { id: 'nospend', ic: 'sprout', name: '3 no-spend days', got: st.best >= 3, how: '3 days in a row without spending' },
    { id: 'full', ic: 'moon', name: 'Full moon', got: target > 0 && months.some(m => monthStats(m).saved >= target), how: 'Hit your monthly savings target' },
    { id: 'under', ic: 'lantern', name: 'Under budget', got: months.some(m => m < thisMonth && (() => { const s = monthStats(m); return s.budgetTotal > 0 && s.spent > 0 && s.spent <= s.budgetTotal; })()), how: 'Finish a month under budget' },
    { id: 'goal', ic: 'gem', name: 'Treasure won', got: S.goals.some(g => +g.target > 0 && goalSaved(g.id) >= +g.target), how: 'Complete a savings goal' },
    { id: 'hoard', ic: 'dragon', name: 'Dragon’s hoard', got: totalHoard() >= 1000, how: 'Save 1,000 in total' },
  ];
  return list;
}

/* ================= play state (gacha, hearts, diary…) ================= */
const play = () => S.settings.play || {};
function savePlay(patch) { return fire(store.saveSettings({ play: { ...play(), ...patch } })); }
const sound = name => { if (S.settings.sound !== false) try { SOUNDS[name]?.(); } catch { /* audio blocked */ } };
function ticketsEarned() {
  const pl = play();
  return 3 /* welcome gift */ + streaks().loggedDays + 2 * badges().filter(b => b.got).length + Object.keys(pl.omikuji || {}).length + (friendLevel(pl.hearts) - 1);
}
const tickets = () => Math.max(0, ticketsEarned() - (play().spent || 0));
function addHearts(n, why = '') {
  const pl = play(), before = friendLevel(pl.hearts), hearts = (pl.hearts || 0) + n, after = friendLevel(hearts);
  savePlay({ hearts });
  if (after > before) { sound('chime'); toast(`Friendship level ${after}! “${FRIEND_TITLES[Math.min(after - 1, FRIEND_TITLES.length - 1)]}” · +1 moon ticket ♡`); }
  else if (why) toast(why);
}
function bestStreakIn(mk) {
  const byDay = spendByDay(), first = S.transactions.map(t => t.date).sort()[0];
  if (!first) return 0;
  let run = 0, best = 0; const today = todayStr();
  for (let d = 1; d <= daysInMonth(mk); d++) {
    const ds = `${mk}-${pad(d)}`; if (ds > today || ds < first) continue;
    if (byDay.get(ds)) run = 0; else best = Math.max(best, ++run);
  }
  return best;
}

/* ================= rendering ================= */
const views = { home: viewHome, spending: viewSpending, hoard: viewHoard, play: viewPlay, plan: viewPlan, history: viewHistory, settings: viewSettings };

function render() {
  $('#month-label').innerHTML = `<small lang="ja" aria-hidden="true">第${+ui.month.slice(5)}話</small> ${esc(monthLabel(ui.month))}`;
  $$('.tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === ui.tab ? 'page' : 'false'));
  document.documentElement.classList.toggle('reduce-motion', !!S.settings.reduceMotion);
  document.documentElement.dataset.theme = S.settings.theme || 'sakura';
  $('#view').innerHTML = (views[ui.tab] || viewHome)();
  if (ui.reaction?.kind && !ui.reaction.played && ui.tab === 'home') { ui.reaction.played = true; const k = ui.reaction.kind; setTimeout(() => yutuReact(k), 30); }
  if (ui.reaction?.chomp && !ui.reaction.chomped && ui.tab === 'hoard') { ui.reaction.chomped = true; baoChomp(); }
}

function viewHome() { return remindersHTML() + viewHomeBase(); }
function viewHomeBase() {
  const mk = ui.month;
  const st = monthStats(mk);
  const target = +S.settings.savingsTarget || 0;
  const moonFrac = target > 0 ? Math.min(1, st.saved / target) : 0;
  let mood = rabbitMood(mk);
  let line = pick(RABBIT_LINES[mood], mk + mood + st.tx.length);
  if (ui.reaction && Date.now() - ui.reaction.at < 7000) { mood = ui.reaction.mood || mood; line = ui.reaction.line; }
  const name = S.settings.name ? `, ${esc(S.settings.name)}` : '';
  const prog = monthProgress(mk);
  const spentPct = st.budgetTotal ? (st.spent / st.budgetTotal) * 100 : 0;
  const recent = [...S.transactions].sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || ''))).slice(0, 5);
  const s = streaks();
  const bs = badges();

  return `
  <section class="card hero" aria-labelledby="hero-title">
    <div class="hero-moon">
      ${moonSVG(moonFrac, { size: 140, label: `Savings moon: ${Math.round(moonFrac * 100)}% of this month's target` })}
      <div class="pct">${Math.round(moonFrac * 100)}% full</div>
      <div class="tiny">${money(st.saved, true)} of ${money(target, true)} saved</div>
    </div>
    <div class="hero-text">
      <h1 id="hero-title">Hi${name}! ☾</h1>
      <p class="muted">Yutu fills the moon as you save toward this month’s target.</p>
      <p class="bubble${mood === 'worried' ? ' shout' : ''}" aria-live="polite">${esc(line)}</p>
      ${friendMeter()}
      <div class="hero-actions">
        <button class="btn small ghost" data-action="letter">${icon('envelope', 20)} Letter from Yutu</button>
        ${play().omikuji?.[todayStr()] === undefined ? `<button class="btn small ghost" data-action="tab" data-tab="play">${icon('omikuji', 20)} Today’s fortune</button>` : ''}
      </div>
    </div>
    <div class="hero-rabbit"><div class="speedlines" aria-hidden="true"></div><div class="petals" aria-hidden="true"><i>✿</i><i>❀</i><i>✿</i><i>❀</i><i>✿</i></div>${wearAround(rabbitSVG(mood, { interactive: true }))}
      <span class="sfx sfx-a" lang="ja" aria-hidden="true">${{ worried: 'あわわ', party: 'キラキラ', sleepy: 'すやすや' }[mood] || 'ぺったん'}</span>
      <span class="sfx sfx-b" lang="ja" aria-hidden="true">${{ worried: '>_<', party: '♡', sleepy: '☾' }[mood] || '♡'}</span></div>
  </section>

  <section class="tiles" aria-label="This month at a glance">
    ${tile('purse', 'Earned', st.income)}
    ${tile('dango', 'Spent', st.spent)}
    ${tile('coin', 'Saved', st.saved)}
    ${tile('clover', 'Left over', st.left, st.left < 0)}
  </section>

  <div class="grid-2">
    <section class="card" aria-labelledby="pace-title">
      <div class="card-head"><h2 id="pace-title" data-jp="予算">Budget pace</h2><button class="btn small ghost" data-action="tab" data-tab="spending">Edit budgets</button></div>
      ${st.budgetTotal ? `
        <div class="bar ${spentPct > 100 ? 'over' : ''}" role="progressbar" aria-label="Spent of monthly budget" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(spentPct)}">
          <span style="width:${Math.min(100, spentPct)}%;background-color:${spentPct > 100 ? 'var(--danger)' : spentPct > prog * 110 ? 'var(--pink)' : 'var(--jade)'}"></span>
          ${prog > 0 && prog < 1 ? `<i class="today" style="left:${prog * 100}%" title="Today"></i>` : ''}
        </div>
        <div class="pace-legend"><span><b>${money(st.spent)}</b> of ${money(st.budgetTotal, true)}</span><span>${prog > 0 && prog < 1 ? `│ = today (${Math.round(prog * 100)}% of month)` : ''}</span></div>
        <p class="tiny" style="margin-top:8px">${spentPct > 100 ? 'Over budget by ' + money(st.spent - st.budgetTotal) : spentPct > prog * 110 ? 'A little ahead of pace ♪' : 'On track ✧'}</p>`
      : `<p class="muted">Set a budget for each category and Yutu will keep an eye on your pace.</p>`}
    </section>

    <section class="card" aria-labelledby="streak-title">
      <div class="card-head"><h2 id="streak-title" data-jp="月餅">Mooncake shelf</h2></div>
      <div class="streak"><span class="num">${s.current}</span><div><b>day no-spend streak</b><div class="tiny">Best: ${s.best} · Days logged: ${s.loggedDays}</div></div></div>
      <div class="cakes shelf">${bs.slice(0, 4).map(cakeHTML).join('')}</div>
      <p class="tiny" style="margin-top:8px">${bs.filter(b => b.got).length} of ${bs.length} mooncakes collected · see all in Hoard</p>
    </section>
  </div>

  <section class="card" aria-labelledby="recent-title">
    <div class="card-head"><h2 id="recent-title" data-jp="最近">Recent</h2><button class="btn small ghost" data-action="tab" data-tab="history">See all</button></div>
    ${recent.length ? `<ul class="tx-list">${recent.map(txHTML).join('')}</ul>` : emptyHTML('No entries yet. Tap the golden ＋ to add your first one!')}
  </section>`;
}

const TILE_SFX = { Earned: 'ジャラ', Spent: 'ぽちっ', Saved: 'キラッ', 'Left over': 'ほっ' };
const tile = (ic, label, val, neg = false) =>
  `<div class="tile ${neg ? 'neg' : ''}"><span class="tile-sfx" lang="ja" aria-hidden="true">${TILE_SFX[label] || ''}</span><div class="label">${icon(ic, 22)}${label}</div><div class="value">${neg ? '−' : ''}${money(Math.abs(val))}</div></div>`;
const cakeHTML = b => `<div class="cake ${b.got ? '' : 'locked'}" title="${esc(b.how)}"><span class="ic" aria-hidden="true">${icon(b.ic, 40)}</span>${esc(b.name)}<span class="sr-only">${b.got ? ' (collected)' : ` (locked: ${esc(b.how)})`}</span></div>`;
const emptyHTML = msg => `<div class="empty"><div class="mini">${rabbitSVG('sleepy', { mini: true })}</div><p>${msg}</p></div>`;

function txHTML(t) {
  let ic, what, color, cls, sign;
  if (t.type === 'expense') { const c = catById(t.category); ic = c.id; what = t.note || c.label; color = catColor(c.id); cls = 'expense'; sign = '−'; }
  else if (t.type === 'income') { ic = 'purse'; what = t.note || 'Income'; color = 'var(--jade)'; cls = 'income'; sign = '+'; }
  else { const g = S.goals.find(g => g.id === t.goalId); ic = g ? iconFor(g.emoji) : 'coin'; what = t.note || (g ? `Saved for ${g.name}` : 'Savings'); color = 'var(--gold)'; cls = 'saving'; sign = '🪙 '; }
  const kind = t.type === 'expense' ? catById(t.category).label : t.type === 'income' ? 'Earned' : 'Saved';
  return `<li class="tx">
    <span class="ico" style="--swatch:${color}" aria-hidden="true">${icon(ic, 28)}</span>
    <div><div class="what">${esc(what)}</div><div class="sub">${kind} · ${fmtDate(t.date)}</div></div>
    <span class="amt ${cls}">${sign}${money(+t.amount)}</span>
    ${t.receipt ? `<button class="icon-btn" data-action="view-receipt" data-id="${esc(t.id)}" aria-label="See receipt photo">${icon('clip', 20)}</button>` : ''}
    <button class="icon-btn del" data-action="del-tx" data-id="${esc(t.id)}" aria-label="Delete ${esc(what)}, ${money(+t.amount)}">${icon('trash', 20)}</button>
  </li>`;
}

/* ---------- Spending ---------- */
function viewSpending() { return viewSpendingBase() + insightsHTML(); }
function viewSpendingBase() {
  const st = monthStats(ui.month);
  const budgets = S.settings.budgets || {};
  return `
  <div class="grid-2">
    <section class="card" aria-labelledby="donut-title">
      <div class="card-head"><h2 id="donut-title" data-jp="支出">Where it went</h2><span class="tiny">${monthLabel(ui.month)}</span></div>
      ${donutHTML(st)}
    </section>
    <section class="card" aria-labelledby="hm-title">
      <div class="card-head"><h2 id="hm-title" data-jp="暦">Spending calendar</h2><span class="tiny"><span class="ns-mark">✿</span> = no-spend day · tap a day for your diary</span></div>
      ${heatmapHTML(ui.month)}
    </section>
  </div>
  <section class="card" aria-labelledby="bud-title">
    <div class="card-head"><h2 id="bud-title" data-jp="予算">Monthly budgets</h2><span class="tiny">Total ${money(st.budgetTotal, true)}</span></div>
    <p class="tiny">Drag the sliders (or type a number) to set how much each category gets per month.</p>
    ${CATS.map(c => {
      const lim = +budgets[c.id] || 0, sp = st.byCat[c.id];
      const pct = lim ? (sp / lim) * 100 : (sp ? 100 : 0);
      const over = sp > lim && lim > 0;
      return `<div class="budget-row">
        <div class="budget-top"><span class="name"><span class="swatch" style="--swatch:${catColor(c.id)}"></span>${icon(c.id, 22)}${c.label}</span>
          <span><b>${money(sp)}</b> <span class="muted">/ ${money(lim, true)}</span></span></div>
        <div class="bar ${over ? 'over' : ''}" role="progressbar" aria-label="${c.label}: spent of budget" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}">
          <span style="width:${Math.min(100, pct)}%;background-color:${catColor(c.id)}"></span></div>
        ${over ? `<span class="over-note">Over by ${money(sp - lim)}</span>` : ''}
        <div class="budget-edit">
          <input type="range" min="0" max="1000" step="5" value="${Math.min(1000, lim)}" data-budget="${c.id}" aria-label="${c.label} monthly budget">
          <input type="number" min="0" step="1" value="${lim}" data-budget="${c.id}" aria-label="${c.label} monthly budget amount" style="width:6em;background:#171338;border:2px solid var(--line);border-radius:10px;padding:6px 8px">
        </div>
      </div>`;
    }).join('')}
  </section>`;
}

// "Where it went": drawn like an ink sketch. Each slice is an outlined wedge in a muted
// category colour with its own screentone texture (so slices differ by more than colour),
// and the whole ring gets the same pen wobble as the icons.
const DONUT_TEX = ['', 'dots', 'lines', 'cross', 'hlines', 'bigdots', 'rlines', 'grid'];
function donutHTML(st) {
  if (!st.spent) return emptyHTML('No spending this month. That’s a whole moon of mooncakes ✿');
  const cx = 110, cy = 110, R = 84, ri = 50;
  const parts = CATS.map(c => ({ c, v: st.byCat[c.id] })).filter(p => p.v > 0);
  const pt = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  let a0 = -Math.PI / 2;
  const segs = parts.map(p => {
    const frac = p.v / st.spent, a1 = a0 + frac * Math.PI * 2, large = frac > .5 ? 1 : 0;
    const idx = CATS.indexOf(p.c);
    const d = parts.length === 1
      ? `M${pt(R, -Math.PI / 2)}A${R} ${R} 0 1 1 ${pt(R, Math.PI / 2)}A${R} ${R} 0 1 1 ${pt(R, -Math.PI / 2)}ZM${pt(ri, -Math.PI / 2)}A${ri} ${ri} 0 1 0 ${pt(ri, Math.PI / 2)}A${ri} ${ri} 0 1 0 ${pt(ri, -Math.PI / 2)}Z`
      : `M${pt(R, a0)}A${R} ${R} 0 ${large} 1 ${pt(R, a1)}L${pt(ri, a1)}A${ri} ${ri} 0 ${large} 0 ${pt(ri, a0)}Z`;
    const tip = `${p.c.label}: ${money(p.v)} (${Math.round(frac * 100)}%)`;
    const tex = DONUT_TEX[idx] ? `<path d="${d}" fill="url(#dtex-${DONUT_TEX[idx]})" fill-rule="evenodd" pointer-events="none"/>` : '';
    a0 = a1;
    return `<g class="seg-g"><path class="seg" d="${d}" fill-rule="evenodd" style="--slice:${catColor(p.c.id)}" tabindex="0" role="listitem" aria-label="${esc(tip)}" data-tip="${esc(tip)}"/>${tex}</g>`;
  }).join('');
  const ink = '#2f2a33';
  const pat = (id, body, size = 6, rot = 0) => `<pattern id="dtex-${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">${body}</pattern>`;
  const sparkle = (x, y, k) => `<path d="M${x} ${y - k}Q${x + k * .18} ${y - k * .18} ${x + k} ${y}Q${x + k * .18} ${y + k * .18} ${x} ${y + k}Q${x - k * .18} ${y + k * .18} ${x - k} ${y}Q${x - k * .18} ${y - k * .18} ${x} ${y - k}Z"/>`;
  return `<div class="donut-wrap">
    <svg class="donut donut-ink" viewBox="0 0 220 220" role="list" aria-label="Spending by category">
      <defs>
        ${pat('dots', `<circle cx="3" cy="3" r=".9" fill="${ink}" fill-opacity=".35"/>`, 5, 30)}
        ${pat('lines', `<path d="M0 3h6" stroke="${ink}" stroke-opacity=".3" stroke-width=".8"/>`, 6, 45)}
        ${pat('cross', `<path d="M0 3h6M3 0v6" stroke="${ink}" stroke-opacity=".25" stroke-width=".7"/>`, 6, 45)}
        ${pat('hlines', `<path d="M0 2.5h5" stroke="${ink}" stroke-opacity=".28" stroke-width=".8"/>`, 5, 0)}
        ${pat('bigdots', `<circle cx="4" cy="4" r="1.5" fill="${ink}" fill-opacity=".22"/>`, 8, 20)}
        ${pat('rlines', `<path d="M0 3h6" stroke="${ink}" stroke-opacity=".3" stroke-width=".8"/>`, 6, -45)}
        ${pat('grid', `<path d="M0 .5h7M.5 0v7" stroke="${ink}" stroke-opacity=".2" stroke-width=".7"/>`, 7, 0)}
      </defs>
      <g class="donut-sketch" fill="none" stroke="${ink}">
        <circle cx="${cx}" cy="${cy}" r="${R + 9}" stroke-width=".8" stroke-dasharray="30 6 9 5 50 8" opacity=".45"/>
        <circle cx="${cx + .8}" cy="${cy - .6}" r="${R + 5}" stroke-width=".7" stroke-dasharray="70 10 20 8" opacity=".35"/>
      </g>
      <g class="donut-slices">${segs}</g>
      <circle cx="${cx}" cy="${cy}" r="${ri - 5}" class="donut-heart-bg"/>
      <g class="donut-center" aria-hidden="true">
        <path d="M110 82c-6-4-7.5-8.5-4.5-10.2 1.8-1 3.6-.2 4.5 1.5.9-1.7 2.7-2.5 4.5-1.5 3 1.7 1.5 6.2-4.5 10.2z" class="donut-heart"/>
        <text class="big" x="110" y="112" text-anchor="middle">${money(st.spent, true)}</text>
        <text class="small" x="110" y="129" text-anchor="middle">spent</text>
      </g>
      <g class="donut-stars" fill="${ink}">${sparkle(22, 30, 6)}${sparkle(198, 188, 7)}${sparkle(200, 34, 3.5)}</g>
    </svg>
    <ul class="legend" aria-label="Spending by category, table">
      ${parts.sort((a, b) => b.v - a.v).map(p => `<li style="--swatch:${catColor(p.c.id)}"><span class="swatch tex-${DONUT_TEX[CATS.indexOf(p.c)] || 'none'}"></span><span>${icon(p.c.id, 18)} ${p.c.label}</span><span class="pct">${Math.round((p.v / st.spent) * 100)}%</span><span class="amt">${money(p.v)}</span></li>`).join('')}
    </ul>
  </div>`;
}

function heatmapHTML(mk) {
  const [y, m] = parseYM(mk);
  const dim = daysInMonth(mk), first = new Date(y, m - 1, 1).getDay();
  const byDay = spendByDay();
  const vals = Array.from({ length: dim }, (_, i) => byDay.get(`${mk}-${pad(i + 1)}`) || 0);
  const max = Math.max(...vals, 0);
  const today = todayStr();
  const firstLog = S.transactions.map(t => t.date).sort()[0];
  let cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<div class="dow" aria-hidden="true">${d}</div>`).join('');
  cells += '<div aria-hidden="true"></div>'.repeat(first);
  vals.forEach((v, i) => {
    const ds = `${mk}-${pad(i + 1)}`;
    const step = v > 0 ? Math.max(1, Math.ceil((v / max) * 4)) : 0;
    const future = ds > today;
    const nospend = !future && v === 0 && firstLog && ds >= firstLog;
    const entry = play().diary?.[ds], stk = entry && stickerById(entry.s);
    const tip = `${fmtDate(ds)}: ${future ? 'not yet' : v ? money(v) + ' spent' : 'no spending'}${stk ? ` · feeling ${stk.name.toLowerCase()}` : ''}${entry?.n ? ` · “${entry.n}”` : ''}`;
    cells += `<button type="button" class="hm-cell s${step} ${future ? 'future' : ''} ${nospend && !stk ? 'nospend' : ''} ${ds === today ? 'today' : ''} ${stk ? 'has-sticker' : ''}" data-action="diary" data-date="${ds}" data-tip="${esc(tip)}" aria-label="${esc(tip)}. Open diary"><b>${i + 1}</b>${stk ? `<span class="cell-sticker">${stk.svg}</span>` : ''}</button>`;
  });
  return `<div class="heatmap">${cells}</div>
    <div class="hm-legend" aria-hidden="true">less <i class="tone0"></i><i class="tone1"></i><i class="tone2"></i><i class="tone3"></i><i class="tone4"></i> more</div>`;
}

/* ---------- Hoard (savings) ---------- */
function viewHoard() {
  const hoard = totalHoard();
  const targets = sum(S.goals, g => +g.target || 0);
  const fill = targets ? Math.min(1, sum(S.goals, g => Math.min(goalSaved(g.id), +g.target || 0)) / targets) : Math.min(1, hoard / 500);
  const anyDone = S.goals.some(g => +g.target > 0 && goalSaved(g.id) >= +g.target);
  let mood = !hoard ? 'sleepy' : anyDone || fill >= 1 ? 'excited' : fill > 0.4 ? 'proud' : 'happy';
  let line = !hoard ? 'Bao is napping on an empty cave… feed them some coins! (っ˘ω˘ς )'
    : anyDone ? 'Bao is SO proud. A treasure is complete! ٩(◕‿◕)۶'
    : `Bao is guarding ${money(hoard)} of your treasure. No impulse buys allowed! (｀・ω・´)`;
  if (ui.reaction?.chomp && Date.now() - ui.reaction.at < 7000) { mood = 'excited'; line = ui.reaction.dragonLine; }
  const bs = badges();
  return `
  <section class="card hoard-hero" aria-labelledby="hoard-title">
    ${dressBao(), dragonSVG(mood, fill)}
    <div>
      <h1 id="hoard-title">Bao’s treasure hoard</h1><span class="sfx sfx-hoard" lang="ja" aria-hidden="true">キラキラ♡</span>
      <p class="bubble left" aria-live="polite">${esc(line)}</p>
      <p class="muted" style="margin-top:10px">Total saved: <b style="color:var(--gold)">${money(hoard)}</b>${targets ? ` · ${Math.round(fill * 100)}% of all goals` : ''}</p>
      <button class="btn primary" data-action="open-add" data-type="saving">${icon('coin', 20)} Feed Bao</button>
    </div>
  </section>

  <section class="card" aria-labelledby="goals-title">
    <div class="card-head"><h2 id="goals-title" data-jp="宝物">Treasures you’re saving for</h2></div>
    ${S.goals.length ? `<div class="goals">${S.goals.map(goalHTML).join('')}</div>` : `<p class="muted">No goals yet. What are you dreaming of? A new laptop? A trip? An emergency fund?</p>`}
    <h3 style="margin-top:18px">New treasure ✧</h3>
    <form id="goal-form" class="form-row" autocomplete="off">
      <label class="field"><span>Name</span><input name="name" required maxlength="40" placeholder="Winter break trip"></label>
      <label class="field"><span>Target</span><input name="target" required inputmode="decimal" placeholder="500"></label>
      <label class="field"><span>Needed by (optional)</span><input name="due" type="date"></label>
      <button class="btn jade" type="submit" style="margin-bottom:10px">Add goal</button>
      <fieldset class="emoji-pick" style="border:0;padding:0;margin:0;grid-column:1/-1"><legend class="tiny" style="margin-bottom:6px">Pick a gem</legend>
        ${GOAL_EMOJI.map((e, i) => `<label><input type="radio" name="emoji" value="${e}" ${i === 0 ? 'checked' : ''} aria-label="${e}"><span>${icon(e, 26)}</span></label>`).join('')}
      </fieldset>
    </form>
  </section>

  <section class="card" aria-labelledby="cakes-title">
    <div class="card-head"><h2 id="cakes-title" data-jp="収集">All mooncakes</h2><span class="tiny">${bs.filter(b => b.got).length} / ${bs.length}</span></div>
    <div class="cakes">${bs.map(cakeHTML).join('')}</div>
  </section>`;
}

function sinkingLine(g, saved, target, done) {
  if (!g.due || done) return '';
  const [y, m] = g.due.split('-').map(Number), now = new Date();
  const months = Math.max(1, (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth()) + (+g.due.slice(8) >= now.getDate() ? 0 : 0));
  const late = g.due < todayStr();
  return `<div class="sinking ${late ? 'late' : ''}">${icon('calendar', 18)} ${late ? `Was needed by ${fmtDate(g.due)}` : `Needed by ${fmtDate(g.due)} · save <b>${money((target - saved) / months)}</b> a month`}</div>`;
}
function goalHTML(g) {
  const saved = goalSaved(g.id), target = +g.target || 0;
  const pct = target ? Math.min(100, (saved / target) * 100) : 0;
  const done = target && saved >= target;
  return `<div class="goal ${done ? 'done' : ''}">
    <div class="goal-plant">${plantSVG(pct)}</div>
    <div class="goal-top"><span class="gem" aria-hidden="true">${icon(iconFor(g.emoji), 34)}</span><span class="gname">${esc(g.name)}${done ? ' ✧' : ''}</span><b>${Math.round(pct)}%</b></div>
    <div class="bar gold" role="progressbar" aria-label="${esc(g.name)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><span style="width:${pct}%"></span></div>
    <div class="tiny">${money(saved)} of ${money(target)}${done ? ' · complete!' : ` · ${money(target - saved)} to go`}</div>
    ${sinkingLine(g, saved, target, done)}
    <div class="goal-actions">
      <button class="btn small primary" data-action="open-add" data-type="saving" data-goal="${esc(g.id)}">＋ Add coins</button>
      <button class="btn small danger" data-action="del-goal" data-id="${esc(g.id)}" aria-label="Delete goal ${esc(g.name)}">Remove</button>
    </div>
  </div>`;
}

/* ---------- Play: friendship, gacha, omikuji, wardrobe ---------- */
function dressBao() { baoDress(baoOutfitFor(play().baoEquipped || {})); return ''; }
// one wardrobe grid for either friend; who = 'yutu' or 'bao'
function wardrobeGrid(items, owned, eq, who) {
  return `<div class="ward-grid">${items.map(it => {
    const has = owned.includes(it.id), on = eq[it.slot] === it.id;
    return has ? `<button class="ward-item r${it.rarity} ${on ? 'on' : ''}" data-action="equip" data-who="${who}" data-slot="${it.slot}" data-id="${it.id}" aria-pressed="${on}" aria-label="${esc(it.name)}, ${RARITY[it.rarity].name}${on ? ', wearing' : ''}">${itemThumb(it, 76)}<span class="wi-name">${esc(it.name)}</span><span class="wi-stars">${RARITY[it.rarity].stars}</span>${on ? '<span class="wi-on">wearing</span>' : ''}</button>`
      : `<div class="ward-item locked r${it.rarity}" aria-label="Not found yet, ${RARITY[it.rarity].name}"><span class="wi-q">?</span><span class="wi-name">???</span><span class="wi-stars">${RARITY[it.rarity].stars}</span></div>`;
  }).join('')}</div>`;
}
function baoPlayHTML(t) {
  const pl = play(), owned = pl.baoOwned || [], eq = pl.baoEquipped || {};
  const slot = ui.baoSlot || 'hat';
  dressBao();
  return `
  <section class="card play-hero" aria-labelledby="bao-gacha-title">
    <div class="card-head"><h2 id="bao-gacha-title" data-jp="宝ガチャ">Bao’s treasure capsules</h2><span class="ticket-count">${icon('ticket', 24)} <b>${t}</b> moon ${t === 1 ? 'ticket' : 'tickets'}</span></div>
    <div class="gacha-grid">
      <div class="machine-wrap">${machineSVG({ bao: true })}</div>
      <div>
        <p class="bubble left">A capsule for me too? Crowns, necklaces and glasses for a very fancy dragon (｀・ω・´)♡</p>
        <button class="btn primary big" data-action="gacha-bao" ${t ? '' : 'aria-disabled="true"'}>${icon('capsule', 22)} Turn Bao’s knob · 1 ticket</button>
        <p class="tiny">Same moon tickets as Yutu’s machine. Odds: ${RARITY[1].stars} cute 65% · ${RARITY[2].stars} rare 28% · ${RARITY[3].stars} super rare 7%</p>
      </div>
    </div>
  </section>
  <section class="card" aria-labelledby="bao-ward-title">
    <div class="card-head"><h2 id="bao-ward-title" data-jp="衣装">Bao’s wardrobe</h2><span class="tiny">${owned.length} / ${BAO_ITEMS.length} collected</span></div>
    <div class="wardrobe">
      <div class="ward-preview bao-preview">${dragonSVG('happy', 0.35, { title: 'Bao trying on accessories' })}</div>
      <div>
        <div class="chips" role="group" aria-label="Bao's accessory type">${BAO_SLOTS.map(sl => `<button class="chip" data-action="bao-slot" data-slot="${sl.id}" aria-pressed="${sl.id === slot}">${sl.name}</button>`).join('')}</div>
        ${wardrobeGrid(BAO_ITEMS.filter(i => i.slot === slot), owned, eq, 'bao')}
      </div>
    </div>
  </section>`;
}
function wearAround(inner) {
  const eq = play().equipped || {};
  yutuDress(outfitFor(eq));
  const w = wearLayers(eq);
  return `<div class="wear-wrap">${w.back}${inner}${w.front}</div>`;
}
// a little pen-drawn heart (filled pink when earned, empty paper when not)
const HAND_HEART = `<svg class="hh" viewBox="0 0 24 24"><path d="M12 20.2c-.4-.3-7.9-5-8.6-10.1-.4-3.1 1.6-5.4 4.2-5.5 2-.1 3.6 1.2 4.4 2.8.9-1.7 2.5-2.9 4.5-2.8 2.7.2 4.4 2.6 3.9 5.6-.8 4.9-8 9.7-8.4 10z"/><path class="hh-shine" d="M7.2 8.4c.3-1 1-1.6 1.9-1.8"/></svg>`;
function friendMeter() {
  const h = play().hearts || 0, lv = friendLevel(h), inLv = h % HEARTS_PER_LEVEL;
  const title = FRIEND_TITLES[Math.min(lv - 1, FRIEND_TITLES.length - 1)];
  return `<div class="friend" role="group" aria-label="Friendship level ${lv}, ${title}, ${inLv} of ${HEARTS_PER_LEVEL} hearts">
    <span class="friend-lv">Lv ${lv}</span><span class="friend-title">${title}</span>
    <span class="friend-hearts" aria-hidden="true">${Array.from({ length: HEARTS_PER_LEVEL }, (_, i) => `<i class="${i < inLv ? 'on' : ''}">${HAND_HEART}</i>`).join('')}</span></div>`;
}
function viewPlay() {
  const pl = play(), owned = pl.owned || [], eq = pl.equipped || {}, t = tickets();
  const slot = ui.slot || 'top';
  const today = todayStr(), drawn = pl.omikuji?.[today];
  const f = drawn !== undefined ? FORTUNES[drawn] : null;
  const items = ITEMS.filter(i => i.slot === slot);
  return `
  <section class="card play-hero" aria-labelledby="gacha-title">
    <div class="card-head"><h2 id="gacha-title" data-jp="ガチャ">Moon capsule machine</h2><span class="ticket-count">${icon('ticket', 24)} <b>${t}</b> moon ${t === 1 ? 'ticket' : 'tickets'}</span></div>
    <div class="gacha-grid">
      <div class="machine-wrap">${machineSVG()}</div>
      <div>
        <p class="bubble left">Turn the knob for a surprise accessory for me! ${t ? '(◕‿◕)♡' : 'We need a moon ticket first (｡•́︿•̀｡)'}</p>
        <button class="btn primary big" data-action="gacha" ${t ? '' : 'aria-disabled="true"'}>${icon('capsule', 22)} Turn the knob · 1 ticket</button>
        <details class="earn"><summary>How do I earn moon tickets?</summary>
          <ul><li>${icon('gift', 18)} 3 welcome tickets, a gift from Yutu ♡</li><li>${icon('calendar', 18)} 1 for every day you log something</li><li>${icon('mooncake', 18)} 2 for every mooncake badge</li>
          <li>${icon('omikuji', 18)} 1 for each daily fortune</li><li>${icon('heart', 18)} 1 each time your friendship levels up</li></ul></details>
        <p class="tiny">Odds: ${RARITY[1].stars} cute 65% · ${RARITY[2].stars} rare 28% · ${RARITY[3].stars} super rare 7%</p>
      </div>
    </div>
  </section>

  <div class="grid-2">
    <section class="card" aria-labelledby="omi-title">
      <div class="card-head"><h2 id="omi-title" data-jp="おみくじ">Daily fortune</h2></div>
      ${f ? `<div class="fortune"><div class="fortune-slip"><span class="fortune-rank" lang="ja">${f.rank}</span><span class="fortune-read">${f.read} · ${f.en}</span></div><p>${f.msg}</p><p class="tiny">Come back tomorrow for a new fortune ☾</p></div>`
        : `<div class="omi-wrap"><button class="omi-btn" data-action="omikuji" aria-label="Shake the fortune box">${omikujiBoxSVG()}</button><p class="muted">Shake the box for today’s money fortune and a moon ticket ✧</p></div>`}
    </section>
    <section class="card" aria-labelledby="friend-title">
      <div class="card-head"><h2 id="friend-title" data-jp="友情">Friendship</h2></div>
      ${friendMeter()}
      <p class="muted" style="margin-top:10px">Pet Yutu on the Home page (up to 5 hearts a day) and visit every day (+2 hearts). Every ${HEARTS_PER_LEVEL} hearts is a new level and a moon ticket.</p>
    </section>
  </div>

  <section class="card" aria-labelledby="ward-title">
    <div class="card-head"><h2 id="ward-title" data-jp="衣装">Yutu’s wardrobe</h2><span class="tiny">${owned.length} / ${ITEMS.length} collected</span></div>
    <div class="wardrobe">
      <div class="ward-preview">${wearAround(rabbitSVG('happy', { title: 'Yutu trying on accessories' }))}</div>
      <div>
        <div class="chips" role="group" aria-label="Accessory type">${SLOTS.map(sl => `<button class="chip" data-action="wardrobe-slot" data-slot="${sl.id}" aria-pressed="${sl.id === slot}">${sl.name}</button>`).join('')}</div>
        ${wardrobeGrid(items, owned, eq, 'yutu')}
      </div>
    </div>
  </section>${baoPlayHTML(t)}`;
}

/* ---------- gacha ---------- */
const CAP_COLORS = ['#ffc2d9', '#c8f7e1', '#e2d6ff', '#fff2a8', '#cfe6ff'];
function playDialog(html, cls = '') {
  const d = $('#play-dialog'); d.className = cls; $('#play-body').innerHTML = html;
  if (!d.open) d.showModal();
}
function pullGacha(who = 'yutu') {
  if (tickets() < 1) { sound('oops'); toast('No moon tickets yet. Log a day, collect mooncakes or draw a fortune ✧'); return; }
  const pl = play(), it = who === 'bao' ? rollGacha(pl.baoOwned || [], BAO_ITEMS) : rollGacha(pl.owned || []);
  ui.pending = it; ui.pendingWho = who;
  savePlay({ spent: (pl.spent || 0) + 1 });
  sound('roll');
  $(who === 'bao' ? '.machine-bao' : '.machine:not(.machine-bao)')?.classList.add('turning');
  setTimeout(() => {
    playDialog(`<div class="gacha-drop"><h2 id="play-title">A capsule rolled out!</h2>
      <button class="cap-btn" data-action="open-capsule" aria-label="Open the capsule">${capsuleSVG(CAP_COLORS[Math.floor(Math.random() * CAP_COLORS.length)], { bao: who === 'bao' })}</button>
      <p class="muted">Tap the capsule to open it ♡</p></div>`, 'gacha');
  }, calmMotion() ? 0 : 750);
}
function openCapsule() {
  const it = ui.pending; if (!it) return;
  const who = ui.pendingWho || 'yutu', ownKey = who === 'bao' ? 'baoOwned' : 'owned', friend = who === 'bao' ? 'Bao' : 'Yutu';
  ui.pending = null;
  const pl = play(), dup = (pl[ownKey] || []).includes(it.id);
  $('.cap-btn')?.classList.add('opening');
  sound(it.rarity === 3 ? 'chime' : 'sparkle');
  if (dup) savePlay({ hearts: (pl.hearts || 0) + 3 });
  else savePlay({ [ownKey]: [...(pl[ownKey] || []), it.id] });
  setTimeout(() => {
    $('#play-body').innerHTML = `<div class="gacha-reveal r${it.rarity}"><p class="reveal-stars">${RARITY[it.rarity].stars} ${RARITY[it.rarity].name}</p>
      <div class="reveal-item">${itemThumb(it, 170)}</div><h2 id="play-title">${esc(it.name)}</h2>
      <p class="muted">${dup ? `You already have this one, so ${friend} gave you 3 friendship hearts instead ♡` : `Added to ${friend}’s wardrobe!`}</p>
      <div class="reveal-actions">${dup ? '' : `<button class="btn primary" data-action="equip" data-who="${who}" data-slot="${it.slot}" data-id="${it.id}">Put it on ${friend} ♡</button>`}
      <button class="btn ghost" data-action="close-dialog">Close</button></div></div>`;
    const r = $('.reveal-item').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, ['✧', '♡', '☆', '✿'], it.rarity === 3 ? 22 : 14);
  }, calmMotion() ? 0 : 420);
}
function equip(slot, id, who = 'yutu') {
  const key = who === 'bao' ? 'baoEquipped' : 'equipped';
  const eq = { ...(play()[key] || {}) };
  eq[slot] = eq[slot] === id ? null : id;
  savePlay({ [key]: eq }); sound('sparkle');
  $('#play-dialog').open && $('#play-dialog').close();
  toast(eq[slot] ? `${who === 'bao' ? 'Bao' : 'Yutu'} is wearing the ${itemById(id).name} ♡` : 'Taken off ✧');
}
const calmMotion = () => S.settings.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- omikuji ---------- */
function drawFortune() {
  const d = todayStr(); if (play().omikuji?.[d] !== undefined) return;
  $('.omi-btn')?.classList.add('shaking'); sound('roll');
  setTimeout(() => {
    savePlay({ omikuji: { ...(play().omikuji || {}), [d]: fortuneFor(d) } });
    sound('sparkle'); toast('Fortune drawn! +1 moon ticket ✧');
  }, calmMotion() ? 0 : 900);
}

/* ---------- diary ---------- */
function openDiary(ds) {
  const e = play().diary?.[ds] || {};
  playDialog(`<form class="diary-form" onsubmit="return false"><div class="dialog-head"><h2 id="play-title">${icon('diary', 26)} ${fmtDate(ds)}</h2>
      <button type="button" class="icon-btn" data-action="close-dialog" aria-label="Close">✕</button></div>
    <fieldset class="sticker-pick"><legend class="field-label">How did today feel?</legend>
      ${STICKERS.map(k => `<label><input type="radio" name="sticker" value="${k.id}" ${e.s === k.id ? 'checked' : ''}><span title="${k.name}">${k.svg}<i>${k.name}</i></span></label>`).join('')}</fieldset>
    <label class="field"><span>A little note (only you can see it)</span><textarea name="note" maxlength="140" rows="3" placeholder="Had matcha with Yuki ♡">${esc(e.n || '')}</textarea></label>
    <div class="reveal-actions"><button type="button" class="btn primary" data-action="diary-save" data-date="${ds}">Save to diary ♡</button>
    ${e.s || e.n ? `<button type="button" class="btn ghost" data-action="diary-clear" data-date="${ds}">Clear</button>` : ''}</div></form>`, 'diary');
}
function saveDiary(ds, clear) {
  const f = $('.diary-form'), diary = { ...(play().diary || {}) };
  if (clear) delete diary[ds];
  else {
    const s = $('input[name=sticker]:checked', f)?.value || null, n = f.note.value.trim();
    if (!s && !n) delete diary[ds]; else diary[ds] = { s, n };
  }
  savePlay({ diary }); sound('page');
  $('#play-dialog').close(); toast(clear ? 'Diary page cleared' : 'Saved in your diary ♡');
}

/* ---------- Yutu's monthly letter ---------- */
function openLetter() {
  const mk = ui.month, st = monthStats(mk);
  const top = CATS.map(c => [c, st.byCat[c.id]]).sort((a, b) => b[1] - a[1])[0];
  const loggedDays = new Set(st.tx.map(t => t.date)).size;
  const html = letterHTML({ monthName: monthLabel(mk).split(' ')[0], nextMonthName: monthLabel(shiftMonth(mk, 1)).split(' ')[0], name: esc(S.settings.name || ''),
    spent: st.spent, saved: st.saved, income: st.income, budgetTotal: st.budgetTotal, topCat: top && top[1] > 0 ? top[0].label : '', bestStreak: bestStreakIn(mk), logged: loggedDays, money });
  playDialog(`<div class="dialog-head"><h2 id="play-title">${icon('envelope', 26)} A letter for ${monthLabel(mk)}</h2><button type="button" class="icon-btn" data-action="close-dialog" aria-label="Close">✕</button></div>
    <div class="envelope-wrap ${calmMotion() ? 'open' : ''}"><button class="envelope" data-action="open-letter" aria-label="Open the letter"><span class="env-flap"></span><span class="env-seal">♡</span><span class="env-hint">tap to open</span></button>${html}</div>`, 'letter');
}

/* ================= PLAN tab: bills, paycheck, wishlist, challenges, debts, safety net ================= */
const PLAN_TABS = [['bills', 'Bills', 'bills'], ['paycheck', 'Paycheck', 'purse'], ['wishlist', 'Wishlist', 'gift'], ['challenges', 'Challenges', 'calendar'], ['debts', 'Debts', 'chain'], ['safety', 'Safety net', 'shield']];
const fmtShort = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const dueText = n => n === 0 ? 'due today' : n === 1 ? 'due tomorrow' : `due in ${n} days`;
const saveList = (key, list) => fire(store.saveSettings({ [key]: list }));

function viewPlan() {
  const t = ui.planTab || 'bills';
  const body = { bills: planBills, paycheck: planPaycheck, wishlist: planWishlist, challenges: planChallenges, debts: planDebts, safety: planSafety }[t]();
  return `<section class="card" aria-labelledby="plan-title">
    <div class="card-head"><h2 id="plan-title" data-jp="計画">My money plan</h2></div>
    <div class="chips plan-chips" role="group" aria-label="Plan sections">${PLAN_TABS.map(([id, label, ic]) => `<button class="chip" data-action="plan-tab" data-t="${id}" aria-pressed="${t === id}">${icon(ic, 20)}${label}</button>`).join('')}</div>
  </section>${body}`;
}

/* ---------- bills & subscriptions ---------- */
function billRows() {
  const today = new Date();
  return (S.settings.bills || []).map(b => {
    const due = nextDue(b, today), n = daysUntil(due, today), key = cycleKey(b, due);
    const trialLeft = b.trialEnds ? daysUntil(new Date(b.trialEnds + 'T12:00:00'), today) : null;
    return { b, due, n, paid: (b.paid || []).includes(key), key, trialLeft };
  }).sort((x, y) => x.due - y.due);
}
function planBills() {
  const rows = billRows(), monthly = sum(S.settings.bills || [], b => monthlyCost(b));
  return `<section class="card" aria-labelledby="bills-title">
    <div class="card-head"><h2 id="bills-title" data-jp="請求">Bills & subscriptions</h2><span class="tiny">About <b>${money(monthly)}</b> a month</span></div>
    ${rows.length ? `<ul class="tx-list">${rows.map(({ b, due, n, paid, trialLeft }) => `<li class="tx bill ${paid ? 'paid' : n <= 3 ? 'soon' : ''}">
      <span class="ico" aria-hidden="true">${icon(b.cat || 'bills', 28)}</span>
      <div><div class="what">${esc(b.name)} ${trialLeft !== null && trialLeft >= 0 ? `<span class="pill trial">trial ends ${trialLeft === 0 ? 'today' : `in ${trialLeft}d`}</span>` : ''}</div>
        <div class="sub">${b.freq} · ${paid ? 'paid for this cycle ✓' : `${dueText(n)} (${fmtShort(due)})`}</div></div>
      <span class="amt">${money(+b.amount)}</span>
      <span class="bill-actions">${paid ? '' : `<button class="btn small primary" data-action="bill-paid" data-id="${b.id}">Paid ♡</button>`}
      <button class="icon-btn del" data-action="bill-del" data-id="${b.id}" aria-label="Remove ${esc(b.name)}">${icon('trash', 20)}</button></span></li>`).join('')}</ul>`
      : `<p class="muted">Add your rent, phone, streaming and other regular bills. Yutu will remind you before they’re due, and before free trials turn into paid ones.</p>`}
    <h3 style="margin-top:16px">Add a bill ✧</h3>
    <form id="bill-form" class="form-grid" autocomplete="off">
      <label class="field"><span>Name</span><input name="name" required maxlength="40" placeholder="Spotify"></label>
      <label class="field"><span>Amount</span><input name="amount" required inputmode="decimal" placeholder="11.99"></label>
      <label class="field"><span>How often</span><select name="freq"><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="weekly">Weekly</option></select></label>
      <label class="field"><span>Next due date</span><input name="due" type="date" required value="${todayStr()}"></label>
      <label class="field"><span>Category</span><select name="cat">${CATS.map(c => `<option value="${c.id}" ${c.id === 'bills' ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
      <label class="field"><span>Free trial ends (optional)</span><input name="trial" type="date"></label>
      <button class="btn jade" type="submit">Add bill</button>
    </form>
  </section>`;
}

/* ---------- paycheck planner ---------- */
function planPaycheck() {
  const sp = { needs: 50, wants: 30, save: 20, pay: '', ...(S.settings.split || {}) }, pay = +sp.pay || 0;
  const jar = (k, label, ic, color) => `<div class="split-jar" style="--jar:${color}"><div class="sj-top">${icon(ic, 26)}<b>${label}</b></div>
    <div class="sj-pct"><output data-out="${k}">${sp[k]}</output>%</div><div class="sj-amt" data-amt="${k}">${pay ? money(pay * sp[k] / 100) : '—'}</div></div>`;
  return `<section class="card" aria-labelledby="pay-title">
    <div class="card-head"><h2 id="pay-title" data-jp="給料">Paycheck planner</h2></div>
    <form id="split-form" autocomplete="off">
      <label class="field"><span>A typical paycheck</span><input name="pay" inputmode="decimal" value="${esc(sp.pay)}" placeholder="800"></label>
      <div class="split-jars">${jar('needs', 'Needs', 'house', '#d6f0ff')}${jar('wants', 'Wants', 'dango', '#ffe0ee')}${jar('save', 'Savings', 'coin', '#fff2c4')}</div>
      <label class="field"><span>Needs (rent, food, bills, transport)</span><input type="range" name="needs" min="0" max="100" step="5" value="${sp.needs}"></label>
      <label class="field"><span>Wants (fun, treats, shopping)</span><input type="range" name="wants" min="0" max="100" step="5" value="${sp.wants}"></label>
      <p class="tiny">Savings gets whatever is left over, so the three always add up to 100%.</p>
      <div class="chips">${[[50, 30], [60, 20], [70, 20]].map(([n, w]) => `<button type="button" class="chip" data-action="split-preset" data-n="${n}" data-w="${w}">${n}/${w}/${100 - n - w}</button>`).join('')}</div>
      <button class="btn primary" type="submit">Save my plan ♡</button>
      <p class="muted" style="margin-top:10px">When you log income, Yutu will offer to send your ${sp.save}% straight to Bao’s hoard.</p>
    </form>
  </section>`;
}

/* ---------- wishlist with a 48-hour cool-down ---------- */
const COOL_MS = 48 * 3600 * 1000;
function planWishlist() {
  const list = S.settings.wishes || [], now = Date.now();
  return `<section class="card" aria-labelledby="wish-title">
    <div class="card-head"><h2 id="wish-title" data-jp="欲しい">Wishlist cool-down</h2></div>
    <p class="muted">Want something? Put it here and wait 48 hours. If you still love it, go for it. If not, Bao gets the money ♡</p>
    ${list.length ? `<div class="wish-grid">${list.map(w => {
      const left = Math.max(0, +new Date(w.added) + COOL_MS - now), pct = 100 - (left / COOL_MS) * 100, h = Math.ceil(left / 3600000);
      return `<div class="wish ${left ? '' : 'ready'}"><div class="wish-ring" style="--p:${pct}">${icon(left ? 'hourglass' : 'gift', 30)}</div>
        <div><b>${esc(w.name)}</b><div class="tiny">${money(+w.price)} · ${left ? `ready in ${h} ${h === 1 ? 'hour' : 'hours'}` : 'cool-down finished ✧'}</div></div>
        ${left ? `<button class="icon-btn del" data-action="wish-del" data-id="${w.id}" aria-label="Remove ${esc(w.name)}">${icon('trash', 20)}</button>`
        : `<div class="wish-actions"><button class="btn small jade" data-action="wish-skip" data-id="${w.id}">Skip it · Bao gets ${money(+w.price, true)}</button><button class="btn small ghost" data-action="wish-buy" data-id="${w.id}">I still want it</button></div>`}</div>`;
    }).join('')}</div>` : ''}
    <form id="wish-form" class="form-row" autocomplete="off" style="margin-top:12px">
      <label class="field"><span>What do you want?</span><input name="name" required maxlength="40" placeholder="Cute desk lamp"></label>
      <label class="field"><span>Price</span><input name="price" required inputmode="decimal" placeholder="34"></label>
      <button class="btn jade" type="submit" style="margin-bottom:10px">Start cool-down</button>
    </form>
  </section>`;
}

/* ---------- savings challenges ---------- */
function weekendsBack(n = 8) {
  const out = [], byDay = spendByDay(), first = S.transactions.map(t => t.date).sort()[0];
  const d = new Date(); d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7));   // most recent Saturday (today if Saturday)
  for (let i = 0; i < n; i++) {
    const sat = new Date(d), sun = new Date(d); sun.setDate(sun.getDate() + 1);
    const a = dateStr(sat), b = dateStr(sun), future = b > todayStr() && a > todayStr();
    out.push({ label: fmtShort(sat), status: future || !first || a < first ? 'none' : (byDay.get(a) || byDay.get(b)) ? 'spent' : b > todayStr() ? 'going' : 'won' });
    d.setDate(d.getDate() - 7);
  }
  return out;
}
function planChallenges() {
  const ch = S.settings.challenges || {}, done = ch.wk52 || [];
  const mk = monthKey(new Date()), rounds = sum(txInMonth(mk).filter(t => t.type === 'expense'), t => roundUp(t.amount));
  const moved = (ch.roundups || {})[mk];
  const wk = weekendsBack();
  return `<section class="card" aria-labelledby="w52-title">
    <div class="card-head"><h2 id="w52-title" data-jp="52週">52-week challenge</h2><span class="tiny">${money(sum(done, n => n), true)} of ${money(1378, true)} saved</span></div>
    <p class="muted">Week 1, save $1. Week 2, save $2… by week 52 you’ll have $1,378! Tap a bubble when you’ve saved it and the coins go to Bao.</p>
    <div class="w52">${Array.from({ length: 52 }, (_, i) => i + 1).map(n => `<button class="w52-b ${done.includes(n) ? 'on' : ''}" data-action="w52" data-n="${n}" aria-pressed="${done.includes(n)}" aria-label="Week ${n}, save $${n}">${n}</button>`).join('')}</div>
  </section>
  <div class="grid-2">
    <section class="card" aria-labelledby="nsw-title">
      <div class="card-head"><h2 id="nsw-title" data-jp="週末">No-spend weekends</h2></div>
      <p class="muted">Weekends with no spending get a sticker automatically ✿</p>
      <div class="weekends">${wk.map(w => `<div class="wkd ${w.status}"><span class="wkd-ic">${w.status === 'won' ? icon('mooncake', 30) : w.status === 'going' ? icon('hourglass', 26) : w.status === 'spent' ? '·' : ''}</span><span class="tiny">${w.label}</span></div>`).join('')}</div>
    </section>
    <section class="card" aria-labelledby="ru-title">
      <div class="card-head"><h2 id="ru-title" data-jp="端数">Round-ups</h2></div>
      <p class="muted">If every purchase this month were rounded up to the next dollar, the spare change would be:</p>
      <p class="big-num">${money(rounds)}</p>
      ${moved ? `<p class="tiny">You moved ${money(moved)} to Bao this month ✓</p>` : rounds > 0 ? `<button class="btn primary" data-action="roundup" data-amt="${rounds}">Send ${money(rounds)} to Bao ♡</button>` : ''}
    </section>
  </div>`;
}

/* ---------- debt payoff ---------- */
function planDebts() {
  const debts = S.settings.debts || [], extra = +(ui.debtExtra ?? 50), method = ui.debtMethod || 'avalanche';
  const base = payoffPlan(debts, 0, method), plan = payoffPlan(debts, extra, method);
  const when = m => { if (!isFinite(m)) return 'never (the payment doesn’t cover interest)'; const d = new Date(); d.setMonth(d.getMonth() + m); return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); };
  const total = sum(debts, d => +d.balance);
  return `<section class="card" aria-labelledby="debt-title">
    <div class="card-head"><h2 id="debt-title" data-jp="返済">Debt payoff planner</h2>${total ? `<span class="tiny">Total ${money(total)}</span>` : ''}</div>
    ${debts.length ? `<ul class="tx-list">${debts.map(d => { const one = payoff(d.balance, d.apr, +d.min); return `<li class="tx"><span class="ico">${icon('chain', 26)}</span>
      <div><div class="what">${esc(d.name)}</div><div class="sub">${money(+d.balance)} · ${+d.apr || 0}% APR · ${money(+d.min)} a month</div>
        <div class="sub">${isFinite(one.months) ? `${one.months} months on minimums alone` : 'the minimum doesn’t cover the interest!'}</div></div>
      <button class="icon-btn del" data-action="debt-del" data-id="${d.id}" aria-label="Remove ${esc(d.name)}">${icon('trash', 20)}</button></li>`; }).join('')}</ul>
    <div class="debt-sim">
      <label class="field"><span>Extra I can pay each month: <b>${money(extra, true)}</b></span><input type="range" min="0" max="500" step="10" value="${extra}" data-action-input="debt-extra" aria-label="Extra monthly payment"></label>
      <div class="chips"><button class="chip" data-action="debt-method" data-m="avalanche" aria-pressed="${method === 'avalanche'}">Avalanche (highest interest first)</button><button class="chip" data-action="debt-method" data-m="snowball" aria-pressed="${method === 'snowball'}">Snowball (smallest balance first)</button></div>
      <div class="debt-compare">
        <div><span class="tiny">Minimums only</span><b>${when(base.months)}</b><span class="tiny">${isFinite(base.interest) ? `${money(base.interest)} interest` : ''}</span></div>
        <div class="better"><span class="tiny">With ${money(extra, true)} extra</span><b>${when(plan.months)}</b><span class="tiny">${isFinite(plan.interest) ? `${money(plan.interest)} interest` : ''}</span></div>
      </div>
      ${isFinite(base.interest) && isFinite(plan.interest) && base.interest - plan.interest > 1 ? `<p class="bubble left" style="margin-top:12px">Paying ${money(extra, true)} extra saves you <b>${money(base.interest - plan.interest)}</b> in interest and ${base.months - plan.months} months! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧</p>` : ''}
      <p class="tiny">This is just math, not financial advice ♡ Real interest can differ a little from month to month.</p>
    </div>` : `<p class="muted">Add a credit card, student loan or other debt to see when you’ll be debt-free and how much extra payments save.</p>`}
    <h3 style="margin-top:16px">Add a debt</h3>
    <form id="debt-form" class="form-grid" autocomplete="off">
      <label class="field"><span>Name</span><input name="name" required maxlength="40" placeholder="Credit card"></label>
      <label class="field"><span>Balance</span><input name="balance" required inputmode="decimal" placeholder="1200"></label>
      <label class="field"><span>Interest rate (APR %)</span><input name="apr" inputmode="decimal" placeholder="24.9"></label>
      <label class="field"><span>Minimum payment</span><input name="min" required inputmode="decimal" placeholder="35"></label>
      <button class="btn jade" type="submit">Add debt</button>
    </form>
  </section>`;
}

/* ---------- emergency fund (safety net) ---------- */
function avgMonthlySpend() {
  const now = monthKey(new Date()), months = [1, 2, 3].map(i => shiftMonth(now, -i)).filter(m => txInMonth(m).length);
  if (months.length) return sum(months, m => monthStats(m).spent) / months.length;
  return monthStats(now).budgetTotal || monthStats(now).spent;
}
function planSafety() {
  const ef = { months: 3, ...(S.settings.efund || {}) }, avg = avgMonthlySpend(), target = Math.round(avg * ef.months);
  const g = S.goals.find(x => x.isEmergency), saved = g ? goalSaved(g.id) : 0, frac = target ? Math.min(1, saved / target) : 0;
  return `<section class="card" aria-labelledby="safe-title">
    <div class="card-head"><h2 id="safe-title" data-jp="備え">Safety net</h2></div>
    <div class="safety">
      <div class="safety-moon">${moonSVG(frac, { size: 150, label: `Emergency fund ${Math.round(frac * 100)}% full` })}<b>${Math.round(frac * 100)}% full</b></div>
      <div>
        <p>An emergency fund is money set aside for surprises, like a broken phone or a month with fewer work hours. A good goal is <b>1 to 3 months</b> of your usual spending.</p>
        <p class="muted">You usually spend about <b>${money(avg)}</b> a month, so ${ef.months} ${ef.months === 1 ? 'month' : 'months'} would be <b>${money(target)}</b>.</p>
        <div class="chips">${[1, 2, 3, 6].map(m => `<button class="chip" data-action="ef-months" data-m="${m}" aria-pressed="${ef.months === m}">${m} ${m === 1 ? 'month' : 'months'}</button>`).join('')}</div>
        ${g ? `<p>${money(saved)} saved of ${money(target)}${saved >= target ? ' · your safety net is ready! ✧' : ` · ${money(target - saved)} to go`}</p>
          <button class="btn primary" data-action="open-add" data-type="saving" data-goal="${g.id}">${icon('coin', 20)} Add to my safety net</button>`
        : `<button class="btn primary" data-action="ef-start" ${target ? '' : 'aria-disabled="true"'}>${icon('shield', 22)} Start my safety net</button>${target ? '' : '<p class="tiny">Log a little spending or set budgets first so Yutu knows your usual month.</p>'}`}
      </div>
    </div>
  </section>`;
}

/* ---------- Yutu's reminders on Home ---------- */
function remindersHTML() {
  const notes = [];
  billRows().forEach(({ b, n, paid, trialLeft }) => {
    if (trialLeft !== null && trialLeft >= 0 && trialLeft <= 3) notes.push(`${icon('hourglass', 20)}<span>Your <b>${esc(b.name)}</b> free trial ends ${trialLeft === 0 ? 'today' : `in ${trialLeft} ${trialLeft === 1 ? 'day' : 'days'}`}. Cancel if you don’t need it!</span>`);
    else if (!paid && n <= 3) notes.push(`${icon(b.cat || 'bills', 20)}<span><b>${esc(b.name)}</b> (${money(+b.amount)}) is ${dueText(n)}.</span>`);
  });
  (S.settings.wishes || []).forEach(w => { if (Date.now() - +new Date(w.added) >= COOL_MS) notes.push(`${icon('gift', 20)}<span>Your <b>${esc(w.name)}</b> cool-down is over. Still want it?</span>`); });
  if (!notes.length) return '';
  return `<ul class="reminders" aria-label="Reminders from Yutu">${notes.slice(0, 3).map(n => `<li>${n}</li>`).join('')}</ul>`;
}

/* ---------- insights + 6-month trend (Spending tab) ---------- */
function insightsHTML() {
  const mk = ui.month, list = insights({ thisMonth: monthStats(mk), lastMonth: monthStats(shiftMonth(mk, -1)), cats: CATS, txThisMonth: txInMonth(mk), money });
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(mk, i - 5)), stats = months.map(m => monthStats(m));
  const max = Math.max(1, ...stats.map(s => Math.max(s.spent, s.saved)));
  return `<section class="card" aria-labelledby="ins-title">
    <div class="card-head"><h2 id="ins-title" data-jp="気づき">Yutu’s notes</h2></div>
    ${list.length ? `<ul class="insights">${list.map(x => `<li class="${x.mood}">${icon(x.icon, 24)}<span>${x.text}</span></li>`).join('')}</ul>` : `<p class="muted">Log a few more days and Yutu will start noticing patterns ✧</p>`}
    <h3 style="margin-top:14px">Last 6 months</h3>
    <div class="trend" role="img" aria-label="Spending and saving for the last 6 months: ${months.map((m, i) => `${monthLabel(m)}: spent ${money(stats[i].spent, true)}, saved ${money(stats[i].saved, true)}`).join('; ')}">
      ${months.map((m, i) => `<div class="tr-col" data-tip="${esc(`${monthLabel(m)}: spent ${money(stats[i].spent)} · saved ${money(stats[i].saved)}`)}" tabindex="0">
        <div class="tr-bars"><span class="tr-spent" style="height:${(stats[i].spent / max) * 100}%"></span><span class="tr-saved" style="height:${(stats[i].saved / max) * 100}%"></span></div>
        <span class="tr-label">${monthLabel(m).slice(0, 3)}</span></div>`).join('')}
    </div>
    <div class="tr-legend"><span><i class="tr-spent"></i>Spent</span><span><i class="tr-saved"></i>Saved</span></div>
  </section>`;
}

/* ---------- bank CSV import (History tab) ---------- */
function openImport() {
  ui.csv = null;
  playDialog(`<div class="dialog-head"><h2 id="play-title">${icon('upload', 26)} Import from your bank</h2><button type="button" class="icon-btn" data-action="close-dialog" aria-label="Close">✕</button></div>
    <p class="muted">Download your transactions from your bank’s website as a <b>CSV</b> file, then choose it here. It stays on your device until you press Import.</p>
    <label class="btn primary file-btn">${icon('upload', 20)} Choose CSV file<input type="file" accept=".csv,text/csv,text/plain" id="csv-file" hidden></label>
    <div id="csv-area"></div>`, 'import');
}
function renderImport() {
  const c = ui.csv; if (!c) return;
  const head = c.cols.hasHeader ? c.rows[0] : c.rows[0].map((_, i) => `Column ${i + 1}`);
  const sel = (name, val, optional) => `<select data-csv="${name}">${optional ? `<option value="-1">(none)</option>` : ''}${head.map((h, i) => `<option value="${i}" ${val === i ? 'selected' : ''}>${esc(h || `Column ${i + 1}`)}</option>`).join('')}</select>`;
  const existing = new Set(S.transactions.map(t => `${t.date}|${(+t.amount).toFixed(2)}|${(t.note || '').slice(0, 20)}`));
  c.entries = rowsToEntries(c.rows, c.cols, { negativeIsSpending: c.neg }).map(e => ({ ...e, dup: existing.has(`${e.date}|${e.amount.toFixed(2)}|${e.note.slice(0, 20)}`), category: e.type === 'expense' ? (c.cats?.[e.key] || e.category) : null, on: c.on?.[e.key] ?? !existing.has(`${e.date}|${e.amount.toFixed(2)}|${e.note.slice(0, 20)}`) }));
  const n = c.entries.filter(e => e.on).length;
  $('#csv-area').innerHTML = `<div class="csv-map">
      <label class="field"><span>Date column</span>${sel('date', c.cols.date)}</label>
      <label class="field"><span>Description column</span>${sel('desc', c.cols.desc)}</label>
      ${c.cols.amount !== -1 ? `<label class="field"><span>Amount column</span>${sel('amount', c.cols.amount)}</label>` : `<label class="field"><span>Money out column</span>${sel('debit', c.cols.debit, true)}</label><label class="field"><span>Money in column</span>${sel('credit', c.cols.credit, true)}</label>`}
      ${c.cols.amount !== -1 ? `<label class="toggle"><span>Negative numbers are spending</span><input type="checkbox" data-csv="neg" ${c.neg ? 'checked' : ''}></label>` : ''}
    </div>
    <p class="tiny">${c.entries.length} entries found${c.entries.some(e => e.dup) ? ' · ones that look already imported are unticked' : ''}. Check the categories, then import.</p>
    <div class="csv-table scroll"><table><thead><tr><th>Add</th><th>Date</th><th>Description</th><th>Amount</th><th>Type</th><th>Category</th></tr></thead><tbody>
    ${c.entries.slice(0, 200).map(e => `<tr class="${e.dup ? 'dup' : ''}"><td><input type="checkbox" data-row="${e.key}" ${e.on ? 'checked' : ''} aria-label="Import ${esc(e.note)}"></td><td>${fmtShort(new Date(e.date + 'T12:00:00'))}</td><td>${esc(e.note)}</td><td class="num">${money(e.amount)}</td>
      <td><select data-rtype="${e.key}"><option value="expense" ${e.type === 'expense' ? 'selected' : ''}>Spent</option><option value="income" ${e.type === 'income' ? 'selected' : ''}>Earned</option></select></td>
      <td>${e.type === 'expense' ? `<select data-rcat="${e.key}">${CATS.map(k => `<option value="${k.id}" ${k.id === e.category ? 'selected' : ''}>${k.label}</option>`).join('')}</select>` : '—'}</td></tr>`).join('')}
    </tbody></table></div>
    <button class="btn primary big" data-action="csv-import" ${n ? '' : 'aria-disabled="true"'}>Import ${n} ${n === 1 ? 'entry' : 'entries'} ✧</button>`;
}
async function doImport() {
  const c = ui.csv; if (!c) return;
  const picks = c.entries.filter(e => e.on);
  if (!picks.length) return;
  for (const e of picks) {
    await fire(store.addTx({ id: uid(), type: e.type, amount: e.amount, note: e.note, date: e.date, createdAt: new Date().toISOString(), ...(e.type === 'expense' ? { category: e.category || 'other' } : {}) }));
  }
  ui.csv = null; $('#play-dialog').close(); sound('chime');
  toast(`Imported ${picks.length} ${picks.length === 1 ? 'entry' : 'entries'} from your bank ✧`);
}

function updateSplit(f, moved) {
  let n = +f.needs.value, w = +f.wants.value;
  if (n + w > 100) { if (moved === 'wants') n = 100 - w; else w = 100 - n; f.needs.value = n; f.wants.value = w; }
  const vals = { needs: n, wants: w, save: 100 - n - w }, pay = parseAmount(f.pay.value) || 0;
  Object.entries(vals).forEach(([k, v]) => { f.querySelector(`[data-out=${k}]`).textContent = v; f.querySelector(`[data-amt=${k}]`).textContent = pay ? money(pay * v / 100) : '—'; });
}
// when the user flips a row between spent/earned, flip the sign in the raw row so re-parsing keeps it
function flipRow(c, en, type) {
  const row = [...c.rows[(c.cols.hasHeader ? 1 : 0) + en.key]];
  const want = type === 'expense' ? (c.neg ? -1 : 1) : (c.neg ? 1 : -1);
  if (c.cols.amount !== -1) row[c.cols.amount] = String(want * en.amount);
  else if (c.cols.debit !== -1 && c.cols.credit !== -1) { row[c.cols.debit] = type === 'expense' ? String(en.amount) : ''; row[c.cols.credit] = type === 'income' ? String(en.amount) : ''; }
  return row;
}
/* ---------- manga ink pass ----------
   Every drawing the app adds (gacha machine, capsules, prizes, omikuji, plants, stickers,
   letters…) is recoloured into the site palette and given the hand-drawn pen wobble.
   Icons, the moon, the spending chart and Yutu's symbols are drawn that way already. */
const SKIP_INK = '.ic, .moon, .donut, .manga-sym, .hh, .qv, [data-no-ink]'; // .qv: Quiver accessory pictures keep their own colours
const HEX = /#[0-9a-fA-F]{6}\b/g;
function inkSVG(svg) {
  if (svg.dataset.inked || svg.matches(SKIP_INK) || svg.closest('.manga-sym')) return;
  svg.dataset.inked = '1';
  svg.querySelectorAll('[fill], [stroke], [stop-color], [style]').forEach(el => {
    for (const a of ['fill', 'stroke', 'stop-color']) { const v = el.getAttribute(a); if (v && HEX.test(v)) el.setAttribute(a, v.replace(HEX, mute)); HEX.lastIndex = 0; }
    const st = el.getAttribute('style'); if (st && HEX.test(st)) el.setAttribute('style', st.replace(HEX, mute)); HEX.lastIndex = 0;
  });
  const vb = svg.viewBox?.baseVal;
  svg.classList.add(vb && vb.width >= 100 ? 'inked-lg' : 'inked');
}
const inkAll = root => root.querySelectorAll?.('svg').forEach(inkSVG);
new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(n => {
  if (n.nodeType !== 1) return;
  if (n.tagName === 'svg') inkSVG(n); else inkAll(n);
}))).observe(document.body, { childList: true, subtree: true });
inkAll(document.body);

/* ---------- History ---------- */
function viewHistory() {
  const filters = [['all', 'All'], ['expense', 'Spent'], ['income', 'Earned'], ['saving', 'Saved']];
  const tx = txInMonth(ui.month).filter(t => ui.histFilter === 'all' || t.type === ui.histFilter)
    .sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')));
  const groups = {};
  tx.forEach(t => (groups[t.date] ||= []).push(t));
  return `<section class="card" aria-labelledby="hist-title">
    <div class="card-head"><h2 id="hist-title" data-jp="記録">History · ${monthLabel(ui.month)}</h2><span class="head-btns"><button class="btn small primary" data-action="scan-receipt">${icon('bills', 18)} Scan receipt</button><button class="btn small primary" data-action="open-import">${icon('upload', 18)} Import from bank</button><button class="btn small ghost" data-action="export">${icon('download', 18)} Export CSV</button></span></div>
    <div class="chips" role="group" aria-label="Filter">${filters.map(([k, l]) => `<button class="chip" data-action="hist-filter" data-f="${k}" aria-pressed="${ui.histFilter === k}">${l}</button>`).join('')}</div>
    ${tx.length ? Object.entries(groups).map(([d, list]) => `
      <div class="day-head"><span>${fmtDate(d)} ${(() => { const e = play().diary?.[d], k = e && stickerById(e.s); return k ? `<span class="day-sticker">${k.svg}</span>${e.n ? `<i class="day-note">“${esc(e.n)}”</i>` : ''}` : ''; })()}</span><span>${sum(list.filter(t => t.type === 'expense')) ? '−' + money(sum(list.filter(t => t.type === 'expense'))) : ''}</span></div>
      <ul class="tx-list">${list.map(txHTML).join('')}</ul>`).join('') : emptyHTML('Nothing here for this month.')}
  </section>`;
}

/* ---------- Settings ---------- */
function viewSettings() {
  const st = S.settings;
  const cloud = store?.mode === 'cloud';
  return `<section class="card" aria-labelledby="set-title">
    <h2 id="set-title" data-jp="設定">Settings</h2>
    <form id="settings-form" autocomplete="off">
      <label class="field"><span>What should Yutu call you?</span><input name="name" maxlength="30" value="${esc(st.name)}" placeholder="Your name"></label>
      <label class="field"><span>Currency</span><select name="currency">${CURRENCIES.map(c => `<option ${c === st.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="field"><span>Monthly savings target (fills the moon ☾)</span><input name="savingsTarget" inputmode="decimal" value="${esc(st.savingsTarget)}"></label>
      <fieldset class="palette"><legend>Color palette ♡</legend>
        ${THEMES.map(t => `<label><input type="radio" name="theme" value="${t.id}" ${(st.theme || 'sakura') === t.id ? 'checked' : ''}><span class="pal" style="--a:${t.a};--b:${t.b}"><i></i>${t.name}</span></label>`).join('')}
      </fieldset>
      <label class="toggle"><span>Soft sounds ♪</span><input type="checkbox" name="sound" ${st.sound !== false ? 'checked' : ''}></label>
      <label class="toggle"><span>Sparkles when I tap ✧</span><input type="checkbox" name="sparkles" ${st.sparkles !== false ? 'checked' : ''}></label>
      <label class="toggle"><span>Reduce motion (calmer animations)</span><input type="checkbox" name="reduceMotion" ${st.reduceMotion ? 'checked' : ''}></label>
      <button class="btn primary" type="submit">Save settings</button>
    </form>
  </section>
  <section class="card">
    <h2>Your data</h2>
    <p class="muted">${cloud ? `Synced to your account${ui.user?.email ? ` (<b>${esc(ui.user.email)}</b>)` : ''}. Only you can read it.` : 'Demo mode: saved only in this browser. Connect Firebase (see README) to sync between your phone and laptop.'}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn ghost" data-action="export">${icon('download', 18)} Export all as CSV</button>
      ${cloud ? '<button class="btn danger" data-action="sign-out">Sign out</button>' : ''}
    </div>
  </section>`;
}

/* ---------- Auth screen ---------- */
function renderAuth() {
  const up = ui.authMode === 'signup';
  $('#auth').innerHTML = `<div class="card">
    ${rabbitSVG('happy')}
    <h1>Moonbun Money</h1>
    <p class="muted">Yutu and Bao are guarding your coins. ${up ? 'Make an account to get started!' : 'Welcome back!'}</p>
    <form id="auth-form">
      <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
      <label class="field"><span>Password</span><input name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="6" required></label>
      <p class="err" role="alert">${esc(ui.authMsg)}</p>
      <button class="btn primary big" type="submit">${up ? 'Create account ✿' : 'Sign in ☾'}</button>
    </form>
    <div class="divider">or</div>
    <button class="btn ghost big" data-action="google">Continue with Google</button>
    <p style="margin-top:12px">
      <button class="linkish" data-action="auth-toggle">${up ? 'I already have an account' : 'New here? Create an account'}</button>
      ${up ? '' : '<button class="linkish" data-action="reset-pw">Forgot password?</button>'}
    </p>
  </div>`;
}
const AUTH_ERRORS = {
  'auth/invalid-credential': 'That email or password doesn’t match. Try again?',
  'auth/wrong-password': 'That password isn’t right.',
  'auth/user-not-found': 'No account with that email yet. Create one?',
  'auth/email-already-in-use': 'That email already has an account. Sign in instead!',
  'auth/weak-password': 'Password needs at least 6 characters.',
  'auth/invalid-email': 'That email looks a little off.',
  'auth/popup-closed-by-user': 'The Google window was closed.',
  'auth/unauthorized-domain': 'This website isn’t on Firebase’s authorized domains yet (see README step 4).',
  'auth/too-many-requests': 'Too many tries. Take a breather and try again soon.',
};
const authErr = e => AUTH_ERRORS[e?.code] || 'Something went wrong. Please try again.';

/* ================= interactions ================= */
function toast(msg, undo) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button" id="undo-btn">Undo</button>' : ''}`;
  t.classList.add('show');
  if (undo) $('#undo-btn').onclick = () => { undo(); t.classList.remove('show'); };
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), undo ? 6000 : 3000);
}

function burst(x, y, chars = ['✧', '♡', '☆', '✿'], n = 14) {
  if (S.settings.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'burst';
    s.textContent = chars[i % chars.length];
    const a = (Math.PI * 2 * i) / n, d = (n < 10 ? 26 : 60) + Math.random() * (n < 10 ? 30 : 60);
    s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;--rot:${Math.random() * 360}deg`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 950);
  }
}

function setTab(tab) {
  ui.tab = tab;
  render();
  $('#view').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: S.settings.reduceMotion ? 'auto' : 'smooth' });
}

/* ---------- receipt scanner (camera + Claude, see scanner.js and functions/index.js) ---------- */
function startScan() {
  if ($('#add-dialog').open) $('#add-dialog').close();
  if (!store.scanReceipt) { toast('The receipt scanner needs the app to be signed in ✧'); return; }
  openScanner({
    cats: CATS, icon, money, esc, toast, today: todayStr, compress: compressImage,
    scan: (image, type) => store.scanReceipt(image, type),
    save: async txs => {
      for (const t of txs) await fire(store.addTx({ id: uid(), type: 'expense', createdAt: new Date().toISOString(), ...t }));
      ui.month = (txs[0]?.date || todayStr()).slice(0, 7);
      toast(txs.length === 1 ? `Logged ${money(txs[0].amount)} from your receipt ♡` : `Logged ${txs.length} items from your receipt ♡`);
      yutuReact('expense', { soft: true });
    },
  });
}

/* ---------- add dialog ---------- */
function openAdd(type = 'expense', goalId = '') {
  const f = $('#add-form');
  f.reset();
  f.date.value = todayStr();
  $(`input[name=type][value=${type}]`, f).checked = true;
  f.dataset.type = type;
  $('#amount-err').textContent = '';
  $('#cat-chips').innerHTML = CATS.map((c, i) => `<button type="button" class="chip" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-cat="${c.id}" style="--swatch:${catColor(c.id)}">${icon(c.id, 20)}${c.label}</button>`).join('');
  $('#goal-select').innerHTML = `<option value="">General savings</option>` + S.goals.map(g => `<option value="${esc(g.id)}" ${g.id === goalId ? 'selected' : ''}>${esc(g.name)}</option>`).join('');
  ui.receipt = null; const pv = $('.receipt-preview', f); if (pv) { pv.hidden = true; pv.removeAttribute('src'); }
  $('#add-dialog').showModal();
  setTimeout(() => f.amount.focus(), 30);
}

async function submitAdd(e) {
  e.preventDefault();
  const f = e.target;
  const amount = Math.round(parseFloat(String(f.amount.value).replace(/[^0-9.,-]/g, '').replace(',', '.')) * 100) / 100;
  if (!(amount > 0)) { $('#amount-err').textContent = 'Please enter an amount above zero (・x・)'; f.amount.focus(); return; }
  const type = $('input[name=type]:checked', f).value;
  const t = {
    id: uid(), type, amount, note: f.note.value.trim(), date: f.date.value || todayStr(), createdAt: new Date().toISOString(),
    ...(type === 'expense' ? { category: $('#cat-chips [aria-checked=true]')?.dataset.cat || 'other' } : {}),
    ...(type === 'saving' ? { goalId: f.goalId.value } : {}),
    ...(ui.receipt ? { receipt: ui.receipt } : {}),
  };
  ui.receipt = null;
  const btn = $('button[type=submit]', f).getBoundingClientRect();
  $('#add-dialog').close();
  await fire(store.addTx(t));

  // mascot reactions
  const mk = t.date.slice(0, 7);
  ui.month = mk;
  const target = +S.settings.savingsTarget || 0;
  let line, mood;
  if (type === 'income') { const sv = +(S.settings.split?.save ?? 20); line = `Ooh, ${money(amount)} coming in! ♪ Your plan says ${money(amount * sv / 100)} (${sv}%) to savings.`; mood = 'happy'; }
  else if (type === 'saving') {
    const st = monthStats(mk);
    mood = target && st.saved >= target ? 'party' : 'happy';
    line = mood === 'party' ? 'FULL MOON!! Savings target reached! ٩(◕‿◕)۶' : `${money(amount)} into the mortar! Pound, pound ☾`;
  } else {
    const c = catById(t.category);
    const st = monthStats(mk);
    const lim = +S.settings.budgets?.[c.id] || 0;
    if (lim && st.byCat[c.id] > lim) { mood = 'worried'; line = `Eep, ${c.label} is over budget by ${money(st.byCat[c.id] - lim)} (｡•́︿•̀｡)`; }
    else if (c.id === 'food' && /coffee|boba|latte|tea/i.test(t.note)) { mood = 'calm'; line = 'A little treat? No judgment from me ♡'; }
    else { mood = 'calm'; line = `Logged ${money(amount)} for ${c.label} ✧ ${lim ? `${money(Math.max(0, lim - st.byCat[c.id]))} left for ${c.label}.` : ''}`; }
  }
  const g = S.goals.find(x => x.id === t.goalId);
  const dragonLine = g && +g.target && goalSaved(g.id) >= +g.target
    ? `ROAR of joy! “${g.name}” is complete! ٩(◕‿◕)۶`
    : pick(['Nom nom! ', 'Ooh, shiny! ', 'Mine, mine, all mine! '], t.id) + `${money(amount)} added to ${g ? `“${g.name}”` : 'the hoard'} ✧`;
  const kind = type === 'income' ? 'income' : type === 'saving' ? (mood === 'party' ? 'party' : 'saving') : (mood === 'worried' ? 'over' : 'expense');
  ui.reaction = { at: Date.now(), mood, line, dragonLine, kind, chomp: type === 'saving' };
  if (type === 'saving' && ui.tab !== 'hoard' && ui.tab !== 'home') ui.tab = 'hoard';
  else if (ui.tab === 'settings') ui.tab = 'home';
  render();
  burst(btn.left + btn.width / 2, Math.min(btn.top, innerHeight - 200), type === 'expense' ? ['✧', '♡', '☆'] : ['✧', '☆', '♡', '✿']);
  sound(type === 'expense' ? (mood === 'worried' ? 'oops' : 'pop') : type === 'income' ? 'coin' : mood === 'party' ? 'chime' : 'coin');
  toast(type === 'expense' ? 'Spending logged ✧' : type === 'income' ? 'Income logged ♪' : 'Saved! Bao is happy ♡');
  const at = ui.reaction.at;
  setTimeout(() => { if (ui.reaction?.at === at) ui.reaction = null; }, 7000);
}

/* ---------- export ---------- */
function exportCSV() {
  const rows = [['date', 'type', 'amount', 'category', 'goal', 'note']];
  [...S.transactions].sort((a, b) => a.date.localeCompare(b.date)).forEach(t =>
    rows.push([t.date, t.type, t.amount, t.type === 'expense' ? catById(t.category).label : '', S.goals.find(g => g.id === t.goalId)?.name || '', t.note || '']));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `moonbun-money-${todayStr()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- global event delegation ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el) {
    const chip = e.target.closest('#cat-chips .chip');
    if (chip) selectChip(chip);
    return;
  }
  const a = el.dataset.action;
  if (a === 'tab') setTab(el.dataset.tab);
  else if (a === 'month-prev') { ui.month = shiftMonth(ui.month, -1); render(); }
  else if (a === 'month-next') { ui.month = shiftMonth(ui.month, 1); render(); }
  else if (a === 'open-add') openAdd(el.dataset.type || 'expense', el.dataset.goal || '');
  else if (a === 'close-dialog') el.closest('dialog').close();
  else if (a === 'hist-filter') { ui.histFilter = el.dataset.f; render(); $(`[data-f=${ui.histFilter}]`)?.focus(); }
  else if (a === 'export') exportCSV();
  else if (a === 'del-tx') {
    const t = S.transactions.find(x => x.id === el.dataset.id);
    if (!t) return;
    await fire(store.deleteTx(t.id));
    yutuReact('deleted');
    toast('Entry deleted', () => fire(store.addTx(t)));
  } else if (a === 'del-goal') {
    const g = S.goals.find(x => x.id === el.dataset.id);
    if (!g) return;
    await fire(store.deleteGoal(g.id));
    toast(`Removed “${g.name}” (its saved coins stay in your hoard)`, () => fire(store.addGoal(g)));
  } else if (a === 'sign-out') { await store.signOut(); }
  else if (a === 'gacha') pullGacha();
  else if (a === 'gacha-bao') pullGacha('bao');
  else if (a === 'bao-slot') { ui.baoSlot = el.dataset.slot; render(); $(`[data-action=bao-slot][data-slot=${ui.baoSlot}]`)?.focus(); }
  else if (a === 'plan-tab') { ui.planTab = el.dataset.t; render(); $(`[data-action=plan-tab][data-t=${ui.planTab}]`)?.focus(); }
  else if (a === 'bill-paid') {
    const r = billRows().find(x => x.b.id === el.dataset.id); if (!r) return;
    const bills = S.settings.bills.map(b => b.id === r.b.id ? { ...b, paid: [...(b.paid || []).slice(-11), r.key] } : b);
    await fire(store.saveSettings({ bills }));
    await fire(store.addTx({ id: uid(), type: 'expense', amount: +r.b.amount, category: r.b.cat || 'bills', note: r.b.name, date: todayStr(), createdAt: new Date().toISOString() }));
    sound('pop'); yutuReact('expense'); toast(`${r.b.name} paid and logged ✧`);
  }
  else if (a === 'bill-del') { const old = S.settings.bills; await saveList('bills', old.filter(b => b.id !== el.dataset.id)); toast('Bill removed', () => saveList('bills', old)); }
  else if (a === 'split-preset') { const f = $('#split-form'); f.needs.value = el.dataset.n; f.wants.value = el.dataset.w; updateSplit(f); }
  else if (a === 'wish-del') { const old = S.settings.wishes; await saveList('wishes', old.filter(w => w.id !== el.dataset.id)); toast('Removed from wishlist', () => saveList('wishes', old)); }
  else if (a === 'wish-skip' || a === 'wish-buy') {
    const w = (S.settings.wishes || []).find(x => x.id === el.dataset.id); if (!w) return;
    await saveList('wishes', S.settings.wishes.filter(x => x.id !== w.id));
    if (a === 'wish-skip') {
      await fire(store.addTx({ id: uid(), type: 'saving', amount: +w.price, note: `Skipped: ${w.name}`, date: todayStr(), createdAt: new Date().toISOString(), goalId: '' }));
      addHearts?.(2); sound('chime'); yutuReact('party'); toast(`You skipped ${w.name}! Bao gets ${money(+w.price)} ♡`);
    } else { openAdd('expense'); const f = $('#add-form'); f.amount.value = w.price; f.note.value = w.name; sound('pop'); }
  }
  else if (a === 'w52') {
    const n = +el.dataset.n, ch = S.settings.challenges || {}, done = ch.wk52 || [], on = done.includes(n);
    await fire(store.saveSettings({ challenges: { ...ch, wk52: on ? done.filter(x => x !== n) : [...done, n] } }));
    if (!on) { await fire(store.addTx({ id: uid(), type: 'saving', amount: n, note: `52-week challenge: week ${n}`, date: todayStr(), createdAt: new Date().toISOString(), goalId: '' })); sound('coin'); toast(`Week ${n} done! ${money(n, true)} to Bao ✧`); }
    $(`[data-action=w52][data-n="${n}"]`)?.focus();
  }
  else if (a === 'roundup') {
    const amt = +el.dataset.amt, ch = S.settings.challenges || {}, mk = monthKey(new Date());
    await fire(store.saveSettings({ challenges: { ...ch, roundups: { ...(ch.roundups || {}), [mk]: amt } } }));
    await fire(store.addTx({ id: uid(), type: 'saving', amount: amt, note: 'Round-up spare change', date: todayStr(), createdAt: new Date().toISOString(), goalId: '' }));
    sound('coin'); toast(`${money(amt)} of spare change sent to Bao ✧`);
  }
  else if (a === 'debt-del') { const old = S.settings.debts; await saveList('debts', old.filter(d => d.id !== el.dataset.id)); toast('Debt removed', () => saveList('debts', old)); }
  else if (a === 'debt-method') { ui.debtMethod = el.dataset.m; render(); $(`[data-action=debt-method][data-m=${ui.debtMethod}]`)?.focus(); }
  else if (a === 'ef-months') { await fire(store.saveSettings({ efund: { ...(S.settings.efund || {}), months: +el.dataset.m } })); $(`[data-action=ef-months][data-m="${el.dataset.m}"]`)?.focus(); }
  else if (a === 'ef-start') {
    if (el.getAttribute('aria-disabled') === 'true') return;
    const target = Math.round(avgMonthlySpend() * (S.settings.efund?.months || 3));
    await fire(store.addGoal({ id: uid(), name: 'Safety net', target, emoji: 'chest', isEmergency: true, createdAt: new Date().toISOString() }));
    sound('chime'); toast('Your safety net is started! It shows up in Bao’s hoard too ♡');
  }
  else if (a === 'open-import') openImport();
  else if (a === 'scan-receipt') startScan();
  else if (a === 'csv-import') { if (el.getAttribute('aria-disabled') !== 'true') doImport(); }
  else if (a === 'view-receipt') {
    const t = S.transactions.find(x => x.id === el.dataset.id); if (!t?.receipt) return;
    playDialog(`<div class="dialog-head"><h2 id="play-title">${icon('clip', 24)} Receipt</h2><button type="button" class="icon-btn" data-action="close-dialog" aria-label="Close">✕</button></div>
      <p class="tiny">${esc(t.note || '')} · ${money(+t.amount)} · ${fmtDate(t.date)}</p><img class="receipt-big" src="${t.receipt}" alt="Receipt photo for ${esc(t.note || 'this purchase')}">`, 'receipt');
  }
  else if (a === 'open-capsule') openCapsule();
  else if (a === 'equip') equip(el.dataset.slot, el.dataset.id, el.dataset.who || 'yutu');
  else if (a === 'wardrobe-slot') { ui.slot = el.dataset.slot; render(); $(`[data-action=wardrobe-slot][data-slot=${ui.slot}]`)?.focus(); }
  else if (a === 'omikuji') drawFortune();
  else if (a === 'diary') openDiary(el.dataset.date);
  else if (a === 'diary-save') saveDiary(el.dataset.date, false);
  else if (a === 'diary-clear') saveDiary(el.dataset.date, true);
  else if (a === 'letter') openLetter();
  else if (a === 'open-letter') { el.closest('.envelope-wrap')?.classList.add('open'); sound('page'); }
  else if (a === 'auth-toggle') { ui.authMode = ui.authMode === 'signup' ? 'signin' : 'signup'; ui.authMsg = ''; renderAuth(); }
  else if (a === 'google') { try { await store.signInGoogle(); } catch (err) { ui.authMsg = authErr(err); renderAuth(); } }
  else if (a === 'reset-pw') {
    const email = $('#auth-form').email.value.trim();
    if (!email) { ui.authMsg = 'Type your email above first, then tap “Forgot password?”'; renderAuth(); return; }
    try { await store.resetPassword(email); ui.authMsg = '✉ Reset link sent! Check your inbox.'; } catch (err) { ui.authMsg = authErr(err); }
    renderAuth(); $('#auth-form').email.value = email;
  }
});

function selectChip(chip) {
  $$('#cat-chips .chip').forEach(c => { c.setAttribute('aria-checked', 'false'); c.tabIndex = -1; });
  chip.setAttribute('aria-checked', 'true'); chip.tabIndex = 0; chip.focus();
}
// arrow keys move between category chips (radio group pattern)
document.addEventListener('keydown', e => {
  const chip = e.target.closest?.('#cat-chips .chip');
  if (!chip || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
  e.preventDefault();
  const all = $$('#cat-chips .chip'), i = all.indexOf(chip);
  selectChip(all[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length]);
});

document.addEventListener('change', e => {
  if (e.target.name === 'theme') { document.documentElement.dataset.theme = e.target.value; fire(store.saveSettings({ theme: e.target.value })); toast('New palette ♡'); }
  if (e.target.name === 'type' && e.target.form?.id === 'add-form') e.target.form.dataset.type = e.target.value;
  if (e.target.dataset.budget) saveBudget(e.target);
  if (e.target.name === 'receipt' && e.target.files?.[0]) {
    compressImage(e.target.files[0]).then(url => {
      if (url.length > 600000) { toast('That photo is too big, try a closer crop (・x・)'); return; }
      ui.receipt = url; const pv = $('.receipt-preview'); pv.src = url; pv.hidden = false;
    }).catch(() => toast('Couldn’t read that photo (・x・)'));
  }
  if (e.target.id === 'csv-file' && e.target.files?.[0]) {
    e.target.files[0].text().then(text => {
      const rows = parseCSV(text);
      if (rows.length < 2) { $('#csv-area').innerHTML = '<p class="err">That file looks empty (・x・)</p>'; return; }
      ui.csv = { rows, cols: guessColumns(rows), neg: true, on: null };
      renderImport();
    });
  }
  const c = ui.csv;
  if (c && e.target.dataset.csv) {
    const k = e.target.dataset.csv;
    if (k === 'neg') c.neg = e.target.checked; else c.cols = { ...c.cols, [k]: +e.target.value };
    c.on = null; renderImport();
  }
  if (c && e.target.dataset.row) { c.on = Object.fromEntries(c.entries.map(x => [x.key, x.on])); c.on[e.target.dataset.row] = e.target.checked; renderImport(); }
  if (c && e.target.dataset.rtype) { const en = c.entries.find(x => x.key == e.target.dataset.rtype); c.rows[(c.cols.hasHeader ? 1 : 0) + en.key] = flipRow(c, en, e.target.value); c.on = Object.fromEntries(c.entries.map(x => [x.key, x.on])); renderImport(); }
  if (c && e.target.dataset.rcat) { const en = c.entries.find(x => x.key == e.target.dataset.rcat); (c.cats ||= {})[en.key] = e.target.value; en.category = e.target.value; }
  if (e.target.dataset.actionInput === 'debt-extra') { ui.debtExtra = +e.target.value; render(); $('[data-action-input=debt-extra]')?.focus(); }
});
document.addEventListener('input', e => {
  if (e.target.form?.id === 'split-form' && e.target.type === 'range') updateSplit(e.target.form, e.target.name);
  if (e.target.dataset.actionInput === 'debt-extra') { const b = e.target.closest('.field')?.querySelector('b'); if (b) b.textContent = money(+e.target.value, true); }
  if (e.target.dataset.budget && e.target.type === 'range') {
    const num = e.target.parentElement.querySelector('input[type=number]');
    if (num) num.value = e.target.value;
  }
});
function saveBudget(input) {
  const v = Math.max(0, Math.round(+input.value || 0));
  const budgets = { ...S.settings.budgets, [input.dataset.budget]: v };
  const focusSel = `input[type=${input.type}][data-budget=${input.dataset.budget}]`;
  fire(store.saveSettings({ budgets })).then(() => $(focusSel)?.focus());
}

document.addEventListener('submit', async e => {
  if (e.target.id === 'add-form') return submitAdd(e);
  e.preventDefault();
  const f = e.target;
  if (f.id === 'goal-form') {
    const target = parseFloat(String(f.target.value).replace(/[^0-9.]/g, ''));
    if (!f.name.value.trim() || !(target > 0)) { toast('Give your treasure a name and a target ✧'); return; }
    await fire(store.addGoal({ id: uid(), name: f.name.value.trim(), target, emoji: $('input[name=emoji]:checked', f)?.value || 'gem', createdAt: new Date().toISOString(), ...(f.due?.value ? { due: f.due.value } : {}) }));
    toast('New treasure added! Bao is guarding it ♡');
  } else if (f.id === 'bill-form') {
    const amount = parseAmount(f.amount.value);
    if (!f.name.value.trim() || !(amount > 0)) { toast('Give the bill a name and an amount ✧'); return; }
    const [y, m, d] = f.due.value.split('-').map(Number), wd = new Date(y, m - 1, d).getDay();
    const bill = { id: uid(), name: f.name.value.trim(), amount: Math.abs(amount), freq: f.freq.value, day: d, month: m, weekday: wd, cat: f.cat.value, paid: [], ...(f.trial.value ? { trialEnds: f.trial.value } : {}) };
    await saveList('bills', [...(S.settings.bills || []), bill]); sound('pop'); toast(`${bill.name} added. Yutu will remind you ♡`);
  } else if (f.id === 'split-form') {
    const n = +f.needs.value, w = Math.min(+f.wants.value, 100 - n);
    await fire(store.saveSettings({ split: { needs: n, wants: w, save: 100 - n - w, pay: f.pay.value.trim() } })); sound('chime'); toast('Paycheck plan saved ✧');
  } else if (f.id === 'wish-form') {
    const price = parseAmount(f.price.value);
    if (!f.name.value.trim() || !(price > 0)) { toast('What is it, and how much? ✧'); return; }
    await saveList('wishes', [...(S.settings.wishes || []), { id: uid(), name: f.name.value.trim(), price: Math.abs(price), added: new Date().toISOString() }]);
    sound('pop'); toast('Cool-down started! Check back in 48 hours ⏳');
  } else if (f.id === 'debt-form') {
    const bal = parseAmount(f.balance.value), min = parseAmount(f.min.value);
    if (!f.name.value.trim() || !(bal > 0) || !(min > 0)) { toast('Add a name, balance and minimum payment ✧'); return; }
    await saveList('debts', [...(S.settings.debts || []), { id: uid(), name: f.name.value.trim(), balance: Math.abs(bal), apr: Math.abs(parseAmount(f.apr.value) || 0), min: Math.abs(min) }]);
    toast('Debt added. Let’s beat it together (ง •̀_•́)ง');
  } else if (f.id === 'settings-form') {
    await fire(store.saveSettings({
      name: f.name.value.trim(), currency: f.currency.value,
      savingsTarget: Math.max(0, parseFloat(f.savingsTarget.value) || 0), reduceMotion: f.reduceMotion.checked, sparkles: f.sparkles.checked, sound: f.sound.checked,
    }));
    toast('Settings saved ☾');
  } else if (f.id === 'auth-form') {
    const email = f.email.value.trim(), pw = f.password.value;
    try { ui.authMode === 'signup' ? await store.signUp(email, pw) : await store.signIn(email, pw); ui.authMsg = ''; }
    catch (err) { ui.authMsg = authErr(err); renderAuth(); $('#auth-form').email.value = email; }
  }
});

/* ---------- tooltip for charts (hover + keyboard focus) ---------- */
const tip = $('#tooltip');
function showTip(el) {
  const r = el.getBoundingClientRect();
  tip.textContent = el.dataset.tip;
  tip.hidden = false;
  tip.style.left = `${Math.min(innerWidth - 130, Math.max(130, r.left + r.width / 2))}px`;
  tip.style.top = `${r.top}px`;
}
document.addEventListener('pointerover', e => { const el = e.target.closest('[data-tip]'); el ? showTip(el) : (tip.hidden = true); });
document.addEventListener('focusin', e => { const el = e.target.closest('[data-tip]'); el ? showTip(el) : (tip.hidden = true); });
document.addEventListener('scroll', () => { tip.hidden = true; }, { passive: true });

/* ================= friendship: petting + daily visits ================= */
function petHeart() {
  sound('pet');
  const pl = play(), d = todayStr(), pd = pl.petDay?.d === d ? pl.petDay : { d, n: 0 };
  if (pd.n >= 5) return;
  pd.n++;
  const hearts = (pl.hearts || 0) + 1, before = friendLevel(pl.hearts);
  savePlay({ hearts, petDay: pd });
  if (friendLevel(hearts) > before) { sound('chime'); toast(`Friendship level ${friendLevel(hearts)}! +1 moon ticket ♡`); }
}
document.addEventListener('click', e => { if (e.target.closest?.('canvas.interactive')) petHeart(); });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('canvas.interactive')) petHeart(); });
function dailyVisit() {
  const d = todayStr(); if (play().lastVisit === d) return;
  const pl = play();
  savePlay({ lastVisit: d, hearts: (pl.hearts || 0) + 2 });
  setTimeout(() => toast('Welcome back! Yutu gave you 2 friendship hearts ♡'), 1600);
}

/* ================= tap sparkles ================= */
document.addEventListener('pointerdown', e => {
  if (S.settings.sparkles === false || e.target.closest?.('input, select, textarea, dialog')) return;
  burst(e.clientX, e.clientY, ['♡', '✧', '☆', '✿'], 7);
});

/* ================= Yutu ================= */
initYutu({ say: line => { const b = $('.hero .bubble'); if (b) b.textContent = line; } });
// lace sliders: the filled part of each slider's track follows its value (--fill)
const rangeFill = el => el.style.setProperty('--fill', `${((el.value - (el.min || 0)) / ((el.max || 100) - (el.min || 0))) * 100}%`);
document.addEventListener('input', e => { if (e.target.matches?.('input[type=range]')) rangeFill(e.target); });
new MutationObserver(() => document.querySelectorAll('input[type=range]').forEach(rangeFill)).observe(document.body, { childList: true, subtree: true });
document.querySelectorAll('input[type=range]').forEach(rangeFill);
// the tab bar and settings button are in index.html: swap their icons for the magical-girl charms
document.querySelectorAll('.tabbar svg.ic, .topbar svg.ic').forEach(svg => {
  const name = [...svg.classList].find(c => c.startsWith('ic-'))?.slice(3);
  if (name) svg.outerHTML = icon(name, +svg.getAttribute('width') || 24);
});

/* ================= boot ================= */
async function boot() {
  store = await createStore({
    onData(state) { S = state; if (!$('#app').hidden) render(); },
    onAuth(user) {
      ui.user = user;
      if (!user) { $('#app').hidden = true; $('#auth').hidden = false; renderAuth(); return; }
      $('#auth').hidden = true; $('#app').hidden = false;
      if (!ui.greeted) { ui.greeted = true; setTimeout(() => yutuReact('hello'), 700); setTimeout(dailyVisit, 400); }
      $('#demo-banner').hidden = user.mode !== 'local';
      if (user.mode === 'local' && isCloudConfigured()) $('#demo-banner').textContent = 'Couldn’t reach Firebase, so you’re in demo mode on this device.';
      render();
    },
  });
}
boot();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
