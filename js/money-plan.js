// Money planning helpers (pure functions, no DOM): upcoming bills and paydays, the subscription finder,
// price-change alerts on bills, safe-to-spend, and autopay catch-up. Dates are local "YYYY-MM-DD" strings
// or Date objects at local midnight.
import { nextDue, cycleKey } from './plan.js';

const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d, n, day = d.getDate()) => { const t = new Date(d.getFullYear(), d.getMonth() + n, 1); return new Date(t.getFullYear(), t.getMonth(), Math.min(day, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate())); };
const round2 = v => Math.round(v * 100) / 100;

/* ---------- bills ---------- */
// every due date of a bill from `from` up to and including `to`, with whether that cycle is paid
export function billOccurrences(bill, from, to) {
  const out = [], step = d => bill.freq === 'weekly' ? addDays(d, 7) : bill.freq === 'yearly' ? addMonths(d, 12) : addMonths(d, 1, Math.min(28, +bill.day || d.getDate()));
  for (let d = nextDue(bill, from), i = 0; d <= to && i < 60; d = step(d), i++) {
    const key = cycleKey(bill, d);
    out.push({ bill, date: d, key, paid: (bill.paid || []).includes(key) });
  }
  return out;
}
// the most recent due date on or before `day` (for autopay)
export function lastDue(bill, day) {
  const back = bill.freq === 'weekly' ? addDays(day, -6) : bill.freq === 'yearly' ? addMonths(day, -12) : addMonths(day, -1);
  const occ = billOccurrences(bill, addDays(back, 1), day);
  return occ.length ? occ[occ.length - 1] : null;
}
export const yearlyCost = b => round2(b.freq === 'yearly' ? +b.amount : b.freq === 'weekly' ? b.amount * 52 : b.amount * 12);

// autopay: bills switched to autopay are logged on their due date. Returns the entries to add and the bills
// with those cycles marked paid. Only cycles due on or after the day autopay was turned on are logged.
export function autopayDue(bills, today) {
  const day = midnight(today), entries = [];
  const next = bills.map(b => {
    if (!b.autopay || !b.autoFrom) return b;
    const due = lastDue(b, day);
    if (!due || due.paid || ymd(due.date) < b.autoFrom) return b;
    entries.push({ type: 'expense', amount: +b.amount, category: b.cat || 'bills', note: b.name, date: ymd(due.date), billId: b.id, autopay: true });
    return { ...b, paid: [...(b.paid || []).slice(-11), due.key] };
  });
  return { entries, bills: next };
}

/* ---------- paydays ---------- */
// split = { pay, payFreq: 'weekly' | 'biweekly' | 'monthly', nextPay: 'YYYY-MM-DD' }
export function paydays(split, from, to) {
  if (!split?.nextPay || !split.payFreq) return [];
  let d = fromYmd(split.nextPay); const out = [];
  const step = (x, dir) => split.payFreq === 'weekly' ? addDays(x, 7 * dir) : split.payFreq === 'biweekly' ? addDays(x, 14 * dir) : addMonths(x, dir, fromYmd(split.nextPay).getDate());
  for (let i = 0; d > from && i < 400; i++) d = step(d, -1);          // walk back to before `from`
  for (let i = 0; i < 400 && d <= to; i++, d = step(d, 1)) if (d >= from) out.push({ date: d, amount: +split.pay || 0 });
  return out;
}

/* ---------- upcoming money (calendar) ---------- */
// events from today for `days` days: unpaid bills (money out) and paydays (money in), oldest first,
// with a running balance when `start` (your money now) is known
export function upcoming({ bills = [], split = {}, start = null, today = new Date(), days = 30 }) {
  const from = midnight(today), to = addDays(from, days);
  const ev = [];
  for (const b of bills) for (const o of billOccurrences(b, from, to)) if (!o.paid) ev.push({ date: o.date, kind: 'bill', name: b.name, amount: -(+b.amount || 0), cat: b.cat || 'bills', billId: b.id, autopay: !!b.autopay, trial: b.trialEnds && b.trialEnds >= ymd(from) ? b.trialEnds : null });
  for (const p of paydays(split, from, to)) ev.push({ date: p.date, kind: 'pay', name: 'Payday', amount: p.amount });
  ev.sort((a, b) => a.date - b.date || (a.kind === 'pay' ? -1 : 1));
  let bal = start;
  for (const e of ev) { if (bal !== null) { bal = round2(bal + e.amount); e.balance = bal; } }
  return ev;
}

