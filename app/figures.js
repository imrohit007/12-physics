'use client';
import { useRef, useState } from 'react';
import {
  INK, RED, wrap, d, useFrame, Art, Slab, Tube, Hidden, Electrons, Lab, Arrow, Cell, Switch, Compass,
  FieldMark, Slide, Pick, Readout,
} from './kit';

const TAU = Math.PI * 2;
const NORTH = Math.atan2(-0.87, 0.5);
const sci = (v, p = 2) => { const e = Math.floor(Math.log10(Math.abs(v) || 1)); return <>{(v / 10 ** e).toFixed(p)} × 10<sup>{e}</sup></>; };

/* 1 ─ Oersted: ring of compasses round a vertical wire */
export function FigOersted({ onDone }) {
  const [on, setOn] = useState(false), [rev, setRev] = useState(false);
  const S = useRef({ a: Array(8).fill(NORTH), w: Array(8).fill(0), ph: 0 }).current;
  const cx = 320, cy = 288, rx = 165, ry = 62, dir = rev ? -1 : 1;
  const tgt = (k) => { const th = k * Math.PI / 4; return on ? Math.atan2(-Math.cos(th) * dir, Math.sin(th) * dir) : NORTH; };
  useFrame((dt) => {
    let settled = true;
    for (let k = 0; k < 8; k++) {
      const df = wrap(tgt(k) - S.a[k]);
      S.w[k] += (df * 40 - S.w[k] * 5) * dt; S.a[k] += S.w[k] * dt;
      if (Math.abs(df) > 0.06) settled = false;
    }
    if (on) S.ph -= dir * 55 * dt;
    if (on && rev && settled) onDone();
  });
  const loop = [[cx, cy], [cx, 50], [590, 50], [590, 375], [70, 375], [70, cy], [cx, cy]];
  const comp = Array.from({ length: 8 }, (_, k) => ({ k, th: k * Math.PI / 4 }));
  const back = comp.filter((c) => Math.sin(c.th) < 0), front = comp.filter((c) => Math.sin(c.th) >= 0);
  const C = (c) => <Compass key={c.k} x={cx + rx * Math.cos(c.th)} y={cy + ry * Math.sin(c.th)} a={S.a[c.k]} />;
  return (<>
    <Art>
      <Slab x={30} y={190} w={580} h={210} />
      <Hidden pts={[[70, cy], [cx, cy]]} />
      <Tube pts={loop.slice(1, 6)} />
      <ellipse cx={590} cy={200} rx="10" ry="4" fill="#ddd" stroke={INK} />
      {back.map(C)}
      <Tube pts={loop.slice(0, 2)} />
      <ellipse cx={cx} cy={cy} rx="9" ry="4" fill="#cfc9bb" stroke={INK} />
      <Electrons pts={loop} phase={S.ph} faint={(x, y, s) => s === 5} />
      {front.map(C)}
      <Cell x={450} y={375} flip={dir === 1} onClick={() => setRev(!rev)} />
      <Switch x={200} y={375} on={on} onClick={() => setOn(!on)} />
      {on && <Arrow x1={cx + 14} y1={170} x2={cx + 14} y2={dir === 1 ? 120 : 220} c={INK} w={1.5} label="I" />}
      <Lab n="1" x={470} y={390} tx={500} ty={418} />
      <Lab n="2" x={215} y={390} tx={190} ty={418} />
      <Lab n="3" x={cx} y={130} tx={370} ty={110} />
      <Lab n="4" x={cx + rx + 18} y={cy} tx={565} ty={250} />
      <Lab n="5" x={90} y={205} tx={70} ty={165} />
    </Art>
    <Readout>Current: <b>{on ? (dir === 1 ? 'up the wire' : 'down the wire') : 'off'}</b> · needles {on ? (dir === 1 ? 'anticlockwise' : 'clockwise') + ' seen from above' : 'point north'}</Readout>
  </>);
}

