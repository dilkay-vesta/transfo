/* Écrans de l'application. */
(function () {
  const { html, render, useState, useEffect, useRef, useMemo } = htmPreact;
  const C = Core, Store = C.Store, T = window.T;
  const { Icon, Ring, Bar, LineChart, BarChart, Sheet, toast, Toasts, Seg, Num, Field, Empty, Confirm, unlockAudio, beep, buzz } = UI;
  const S = () => Store.state;
  const act = (fn, undo) => Store.act(fn, undo ? { undo: true } : undefined);

  /* Mémoïsation par version de l'état */
  let mv = -1, mc = {};
  const M = (n, fn) => { if (mv !== Store.ver) { mv = Store.ver; mc = {}; } if (!(n in mc)) mc[n] = fn(); return mc[n]; };
  const recs = () => M('recs', C.records);
  const xpNow = () => M('xp', C.xp);
  const streak = () => M('streak', C.streaks);

  /* Navigation */
  const V = { s: { tab: 'home', sub: null, date: null, workout: null, rest: null, progSeg: 'body' }, fns: new Set(), set(p) { Object.assign(this.s, p); this.fns.forEach(f => f()); } };
  try { const t = localStorage.getItem('transfo-tab'); if (t) V.s.tab = t; } catch (e) { }
  if (location.hash === '#train') V.s.tab = 'train';
  const go = (tab, sub = null) => { V.set({ tab, sub }); try { localStorage.setItem('transfo-tab', tab); } catch (e) { } window.scrollTo(0, 0); };
  const D = () => V.s.date || C.today();
  const isToday = () => D() === C.today();

  /* ---------- Séances ---------- */
  function startSession(tpl, date) {
    date = date || C.today();
    const open = S().sessions.find(s => !s.done && s.date === date && s.tpl === tpl);
    if (open) { V.set({ workout: open.id }); return; }
    const id = C.uid();
    act(s => {
      s.sessions.push({
        id, date, tpl, startedAt: Date.now(), done: false,
        exercises: T.TPL[tpl].ex.map(([ex, n, lo, hi]) => {
          const lp = C.lastPerf(ex);
          return { id: ex, n, lo, hi, completed: false, sets: Array.from({ length: n }, (_, i) => ({ w: lp ? (lp.sets[i] || lp.sets[lp.sets.length - 1]).w || '' : '', r: '', done: false })) };
        }),
      });
    });
    V.set({ workout: id });
  }
  const openSessionToday = () => S().sessions.find(s => !s.done && s.date === C.today());
  const sessVolume = s => C.sum(s.exercises || [], e => C.sum((e.sets || []).filter(x => x.done), x => (+x.w || 0) * (+x.r || 0)));
  const sessSets = s => C.sum(s.exercises || [], e => (e.sets || []).filter(x => x.done).length);

  /* ---------- En-tête & navigation ---------- */
  const TABS = [['home', 'Accueil', 'home'], ['train', 'Entraînement', 'dumbbell'], ['prog', 'Progression', 'chart'], ['goals', 'Objectifs', 'target'], ['profile', 'Profil', 'user']];
  const Nav = () => html`<nav class="nav" aria-label="Navigation principale">
    <div class="brand"><span class="logo"><${Icon} n="bolt" s=${16} w=${2.2} /></span>Transfo</div>
    ${TABS.map(([id, l, ic]) => html`<button class=${V.s.tab === id ? 'on' : ''} aria-current=${V.s.tab === id ? 'page' : null} onClick=${() => go(id)}><${Icon} n=${ic} s=${22} /><span>${l}</span></button>`)}
  </nav>`;

  const PageHead = ({ title, back, right }) => html`<header class="ph">${back && html`<button class="icon-btn" onClick=${back} aria-label="Retour"><${Icon} n="left" /></button>`}<h1>${title}</h1><div class="sp"></div>${right}</header>`;

  /* ---------- ACCUEIL ---------- */
  const scoreMsg = (sc, rest) => sc >= 95 ? 'Journée parfaite. C’est comme ça qu’on se transforme.' : sc >= 75 ? 'Excellente journée, termine en beauté.' : sc >= 50 ? (rest ? 'Récupération bien gérée, continue.' : 'Belle régularité, tu y es presque.') : sc >= 25 ? 'Bon départ, garde le rythme.' : (rest ? 'Jour de repos : bouge un peu, mange bien, dors bien.' : 'La journée commence. Une action à la fois.');

  function Home() {
    const k = D(), st = S().settings, lv = C.level(xpNow()), sk = streak();
    const sc = C.score(k), cl = C.checklist(k);
    const hour = new Date().getHours();
    const hello = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    return html`<div class="page">
      <header class="home-h">
        <div class="hh-t">
          <p class="muted">${C.cap(C.fmt.long(C.today()))}</p>
          <h1>${hello}${st.name ? ', ' + st.name : ''}</h1>
        </div>
        <button class="avatar" onClick=${() => go('goals')} aria-label=${'Niveau ' + lv.n}><${Ring} v=${lv.ratio} size=${52} sw=${4}><b>${lv.n}</b><//></button>
      </header>
      <div class="pills">
        <button class="pill" onClick=${() => go('goals')}><${Icon} n="star" s=${16} />Niv. ${lv.n} · ${lv.name}</button>
        <button class="pill" onClick=${() => go('goals')}><${Icon} n="bolt" s=${16} />${C.fmt.int(lv.xp)} XP</button>
        <button class=${'pill' + (sk.cur ? ' hot' : '')} onClick=${() => go('goals')}><${Icon} n="flame" s=${16} />${sk.cur} j de série</button>
      </div>
      ${!isToday() && html`<div class="banner"><${Icon} n="calendar" s=${18} /><span>Tu modifies le <b>${C.fmt.long(k)}</b></span><button class="btn small" onClick=${() => V.set({ date: null })}>Aujourd’hui</button></div>`}
      <div class="day-nav">
        <button class="icon-btn" onClick=${() => V.set({ date: C.addDays(k, -1) })} aria-label="Jour précédent"><${Icon} n="left" /></button>
        <span>${isToday() ? 'Aujourd’hui' : C.cap(C.fmt.long(k))}</span>
        <button class="icon-btn" disabled=${isToday()} onClick=${() => { const n = C.addDays(k, 1); V.set({ date: n >= C.today() ? null : n }); }} aria-label="Jour suivant"><${Icon} n="right" /></button>
      </div>
      <div class="cols">
        <div class="col">
          <${ScoreCard} sc=${sc} />
          <${Checklist} k=${k} cl=${cl} />
        </div>
        <div class="col">
          <${TodaySession} k=${k} />
          <div class="tiles">
            <${StepsTile} k=${k} /><${WaterTile} k=${k} /><${FoodTile} k=${k} /><${CheckinTile} k=${k} />
          </div>
          <${MissionsPreview} />
        </div>
      </div>
    </div>`;
  }

  function ScoreCard({ sc }) {
    const rest = sc.plan === 'rest';
    return html`<section class="card score-card">
      <${Ring} v=${sc.score / 100} size=${132} sw=${11}><b class="big">${sc.score}</b><small>/ 100</small><//>
      <div class="sc-r">
        <h2>Score du jour</h2>
        <p class="msg">${scoreMsg(sc.score, rest)}</p>
        <ul class="parts">${sc.parts.map(p => html`<li><span>${p.label}</span><${Bar} v=${p.pts / p.max} thin /><em>${p.pts}/${p.max}</em></li>`)}</ul>
      </div>
    </section>`;
  }

  function Checklist({ k, cl }) {
    const toggle = it => { buzz(); act(s => { const d = s.days[k] = s.days[k] || {}; d.checks = d.checks || {}; const nv = !it.done; if (nv === it.auto) delete d.checks[it.id]; else d.checks[it.id] = nv; }); };
    const doneN = cl.items.filter(i => i.done).length;
    return html`<section class="card">
      <div class="card-h"><h2>À faire ${isToday() ? 'aujourd’hui' : 'ce jour-là'}</h2><span class="muted">${doneN}/${cl.items.length}</span></div>
      <ul class="checks">${cl.items.map(it => html`<li class=${it.done ? 'done' : ''}>
        <button class="cbox" role="checkbox" aria-checked=${it.done} onClick=${() => toggle(it)} aria-label=${it.label}><${Icon} n="check" s=${16} w=${3} /></button>
        <div class="ct" onClick=${() => toggle(it)}><b>${it.label}</b><small>${it.detail}${it.manual ? ' · validé manuellement' : it.auto && it.done ? ' · auto' : ''}</small></div>
        ${it.weight ? html`<em class="ptsb">+${it.weight}</em>` : null}
      </li>`)}</ul>
      ${cl.plan === 'rest' && html`<p class="note"><${Icon} n="moon" s=${16} />Jour de repos : la récupération compte pour 25 points.</p>`}
    </section>`;
  }

  function TodaySession({ k }) {
    const plan = C.planFor(k), done = C.doneSessionsOn(k), open = S().sessions.find(s => !s.done && s.date === k);
    const [pick, setPick] = useState(false);
    if (plan === 'rest' && !done.length && !open) return html`<section class="card sess rest">
      <div class="card-h"><h2>Récupération</h2><span class="tag">Repos</span></div>
      <p class="muted">Pas de séance prévue. Marche, mobilité légère et sommeil : c’est là que le muscle se construit.</p>
      <div class="row gap wrap mt"><button class="btn" onClick=${() => setPick(true)}>Faire une séance quand même</button><button class="btn ghost" onClick=${() => go('train')}>Voir le planning</button></div>
      <${TplPicker} open=${pick} onClose=${() => setPick(false)} onPick=${t => { setPick(false); startSession(t, k); }} />
    </section>`;
    const tpl = T.TPL[open ? open.tpl : done[0] ? done[0].tpl : plan];
    const s = open || done[0];
    const exDone = s ? s.exercises.filter(e => e.completed || e.sets.every(x => x.done)).length : 0;
    return html`<section class="card sess">
      <div class="card-h"><h2>${tpl.name}</h2><span class=${'tag' + (done.length ? ' ok' : '')}>${done.length ? 'Terminée' : open ? 'En cours' : 'Prévue'}</span></div>
      <p class="muted">${tpl.focus} · ${tpl.ex.length} exercices · ~${Math.round(C.sum(tpl.ex, e => e[1]) * 2.6)} min</p>
      <ol class="mini-ex">${tpl.ex.map(([id, n, lo, hi], i) => { const se = s && s.exercises[i]; const ok = se && (se.completed || se.sets.every(x => x.done)); return html`<li class=${ok ? 'ok' : ''}><span>${T.EX[id].n}</span><em>${n} × ${lo}–${hi}${T.EX[id].unit === 'sec' ? ' s' : ''}</em></li>`; })}</ol>
      ${done.length ? html`<div class="row gap mt"><span class="muted">${sessSets(done[0])} séries · ${C.fmt.int(sessVolume(done[0]))} kg soulevés</span></div>`
        : html`<button class="btn primary block mt" onClick=${() => { unlockAudio(); startSession(open ? open.tpl : plan, k); }}><${Icon} n="play" s=${18} />${open ? 'Reprendre la séance (' + exDone + '/' + tpl.ex.length + ')' : 'Commencer la séance'}</button>`}
    </section>`;
  }

  function TplPicker({ open, onClose, onPick }) {
    return html`<${Sheet} open=${open} onClose=${onClose} title="Choisir une séance">
      <div class="list">${T.TPL_ORDER.map(t => html`<button class="li" onClick=${() => onPick(t)}><div><b>${T.TPL[t].name}</b><small>${T.TPL[t].focus}</small></div><${Icon} n="right" /></button>`)}</div>
    <//>`;
  }

  const Tile = ({ icon, title, onClick, children, color }) => html`<section class="card tile" style=${color ? { '--tc': color } : null}>
    <button class="tile-h" onClick=${onClick}><span class="ti"><${Icon} n=${icon} s=${17} /></span><b>${title}</b><${Icon} n="right" s=${16} /></button>${children}</section>`;

  function StepsTile({ k }) {
    const t = C.dayTotals(k), g = S().settings.goals.steps;
    const add = n => act(s => { const d = s.days[k] = s.days[k] || {}; d.steps = Math.max(0, (d.steps || 0) + n); });
    return html`<${Tile} icon="steps" title="Pas" onClick=${() => V.set({ sub: 'steps' })}>
      <div class="tv"><b class="num">${C.fmt.int(t.steps)}</b><small>/ ${C.fmt.int(g)}</small></div>
      <${Bar} v=${t.steps / g} />
      <div class="qa"><button onClick=${() => add(500)}>+500</button><button onClick=${() => add(1000)}>+1 000</button></div>
    <//>`;
  }
  function WaterTile({ k }) {
    const t = C.dayTotals(k), g = S().settings.goals.water;
    return html`<${Tile} icon="drop" title="Eau" color="var(--blue)" onClick=${() => V.set({ sub: 'water' })}>
      <div class="tv"><b class="num">${C.fmt.num(t.water / 1000)}</b><small>/ ${C.fmt.num(g / 1000)} L</small></div>
      <${Bar} v=${t.water / g} color="var(--blue)" />
      <div class="qa"><button onClick=${() => addWater(k, 250)}>+250 ml</button><button onClick=${() => addWater(k, 500)}>+500 ml</button></div>
    <//>`;
  }
  const addWater = (k, ml) => { buzz(); act(s => { const d = s.days[k] = s.days[k] || {}; (d.water = d.water || []).push({ id: C.uid(), ml, t: Date.now() }); }); };
  function FoodTile({ k }) {
    const t = C.dayTotals(k), g = S().settings.goals;
    return html`<${Tile} icon="food" title="Nutrition" color="var(--amber)" onClick=${() => V.set({ sub: 'food' })}>
      <div class="tv"><b class="num">${C.fmt.int(t.kcal)}</b><small>/ ${C.fmt.int(g.kcal)} kcal</small></div>
      <${Bar} v=${t.kcal / g.kcal} color="var(--amber)" />
      <div class="tv2"><span>Protéines</span><b>${C.fmt.int(t.protein)} / ${g.protein} g</b></div>
      <${Bar} v=${t.protein / g.protein} thin />
    <//>`;
  }
  function CheckinTile({ k }) {
    const c = (S().days[k] || {}).checkin;
    const done = c && (c.energy || c.sleepQ || c.motivation || c.soreness);
    return html`<${Tile} icon="pulse" title="Check-in" color="var(--violet)" onClick=${() => V.set({ sub: 'checkin' })}>
      ${done ? html`<div class="ci-mini">${[['Énergie', c.energy], ['Sommeil', c.sleepQ], ['Motiv.', c.motivation], ['Courbat.', c.soreness]].map(([l, v]) => html`<div><span>${l}</span><b>${v || '–'}</b></div>`)}</div>
        <small class="muted">${c.sleepH ? C.fmt.num(c.sleepH) + ' h de sommeil' : 'Sommeil non renseigné'}</small>`
        : html`<p class="muted small">30 secondes pour noter énergie, sommeil et courbatures.</p><button class="btn small block" onClick=${() => V.set({ sub: 'checkin' })}>Faire le check-in</button>`}
    <//>`;
  }

  function MissionsPreview() {
    const ms = C.weekMissions(C.weekStart(C.today()), recs());
    const left = 7 - ((C.weekday(C.today()) + 6) % 7);
    return html`<section class="card">
      <div class="card-h"><h2>Missions de la semaine</h2><button class="link" onClick=${() => go('goals')}>Tout voir</button></div>
      <p class="muted small">${ms.filter(m => m.done).length}/${ms.length} terminées · ${left} jour${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''}</p>
      <ul class="missions">${ms.slice(0, 3).map(m => html`<${MissionRow} m=${m} />`)}</ul>
    </section>`;
  }
  const MissionRow = ({ m }) => html`<li class=${m.done ? 'done' : ''}><div class="mr"><b>${m.label}</b><em>${m.done ? html`<${Icon} n="check" s=${14} w=${3} /> +${m.xp} XP` : C.fmt.int(Math.min(m.v, m.target)) + ' / ' + C.fmt.int(m.target)}</em></div><${Bar} v=${m.v / m.target} thin /></li>`;

  /* ---------- Pas ---------- */
  function StepsPage() {
    const k = D(), g = S().settings.goals.steps, t = C.dayTotals(k).steps;
    const [val, setVal] = useState('');
    const setSteps = n => act(s => { const d = s.days[k] = s.days[k] || {}; d.steps = Math.max(0, Math.round(n)); });
    const last7 = C.range(C.addDays(C.today(), -6), C.today()), last30 = C.range(C.addDays(C.today(), -29), C.today());
    const v7 = last7.map(d => C.dayTotals(d).steps), v30 = last30.map(d => C.dayTotals(d).steps);
    const logged = Object.keys(S().days).filter(d => S().days[d].steps > 0);
    const best = logged.reduce((b, d) => S().days[d].steps > (b ? S().days[b].steps : 0) ? d : b, null);
    const reached = logged.filter(d => S().days[d].steps >= g).length;
    return html`<div class="page">
      <${PageHead} title="Pas" back=${() => V.set({ sub: null })} />
      <section class="card hero-num">
        <div class="hn"><b class="num xl">${C.fmt.int(t)}</b><span>/ ${C.fmt.int(g)} pas</span></div>
        <${Bar} v=${t / g} />
        <div class="row between muted"><span>${Math.min(100, Math.round(t / g * 100))} % de l’objectif</span><span>${t >= g ? 'Objectif atteint' : C.fmt.int(g - t) + ' pas restants'}</span></div>
        <div class="qa big">${[500, 1000, 2500, 5000].map(n => html`<button onClick=${() => { buzz(); setSteps(t + n); }}>+${C.fmt.int(n)}</button>`)}</div>
        <form class="row gap mt" onSubmit=${e => { e.preventDefault(); if (val !== '') { setSteps(+val); setVal(''); toast('Pas enregistrés', { icon: 'check' }); } }}>
          <input class="inp" type="number" inputmode="numeric" min="0" placeholder="Total du podomètre" value=${val} onInput=${e => setVal(e.target.value)} aria-label="Total de pas" />
          <button class="btn primary" type="submit">Enregistrer</button>
        </form>
        <p class="note"><${Icon} n="info" s=${16} />Saisie manuelle : recopie le total de ton téléphone ou de ta montre. Une page web ne peut pas lire Google Fit ni Health Connect ; la source des pas est isolée dans le code pour pouvoir brancher une synchro plus tard.</p>
      </section>
      <div class="grid3">
        <div class="card stat"><span>Moyenne 7 j</span><b class="num">${C.fmt.int(C.sum(v7) / 7)}</b></div>
        <div class="card stat"><span>Record</span><b class="num">${best ? C.fmt.int(S().days[best].steps) : '–'}</b><small>${best ? C.fmt.short(best) : ''}</small></div>
        <div class="card stat"><span>Jours objectif</span><b class="num">${reached}</b></div>
      </div>
      <section class="card"><h2>7 derniers jours</h2><${BarChart} data=${last7.map((d, i) => ({ label: T.DAY_SHORT[C.weekday(d)], v: v7[i] }))} goal=${g} fmtV=${v => v >= 1000 ? C.fmt.num(v / 1000) + 'k' : C.fmt.int(v)} /></section>
      <section class="card"><h2>30 derniers jours</h2><${BarChart} data=${last30.map((d, i) => ({ label: i % 5 === 4 ? C.fmt.dm(d) : '', v: v30[i] }))} goal=${g} showV=${false} h=${130} /></section>
    </div>`;
  }

  /* ---------- Eau ---------- */
  function WaterPage() {
    const k = D(), g = S().settings.goals.water, d = S().days[k] || {}, t = C.dayTotals(k).water;
    const [custom, setCustom] = useState('');
    const last7 = C.range(C.addDays(C.today(), -6), C.today());
    const del = id => { const u = act(s => { s.days[k].water = s.days[k].water.filter(w => w.id !== id); }, true); toast('Entrée supprimée', { undo: u }); };
    return html`<div class="page">
      <${PageHead} title="Hydratation" back=${() => V.set({ sub: null })} />
      <section class="card water-hero">
        <div class="glass" aria-hidden="true"><i style=${{ height: Math.min(100, t / g * 100) + '%' }}></i></div>
        <div>
          <div class="hn"><b class="num xl">${C.fmt.num(t / 1000)}</b><span>/ ${C.fmt.num(g / 1000)} L</span></div>
          <p class="muted">${t >= g ? 'Objectif atteint.' : 'Encore ' + C.fmt.int(g - t) + ' ml.'}</p>
          <div class="qa big"><button onClick=${() => addWater(k, 250)}>+250 ml</button><button onClick=${() => addWater(k, 500)}>+500 ml</button></div>
          <form class="row gap mt" onSubmit=${e => { e.preventDefault(); if (+custom > 0) { addWater(k, +custom); setCustom(''); } }}>
            <input class="inp" type="number" inputmode="numeric" placeholder="Autre quantité (ml)" value=${custom} onInput=${e => setCustom(e.target.value)} aria-label="Quantité en ml" /><button class="btn" type="submit">Ajouter</button>
          </form>
        </div>
      </section>
      <section class="card"><h2>Entrées</h2>
        ${(d.water || []).length ? html`<ul class="rows">${d.water.slice().reverse().map(w => html`<li><span>${new Date(w.t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span><b>${w.ml} ml</b><button class="icon-btn sm" onClick=${() => del(w.id)} aria-label="Supprimer"><${Icon} n="trash" s=${16} /></button></li>`)}</ul>`
        : html`<p class="muted">Aucune entrée ce jour-là. Un verre en te levant, c’est déjà 250 ml.</p>`}
      </section>
      <section class="card"><h2>7 derniers jours</h2><${BarChart} data=${last7.map(x => ({ label: T.DAY_SHORT[C.weekday(x)], v: C.dayTotals(x).water }))} goal=${g} color="var(--blue)" fmtV=${v => C.fmt.num(v / 1000)} /></section>
    </div>`;
  }

  /* ---------- Nutrition ---------- */
  function FoodPage() {
    const k = D(), g = S().settings.goals, t = C.dayTotals(k), food = (S().days[k] || {}).food || [];
    const [edit, setEdit] = useState(null);
    const [mealsOpen, setMealsOpen] = useState(false);
    const del = f => { const u = act(s => { s.days[k].food = s.days[k].food.filter(x => x.id !== f.id); }, true); toast(f.name + ' supprimé', { undo: u }); };
    const addFav = (fav, meal) => { buzz(); act(s => { const d = s.days[k] = s.days[k] || {}; (d.food = d.food || []).push({ id: C.uid(), meal, name: fav.name, kcal: fav.kcal, prot: fav.prot }); }); toast(fav.name + ' ajouté', { icon: 'check' }); };
    const saveMeal = meal => { const items = food.filter(f => f.meal === meal); if (!items.length) return; act(s => { s.meals.push({ id: C.uid(), name: T.MEALS.find(m => m[0] === meal)[1] + ' du ' + C.fmt.short(k), items: items.map(({ name, kcal, prot }) => ({ name, kcal, prot })) }); }); toast('Repas enregistré', { icon: 'check' }); };
    const hour = new Date().getHours(); const defMeal = hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 18 ? 'snack' : 'dinner';
    return html`<div class="page">
      <${PageHead} title="Nutrition" back=${() => V.set({ sub: null })} right=${html`<button class="btn small primary" onClick=${() => setEdit({ meal: defMeal })}><${Icon} n="plus" s=${16} />Aliment</button>`} />
      <section class="card nut-sum">
        <div><span class="muted">Calories</span><div class="hn"><b class="num xl">${C.fmt.int(t.kcal)}</b><span>/ ${C.fmt.int(g.kcal)}</span></div><${Bar} v=${t.kcal / g.kcal} color="var(--amber)" /><small class="muted">${t.kcal <= g.kcal ? C.fmt.int(g.kcal - t.kcal) + ' kcal restantes' : C.fmt.int(t.kcal - g.kcal) + ' kcal au-dessus'}</small></div>
        <div><span class="muted">Protéines</span><div class="hn"><b class="num xl">${C.fmt.int(t.protein)}</b><span>/ ${g.protein} g</span></div><${Bar} v=${t.protein / g.protein} /><small class="muted">${t.protein < g.protein ? C.fmt.int(g.protein - t.protein) + ' g restants' : 'Objectif atteint'}</small></div>
      </section>
      ${(S().favorites.length > 0 || S().meals.length > 0) && html`<section class="card">
        <div class="card-h"><h2>Ajout rapide</h2>${S().meals.length > 0 && html`<button class="link" onClick=${() => setMealsOpen(true)}>Repas enregistrés (${S().meals.length})</button>`}</div>
        <div class="chips">${S().favorites.map(f => html`<button class="chip" onClick=${() => addFav(f, defMeal)}><${Icon} n="plus" s=${14} />${f.name}<small>${f.kcal} kcal · ${f.prot} g</small></button>`)}</div>
      </section>`}
      ${T.MEALS.map(([m, label]) => { const items = food.filter(f => f.meal === m); return html`<section class="card meal">
        <div class="card-h"><h2>${label}</h2><span class="muted">${C.fmt.int(C.sum(items, f => +f.kcal || 0))} kcal · ${C.fmt.int(C.sum(items, f => +f.prot || 0))} g</span></div>
        ${items.length ? html`<ul class="rows">${items.map(f => html`<li><button class="rowbtn" onClick=${() => setEdit(f)}><b>${f.name}</b><small>${f.kcal} kcal · ${f.prot} g prot.</small></button><button class="icon-btn sm" onClick=${() => del(f)} aria-label="Supprimer"><${Icon} n="trash" s=${16} /></button></li>`)}</ul>` : null}
        <div class="row gap wrap"><button class="btn small ghost" onClick=${() => setEdit({ meal: m })}><${Icon} n="plus" s=${15} />Ajouter</button>${items.length > 1 && html`<button class="btn small ghost" onClick=${() => saveMeal(m)}>Enregistrer ce repas</button>`}</div>
      </section>`; })}
      <${FoodSheet} item=${edit} k=${k} onClose=${() => setEdit(null)} />
      <${Sheet} open=${mealsOpen} onClose=${() => setMealsOpen(false)} title="Repas enregistrés">
        <div class="list">${S().meals.map(ml => html`<div class="li"><div><b>${ml.name}</b><small>${ml.items.length} aliments · ${C.fmt.int(C.sum(ml.items, i => +i.kcal || 0))} kcal · ${C.fmt.int(C.sum(ml.items, i => +i.prot || 0))} g</small></div>
          <div class="row gap"><button class="icon-btn sm" aria-label="Supprimer" onClick=${() => { const u = act(s => { s.meals = s.meals.filter(x => x.id !== ml.id); }, true); toast('Repas supprimé', { undo: u }); }}><${Icon} n="trash" s=${16} /></button>
          <button class="btn small primary" onClick=${() => { act(s => { const d = s.days[k] = s.days[k] || {}; d.food = (d.food || []).concat(ml.items.map(i => ({ ...i, id: C.uid(), meal: defMeal }))); }); setMealsOpen(false); toast('Repas ajouté', { icon: 'check' }); }}>Ajouter</button></div></div>`)}</div>
      <//>
      <p class="note"><${Icon} n="info" s=${16} />Recherche via Open Food Facts (base collaborative gratuite) : vérifie les valeurs sur l’emballage. Enregistre tes aliments habituels en favoris pour les ajouter en un geste, même hors ligne.</p>
    </div>`;
  }

  function FoodSheet({ item, k, onClose }) {
    const [f, setF] = useState({});
    useEffect(() => { if (item) setF({ name: '', kcal: '', prot: '', fav: false, ...item }); }, [item]);
    if (!item) return null;
    const isEdit = !!item.id;
    const save = e => {
      e.preventDefault(); if (!f.name.trim()) return;
      const row = { id: f.id || C.uid(), meal: f.meal, name: f.name.trim(), kcal: +f.kcal || 0, prot: +f.prot || 0 };
      act(s => {
        const d = s.days[k] = s.days[k] || {}; d.food = d.food || [];
        const i = d.food.findIndex(x => x.id === row.id); if (i >= 0) d.food[i] = row; else d.food.push(row);
        if (f.fav && !s.favorites.some(x => x.name.toLowerCase() === row.name.toLowerCase())) s.favorites.push({ id: C.uid(), name: row.name, kcal: row.kcal, prot: row.prot });
      });
      toast(isEdit ? 'Aliment modifié' : 'Aliment ajouté', { icon: 'check' }); onClose();
    };
    const isFav = S().favorites.some(x => x.name.toLowerCase() === (f.name || '').trim().toLowerCase());
    return html`<${Sheet} open=${true} onClose=${onClose} title=${isEdit ? 'Modifier l’aliment' : 'Ajouter un aliment'}>
      ${!isEdit && !window.claude && html`<${FoodSearch} onPick=${(name, kcal, prot) => setF({ ...f, name, kcal, prot })} />`}
      <form onSubmit=${save}>
        <${Field} label="Repas"><${Seg} small value=${f.meal} onChange=${v => setF({ ...f, meal: v })} options=${T.MEALS.map(([v, l]) => [v, l.replace('Petit-déjeuner', 'P.-déj.')])} /><//>
        <${Field} label="Nom"><input class="inp" id="food-name" value=${f.name} onInput=${e => setF({ ...f, name: e.target.value })} placeholder="ex. Skyr 150 g" required /><//>
        <div class="grid2"><${Field} label="Calories"><${Num} value=${f.kcal} onChange=${v => setF({ ...f, kcal: v })} suffix="kcal" /><//><${Field} label="Protéines"><${Num} value=${f.prot} step=${0.5} onChange=${v => setF({ ...f, prot: v })} suffix="g" /><//></div>
        ${!isFav && html`<label class="toggle"><input type="checkbox" checked=${f.fav} onChange=${e => setF({ ...f, fav: e.target.checked })} /><span></span>Ajouter aux favoris</label>`}
        ${isFav && html`<p class="muted small">Déjà dans tes favoris.</p>`}
        <button class="btn primary block mt" type="submit">${isEdit ? 'Enregistrer' : 'Ajouter'}</button>
      </form>
      ${S().favorites.length > 0 && !isEdit && html`<h4 class="mt">Favoris</h4><div class="chips">${S().favorites.map(x => html`<span class="chip"><button class="chip-main" onClick=${() => setF({ ...f, name: x.name, kcal: x.kcal, prot: x.prot })}>${x.name}</button><button class="chip-x" aria-label=${'Retirer ' + x.name + ' des favoris'} onClick=${() => act(s => { s.favorites = s.favorites.filter(y => y.id !== x.id); })}><${Icon} n="x" s=${12} /></button></span>`)}</div>`}
    <//>`;
  }

  /* Recherche Open Food Facts (gratuite, sans clé) */
  function FoodSearch({ onPick }) {
    const [q, setQ] = useState(''), [st, setSt] = useState('idle'), [res, setRes] = useState([]), [sel, setSel] = useState(null), [g, setG] = useState(100);
    const ctl = useRef(null);
    const search = async e => {
      e.preventDefault(); if (q.trim().length < 2) return;
      if (!navigator.onLine) { setSt('offline'); return; }
      ctl.current && ctl.current.abort(); const ac = ctl.current = new AbortController(); const to = setTimeout(() => ac.abort(), 12000);
      setSt('loading'); setSel(null);
      try {
        const u = 'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=20&lc=fr&cc=fr&fields=code,product_name,product_name_fr,brands,nutriments,serving_quantity&search_terms=' + encodeURIComponent(q.trim());
        const r = await fetch(u, { signal: ac.signal }); if (!r.ok) throw new Error(r.status);
        const d = await r.json();
        const list = (d.products || []).map(p => ({ id: p.code, name: (p.product_name_fr || p.product_name || '').trim(), brand: (p.brands || '').split(',')[0].trim(), k: +(p.nutriments || {})['energy-kcal_100g'], p: +(p.nutriments || {}).proteins_100g || 0, serving: +p.serving_quantity || null })).filter(p => p.name && p.k > 0).slice(0, 12);
        setRes(list); setSt(list.length ? 'ok' : 'none');
      } catch (err) { setSt(err && err.name === 'AbortError' ? 'timeout' : 'error'); }
      clearTimeout(to);
    };
    const apply = (p, grams) => { const k = Math.round(p.k * grams / 100), pr = Math.round(p.p * grams / 10) / 10; onPick(p.name + (p.brand ? ' (' + p.brand + ')' : '') + ' · ' + grams + ' g', k, pr); };
    return html`<div class="fsearch">
      <form class="row gap" onSubmit=${search}><input class="inp" type="search" value=${q} onInput=${e => setQ(e.target.value)} placeholder="Rechercher un produit (ex. skyr)" aria-label="Rechercher un aliment" /><button class="btn" type="submit" disabled=${st === 'loading'}>${st === 'loading' ? '…' : 'Chercher'}</button></form>
      ${st === 'loading' && html`<div class="skel mt-s" style="height:120px"></div>`}
      ${st === 'offline' && html`<p class="muted small mt-s">Hors ligne : saisis l’aliment à la main ou utilise un favori.</p>`}
      ${(st === 'error' || st === 'timeout') && html`<p class="muted small mt-s">${st === 'timeout' ? 'Open Food Facts ne répond pas' : 'Recherche impossible pour le moment'} : saisis les valeurs à la main.</p>`}
      ${st === 'none' && html`<p class="muted small mt-s">Aucun produit trouvé. Essaie un autre mot ou saisis-le à la main.</p>`}
      ${st === 'ok' && !sel && html`<div class="list fres">${res.map(p => html`<button type="button" class="li" onClick=${() => { const gr = p.serving || 100; setSel(p); setG(gr); apply(p, gr); }}><div><b>${p.name}</b><small>${p.brand ? p.brand + ' · ' : ''}${C.fmt.int(p.k)} kcal · ${C.fmt.num(p.p)} g prot. / 100 g</small></div><${Icon} n="plus" /></button>`)}</div>`}
      ${sel && html`<div class="fsel"><div><b>${sel.name}</b><small class="muted">${C.fmt.int(sel.k)} kcal · ${C.fmt.num(sel.p)} g prot. pour 100 g</small></div>
        <div class="row gap mt-s"><${Field} label="Quantité"><${Num} value=${g} onChange=${v => { setG(v); if (v > 0) apply(sel, v); }} suffix="g" /><//><button type="button" class="btn ghost self-end" onClick=${() => setSel(null)}>Autre produit</button></div></div>`}
    </div>`;
  }

  /* ---------- Check-in ---------- */
  const MOODS = ['Tendu', 'Bof', 'Neutre', 'Bien', 'Au top'];
  function CheckinPage() {
    const k = D(), c = (S().days[k] || {}).checkin || {};
    const set = (f, v) => act(s => { const d = s.days[k] = s.days[k] || {}; d.checkin = { ...(d.checkin || {}), [f]: v }; });
    const [note, setNote] = useState(c.note || '');
    useEffect(() => setNote(c.note || ''), [k]);
    const last7 = C.range(C.addDays(C.today(), -6), C.today());
    const ser = f => ({ pts: last7.map(d => ({ x: d, y: ((S().days[d] || {}).checkin || {})[f] })).filter(p => p.y) });
    const avg = f => { const v = last7.map(d => ((S().days[d] || {}).checkin || {})[f]).filter(Boolean); return v.length ? C.sum(v) / v.length : null; };
    const aE = avg('energy'), aS = avg('sleepQ'), aSo = avg('soreness'), aH = avg('sleepH');
    let advice = null;
    if (aE && aS && (aE + aS) / 2 < 2.6) advice = 'Énergie et sommeil bas cette semaine : allège la prochaine séance (une série en moins par exercice, ou garde 2–3 reps en réserve).';
    else if (aSo && aSo >= 4) advice = 'Courbatures élevées : échauffe-toi plus longtemps, ajoute de la marche et vérifie tes protéines et ton sommeil.';
    else if (aH && aH < S().settings.goals.sleep - 1) advice = 'Tu dors moins que ton objectif. C’est souvent le levier le plus rentable pour la recomposition.';
    else if (aE && aE >= 3.5) advice = 'Bonne récupération : tu peux pousser sur la surcharge progressive.';
    const Scale = ({ f, label, lowL, highL }) => html`<div class="scale"><div class="row between"><b>${label}</b><small class="muted">${lowL} → ${highL}</small></div>
      <div class="dots5">${[1, 2, 3, 4, 5].map(n => html`<button class=${c[f] === n ? 'on' : c[f] > n ? 'past' : ''} aria-pressed=${c[f] === n} onClick=${() => { buzz(); set(f, c[f] === n ? null : n); }}>${n}</button>`)}</div></div>`;
    return html`<div class="page">
      <${PageHead} title="Check-in" back=${() => V.set({ sub: null })} />
      <section class="card">
        <${Scale} f="energy" label="Énergie" lowL="vidé" highL="au top" />
        <${Scale} f="sleepQ" label="Qualité du sommeil" lowL="mauvaise" highL="excellente" />
        <${Scale} f="motivation" label="Motivation" lowL="faible" highL="forte" />
        <${Scale} f="soreness" label="Courbatures" lowL="aucune" highL="fortes" />
        <div class="scale"><b>Humeur</b><div class="chips mt-s">${MOODS.map(m => html`<button class=${'chip' + (c.mood === m ? ' on' : '')} onClick=${() => set('mood', c.mood === m ? null : m)}>${m}</button>`)}</div></div>
        <div class="grid2 mt"><${Field} label="Durée du sommeil"><${Num} value=${c.sleepH} step=${0.25} onChange=${v => set('sleepH', v === '' ? null : v)} suffix="h" /><//></div>
        <${Field} label="Commentaire"><textarea class="inp" rows="3" value=${note} onInput=${e => setNote(e.target.value)} onBlur=${() => note !== (c.note || '') && set('note', note)} placeholder="Séance difficile, repas décalé, stress…"></textarea><//>
        <p class="muted small">Enregistrement automatique.</p>
      </section>
      ${advice && html`<section class="card advice"><${Icon} n="info" /><p>${advice}</p></section>`}
      <section class="card"><h2>Tendances sur 7 jours</h2>
        <div class="legend"><span style="--c:var(--acc)">Énergie</span><span style="--c:var(--blue)">Sommeil</span><span style="--c:var(--red)">Courbatures</span></div>
        <${LineChart} from=${last7[0]} to=${last7[6]} h=${170} fmtY=${v => C.fmt.int(v)} series=${[{ ...ser('soreness'), color: 'var(--red)', dots: true, w: 2 }, { ...ser('sleepQ'), color: 'var(--blue)', dots: true, w: 2 }, { ...ser('energy'), color: 'var(--acc)', dots: true }]} empty="Fais ton premier check-in pour voir les tendances." />
        <div class="grid3 mt">${[['Énergie', aE], ['Sommeil', aS], ['Courbatures', aSo]].map(([l, v]) => html`<div class="stat-s"><span>${l}</span><b>${v ? C.fmt.num(v) : '–'}</b></div>`)}</div>
      </section>
    </div>`;
  }

  /* ---------- ENTRAÎNEMENT ---------- */
  function Train() {
    const t = C.today(), ws = C.weekStart(t), week = C.range(ws, C.addDays(ws, 6));
    const [day, setDay] = useState(null), [tpl, setTpl] = useState(null), [sess, setSess] = useState(null), [cardio, setCardio] = useState(false);
    const done = S().sessions.filter(s => s.done).sort((a, b) => (b.date + b.startedAt).localeCompare(a.date + a.startedAt));
    const open = S().sessions.filter(s => !s.done);
    const cardioWeek = C.sum(week, k => C.dayTotals(k).cardio.length);
    const cardioList = Object.keys(S().days).sort().reverse().flatMap(k => (S().days[k].cardio || []).map(c => ({ ...c, date: k }))).slice(0, 12);
    const cMonth = Object.keys(S().days).filter(k => k.slice(0, 7) === t.slice(0, 7)).flatMap(k => S().days[k].cardio || []);
    return html`<div class="page">
      <${PageHead} title="Entraînement" />
      <section class="card">
        <div class="card-h"><h2>Cette semaine</h2><span class="muted">${done.filter(s => s.date >= ws).length} séance(s)</span></div>
        <div class="week">${week.map(k => { const p = C.planFor(k), ds = C.doneSessionsOn(k), moved = (S().days[k] || {}).plan; const st = ds.length ? 'ok' : p === 'rest' ? 'rest' : k < t && k >= (S().settings.startDate || t) ? 'miss' : k === t ? 'today' : '';
          return html`<button class=${'wd ' + st + (k === t ? ' cur' : '')} onClick=${() => setDay(k)}>
            <span>${T.DAY_SHORT[C.weekday(k)]}</span><b>${p === 'rest' ? 'Repos' : T.TPL[p].name.replace(' + abdos', '')}</b>
            <i>${ds.length ? html`<${Icon} n="check" s=${14} w=${3} />` : st === 'miss' ? 'Manquée' : moved ? 'Déplacée' : ''}</i></button>`; })}</div>
        <p class="muted small mt-s">Touche un jour pour déplacer ou remplacer sa séance. Le planning ne se réinitialise jamais.</p>
      </section>
      ${open.length > 0 && html`<section class="card"><h2>Séance en cours</h2>${open.map(s => html`<div class="li"><div><b>${T.TPL[s.tpl].name}</b><small>${C.fmt.long(s.date)} · ${sessSets(s)} séries validées</small></div><button class="btn small primary" onClick=${() => V.set({ workout: s.id })}>Reprendre</button></div>`)}</section>`}
      <div class="cols">
        <div class="col">
          <${TodaySession} k=${t} />
          <section class="card"><div class="card-h"><h2>Programme</h2><button class="btn small" onClick=${() => V.set({ sub: 'program' })}><${Icon} n="edit" s=${15} />Modifier</button></div>
            <div class="list">${T.TPL_ORDER.map(id => html`<button class="li" onClick=${() => setTpl(id)}><div><b>${T.TPL[id].name}</b><small>${T.TPL[id].focus} · ${T.TPL[id].ex.length} exercices</small></div><${Icon} n="right" /></button>`)}</div>
          </section>
        </div>
        <div class="col">
          <section class="card"><div class="card-h"><h2>Cardio</h2><button class="btn small primary" onClick=${() => setCardio(true)}><${Icon} n="plus" s=${16} />Ajouter</button></div>
            <div class="row between"><span class="muted">Semaine</span><b>${cardioWeek} / ${S().settings.cardioGoal} séances</b></div>
            <${Bar} v=${cardioWeek / Math.max(1, S().settings.cardioGoal)} color="var(--blue)" />
            <p class="muted small mt-s">Recommandé : 1 à 2 séances de 20–30 min par semaine, jamais obligatoire les jours de récupération. Ce mois : ${cMonth.length} séance(s), ${C.fmt.int(C.sum(cMonth, c => +c.min || 0))} min${C.sum(cMonth, c => +c.km || 0) ? ', ' + C.fmt.num(C.sum(cMonth, c => +c.km || 0)) + ' km' : ''}.</p>
            ${cardioList.length ? html`<ul class="rows">${cardioList.map(c => html`<li><span>${C.fmt.short(c.date)}</span><b>${(T.CARDIO_TYPES.find(x => x[0] === c.type) || [0, 'Autre'])[1]} · ${c.min} min${c.km ? ' · ' + C.fmt.num(c.km) + ' km' : ''}</b>
              <button class="icon-btn sm" aria-label="Supprimer" onClick=${() => { const u = act(s => { s.days[c.date].cardio = s.days[c.date].cardio.filter(x => x.id !== c.id); }, true); toast('Cardio supprimé', { undo: u }); }}><${Icon} n="trash" s=${16} /></button></li>`)}</ul>` : null}
          </section>
          <section class="card"><div class="card-h"><h2>Historique</h2><span class="muted">${done.length} séance(s)</span></div>
            ${done.length ? html`<div class="list">${done.slice(0, 15).map(s => html`<button class="li" onClick=${() => setSess(s.id)}><div><b>${T.TPL[s.tpl] ? T.TPL[s.tpl].name : 'Séance'}</b><small>${C.cap(C.fmt.long(s.date))} · ${s.finishedAt ? Math.round((s.finishedAt - s.startedAt) / 60000) + ' min · ' : ''}${C.fmt.int(sessVolume(s))} kg</small></div><${Icon} n="right" /></button>`)}</div>`
              : html`<${Empty} icon="dumbbell" title="Aucune séance terminée" text="Lance ta première séance : tes charges serviront de point de départ pour toutes les suggestions." />`}
          </section>
        </div>
      </div>
      <${DaySheet} k=${day} onClose=${() => setDay(null)} />
      <${TplSheet} id=${tpl} onClose=${() => setTpl(null)} />
      <${SessionSheet} id=${sess} onClose=${() => setSess(null)} />
      <${CardioSheet} open=${cardio} onClose=${() => setCardio(false)} />
    </div>`;
  }

  function DaySheet({ k, onClose }) {
    const [mode, setMode] = useState(null);
    useEffect(() => setMode(null), [k]);
    if (!k) return null;
    const p = C.planFor(k), t = C.today(), ws = C.weekStart(k), targets = C.range(C.addDays(ws, -7), C.addDays(ws, 13)).filter(x => x !== k && x >= C.addDays(t, -7));
    const swap = k2 => { const a = C.planFor(k), b = C.planFor(k2); act(s => { (s.days[k] = s.days[k] || {}).plan = b; (s.days[k2] = s.days[k2] || {}).plan = a; }); toast((a === 'rest' ? 'Repos' : T.TPL[a].name) + ' déplacé au ' + C.fmt.long(k2), { icon: 'swap' }); onClose(); };
    const replace = v => { act(s => { (s.days[k] = s.days[k] || {}).plan = v; }); onClose(); };
    const ds = C.doneSessionsOn(k);
    return html`<${Sheet} open=${true} onClose=${onClose} title=${C.cap(C.fmt.long(k))}>
      <p class="muted">${p === 'rest' ? 'Jour de repos' : T.TPL[p].name + ' · ' + T.TPL[p].focus}${ds.length ? ' · terminée' : ''}</p>
      ${!mode && html`<div class="list mt">
        ${p !== 'rest' && !ds.length && k <= t && html`<button class="li" onClick=${() => { onClose(); unlockAudio(); startSession(p, C.today()); }}><div><b>${k < t ? 'Rattraper aujourd’hui' : 'Commencer maintenant'}</b><small>${T.TPL[p].name}</small></div><${Icon} n="play" /></button>`}
        <button class="li" onClick=${() => setMode('move')}><div><b>Déplacer / échanger</b><small>Échange avec un autre jour</small></div><${Icon} n="swap" /></button>
        <button class="li" onClick=${() => setMode('replace')}><div><b>Remplacer par…</b><small>Une autre séance ou du repos</small></div><${Icon} n="edit" /></button>
        ${(S().days[k] || {}).plan && html`<button class="li" onClick=${() => { act(s => { delete s.days[k].plan; }); onClose(); }}><div><b>Revenir au planning de base</b><small>${T.DAY_NAMES[C.weekday(k)]} : ${S().settings.schedule[C.weekday(k)] === 'rest' ? 'Repos' : T.TPL[S().settings.schedule[C.weekday(k)]].name}</small></div><${Icon} n="calendar" /></button>`}
      </div>`}
      ${mode === 'move' && html`<div class="list mt">${targets.map(x => { const q = C.planFor(x); return html`<button class="li" onClick=${() => swap(x)}><div><b>${C.cap(C.fmt.long(x))}</b><small>Actuellement : ${q === 'rest' ? 'Repos' : T.TPL[q].name}</small></div><${Icon} n="swap" /></button>`; })}</div>`}
      ${mode === 'replace' && html`<div class="list mt">${['rest', ...T.TPL_ORDER].map(v => html`<button class=${'li' + (v === p ? ' sel' : '')} onClick=${() => replace(v)}><div><b>${v === 'rest' ? 'Repos' : T.TPL[v].name}</b></div>${v === p && html`<${Icon} n="check" />`}</button>`)}</div>`}
    <//>`;
  }

  function TplSheet({ id, onClose }) {
    const [info, setInfo] = useState(null);
    if (!id) return null;
    const tp = T.TPL[id];
    return html`<${Sheet} open=${true} onClose=${onClose} title=${tp.name}>
      <p class="muted">${tp.focus}</p>
      <div class="list mt">${tp.ex.map(([ex, n, lo, hi]) => { const r = recs().by[ex]; return html`<button class="li" onClick=${() => setInfo(ex)}><div><b>${T.EX[ex].n}</b><small>${n} × ${lo}–${hi}${T.EX[ex].unit === 'sec' ? ' s' : T.EX[ex].side ? ' / côté' : ''} · ${T.EX[ex].t === 'c' ? 'Polyarticulaire' : T.EX[ex].t === 'a' ? 'Abdos' : 'Isolation'}${r && r.w ? ' · record ' + C.fmt.num(r.w.v) + ' kg' : ''}</small></div><${Icon} n="info" /></button>`; })}</div>
      <button class="btn primary block mt" onClick=${() => { onClose(); unlockAudio(); startSession(id, C.today()); }}><${Icon} n="play" s=${18} />Lancer cette séance aujourd’hui</button>
      <${ExerciseSheet} id=${info} onClose=${() => setInfo(null)} />
    <//>`;
  }

  function SessionSheet({ id, onClose }) {
    const [conf, setConf] = useState(false);
    const s = id && S().sessions.find(x => x.id === id);
    if (!s) return null;
    const prs = recs().prs.filter(p => p.sid === s.id);
    return html`<${Sheet} open=${true} onClose=${onClose} title=${(T.TPL[s.tpl] || {}).name || 'Séance'}>
      <p class="muted">${C.cap(C.fmt.long(s.date))}${s.finishedAt ? ' · ' + Math.round((s.finishedAt - s.startedAt) / 60000) + ' min' : ''} · ${sessSets(s)} séries · ${C.fmt.int(sessVolume(s))} kg</p>
      ${prs.length > 0 && html`<p class="pr-line"><${Icon} n="trophy" s=${16} />${prs.length} record(s) battu(s)</p>`}
      ${s.exercises.map(e => html`<div class="sx"><b>${T.EX[e.id].n}</b><div class="sets-ro">${e.sets.filter(x => x.done).map(x => html`<span>${x.w ? C.fmt.num(x.w) + ' kg × ' : ''}${x.r}${T.EX[e.id].unit === 'sec' ? ' s' : ''}</span>`)}${!e.sets.some(x => x.done) && html`<span class="muted">non réalisé</span>`}</div></div>`)}
      <div class="row gap end mt"><button class="btn ghost danger-t" onClick=${() => setConf(true)}><${Icon} n="trash" s=${16} />Supprimer</button><button class="btn" onClick=${() => { act(x => { x.sessions.find(y => y.id === s.id).done = false; }); onClose(); V.set({ workout: s.id }); }}>Modifier</button></div>
      <${Confirm} open=${conf} title="Supprimer cette séance ?" text="Les séries et records associés seront retirés de ton historique." ok="Supprimer" danger onClose=${() => setConf(false)} onOk=${() => { const u = act(x => { x.sessions = x.sessions.filter(y => y.id !== s.id); }, true); onClose(); toast('Séance supprimée', { undo: u }); }} />
    <//>`;
  }

  function CardioSheet({ open, onClose }) {
    const [f, setF] = useState({ type: 'walk', min: 30, km: '', kcal: '', date: C.today() });
    useEffect(() => { if (open) setF({ type: 'incline', min: 25, km: '', kcal: '', date: D() }); }, [open]);
    if (!open) return null;
    const save = e => { e.preventDefault(); if (!(+f.min > 0)) return; act(s => { const d = s.days[f.date] = s.days[f.date] || {}; (d.cardio = d.cardio || []).push({ id: C.uid(), type: f.type, min: +f.min, km: +f.km || null, kcal: +f.kcal || null }); }); toast('Cardio enregistré', { icon: 'check' }); onClose(); };
    return html`<${Sheet} open=${true} onClose=${onClose} title="Séance de cardio"><form onSubmit=${save}>
      <${Field} label="Type"><div class="chips">${T.CARDIO_TYPES.map(([v, l]) => html`<button type="button" class=${'chip' + (f.type === v ? ' on' : '')} onClick=${() => setF({ ...f, type: v })}>${l}</button>`)}</div><//>
      <div class="grid2"><${Field} label="Durée"><${Num} value=${f.min} onChange=${v => setF({ ...f, min: v })} suffix="min" /><//><${Field} label="Date"><input class="inp" type="date" max=${C.today()} value=${f.date} onInput=${e => setF({ ...f, date: e.target.value || C.today() })} /><//></div>
      <div class="grid2"><${Field} label="Distance (optionnel)"><${Num} value=${f.km} step=${0.1} onChange=${v => setF({ ...f, km: v })} suffix="km" /><//><${Field} label="Calories (optionnel)"><${Num} value=${f.kcal} onChange=${v => setF({ ...f, kcal: v })} suffix="kcal" /><//></div>
      <button class="btn primary block mt" type="submit">Enregistrer</button></form><//>`;
  }

  function ExerciseSheet({ id, onClose }) {
    if (!id) return null;
    const ex = T.EX[id], r = recs().by[id], hist = r ? r.hist : [];
    const from = hist.length ? hist[0].date : C.today(), to = C.today();
    return html`<${Sheet} open=${true} onClose=${onClose} title=${ex.n} wide>
      <p class="muted">${ex.m}</p>
      <div class="cues"><h4>Exécution</h4><ol>${ex.cues.map(c => html`<li>${c}</li>`)}</ol>
        <p class="muted small">Repos conseillé : ${fmtRest(restFor(id))}.</p></div>
      ${r ? html`<div class="grid2 mt">
        ${r.w && html`<div class="stat-s"><span>Charge max</span><b>${C.fmt.num(r.w.v)} kg</b><small>× ${r.w.r} · ${C.fmt.short(r.w.date)}</small></div>`}
        ${r.e1 && html`<div class="stat-s"><span>1RM estimé</span><b>${C.fmt.num(r.e1.v)} kg</b><small>${C.fmt.num(r.e1.w)} × ${r.e1.r}</small></div>`}
        <div class="stat-s"><span>Reps max</span><b>${r.reps.v}${ex.unit === 'sec' ? ' s' : ''}</b><small>${C.fmt.short(r.reps.date)}</small></div>
        ${r.vol && r.vol.v > 0 && html`<div class="stat-s"><span>Volume max</span><b>${C.fmt.int(r.vol.v)} kg</b><small>${C.fmt.short(r.vol.date)}</small></div>`}
      </div>
      ${hist.some(h => h.maxW > 0) && html`<h4 class="mt">Charge max par séance</h4><${LineChart} from=${from} to=${to} h=${160} unit=" kg" series=${[{ pts: hist.filter(h => h.maxW > 0).map(h => ({ x: h.date, y: h.maxW })), color: 'var(--acc)', dots: true }]} />`}
      ${hist.some(h => h.vol > 0) && html`<h4 class="mt">Volume par séance</h4><${LineChart} from=${from} to=${to} h=${140} fmtY=${C.fmt.int} series=${[{ pts: hist.filter(h => h.vol > 0).map(h => ({ x: h.date, y: h.vol })), color: 'var(--blue)', dots: true }]} />`}
      <h4 class="mt">Historique</h4><ul class="rows">${hist.slice().reverse().slice(0, 12).map(h => html`<li><span>${C.fmt.short(h.date)}</span><b class="wrap">${h.sets.map(x => (x.w ? C.fmt.num(x.w) + '×' : '') + x.r).join('  ')}</b></li>`)}</ul>`
        : html`<p class="muted mt">Pas encore de série enregistrée sur cet exercice.</p>`}
    <//>`;
  }
  const restFor = exId => { const t = T.EX[exId].t; return S().settings.rest[t] || 90; };
  const fmtRest = s => s >= 60 ? Math.floor(s / 60) + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '') : s + ' s';

  /* ---------- Mode séance immersif ---------- */
  function Workout({ id }) {
    const s = S().sessions.find(x => x.id === id);
    const firstTodo = s ? Math.max(0, s.exercises.findIndex(e => !e.completed && !e.sets.every(x => x.done))) : 0;
    const [i, setI] = useState(firstTodo);
    const [swap, setSwap] = useState(false), [cues, setCues] = useState(false), [finish, setFinish] = useState(false), [abandon, setAbandon] = useState(false), [info, setInfo] = useState(null);
    const [, tick] = useState(0);
    useEffect(() => { const t = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(t); }, []);
    if (!s) return null;
    const idx = Math.min(i, s.exercises.length - 1), e = s.exercises[idx], ex = T.EX[e.id];
    const lp = M('lp-' + e.id + s.id, () => C.lastPerf(e.id, s.id));
    const sug = M('sug-' + e.id + s.id, () => C.suggestion(e.id, e.n, e.lo, e.hi, s.id));
    const upd = fn => act(st => { const se = st.sessions.find(x => x.id === id); fn(se.exercises[idx], se); });
    const toggleSet = j => {
      const x = e.sets[j]; buzz();
      if (!x.done) {
        upd(E => { const y = E.sets[j]; if (y.r === '' || y.r == null) y.r = lp && lp.sets[j] ? lp.sets[j].r : E.lo; y.done = true; if (E.sets.every(z => z.done)) E.completed = true; });
        unlockAudio();
        const last = j === e.sets.length - 1 && idx === s.exercises.length - 1;
        if (!last) V.set({ rest: { endAt: Date.now() + restFor(e.id) * 1000, total: restFor(e.id), label: ex.n } });
      } else upd(E => { E.sets[j].done = false; E.completed = false; });
    };
    const elapsed = (Date.now() - s.startedAt) / 1000;
    const isSec = ex.unit === 'sec';
    const exState = E => E.completed || E.sets.every(x => x.done) ? 'ok' : E.sets.some(x => x.done) ? 'part' : '';
    return html`<div class="wk-mode" role="dialog" aria-label="Séance en cours">
      <header class="wk-h">
        <button class="icon-btn" onClick=${() => V.set({ workout: null })} aria-label="Réduire la séance"><${Icon} n="down" /></button>
        <div class="wk-t"><b>${T.TPL[s.tpl].name}</b><span class="num">${C.fmt.dur(elapsed)}</span></div>
        <button class="btn small primary" onClick=${() => setFinish(true)}>Terminer</button>
      </header>
      <div class="wk-steps">${s.exercises.map((E, j) => html`<button class=${exState(E) + (j === idx ? ' cur' : '')} onClick=${() => setI(j)} aria-label=${T.EX[E.id].n}>${exState(E) === 'ok' ? html`<${Icon} n="check" s=${13} w=${3} />` : j + 1}</button>`)}</div>
      <div class="wk-body">
        <div class="wk-ex">
          <p class="muted small">Exercice ${idx + 1} / ${s.exercises.length} · ${ex.t === 'c' ? 'Polyarticulaire' : ex.t === 'a' ? 'Abdos' : 'Isolation'} · repos ${fmtRest(restFor(e.id))}</p>
          <h2>${ex.n}</h2>
          <p class="target"><b class="num">${e.n} × ${e.lo}–${e.hi}</b>${isSec ? ' secondes' : ex.side ? ' reps par côté' : ' reps'}<button class="link" onClick=${() => setCues(!cues)}>${cues ? 'Masquer' : 'Technique'}</button><button class="link" onClick=${() => setInfo(e.id)}>Historique</button><button class="link" onClick=${() => setSwap(true)}>Remplacer</button></p>
          ${cues && html`<ol class="cues-in">${ex.cues.map(c => html`<li>${c}</li>`)}</ol>`}
          ${lp && html`<p class="prev">Dernière fois (${C.fmt.short(lp.date)}) : ${lp.sets.map(x => (x.w ? C.fmt.num(x.w) + ' kg × ' : '') + x.r).join(' · ')}</p>`}
          ${sug && html`<p class=${'sug ' + sug.kind}><${Icon} n=${sug.kind === 'up' ? 'bolt' : 'info'} s=${16} />${sug.text}</p>`}
        </div>
        <div class="sets">
          <div class="set-h"><span>Série</span><span>Préc.</span><span>kg</span><span>${isSec ? 'sec' : 'reps'}</span><span></span></div>
          ${e.sets.map((x, j) => { const pv = lp && lp.sets[j]; return html`<div class=${'set' + (x.done ? ' done' : '')}>
            <span class="sn">${j + 1}</span>
            <span class="pv">${pv ? (pv.w ? C.fmt.num(pv.w) + '×' : '') + pv.r : '–'}</span>
            <input type="number" inputmode="decimal" step="0.5" min="0" aria-label=${'Charge série ' + (j + 1)} value=${x.w} placeholder=${ex.bw ? 'PdC' : 'kg'} onInput=${ev => upd(E => { E.sets[j].w = ev.target.value === '' ? '' : +ev.target.value; })} />
            <input type="number" inputmode="numeric" min="0" aria-label=${'Répétitions série ' + (j + 1)} value=${x.r} placeholder=${pv ? String(pv.r) : e.lo + '–' + e.hi} onInput=${ev => upd(E => { E.sets[j].r = ev.target.value === '' ? '' : +ev.target.value; })} />
            <button class="setok" aria-pressed=${x.done} aria-label=${'Valider la série ' + (j + 1)} onClick=${() => toggleSet(j)}><${Icon} n="check" s=${20} w=${3} /></button>
          </div>`; })}
          <div class="row gap mt-s"><button class="btn small ghost" onClick=${() => upd(E => { const l = E.sets[E.sets.length - 1] || {}; E.sets.push({ w: l.w || '', r: '', done: false }); E.completed = false; })}><${Icon} n="plus" s=${15} />Série</button>
            ${e.sets.length > 1 && html`<button class="btn small ghost" onClick=${() => upd(E => { E.sets.pop(); })}><${Icon} n="minus" s=${15} />Série</button>`}
            <div class="sp"></div>
            <button class="btn small ghost" onClick=${() => V.set({ rest: { endAt: Date.now() + restFor(e.id) * 1000, total: restFor(e.id), label: ex.n } })}><${Icon} n="timer" s=${15} />Repos</button></div>
        </div>
      </div>
      <footer class="wk-f">
        <button class="btn ghost" disabled=${idx === 0} onClick=${() => setI(idx - 1)}><${Icon} n="left" s=${18} /></button>
        ${idx < s.exercises.length - 1
        ? html`<button class="btn primary grow" onClick=${() => { upd(E => { E.completed = true; }); setI(idx + 1); }}>Exercice terminé<${Icon} n="right" s=${18} /></button>`
        : html`<button class="btn primary grow" onClick=${() => { upd(E => { E.completed = true; }); setFinish(true); }}>Terminer la séance</button>`}
      </footer>
      <${RestTimer} />
      <${FinishSheet} open=${finish} s=${s} onClose=${() => setFinish(false)} onAbandon=${() => { setFinish(false); setAbandon(true); }} />
      <${Confirm} open=${abandon} title="Abandonner la séance ?" text="Les séries saisies dans cette séance seront supprimées." ok="Abandonner" danger onClose=${() => setAbandon(false)} onOk=${() => { const u = act(st => { st.sessions = st.sessions.filter(x => x.id !== id); }, true); V.set({ workout: null, rest: null }); toast('Séance abandonnée', { undo: u }); }} />
      <${ExerciseSheet} id=${info} onClose=${() => setInfo(null)} />
      <${ExPicker} open=${swap} title="Remplacer pour cette séance" onClose=${() => setSwap(false)} exclude=${s.exercises.map(x => x.id)} onPick=${nid => { const lp2 = C.lastPerf(nid); upd(E => { E.id = nid; E.completed = false; E.sets = E.sets.map((x, j) => ({ w: lp2 ? (lp2.sets[j] || lp2.sets[lp2.sets.length - 1]).w || '' : '', r: '', done: false })); }); setSwap(false); toast('Remplacé pour cette séance', { icon: 'swap' }); }} />
    </div>`;
  }

  function FinishSheet({ open, s, onClose, onAbandon }) {
    if (!open) return null;
    const n = sessSets(s), total = C.sum(s.exercises, e => e.sets.length);
    const finish = () => {
      act(st => { const x = st.sessions.find(y => y.id === s.id); x.done = true; x.finishedAt = x.finishedAt && x.finishedAt > x.startedAt ? x.finishedAt : Date.now(); x.date = x.date || C.today(); });
      V.set({ workout: null, rest: null }); onClose();
      const prs = recs().prs.filter(p => p.sid === s.id);
      V.set({ celebrate: { kind: 'session', title: T.TPL[s.tpl].name + ' terminée', sets: n, vol: sessVolume(s), prs } });
    };
    return html`<${Sheet} open=${true} onClose=${onClose} title="Terminer la séance">
      <div class="grid3"><div class="stat-s"><span>Séries</span><b>${n}/${total}</b></div><div class="stat-s"><span>Volume</span><b>${C.fmt.int(sessVolume(s))} kg</b></div><div class="stat-s"><span>Durée</span><b>${Math.round((Date.now() - s.startedAt) / 60000)} min</b></div></div>
      ${n < total && html`<p class="muted mt">${total - n} série(s) non validée(s) : elles ne compteront pas dans tes records.</p>`}
      <button class="btn primary block mt" disabled=${n === 0} onClick=${finish}><${Icon} n="check" s=${18} />Enregistrer la séance</button>
      ${n === 0 && html`<p class="muted small mt-s">Valide au moins une série pour enregistrer.</p>`}
      <button class="btn ghost danger-t block mt-s" onClick=${onAbandon}>Abandonner la séance</button>
    <//>`;
  }

  function RestTimer() {
    const r = V.s.rest; const [, tick] = useState(0); const rang = useRef(false);
    useEffect(() => { if (!r) return; rang.current = false; const t = setInterval(() => tick(x => x + 1), 250); return () => clearInterval(t); }, [r && r.endAt]);
    if (!r) return null;
    const left = (r.endAt - Date.now()) / 1000;
    if (left <= 0 && !rang.current) { rang.current = true; beep(); setTimeout(() => { if (V.s.rest === r) V.set({ rest: null }); }, 4000); }
    const adj = d => V.set({ rest: { ...r, endAt: r.endAt + d * 1000, total: Math.max(5, r.total + d) } });
    return html`<div class=${'rest-timer' + (left <= 0 ? ' over' : '')} role="timer" aria-live="off">
      <${Ring} v=${Math.max(0, left) / r.total} size=${76} sw=${6}><b class="num">${left > 0 ? C.fmt.dur(Math.ceil(left)) : '0:00'}</b><//>
      <div class="rest-t"><b>${left > 0 ? 'Repos' : 'C’est reparti'}</b><small>${r.label}</small></div>
      <div class="rest-b"><button onClick=${() => adj(-15)} aria-label="Moins 15 secondes">−15</button><button onClick=${() => adj(15)} aria-label="Plus 15 secondes">+15</button><button class="skip" onClick=${() => V.set({ rest: null })}>Passer</button></div>
    </div>`;
  }

  /* ---------- Éditeur de programme ---------- */
  const ensureProgram = s => { if (!s.settings.program) s.settings.program = { tpls: JSON.parse(JSON.stringify(T.BASE.tpl)), order: T.BASE.order.slice() }; return s.settings.program; };
  const editProg = (fn, undo) => act(s => fn(ensureProgram(s), s), undo);
  const TYPE_L = { c: 'Polyarticulaire', i: 'Isolation', a: 'Abdos' };
  const defRange = id => { const e = T.EX[id]; return e.unit === 'sec' ? [3, 30, 45] : e.t === 'c' ? [3, 8, 12] : e.t === 'a' ? [3, 12, 15] : [3, 10, 15]; };

  function ProgramPage() {
    const [reset, setReset] = useState(false);
    const pr = S().settings.program;
    const archived = pr ? Object.keys(pr.tpls).filter(id => pr.tpls[id].hidden) : [];
    const move = (id, d) => editProg(p => { const o = p.order.filter(x => !p.tpls[x].hidden), i = o.indexOf(id), j = i + d; if (j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; p.order = o.concat(p.order.filter(x => p.tpls[x].hidden)); });
    const add = () => { const id = 't_' + C.uid(); editProg(p => { p.tpls[id] = { name: 'Nouvelle séance', focus: '', ex: [] }; p.order.push(id); }); V.set({ sub: 'tpl', tplId: id }); };
    const used = id => S().settings.schedule.filter(x => x === id).length;
    return html`<div class="page">
      <${PageHead} title="Programme" back=${() => V.set({ sub: null })} right=${html`<button class="btn small primary" onClick=${add}><${Icon} n="plus" s=${16} />Séance</button>`} />
      <p class="muted small">Les changements s’appliquent aux prochaines séances. Ton historique, tes records et tes séances passées restent intacts.</p>
      <section class="card"><div class="list">${T.TPL_ORDER.map((id, i) => { const t = T.TPL[id]; const u = used(id); return html`<div class="li">
        <button class="rowbtn" onClick=${() => V.set({ sub: 'tpl', tplId: id })}><b>${t.name}</b><small>${t.ex.length} exercice${t.ex.length > 1 ? 's' : ''} · ${C.sum(t.ex, e => +e[1] || 0)} séries${u ? ' · ' + u + ' jour' + (u > 1 ? 's' : '') + '/sem.' : ' · hors planning'}</small></button>
        <button class="icon-btn sm" disabled=${i === 0} onClick=${() => move(id, -1)} aria-label="Monter"><${Icon} n="up" s=${16} /></button>
        <button class="icon-btn sm" disabled=${i === T.TPL_ORDER.length - 1} onClick=${() => move(id, 1)} aria-label="Descendre"><${Icon} n="down" s=${16} /></button>
        <button class="icon-btn sm" onClick=${() => V.set({ sub: 'tpl', tplId: id })} aria-label="Modifier"><${Icon} n="edit" s=${16} /></button></div>`; })}</div>
        ${!T.TPL_ORDER.length && html`<${Empty} icon="dumbbell" title="Aucune séance active" text="Crée une séance ou restaure le programme d’origine." />`}
      </section>
      <section class="card"><h2>Planning de la semaine</h2>
        ${[1, 2, 3, 4, 5, 6, 0].map(d => html`<div class="sched"><span>${T.DAY_NAMES[d]}</span><select class="inp" value=${T.TPL_ORDER.includes(S().settings.schedule[d]) ? S().settings.schedule[d] : 'rest'} onChange=${e => act(s => { s.settings.schedule[d] = e.target.value; })}>${['rest', ...T.TPL_ORDER].map(v => html`<option value=${v}>${v === 'rest' ? 'Repos / récupération' : T.TPL[v].name}</option>`)}</select></div>`)}
      </section>
      ${archived.length > 0 && html`<section class="card"><h2>Séances archivées</h2><div class="list">${archived.map(id => html`<div class="li"><div><b>${pr.tpls[id].name}</b><small>${pr.tpls[id].ex.length} exercices</small></div><button class="btn small" onClick=${() => editProg(p => { delete p.tpls[id].hidden; if (!p.order.includes(id)) p.order.push(id); })}>Restaurer</button></div>`)}</div></section>`}
      ${pr && html`<button class="btn ghost block" onClick=${() => setReset(true)}>Revenir au programme d’origine</button>`}
      <${Confirm} open=${reset} title="Revenir au programme d’origine ?" text="Les 6 séances PPL de départ sont restaurées. Tes séances personnalisées sont archivées (récupérables), ton historique n’est pas touché." ok="Restaurer" onClose=${() => setReset(false)} onOk=${() => { const u = act(s => { const old = s.settings.program; const tpls = JSON.parse(JSON.stringify(T.BASE.tpl)); for (const id in old.tpls) if (!tpls[id]) tpls[id] = { ...old.tpls[id], hidden: true }; s.settings.program = { tpls, order: T.BASE.order.slice() }; s.settings.schedule = T.DEFAULT_SCHEDULE.slice(); }, true); toast('Programme d’origine restauré', { undo: u }); }} />
    </div>`;
  }

  function TemplateEditor() {
    const id = V.s.tplId, t = T.TPL[id];
    const [pick, setPick] = useState(false), [arch, setArch] = useState(false), [info, setInfo] = useState(null);
    if (!t) return html`<div class="page"><${PageHead} title="Séance" back=${() => V.set({ sub: 'program' })} /><p class="muted">Séance introuvable.</p></div>`;
    const ed = fn => editProg(p => fn(p.tpls[id]));
    const setNum = (i, k, v) => ed(tp => { const e = tp.ex[i]; v = Math.max(k === 1 ? 1 : 0, Math.round(+v || 0)); e[k] = v; if (e[2] > e[3]) { if (k === 2) e[3] = e[2]; else e[2] = e[3]; } });
    const mv = (i, d) => ed(tp => { const j = i + d; if (j < 0 || j >= tp.ex.length) return; [tp.ex[i], tp.ex[j]] = [tp.ex[j], tp.ex[i]]; });
    const del = i => { const n = T.EX[t.ex[i][0]].n; const u = editProg(p => { p.tpls[id].ex.splice(i, 1); }, true); toast(n + ' retiré', { undo: u }); };
    const days = [1, 2, 3, 4, 5, 6, 0].filter(d => S().settings.schedule[d] === id);
    return html`<div class="page">
      <${PageHead} title="Modifier la séance" back=${() => V.set({ sub: 'program' })} />
      <section class="card">
        <${Field} label="Nom"><input class="inp" value=${t.name} onChange=${e => { const v = e.target.value.trim(); if (v) ed(tp => { tp.name = v; }); }} /><//>
        <${Field} label="Muscles ciblés"><input class="inp" value=${t.focus} placeholder="ex. Pectoraux · Épaules · Triceps" onChange=${e => ed(tp => { tp.focus = e.target.value.trim(); })} /><//>
        <p class="muted small">${days.length ? 'Prévue le ' + days.map(d => T.DAY_NAMES[d].toLowerCase()).join(', ') + '.' : 'Pas encore placée dans le planning.'} ${t.ex.length} exercices · ~${Math.round(C.sum(t.ex, e => +e[1] || 0) * 2.6)} min</p>
      </section>
      <section class="card"><div class="card-h"><h2>Exercices</h2><button class="btn small primary" onClick=${() => setPick(true)}><${Icon} n="plus" s=${16} />Exercice</button></div>
        ${t.ex.length ? html`<div class="exed">${t.ex.map(([ex, n, lo, hi], i) => { const E = T.EX[ex] || { n: ex, t: 'i' }; return html`<div class="exr" key=${ex + i}>
          <div class="exr-h"><span class="exn">${i + 1}</span><button class="rowbtn" onClick=${() => setInfo(ex)}><b>${E.n}</b><small>${TYPE_L[E.t]}${E.side ? ' · par côté' : ''}${E.custom ? ' · perso' : ''}</small></button>
            <button class="icon-btn sm" disabled=${i === 0} onClick=${() => mv(i, -1)} aria-label="Monter"><${Icon} n="up" s=${16} /></button>
            <button class="icon-btn sm" disabled=${i === t.ex.length - 1} onClick=${() => mv(i, 1)} aria-label="Descendre"><${Icon} n="down" s=${16} /></button>
            <button class="icon-btn sm" onClick=${() => del(i)} aria-label=${'Retirer ' + E.n}><${Icon} n="trash" s=${16} /></button></div>
          <div class="exr-n">
            <label><span>Séries</span><input type="number" inputmode="numeric" min="1" value=${n} onChange=${e => setNum(i, 1, e.target.value)} /></label>
            <label><span>${E.unit === 'sec' ? 'Sec. min' : 'Reps min'}</span><input type="number" inputmode="numeric" min="1" value=${lo} onChange=${e => setNum(i, 2, e.target.value)} /></label>
            <label><span>${E.unit === 'sec' ? 'Sec. max' : 'Reps max'}</span><input type="number" inputmode="numeric" min="1" value=${hi} onChange=${e => setNum(i, 3, e.target.value)} /></label>
          </div></div>`; })}</div>`
        : html`<${Empty} icon="dumbbell" title="Séance vide" text="Ajoute des exercices depuis la bibliothèque ou crée les tiens." />`}
      </section>
      <button class="btn primary block" disabled=${!t.ex.length} onClick=${() => { unlockAudio(); startSession(id, C.today()); }}><${Icon} n="play" s=${18} />Lancer cette séance aujourd’hui</button>
      <button class="btn ghost danger-t block" onClick=${() => setArch(true)}><${Icon} n="trash" s=${16} />Archiver la séance</button>
      <${ExPicker} open=${pick} onClose=${() => setPick(false)} exclude=${t.ex.map(e => e[0])} onPick=${ex => { ed(tp => { tp.ex.push([ex, ...defRange(ex)]); }); setPick(false); toast(T.EX[ex].n + ' ajouté', { icon: 'check' }); }} />
      <${ExerciseSheet} id=${info} onClose=${() => setInfo(null)} />
      <${Confirm} open=${arch} title="Archiver cette séance ?" text=${days.length ? 'Les jours où elle était prévue passeront en repos. Tu pourras la restaurer, et ton historique est conservé.' : 'Tu pourras la restaurer, et ton historique est conservé.'} ok="Archiver" danger onClose=${() => setArch(false)} onOk=${() => { act(s => { const p = ensureProgram(s); p.tpls[id].hidden = true; s.settings.schedule = s.settings.schedule.map(x => x === id ? 'rest' : x); }); V.set({ sub: 'program' }); toast('Séance archivée'); }} />
    </div>`;
  }

  function ExPicker({ open, onClose, onPick, exclude = [], title = 'Ajouter un exercice' }) {
    const [q, setQ] = useState(''), [create, setCreate] = useState(false);
    const [f, setF] = useState({ n: '', t: 'i', m: '', unit: 'reps', side: false, bw: false, cues: '' });
    useEffect(() => { if (open) { setQ(''); setCreate(false); } }, [open]);
    if (!open) return null;
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const all = Object.keys(T.EX).filter(id => !exclude.includes(id) && (!q || norm(T.EX[id].n + ' ' + T.EX[id].m).includes(norm(q)))).sort((a, b) => T.EX[a].n.localeCompare(T.EX[b].n, 'fr'));
    const save = e => {
      e.preventDefault(); if (!f.n.trim()) return;
      const id = 'cx_' + C.uid();
      act(s => { s.settings.customEx = s.settings.customEx || {}; s.settings.customEx[id] = { n: f.n.trim(), t: f.t, m: f.m.trim() || '—', cues: f.cues.split('\n').map(x => x.trim()).filter(Boolean), unit: f.unit === 'sec' ? 'sec' : undefined, side: f.side || undefined, bw: f.bw || undefined, custom: true }; });
      onPick(id);
    };
    return html`<${Sheet} open=${true} onClose=${onClose} title=${create ? 'Créer un exercice' : title}>
      ${!create ? html`<input class="inp" type="search" placeholder="Rechercher (nom ou muscle)" value=${q} onInput=${e => setQ(e.target.value)} aria-label="Rechercher un exercice" />
        <button class="btn block mt-s" onClick=${() => { setF({ ...f, n: q }); setCreate(true); }}><${Icon} n="plus" s=${16} />Créer un exercice${q ? ' « ' + q + ' »' : ''}</button>
        <div class="list mt-s">${all.map(id => html`<button class="li" onClick=${() => onPick(id)}><div><b>${T.EX[id].n}</b><small>${TYPE_L[T.EX[id].t]} · ${T.EX[id].m}</small></div><${Icon} n="plus" /></button>`)}</div>
        ${!all.length && html`<p class="muted center mt">Aucun exercice trouvé.</p>`}`
      : html`<form onSubmit=${save}>
        <${Field} label="Nom"><input class="inp" id="cx-name" value=${f.n} onInput=${e => setF({ ...f, n: e.target.value })} placeholder="ex. Pull-over poulie" required /><//>
        <${Field} label="Type (définit le temps de repos)"><${Seg} small value=${f.t} onChange=${v => setF({ ...f, t: v })} options=${[['c', 'Polyarticulaire'], ['i', 'Isolation'], ['a', 'Abdos']]} /><//>
        <${Field} label="Mesure"><${Seg} small value=${f.unit} onChange=${v => setF({ ...f, unit: v })} options=${[['reps', 'Répétitions'], ['sec', 'Secondes']]} /><//>
        <${Field} label="Muscles"><input class="inp" value=${f.m} onInput=${e => setF({ ...f, m: e.target.value })} placeholder="ex. Grand dorsal" /><//>
        <label class="toggle"><input type="checkbox" checked=${f.side} onChange=${e => setF({ ...f, side: e.target.checked })} /><span></span>Unilatéral (reps par côté)</label>
        <label class="toggle"><input type="checkbox" checked=${f.bw} onChange=${e => setF({ ...f, bw: e.target.checked })} /><span></span>Poids du corps (charge facultative)</label>
        <${Field} label="Consignes (une par ligne, optionnel)"><textarea class="inp" rows="3" value=${f.cues} onInput=${e => setF({ ...f, cues: e.target.value })}></textarea><//>
        <div class="row gap end"><button type="button" class="btn ghost" onClick=${() => setCreate(false)}>Retour</button><button class="btn primary" type="submit">Créer et ajouter</button></div>
      </form>`}
    <//>`;
  }

  /* ---------- PROGRESSION ---------- */
  function Prog() {
    const seg = V.s.progSeg;
    return html`<div class="page">
      <${PageHead} title="Progression" />
      <${Seg} value=${seg} onChange=${v => V.set({ progSeg: v })} options=${[['body', 'Corps'], ['strength', 'Force'], ['photos', 'Photos'], ['stats', 'Stats']]} />
      ${seg === 'body' && html`<${Body} />`}${seg === 'strength' && html`<${Strength} />`}${seg === 'photos' && html`<${PhotosView} />`}${seg === 'stats' && html`<${Stats} />`}
    </div>`;
  }

  function Body() {
    const [rg, setRg] = useState('30'), [edit, setEdit] = useState(null);
    const ser = C.weightSeries(), avg = C.movingAvg(ser, 7), t = C.today();
    const from = C.addDays(t, -({ 7: 6, 30: 29, 90: 89, 180: 179 })[rg]);
    const cur = ser.length ? ser[ser.length - 1] : null, curAvg = avg.length ? avg[avg.length - 1].y : null;
    const start = S().settings.startWeight;
    const prevWeek = avg.filter(p => p.x <= C.addDays(t, -7)).pop();
    const waist = S().body.filter(b => b.waist).sort((a, b) => a.date.localeCompare(b.date)).map(b => ({ x: b.date, y: +b.waist }));
    const entries = S().body.slice().sort((a, b) => b.date.localeCompare(a.date));
    return html`<div class="stack">
      <section class="card body-hero">
        <div><span class="muted">Moyenne 7 j</span><div class="hn"><b class="num xl">${curAvg ? C.fmt.num(curAvg) : '–'}</b><span>kg</span></div>
          <small class="muted">${cur ? 'Dernière pesée ' + C.fmt.num(cur.y) + ' kg · ' + C.fmt.short(cur.x) : 'Aucune pesée'}</small></div>
        <div class="bh-r">
          <div class="stat-s"><span>Depuis le départ</span><b>${curAvg ? (curAvg - start > 0 ? '+' : '') + C.fmt.num(curAvg - start) + ' kg' : '–'}</b><small>départ ${C.fmt.num(start)} kg</small></div>
          <div class="stat-s"><span>Sur 7 jours</span><b>${curAvg && prevWeek ? (curAvg - prevWeek.y > 0 ? '+' : '') + C.fmt.num(curAvg - prevWeek.y) + ' kg' : '–'}</b></div>
        </div>
        <button class="btn primary" onClick=${() => setEdit({})}><${Icon} n="plus" s=${16} />Mesure</button>
      </section>
      <section class="card"><div class="card-h"><h2>Poids</h2><${Seg} small value=${rg} onChange=${setRg} options=${[['7', '7 j'], ['30', '30 j'], ['90', '3 mois'], ['180', '6 mois']]} /></div>
        <div class="legend"><span style="--c:var(--muted)">Pesées</span><span style="--c:var(--acc)">Moyenne glissante 7 j</span></div>
        <${LineChart} from=${from} to=${t} h=${200} unit=" kg" series=${[{ pts: ser, color: 'var(--muted)', dots: true, r: 3, w: 1, dash: '2 4' }, { pts: avg, color: 'var(--acc)', w: 3 }]} empty="Ajoute ta première pesée pour voir la courbe." />
        <p class="muted small">Le poids varie de 0,5 à 1,5 kg d’un jour à l’autre (eau, sel, glucides). Fie-toi à la moyenne.</p>
      </section>
      <section class="card"><h2>Tour de taille</h2>
        <${LineChart} from=${waist.length ? (waist[0].x < from ? waist[0].x : from) : from} to=${t} h=${160} unit=" cm" series=${[{ pts: waist, color: 'var(--amber)', dots: true }]} empty="Mesure ton tour de taille au nombril, le matin, une fois par semaine." />
        ${waist.length > 1 && html`<p class="muted small">${C.fmt.num(waist[waist.length - 1].y - waist[0].y)} cm depuis le ${C.fmt.short(waist[0].x)}. En recomposition, une taille qui baisse avec un poids stable est un excellent signe.</p>`}
      </section>
      <section class="card"><h2>Mesures</h2>
        ${entries.length ? html`<div class="scroll"><table class="tbl"><thead><tr><th>Date</th><th>Poids</th><th>Taille</th><th>Poitr.</th><th>Bras</th><th>Cuisse</th><th></th></tr></thead><tbody>
          ${entries.map(b => html`<tr><td>${C.fmt.short(b.date)}</td><td>${b.weight ? C.fmt.num(b.weight) : '–'}</td><td>${b.waist ? C.fmt.num(b.waist) : '–'}</td><td>${b.chest ? C.fmt.num(b.chest) : '–'}</td><td>${b.arm ? C.fmt.num(b.arm) : '–'}</td><td>${b.thigh ? C.fmt.num(b.thigh) : '–'}</td><td><button class="icon-btn sm" onClick=${() => setEdit(b)} aria-label="Modifier"><${Icon} n="edit" s=${15} /></button></td></tr>`)}
        </tbody></table></div>` : html`<${Empty} icon="scale" title="Aucune mesure" text="Pèse-toi le matin à jeun, 3 à 7 fois par semaine, pour une moyenne fiable." />`}
      </section>
      <${BodySheet} item=${edit} onClose=${() => setEdit(null)} />
    </div>`;
  }

  function BodySheet({ item, onClose }) {
    const [f, setF] = useState({});
    const [conf, setConf] = useState(false);
    useEffect(() => { if (item) setF({ date: C.today(), weight: '', waist: '', chest: '', arm: '', thigh: '', ...item }); }, [item]);
    if (!item) return null;
    const save = e => {
      e.preventDefault(); if (!f.weight && !f.waist && !f.chest && !f.arm && !f.thigh) return;
      act(s => { const row = { id: f.id || C.uid(), date: f.date, weight: +f.weight || null, waist: +f.waist || null, chest: +f.chest || null, arm: +f.arm || null, thigh: +f.thigh || null };
        const i = s.body.findIndex(b => b.id === row.id || (!f.id && b.date === row.date));
        if (i >= 0) { const old = s.body[i]; s.body[i] = { ...old, ...Object.fromEntries(Object.entries(row).filter(([k, v]) => v != null || f.id)), id: old.id }; } else s.body.push(row); });
      toast('Mesure enregistrée', { icon: 'check' }); onClose();
    };
    return html`<${Sheet} open=${true} onClose=${onClose} title=${item.id ? 'Modifier la mesure' : 'Nouvelle mesure'}><form onSubmit=${save}>
      <div class="grid2"><${Field} label="Date"><input class="inp" type="date" max=${C.today()} value=${f.date} onInput=${e => setF({ ...f, date: e.target.value || C.today() })} /><//><${Field} label="Poids"><${Num} id="w-in" value=${f.weight} step=${0.1} onChange=${v => setF({ ...f, weight: v })} suffix="kg" /><//></div>
      <div class="grid2"><${Field} label="Tour de taille"><${Num} value=${f.waist} step=${0.5} onChange=${v => setF({ ...f, waist: v })} suffix="cm" /><//><${Field} label="Poitrine (opt.)"><${Num} value=${f.chest} step=${0.5} onChange=${v => setF({ ...f, chest: v })} suffix="cm" /><//></div>
      <div class="grid2"><${Field} label="Bras (opt.)"><${Num} value=${f.arm} step=${0.5} onChange=${v => setF({ ...f, arm: v })} suffix="cm" /><//><${Field} label="Cuisse (opt.)"><${Num} value=${f.thigh} step=${0.5} onChange=${v => setF({ ...f, thigh: v })} suffix="cm" /><//></div>
      <button class="btn primary block mt" type="submit">Enregistrer</button>
      ${item.id && html`<button type="button" class="btn ghost danger-t block mt-s" onClick=${() => setConf(true)}>Supprimer cette mesure</button>`}
    </form>
    <${Confirm} open=${conf} title="Supprimer la mesure ?" text=${'Mesure du ' + C.fmt.long(f.date || C.today())} ok="Supprimer" danger onClose=${() => setConf(false)} onOk=${() => { const u = act(s => { s.body = s.body.filter(b => b.id !== item.id); }, true); onClose(); toast('Mesure supprimée', { undo: u }); }} />
    <//>`;
  }

  function Strength() {
    const [info, setInfo] = useState(null);
    const R = recs(), t = C.today();
    const weeks = Array.from({ length: 12 }, (_, i) => C.addDays(C.weekStart(t), -7 * (11 - i)));
    const perWeek = weeks.map(w => ({ label: C.fmt.dm(w), v: S().sessions.filter(s => s.done && s.date >= w && s.date <= C.addDays(w, 6)).length, hi: w === C.weekStart(t) }));
    const volWeek = weeks.map(w => ({ label: C.fmt.dm(w), v: C.sum(S().sessions.filter(s => s.done && s.date >= w && s.date <= C.addDays(w, 6)), sessVolume) }));
    const recent = R.prs.slice().reverse().slice(0, 8);
    return html`<div class="stack">
      <div class="cols">
        <section class="card col"><h2>Séances par semaine</h2><${BarChart} data=${perWeek.map((d, i) => ({ ...d, label: i % 3 === 2 ? d.label : '' }))} goal=${6} h=${140} showV=${false} /></section>
        <section class="card col"><h2>Volume hebdomadaire</h2><${BarChart} data=${volWeek.map((d, i) => ({ ...d, label: i % 3 === 2 ? d.label : '' }))} h=${140} showV=${false} color="var(--blue)" /></section>
      </div>
      <section class="card"><div class="card-h"><h2>Records récents</h2><${Icon} n="trophy" /></div>
        ${recent.length ? html`<ul class="rows">${recent.map(p => html`<li><span>${C.fmt.short(p.date)}</span><b>${T.EX[p.ex].n}</b><em class="acc">${p.kind === 'w' ? C.fmt.num(p.v) + ' kg' : p.kind === 'e1' ? '1RM ~' + C.fmt.num(p.v) + ' kg' : p.v + ' reps'}</em></li>`)}</ul>`
          : html`<p class="muted">Tes records apparaîtront dès ta deuxième séance sur un exercice : la première sert de référence.</p>`}
      </section>
      ${T.TPL_ORDER.map(id => html`<section class="card"><h2>${T.TPL[id].name}</h2><div class="list">${T.TPL[id].ex.map(([ex]) => { const r = R.by[ex]; const h = r ? r.hist : []; const d = h.length > 1 && h[0].e1 ? (h[h.length - 1].e1 - h[0].e1) / h[0].e1 * 100 : null;
        return html`<button class="li" onClick=${() => setInfo(ex)}><div><b>${T.EX[ex].n}</b><small>${r ? (r.w ? 'Max ' + C.fmt.num(r.w.v) + ' kg × ' + r.w.r : 'Max ' + r.reps.v + (T.EX[ex].unit === 'sec' ? ' s' : ' reps')) + ' · ' + h.length + ' séance(s)' : 'Pas encore réalisé'}</small></div>${d != null && html`<em class=${d >= 0 ? 'acc' : 'neg'}>${d >= 0 ? '+' : ''}${C.fmt.num(d)} %</em>`}<${Icon} n="right" /></button>`; })}</div></section>`)}
      <${ExerciseSheet} id=${info} onClose=${() => setInfo(null)} />
    </div>`;
  }

  /* Photos : stockées uniquement dans IndexedDB sur cet appareil */
  function PhotosView() {
    const [list, setList] = useState(null), [pending, setPending] = useState(null), [sel, setSel] = useState([]), [cmp, setCmp] = useState(false), [view, setView] = useState(null), [conf, setConf] = useState(null);
    const urls = useRef({});
    const load = async () => { try { const all = await C.Photos.all(); all.sort((a, b) => b.date.localeCompare(a.date)); setList(all); } catch (e) { setList([]); } };
    useEffect(() => { load(); return () => Object.values(urls.current).forEach(u => URL.revokeObjectURL(u)); }, []);
    const url = p => urls.current[p.id] || (urls.current[p.id] = URL.createObjectURL(p.blob));
    const pick = async ev => {
      const file = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!file) return;
      try { const blob = await compress(file); setPending({ blob, preview: URL.createObjectURL(blob), date: C.today(), note: '' }); } catch (e) { toast('Image illisible', { kind: 'err' }); }
    };
    const save = async () => { try { await C.Photos.put({ id: C.uid(), date: pending.date, note: pending.note, blob: pending.blob }); URL.revokeObjectURL(pending.preview); setPending(null); toast('Photo enregistrée sur cet appareil', { icon: 'check' }); load(); } catch (e) { toast('Enregistrement impossible : stockage local indisponible', { kind: 'err' }); } };
    const toggleSel = p => setSel(s => s.includes(p.id) ? s.filter(x => x !== p.id) : s.concat(p.id).slice(-2));
    if (!C.Photos.available()) return html`<section class="card"><${Empty} icon="camera" title="Stockage local indisponible" text="Ce navigateur bloque IndexedDB (navigation privée ?). Les photos ne peuvent pas être conservées ici." /></section>`;
    const pair = list ? sel.map(id => list.find(p => p.id === id)).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date)) : [];
    return html`<div class="stack">
      <section class="card"><div class="card-h"><h2>Photos de progression</h2>
        <label class="btn small primary"><${Icon} n="camera" s=${16} />Ajouter<input type="file" accept="image/*" hidden onChange=${pick} /></label></div>
        <p class="muted small"><${Icon} n="info" s=${14} /> Privées : stockées uniquement dans ce navigateur, jamais envoyées sur un serveur ni sauvegardées sur ton compte. Pense à les inclure dans l’export pour les garder.</p>
        ${list && list.length > 1 && html`<div class="row gap mt-s"><button class=${'btn small' + (cmp ? ' primary' : '')} onClick=${() => { setCmp(!cmp); setSel([]); }}>${cmp ? 'Annuler' : 'Comparer deux photos'}</button>${cmp && html`<span class="muted small">${sel.length}/2 sélectionnées</span>`}</div>`}
      </section>
      ${cmp && pair.length === 2 && html`<section class="card"><div class="cmp">${pair.map(p => html`<figure><img src=${url(p)} alt=${'Photo du ' + C.fmt.long(p.date)} /><figcaption>${C.fmt.short(p.date)}</figcaption></figure>`)}</div><p class="muted small center">${C.diffDays(pair[0].date, pair[1].date)} jours d’écart</p></section>`}
      ${list === null ? html`<div class="skel" style="height:220px"></div>` : list.length ? html`<div class="pgrid">${list.map(p => html`<button class=${'ph-i' + (sel.includes(p.id) ? ' sel' : '')} onClick=${() => cmp ? toggleSel(p) : setView(p)}><img src=${url(p)} alt=${'Photo du ' + C.fmt.long(p.date)} loading="lazy" /><span>${C.fmt.short(p.date)}</span></button>`)}</div>`
        : html`<section class="card"><${Empty} icon="camera" title="Aucune photo" text="Même lumière, même pose, même heure : face, profil, dos. Une série toutes les 2 à 4 semaines suffit." /></section>`}
      <${Sheet} open=${!!pending} onClose=${() => { URL.revokeObjectURL(pending.preview); setPending(null); }} title="Nouvelle photo">
        ${pending && html`<img class="prev-img" src=${pending.preview} alt="Aperçu" />
        <div class="grid2"><${Field} label="Date"><input class="inp" type="date" max=${C.today()} value=${pending.date} onInput=${e => setPending({ ...pending, date: e.target.value || C.today() })} /><//></div>
        <${Field} label="Note (optionnel)"><input class="inp" value=${pending.note} onInput=${e => setPending({ ...pending, note: e.target.value })} placeholder="Face, à jeun, 74 kg" /><//>
        <button class="btn primary block mt" onClick=${save}>Enregistrer</button>`}
      <//>
      <${Sheet} open=${!!view} onClose=${() => setView(null)} title=${view ? C.cap(C.fmt.long(view.date)) : ''}>
        ${view && html`<img class="prev-img" src=${url(view)} alt="" />${view.note && html`<p>${view.note}</p>`}<button class="btn ghost danger-t block mt" onClick=${() => setConf(view)}><${Icon} n="trash" s=${16} />Supprimer la photo</button>`}
      <//>
      <${Confirm} open=${!!conf} title="Supprimer la photo ?" text="Elle sera définitivement effacée de cet appareil." ok="Supprimer" danger onClose=${() => setConf(null)} onOk=${async () => { await C.Photos.del(conf.id); setView(null); load(); toast('Photo supprimée'); }} />
    </div>`;
  }
  function compress(file) {
    return new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => { const m = 1400, sc = Math.min(1, m / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(b => b ? res(b) : rej(), 'image/jpeg', 0.85); };
      img.onerror = () => { URL.revokeObjectURL(u); rej(); }; img.src = u;
    });
  }

  function Stats() {
    const st = M('stats', C.stats), sk = streak(), R = recs();
    const cells = [
      ['Séances au total', st.total], ['Cette semaine', st.week], ['Régularité', st.regularity != null ? st.regularity + ' %' : '–'],
      ['Temps d’entraînement', st.time ? C.fmt.hm(st.time) : '–'], ['Pas moyens', st.steps ? C.fmt.int(st.steps) : '–'], ['Séances cardio', st.cardio],
      ['Poids de départ', C.fmt.num(st.startW) + ' kg'], ['Poids actuel', st.curW ? C.fmt.num(st.curW) + ' kg' : '–'], ['Tour de taille', st.waist1 ? C.fmt.num(st.waist1) + ' cm' + (st.waist0 !== st.waist1 ? ' (' + (st.waist1 - st.waist0 > 0 ? '+' : '') + C.fmt.num(st.waist1 - st.waist0) + ')' : '') : '–'],
      ['Calories moyennes', st.kcal ? C.fmt.int(st.kcal) + ' kcal' : '–'], ['Protéines moyennes', st.protein ? C.fmt.int(st.protein) + ' g' : '–'], ['Hydratation moyenne', st.water ? C.fmt.num(st.water / 1000) + ' L' : '–'],
      ['Série actuelle', sk.cur + ' j'], ['Meilleure série', sk.best + ' j'], ['Records battus', R.prs.length],
    ];
    return html`<div class="stack"><div class="sgrid">${cells.map(([l, v]) => html`<div class="card stat"><span>${l}</span><b class="num">${v}</b></div>`)}</div>
      <p class="muted small">Régularité : séances réalisées sur les jours d’entraînement prévus depuis le ${C.fmt.long(S().settings.startDate || C.today())}. Moyennes calculées sur les jours renseignés uniquement.</p></div>`;
  }

  /* ---------- OBJECTIFS ---------- */
  function Goals() {
    const lv = C.level(xpNow()), sk = streak(), ws = C.weekStart(C.today()), ms = C.weekMissions(ws, recs());
    const [month, setMonth] = useState(C.today().slice(0, 7) + '-01'), [day, setDay] = useState(null);
    return html`<div class="page">
      <${PageHead} title="Objectifs" />
      <div class="cols">
        <div class="col">
          <section class="card lvl">
            <div class="lvl-n"><span>Niveau</span><b class="num">${lv.n}</b></div>
            <div class="lvl-r"><h2>${lv.name}</h2><${Bar} v=${lv.ratio} /><p class="muted small">${C.fmt.int(lv.xp)} XP${lv.next ? ' · encore ' + C.fmt.int(lv.next - lv.xp) + ' XP avant ' + T.LEVELS[lv.n][1] : ' · niveau maximum'}</p></div>
          </section>
          <section class="card streak">
            <div><${Icon} n="flame" s=${28} /><b class="num xl">${sk.cur}</b><span>jours de série</span></div>
            <div class="muted small">Record : ${sk.best} j. Une journée compte dès 60 points (50 les jours de repos) : pas besoin d’être parfait.</div>
          </section>
          <section class="card"><div class="card-h"><h2>Missions de la semaine</h2><span class="muted">${ms.filter(m => m.done).length}/${ms.length}</span></div>
            <ul class="missions">${ms.map(m => html`<${MissionRow} m=${m} />`)}</ul>
            <p class="muted small">Validées automatiquement à partir de tes données. Nouvelles missions chaque lundi.</p>
          </section>
          <section class="card"><h2>Gagner de l’XP</h2><ul class="xp-list">
            <li><span>Séance terminée</span><b>+50</b></li><li><span>Record battu</span><b>+20</b></li><li><span>Objectif de pas ou de protéines</span><b>+15</b></li><li><span>Cardio (max 2/jour)</span><b>+15</b></li>
            <li><span>Calories, eau ou sommeil atteints</span><b>+10</b></li><li><span>Journée à 80 points ou plus</span><b>+10</b></li><li><span>Check-in, pesée</span><b>+5</b></li><li><span>Mission hebdomadaire</span><b>+30 à 120</b></li></ul>
            <p class="muted small">L’XP est recalculée depuis tes données : décocher retire les points, impossible de les cumuler deux fois.</p></section>
        </div>
        <div class="col"><${Calendar} month=${month} setMonth=${setMonth} onDay=${setDay} /></div>
      </div>
      <${DayDetail} k=${day} onClose=${() => setDay(null)} />
    </div>`;
  }

  function dayStatus(k) {
    if (k > C.today()) return 'future';
    if (!C.hasData(k)) return C.planFor(k) === 'rest' && k < C.today() ? 'rest-empty' : 'none';
    const sc = C.score(k).score, w = C.doneSessionsOn(k).length > 0, rest = C.planFor(k) === 'rest';
    if (sc >= 85) return 'full';
    if (w) return 'workout';
    if (rest) return 'rest';
    return sc > 0 ? 'partial' : 'none';
  }
  function Calendar({ month, setMonth, onDay }) {
    const first = month, start = C.weekStart(first), mm = first.slice(0, 7);
    const days = C.range(start, C.addDays(start, 41)).filter((k, i) => i < 35 || C.range(start, C.addDays(start, 41))[35].slice(0, 7) === mm);
    const shift = n => { const d = C.parse(first); d.setMonth(d.getMonth() + n); setMonth(C.key(d)); };
    return html`<section class="card cal">
      <div class="card-h"><button class="icon-btn" onClick=${() => shift(-1)} aria-label="Mois précédent"><${Icon} n="left" /></button><h2>${C.cap(C.fmt.month(first))}</h2><button class="icon-btn" disabled=${mm >= C.today().slice(0, 7)} onClick=${() => shift(1)} aria-label="Mois suivant"><${Icon} n="right" /></button></div>
      <div class="cal-g">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => html`<span class="cal-d">${d}</span>`)}
        ${days.map(k => { const st = dayStatus(k), cardio = (S().days[k] || {}).cardio; return html`<button class=${'cal-c ' + st + (k.slice(0, 7) !== mm ? ' out' : '') + (k === C.today() ? ' now' : '')} disabled=${st === 'future'} onClick=${() => onDay(k)} aria-label=${C.fmt.long(k)}><span>${+k.slice(8)}</span>${cardio && cardio.length ? html`<i class="cdot"></i>` : null}</button>`; })}
      </div>
      <div class="cal-legend"><span class="lg full">Objectifs atteints</span><span class="lg workout">Séance faite</span><span class="lg partial">Partielle</span><span class="lg rest">Repos</span><span class="lg cardio">Cardio</span><span class="lg none">Non suivie</span></div>
    </section>`;
  }
  function DayDetail({ k, onClose }) {
    if (!k) return null;
    const cl = C.checklist(k), sc = C.score(k), t = C.dayTotals(k), ds = C.sessionsOn(k);
    return html`<${Sheet} open=${true} onClose=${onClose} title=${C.cap(C.fmt.long(k))}>
      <div class="row gap"><${Ring} v=${sc.score / 100} size=${64} sw=${6}><b>${sc.score}</b><//><div><b>${sc.plan === 'rest' ? 'Jour de repos' : T.TPL[sc.plan].name}</b><p class="muted small">${ds.filter(s => s.done).length ? 'Séance terminée' : sc.plan === 'rest' ? '' : 'Séance non réalisée'}</p></div></div>
      <div class="grid3 mt">${[['Pas', C.fmt.int(t.steps)], ['Calories', C.fmt.int(t.kcal)], ['Protéines', C.fmt.int(t.protein) + ' g'], ['Eau', C.fmt.num(t.water / 1000) + ' L'], ['Sommeil', t.sleepH ? C.fmt.num(t.sleepH) + ' h' : '–'], ['Poids', t.weight ? C.fmt.num(t.weight) + ' kg' : '–']].map(([l, v]) => html`<div class="stat-s"><span>${l}</span><b>${v}</b></div>`)}</div>
      <ul class="checks ro mt">${cl.items.map(it => html`<li class=${it.done ? 'done' : ''}><span class="cbox"><${Icon} n="check" s=${14} w=${3} /></span><div class="ct"><b>${it.label}</b><small>${it.detail}</small></div></li>`)}</ul>
      ${t.cardio.length > 0 && html`<p class="muted">Cardio : ${t.cardio.map(c => (T.CARDIO_TYPES.find(x => x[0] === c.type) || [0, 'Autre'])[1] + ' ' + c.min + ' min').join(', ')}</p>`}
      <button class="btn primary block mt" onClick=${() => { onClose(); V.set({ date: k === C.today() ? null : k }); go('home'); }}>Modifier cette journée</button>
    <//>`;
  }

  /* ---------- PROFIL & PARAMÈTRES ---------- */
  function Profile() {
    const st = S().settings;
    const set = fn => act(s => fn(s.settings));
    const [cw, setCw] = useState('');
    const [reset, setReset] = useState(false), [imp, setImp] = useState(null), [fallback, setFallback] = useState(null), [notif, setNotif] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
    const cloud = Store.cloud;
    const storageLbl = { indexeddb: 'IndexedDB (ce navigateur)', localStorage: 'Stockage local du navigateur', memory: 'Mémoire seulement : rien n’est conservé' }[Store.storage];
    const exportJson = async withPhotos => {
      const data = { app: 'transfo', version: 1, exportedAt: new Date().toISOString(), state: S() };
      if (withPhotos) { const ph = await C.Photos.all(); data.photos = await Promise.all(ph.map(async p => ({ id: p.id, date: p.date, note: p.note, data: await blobToDataUrl(p.blob) }))); }
      save('transfo-' + C.today() + '.json', JSON.stringify(data, null, 1));
    };
    const exportCsv = kind => {
      let rows;
      if (kind === 'days') { rows = [['date', 'score', 'pas', 'kcal', 'proteines_g', 'eau_ml', 'sommeil_h', 'poids_kg', 'seance', 'cardio_min']]; Object.keys(S().days).concat(S().body.map(b => b.date), S().sessions.map(s => s.date)).filter((v, i, a) => a.indexOf(v) === i).sort().forEach(k => { const t = C.dayTotals(k); const ds = C.doneSessionsOn(k); rows.push([k, C.score(k).score, t.steps, t.kcal, t.protein, t.water, t.sleepH || '', t.weight || '', ds.map(s => T.TPL[s.tpl].name).join(' / '), C.sum(t.cardio, c => +c.min || 0)]); }); }
      else { rows = [['date', 'seance', 'exercice', 'serie', 'kg', 'reps']]; S().sessions.filter(s => s.done).forEach(s => s.exercises.forEach(e => e.sets.forEach((x, j) => { if (x.done) rows.push([s.date, T.TPL[s.tpl].name, T.EX[e.id].n, j + 1, x.w || 0, x.r]); }))); }
      save('transfo-' + (kind === 'days' ? 'journal' : 'series') + '-' + C.today() + '.csv', '﻿' + rows.map(r => r.map(v => /[;"\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v).join(';')).join('\n'));
    };
    const save = async (filename, data) => {
      const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
      if (!dl) {
        try { const blob = new Blob([data], { type: filename.endsWith('.csv') ? 'text/csv' : 'application/json' }); const u = URL.createObjectURL(blob); const el = document.createElement('a'); el.href = u; el.download = filename; document.body.appendChild(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); act(s => { s.settings.lastExport = C.today(); }); toast('Fichier enregistré dans Téléchargements', { icon: 'download' }); return; } catch (e) { }
        setFallback({ filename, data: data.length > 400000 ? data.slice(0, 400000) + '\n…(tronqué à l’affichage)' : data }); return; }
      try { await dl.save({ filename, data }); act(s => { s.settings.lastExport = C.today(); }); toast('Export prêt', { icon: 'download' }); } catch (e) { if (e && e.code === 'declined') return; toast('Export impossible ici (' + ((e && e.code) || 'erreur') + ')', { kind: 'err' }); setFallback({ filename, data }); }
    };
    const onImport = ev => {
      const file = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!file) return;
      file.text().then(txt => { const d = JSON.parse(txt); if (!d || !d.state || !d.state.settings) throw new Error(); setImp(d); }).catch(() => toast('Fichier non reconnu', { kind: 'err' }));
    };
    const doImport = async () => {
      Store.replace(imp.state);
      if (imp.photos && C.Photos.available()) { for (const p of imp.photos) { try { const b = await (await fetch(p.data)).blob(); await C.Photos.put({ id: p.id, date: p.date, note: p.note, blob: b }); } catch (e) { } } }
      toast('Données restaurées', { icon: 'check' });
    };
    const askNotif = async () => {
      try { const r = await Promise.race([Notification.requestPermission(), new Promise(res => setTimeout(() => res('timeout'), 6000))]); setNotif(r); if (r === 'granted') { notify('Les notifications fonctionnent sur cet appareil.'); } else toast(r === 'timeout' ? 'Pas de réponse du navigateur : les rappels resteront dans l’app.' : 'Notifications refusées : les rappels resteront dans l’app.'); }
      catch (e) { setNotif('blocked'); toast('Notifications système bloquées ici : rappels dans l’app uniquement.'); }
    };
    return html`<div class="page">
      <${PageHead} title="Profil" />
      <div class="cols">
        <div class="col">
          <section class="card"><h2>Profil</h2>
            <${Field} label="Prénom ou pseudo"><input class="inp" value=${st.name} onChange=${e => set(s => { s.name = e.target.value.trim(); })} placeholder="Ton prénom" /><//>
            <div class="grid3"><${Field} label="Âge"><${Num} value=${st.age} onChange=${v => set(s => { s.age = v; })} suffix="ans" /><//><${Field} label="Taille"><${Num} value=${st.height} onChange=${v => set(s => { s.height = v; })} suffix="cm" /><//><${Field} label="Poids de départ"><${Num} value=${st.startWeight} step=${0.1} onChange=${v => set(s => { s.startWeight = v; })} suffix="kg" /><//></div>
            <form class="row gap" onSubmit=${e => { e.preventDefault(); if (+cw > 0) { act(s => { const b = s.body.find(x => x.date === C.today()); if (b) b.weight = +cw; else s.body.push({ id: C.uid(), date: C.today(), weight: +cw }); }); setCw(''); toast('Poids du jour enregistré', { icon: 'check' }); } }}>
              <${Field} label="Poids actuel (pesée du jour)"><${Num} value=${cw} step=${0.1} onChange=${setCw} suffix="kg" placeholder=${(C.weightSeries().slice(-1)[0] || {}).y || ''} /><//><button class="btn self-end" type="submit">Enregistrer</button>
            </form>
            <${Field} label="Début du suivi" hint="Sert de point de départ pour la série et la régularité."><input class="inp" type="date" max=${C.today()} value=${st.startDate} onInput=${e => e.target.value && set(s => { s.startDate = e.target.value; })} /><//>
          </section>
          <section class="card"><h2>Objectifs quotidiens</h2>
            <div class="grid2">
              <${Field} label="Pas"><${Num} value=${st.goals.steps} step=${500} onChange=${v => v > 0 && set(s => { s.goals.steps = v; })} /><//>
              <${Field} label="Calories"><${Num} value=${st.goals.kcal} step=${50} onChange=${v => v > 0 && set(s => { s.goals.kcal = v; })} suffix="kcal" /><//>
              <${Field} label="Protéines"><${Num} value=${st.goals.protein} step=${5} onChange=${v => v > 0 && set(s => { s.goals.protein = v; })} suffix="g" /><//>
              <${Field} label="Eau"><${Num} value=${st.goals.water} step=${250} onChange=${v => v > 0 && set(s => { s.goals.water = v; })} suffix="ml" /><//>
              <${Field} label="Sommeil"><${Num} value=${st.goals.sleep} step=${0.25} onChange=${v => v > 0 && set(s => { s.goals.sleep = v; })} suffix="h" /><//>
              <${Field} label="Cardio / semaine"><${Num} value=${st.cardioGoal} onChange=${v => set(s => { s.cardioGoal = v || 0; })} suffix="séances" /><//>
            </div>
            <p class="muted small">Repère recomposition : ~2 g de protéines par kg, léger déficit (−200 à −300 kcal) ou maintenance.</p>
          </section>
          <section class="card"><div class="card-h"><h2>Planning de base</h2><button class="btn small" onClick=${() => { go('train'); V.set({ sub: 'program' }); }}><${Icon} n="edit" s=${15} />Séances</button></div>
            ${[1, 2, 3, 4, 5, 6, 0].map(d => html`<div class="sched"><span>${T.DAY_NAMES[d]}</span><select class="inp" value=${T.TPL_ORDER.includes(st.schedule[d]) ? st.schedule[d] : 'rest'} onChange=${e => set(s => { s.schedule[d] = e.target.value; })}>${['rest', ...T.TPL_ORDER].map(v => html`<option value=${v}>${v === 'rest' ? 'Repos / récupération' : T.TPL[v].name}</option>`)}</select></div>`)}
            <${Field} label="Mobilité les jours de repos"><div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(d => html`<button class=${'chip' + ((st.mobilityDays || []).includes(d) ? ' on' : '')} onClick=${() => set(s => { s.mobilityDays = s.mobilityDays.includes(d) ? s.mobilityDays.filter(x => x !== d) : s.mobilityDays.concat(d); })}>${T.DAY_SHORT[d]}</button>`)}</div><//>
            <${Field} label="Compléments (ajoute une tâche quotidienne)"><input class="inp" value=${st.supplements} onChange=${e => set(s => { s.supplements = e.target.value; })} placeholder="ex. Créatine 5 g, vitamine D" /><//>
          </section>
          <section class="card"><h2>Temps de repos</h2>
            <div class="grid3">${[['c', 'Polyarticulaires'], ['i', 'Isolation'], ['a', 'Abdos']].map(([k, l]) => html`<${Field} label=${l}><${Num} value=${st.rest[k]} step=${15} onChange=${v => v > 0 && set(s => { s.rest[k] = v; })} suffix="s" /><//>`)}</div>
            <p class="muted small">Par défaut : 2 min 30 sur les polyarticulaires, 1 min 30 en isolation, 1 min 15 pour les abdos.</p>
          </section>
        </div>
        <div class="col">
          <section class="card"><h2>Rappels</h2>
            ${st.reminders.map((r, i) => html`<div class="rem"><label class="toggle"><input type="checkbox" checked=${r.on} onChange=${e => set(s => { s.reminders[i].on = e.target.checked; })} /><span></span>${r.label}</label><input class="inp time" type="time" value=${r.time} onChange=${e => set(s => { s.reminders[i].time = e.target.value; })} aria-label=${'Heure : ' + r.label} /></div>`)}
            <p class="note"><${Icon} n="bell" s=${16} />Les rappels se déclenchent quand l’appli est ouverte ou en arrière-plan récent, et à l’ouverture s’ils datent de moins de 4 h. Une appli web ne peut pas programmer une notification téléphone verrouillé sans serveur d’envoi : ce n’est pas inclus.</p>
            ${notif !== 'unsupported' && notif !== 'granted' && html`<button class="btn small ghost" onClick=${askNotif}>Essayer les notifications système (app ouverte)</button>`}
            ${notif === 'granted' && html`<p class="muted small">Notifications système autorisées : envoyées tant que l’app est ouverte.</p>`}
          </section>
          <${InstallCard} />
          <section class="card"><h2>Apparence</h2><${Seg} value=${st.theme} onChange=${v => set(s => { s.theme = v; })} options=${[['dark', 'Sombre'], ['light', 'Clair'], ['system', 'Système']]} />
            <p class="muted small mt-s">Unités : métriques (kg, cm, ml, km).</p></section>
          <section class="card"><h2>Sauvegarde</h2>
            <ul class="rows"><li><span>Sur cet appareil</span><b class=${Store.storage === 'memory' ? 'neg' : 'acc'}>${storageLbl}</b></li>
              ${window.claude ? html`<li><span>Sur ton compte</span><b class=${cloud.status === 'ok' ? 'acc' : cloud.status === 'error' ? 'neg' : ''}>${cloud.status === 'ok' ? 'Synchronisé' + (cloud.at ? ' à ' + new Date(cloud.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '') : cloud.status === 'connecting' ? 'Connexion…' : cloud.status === 'error' ? 'En attente' : 'Inactif'}</b></li>` : null}</ul>
            ${cloud.msg && html`<p class="muted small">${cloud.msg}</p>`}
            <p class="muted small">Sauvegarde automatique à chaque action, dans ce téléphone. ${Store.persisted ? 'Stockage protégé contre le nettoyage automatique du navigateur.' : ''} Exporte régulièrement (JSON + photos) et garde le fichier sur Drive : c’est ta copie de secours si tu changes de téléphone.</p>
            <p class=${'small ' + (!st.lastExport || C.diffDays(st.lastExport, C.today()) > 14 ? 'neg' : 'muted')}>${st.lastExport ? 'Dernier export : ' + C.fmt.long(st.lastExport) : 'Aucun export pour l’instant.'}</p>
            <div class="row gap wrap mt-s">
              <button class="btn small" onClick=${() => exportJson(false)}><${Icon} n="download" s=${16} />Export JSON</button>
              <button class="btn small" onClick=${() => exportJson(true)}><${Icon} n="download" s=${16} />JSON + photos</button>
              <button class="btn small" onClick=${() => exportCsv('days')}><${Icon} n="download" s=${16} />CSV journal</button>
              <button class="btn small" onClick=${() => exportCsv('sets')}><${Icon} n="download" s=${16} />CSV séries</button>
              <label class="btn small"><${Icon} n="upload" s=${16} />Restaurer<input type="file" accept="application/json,.json" hidden onChange=${onImport} /></label>
            </div>
          </section>
          <section class="card"><h2>Zone sensible</h2><p class="muted small">Efface toutes les données de suivi, sur cet appareil et sur ton compte.</p><button class="btn danger mt-s" onClick=${() => setReset(true)}><${Icon} n="trash" s=${16} />Réinitialiser les données</button></section>
        </div>
      </div>
      <${Confirm} open=${reset} title="Tout effacer ?" text="Séances, mesures, nutrition, photos et paramètres seront supprimés. Exporte tes données avant si tu veux les garder." ok="Tout effacer" danger typed="SUPPRIMER" onClose=${() => setReset(false)} onOk=${async () => { await C.Photos.clear().catch(() => { }); Store.replace(C.emptyState()); act(s => { s.settings.startDate = C.today(); }); toast('Données réinitialisées'); go('home'); }} />
      <${Confirm} open=${!!imp} title="Restaurer cette sauvegarde ?" text=${imp ? 'Export du ' + new Date(imp.exportedAt).toLocaleDateString('fr-FR') + ' : tes données actuelles seront remplacées' + (imp.photos ? ' (' + imp.photos.length + ' photo(s) ajoutée(s))' : '') + '.' : ''} ok="Restaurer" onClose=${() => setImp(null)} onOk=${doImport} />
      <${Sheet} open=${!!fallback} onClose=${() => setFallback(null)} title="Export">
        ${fallback && html`<p class="muted small">Le téléchargement n’est pas disponible dans cette vue. Copie le contenu ci-dessous et colle-le dans un fichier « ${fallback.filename} ».</p>
        <textarea class="inp mono" rows="10" readonly value=${fallback.data}></textarea>
        <button class="btn primary block mt" onClick=${async () => { try { await navigator.clipboard.writeText(fallback.data); toast('Copié', { icon: 'check' }); } catch (e) { toast('Copie impossible : sélectionne le texte manuellement.'); } }}>Copier</button>`}
      <//>
    </div>`;
  }
  const blobToDataUrl = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });

  /* ---------- Rappels ---------- */
  async function notify(body) {
    try {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (reg) await reg.showNotification('Transfo', { body, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'transfo-' + body.length });
      else new Notification('Transfo', { body });
    } catch (e) { }
  }
  const fired = new Set();
  function checkReminders() {
    const st = S().settings, now = new Date(), k = C.today(), hm = now.getHours() * 60 + now.getMinutes();
    for (const r of st.reminders) {
      if (!r.on || !r.time) continue;
      const [h, m] = r.time.split(':').map(Number), at = h * 60 + m, id = k + r.id;
      if (hm < at || hm - at > 240 || fired.has(id)) continue;
      let firedKey = null; try { firedKey = localStorage.getItem('transfo-rem-' + id); } catch (e) { }
      if (firedKey) { fired.add(id); continue; }
      const t = C.dayTotals(k), plan = C.planFor(k), done = C.doneSessionsOn(k).length;
      const msg = {
        workout: plan !== 'rest' && !done ? 'C’est l’heure de ta séance ' + T.TPL[plan].name + '.' : null,
        water: t.water < st.goals.water ? 'Hydratation : ' + C.fmt.num(t.water / 1000) + ' L sur ' + C.fmt.num(st.goals.water / 1000) + ' L.' : null,
        weigh: !t.weight ? 'Pesée du matin : à jeun, après être passé aux toilettes.' : null,
        checkin: !t.checkin ? 'Check-in du jour : 30 secondes.' : null,
        prep: plan !== 'rest' && !done ? 'Prépare ton sac pour ' + T.TPL[plan].name + '.' : null,
        sleep: 'Il est temps de lancer ta routine de coucher.',
      }[r.id];
      fired.add(id); try { localStorage.setItem('transfo-rem-' + id, '1'); } catch (e) { }
      if (!msg) continue;
      const target = { workout: () => go('home'), water: () => { go('home'); V.set({ sub: 'water' }); }, weigh: () => { go('prog'); V.set({ progSeg: 'body' }); }, checkin: () => { go('home'); V.set({ sub: 'checkin' }); } }[r.id];
      toast(msg, { icon: 'bell', ms: 12000, action: target ? { label: 'Ouvrir', fn: target } : null });
      notify(msg);
    }
  }

  /* ---------- Installation ---------- */
  let installEvt = null; const installFns = new Set();
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; installFns.forEach(f => f()); });
  window.addEventListener('appinstalled', () => { installEvt = null; installFns.forEach(f => f()); toast('Application installée', { icon: 'check' }); });
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  function InstallCard() {
    const [, f] = useState(0);
    useEffect(() => { const g = () => f(x => x + 1); installFns.add(g); return () => installFns.delete(g); }, []);
    if (window.claude) return null;
    return html`<section class="card"><h2>Application</h2>
      ${standalone() ? html`<p class="muted small">Installée sur cet appareil. Fonctionne hors ligne.</p>`
        : installEvt ? html`<p class="muted small">Ajoute Transfo à ton écran d’accueil : plein écran, hors ligne.</p><button class="btn primary mt-s" onClick=${async () => { installEvt.prompt(); try { await installEvt.userChoice; } catch (e) { } installEvt = null; f(x => x + 1); }}><${Icon} n="download" s=${16} />Installer l’application</button>`
        : html`<p class="muted small">Pour l’installer : menu ⋮ de Chrome → « Installer l’application » (ou « Ajouter à l’écran d’accueil »).</p>`}
    </section>`;
  }

  /* ---------- Célébrations ---------- */
  function Celebrate() {
    const c = V.s.celebrate; if (!c) return null;
    const close = () => { if (c.kind === 'level') act(s => { s.seenLevel = c.n; }); V.set({ celebrate: null }); };
    return html`<div class="scrim center" onClick=${e => e.target === e.currentTarget && close()}><div class="celebrate" role="dialog" aria-modal="true">
      <div class="burst" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => html`<i style=${{ '--a': i * 30 + 'deg' }}></i>`)}</div>
      ${c.kind === 'level' ? html`<span class="muted">Nouveau niveau</span><b class="num huge">${c.n}</b><h2>${c.name}</h2><p class="muted">La régularité paie. Continue comme ça.</p>`
        : html`<${Icon} n="check" s=${40} w=${2.5} /><h2>${c.title}</h2><p class="muted">${c.sets} séries · ${C.fmt.int(c.vol)} kg soulevés</p>
          ${c.prs.length ? html`<div class="prs"><p class="pr-line"><${Icon} n="trophy" s=${18} />${c.prs.length} record${c.prs.length > 1 ? 's' : ''} battu${c.prs.length > 1 ? 's' : ''}</p>${c.prs.map(p => html`<div class="pr"><span>${T.EX[p.ex].n}</span><b>${p.kind === 'w' ? C.fmt.num(p.v) + ' kg' : p.kind === 'e1' ? '1RM ~' + C.fmt.num(p.v) + ' kg' : p.v + ' reps'}</b></div>`)}</div>` : null}`}
      <button class="btn primary block mt" onClick=${close}>Continuer</button>
    </div></div>`;
  }

  /* ---------- Application ---------- */
  function App() {
    const [, force] = useState(0);
    useEffect(() => {
      const f = () => force(x => x + 1);
      const u1 = Store.sub(f); V.fns.add(f); f();
      let day = C.today();
      const t = setInterval(() => { if (C.today() !== day) { day = C.today(); Store.emit(); } checkReminders(); }, 30000);
      setTimeout(checkReminders, 3000);
      return () => { u1(); V.fns.delete(f); clearInterval(t); };
    }, []);
    const st = S().settings;
    useEffect(() => {
      const apply = () => { const dark = st.theme === 'dark' || (st.theme === 'system' && !(window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches)); document.documentElement.dataset.app = dark ? 'dark' : 'light'; };
      apply();
    }, [st.theme]);
    useEffect(() => {
      if (!Store.ready) return;
      const lv = C.level(xpNow()).n;
      if (!S().seenLevel) act(s => { s.seenLevel = lv; });
      else if (lv > S().seenLevel && !V.s.celebrate) V.set({ celebrate: { kind: 'level', n: lv, name: T.LEVELS[lv - 1][1] } });
    });
    if (!Store.ready) return html`<div class="boot"><div class="skel" style="height:140px"></div><div class="skel" style="height:260px"></div></div>`;
    const tab = V.s.tab, sub = V.s.sub;
    const Page = sub === 'program' ? ProgramPage : sub === 'tpl' ? TemplateEditor : sub === 'steps' ? StepsPage : sub === 'water' ? WaterPage : sub === 'food' ? FoodPage : sub === 'checkin' ? CheckinPage
      : tab === 'train' ? Train : tab === 'prog' ? Prog : tab === 'goals' ? Goals : tab === 'profile' ? Profile : Home;
    const open = !V.s.workout && openSessionToday();
    return html`<div class="app">
      <${Nav} />
      <main class="main" key=${tab + (sub || '')}><${Page} /></main>
      ${open && html`<button class="resume" onClick=${() => V.set({ workout: open.id })}><span class="pulse"></span>Séance en cours · ${T.TPL[open.tpl].name}<b>Reprendre</b></button>`}
      ${V.s.workout && html`<${Workout} id=${V.s.workout} />`}
      ${!V.s.workout && V.s.rest && html`<${RestTimer} />`}
      <${Celebrate} />
      <${Toasts} />
    </div>`;
  }

  render(html`<${App} />`, document.getElementById('root'));
  C.boot();
})();