/* ---------- safe to spend ---------- */
// your money now, minus bills due before your next payday (or the next 30 days if no payday is set),
// minus what's left of this month's savings target
export function safeToSpend({ money, bills = [], split = {}, savingsTarget = 0, savedThisMonth = 0, today = new Date() }) {
  if (money === null || money === undefined) return null;
  const from = midnight(today);
  const pay = paydays(split, addDays(from, 1), addDays(from, 62))[0];
  const until = pay ? addDays(pay.date, -1) : addDays(from, 30);
  const due = [];
  for (const b of bills) for (const o of billOccurrences(b, from, until)) if (!o.paid) due.push({ name: b.name, amount: +b.amount || 0, date: o.date });
  const billsTotal = round2(due.reduce((s, d) => s + d.amount, 0));
  const saving = round2(Math.max(0, (+savingsTarget || 0) - (+savedThisMonth || 0)));
  const safe = round2(money - billsTotal - saving);
  const daysLeft = Math.max(1, Math.round((until - from) / 864e5) + 1);
  return { safe, money, billsTotal, bills: due, saving, payday: pay ? pay.date : null, until, daysLeft, perDay: round2(Math.max(0, safe) / daysLeft) };
}

/* ---------- subscription finder ---------- */
// the store/merchant part of an entry's note, simplified so the same merchant matches across months
export function merchantKey(note = '') {
  let s = String(note).toLowerCase();
  if (s.includes(' · ')) s = s.split(' · ').pop();                    // scanned items: "Item · Store"
  s = s.replace(/\b(pos|purchase|debit|card|visa|mastercard|recurring|payment|online|www|com|inc|llc|ltd)\b/g, ' ')
    .replace(/[0-9#*_./\\-]+/g, ' ').replace(/[^a-z\s&']/g, ' ').replace(/\s+/g, ' ').trim();
  return s.split(' ').slice(0, 3).join(' ');
}
const median = xs => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const same = (a, b) => { const x = merchantKey(a), y = merchantKey(b); return !!x && !!y && (x === y || x.startsWith(y) || y.startsWith(x)); };

// repeating charges: the same merchant at about the same amount roughly weekly, monthly or yearly
export function findRecurring(transactions, bills = [], dismissed = []) {
  const groups = new Map();
  for (const t of transactions) {
    if (t.type !== 'expense' || !(+t.amount > 0) || !t.date || t.billId) continue;
    const k = merchantKey(t.note); if (!k || k.length < 3 || dismissed.includes(k)) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }
  const found = [];
  for (const [k, list] of groups) {
    if (list.length < 2) continue;
    list.sort((a, b) => a.date.localeCompare(b.date));
    const amounts = list.map(t => +t.amount), mid = median(amounts);
    const close = list.filter(t => Math.abs(+t.amount - mid) <= Math.max(1, mid * .15));
    if (close.length < 2) continue;
    const gaps = close.slice(1).map((t, i) => (fromYmd(t.date) - fromYmd(close[i].date)) / 864e5);
    const g = median(gaps);
    const freq = g >= 5 && g <= 9 ? 'weekly' : g >= 25 && g <= 36 ? 'monthly' : g >= 340 && g <= 390 ? 'yearly' : null;
    if (!freq || (freq !== 'yearly' && close.length < 3 && !(freq === 'monthly' && close.length === 2))) continue;
    if (!gaps.every(x => Math.abs(x - g) <= (freq === 'weekly' ? 2 : freq === 'monthly' ? 6 : 20))) continue;
    const lastClose = close[close.length - 1], newest = list[list.length - 1];
    // the newest charge counts if it is the same subscription at a new price (up to +60%)
    const last = newest.date > lastClose.date && +newest.amount > mid && +newest.amount <= mid * 1.6 ? newest : lastClose;
    if (bills.some(b => same(b.name, last.note))) continue;              // already a bill
    let name = (String(last.note).includes(' · ') ? String(last.note).split(' · ').pop() : String(last.note)).trim();
    // bank lines like "NETFLIX.COM 866-579" become "Netflix"
    if (/\d/.test(name) || name === name.toUpperCase()) name = k.replace(/\b\w/g, c => c.toUpperCase());
    found.push({ key: k, name: name.slice(0, 40) || k, amount: round2(+last.amount), was: last !== lastClose ? round2(+lastClose.amount) : null, freq, count: close.length + (last !== lastClose ? 1 : 0), lastDate: last.date,
      cat: last.category || 'bills', day: fromYmd(last.date).getDate(), month: fromYmd(last.date).getMonth() + 1, weekday: fromYmd(last.date).getDay() });
  }
  return found.sort((a, b) => b.count - a.count || b.amount - a.amount);
}

// a bill whose latest matching charge costs more than the bill says: the price went up
export function priceChanges(bills, transactions) {
  const out = [];
  for (const b of bills) {
    const hits = transactions.filter(t => t.type === 'expense' && !t.billId && t.date && same(b.name, t.note)).sort((x, y) => x.date.localeCompare(y.date));
    const last = hits[hits.length - 1];
    if (last && +last.amount > +b.amount * 1.02 && +last.amount < +b.amount * 3) out.push({ bill: b, from: +b.amount, to: round2(+last.amount), date: last.date });
  }
  return out;
}