/* 2 ─ Lorentz force on a beam in a tube */
export function FigLorentz({ onDone }) {
  const [B, setB] = useState(0), [q, setQ] = useState(0);
  const S = useRef({ ph: 0 }).current;
  const sg = q ? 1 : -1, cy = 190, fx = 300, fr = 88, K = 0.0016;
  const half = (x) => (x < 190 ? 18 : x < 330 ? 18 + (x - 190) * (82 / 140) : 100);
  const pts = [[150, cy]];
  let x = 150, y = 0, vx = 1, vy = 0, hit = true, mid = null;
  const kap = sg * B * K;
  for (let i = 0; x < 532; i++) {
    if (Math.hypot(x - fx, y) < fr && kap) {
      const c = Math.cos(kap * 2), s = Math.sin(kap * 2);
      [vx, vy] = [vx * c - vy * s, vx * s + vy * c];
      if (!mid && x >= fx) mid = [x, y, vx, vy];
    }
    x += vx * 2; y += vy * 2;
    if (Math.abs(y) > half(x) - 2) { hit = false; pts.push([x, cy - y]); break; }
    if (i % 3 === 0) pts.push([x, cy - y]);
  }
  if (hit) pts.push([532, cy - y]);
  const ok = hit && Math.abs(y - 55) < 6;
  useFrame((dt) => { S.ph += 120 * dt; if (ok) onDone(); });
  const col = q ? '#e2572f' : '#3d6dff';
  const marks = [];
  for (let gx = fx - 78; gx <= fx + 78; gx += 26) for (let gy = -78; gy <= 78; gy += 26)
    if (Math.hypot(gx - fx, gy) < fr - 6) marks.push(<FieldMark key={gx + ':' + gy} x={gx} y={cy + gy} into={B > 0} o={Math.min(1, Math.abs(B) * 1.3)} />);
  const tube = `M70 ${cy - 18} L190 ${cy - 18} L330 ${cy - 100} L525 ${cy - 100} L525 ${cy + 100} L330 ${cy + 100} L190 ${cy + 18} L70 ${cy + 18} Z`;
  return (<>
    <Art>
      <Slab x={50} y={335} w={540} h={55} />
      <path d={`M100 ${cy + 18} L92 345 L132 345 L124 ${cy + 18} Z M420 ${cy + 100} L410 345 L470 345 L460 ${cy + 100} Z`} fill="#eeeae1" stroke={INK} />
      <circle cx={fx} cy={cy} r={fr + 14} fill="url(#hatch)" stroke={INK} strokeWidth="1.3" />
      <circle cx={fx} cy={cy} r={fr} fill="#fbfaf6" stroke={INK} strokeWidth="1.3" />
      <path d={tube} fill="rgba(214,228,236,.45)" stroke={INK} strokeWidth="1.6" />
      <path d={`M80 ${cy - 12} L190 ${cy - 12} L330 ${cy - 92} L515 ${cy - 92}`} fill="none" stroke="#fff" strokeWidth="2.5" opacity=".9" />
      {marks}
      <rect x="78" y={cy - 9} width="62" height="18" rx="3" fill="url(#cylH)" stroke={INK} />
      <rect x="140" y={cy - 13} width="6" height="26" fill="#ddd" stroke={INK} />
      <ellipse cx="530" cy={cy} rx="14" ry="100" fill="#eef3df" stroke={INK} strokeWidth="1.5" />
      <path d={`M522 ${cy - 61} l10 12 m0 -12 l-10 12`} stroke={RED} strokeWidth="1.6" />
      <path d={d(pts)} fill="none" stroke={col} strokeWidth="1.2" opacity=".35" />
      <Electrons pts={pts} phase={S.ph} gap={22} r={3} color={col} />
      {hit && <circle cx="530" cy={cy - y} r="7" fill={col} opacity=".8" filter="url(#glow)" />}
      {mid && <Arrow x1={mid[0]} y1={cy - mid[1]} x2={mid[0] - Math.sign(kap) * mid[3] * 46} y2={cy - mid[1] - Math.sign(kap) * mid[2] * 46} label="F" />}
      <Arrow x1={170} y1={cy - 30} x2={215} y2={cy - 30} c={INK} w={1.4} h={8} label="v" />
      <Lab n="1" x={100} y={cy - 9} tx={90} ty={130} />
      <Lab n="2" x={430} y={cy - 100} tx={450} ty={60} />
      <Lab n="3" x={fx - 72} y={cy + 72} tx={200} ty={300} />
      <Lab n="4" x={540} y={cy + 60} tx={590} ty={290} />
      <Lab n="5" x={250} y={cy} tx={240} ty={120} />
    </Art>
    <div className="ctl">
      <Slide label="Field (3)" min={-1} max={1} step={0.01} value={B} onChange={setB}
        show={(v) => (v === 0 ? 'off' : `${(Math.abs(v) * 2).toFixed(2)} mT ${v > 0 ? '⊗ in' : '⊙ out'}`)} />
      <Pick label="Charge" opts={['electron', 'positron']} value={q} onChange={setQ} />
    </div>
  </>);
}

/* 3 ─ Force on a current: rod rolling on rails */
export function FigRails({ onDone }) {
  const [on, setOn] = useState(false), [rev, setRev] = useState(false), [flip, setFlip] = useState(false), [I, setI] = useState(3);
  const S = useRef({ x: 380, v: 0, ph: 0 }).current;
  const dir = rev ? -1 : 1, mag = flip ? -1 : 1, Fs = on ? dir * mag * I : 0;
  useFrame((dt) => {
    S.v += (Fs * 55 - S.v * 1.4) * dt; S.x += S.v * dt;
    if (S.x < 200) { S.x = 200; S.v = 0; } if (S.x > 560) { S.x = 560; S.v = 0; }
    if (on) S.ph -= dir * I * 16 * dt;
    if (S.x <= 201) onDone();
  });
  const R = S.x, loop = [[70, 340], [R, 340], [R, 210], [70, 210], [70, 340]];
  const marks = [];
  for (let gx = 220; gx <= 560; gx += 42) for (let gy = 245; gy <= 310; gy += 32) marks.push(<FieldMark key={gx + ':' + gy} x={gx} y={gy} into={flip} o={0.7} />);
  return (<>
    <Art vb="0 130 640 310">
      <Slab x={30} y={150} w={580} h={240} />
      <g className="hot" onClick={() => setFlip(!flip)}>
        <rect x="200" y="222" width="375" height="106" fill="rgba(0,0,0,.02)" stroke={INK} strokeDasharray="6 5" />
        <text x="208" y="236" className="tiny">magnet below: {flip ? 'S' : 'N'} pole up</text>
      </g>
      {marks}
      {[210, 340].map((y) => (<g key={y}><rect x="150" y={y - 5} width="440" height="10" fill="url(#cylH)" stroke={INK} /></g>))}
      {[190, 572].map((x) => <rect key={x} x={x - 4} y="196" width="8" height="158" fill="url(#hatch2)" stroke={INK} />)}
      <Tube pts={[[150, 210], [70, 210], [70, 340], [150, 340]]} />
      <ellipse cx={R + 8} cy="352" rx="14" ry="5" fill="#000" opacity=".15" />
      <rect x={R - 8} y="200" width="16" height="150" fill="url(#cylV)" stroke={INK} strokeWidth="1.3" />
      <ellipse cx={R} cy="200" rx="8" ry="3.5" fill="#f6f4ef" stroke={INK} />
      <Electrons pts={loop} phase={S.ph} gap={18} />
      <Cell x={70} y={275} l={84} r={14} vertical flip={rev} onClick={() => setRev(!rev)} />
      <Switch x={82} y={212} on={on} onClick={() => setOn(!on)} />
      {Fs !== 0 && <Arrow x1={R} y1={275} x2={R + Math.sign(Fs) * (20 + I * 9)} y2={275} label="F" />}
      <Lab n="1" x={58} y={300} tx={40} ty={330} />
      <Lab n="2" x={120} y={204} tx={130} ty={170} />
      <Lab n="3" x={540} y={205} tx={560} ty={175} />
      <Lab n="4" x={R + 8} y={232} tx={R + 30} ty={185} />
      <Lab n="5" x={300} y={328} tx={290} ty={410} />
    </Art>
    <div className="ctl">
      <Slide label="Current" min={0} max={5} step={0.1} value={I} onChange={setI} show={(v) => v.toFixed(1) + ' A'} />
      <Readout>F = BIl = 0.2 × {I.toFixed(1)} × 0.1 = <b>{(0.02 * I).toFixed(3)} N</b> {on ? (Fs > 0 ? '→' : '←') : '(switch open)'}</Readout>
    </div>
  </>);
}

