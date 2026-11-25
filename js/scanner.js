// Receipt scanner: hold a receipt up to the phone camera and it snaps the photo on its own once the
// picture is steady and sharp (or tap the shutter). Claude reads it in the scanReceipt Cloud Function,
// then you check the store, date and items before anything is logged, as one total or item by item.
//   openScanner(ctx)  ctx = { cats, icon, money, esc, toast, today, scan(b64, type), save(txs), compress(blob) }

let ctx = null, stream = null, timer = null, shot = null, result = null;
const $ = (s, r = document) => r.querySelector(s);

function dialog() {
  let d = $('#scan-dialog');
  if (!d) {
    d = document.createElement('dialog');
    d.id = 'scan-dialog'; d.className = 'scan-dialog'; d.setAttribute('aria-labelledby', 'scan-title');
    d.addEventListener('close', stopCamera);
    d.addEventListener('click', onClick);
    d.addEventListener('input', onInput);
    d.addEventListener('change', onInput);
    document.body.appendChild(d);
  }
  return d;
}
const head = title => `<div class="dialog-head"><h2 id="scan-title">${title}</h2><button type="button" class="icon-btn" data-scan="close" aria-label="Close">✕</button></div>`;

export function openScanner(context) {
  ctx = context; shot = null; result = null;
  const d = dialog();
  d.innerHTML = `${head(`${ctx.icon('bills', 26)} Scan a receipt`)}
    <div class="scan-stage">
      <video class="scan-video" playsinline muted autoplay></video>
      <div class="scan-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <svg class="scan-ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17"/><circle class="scan-ring-fill" cx="20" cy="20" r="17"/></svg>
    </div>
    <p class="scan-hint" role="status">Starting the camera…</p>
    <div class="scan-actions">
      <button type="button" class="btn primary big" data-scan="snap">${ctx.icon('sparkles', 22)} Scan now</button>
      <label class="btn ghost">${ctx.icon('upload', 20)} Use a photo<input type="file" accept="image/*" data-scan="file" hidden></label>
    </div>`;
  if (!d.open) d.showModal();
  startCamera();
}

async function startCamera() {
  const hint = $('#scan-dialog .scan-hint');
  if (!navigator.mediaDevices?.getUserMedia) { hint.textContent = 'This browser can’t open the camera here, so choose a photo instead ✧'; return; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
  } catch {
    hint.textContent = 'Camera not allowed. You can allow it in your browser settings, or choose a photo instead ✧';
    return;
  }
  const v = $('#scan-dialog .scan-video');
  if (!v) { stopCamera(); return; }
  v.srcObject = stream;
  await v.play().catch(() => {});
  hint.textContent = 'Hold the receipt inside the frame and keep still ✧';
  watchForSteadyReceipt(v);
}

function stopCamera() {
  clearInterval(timer); timer = null;
  stream?.getTracks().forEach(t => t.stop()); stream = null;
}

// Auto-capture: a tiny greyscale copy of the frame every 250 ms. When the picture has enough contrast
// (a receipt with text on it), is neither too dark nor blown out, and barely changes for about 1.5 s,
// it takes the photo by itself.
function watchForSteadyReceipt(v) {
  const c = document.createElement('canvas'); c.width = 36; c.height = 48;
  const g = c.getContext('2d', { willReadFrequently: true });
  const ring = $('#scan-dialog .scan-ring'), hint = $('#scan-dialog .scan-hint');
  let prev = null, steady = 0;
  const NEED = 6;
  timer = setInterval(() => {
    if (!v.videoWidth) return;
    g.drawImage(v, 0, 0, c.width, c.height);
    const px = g.getImageData(0, 0, c.width, c.height).data, lum = new Float32Array(c.width * c.height);
    let sum = 0;
    for (let i = 0; i < lum.length; i++) { lum[i] = px[i * 4] * .299 + px[i * 4 + 1] * .587 + px[i * 4 + 2] * .114; sum += lum[i]; }
    const mean = sum / lum.length;
    let varSum = 0, diff = 0;
    for (let i = 0; i < lum.length; i++) { varSum += (lum[i] - mean) ** 2; if (prev) diff += Math.abs(lum[i] - prev[i]); }
    const contrast = Math.sqrt(varSum / lum.length), motion = prev ? diff / lum.length : 99;
    prev = lum;
    const looksLikeReceipt = contrast > 26 && mean > 55 && mean < 238;
    steady = looksLikeReceipt && motion < 5 ? steady + 1 : 0;
    ring.style.setProperty('--p', Math.min(1, steady / NEED));
    ring.classList.toggle('on', steady > 0);
    if (!looksLikeReceipt) hint.textContent = mean <= 55 ? 'A little more light, please ✧' : 'Hold the receipt inside the frame and keep still ✧';
    else if (steady && steady < NEED) hint.textContent = 'Hold still… ✧';
    if (steady >= NEED) capture(v);
  }, 250);
}

