// Moonbun Money — money helpers: bank CSV import, auto-categories, insights,
// bill due dates, debt payoff math, round-ups and receipt photo compression.
// Pure logic only (no DOM rendering) so it is easy to test.

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */
export function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',' || c === ';' || c === '\t') { row.push(cell.trim()); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell.trim()); if (row.some(v => v !== '')) rows.push(row);
  return rows;
}

const pad = n => String(n).padStart(2, '0');
export function parseDate(v) {
  if (!v) return null;
  v = v.trim();
  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);           // US style M/D/Y
  if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${pad(m[1])}-${pad(m[2])}`; }
  const d = new Date(v);
  return isNaN(d) ? null : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function parseAmount(v) {
  if (v == null || v === '') return null;
  let s = String(v).trim(), neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (/-/.test(s)) neg = true;
  s = s.replace(/[^0-9.,]/g, '');
  if (/,\d{2}$/.test(s) && !/\.\d{2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');   // 1.234,56
  else s = s.replace(/,/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? null : (neg ? -n : n);
}
// guess which column is which from the header row (and the data, as a fallback)
export function guessColumns(rows) {
  const head = rows[0].map(h => h.toLowerCase());
  const find = re => head.findIndex(h => re.test(h));
  let date = find(/date|posted|time/), desc = find(/desc|memo|payee|name|merchant|detail|narrative|transaction/),
    amount = find(/^amount$|amount|value|sum/), debit = find(/debit|withdraw|out|spent/), credit = find(/credit|deposit|in$|received/);
  const hasHeader = date !== -1 || desc !== -1 || amount !== -1;
  const data = hasHeader ? rows.slice(1) : rows;
  const sample = data.slice(0, 20);
  if (date === -1) date = rows[0].findIndex((_, i) => sample.every(r => parseDate(r[i])));
  if (amount === -1 && debit === -1) amount = rows[0].findIndex((_, i) => i !== date && sample.every(r => r[i] === '' || parseAmount(r[i]) !== null));
  if (desc === -1) desc = rows[0].findIndex((_, i) => i !== date && i !== amount && sample.some(r => /[a-z]/i.test(r[i] || '')));
  if (debit !== -1 && debit === amount) debit = -1;
  return { hasHeader, date, desc, amount, debit: amount !== -1 ? -1 : debit, credit: amount !== -1 ? -1 : credit };
}

/* friendly auto-categories from the description */
const RULES = [
  ['food', /restaurant|cafe|coffee|starbucks|dunkin|mcdonald|burger|pizza|taco|chipotle|subway|panera|doordash|grubhub|uber ?eats|instacart|grocery|hy-?vee|aldi|kroger|trader joe|whole foods|fareway|costco|bakery|boba|tea|sushi|ramen|kwik ?star|dining/i],
  ['transport', /uber(?! ?eats)|lyft|shell|exxon|bp |chevron|casey'?s|marathon|parking|transit|metro|bus|train|amtrak|airline|delta|united|southwest|gas station|fuel/i],
  ['shopping', /amazon|target|walmart|etsy|shein|ikea|best buy|old navy|h&m|uniqlo|zara|mall|marshalls|tj ?maxx/i],
  ['fun', /netflix|spotify|hulu|disney|steam|playstation|xbox|nintendo|cinema|amc|movie|concert|ticket|twitch|youtube|crunchyroll|game/i],
  ['school', /tuition|bookstore|chegg|pearson|textbook|university|college|campus|course|udemy|school/i],
  ['bills', /rent|electric|energy|water|internet|comcast|xfinity|verizon|t-?mobile|at&t|sprint|insurance|geico|state farm|utility|phone|loan payment|mortgage/i],
  ['selfcare', /ulta|sephora|salon|spa|nail|barber|pharmacy|cvs|walgreens|gym|fitness|planet fitness|yoga|doctor|dental|clinic/i],
];
const INCOME = /payroll|paycheck|salary|direct dep|deposit|refund|interest paid|venmo.*from|zelle.*from|transfer from/i;
export const guessCategory = desc => (RULES.find(([, re]) => re.test(desc || '')) || ['other'])[0];
export const looksLikeIncome = desc => INCOME.test(desc || '');

export function rowsToEntries(rows, cols, { negativeIsSpending = true } = {}) {
  const data = cols.hasHeader ? rows.slice(1) : rows;
  return data.map((r, i) => {
    const date = parseDate(r[cols.date]);
    const desc = (r[cols.desc] || '').replace(/\s+/g, ' ').trim();
    let amt;
    if (cols.amount !== -1) amt = parseAmount(r[cols.amount]);
    else {
      const d = parseAmount(r[cols.debit]), c = parseAmount(r[cols.credit]);
      amt = d ? -Math.abs(d) : c ? Math.abs(c) : null;
    }
    if (!date || amt === null || amt === 0) return null;
    let type = (negativeIsSpending ? amt < 0 : amt > 0) ? 'expense' : 'income';
    if (type === 'expense' && looksLikeIncome(desc) && !negativeIsSpending) type = 'income';
    return { key: i, date, note: desc.slice(0, 80), amount: Math.round(Math.abs(amt) * 100) / 100, type, category: type === 'expense' ? guessCategory(desc) : null };
  }).filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Bills                                                               */
/* ------------------------------------------------------------------ */
// next due date on or after `from` for a bill {day, freq:'monthly'|'yearly'|'weekly', month?, weekday?}
export function nextDue(bill, from = new Date()) {
  const f = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (bill.freq === 'weekly') {
    const d = new Date(f); const wd = +bill.weekday || 0;
    d.setDate(d.getDate() + ((wd - d.getDay() + 7) % 7)); return d;
  }
  const day = Math.min(28, Math.max(1, +bill.day || 1));
  if (bill.freq === 'yearly') {
    const m = (+bill.month || 1) - 1;
    let d = new Date(f.getFullYear(), m, day); if (d < f) d = new Date(f.getFullYear() + 1, m, day); return d;
  }
  let d = new Date(f.getFullYear(), f.getMonth(), day); if (d < f) d = new Date(f.getFullYear(), f.getMonth() + 1, day); return d;
}
export const daysUntil = (d, from = new Date()) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000);
export const monthlyCost = b => b.freq === 'yearly' ? b.amount / 12 : b.freq === 'weekly' ? b.amount * 52 / 12 : +b.amount;
export const cycleKey = (b, due) => `${b.id}:${due.getFullYear()}-${pad(due.getMonth() + 1)}${b.freq === 'weekly' ? '-' + pad(due.getDate()) : ''}`;

/* ------------------------------------------------------------------ */
/* Debts                                                               */
/* ------------------------------------------------------------------ */
// months to pay off and total interest for one balance with a fixed monthly payment
export function payoff(balance, aprPct, payment) {
  let b = +balance, months = 0, interest = 0;
  const r = (+aprPct || 0) / 100 / 12;
  if (payment <= b * r + 0.01) return { months: Infinity, interest: Infinity };
  while (b > 0.005 && months < 1200) { const i = b * r; interest += i; b = b + i - payment; months++; }
  return { months, interest: Math.round(interest * 100) / 100 };
}
// whole plan: pay minimums on everything, put `extra` on one debt at a time (avalanche = highest APR first, snowball = smallest balance first)
export function payoffPlan(debts, extra = 0, method = 'avalanche') {
  let list = debts.map(d => ({ ...d, bal: +d.balance })).filter(d => d.bal > 0);
  if (!list.length) return { months: 0, interest: 0, order: [] };
  const order = [...list].sort((a, b) => method === 'snowball' ? a.bal - b.bal : (+b.apr || 0) - (+a.apr || 0)).map(d => d.id);
  let months = 0, interest = 0; const done = [];
  while (list.some(d => d.bal > 0.005) && months < 1200) {
    months++;
    let spare = +extra;
    list.forEach(d => { if (d.bal > 0.005) { const i = d.bal * ((+d.apr || 0) / 100 / 12); interest += i; d.bal += i; } });
    list.forEach(d => { if (d.bal > 0.005) { const p = Math.min(d.bal, +d.min || 0); d.bal -= p; } else spare += +d.min || 0; });
    for (const id of order) { const d = list.find(x => x.id === id); if (d.bal > 0.005 && spare > 0) { const p = Math.min(d.bal, spare); d.bal -= p; spare -= p; } }
    list.forEach(d => { if (d.bal <= 0.005 && !done.includes(d.id)) done.push(d.id); });
    if (months > 1 && list.every(d => d.bal >= +d.balance)) return { months: Infinity, interest: Infinity, order };
  }
  return { months, interest: Math.round(interest * 100) / 100, order: done };
}

/* ------------------------------------------------------------------ */
/* Insights                                                            */
/* ------------------------------------------------------------------ */
export function insights({ thisMonth, lastMonth, cats, txThisMonth, money }) {
  const out = [];
  cats.forEach(c => {
    const a = thisMonth.byCat[c.id] || 0, b = lastMonth.byCat[c.id] || 0;
    if (b >= 10 && a - b >= 10 && a / b >= 1.2) out.push({ mood: 'warn', icon: c.id, text: `${c.label} is up ${Math.round((a / b - 1) * 100)}% from last month (${money(b)} → ${money(a)}).` });
    else if (b >= 10 && b - a >= 10 && a / b <= .8) out.push({ mood: 'good', icon: c.id, text: `${c.label} is down ${Math.round((1 - a / b) * 100)}% from last month. Nice!` });
  });
  const byDow = Array(7).fill(0);
  txThisMonth.filter(t => t.type === 'expense').forEach(t => { const [y, m, d] = t.date.split('-').map(Number); byDow[new Date(y, m - 1, d).getDay()] += +t.amount; });
  const maxDow = byDow.indexOf(Math.max(...byDow));
  if (byDow[maxDow] > 0) out.push({ mood: 'info', icon: 'calendar', text: `You spend the most on ${['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][maxDow]}.` });
  const small = txThisMonth.filter(t => t.type === 'expense' && +t.amount < 10);
  if (small.length >= 5) out.push({ mood: 'info', icon: 'dango', text: `${small.length} small treats under $10 added up to ${money(small.reduce((s, t) => s + +t.amount, 0))} this month.` });
  if (thisMonth.income > 0) {
    const rate = Math.round((thisMonth.saved / thisMonth.income) * 100);
    out.push({ mood: rate >= 20 ? 'good' : 'info', icon: 'coin', text: `You saved ${rate}% of what you earned this month${rate >= 20 ? '. That’s amazing!' : '. 20% is a lovely goal.'}` });
  }
  return out.slice(0, 5);
}

/* ------------------------------------------------------------------ */
/* Receipts: shrink a photo so it fits comfortably in the database     */
/* ------------------------------------------------------------------ */
export function compressImage(file, maxSide = 700, quality = .6) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = e => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
export const roundUp = amount => Math.round((Math.ceil(+amount) - +amount) * 100) / 100;
