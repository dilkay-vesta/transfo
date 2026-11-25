/* Cœur : dates, stockage (IndexedDB + sauvegarde compte), calculs dérivés. */
(function () {
  const T = window.T;

  /* ---------- Dates ---------- */
  const pad = n => String(n).padStart(2, '0');
  const key = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => key(new Date());
  const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return key(d); };
  const weekday = k => parse(k).getDay();
  const weekStart = k => addDays(k, -((weekday(k) + 6) % 7));
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const range = (from, to) => { const out = []; for (let k = from; k <= to; k = addDays(k, 1)) out.push(k); return out; };
  const fmt = {
    num: n => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(n || 0),
    int: n => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n || 0)),
    long: k => parse(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    short: k => parse(k).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    dm: k => { const d = parse(k); return d.getDate() + '/' + pad(d.getMonth() + 1); },
    month: k => parse(k).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    dur: s => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m + ':' + pad(s % 60); },
    hm: min => { min = Math.round(min); const h = Math.floor(min / 60); return h ? h + ' h ' + pad(min % 60) : min + ' min'; },
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

  /* ---------- Programme (modifiable) ---------- */
  const BASE = { tpl: JSON.parse(JSON.stringify(T.TPL)), order: T.TPL_ORDER.slice(), ex: Object.assign({}, T.EX) };
  T.BASE = BASE;
  function syncProgram() {
    const st = Store.state.settings, pr = st.program;
    T.EX = Object.assign({}, BASE.ex, st.customEx || {});
    if (pr && pr.tpls) { T.TPL = pr.tpls; T.TPL_ORDER = (pr.order || []).filter(id => pr.tpls[id] && !pr.tpls[id].hidden); }
    else { T.TPL = BASE.tpl; T.TPL_ORDER = BASE.order.slice(); }
  }
  const tplHasAbs = id => !!(T.TPL[id] && T.TPL[id].ex.some(e => T.EX[e[0]] && T.EX[e[0]].t === 'a'));

  /* ---------- État ---------- */
  const emptyState = () => ({ v: 1, updatedAt: 0, settings: T.defaultSettings(), days: {}, sessions: [], body: [], favorites: [], meals: [], seenLevel: 0 });
  function normalize(s) {
    const base = emptyState();
    s = Object.assign(base, s || {});
    s.settings = Object.assign(T.defaultSettings(), s.settings || {});
    s.settings.goals = Object.assign(T.defaultSettings().goals, s.settings.goals || {});
    s.settings.rest = Object.assign(T.defaultSettings().rest, s.settings.rest || {});
    if (!Array.isArray(s.settings.reminders)) s.settings.reminders = T.defaultSettings().reminders;
    return s;
  }

  const Store = {
    state: emptyState(), ver: 0, listeners: new Set(), storage: 'memory', cloud: { status: 'off', at: 0, msg: '' }, ready: false,
    sub(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    emit() { syncProgram(); this.ver++; this.listeners.forEach(f => f(this.ver)); },
    act(fn, opts) {
      const before = opts && opts.undo ? JSON.stringify(this.state) : null;
      fn(this.state);
      this.state.updatedAt = Date.now();
      this.emit(); scheduleSave();
      return before;
    },
    restore(json) { this.state = normalize(JSON.parse(json)); this.state.updatedAt = Date.now(); this.emit(); scheduleSave(); },
    replace(s) { this.state = normalize(s); this.state.updatedAt = Date.now(); this.emit(); scheduleSave(); },
    day(k, create) {
      let d = this.state.days[k];
      if (!d && create) d = this.state.days[k] = {};
      return d || {};
    },
  };

  /* ---------- IndexedDB ---------- */
  let idb = null;
  function idbOpen() {
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open('transfo', 1);
        r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos', { keyPath: 'id' }); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
      } catch (e) { rej(e); }
    });
  }
  const tx = (store, mode, fn) => new Promise((res, rej) => {
    const t = idb.transaction(store, mode); const os = t.objectStore(store); const r = fn(os);
    t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  });
  const Photos = {
    available: () => !!idb,
    all: () => idb ? tx('photos', 'readonly', os => os.getAll()) : Promise.resolve([]),
    put: p => tx('photos', 'readwrite', os => os.put(p)),
    del: id => tx('photos', 'readwrite', os => os.delete(id)),
    clear: () => idb ? tx('photos', 'readwrite', os => os.clear()) : Promise.resolve(),
  };

  let saveTimer = null;
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveLocal, 250); scheduleCloud(); }
  async function saveLocal() {
    const json = JSON.stringify(Store.state);
    try {
      if (idb) { await tx('kv', 'readwrite', os => os.put(json, 'state')); return; }
    } catch (e) { /* bascule ci-dessous */ }
    try { localStorage.setItem('transfo-state', json); Store.storage = 'localStorage'; } catch (e) { Store.storage = 'memory'; }
  }
  window.addEventListener('pagehide', () => { clearTimeout(saveTimer); saveLocal(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(saveTimer); saveLocal(); flushCloud(); } });

  async function loadLocal() {
    try { idb = await idbOpen(); Store.storage = 'indexeddb'; } catch (e) { idb = null; }
    let json = null;
    try { if (idb) json = await tx('kv', 'readonly', os => os.get('state')); } catch (e) { }
    if (!json) { try { json = localStorage.getItem('transfo-state'); if (!idb && json) Store.storage = 'localStorage'; } catch (e) { } }
    if (!idb && Store.storage !== 'localStorage') { try { localStorage.setItem('transfo-probe', '1'); Store.storage = 'localStorage'; } catch (e) { Store.storage = 'memory'; } }
    if (json) { try { Store.state = normalize(JSON.parse(json)); } catch (e) { } }
    if (!Store.state.settings.startDate) Store.state.settings.startDate = today();
    syncProgram();
  }

  /* ---------- Sauvegarde sur le compte (capacité db, sous-arbre privé) ---------- */
  let col = null, lastSynced = {}, cloudTimer = null, pushing = false, again = false;
  function partition(s) {
    const out = { core: { settings: s.settings, favorites: s.favorites, meals: s.meals, seenLevel: s.seenLevel }, body: { body: s.body } };
    for (const k in s.days) { const m = 'd-' + k.slice(0, 7); (out[m] = out[m] || { days: {} }).days[k] = s.days[k]; }
    for (const x of s.sessions) { const m = 's-' + x.date.slice(0, 7); (out[m] = out[m] || { sessions: [] }).sessions.push(x); }
    return out;
  }
  function applySlice(s, id, data) {
    if (id === 'core') { s.settings = data.settings || s.settings; s.favorites = data.favorites || []; s.meals = data.meals || []; s.seenLevel = data.seenLevel || 0; }
    else if (id === 'body') s.body = data.body || [];
    else if (id.startsWith('d-')) { const m = id.slice(2); for (const k of Object.keys(s.days)) if (k.startsWith(m)) delete s.days[k]; Object.assign(s.days, data.days || {}); }
    else if (id.startsWith('s-')) { const m = id.slice(2); s.sessions = s.sessions.filter(x => !x.date.startsWith(m)).concat(data.sessions || []); }
  }
  function scheduleCloud() { if (!col) return; clearTimeout(cloudTimer); cloudTimer = setTimeout(flushCloud, 1800); }
  async function flushCloud() {
    if (!col) return;
    if (pushing) { again = true; return; }
    pushing = true;
    try {
      const parts = partition(Store.state);
      const ids = new Set([...Object.keys(parts), ...Object.keys(lastSynced)]);
      for (const id of ids) {
        const data = parts[id] || (id.startsWith('d-') ? { days: {} } : id.startsWith('s-') ? { sessions: [] } : null);
        if (!data) continue;
        const str = JSON.stringify(data);
        if (lastSynced[id] === str) continue;
        await col.doc(id).set({ updatedAt: Date.now(), data: JSON.parse(str) });
        lastSynced[id] = str;
      }
      Store.cloud = { status: 'ok', at: Date.now(), msg: '' };
    } catch (e) {
      Store.cloud = { status: 'error', at: Store.cloud.at, msg: e && e.code === 'quota_exceeded' ? 'Espace de sauvegarde plein : exporte tes données.' : 'Sauvegarde du compte momentanément impossible, nouvel essai automatique.' };
      if (!e || e.code !== 'quota_exceeded') setTimeout(scheduleCloud, 15000);
    }
    pushing = false; Store.emit();
    if (again) { again = false; flushCloud(); }
  }
  async function initCloud() {
    if (!window.claude || !window.claude.use) { Store.cloud = { status: 'off', at: 0, msg: '' }; return; }
    Store.cloud = { status: 'connecting', at: 0, msg: '' }; Store.emit();
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      const id = user && await user.id();
      if (!db || !id) { Store.cloud = { status: 'off', at: 0, msg: 'Sauvegarde du compte indisponible ici : données sur cet appareil uniquement.' }; Store.emit(); return; }
      const c = db.collection('data/users/' + id);
      const snap = await Promise.race([c.get(), new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), 12000))]);
      const localAt = Store.state.updatedAt || 0;
      let changed = false;
      for (const d of snap.docs) {
        const body = d.data(); if (!body || !body.data) continue;
        if ((body.updatedAt || 0) > localAt) { applySlice(Store.state, d.id, body.data); changed = true; }
        lastSynced[d.id] = JSON.stringify(body.data);
      }
      if (changed) { Store.state = normalize(Store.state); syncProgram(); saveLocal(); }
      col = c; Store.cloud = { status: 'ok', at: Date.now(), msg: '' };
      Store.emit(); flushCloud();
    } catch (e) {
      Store.cloud = { status: 'error', at: 0, msg: 'Sauvegarde du compte injoignable pour le moment : tes données restent enregistrées sur cet appareil.' }; Store.emit();
    }
  }

  async function boot() {
    await loadLocal();
    try { if (navigator.storage && navigator.storage.persist) Store.persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist()); } catch (e) { }
    Store.ready = true; Store.emit();
    initCloud();
  }

  /* ---------- Calculs dérivés ---------- */
  const S = () => Store.state;
  const planFor = k => { const d = S().days[k]; const p = (d && d.plan) || S().settings.schedule[weekday(k)] || 'rest'; return p !== 'rest' && (!T.TPL[p] || T.TPL[p].hidden) ? 'rest' : p; };
  const sessionsOn = k => S().sessions.filter(x => x.date === k);
  const doneSessionsOn = k => S().sessions.filter(x => x.date === k && x.done);
  const sum = (a, f) => a.reduce((t, x) => t + (f ? f(x) : x), 0);
  const dayTotals = k => {
    const d = S().days[k] || {};
    const food = d.food || [];
    return {
      steps: d.steps || 0,
      water: sum(d.water || [], w => w.ml),
      kcal: sum(food, f => +f.kcal || 0),
      protein: sum(food, f => +f.prot || 0),
      foodCount: food.length,
      sleepH: d.checkin && d.checkin.sleepH,
      checkin: !!(d.checkin && (d.checkin.energy || d.checkin.sleepQ || d.checkin.motivation || d.checkin.soreness)),
      cardio: d.cardio || [],
      weight: (S().body.find(b => b.date === k && b.weight) || {}).weight,
    };
  };

  function checklist(k) {
    const st = S().settings, g = st.goals, d = S().days[k] || {}, t = dayTotals(k), ov = d.checks || {};
    const plan = planFor(k), wd = weekday(k), items = [];
    const SH = { steps: 'Pas', workout: 'Séance', kcal: 'Calories', protein: 'Protéines', water: 'Eau', sleep: 'Sommeil' };
    const add = (id, label, auto, ratio, weight, detail) => {
      const done = ov[id] !== undefined ? !!ov[id] : auto;
      items.push({ id, label, auto, done, manual: ov[id] !== undefined, short: SH[id] || label, ratio: Math.max(0, Math.min(1, ratio)), weight, detail });
    };
    add('steps', 'Objectif de pas', t.steps >= g.steps, t.steps / g.steps, 20, fmt.int(t.steps) + ' / ' + fmt.int(g.steps));
    if (plan !== 'rest') {
      const ds = doneSessionsOn(k);
      add('workout', 'Séance ' + T.TPL[plan].name, ds.length > 0, ds.length ? 1 : (sessionsOn(k).length ? 0.4 : 0), 25, ds.length ? 'Terminée' : 'Prévue');
    }
    const kr = g.kcal ? t.kcal / g.kcal : 0;
    add('kcal', 'Objectif calorique', t.kcal >= g.kcal * 0.9 && t.kcal <= g.kcal * 1.08, kr > 1.08 ? Math.max(0, 1 - (kr - 1.08) * 3) : kr / 0.9, 20, fmt.int(t.kcal) + ' / ' + fmt.int(g.kcal) + ' kcal');
    add('protein', 'Objectif de protéines', t.protein >= g.protein, t.protein / g.protein, 15, fmt.int(t.protein) + ' / ' + g.protein + ' g');
    add('water', 'Hydratation', t.water >= g.water, t.water / g.water, 10, fmt.num(t.water / 1000) + ' / ' + fmt.num(g.water / 1000) + ' L');
    add('sleep', 'Sommeil', (t.sleepH || 0) >= g.sleep, (t.sleepH || 0) / g.sleep, 10, t.sleepH ? fmt.num(t.sleepH) + ' h / ' + fmt.num(g.sleep) + ' h' : 'À renseigner au check-in');
    if ((st.supplements || '').trim()) add('supps', 'Compléments', false, 0, 0, st.supplements.trim());
    if (plan === 'rest' && (st.mobilityDays || []).includes(wd)) add('mobility', 'Mobilité 10–15 min', false, 0, 0, 'Hanches, épaules, dos');
    return { items, plan };
  }

  function score(k) {
    const { items, plan } = checklist(k);
    let pts = 0; const parts = [];
    for (const it of items) {
      if (!it.weight) continue;
      const p = it.done ? it.weight : Math.round(it.weight * it.ratio * 0.8);
      pts += p; parts.push({ id: it.id, label: it.short, pts: p, max: it.weight });
    }
    if (plan === 'rest') { pts += 25; parts.push({ id: 'rest', label: 'Récupération', pts: 25, max: 25 }); }
    return { score: Math.min(100, Math.round(pts)), parts, plan };
  }
  const hasData = k => { const d = S().days[k]; return !!(d && (d.steps || (d.water && d.water.length) || (d.food && d.food.length) || d.checkin || (d.cardio && d.cardio.length) || (d.checks && Object.keys(d.checks).length))) || sessionsOn(k).length > 0 || S().body.some(b => b.date === k); };
  const dayValid = k => score(k).score >= (planFor(k) === 'rest' ? 50 : 60);

  function streaks() {
    const t = today(), start = S().settings.startDate || t;
    let cur = 0, k = dayValid(t) ? t : addDays(t, -1);
    while (k >= start && dayValid(k)) { cur++; k = addDays(k, -1); }
    let best = 0, run = 0;
    for (const d of range(start, t)) { if (dayValid(d)) { run++; best = Math.max(best, run); } else if (d !== t) run = 0; }
    return { cur, best: Math.max(best, cur) };
  }

  /* Records : calculés uniquement à partir des séries validées */
  const e1rm = (w, r) => w > 0 ? w * (1 + r / 30) : 0;
  function records() {
    const by = {}, events = [];
    const sorted = S().sessions.slice().sort((a, b) => (a.date + (a.startedAt || 0)).localeCompare(b.date + (b.startedAt || 0)));
    for (const s of sorted) {
      for (const e of s.exercises || []) {
        const sets = (e.sets || []).filter(x => x.done && +x.r > 0);
        if (!sets.length) continue;
        const r = by[e.id] = by[e.id] || { w: null, e1: null, reps: null, vol: null, hist: [] };
        const bestSet = sets.reduce((a, x) => e1rm(+x.w || 0, +x.r) > e1rm(+a.w || 0, +a.r) ? x : a, sets[0]);
        const maxW = Math.max(...sets.map(x => +x.w || 0));
        const maxR = Math.max(...sets.map(x => +x.r));
        const vol = sum(sets, x => (+x.w || 0) * +x.r);
        const e1 = e1rm(+bestSet.w || 0, +bestSet.r);
        r.hist.push({ date: s.date, sid: s.id, maxW, maxR, vol, e1, sets: sets.map(x => ({ w: +x.w || 0, r: +x.r })) });
        const check = (field, v, extra) => {
          if (!(v > 0)) return;
          if (!r[field] || v > r[field].v + 1e-9) { if (r[field]) events.push({ date: s.date, sid: s.id, ex: e.id, kind: field, v, prev: r[field].v }); r[field] = Object.assign({ v, date: s.date }, extra); }
        };
        check('w', maxW, { r: Math.max(...sets.filter(x => (+x.w || 0) === maxW).map(x => +x.r)) });
        check('e1', e1, { w: +bestSet.w || 0, r: +bestSet.r });
        check('reps', maxR, {});
        check('vol', vol, {});
      }
    }
    /* Un même exercice dans une même séance ne compte qu’un record pour l’XP */
    const prs = []; const seen = new Set();
    for (const ev of events) { if (ev.kind === 'vol') continue; const id = ev.sid + ev.ex; if (!seen.has(id)) { seen.add(id); prs.push(ev); } }
    return { by, events, prs };
  }

  function lastPerf(exId, beforeSessionId) {
    const list = S().sessions.filter(s => s.id !== beforeSessionId && (s.exercises || []).some(e => e.id === exId && (e.sets || []).some(x => x.done)));
    list.sort((a, b) => (b.date + (b.startedAt || 0)).localeCompare(a.date + (a.startedAt || 0)));
    if (!list.length) return null;
    const e = list[0].exercises.find(e => e.id === exId);
    return { date: list[0].date, sets: e.sets.filter(x => x.done).map(x => ({ w: +x.w || 0, r: +x.r || 0 })) };
  }

  function suggestion(exId, sets, lo, hi, beforeSessionId) {
    const lp = lastPerf(exId, beforeSessionId); if (!lp) return null;
    const ex = T.EX[exId]; const unit = ex.unit === 'sec' ? ' s' : '';
    const done = lp.sets; const reps = done.map(x => x.r).join(' / ');
    if (done.length >= sets && done.every(x => x.r >= hi)) {
      if (ex.unit === 'sec' || ex.bw && !done.some(x => x.w > 0)) return { kind: 'up', text: 'Tu as atteint ' + reps + unit + '. Tu peux augmenter la difficulté (lest, tempo plus lent).' };
      const inc = ex.t === 'c' ? 2.5 : (ex.t === 'a' ? 2.5 : 1);
      return { kind: 'up', text: 'Tu as atteint ' + reps + unit + '. Tu peux envisager d’augmenter la charge (+' + fmt.num(inc) + ' à ' + fmt.num(inc * 2) + ' kg).' };
    }
    if (done.some(x => x.r < lo)) return { kind: 'hold', text: 'Dernière fois : ' + reps + unit + '. Garde la charge et vise ' + lo + ' reps minimum sur chaque série.' };
    return { kind: 'keep', text: 'Dernière fois : ' + reps + unit + '. Vise une répétition de plus sur au moins une série.' };
  }

  function missionsFor(ws) {
    const n = Math.floor(diffDays('2024-01-01', ws) / 7);
    const pool = ['steps70k', 'abs2', 'food5', 'protein5', 'pr2', 'cardio2', 'weigh3', 'water5', 'checkin5'];
    let seed = (n * 9301 + 49297) % 233280; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const pick = pool.slice().sort(() => rnd() - 0.5).slice(0, 4);
    return [(n % 2 ? 'ppl6' : 'sessions4'), ...pick];
  }
  function missionProgress(id, ws, recs) {
    const days = range(ws, addDays(ws, 6)), g = S().settings.goals;
    const done = S().sessions.filter(s => s.done && s.date >= ws && s.date <= days[6]);
    switch (id) {
      case 'sessions4': return done.length;
      case 'ppl6': return new Set(done.map(s => s.tpl).filter(id => T.TPL_ORDER.includes(id))).size;
      case 'steps70k': return sum(days, k => dayTotals(k).steps);
      case 'abs2': return done.filter(s => tplHasAbs(s.tpl)).length;
      case 'food5': return days.filter(k => dayTotals(k).foodCount > 0).length;
      case 'protein5': return days.filter(k => dayTotals(k).protein >= g.protein).length;
      case 'pr2': return (recs || records()).prs.filter(p => p.date >= ws && p.date <= days[6]).length;
      case 'cardio2': return sum(days, k => dayTotals(k).cardio.length);
      case 'weigh3': return new Set(S().body.filter(b => b.weight && b.date >= ws && b.date <= days[6]).map(b => b.date)).size;
      case 'water5': return days.filter(k => dayTotals(k).water >= g.water).length;
      case 'checkin5': return days.filter(k => dayTotals(k).checkin).length;
    }
    return 0;
  }
  function weekMissions(ws, recs) {
    return missionsFor(ws).map(id => { let m = T.MISSIONS[id]; if (id === 'ppl6') m = { ...m, label: 'Réaliser les ' + T.TPL_ORDER.length + ' séances du programme', target: Math.max(1, T.TPL_ORDER.length) }; const v = missionProgress(id, ws, recs); return { id, ...m, v, done: v >= m.target }; });
  }

  /* XP entièrement dérivée des données : cocher/décocher ne peut pas en générer à l’infini */
  function xp() {
    const t = today(), start = S().settings.startDate || t; const recs = records(); let total = 0;
    const firstData = Object.keys(S().days).concat(S().sessions.map(s => s.date), S().body.map(b => b.date)).sort()[0];
    const from = firstData && firstData < start ? firstData : start;
    for (const k of range(from, t)) {
      if (!hasData(k)) continue;
      const { items } = checklist(k); const sc = score(k).score; const tt = dayTotals(k);
      for (const it of items) if (it.done) total += ({ steps: 15, kcal: 10, protein: 15, water: 10, sleep: 10, supps: 3, mobility: 8 })[it.id] || 0;
      if (tt.checkin) total += 5;
      total += Math.min(2, tt.cardio.length) * 15;
      if (tt.weight) total += 5;
      if (sc >= 80) total += 10;
    }
    total += S().sessions.filter(s => s.done).length * 50;
    total += recs.prs.length * 20;
    for (let ws = weekStart(from); ws <= t; ws = addDays(ws, 7)) for (const m of weekMissions(ws, recs)) if (m.done) total += m.xp;
    return total;
  }
  function level(x) {
    let i = 0; while (i + 1 < T.LEVELS.length && x >= T.LEVELS[i + 1][0]) i++;
    const cur = T.LEVELS[i][0], next = T.LEVELS[i + 1] ? T.LEVELS[i + 1][0] : null;
    return { n: i + 1, name: T.LEVELS[i][1], xp: x, cur, next, ratio: next ? (x - cur) / (next - cur) : 1 };
  }

  function weightSeries() {
    return S().body.filter(b => b.weight).sort((a, b) => a.date.localeCompare(b.date)).map(b => ({ x: b.date, y: +b.weight }));
  }
  function movingAvg(series, days) {
    return series.map(p => { const from = addDays(p.x, -(days - 1)); const w = series.filter(q => q.x >= from && q.x <= p.x); return { x: p.x, y: sum(w, q => q.y) / w.length }; });
  }

  function stats() {
    const t = today(), s = S(), start = s.settings.startDate || t;
    const done = s.sessions.filter(x => x.done);
    const ws = weekStart(t);
    const plannedPast = range(start, t).filter(k => planFor(k) !== 'rest' && (k < t || doneSessionsOn(k).length));
    const doneDays = new Set(done.map(x => x.date));
    const allDays = Object.keys(s.days).sort();
    const avg = (f, filt) => { const v = allDays.map(k => f(dayTotals(k))).filter(filt || (x => x > 0)); return v.length ? sum(v) / v.length : null; };
    const ws_ = weightSeries();
    const waist = s.body.filter(b => b.waist).sort((a, b) => a.date.localeCompare(b.date));
    const time = sum(done, x => x.finishedAt && x.startedAt ? (x.finishedAt - x.startedAt) / 60000 : 0);
    return {
      total: done.length, week: done.filter(x => x.date >= ws).length,
      regularity: plannedPast.length ? Math.round(100 * plannedPast.filter(k => doneDays.has(k)).length / plannedPast.length) : null,
      steps: avg(x => x.steps), kcal: avg(x => x.kcal), protein: avg(x => x.protein), water: avg(x => x.water),
      startW: s.settings.startWeight, curW: ws_.length ? ws_[ws_.length - 1].y : null,
      waist0: waist.length ? +waist[0].waist : null, waist1: waist.length ? +waist[waist.length - 1].waist : null,
      time, cardio: sum(allDays, k => dayTotals(k).cardio.length),
    };
  }

  window.Core = { syncProgram, tplHasAbs, Store, Photos, boot, key, parse, today, addDays, weekday, weekStart, diffDays, range, fmt, uid, cap, planFor, sessionsOn, doneSessionsOn, dayTotals, checklist, score, streaks, records, lastPerf, suggestion, weekMissions, xp, level, weightSeries, movingAvg, stats, hasData, sum, e1rm, emptyState, normalize, flushCloud };
})();