function capture(v) {
  clearInterval(timer); timer = null;
  const max = 1568, k = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement('canvas'); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  stopCamera();
  read(c.toDataURL('image/jpeg', .85));
}

function fromFile(file) {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const max = 1568, k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url); stopCamera(); read(c.toDataURL('image/jpeg', .85));
  };
  img.onerror = () => { URL.revokeObjectURL(url); ctx.toast('Couldn’t open that photo (・x・)'); };
  img.src = url;
}

async function read(dataUrl) {
  shot = dataUrl;
  const d = dialog();
  d.innerHTML = `${head(`${ctx.icon('bills', 26)} Reading your receipt`)}
    <div class="scan-reading"><img class="scan-shot" src="${dataUrl}" alt="Your receipt photo"><div class="scan-wand" aria-hidden="true">✧</div></div>
    <p class="scan-hint" role="status">Yutu is reading every line… ✧</p>`;
  try {
    result = await ctx.scan(dataUrl.split(',')[1], 'image/jpeg');
  } catch (e) {
    showError(e?.message || 'Something went wrong reading the receipt.');
    return;
  }
  if (!result?.isReceipt || !result.items?.length) { showError('That doesn’t look like a receipt Yutu can read. Try again with the whole receipt flat in the frame ✧'); return; }
  result.mode = result.items.length > 1 ? 'items' : 'total';
  result.date = result.date || ctx.today();
  review();
}

function showError(msg) {
  const d = dialog();
  d.innerHTML = `${head(`${ctx.icon('bills', 26)} Scan a receipt`)}
    <p class="scan-error" role="alert">${ctx.esc(msg)}</p>
    <div class="scan-actions"><button type="button" class="btn primary" data-scan="again">Try again ✧</button><button type="button" class="btn ghost" data-scan="close">Close</button></div>`;
}

const sumItems = () => result.items.reduce((s, it) => s + (+it.amount || 0), 0);

