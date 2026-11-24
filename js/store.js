// Data layer. Two interchangeable stores with the same API:
//  • cloud: Firebase Auth + Firestore (synced across devices, works offline)
//  • local: browser storage only (demo mode, used until Firebase is configured)
import { FIREBASE_CONFIG } from './firebase-config.js';

export const DEFAULT_SETTINGS = {
  name: '',
  currency: 'USD',
  savingsTarget: 100,
  reduceMotion: false,
  theme: 'sakura',
  sparkles: true,
  sound: true,
  play: {},
  bills: [],
  wishes: [],
  debts: [],
  challenges: {},
  split: { needs: 50, wants: 30, save: 20, pay: '' },
  efund: { months: 3 },
  budgets: { food: 250, fun: 80, shopping: 100, transport: 60, school: 80, bills: 150, selfcare: 40, other: 40 },
};

export const isCloudConfigured = () =>
  !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !String(FIREBASE_CONFIG.apiKey).startsWith('PASTE'));

const withDefaults = (s = {}) => ({ ...DEFAULT_SETTINGS, ...s, budgets: { ...DEFAULT_SETTINGS.budgets, ...(s.budgets || {}) } });

export async function createStore({ onData, onAuth }) {
  if (isCloudConfigured()) {
    try { return await cloudStore({ onData, onAuth }); }
    catch (e) { console.error('Firebase failed to load, falling back to demo mode', e); }
  }
  return localStore({ onData, onAuth });
}

/* ---------------- local (demo) ---------------- */
function localStore({ onData, onAuth }) {
  const KEY = 'moonbun-money-v1';
  let state = { transactions: [], goals: [], settings: withDefaults() };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) state = { transactions: saved.transactions || [], goals: saved.goals || [], settings: withDefaults(saved.settings) };
  } catch { /* storage unavailable: keep in memory */ }
  const emit = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
    onData(structuredClone(state));
  };
  setTimeout(() => { onAuth({ mode: 'local' }); onData(structuredClone(state)); });
  return {
    mode: 'local',
    async addTx(t) { state.transactions.push(t); emit(); },
    async deleteTx(id) { state.transactions = state.transactions.filter(t => t.id !== id); emit(); },
    async addGoal(g) { state.goals.push(g); emit(); },
    async updateGoal(id, patch) { state.goals = state.goals.map(g => g.id === id ? { ...g, ...patch } : g); emit(); },
    async deleteGoal(id) { state.goals = state.goals.filter(g => g.id !== id); emit(); },
    async saveSettings(patch) { state.settings = withDefaults({ ...state.settings, ...patch }); emit(); },
    async signOut() {},
  };
}

/* ---------------- cloud (Firebase) ---------------- */
async function cloudStore({ onData, onAuth }) {
  const base = 'https://www.gstatic.com/firebasejs/10.12.2';
  const [appMod, authMod, fs] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
  ]);
  const app = appMod.initializeApp(FIREBASE_CONFIG);
  const auth = authMod.getAuth(app);
  let db;
  try {
    db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
  } catch { db = fs.getFirestore(app); }

  let uid = null;
  let unsubs = [];
  let state = { transactions: [], goals: [], settings: withDefaults() };
  const emit = () => onData(structuredClone(state));
  const col = name => fs.collection(db, 'users', uid, name);
  const settingsRef = () => fs.doc(db, 'users', uid, 'meta', 'settings');
  const clean = obj => Object.fromEntries(Object.entries(obj).filter(([k, v]) => k !== 'id' && v !== undefined));

  authMod.onAuthStateChanged(auth, user => {
    unsubs.forEach(u => u()); unsubs = [];
    state = { transactions: [], goals: [], settings: withDefaults() };
    if (!user) { uid = null; onAuth(null); return; }
    uid = user.uid;
    onAuth({ mode: 'cloud', email: user.email, name: user.displayName });
    const err = e => console.error('Sync error', e);
    unsubs.push(fs.onSnapshot(col('transactions'), snap => { state.transactions = snap.docs.map(d => ({ id: d.id, ...d.data() })); emit(); }, err));
    unsubs.push(fs.onSnapshot(col('goals'), snap => { state.goals = snap.docs.map(d => ({ id: d.id, ...d.data() })); emit(); }, err));
    unsubs.push(fs.onSnapshot(settingsRef(), snap => { state.settings = withDefaults(snap.exists() ? snap.data() : {}); emit(); }, err));
  });

  return {
    mode: 'cloud',
    addTx: t => fs.setDoc(fs.doc(col('transactions'), t.id), clean(t)),
    deleteTx: id => fs.deleteDoc(fs.doc(col('transactions'), id)),
    addGoal: g => fs.setDoc(fs.doc(col('goals'), g.id), clean(g)),
    updateGoal: (id, patch) => fs.updateDoc(fs.doc(col('goals'), id), clean(patch)),
    deleteGoal: id => fs.deleteDoc(fs.doc(col('goals'), id)),
    // mergeFields replaces each top-level field we send (so removed diary entries really go away)
    saveSettings: patch => { const data = clean(patch); return fs.setDoc(settingsRef(), data, { mergeFields: Object.keys(data) }); },
    signIn: (email, pw) => authMod.signInWithEmailAndPassword(auth, email, pw),
    signUp: (email, pw) => authMod.createUserWithEmailAndPassword(auth, email, pw),
    signInGoogle: () => authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider()),
    resetPassword: email => authMod.sendPasswordResetEmail(auth, email),
    signOut: () => authMod.signOut(auth),
  };
}
