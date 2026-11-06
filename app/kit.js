'use client';
import { useEffect, useRef, useState } from 'react';

export const INK = '#2a2723';
export const RED = '#b5392b';
export const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Runs cb(dt, t) every animation frame and re-renders the component.
export function useFrame(cb) {
  const ref = useRef(cb);
  ref.current = cb;
  const [, tick] = useState(0);
  useEffect(() => {
    let raf, last = performance.now(), t = 0;
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; t += dt;
      ref.current(dt, t);
      tick((x) => x + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

// Arc-length sampler over a polyline.
export function track(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1] || 1;
  const at = (s) => {
    s = ((s % L) + L) % L;
    let lo = 1, hi = cum.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < s) lo = m + 1; else hi = m; }
    const f = (s - cum[lo - 1]) / (cum[lo] - cum[lo - 1] || 1);
    const a = pts[lo - 1], b = pts[lo];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, lo - 1];
  };
  return { L, at };
}

export const d = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');

export function Electrons({ pts, phase = 0, gap = 16, r = 3.3, faint, color = '#3d6dff' }) {
  const { L, at } = track(pts);
  const n = Math.max(1, Math.round(L / gap)), g = L / n;
  const dots = [];
  for (let k = 0; k < n; k++) {
    const [x, y, seg] = at(k * g + phase);
    dots.push(<circle key={k} cx={x} cy={y} r={r} fill={color} opacity={faint && faint(x, y, seg) ? 0.2 : 0.95} />);
  }
  return <g filter="url(#glow)">{dots}</g>;
}

export const Defs = () => (
  <defs>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke={INK} strokeWidth="0.7" opacity=".55" />
    </pattern>
    <pattern id="hatch2" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <line x1="0" y1="0" x2="0" y2="4" stroke={INK} strokeWidth="0.8" opacity=".7" />
    </pattern>
    <linearGradient id="cylH" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" /><stop offset=".35" stopColor="#f3f1ec" /><stop offset="1" stopColor="#bdb7aa" />
    </linearGradient>
    <linearGradient id="cylV" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#c9c2b3" /><stop offset=".4" stopColor="#fbfaf7" /><stop offset="1" stopColor="#a9a293" />
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
  </defs>
);

export const Art = ({ children, vb = '0 0 640 440' }) => (
  <svg viewBox={vb} className="art"><Defs />{children}</svg>
);

export const Slab = ({ x, y, w, h, dp = 16, ruler }) => (
  <g>
    <rect x={x + 12} y={y + 16} width={w} height={h + dp} fill="#000" opacity=".22" filter="url(#blur)" />
    <rect x={x} y={y + h} width={w} height={dp} fill="#ece8df" stroke={INK} strokeWidth="1.3" />
    <rect x={x} y={y + h} width={w} height={dp} fill="url(#hatch)" />
    <rect x={x} y={y} width={w} height={h} fill="#fbfaf6" stroke={INK} strokeWidth="1.5" />
    {ruler && Array.from({ length: Math.floor(w / 8) }, (_, i) => (
      <line key={i} x1={x + 6 + i * 8} y1={y + h} x2={x + 6 + i * 8} y2={y + h - (i % 5 ? 4 : 8)} stroke={INK} strokeWidth=".7" />
    ))}
  </g>
);

export const Tube = ({ pts, w = 6 }) => (
  <g fill="none" strokeLinejoin="round" strokeLinecap="round">
    <path d={d(pts)} stroke={INK} strokeWidth={w} />
    <path d={d(pts)} stroke="#fdfcf9" strokeWidth={w - 2.8} />
  </g>
);

export const Hidden = ({ pts }) => (
  <path d={d(pts)} fill="none" stroke={INK} strokeWidth="1" strokeDasharray="5 5" opacity=".6" />
);

export const Lab = ({ n, x, y, tx, ty }) => (
  <g pointerEvents="none">
    <path d={`M${x} ${y} L${tx} ${ty}`} stroke={INK} strokeWidth=".9" fill="none" />
    <text x={tx + (tx >= x ? 3 : -3)} y={ty + (ty >= y ? 14 : -2)} textAnchor={tx >= x ? 'start' : 'end'} className="lab">{n}</text>
  </g>
);