/* 4 ─ Circles and helices */
export function FigHelix({ onDone }) {
  const [vp, setVp] = useState(2), [vl, setVl] = useState(0.5), [B, setB] = useState(0.1);
  const S = useRef({ ph: 0 }).current;
  const r = 1.04 * vp * (0.1 / B), R = Math.min(10, r) * 15;
  const Tns = 656 * (0.1 / B), pcm = 6.56 * vl * (0.1 / B), P = pcm * 15;
  const cy = 215, ok = Math.abs(r - 3) < 0.06;
  useFrame((dt) => { S.ph += Math.PI * (B / 0.1) * dt; if (ok) onDone(); });
  const xp = P > 0 ? 80 + ((S.ph / TAU) * P + 250) % 500 : 330;
  const pt = (f) => { const xa = xp - ((S.ph - f) / TAU) * P; return [xa + R * Math.sin(f) * 0.32, cy - R * Math.cos(f), Math.sin(f) > 0, xa]; };
  const segs = { past: [[], []], next: [] };
  const span = P > 0 ? 3 : 1;
  let prev = null;
  for (let f = S.ph - TAU * span; f <= S.ph + (P > 0 ? TAU : 0); f += 0.08) {
    const p = pt(f);
    if (p[3] < 70) { prev = null; continue; }
    if (prev) (f > S.ph ? segs.next : segs.past[p[2] ? 0 : 1]).push(`M${prev[0].toFixed(1)} ${prev[1].toFixed(1)} L${p[0].toFixed(1)} ${p[1].toFixed(1)}`);
    prev = p;
  }
  const cur = pt(S.ph);
  return (<>
    <Art>
      <rect x="18" y="40" width="34" height="350" fill="url(#hatch)" stroke={INK} /><text x="35" y="30" className="pole">N</text>
      <rect x="588" y="40" width="34" height="350" fill="url(#hatch)" stroke={INK} /><text x="605" y="30" className="pole">S</text>
      {[60, 140, 290, 370].map((y) => <Arrow key={y} x1={60} y1={y} x2={580} y2={y} c="#c9a39b" w={1} h={8} />)}
      <text x="560" y="52" className="vec" fill={RED}>B</text>
      <g fill="none" stroke={INK} strokeDasharray="5 5" opacity=".7">
        <path d={`M80 ${cy - 45} L580 ${cy - 45} M80 ${cy + 45} L580 ${cy + 45}`} />
        <ellipse cx="80" cy={cy} rx="14" ry="45" /><ellipse cx="580" cy={cy} rx="14" ry="45" />
      </g>
      <path d={segs.past[1].join('')} stroke="#9aa6c9" strokeWidth="1.6" fill="none" />
      <path d={segs.next.join('')} stroke={INK} strokeWidth="1" strokeDasharray="3 4" fill="none" opacity=".5" />
      <path d={segs.past[0].join('')} stroke="#2d55d8" strokeWidth="2.4" fill="none" />
      <circle cx={cur[0]} cy={cur[1]} r="7" fill="#e2572f" filter="url(#glow)" />
      <text x={cur[0]} y={cur[1] + 3.5} textAnchor="middle" className="tiny" fill="#fff">+</text>
      {P > 0 && P < 480 && (<g>
        <path d={`M${xp - P} ${cy + R + 22} L${xp} ${cy + R + 22} M${xp - P} ${cy + R + 16} l0 12 M${xp} ${cy + R + 16} l0 12`} stroke={INK} strokeWidth="1" />
        <text x={xp - P / 2} y={cy + R + 40} textAnchor="middle" className="hand">p</text>
      </g>)}
      <Lab n="1" x={520} y={60} tx={540} ty={86} />
      <Lab n="2" x={cur[0] + 6} y={cur[1] - 6} tx={cur[0] + 26} ty={cur[1] - 30} />
      <Lab n="4" x={150} y={cy - 45} tx={130} ty={cy - 80} />
      {P > 0 && P < 480 && <Lab n="5" x={xp - P / 2 + 10} y={cy + R + 22} tx={xp - P / 2 + 30} ty={cy + R + 30} />}
    </Art>
    <div className="ctl">
      <Slide label="Speed across B" min={0.5} max={5} step={0.1} value={vp} onChange={setVp} show={(v) => v.toFixed(1) + ' × 10⁵ m/s'} />
      <Slide label="Speed along B" min={0} max={3} step={0.25} value={vl} onChange={setVl} show={(v) => v.toFixed(2) + ' × 10⁵ m/s'} />
      <Slide label="Field B" min={0.05} max={0.3} step={0.01} value={B} onChange={setB} show={(v) => v.toFixed(2) + ' T'} />
      <Readout>r = <b>{r.toFixed(2)} cm</b> · T = <b>{Tns.toFixed(0)} ns</b> (same for any speed) · p = {pcm.toFixed(1)} cm</Readout>
    </div>
  </>);
}