function review() {
  const d = dialog(), r = result, m = ctx.money, esc = ctx.esc;
  const catSel = (val, i) => `<select data-item="${i}" data-field="category" aria-label="Category for item ${i + 1}">${ctx.cats.map(c => `<option value="${c.id}" ${c.id === val ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>`;
  const diff = Math.round(((+r.total || 0) - sumItems()) * 100) / 100;
  d.innerHTML = `${head(`${ctx.icon('bills', 26)} Check your receipt`)}
    ${r.demo ? '<p class="scan-demo">Demo mode: this is a sample receipt. In the signed-in app Claude reads your real one ✧</p>' : ''}
    <div class="scan-meta">
      <label class="field"><span>Store</span><input data-field="merchant" value="${esc(r.merchant || '')}" maxlength="60"></label>
      <label class="field"><span>Date</span><input type="date" data-field="date" value="${esc(r.date)}"></label>
    </div>
    <div class="seg scan-mode" role="radiogroup" aria-label="How to log it">
      <label><input type="radio" name="scan-mode" value="items" ${r.mode === 'items' ? 'checked' : ''}><span>Each item</span></label>
      <label><input type="radio" name="scan-mode" value="total" ${r.mode === 'total' ? 'checked' : ''}><span>One total</span></label>
    </div>
    <ul class="scan-items">${r.items.map((it, i) => `<li>
        <input data-item="${i}" data-field="name" value="${esc(it.name)}" maxlength="40" aria-label="Item ${i + 1} name">
        <input data-item="${i}" data-field="amount" inputmode="decimal" value="${(+it.amount).toFixed(2)}" aria-label="Item ${i + 1} price">
        ${catSel(it.category, i)}
        <button type="button" class="icon-btn" data-scan="drop" data-item="${i}" aria-label="Remove item ${i + 1}">✕</button></li>`).join('')}</ul>
    <div class="scan-total"><span>Total paid</span><input data-field="total" inputmode="decimal" value="${(+r.total || sumItems()).toFixed(2)}" aria-label="Total paid"></div>
    ${r.mode === 'items' && Math.abs(diff) >= .01 ? `<p class="tiny">${diff > 0 ? `Tax and fees (${m(diff)})` : `Discounts (${m(-diff)})`} are shared across the items so they add up to the total.</p>` : ''}
    <div class="scan-actions">
      <button type="button" class="btn primary big" data-scan="save">${ctx.icon('heart', 22)} Log ${r.mode === 'items' ? `${r.items.length} item${r.items.length === 1 ? '' : 's'}` : 'the total'}</button>
      <button type="button" class="btn ghost" data-scan="again">Scan again</button>
    </div>`;
}

function onInput(e) {
  const t = e.target;
  if (t.dataset.scan === 'file' && t.files?.[0]) { fromFile(t.files[0]); return; }
  if (!result) return;
  if (t.name === 'scan-mode') { result.mode = t.value; review(); return; }
  const f = t.dataset.field; if (!f) return;
  if (t.dataset.item !== undefined) {
    const it = result.items[+t.dataset.item];
    it[f] = f === 'amount' ? Math.max(0, parseFloat(String(t.value).replace(',', '.')) || 0) : t.value;
  } else result[f] = f === 'total' ? Math.max(0, parseFloat(String(t.value).replace(',', '.')) || 0) : t.value;
}

async function onClick(e) {
  const b = e.target.closest('[data-scan]'); if (!b) return;
  const a = b.dataset.scan;
  if (a === 'close') dialog().close();
  else if (a === 'snap') { const v = $('#scan-dialog .scan-video'); if (v?.videoWidth) capture(v); else $('#scan-dialog input[data-scan=file]')?.click(); }
  else if (a === 'again') openScanner(ctx);
  else if (a === 'drop') { result.items.splice(+b.dataset.item, 1); if (!result.items.length) { openScanner(ctx); return; } review(); }
  else if (a === 'save') await save();
}

async function save() {
  const r = result, total = Math.round((+r.total || sumItems()) * 100) / 100;
  if (!(total > 0)) { ctx.toast('The total needs to be above zero (・x・)'); return; }
  const store = (r.merchant || '').trim();
  let receipt = null;
  try { receipt = await ctx.compress(await (await fetch(shot)).blob()); if (receipt.length > 600000) receipt = null; } catch { receipt = null; }
  let txs;
  if (r.mode === 'total') {
    const byCat = {};
    r.items.forEach(it => { byCat[it.category] = (byCat[it.category] || 0) + (+it.amount || 0); });
    const category = Object.entries(byCat).sort((x, y) => y[1] - x[1])[0]?.[0] || 'other';
    txs = [{ amount: total, category, note: store || 'Receipt' }];
  } else {
    // share tax, fees and discounts across the items in proportion, so the items add up to the total
    const sum = sumItems(), k = sum > 0 ? total / sum : 1;
    txs = r.items.filter(it => +it.amount > 0).map(it => ({ amount: Math.round(it.amount * k * 100) / 100, category: it.category, note: store ? `${it.name} · ${store}` : it.name }));
    const drift = Math.round((total - txs.reduce((s, t) => s + t.amount, 0)) * 100) / 100;
    if (txs.length && drift) txs[0].amount = Math.round((txs[0].amount + drift) * 100) / 100;
  }
  if (receipt && txs.length) txs[0].receipt = receipt;
  dialog().close();
  await ctx.save(txs.map(t => ({ ...t, note: t.note.slice(0, 80), date: r.date || ctx.today() })));
}