export function Arrow({ x1, y1, x2, y2, c = RED, w = 2.2, h = 10, label, lx = 6, ly = -6 }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  if (Math.hypot(x2 - x1, y2 - y1) < 2) return null;
  const bx = x2 - h * Math.cos(a), by = y2 - h * Math.sin(a);
  const s = h * 0.45;
  return (
    <g pointerEvents="none">
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${bx + s * Math.sin(a)},${by - s * Math.cos(a)} ${bx - s * Math.sin(a)},${by + s * Math.cos(a)}`} fill={c} />
      {label && <text x={x2 + lx} y={y2 + ly} className="vec" fill={c}>{label}</text>}
    </g>
  );
}

// Horizontal cylinder cell. Plus terminal on the right unless flip.
export function Cell({ x, y, l = 104, r = 15, flip, onClick, vertical }) {
  const x0 = x - l / 2, x1 = x + l / 2;
  const plus = flip ? x0 : x1, minus = flip ? x1 : x0;
  return (
    <g className={onClick ? 'hot' : ''} onClick={onClick} transform={vertical ? `rotate(90 ${x} ${y})` : undefined}>
      <rect x={x0} y={y - r} width={l} height={2 * r} rx="3" fill="url(#cylH)" stroke={INK} strokeWidth="1.4" />
      <rect x={x0 + l * 0.62} y={y - r} width={l * 0.38 - 3} height={2 * r} fill="url(#hatch)" opacity=".5" />
      <ellipse cx={x1} cy={y} rx="5" ry={r} fill="#f4f2ed" stroke={INK} strokeWidth="1.2" />
      <rect x={plus + (flip ? -7 : 2)} y={y - 4} width="5" height="8" rx="1.5" fill="#e8e4da" stroke={INK} strokeWidth="1" />
      <text x={plus + (flip ? 12 : -14)} y={y + 6} className="sign" textAnchor="middle" transform={vertical ? `rotate(-90 ${plus + (flip ? 12 : -14)} ${y + 1})` : undefined}>+</text>
      <text x={minus + (flip ? -14 : 14)} y={y + 6} className="sign" textAnchor="middle" transform={vertical ? `rotate(-90 ${minus + (flip ? -14 : 14)} ${y + 1})` : undefined}>−</text>
    </g>
  );
}

// Knife switch: pivot at (x, y), contact at x + 62.
export const Switch = ({ x, y, on, onClick }) => (
  <g className="hot" onClick={onClick}>
    <rect x={x - 12} y={y - 2} width="86" height="14" rx="2" fill="#f4f1ea" stroke={INK} strokeWidth="1.2" />
    <rect x={x - 12} y={y - 2} width="86" height="14" fill="url(#hatch)" opacity=".5" />
    <rect x={x - 5} y={y - 9} width="9" height="9" fill="#e9e5db" stroke={INK} strokeWidth="1" />
    <rect x={x + 58} y={y - 9} width="9" height="9" fill="#e9e5db" stroke={INK} strokeWidth="1" />
    <g transform={`rotate(${on ? 0 : -36} ${x} ${y - 6})`} style={{ transition: 'transform .25s' }}>
      <rect x={x} y={y - 9} width="66" height="5" rx="2" fill="#ddd7ca" stroke={INK} strokeWidth="1.1" />
      <rect x={x + 58} y={y - 22} width="6" height="14" rx="3" fill="#fbfaf6" stroke={INK} strokeWidth="1.1" />
    </g>
  </g>
);

// Compass lying on a floor seen obliquely; a = needle angle in floor coords.
export function Compass({ x, y, a, k = 0.42, r = 22 }) {
  const ux = Math.cos(a), uy = Math.sin(a) * k, L = r * 0.86;
  const px = -Math.sin(a) * 3.4, py = Math.cos(a) * 3.4 * k;
  return (
    <g>
      <path d={`M${x - r} ${y} L${x - r} ${y + 5} A${r} ${r * k} 0 0 0 ${x + r} ${y + 5} L${x + r} ${y} Z`} fill="#e3ddcf" stroke={INK} strokeWidth="1.1" />
      <ellipse cx={x} cy={y} rx={r} ry={r * k} fill="#fdfcf8" stroke={INK} strokeWidth="1.3" />
      <polygon points={`${x + ux * L},${y + uy * L} ${x + px},${y + py} ${x - px},${y - py}`} fill={RED} stroke={INK} strokeWidth=".5" />
      <polygon points={`${x - ux * L},${y - uy * L} ${x + px},${y + py} ${x - px},${y - py}`} fill={INK} />
      <circle cx={x} cy={y} r="1.6" fill="#fff" stroke={INK} strokeWidth=".6" />
    </g>
  );
}

export const FieldMark = ({ x, y, into, o = 1, s = 5 }) => (
  <g opacity={o} stroke={RED} strokeWidth="1.1" fill="none">
    <circle cx={x} cy={y} r={s} />
    {into ? <path d={`M${x - s * 0.7} ${y - s * 0.7} L${x + s * 0.7} ${y + s * 0.7} M${x + s * 0.7} ${y - s * 0.7} L${x - s * 0.7} ${y + s * 0.7}`} />
      : <circle cx={x} cy={y} r="1.3" fill={RED} />}
  </g>
);

// Hand-drawn loop around a word.
export const Circled = () => (
  <svg className="circled" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
    <path d="M60 4 C 90 3, 99 14, 96 24 C 92 36, 40 39, 14 34 C -2 30, 0 12, 18 7 C 34 2, 55 2, 74 6" fill="none" stroke={INK} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
  </svg>
);

export const Slide = ({ label, min, max, step, value, onChange, show }) => (
  <label className="slide">
    <span className="sl-l">{label}</span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    <span className="sl-v">{show(value)}</span>
  </label>
);

export const Pick = ({ label, opts, value, onChange }) => (
  <div className="pick">
    <span className="sl-l">{label}</span>
    {opts.map((o, i) => (
      <button key={o} className={i === value ? 'on' : ''} onClick={() => onChange(i)}>
        {o}{i === value && <Circled />}
      </button>
    ))}
  </div>
);

export const Readout = ({ children }) => <div className="readout">{children}</div>;