/* 5 ─ Field on the axis of a ring */
export function FigRing({ onDone }) {
  const [u, setU] = useState(1);
  const S = useRef({ ph: 0 }).current;
  const ratio = Math.pow(1 + u * u, -1.5), ok = Math.abs(ratio - 0.125) < 0.004;
  useFrame((dt) => { S.ph -= 60 * dt; if (ok) onDone(); });
  const cx = 170, cy = 200, rx = 40, ry = 115, px = cx + u * 130;
  const ell = Array.from({ length: 73 }, (_, i) => { const f = (i / 72) * TAU; return [cx + rx * Math.cos(f), cy + ry * Math.sin(f)]; });
  const half = (a0) => Array.from({ length: 37 }, (_, i) => { const f = a0 + (i / 36) * Math.PI; return [cx + rx * Math.cos(f), cy + ry * Math.sin(f)]; });
  const gx = (v) => 390 + (v / 3) * 215, gy = (v) => 340 - v * 80;
  const curve = Array.from({ length: 61 }, (_, i) => { const v = (i / 60) * 3; return [gx(v), gy(Math.pow(1 + v * v, -1.5))]; });
  return (<>
    <Art>
      <Slab x={40} y={355} w={260} h={40} />
      {[[50, 32], [85, 55], [125, 80]].map(([a, b], i) => (<g key={i} fill="none" stroke={RED} strokeWidth="1" opacity=".55">
        <ellipse cx={cx} cy={cy - ry} rx={a} ry={b} /><ellipse cx={cx} cy={cy + ry} rx={a} ry={b} />
        <path d={`M${cx + 4} ${cy - ry + b - 4} l8 4 l-8 4 M${cx + 4} ${cy + ry - b - 4} l8 4 l-8 4`} />
      </g>))}
      <Tube pts={half(Math.PI / 2)} w={8} />
      <path d={`M30 ${cy} L620 ${cy}`} stroke={INK} strokeDasharray="8 4 2 4" strokeWidth="1" />
      <rect x={cx - 4} y={cy + ry} width="8" height="45" fill="url(#cylV)" stroke={INK} />
      <ellipse cx={cx} cy={cy + ry + 45} rx="26" ry="8" fill="#eeeae1" stroke={INK} />
      <Tube pts={half(-Math.PI / 2)} w={8} />
      <Electrons pts={ell} phase={S.ph} gap={20} faint={(x) => x < cx} />
      <Arrow x1={px} y1={cy} x2={px + 6 + 100 * ratio} y2={cy} label="B" ly={-8} />
      <g>
        <rect x={px - 3} y="92" width="6" height="100" fill="url(#cylV)" stroke={INK} />
        <circle cx={px} cy={cy} r="5" fill="#fff" stroke={INK} strokeWidth="1.4" />
        <rect x={px - 34} y="62" width="68" height="30" rx="4" fill="#fbfaf6" stroke={INK} />
        <text x={px} y="82" textAnchor="middle" className="lcd">{ratio.toFixed(3)} B₀</text>
      </g>
      <rect x="380" y="245" width="240" height="105" fill="#fdfcf8" stroke={INK} strokeWidth=".8" />
      <path d={`M390 260 L390 340 L608 340`} fill="none" stroke={INK} strokeWidth=".8" />
      <path d={`M390 ${gy(0.125)} L608 ${gy(0.125)}`} stroke={RED} strokeDasharray="3 3" strokeWidth=".8" />
      <text x="606" y={gy(0.125) - 4} textAnchor="end" className="tiny" fill={RED}>B₀/8</text>
      <path d={d(curve)} fill="none" stroke="#2d55d8" strokeWidth="1.8" />
      <circle cx={gx(u)} cy={gy(ratio)} r="4" fill={RED} />
      <text x="396" y="258" className="tiny">B/B₀</text><text x="606" y="352" textAnchor="end" className="tiny">x/R → 3</text>
      <Lab n="1" x={cx + 30} y={cy - 80} tx={250} ty={60} />
      <Lab n="2" x={cx - 4} y={cy + ry + 25} tx={120} ty={335} />
      <Lab n="3" x={600} y={cy} tx={612} ty={cy - 30} />
      <Lab n="4" x={px + 34} y={70} tx={px + 52} ty={45} />
      <Lab n="5" x={cx - 125} y={cy - ry} tx={40} ty={45} />
    </Art>
    <div className="ctl">
      <Slide label="Probe (4) at x" min={0} max={3} step={0.01} value={u} onChange={setU} show={(v) => v.toFixed(2) + ' R'} />
      <Readout>B / B₀ = R³ / (x² + R²)<sup>3/2</sup> = <b>{ratio.toFixed(3)}</b></Readout>
    </div>
  </>);
}

