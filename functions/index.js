// Moonbun Money Cloud Functions.
//
// scanReceipt: the app sends a photo of a receipt (taken with the in-app camera scanner); Claude reads it
// and returns the store, date, total and each item with a budget category. The app shows the result for
// review before anything is logged. Only signed-in users can call it, and the Anthropic API key stays here
// on the server as a Firebase secret (set it once with: firebase functions:secrets:set ANTHROPIC_API_KEY).
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// the app's budget categories (js/app.js CATS)
const CATEGORIES = {
  food: 'groceries, restaurants, cafes, snacks, drinks',
  fun: 'games, movies, hobbies, events, toys',
  shopping: 'clothes, gifts, home goods, electronics, general shopping',
  transport: 'fuel, transit, parking, rides',
  school: 'books, stationery, course fees, school supplies',
  bills: 'utilities, phone, subscriptions, rent, insurance',
  selfcare: 'skincare, makeup, haircare, pharmacy, health',
  other: 'anything else',
};

const SYSTEM = `You read photos of shopping receipts for a cute personal budgeting app.
Reply with one JSON object and nothing else (no code fences, no comments), in exactly this shape:
{"isReceipt": true, "merchant": "Store name", "date": "YYYY-MM-DD or null", "currency": "ISO code like USD, or null",
 "items": [{"name": "short item name", "amount": 3.49, "category": "food"}],
 "subtotal": 12.30 or null, "tax": 0.98 or null, "total": 13.28}

Rules:
- items: every purchased line, with its final price after any per-item discount. Quantities belong in the price (2 x 1.50 is one item at 3.00).
  Leave out tax, tips, totals, payment and change lines; put tax in "tax".
- name: what the item is in plain words (expand receipt abbreviations when you are sure), at most 40 characters.
- amount and total: numbers, not strings, with no currency signs. total is the amount actually paid.
- category: one of ${Object.keys(CATEGORIES).join(', ')}. Meanings: ${Object.entries(CATEGORIES).map(([k, v]) => `${k} = ${v}`).join('; ')}.
- date: the purchase date printed on the receipt, or null if you cannot read it.
- If part of the receipt is unreadable, include what you can read; never invent items or prices.
- If the photo is not a receipt, reply {"isReceipt": false}.`;

const MAX_IMAGE_CHARS = 6_000_000; // ~4.5 MB of base64; the app sends about 0.3-1 MB
const money = v => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

function parseReply(text) {
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

// keep only well-formed fields, so the app never has to trust the model's JSON blindly
function clean(raw) {
  if (!raw || raw.isReceipt === false) return { isReceipt: false };
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .map(it => ({
      name: String(it?.name ?? '').trim().slice(0, 40) || 'Item',
      amount: money(it?.amount),
      category: Object.hasOwn(CATEGORIES, it?.category) ? it.category : 'other',
    }))
    .filter(it => it.amount !== null && it.amount >= 0)
    .slice(0, 80);
  const total = money(raw.total) ?? (items.length ? money(items.reduce((s, it) => s + it.amount, 0)) : null);
  return {
    isReceipt: true,
    merchant: String(raw.merchant ?? '').trim().slice(0, 60),
    date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date ?? '') ? raw.date : null,
    currency: /^[A-Z]{3}$/.test(raw.currency ?? '') ? raw.currency : null,
    items,
    subtotal: money(raw.subtotal),
    tax: money(raw.tax),
    total,
  };
}

export const scanReceipt = onCall(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, memory: '512MiB', maxInstances: 5 },
  async request => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in to scan receipts.');
    const image = request.data?.image;
    const mediaType = ['image/jpeg', 'image/png', 'image/webp'].includes(request.data?.mediaType) ? request.data.mediaType : 'image/jpeg';
    if (typeof image !== 'string' || !image || image.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(image)) {
      throw new HttpsError('invalid-argument', 'That photo could not be sent. Please try again.');
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    let response;
    try {
      response = await client.beta.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 16000,
        // reading a receipt is quick work; low effort keeps the wait short at the till
        output_config: { effort: 'low' },
        // if a safety classifier declines, the API retries on Anthropic's recommended fallback model
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: `Read this receipt. Today is ${request.data?.today || new Date().toISOString().slice(0, 10)}.` },
          ],
        }],
      });
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) throw new HttpsError('failed-precondition', 'The receipt reader is not set up yet (the API key is missing or wrong).');
      if (error instanceof Anthropic.RateLimitError) throw new HttpsError('resource-exhausted', 'Too many scans at once. Please wait a moment and try again.');
      if (error instanceof Anthropic.BadRequestError) throw new HttpsError('invalid-argument', 'That photo could not be read. Try a clearer, closer photo.');
      if (error instanceof Anthropic.APIError) throw new HttpsError('unavailable', 'The receipt reader is busy. Please try again in a moment.');
      throw new HttpsError('internal', 'Something went wrong reading the receipt.');
    }

    if (response.stop_reason === 'refusal') throw new HttpsError('failed-precondition', 'Sorry, that photo could not be read.');
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const parsed = parseReply(text);
    if (!parsed) throw new HttpsError('internal', 'The receipt could not be read. Try a clearer photo.');
    return clean(parsed);
  },
);
