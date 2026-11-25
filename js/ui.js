/* Composants d'interface partagés : icônes, anneaux, barres, graphiques, feuilles, toasts. */
(function () {
  const { html, useState, useEffect, useRef } = htmPreact;
  const C = Core;

  const P = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
    dumbbell: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11',
    chart: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.5v1',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    x: 'M6 6l12 12M18 6 6 18',
    left: 'M15 6l-6 6 6 6', up: 'M6 15l6-6 6 6', right: 'M9 6l6 6-6 6', down: 'M6 9l6 6 6-6',
    steps: 'M8 3.5c1.7 0 3 1.8 3 4.5s-1 4.5-2.5 4.5S6 10.7 6 8s.3-4.5 2-4.5zM6.5 15h4v1.5a2 2 0 0 1-4 0zM16 7.5c1.7 0 2 3.5 2 5s-1 3.5-2.5 3.5S13 14.5 13 12.5s1.3-5 3-5zM13.5 18h4v1.5a2 2 0 0 1-4 0z',
    drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
    food: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1.5-3 4-3 7h3v11',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
    flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .5 2 1.5 3 2.5 3-1-3 0-6 0-8z',
    timer: 'M12 9v4l2.5 2M9 2.5h6M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
    trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5v1A3.5 3.5 0 0 0 8 10.5M16 6h3.5v1a3.5 3.5 0 0 1-3.5 3.5M12 13v4M9 21h6M10 17h4v4h-4z',
    calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
    camera: 'M4 8h3l2-3h6l2 3h3v12H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
    bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
    download: 'M12 4v11M7 10l5 5 5-5M4 20h16',
    upload: 'M12 20V9M7 14l5-5 5 5M4 4h16',
    play: 'M7 4.5v15l12-7.5z',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5.5M12 7.5v.5',
    pulse: 'M3 12h4l3-7 4 14 3-7h4',
    star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z',
    swap: 'M7 4 3 8l4 4M3 8h13M17 12l4 4-4 4M21 16H8',
    bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
    scale: 'M5 4h14l1.5 16h-17zM9 9.5a3 3 0 0 1 6 0M12 9.5l1.5-2',
    sliders: 'M4 7h9M17 7h3M15 5v4M4 17h3M11 17h9M9 15v4',
    cloud: 'M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z',
    pause: 'M8 5v14M16 5v14',
    list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.5M4.5 12h.5M4.5 18h.5',
  };
  const Icon = ({ n, s = 20, w = 1.8 }) => html`<svg class="ic" width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${w} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${P[n]} /></svg>`;

  const Ring = ({ v, size = 120, sw = 10, color = 'var(--acc)', children }) => {
    const r = (size - sw) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, v || 0));
    return html`<div class="ring" style=${{ width: size + 'px', height: size + 'px' }}>
      <svg width=${size} height=${size} viewBox=${'0 0 ' + size + ' ' + size}>
        <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--track)" stroke-width=${sw} />
        <circle class="ring-v" cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${color} stroke-width=${sw} stroke-linecap="round" stroke-dasharray=${c} stroke-dashoffset=${c * (1 - p)} transform=${'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'} />
      </svg><div class="ring-c">${children}</div></div>`;
  };

  const Bar = ({ v, color, thin }) => html`<div class=${'bar' + (thin ? ' thin' : '')}><i style=${{ width: Math.max(0, Math.min(1, v || 0)) * 100 + '%', background: color || 'var(--acc)' }}></i></div>`;

  function useWidth() {
    const ref = useRef(null); const [w, setW] = useState(0);
    useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); setW(el.clientWidth); return () => ro.disconnect(); }, []);
    return [ref, w];
  }

  /* Graphique linéaire temporel. series: [{pts:[{x:'YYYY-MM-DD',y}], color, dots, dash, w}] */
  function LineChart({ series, from, to, h = 180, fmtY = C.fmt.num, unit = '', empty = 'Pas encore de données' }) {
    const [ref, W] = useWidth();
    const all = series.flatMap(s => s.pts.filter(p => p.x >= from && p.x <= to));
    if (!all.length) return html`<div class="empty-chart" style=${{ height: h + 'px' }}>${empty}</div>`;
    let lo = Math.min(...all.map(p => p.y)), hi = Math.max(...all.map(p => p.y));
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; } const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
    const L = 40, R = 12, Tp = 12, B = 24, span = Math.max(1, C.diffDays(from, to));
    const X = k => L + (W - L - R) * (C.diffDays(from, k) / span), Y = v => Tp + (h - Tp - B) * (1 - (v - lo) / (hi - lo));
    const ticks = [0, 0.5, 1].map(f => lo + (hi - lo) * f);
    const xt = [from, C.addDays(from, Math.round(span / 2)), to];
    return html`<div class="chart" ref=${ref} style=${{ height: h + 'px' }}>${W > 0 && html`<svg width=${W} height=${h}>
      ${ticks.map(t => html`<line x1=${L} x2=${W - R} y1=${Y(t)} y2=${Y(t)} class="grid" /><text x=${L - 8} y=${Y(t) + 4} class="axis" text-anchor="end">${fmtY(t)}</text>`)}
      ${xt.map((k, i) => html`<text x=${X(k)} y=${h - 6} class="axis" text-anchor=${i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>${C.fmt.dm(k)}</text>`)}
      ${series.map(s => { const pts = s.pts.filter(p => p.x >= from && p.x <= to); if (!pts.length) return null; const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(''); return html`<g>
        ${pts.length > 1 && html`<path d=${d} fill="none" stroke=${s.color} stroke-width=${s.w || 2.5} stroke-linejoin="round" stroke-linecap="round" stroke-dasharray=${s.dash || ''} />`}
        ${(s.dots || pts.length === 1) && pts.map(p => html`<circle cx=${X(p.x)} cy=${Y(p.y)} r=${s.r || 3.5} fill=${s.color} />`)}</g>`; })}
      ${(() => { const s = series[series.length - 1]; const pts = s.pts.filter(p => p.x >= from && p.x <= to); const p = pts[pts.length - 1]; if (!p) return null; return html`<text x=${Math.min(W - R, X(p.x))} y=${Math.max(12, Y(p.y) - 10)} text-anchor="end" class="lbl">${fmtY(p.y)}${unit}</text>`; })()}
    </svg>`}</div>`;
  }

  /* Histogramme HTML. data: [{label, v, hi}] */
  const BarChart = ({ data, goal, h = 150, color = 'var(--acc)', fmtV = C.fmt.int, showV = true }) => {
    const max = Math.max(goal || 0, ...data.map(d => d.v), 1);
    return html`<div class="bars" style=${{ height: h + 'px' }}>
      ${goal ? html`<div class="goal-line" style=${{ bottom: (goal / max) * (h - 38) + 20 + 'px' }}><span>${fmtV(goal)}</span></div>` : null}
      ${data.map(d => html`<div class="bcol" title=${d.label + ' : ' + fmtV(d.v)}>
        ${showV && data.length <= 8 && html`<em>${d.v ? fmtV(d.v) : ''}</em>`}
        <div class="btrack"><i style=${{ height: (d.v / max) * 100 + '%', background: d.v >= (goal || Infinity) ? color : (d.hi ? color : 'var(--bar-dim)') }}></i></div>
        <span>${d.label}</span></div>`)}
    </div>`;
  };

  function Sheet({ open, onClose, title, children, wide }) {
    useEffect(() => { if (!open) return; const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
    if (!open) return null;
    return html`<div class="scrim" onClick=${e => { if (e.target === e.currentTarget) onClose(); }}>
      <div class=${'sheet' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label=${title}>
        <div class="sheet-h"><h3>${title}</h3><button class="icon-btn" onClick=${onClose} aria-label="Fermer"><${Icon} n="x" /></button></div>
        <div class="sheet-b">${children}</div>
      </div></div>`;
  }

  /* Toasts avec annulation */
  const toasts = { list: [], fns: new Set() };
  function toast(msg, opts = {}) {
    const t = { id: C.uid(), msg, ...opts };
    toasts.list = toasts.list.concat(t).slice(-3); toasts.fns.forEach(f => f());
    setTimeout(() => dismiss(t.id), opts.ms || (opts.undo ? 6000 : 3200));
  }
  function dismiss(id) { toasts.list = toasts.list.filter(t => t.id !== id); toasts.fns.forEach(f => f()); }
  function Toasts() {
    const [, set] = useState(0);
    useEffect(() => { const f = () => set(x => x + 1); toasts.fns.add(f); return () => toasts.fns.delete(f); }, []);
    return html`<div class="toasts" role="status" aria-live="polite">${toasts.list.map(t => html`<div class=${'toast ' + (t.kind || '')} key=${t.id}>
      ${t.icon && html`<${Icon} n=${t.icon} s=${18} />`}<span>${t.msg}</span>
      ${t.undo && html`<button onClick=${() => { C.Store.restore(t.undo); dismiss(t.id); }}>Annuler</button>`}
      ${t.action && html`<button onClick=${() => { t.action.fn(); dismiss(t.id); }}>${t.action.label}</button>`}
    </div>`)}</div>`;
  }

  const Seg = ({ value, options, onChange, small }) => html`<div class=${'seg' + (small ? ' small' : '')} role="tablist">${options.map(([v, l]) => html`<button type="button" role="tab" aria-selected=${value === v} class=${value === v ? 'on' : ''} onClick=${() => onChange(v)}>${l}</button>`)}</div>`;

  const Num = ({ value, onChange, step = 1, min = 0, suffix, id, placeholder }) => html`<div class="numin">
    <input id=${id} type="number" inputmode="decimal" step=${step} min=${min} value=${value ?? ''} placeholder=${placeholder || ''} onInput=${e => onChange(e.target.value === '' ? '' : +e.target.value)} />${suffix && html`<span>${suffix}</span>`}</div>`;

  const Field = ({ label, children, hint }) => html`<label class="field"><span class="fl">${label}</span>${children}${hint && html`<small>${hint}</small>`}</label>`;

  const Empty = ({ icon, title, text, children }) => html`<div class="empty"><div class="empty-i"><${Icon} n=${icon} s=${26} /></div><strong>${title}</strong>${text && html`<p>${text}</p>`}${children}</div>`;

  /* Confirmation intégrée (confirm() est bloqué dans le bac à sable) */
  function Confirm({ open, title, text, ok = 'Confirmer', danger, onOk, onClose, typed }) {
    const [v, setV] = useState('');
    if (!open) return null;
    const can = !typed || v.trim().toUpperCase() === typed;
    return html`<${Sheet} open=${open} title=${title} onClose=${onClose}>
      <p class="muted">${text}</p>
      ${typed && html`<${Field} label=${'Tape ' + typed + ' pour confirmer'}><input class="inp" value=${v} onInput=${e => setV(e.target.value)} /><//>`}
      <div class="row gap end mt"><button class="btn ghost" onClick=${onClose}>Annuler</button><button class=${'btn ' + (danger ? 'danger' : 'primary')} disabled=${!can} onClick=${() => { onOk(); onClose(); }}>${ok}</button></div>
    <//>`;
  }

  let audio = null;
  const unlockAudio = () => { try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) { } };
  function beep() {
    try {
      if (!audio) return; const t = audio.currentTime;
      [0, 0.22, 0.44].forEach((d, i) => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = i === 2 ? 1175 : 880; g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18); o.connect(g).connect(audio.destination); o.start(t + d); o.stop(t + d + 0.2); });
    } catch (e) { }
    try { navigator.vibrate && navigator.vibrate([180, 80, 180]); } catch (e) { }
  }
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(12); } catch (e) { } };

  window.UI = { Icon, Ring, Bar, LineChart, BarChart, Sheet, toast, Toasts, Seg, Num, Field, Empty, Confirm, unlockAudio, beep, buzz, useWidth };
})();