/* 6 ─ Ampère: iron filings round a straight wire */
const rng = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(11);
const FIL = Array.from({ length: 520 }, () => { const r = 0.09 + 0.91 * Math.sqrt(rng()), t = rng() * TAU; return [r * Math.cos(t), r * Math.sin(t), rng() * Math.PI]; });
export function FigAmpere({ onDone }) {
  const [I, setI] = useState(0), [rc, setRc] = useState(4);
  const S = useRef({ ph: 0, s: 0 }).current;
  const cx = 300, cy = 300, RX = 250, RY = 78, Bv = (2e-7 * I) / (rc / 100), ok = I > 0 && Math.abs(Bv * 1e5 - 2) < 0.02;
  useFrame((dt) => { S.ph -= I * 9 * dt; S.s += (I - S.s) * Math.min(1, dt * 2.5); if (ok) onDone(); });
  let fd = '';
  for (const [X, Y, t0] of FIL) {
    const r = Math.hypot(X, Y), tau = Math.atan2(X, -Y), s = Math.min(1, S.s / (r * 12));
    let df = tau - t0; df -= Math.PI * Math.round(df / Math.PI);
    const a = t0 + s * df, x = cx + X * RX, y = cy + Y * RY, hx = Math.cos(a) * 0.022 * RX, hy = Math.sin(a) * 0.022 * RY;
    fd += `M${(x - hx).toFixed(1)} ${(y - hy).toFixed(1)}L${(x + hx).toFixed(1)} ${(y + hy).toFixed(1)}`;
  }
  const loop = [[cx, cy], [cx, 40], [590, 40], [590, 390], [60, 390], [60, cy], [cx, cy]];
  const rho = rc / 11;
  return (<>
    <Art>
      <Slab x={30} y={205} w={590} h={200} />
      <ellipse cx={cx} cy={cy} rx={RX + 10} ry={RY + 6} fill="#f5f2ea" stroke={INK} strokeWidth=".8" />
      <path d={fd} stroke="#4a4540" strokeWidth="1.3" strokeLinecap="round" />
      <Hidden pts={[[60, cy], [cx, cy]]} />
      <ellipse cx={cx} cy={cy} rx={rho * RX} ry={rho * RY} fill="none" stroke={RED} strokeWidth="1.6" strokeDasharray="7 5" />
      <Arrow x1={cx - 8} y1={cy + rho * RY} x2={cx + 12} y2={cy + rho * RY} label="" h={9} />
      <Tube pts={loop.slice(1, 6)} />
      <Tube pts={loop.slice(0, 2)} />
      <ellipse cx={cx} cy={cy} rx="8" ry="3.5" fill="#cfc9bb" stroke={INK} />
      <Electrons pts={loop} phase={S.ph} faint={(x, y, s) => s === 5} />
      <Cell x={430} y={390} flip />
      {I > 0 && <Arrow x1={cx + 14} y1={170} x2={cx + 14} y2={120} c={INK} w={1.5} label="I" />}
      <text x={cx + rho * RX + 6} y={cy - 4} className="hand" fill={RED}>r</text>
      <Lab n="1" x={cx} y={110} tx={350} ty={90} />
      <Lab n="2" x={500} y={258} tx={530} ty={225} />
      <Lab n="3" x={cx - rho * RX} y={cy} tx={cx - rho * RX - 22} ty={cy - 36} />
      <Lab n="4" x={460} y={405} tx={480} ty={428} />
      <Lab n="5" x={cx} y={250} tx={255} ty={225} />
    </Art>
    <div className="ctl">
      <Slide label="Current I" min={0} max={10} step={0.1} value={I} onChange={setI} show={(v) => v.toFixed(1) + ' A'} />
      <Slide label="Loop radius r" min={1} max={10} step={0.5} value={rc} onChange={setRc} show={(v) => v.toFixed(1) + ' cm'} />
      <Readout>B on the loop = μ₀I / 2πr = <b>{I ? sci(Bv) : '0'} T</b></Readout>
    </div>
  </>);
}

/* 7 ─ Solenoid */
export function FigSolenoid({ onDone }) {
  const [N, setN] = useState(16), [I, setI] = useState(2);
  const S = useRef({ ph: 0, a: NORTH, w: 0 }).current;
  const Bm = 4 * Math.PI * 1e-7 * (N / 0.1) * I * 1000, f = Bm / 2.52, ok = Math.abs(Bm - 1) < 0.02;
  useFrame((dt) => {
    S.ph -= I * 26 * dt;
    const df = wrap((I > 0 ? 0 : NORTH) - S.a); S.w += (df * 40 - S.w * 5) * dt; S.a += S.w * dt;
    if (ok) onDone();
  });
  const x0 = 170, L = 300, cy = 180, R = 72, M = N * 28;
  const hp = Array.from({ length: M + 1 }, (_, j) => { const u = j / M, p = TAU * N * u; return [x0 + L * u + 0.3 * R * Math.sin(p), cy - R * Math.cos(p), Math.sin(p) > 0]; });
  let fr = '', bk = '';
  for (let j = 1; j <= M; j++) { const s = `M${hp[j - 1][0].toFixed(1)} ${hp[j - 1][1].toFixed(1)}L${hp[j][0].toFixed(1)} ${hp[j][1].toFixed(1)}`; if (hp[j][2]) fr += s; else bk += s; }
  const loop = [[150, 370], [150, cy - R], ...hp.map((p) => [p[0], p[1]]), [490, cy - R], [490, 370], [150, 370]];
  return (<>
    <Art>
      <Slab x={60} y={320} w={520} h={80} />
      {[x0 + 10, x0 + L - 30].map((x) => <path key={x} d={`M${x} ${cy + R - 4} L${x - 4} 335 L${x + 24} 335 L${x + 20} ${cy + R - 4}Z`} fill="#eeeae1" stroke={INK} />)}
      <g fill="none" stroke={RED} strokeWidth="1.2" opacity={0.15 + f * 0.6}>
        <path d={`M${x0 + L} ${cy - 30} C 640 ${cy - 30}, 630 ${cy - 165}, 320 ${cy - 165} C 10 ${cy - 165}, 0 ${cy - 30}, ${x0} ${cy - 30}`} />
        <path d={`M${x0 + L} ${cy + 30} C 640 ${cy + 30}, 640 ${cy + 175}, 320 ${cy + 175} C 0 ${cy + 175}, 0 ${cy + 30}, ${x0} ${cy + 30}`} opacity=".6" />
      </g>
      <path d={`M${x0} ${cy - R} L${x0 + L} ${cy - R} M${x0} ${cy + R} L${x0 + L} ${cy + R}`} stroke={INK} strokeWidth=".8" opacity=".5" />
      <ellipse cx={x0} cy={cy} rx={R * 0.3} ry={R} fill="rgba(230,226,215,.5)" stroke={INK} strokeWidth=".8" />
      <path d={bk} stroke="#b9b2a4" strokeWidth="2.2" fill="none" />
      <g opacity={I > 0 ? 0.3 + 0.7 * f : 0}>{[-3, -2, -1, 0, 1, 2, 3].map((k) => <Arrow key={k} x1={x0 + 14} y1={cy + k * 17} x2={x0 + L - 14} y2={cy + k * 17} c={RED} w={1} h={7} />)}</g>
      <Compass x={320} y={cy + 4} a={S.a} r={18} />
      <path d={fr} stroke={INK} strokeWidth="4.2" fill="none" strokeLinecap="round" />
      <path d={fr} stroke="#d9a066" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Tube pts={[[x0, cy - R], [150, cy - R], [150, 370], [490, 370], [490, cy - R], [x0 + L, cy - R]]} w={5} />
      <Electrons pts={loop} phase={S.ph} gap={30} r={2.8} faint={(x, y, sg) => sg >= 2 && sg <= M + 1 && !hp[sg - 1][2]} />
      <ellipse cx={x0 + L} cy={cy} rx={R * 0.3} ry={R} fill="none" stroke={INK} strokeWidth=".8" />
      <Cell x={320} y={370} />
      <Compass x={320} y={290} a={NORTH} r={18} />
      <Lab n="1" x={300} y={cy - R} tx={320} ty={40} />
      <Lab n="2" x={330} y={385} tx={350} ty={425} />
      <Lab n="3" x={308} y={cy} tx={250} ty={cy - 10} />
      <Lab n="4" x={338} y={290} tx={380} ty={300} />
      <Lab n="5" x={560} y={cy - 80} tx={600} ty={60} />
    </Art>
    <div className="ctl">
      <Slide label="Turns N (length 10 cm)" min={10} max={40} step={2} value={N} onChange={setN} show={(v) => `${v} → n = ${v * 10}/m`} />
      <Slide label="Current I" min={0} max={5} step={0.1} value={I} onChange={setI} show={(v) => v.toFixed(1) + ' A'} />
      <Readout>B = μ₀nI = <b>{Bm.toFixed(3)} mT</b> inside · ≈ 0 outside</Readout>
    </div>
  </>);
}

/* 8 ─ Two parallel currents */
export function FigParallel({ onDone }) {
  const [opp, setOpp] = useState(0), [I, setI] = useState(10), [dc, setDc] = useState(3);
  const S = useRef({ dl: 0, ph: 0 }).current;
  const dpx = dc * 30, xa = 320 - dpx / 2, xb = 320 + dpx / 2;
  const Fl = (2e-7 * I * I) / (dc / 100), tgt = (opp ? -1 : 1) * Math.min(dpx * 0.4 - 6, Fl * 30000);
  useFrame((dt) => { S.dl += (tgt - S.dl) * Math.min(1, dt * 4); S.ph += I * 6 * dt; if (opp && I > 0 && S.dl < -3) onDone(); });
  const bez = (x, s) => Array.from({ length: 31 }, (_, i) => { const t = i / 30; return [x + 2 * s * S.dl * t * (1 - t) * 2, 76 + 248 * t]; });
  const A = bez(xa, 1), Bp = bez(xb, -1);
  const strip = (p) => (<g fill="none" strokeLinecap="round"><path d={d(p)} stroke={INK} strokeWidth="10" /><path d={d(p)} stroke="#ebe6d8" strokeWidth="7.4" /><path d={d(p)} stroke="#fff" strokeWidth="1.5" opacity=".8" /></g>);
  const fa = Math.sign(S.dl) * Math.min(40, Math.abs(S.dl) * 1.6 + 8);
  return (<>
    <Art>
      <Slab x={60} y={370} w={520} h={36} />
      {[140, 500].map((x) => <rect key={x} x={x - 7} y="56" width="14" height="318" fill="url(#cylV)" stroke={INK} />)}
      <rect x="140" y="60" width="360" height="16" fill="#eeeae1" stroke={INK} /><rect x="140" y="60" width="360" height="16" fill="url(#hatch)" />
      <rect x="140" y="324" width="360" height="16" fill="#eeeae1" stroke={INK} /><rect x="140" y="324" width="360" height="16" fill="url(#hatch)" />
      {strip(A)}{strip(Bp)}
      <Electrons pts={A} phase={-S.ph} gap={18} r={2.8} />
      <Electrons pts={Bp} phase={opp ? S.ph : -S.ph} gap={18} r={2.8} />
      <Arrow x1={xa - 26} y1={110} x2={xa - 26} y2={160} c={INK} w={1.3} h={8} label="I" lx={-12} />
      <Arrow x1={xb + 26} y1={opp ? 160 : 110} x2={xb + 26} y2={opp ? 110 : 160} c={INK} w={1.3} h={8} label="I" />
      {I > 0 && <><Arrow x1={xa + S.dl} y1={200} x2={xa + S.dl + fa} y2={200} label="F" ly={-8} /><Arrow x1={xb - S.dl} y1={240} x2={xb - S.dl - fa} y2={240} label="F" ly={18} /></>}
      <Tube pts={[[xa, 340], [xa, 392], [280, 392]]} w={5} /><Tube pts={[[xb, 340], [xb, 392], [360, 392]]} w={5} />
      <Tube pts={[[360, 384], [440, 384]]} w={5} />
      <g className="hot" onClick={() => setOpp(opp ? 0 : 1)}>
        <rect x="278" y="376" width="84" height="26" rx="3" fill="#f4f1ea" stroke={INK} /><rect x="278" y="376" width="84" height="26" fill="url(#hatch)" opacity=".5" />
        <path d={`M320 398 L${opp ? 300 : 340} 368`} stroke={INK} strokeWidth="4" strokeLinecap="round" /><circle cx={opp ? 300 : 340} cy="368" r="4" fill="#fbfaf6" stroke={INK} />
      </g>
      <rect x="440" y="372" width="100" height="30" rx="3" fill="url(#cylH)" stroke={INK} /><text x="490" y="392" textAnchor="middle" className="tiny">{I.toFixed(1)} A</text>
      <Lab n="1" x={xa} y={140} tx={xa - 60} ty={120} />
      <Lab n="2" x={xb} y={290} tx={xb + 50} ty={280} />
      <Lab n="3" x={200} y={68} tx={190} ty={36} />
      <Lab n="4" x={300} y={402} tx={280} ty={428} />
      <Lab n="5" x={530} y={380} tx={560} ty={352} />
    </Art>
    <div className="ctl">
      <Pick label="Current in b" opts={['same way', 'opposite way']} value={opp} onChange={setOpp} />
      <Slide label="Current, each" min={0} max={20} step={0.5} value={I} onChange={setI} show={(v) => v.toFixed(1) + ' A'} />
      <Slide label="Gap d" min={2} max={6} step={0.1} value={dc} onChange={setDc} show={(v) => v.toFixed(1) + ' cm'} />
      <Readout>F/l = μ₀I<sub>a</sub>I<sub>b</sub>/2πd = <b>{I ? sci(Fl) : '0'} N/m</b>, {opp ? 'repel' : 'attract'}</Readout>
    </div>
  </>);
}

/* 9 ─ Torque on a coil */
export function FigTorque({ onDone }) {
  const [on, setOn] = useState(false), [I, setI] = useState(2);
  const S = useRef({ th: Math.PI / 2, w: 0, ph: 0 }).current;
  useFrame((dt) => {
    if (on) { S.w += (-5 * I * Math.sin(S.th) - 0.9 * S.w) * dt; S.ph -= I * 25 * dt; } else S.w *= 1 - Math.min(1, dt * 2);
    S.th += S.w * dt;
    if (on && Math.abs(S.w) < 0.02 && Math.abs(Math.sin(S.th)) < 0.03) onDone();
  });
  const P = (X, Y, Z) => [320 + X + 0.32 * Z, 205 - Y - 0.22 * Z];
  const a = 95, b = 85, hx = -Math.sin(S.th), hz = Math.cos(S.th);
  const c = (s, t) => P(s * a * hx, t * b, s * a * hz);
  const coil = [c(-1, 1), c(1, 1), c(1, -1), c(-1, -1), c(-1, 1)];
  const m = P(80 * Math.cos(S.th), 0, 80 * Math.sin(S.th)), ctr = P(0, 0, 0);
  const deg = Math.round(((Math.abs(wrap(S.th)) * 180) / Math.PI));
  const Fz = (s) => { const p0 = P(s * a * hx, 0, s * a * hz), p1 = P(s * a * hx, 0, s * a * hz + s * 110 * I / 3); return <Arrow key={s} x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} label="F" />; };
  const box = (x0, w, lab) => (<g>
    <path d={`M${x0} 110 l13 -9 l${w} 0 l-13 9 Z`} fill="#f4f1ea" stroke={INK} />
    <path d={`M${x0 + w} 110 l13 -9 l0 200 l-13 9 Z`} fill="url(#hatch2)" stroke={INK} />
    <rect x={x0} y="110" width={w} height="200" fill="#efebe2" stroke={INK} /><rect x={x0} y="110" width={w} height="200" fill="url(#hatch)" opacity=".6" />
    <text x={x0 + w / 2} y="225" textAnchor="middle" className="pole big">{lab}</text>
  </g>);
  return (<>
    <Art>
      <Slab x={30} y={330} w={580} h={70} />
      {box(40, 110, 'N')}{box(490, 110, 'S')}
      {[140, 180, 230, 280].map((y) => <Arrow key={y} x1={158} y1={y} x2={486} y2={y} c="#d3aaa2" w={1} h={7} />)}
      <text x="470" y="132" className="vec" fill={RED}>B</text>
      <Tube pts={[P(0, b + 30, 0), P(0, -b - 60, 0)]} w={6} />
      <path d={d(coil)} fill="rgba(238,233,220,.55)" stroke="none" />
      <Tube pts={coil} w={8} />
      <Electrons pts={coil} phase={S.ph} gap={18} r={3} />
      <Arrow x1={ctr[0]} y1={ctr[1]} x2={m[0]} y2={m[1]} c="#2d55d8" w={2.4} label="m" />
      {on && I > 0 && [1, -1].map(Fz)}
      <Cell x={190} y={372} l={90} r={13} />
      <Switch x={400} y={374} on={on} onClick={() => setOn(!on)} />
      <Tube pts={[[235, 372], [320, 372], [320, 345]]} w={4} /><Tube pts={[[145, 372], [120, 372], [120, 395], [480, 395], [480, 374], [466, 374]]} w={4} />
      <Lab n="1" x={95} y={110} tx={75} ty={70} />
      <Lab n="2" x={545} y={110} tx={565} ty={70} />
      <Lab n="3" x={c(1, 1)[0]} y={c(1, 1)[1]} tx={c(1, 1)[0] + 20} ty={c(1, 1)[1] - 30} />
      <Lab n="4" x={320} y={325} tx={350} ty={318} />
      <Lab n="5" x={190} y={385} tx={170} ty={428} />
    </Art>
    <div className="ctl">
      <Slide label="Current I" min={0.5} max={3} step={0.1} value={I} onChange={setI} show={(v) => v.toFixed(1) + ' A'} />
      <button className="btn" onClick={() => { S.th = Math.PI / 2; S.w = 0; }}>Twist back to 90°</button>
      <Readout>θ (m to B) = <b>{deg}°</b> · τ = NIAB sin θ = <b>{(0.005 * I * Math.abs(Math.sin(S.th))).toFixed(4)} N m</b></Readout>
    </div>
  </>);
}

/* 10 ─ Moving-coil galvanometer */
export function FigGalvo({ onDone }) {
  const [I, setI] = useState(0), [N, setN] = useState(50);
  const S = useRef({ p: 0, w: 0 }).current;
  const sens = N / 50, tgt = Math.max(-30, Math.min(30, sens * I));
  useFrame((dt) => {
    S.w += (40 * (tgt - S.p) - 7 * S.w) * dt; S.p += S.w * dt;
    if (I === 10 && Math.abs(S.p - 20) < 0.3 && Math.abs(S.w) < 0.5) onDone();
  });
  const cx = 320, cy = 300, ang = (v) => (v * 50 / 30) * Math.PI / 180, al = ang(S.p);
  const at = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const ticks = [];
  for (let v = -30; v <= 30; v++) { const a = ang(v), L = v % 10 ? (v % 5 ? 7 : 11) : 16, [x1, y1] = at(220, a), [x2, y2] = at(220 - L, a); ticks.push(<line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={v % 10 ? 0.8 : 1.4} />); if (!(v % 10)) { const [tx, ty] = at(236, a); ticks.push(<text key={'t' + v} x={tx} y={ty + 4} textAnchor="middle" className="tiny">{v}</text>); } }
  const [tipx, tipy] = at(214, al), [tlx, tly] = at(-30, al);
  const ca = Math.cos(al), sa = Math.sin(al), rot = (x, y) => [cx + x * ca - y * sa, cy + x * sa + y * ca];
  const coilA = rot(-49, 0), coilB = rot(49, 0), fr = [rot(-49, -14), rot(49, -14), rot(49, 14), rot(-49, 14), rot(-49, -14)];
  const spiral = Array.from({ length: 90 }, (_, i) => { const t = i / 89, r = 4 + 18 * t, f = t * TAU * 3 + al * 3; return [cx + r * Math.cos(f), cy - 10 + r * 0.6 * Math.sin(f)]; });
  return (<>
    <Art>
      <rect x="90" y="22" width="460" height="390" rx="18" fill="url(#hatch)" stroke={INK} strokeWidth="1.4" />
      <rect x="108" y="40" width="424" height="354" rx="10" fill="#fbfaf6" stroke={INK} />
      <path d={`M${at(220, ang(-30)).join(' ')} A220 220 0 0 1 ${at(220, ang(30)).join(' ')}`} fill="none" stroke={INK} strokeWidth="1.2" />
      {ticks}
      <text x={cx} y="150" textAnchor="middle" className="tiny">divisions</text>
      {Array.from({ length: 9 }, (_, i) => { const a = ((i - 4) * 11 * Math.PI) / 180; return [1, -1].map((sd) => <line key={i + ':' + sd} x1={cx + sd * 38 * Math.cos(a)} y1={cy + 38 * Math.sin(a)} x2={cx + sd * 60 * Math.cos(a)} y2={cy + 60 * Math.sin(a)} stroke={RED} strokeWidth=".8" opacity=".6" />); })}
      <path d="M150 252 L278 252 A62 62 0 0 0 278 348 L150 348 Z" fill="#efebe2" stroke={INK} /><path d="M150 252 L278 252 A62 62 0 0 0 278 348 L150 348 Z" fill="url(#hatch)" />
      <path d="M490 252 L362 252 A62 62 0 0 1 362 348 L490 348 Z" fill="#efebe2" stroke={INK} /><path d="M490 252 L362 252 A62 62 0 0 1 362 348 L490 348 Z" fill="url(#hatch)" />
      <text x="190" y="308" className="pole big">N</text><text x="430" y="308" className="pole big">S</text>
      <circle cx={cx} cy={cy} r="34" fill="#e6e1d5" stroke={INK} /><circle cx={cx} cy={cy} r="34" fill="url(#hatch2)" />
      <path d={d(fr)} fill="none" stroke="#b07a3c" strokeWidth="3" />
      <circle cx={coilA[0]} cy={coilA[1]} r="8" fill="#fbfaf6" stroke={INK} strokeWidth="1.4" /><circle cx={coilB[0]} cy={coilB[1]} r="8" fill="#fbfaf6" stroke={INK} strokeWidth="1.4" />
      {I !== 0 && <><circle cx={coilA[0]} cy={coilA[1]} r="2" fill={INK} /><path d={`M${coilB[0] - 4} ${coilB[1] - 4} l8 8 m0 -8 l-8 8`} stroke={INK} strokeWidth="1.3" /></>}
      <path d={d(spiral)} fill="none" stroke="#8a5a2b" strokeWidth="1.3" />
      <line x1={tlx} y1={tly} x2={tipx} y2={tipy} stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d={`M${tipx} ${tipy} L${at(196, al - 0.012).join(' ')} L${at(196, al + 0.012).join(' ')}Z`} fill={RED} />
      <circle cx={cx} cy={cy} r="5" fill="#fbfaf6" stroke={INK} strokeWidth="1.5" />
      <Lab n="1" x={at(160, al)[0]} y={at(160, al)[1]} tx={at(160, al)[0] + 40} ty={at(160, al)[1] - 10} />
      <Lab n="2" x={coilB[0] + 6} y={coilB[1] + 6} tx={400} ty={380} />
      <Lab n="3" x={cx + 10} y={cy + 28} tx={330} ty={385} />
      <Lab n="4" x={170} y={340} tx={140} ty={385} />
      <Lab n="5" x={cx - 18} y={cy - 18} tx={250} ty={205} />
    </Art>
    <div className="ctl">
      <Slide label="Current I" min={-50} max={50} step={1} value={I} onChange={setI} show={(v) => v + ' μA'} />
      <Slide label="Turns N" min={25} max={150} step={5} value={N} onChange={setN} show={(v) => v + ' turns'} />
      <Readout>φ = (NAB/k) I = {sens.toFixed(1)} × {I} = <b>{(sens * I).toFixed(1)} div</b>{Math.abs(sens * I) > 30 ? ' — off scale!' : ''}</Readout>
    </div>
  </>);
}
