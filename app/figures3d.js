'use client';
import { useState } from 'react';
import {
  THREE, V, INK, RED, BLUE, MU0, Scene3D, board, tube, box, cyl, mesh, toon, ink, Beads, Arrow, label, callout, lineOf,
  bs, segsOf, traceLine, fieldLines, compass, cell, knife, resistor, ringPts,
} from './engine';
import { Slide, Pick, Readout } from './kit';

const D2R = Math.PI / 180;
export const sci = (v, p = 2) => {
  if (!v) return '0';
  const e = Math.floor(Math.log10(Math.abs(v)));
  return <>{(v / 10 ** e).toFixed(p)} × 10<sup>{e}</sup></>;
};
const setLine = (l, pts) => { l.geometry.setFromPoints(pts); if (l.material.isLineDashedMaterial) l.computeLineDistances(); };
const opac = (g, o) => g.traverse((m) => { if (m.material) { m.material.transparent = true; m.material.opacity = o; } });
const pole = (txt, pos, scene) => { const l = label(txt, 'pole3'); l.position.copy(pos); scene.add(l); };

function Graph({ f, x1, y1 = 1, at, hl, xl, yl, w = 250, h = 86 }) {
  const X = (x) => 26 + (x / x1) * (w - 34), Y = (y) => h - 16 - (y / y1) * (h - 26);
  const pts = Array.from({ length: 81 }, (_, i) => { const x = (i / 80) * x1; return `${X(x).toFixed(1)},${Y(Math.min(y1, f(x))).toFixed(1)}`; }).join(' ');
  return (
    <svg className="graph" viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path d={`M26 6 L26 ${h - 16} L${w - 6} ${h - 16}`} fill="none" stroke="#2a2723" strokeWidth=".8" />
      {hl != null && <path d={`M26 ${Y(hl)} L${w - 6} ${Y(hl)}`} stroke="#c0392b" strokeDasharray="3 3" strokeWidth=".8" />}
      <polyline points={pts} fill="none" stroke="#2d55d8" strokeWidth="1.8" />
      <circle cx={X(Math.min(x1, at))} cy={Y(Math.min(y1, f(at)))} r="4" fill="#c0392b" />
      <text x="4" y="12" className="gt">{yl}</text><text x={w - 6} y={h - 3} textAnchor="end" className="gt">{xl}</text>
    </svg>
  );
}

/* ─────────── 1 · Oersted (4.1) ─────────── */
function bOersted(c) {
  const { scene } = c, Y = 0.32, BE = 3.0e-5;
  scene.add(board(13, 9.5));
  const loop = [V(0, -0.3, 0), V(0, 4.4, 0), V(5.4, 4.4, 0), V(5.4, Y, 0), V(5.4, Y, 3.6), V(-5.4, Y, 3.6), V(-5.4, Y, 0), V(-5.4, -0.3, 0), V(0, -0.3, 0)];
  scene.add(tube(loop.slice(0, 7), 0.08));
  const beads = new Beads(scene).path(loop, 0.34);
  const cl = cell(); cl.position.set(1.8, 0, 3.6); scene.add(cl);
  const sw = knife(); sw.position.set(-2.6, 0, 3.6); scene.add(sw);
  c.pick(sw, () => c.set({ on: !c.p.on })); c.pick(cl, () => c.set({ rev: !c.p.rev }));
  const cs = Array.from({ length: 8 }, () => { const g = compass(0.32); scene.add(g); return g; });
  new Arrow(scene, 0x6f685c, 0.035, 'N').set(V(-5.6, 0.05, -2.2), V(0, 0, -1.8));
  const ia = new Arrow(scene, INK, 0.035, 'I');
  callout(scene, 1, V(2.6, 0.6, 3.6), V(3.4, 1.8, 4.6)); callout(scene, 2, V(-2.6, 0.5, 3.6), V(-3.6, 1.6, 4.6));
  callout(scene, 3, V(0, 3.2, 0), V(-1.5, 3.9, 0)); const c4 = callout(scene, 4, V(), V()); callout(scene, 5, V(-5.5, 0, -4), V(-6.5, 1.2, -4.6));
  let lastR = -1, ph = 0;
  return (dt, t, p) => {
    const R = p.r, dir = p.rev ? -1 : 1, Bw = p.on ? (2e-7 * p.I) / (R * 0.01) : 0;
    if (R !== lastR) { cs.forEach((g, k) => g.position.set(R * Math.cos(k * Math.PI / 4), 0, R * Math.sin(k * Math.PI / 4))); c4.move(V(R + 0.2, 0.3, 0), V(R + 1.4, 1.6, -0.8)); lastR = R; }
    let worst = 0;
    cs.forEach((g, k) => { // B = μ0I/2πr (ŷ × r̂) for current up, plus Earth's field pointing north (−z)
      const a = k * Math.PI / 4;
      worst = Math.max(worst, g.aim(dir * Bw * Math.sin(a), -dir * Bw * Math.cos(a) - BE, dt));
    });
    sw.set(p.on, dt); cl.flip(dir === 1);
    if (p.on) ph -= dir * (0.5 + p.I * 0.06) * dt;
    beads.update(ph);
    ia.set(V(0.4, dir === 1 ? 1.4 : 3, 0), V(0, dir * 1.3, 0)); ia.g.visible = p.on;
    c.out({ Bw });
    if (p.on && p.rev && Bw > 4 * BE && worst < 0.08) c.done();
  };
}
export function FigOersted({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bOersted} p={p} set={set} out={setO} done={done} cam={[6, 8, 12.5]} target={[0, 1.2, 0.6]} />
    <div className="ctl">
      <Slide label="Current I" min={0} max={20} step={0.5} value={p.I} onChange={(I) => set({ I })} show={(v) => v.toFixed(1) + ' A'} />
      <Slide label="Ring radius r" min={1} max={4} step={0.1} value={p.r} onChange={(r) => set({ r })} show={(v) => v.toFixed(1) + ' cm'} />
      <Readout>{p.on ? <>Current {p.rev ? 'down' : 'up'} the wire. Its field at the ring: <b>{sci(o.Bw)} T</b> · Earth's field: 3.0 × 10<sup>−5</sup> T</> : 'Switch open: every needle points north.'}</Readout>
    </div>
  </>);
}

/* ─────────── 2 · Lorentz force (4.2) ─────────── */
function bLorentz(c) {
  const { scene } = c, O = V(0, 2.8, 0);
  scene.add(board(10, 7.5));
  const fl = new THREE.Group(); scene.add(fl);
  const ls = []; for (const x of [-3.2, 0, 3.2]) for (const z of [-2.4, 2.4]) ls.push([[V(x, 0.05, z), V(x, 6, z)]]);
  fieldLines(fl, ls, RED, 0.4, 2.4);
  const bl = label('<b>B</b> (uniform, along +y)', 'vec3'); bl.element.style.color = '#c0392b'; bl.position.set(3.2, 6.3, 2.4); scene.add(bl);
  [['x', V(1, 0, 0)], ['y', V(0, 1, 0)], ['z', V(0, 0, 1)]].forEach(([n, d]) => new Arrow(scene, 0x9a9384, 0.014, n).set(O, d.multiplyScalar(3)));
  const q = mesh(new THREE.SphereGeometry(0.22, 24, 16), toon(RED), 0.02, 0); q.position.copy(O); scene.add(q);
  const qs = label('+q', 'l3'); qs.position.set(-0.4, -0.3, 0); q.add(qs);
  const va = new Arrow(scene, INK, 0.05, '<b>v</b>'), Fa = new Arrow(scene, BLUE, 0.065, '<b>F</b>');
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ color: 0x8e9cc8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  scene.add(pl);
  const arc = lineOf(Array.from({ length: 25 }, () => V()), INK); scene.add(arc);
  const tl = label('θ', 'l3'); scene.add(tl);
  return (dt, t, p) => {
    const th = p.th * D2R, ph = p.ph * D2R, sg = p.q ? -1 : 1;
    const v = V(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    const F = v.clone().cross(V(0, 1, 0)).multiplyScalar(sg); // F = q v × B
    va.set(O, v.clone().multiplyScalar(2.3)); Fa.set(O, F.clone().multiplyScalar(2.3));
    q.material.color.set(sg > 0 ? RED : BLUE); qs.element.textContent = sg > 0 ? '+q (proton)' : '−q (electron)';
    const n = V(0, 1, 0).cross(v);
    pl.visible = n.length() > 0.03;
    if (pl.visible) { pl.position.copy(O); pl.quaternion.setFromUnitVectors(V(0, 0, 1), n.normalize()); }
    const ax = n.length() > 0.03 ? n.normalize() : V(1, 0, 0);
    setLine(arc, Array.from({ length: 25 }, (_, i) => V(0, 0.95, 0).applyAxisAngle(ax, (th * i) / 24).add(O)));
    tl.position.copy(V(0, 1.25, 0).applyAxisAngle(ax, th / 2).add(O));
    c.out({ F: 1.6e-19 * 1e6 * 0.01 * Math.sin(th), F3: F });
    if (p.th < 3 || p.th > 177) c.done();
  };
}
const dirName = (v) => { if (!v || v.length() < 0.02) return 'zero'; const a = [['x', v.x], ['y', v.y], ['z', v.z]].sort((m, n) => Math.abs(n[1]) - Math.abs(m[1]))[0]; return (Math.abs(a[1]) > 0.97 ? (a[1] > 0 ? '+' : '−') + a[0] : 'sideways') + ' direction'; };
export function FigLorentz({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bLorentz} p={p} set={set} out={setO} done={done} cam={[8, 6.5, 9]} target={[0, 2.6, 0]} />
    <div className="ctl">
      <Slide label="Angle θ between v and B" min={0} max={180} step={1} value={p.th} onChange={(th) => set({ th })} show={(v) => v + '°'} />
      <Slide label="Turn v round B" min={0} max={360} step={1} value={p.ph} onChange={(ph) => set({ ph })} show={(v) => v + '°'} />
      <Pick label="Charge" opts={['proton', 'electron']} value={p.q} onChange={(q) => set({ q })} />
      <Readout>v = 10<sup>6</sup> m/s, B = 0.01 T: F = qvB sin θ = <b>{sci(o.F)} N</b>, along the <b>{dirName(o.F3)}</b></Readout>
    </div>
  </>);
}

/* ─────────── 3 · Force on a wire: Example 4.1 ─────────── */
function bFloat(c) {
  const { scene } = c;
  scene.add(board(12.5, 9.4));
  [[-3.2, 'N'], [3.2, 'S']].forEach(([x, n]) => { const b = box(1.4, 3.6, 3.6, 0xeeeae1); b.position.set(x, 1.8, 0); scene.add(b); pole(n, V(x, 4, 0), scene); });
  const fl = new THREE.Group(); scene.add(fl);
  const ls = []; for (const y of [1, 2, 3]) for (const z of [-1.2, 0, 1.2]) ls.push([[V(-2.5, y, z), V(2.5, y, z)]]);
  fieldLines(fl, ls, RED, 0.5, 2.6);
  [-3.95, 3.95].forEach((z) => { const g = cyl(0.06, 3.7, 0xdedad0); g.position.set(0, 1.85, z); scene.add(g); const s = box(0.5, 1.05, 0.5, 0xe6e1d5); s.position.set(0, 0.52, z); scene.add(s); const t = box(0.36, 0.14, 0.36, 0xe6e1d5); t.position.set(0, 3.5, z); scene.add(t); });
  const rod = cyl(0.15, 8.0, 0xd9a066); rod.rotation.x = Math.PI / 2; scene.add(rod);
  const leads = [lineOf([V(), V()], INK), lineOf([V(), V()], INK)]; scene.add(...leads);
  scene.add(tube([V(0.3, 0.32, 3.95), V(5.6, 0.32, 3.95), V(5.6, 0.32, -3.95), V(0.3, 0.32, -3.95)], 0.07));
  const cl = cell(2.0); cl.position.set(2.0, 0, 3.95); scene.add(cl);
  const sw = knife(); sw.position.set(4.4, 0, 3.95); scene.add(sw);
  c.pick(sw, () => c.set({ on: !c.p.on })); c.pick(cl, () => c.set({ rev: !c.p.rev }));
  const Fa = new Arrow(scene, RED, 0.06, 'I<b>l</b>B'), Wa = new Arrow(scene, BLUE, 0.06, 'mg');
  const beads = new Beads(scene, 60);
  callout(scene, 1, V(-3.2, 3.2, 1.8), V(-4.8, 4.4, 2.6)); callout(scene, 2, V(0, 0.8, 3.2), V(-1.2, 1.4, 5.2));
  callout(scene, 3, V(1.2, 0.5, 3.95), V(1.6, 1.6, 5.2)); callout(scene, 4, V(0.1, 3.4, -3.95), V(1.2, 4.6, -4.4));
  let y = 1.2, vy = 0, ph = 0;
  return (dt, t, p) => {
    const dir = p.rev ? -1 : 1, I = p.on ? p.I : 0;
    // F = I l × B with l = 1.5 m along ±z and B along +x  →  F along ±y
    const Fy = V(0, 0, dir).cross(V(1, 0, 0)).y * I * 1.5 * p.B, mg = 0.2 * 9.8, net = Fy - mg;
    const bal = Math.abs(net) < 0.02 && Fy > 0;
    vy += (bal ? (2.2 - y) * 5 - vy * 3 : net * 6) * dt; vy *= 1 - Math.min(1, dt * 1.2);
    y += vy * dt; if (y < 1.2) { y = 1.2; vy = 0; } if (y > 3.3) { y = 3.3; vy = 0; }
    rod.position.set(0, y, 0);
    setLine(leads[0], [V(0, y, 3.95), V(0.3, 0.32, 3.95)]); setLine(leads[1], [V(0, y, -3.95), V(0.3, 0.32, -3.95)]);
    beads.path([V(0, y, -3.9), V(0, y, 3.9)], 0.3);
    if (I) ph -= dir * I * 0.6 * dt; beads.update(ph);
    Fa.set(V(0.3, y, 0.9), V(0, Fy * 0.55, 0)); Wa.set(V(-0.3, y, 0.9), V(0, -mg * 0.55, 0));
    opac(fl, 0.12 + 0.6 * p.B);
    sw.set(p.on, dt); cl.flip(p.rev);
    c.out({ Fy, mg, bal });
    if (p.on && bal) c.done();
  };
}
export function FigFloat({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bFloat} p={p} set={set} out={setO} done={done} cam={[8, 10, 11]} target={[0.4, 1.2, 0.9]} />
    <div className="ctl">
      <Slide label="Current I" min={0} max={4} step={0.05} value={p.I} onChange={(I) => set({ I })} show={(v) => v.toFixed(2) + ' A'} />
      <Slide label="Field B" min={0} max={1} step={0.01} value={p.B} onChange={(B) => set({ B })} show={(v) => v.toFixed(2) + ' T'} />
      <Readout>Wire: m = 200 g, l = 1.5 m. IlB = <b>{(o.Fy ?? 0).toFixed(2)} N</b> vs mg = <b>1.96 N</b> {o.bal ? '→ it floats!' : (o.Fy ?? 0) > 1.96 ? '→ pushed up to the stops' : '→ it rests'}</Readout>
    </div>
  </>);
}

/* ─────────── 4 · Circles and helices (4.3, Example 4.3) ─────────── */
function bHelix(c) {
  const { scene } = c, cy = 4.4, me = 9e-31, e = 1.6e-19;
  scene.add(board(16, 7));
  [-7.2, 7.2].forEach((x) => { scene.add(tube(ringPts(V(x, cy, 0), 4.2, 'yz', 80), 0.16, 0xd9a066, true)); const s = box(0.4, 0.3, 2.4, 0xe9e5dc); s.position.set(x, 0.15, 0); scene.add(s); });
  const fl = new THREE.Group(); scene.add(fl);
  const ls = []; for (const [yy, z] of [[2.2, -2], [2.2, 2], [6.6, 0], [cy, -3.2], [cy, 3.2], [0.9, 0]]) ls.push([[V(-6.8, yy, z), V(6.8, yy, z)]]);
  fieldLines(fl, ls, RED, 0.35, 3);
  const bl = label('<b>B</b>', 'vec3'); bl.element.style.color = '#c0392b'; bl.position.set(6.4, 7, 0); scene.add(bl);
  scene.add(lineOf([V(-6.8, cy, 0), V(6.8, cy, 0)], INK, { dash: 0.25, opacity: 0.5 }));
  const el = mesh(new THREE.SphereGeometry(0.18, 20, 14), toon(BLUE, { emissive: BLUE, emissiveIntensity: 0.6 }), 0.02, 0); scene.add(el);
  const glow = new Beads(scene, 1, 1.4);
  const N = 260, buf = new Float32Array(N * 3), tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(buf, 3));
  scene.add(new THREE.Line(tg, new THREE.LineBasicMaterial({ color: BLUE })));
  const va = new Arrow(scene, INK, 0.04, '<b>v</b>'), Fa = new Arrow(scene, 0x2d8a4c, 0.05, '<b>F</b>');
  const c1 = callout(scene, 2, V(), V());
  callout(scene, 1, V(-7.2, cy + 4.2, 0), V(-6, 8.8, 0)); callout(scene, 3, V(6.8, 0.9, 0), V(7.4, 1.8, 1.8));
  let phi = 0, x = -2;
  return (dt, t, p) => {
    const vp = p.vp * 1e7, vl = p.vl * 1e7, B = p.B * 1e-4;
    const r = (me * vp) / (e * B), nu = (e * B) / (2 * Math.PI * me), ru = r * 10;
    const turns = 0.35 * (B / 6e-4), pu = (vl / nu) * 10;
    phi += 2 * Math.PI * turns * dt; x += pu * turns * dt; if (x > 6.4) x = -6.4;
    // electron (q < 0): angular velocity along +B, so it turns anticlockwise about +x
    const P = (f, xx) => V(xx, cy + ru * Math.cos(f), ru * Math.sin(f));
    const pos = P(phi, x); el.position.copy(pos); glow.pos.set([pos.x, pos.y, pos.z]); glow.geo.setDrawRange(0, 1); glow.geo.attributes.position.needsUpdate = true;
    let n = 0;
    for (let k = 0; k < N; k++) { const f = phi - k * 0.05, xx = x - (k * 0.05 / (2 * Math.PI)) * pu; if (xx < -6.6) break; const q = P(f, xx); buf.set([q.x, q.y, q.z], k * 3); n++; }
    tg.setDrawRange(0, n); tg.attributes.position.needsUpdate = true;
    const v = V(vl / 1e7, -ru * Math.sin(phi) * (vp / 1e7) / Math.max(ru, 1e-6), ru * Math.cos(phi) * (vp / 1e7) / Math.max(ru, 1e-6));
    const F = v.clone().cross(V(1, 0, 0)).multiplyScalar(-1); // F = q v × B, q = −e
    va.set(pos, v.clone().normalize().multiplyScalar(1.3)); Fa.set(pos, F.normalize().multiplyScalar(1.1));
    c1.move(pos.clone().add(V(0.1, 0.2, 0)), pos.clone().add(V(0.8, 1.2, 0.4)));
    c.out({ r: r * 100, nu: nu / 1e6, T: 1e9 / nu, pc: (vl / nu) * 100, keV: (0.5 * me * (vp * vp + vl * vl)) / 1.6e-16 });
    if (Math.abs(r * 100 - 28) < 0.6 && p.vl === 0) c.done();
  };
}
export function FigHelix({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bHelix} p={p} set={set} out={setO} done={done} cam={[3, 6, 17]} target={[0, 3.4, 0]} />
    <div className="ctl">
      <Slide label="v across B" min={0.5} max={3.5} step={0.1} value={p.vp} onChange={(vp) => set({ vp })} show={(v) => v.toFixed(1) + ' × 10⁷ m/s'} />
      <Slide label="v along B" min={0} max={1} step={0.05} value={p.vl} onChange={(vl) => set({ vl })} show={(v) => v.toFixed(2) + ' × 10⁷ m/s'} />
      <Slide label="Field B" min={5} max={20} step={0.2} value={p.B} onChange={(B) => set({ B })} show={(v) => v.toFixed(1) + ' × 10⁻⁴ T'} />
      <Readout>electron: r = mv/qB = <b>{(o.r ?? 0).toFixed(1)} cm</b> · ν = <b>{(o.nu ?? 0).toFixed(1)} MHz</b> (no v in it) · pitch {(o.pc ?? 0).toFixed(1)} cm · KE {(o.keV ?? 0).toFixed(2)} keV</Readout>
    </div>
  </>);
}

/* ─────────── 5 · Biot–Savart (4.4, Example 4.4) ─────────── */
function bBiot(c) {
  const { scene } = c, O = V(0, 2.6, 0);
  scene.add(board(12, 8));
  scene.add(tube([V(-5.6, 2.6, 0), V(5.6, 2.6, 0)], 0.045, 0xeeeae2));
  [-5.6, 5.6].forEach((x) => { const s = cyl(0.07, 2.6, 0xdedad0); s.position.set(x, 1.3, 0); scene.add(s); });
  const el = cyl(0.13, 0.9, 0xd9a066); el.rotation.z = Math.PI / 2; el.position.copy(O); scene.add(el);
  new Arrow(scene, INK, 0.035, 'I d<b>l</b>').set(V(-0.5, 3.05, 0), V(1.2, 0, 0));
  const nul = label('θ = 0 or 180°: dB = 0 along this line', 'l3 small'); nul.position.set(-4.6, 2.95, 0); scene.add(nul);
  const P = mesh(new THREE.SphereGeometry(0.1, 16, 12), toon(0xffffff), 0.02, 0); scene.add(P);
  const Pl = label('P', 'l3'); Pl.position.set(0.25, 0.25, 0); P.add(Pl);
  const rl = lineOf([V(), V()], INK, { dash: 0.15 }); scene.add(rl);
  const rlab = label('<b>r</b>', 'vec3'); scene.add(rlab);
  const dB = new Arrow(scene, BLUE, 0.055, 'd<b>B</b>');
  const ghosts = Array.from({ length: 8 }, () => new Arrow(scene, 0x9fb1e6, 0.03));
  const ring = lineOf(Array.from({ length: 65 }, () => V()), BLUE, { dash: 0.12, opacity: 0.6 }); scene.add(ring);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({ color: 0x8e9cc8, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })); scene.add(pl);
  callout(scene, 1, V(0.3, 2.7, 0.1), V(0.9, 1.4, 1.6)); callout(scene, 2, V(-5.6, 1, 0), V(-6.4, 2, 1));
  return (dt, t, p) => {
    const th = p.th * D2R, ph = p.ph * D2R, ru = p.r * 5;
    const rh = V(Math.cos(th), Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph));
    const Pp = O.clone().addScaledVector(rh, ru); P.position.copy(Pp);
    setLine(rl, [O, Pp]); rlab.position.copy(O.clone().addScaledVector(rh, ru * 0.55).add(V(0, 0.25, 0)));
    const dir = V(1, 0, 0).cross(rh); // dl × r
    const s = Math.sin(th), len = Math.min(2.4, (0.5 * s) / (p.r * p.r));
    dB.set(Pp, dir.clone().normalize().multiplyScalar(len));
    const cx = O.x + ru * Math.cos(th), rho = ru * s;
    setLine(ring, Array.from({ length: 65 }, (_, i) => { const a = (i / 64) * Math.PI * 2; return V(cx, O.y + rho * Math.cos(a), rho * Math.sin(a)); }));
    ghosts.forEach((g, k) => { const a = (k / 8) * Math.PI * 2 + ph; g.set(V(cx, O.y + rho * Math.cos(a), rho * Math.sin(a)), V(0, -Math.sin(a), Math.cos(a)).multiplyScalar(len * 0.6)); });
    pl.visible = s > 0.03; if (pl.visible) { pl.position.copy(O); pl.quaternion.setFromUnitVectors(V(0, 0, 1), dir.clone().normalize()); }
    const B = (1e-7 * 10 * 0.01 * s) / (p.r * p.r);
    c.out({ B, D: dir });
    if (p.th === 90 && Math.abs(p.r - 0.5) < 0.005) c.done();
  };
}
export function FigBiot({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bBiot} p={p} set={set} out={setO} done={done} cam={[6, 6.5, 11]} target={[0, 2.4, 0]} />
    <div className="ctl">
      <Slide label="Angle θ (dl to r)" min={0} max={180} step={1} value={p.th} onChange={(th) => set({ th })} show={(v) => v + '°'} />
      <Slide label="Distance r" min={0.2} max={1} step={0.01} value={p.r} onChange={(r) => set({ r })} show={(v) => v.toFixed(2) + ' m'} />
      <Slide label="Walk P round the wire" min={0} max={360} step={1} value={p.ph} onChange={(ph) => set({ ph })} show={(v) => v + '°'} />
      <Readout>I = 10 A, dl = 1 cm: dB = (μ₀/4π) I dl sin θ / r² = <b>{sci(o.B)} T</b>, along the {dirName(o.D)}</Readout>
    </div>
  </>);
}

/* ─────────── 6 · Field on the axis of a loop (4.5) ─────────── */
function loopLines(segs, C, R, plane) {
  const inside = (q) => Math.abs(q.x - C.x) < 7 && Math.abs(q.y - C.y) < 5.6 && Math.abs(q.z - C.z) < 5.6 && q.y > 0.05;
  const wires = [plane === 'yz' ? (q) => Math.hypot(q.x - C.x, Math.hypot(q.y - C.y, q.z - C.z) - R) : (q) => Math.hypot(q.y - C.y, Math.hypot(q.x - C.x, q.z - C.z) - R)];
  const out = [];
  for (const s of [-0.75, -0.45, -0.18, 0, 0.18, 0.45, 0.75]) {
    const seeds = plane === 'yz' ? [V(C.x, C.y + s * R, C.z), ...(s ? [V(C.x, C.y, C.z + s * R)] : [])] : [V(C.x + s * R, C.y, C.z), ...(s ? [V(C.x, C.y, C.z + s * R)] : [])];
    for (const sd of seeds) out.push([traceLine(segs, sd, { h: 0.07, steps: 700, inside, wires, wireDist: 0.1 })]);
  }
  return out;
}
function bLoop(c) {
  const { scene } = c, C = V(-2, 2.9, 0), R = 1.8;
  scene.add(board(14, 9));
  scene.add(tube(ringPts(C, R, 'yz', 96), 0.1, 0xd9a066, true));
  const st = cyl(0.08, C.y - R, 0xdedad0); st.position.set(C.x, (C.y - R) / 2, 0); scene.add(st);
  scene.add(lineOf([V(-8, C.y, 0), V(6.5, C.y, 0)], INK, { dash: 0.3, opacity: 0.6 }));
  const fl = new THREE.Group(); scene.add(fl);
  const beads = new Beads(scene);
  const probe = new THREE.Group(); scene.add(probe);
  const ps = mesh(new THREE.SphereGeometry(0.12, 16, 12), toon(0xffffff), 0.02, 0); probe.add(ps);
  const pst = cyl(0.04, 2.2, 0xdedad0); pst.position.y = 1.2; probe.add(pst);
  const plab = label('', 'lcd3'); plab.position.y = 2.6; probe.add(plab);
  const Ba = new Arrow(scene, RED, 0.06, '<b>B</b>');
  callout(scene, 1, V(C.x, C.y + R, 0), V(C.x - 1.2, C.y + R + 1.1, 0)); callout(scene, 2, V(C.x, 0.6, 0), V(C.x - 1.4, 1.2, 1.4));
  callout(scene, 3, V(5.8, C.y, 0), V(6.4, C.y + 0.8, 0.6));
  let rev = null, segs, sign = 1, ph = 0;
  return (dt, t, p) => {
    if (p.rev !== rev) {
      rev = p.rev; const pts = ringPts(C, R, 'yz', 72, rev ? -1 : 1); segs = segsOf(pts);
      fieldLines(fl, loopLines(segs, C, R, 'yz'), RED, 0.55, 2.4);
      beads.path(pts, 0.3); sign = Math.sign(bs(segs, C).x);
    }
    ph -= 0.8 * dt; beads.update(ph);
    const u = p.x, ratio = Math.pow(1 + u * u, -1.5), Pp = V(C.x + u * R, C.y, 0);
    probe.position.copy(Pp); Ba.set(Pp.clone().add(V(0, 0, 0.3)), V(sign * (0.3 + 2.4 * ratio), 0, 0));
    const Rm = 0.1, B0 = (MU0 * p.N * 1) / (2 * Rm), B = B0 * ratio;
    plab.element.textContent = ratio.toFixed(3) + ' B₀';
    c.out({ ratio, B, B0 });
    if (Math.abs(ratio - 0.125) < 0.004) c.done();
  };
}
export function FigLoop({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bLoop} p={p} set={set} out={setO} done={done} cam={[4, 7, 15]} target={[0, 2.6, 0]} />
    <div className="ctl">
      <Slide label="Probe at x" min={0} max={3} step={0.01} value={p.x} onChange={(x) => set({ x })} show={(v) => v.toFixed(2) + ' R'} />
      <Slide label="Turns N" min={1} max={100} step={1} value={p.N} onChange={(N) => set({ N })} show={(v) => v + ' turn' + (v > 1 ? 's' : '')} />
      <Pick label="Current" opts={['one way', 'reversed']} value={p.rev ? 1 : 0} onChange={(k) => set({ rev: !!k })} />
      <Graph f={(x) => Math.pow(1 + x * x, -1.5)} x1={3} at={p.x} hl={0.125} xl="x/R" yl="B/B₀" />
      <Readout>R = 10 cm, I = 1 A: B₀ = μ₀NI/2R = {sci(o.B0)} T · at the probe <b>B = {sci(o.B)} T</b></Readout>
    </div>
  </>);
}

/* ─────────── 7 · Ampère's law (4.6, Example 4.7) ─────────── */
function bAmpere(c) {
  const { scene } = c, a = 0.7, K = 1.4, FN = 900;
  scene.add(board(14, 10));
  const wm = toon(0xd9a066, { transparent: true });
  const wire = mesh(new THREE.CylinderGeometry(a, a, 5.6, 40), wm, 0.02, 0); wire.position.y = 2.5; scene.add(wire);
  const path = [V(0, 5.3, 0), V(6, 5.3, 0), V(6, 0.32, 0), V(6, 0.32, 4.4), V(-6, 0.32, 4.4), V(-6, 0.32, 0), V(-6, -0.3, 0), V(0, -0.3, 0), V(0, 5.3, 0)];
  scene.add(tube(path.slice(0, 6), 0.1));
  const cl = cell(); cl.position.set(2, 0, 4.4); cl.flip(true); scene.add(cl);
  const beads = new Beads(scene).path(path, 0.34);
  const fil = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 0.025, 0.035), new THREE.MeshLambertMaterial({ color: 0x3a3633 }), FN);
  const F = []; let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (F.length < FN) { const r = a + 0.1 + 5.6 * Math.sqrt(rnd()), t = rnd() * Math.PI * 2, x = r * Math.cos(t), z = r * Math.sin(t); if (z > 3.9 && Math.abs(x) < 6.3) continue; F.push([x, z, r, rnd() * Math.PI]); }
  scene.add(fil);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 8, 96), toon(RED, { emissive: RED, emissiveIntensity: 0.3 })); loop.rotation.x = Math.PI / 2; loop.position.y = 0.75; scene.add(loop);
  let lastRu = 1;
  const Bs = Array.from({ length: 8 }, () => new Arrow(scene, RED, 0.035));
  const rl = label('r', 'vec3'); rl.element.style.color = '#c0392b'; scene.add(rl);
  const ia = new Arrow(scene, INK, 0.035, 'I'); ia.set(V(1, 3.4, 0), V(0, 1.2, 0));
  callout(scene, 1, V(0.5, 4.6, 0.5), V(-1.2, 5.4, 1)); callout(scene, 2, V(-4, 0, -3), V(-5, 1.1, -3.8));
  const c3 = callout(scene, 3, V(), V()); callout(scene, 4, V(2.6, 0.6, 4.4), V(3.4, 1.7, 5.2));
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), sc = V(1, 1, 1);
  let sI = 0, ph = 0;
  return (dt, t, p) => {
    sI += (p.I - sI) * Math.min(1, dt * 2.5);
    const ru = p.r * K, inside = ru < a;
    wm.opacity = inside ? 0.35 : 1; wire.children[0].visible = !inside;
    F.forEach(([x, z, r, t0], i) => { // filings: random until B (∝ I/r) is strong enough, then tangent to circles
      const s = Math.min(1, sI / (r * 2.2)), tau = Math.atan2(x, z);
      let d = tau - t0; d -= Math.PI * Math.round(d / Math.PI);
      q4.setFromAxisAngle(V(0, 1, 0), t0 + s * d); m4.compose(V(x, 0.02, z), q4, sc); fil.setMatrixAt(i, m4);
    });
    fil.instanceMatrix.needsUpdate = true;
    if (ru !== lastRu) { loop.geometry.dispose(); loop.geometry = new THREE.TorusGeometry(ru, 0.045, 8, 96); lastRu = ru; }
    const am = 0.005, rm = p.r / 100, B = rm < am ? (MU0 * p.I * rm) / (2 * Math.PI * am * am) : (MU0 * p.I) / (2 * Math.PI * rm);
    const Ba = (MU0 * p.I) / (2 * Math.PI * am), len = Math.min(1.6, (B / Math.max(Ba, 1e-12)) * 1.3);
    Bs.forEach((g, k) => { const t2 = (k / 8) * Math.PI * 2; g.set(V(ru * Math.cos(t2), 0.75, ru * Math.sin(t2)), V(Math.sin(t2), 0, -Math.cos(t2)).multiplyScalar(p.I ? len : 0)); });
    rl.position.set(ru * 0.5, 0.95, 0); c3.move(V(-ru, 0.75, 0), V(-ru - 0.8, 1.9, 0.6));
    ph -= (0.3 + p.I * 0.08) * dt * (p.I > 0); beads.update(ph);
    const Ie = rm < am ? (p.I * rm * rm) / (am * am) : p.I;
    c.out({ B, Ie, ratio: B / Math.max(Ba, 1e-12) });
    if (p.I > 0 && rm < am && Math.abs(B / Ba - 0.5) < 0.02) c.done();
  };
}
export function FigAmpere({ p, set, done }) {
  const [o, setO] = useState({});
  const f = (r) => (r < 0.5 ? r / 0.5 : 0.5 / r);
  return (<>
    <Scene3D build={bAmpere} p={p} set={set} out={setO} done={done} cam={[6, 9, 13]} target={[0, 1.6, 0.8]} />
    <div className="ctl">
      <Slide label="Current I" min={0} max={10} step={0.1} value={p.I} onChange={(I) => set({ I })} show={(v) => v.toFixed(1) + ' A'} />
      <Slide label="Loop radius r" min={0.05} max={4} step={0.05} value={p.r} onChange={(r) => set({ r })} show={(v) => v.toFixed(2) + ' cm'} />
      <Graph f={f} x1={4} at={p.r} xl="r (cm), wire radius a = 0.5 cm" yl="B" />
      <Readout>{p.r < 0.5 ? 'Inside: I enclosed = I r²/a² = ' : 'Outside: I enclosed = '}<b>{(o.Ie ?? 0).toFixed(2)} A</b> · B·2πr = μ₀I<sub>e</sub> → <b>B = {sci(o.B)} T</b></Readout>
    </div>
  </>);
}

/* ─────────── 8 · Solenoid (4.7, Example 4.8) ─────────── */
function bSolenoid(c) {
  const { scene } = c, cy = 2.5, R = 1.1, L = 8, um = 0.05 / L, BE = 3e-5;
  scene.add(board(14, 9));
  [-3.4, 3.4].forEach((x) => { const s = box(0.5, cy - R + 0.1, 1.5, 0xe9e5dc); s.position.set(x, (cy - R + 0.1) / 2, 0); scene.add(s); });
  const former = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.93, L, 40, 1, true), new THREE.MeshBasicMaterial({ color: 0xcfd6e6, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
  former.rotation.z = Math.PI / 2; former.position.y = cy; scene.add(former);
  const coil = new THREE.Group(); scene.add(coil);
  const fl = new THREE.Group(); scene.add(fl);
  const cl = cell(); cl.position.set(0.2, 0, 3.4); cl.flip(true); scene.add(cl);
  const beads = new Beads(scene, 900);
  const cin = compass(0.3); cin.position.set(-1.6, cy - 0.62, 0); scene.add(cin);
  const cout = compass(0.34); cout.position.set(1.2, 0, 2.1); scene.add(cout);
  callout(scene, 1, V(2.6, cy + R, 0), V(3.4, cy + R + 1.2, 0)); callout(scene, 2, V(0.8, 0.6, 3.4), V(1.6, 1.6, 4.6));
  callout(scene, 3, V(-1.6, cy - 0.5, 0), V(-2.8, cy + 2.6, 0.6)); callout(scene, 4, V(1.5, 0.2, 2.1), V(2.6, 1.0, 3));
  let lastN = 0, segs, ph = 0, bin = 0, bout = V();
  return (dt, t, p) => {
    if (p.N !== lastN) {
      lastN = p.N;
      const pts = [], fine = [];
      for (let j = 0, M = p.N * 36; j <= M; j++) { const u = j / M, a = 2 * Math.PI * p.N * u; pts.push(V(-L / 2 + L * u, cy + R * Math.cos(a), R * Math.sin(a))); }
      for (let j = 0, M = p.N * 12; j <= M; j++) { const u = j / M, a = 2 * Math.PI * p.N * u; fine.push(V(-L / 2 + L * u, cy + R * Math.cos(a), R * Math.sin(a))); }
      coil.traverse((o) => { o.geometry?.dispose(); }); coil.clear();
      const lead = [V(L / 2, cy + R, 0), V(L / 2 + 0.7, cy + R, 0), V(L / 2 + 0.7, 0.32, 0), V(L / 2 + 0.7, 0.32, 3.4), V(-L / 2 - 0.7, 0.32, 3.4), V(-L / 2 - 0.7, 0.32, 0), V(-L / 2 - 0.7, cy + R, 0), V(-L / 2, cy + R, 0)];
      coil.add(tube(pts, 0.042, 0xd9a066), tube(lead, 0.06));
      beads.path([...pts, ...lead], 0.32);
      segs = segsOf(fine);
      const inside = (q) => Math.abs(q.x) < 9.5 && Math.abs(q.y - cy) < 5.5 && Math.abs(q.z) < 5 && q.y > 0.05;
      const wires = [(q) => (Math.abs(q.x) < L / 2 + 0.1 ? Math.abs(Math.hypot(q.y - cy, q.z) - R) : 9)];
      fieldLines(fl, [-0.72, -0.4, 0, 0.4, 0.72].map((s) => [traceLine(segs, V(0, cy + s * R, 0), { h: 0.09, steps: 650, inside, wires, wireDist: 0.07 })]), RED, 0.6, 2.6);
      const k = 1e-7 / um; bin = bs(segs, cin.position.clone().add(V(0, 0.15, 0))).x * k; bout = bs(segs, cout.position.clone().add(V(0, 0.15, 0))).multiplyScalar(k);
    }
    opac(fl, p.I > 0 ? 0.25 + 0.6 * Math.min(1, p.I / 5) : 0.06);
    cin.aim(bin * p.I, -BE, dt); cout.aim(bout.x * p.I, bout.z * p.I - BE, dt);
    ph -= (0.3 + p.I * 0.2) * dt * (p.I > 0); beads.update(ph);
    const Bm = MU0 * (p.N / 0.05) * p.I * 1000;
    c.out({ Bm, Bo: bout.length() * p.I });
    if (Math.abs(Bm - 6.28) < 0.06) c.done();
  };
}
export function FigSolenoid({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bSolenoid} p={p} set={set} out={setO} done={done} cam={[5, 7.5, 13]} target={[0, 2, 0.6]} />
    <div className="ctl">
      <Slide label="Turns N (length 5 cm)" min={10} max={50} step={2} value={p.N} onChange={(N) => set({ N })} show={(v) => `${v} → n = ${v * 20}/m`} />
      <Slide label="Current I" min={0} max={5} step={0.1} value={p.I} onChange={(I) => set({ I })} show={(v) => v.toFixed(1) + ' A'} />
      <Readout>Inside: B = μ₀nI = <b>{(o.Bm ?? 0).toFixed(2)} mT</b> · at the outside compass only {sci(o.Bo)} T</Readout>
    </div>
  </>);
}

/* ─────────── 9 · Parallel currents (4.8) ─────────── */
function bParallel(c) {
  const { scene } = c, y0 = 0.7, y1 = 5.4;
  scene.add(board(12, 7));
  [-4.6, 4.6].forEach((x) => { const s = cyl(0.12, 5.9, 0xdedad0); s.position.set(x, 2.95, 0); scene.add(s); });
  const tb = box(9.4, 0.3, 0.6, 0xeeeae1); tb.position.set(0, 5.7, 0); scene.add(tb);
  const bb = box(9.4, 0.3, 0.6, 0xeeeae1); bb.position.set(0, 0.45, 0); scene.add(bb);
  const strips = new THREE.Group(); scene.add(strips);
  const ba = new Beads(scene, 80), bb2 = new Beads(scene, 80);
  const circ = Array.from({ length: 3 }, () => { const l = lineOf(Array.from({ length: 65 }, () => V()), RED, { dash: 0.14, opacity: 0.55 }); scene.add(l); return l; });
  const Bab = new Arrow(scene, RED, 0.04, '<b>B</b><sub>a</sub>'), Fb = new Arrow(scene, BLUE, 0.06, '<b>F</b><sub>ba</sub>'), Fa = new Arrow(scene, BLUE, 0.06, '<b>F</b><sub>ab</sub>');
  const Ia = new Arrow(scene, INK, 0.03, 'I<sub>a</sub>'), Ib = new Arrow(scene, INK, 0.03, 'I<sub>b</sub>');
  const sw = box(1.2, 0.3, 0.8, 0xf1ede4); sw.position.set(0, 0.15, 2.6); scene.add(sw); c.pick(sw, () => c.set({ opp: c.p.opp ? 0 : 1 }));
  const swl = label('', 'l3 small'); swl.position.set(0, 0.6, 2.6); scene.add(swl);
  const c1 = callout(scene, 1, V(), V()), c2 = callout(scene, 2, V(), V()); callout(scene, 3, V(-3, 5.7, 0), V(-3.6, 6.6, 0.6)); callout(scene, 4, V(0.4, 0.3, 2.6), V(1.6, 1.0, 3.6));
  let da = 0, db = 0, ph = 0;
  const bend = (x, d) => Array.from({ length: 13 }, (_, i) => { const y = y1 - ((y1 - y0) * i) / 12; return V(x + d * Math.sin((Math.PI * i) / 12), y, 0); });
  return (dt, t, p) => {
    const du = p.d * 0.6, xa = -du / 2, xb = du / 2, dm = p.d / 100;
    const Ia3 = V(0, -1, 0), Ib3 = V(0, p.opp ? 1 : -1, 0);
    const B = (MU0 * p.I) / (2 * Math.PI * dm);
    const Ba = Ia3.clone().cross(V(1, 0, 0)).multiplyScalar(B);          // field of a at b
    const Bb = Ib3.clone().cross(V(-1, 0, 0)).multiplyScalar(B);         // field of b at a
    const fb = Ib3.clone().cross(Ba).multiplyScalar(p.I), fa = Ia3.clone().cross(Bb).multiplyScalar(p.I); // force per metre
    const lim = du / 2 - 0.25;
    db += (Math.max(-lim, Math.min(lim, fb.x * 450)) - db) * Math.min(1, dt * 4);
    da += (Math.max(-lim, Math.min(lim, fa.x * 450)) - da) * Math.min(1, dt * 4);
    strips.traverse((o) => o.geometry?.dispose()); strips.clear();
    const A = bend(xa, da), Bp = bend(xb, db);
    strips.add(tube(A, 0.09, 0xeeeae0, true), tube(Bp, 0.09, 0xeeeae0, true));
    ph += (0.4 + p.I * 0.05) * dt * (p.I > 0);
    ba.path(A, 0.3).update(-ph); bb2.path(Bp, 0.3).update(p.opp ? ph : -ph);
    circ.forEach((l, k) => { const r = 0.5 + k * 0.6; setLine(l, Array.from({ length: 65 }, (_, i) => { const a2 = (i / 64) * Math.PI * 2; return V(xa + da + r * Math.cos(a2), 3.05, r * Math.sin(a2)); })); });
    const s = p.I > 0 ? 1 : 0;
    Bab.set(V(xb + db, 3.05, 0), Ba.clone().normalize().multiplyScalar(1.1 * s));
    Fb.set(V(xb + db, 2.4, 0), fb.clone().normalize().multiplyScalar(1.2 * s)); Fa.set(V(xa + da, 2.4, 0), fa.clone().normalize().multiplyScalar(1.2 * s));
    Ia.set(V(xa - 0.4, 4.6, 0), V(0, -0.9, 0)); Ib.set(V(xb + 0.4, p.opp ? 3.7 : 4.6, 0), V(0, p.opp ? 0.9 : -0.9, 0));
    swl.element.textContent = p.opp ? 'b reversed' : 'b same way';
    c1.move(V(xa + da, 4.2, 0), V(xa - 1.4, 4.8, 0.6)); c2.move(V(xb + db, 1.6, 0), V(xb + 1.4, 1.2, 0.8));
    c.out({ f: fb.length(), rep: fb.x > 0 });
    if (p.opp && p.I > 0 && db > 0.15) c.done();
  };
}
export function FigParallel({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bParallel} p={p} set={set} out={setO} done={done} cam={[3, 6, 13]} target={[0, 2.8, 0]} />
    <div className="ctl">
      <Pick label="Current in b" opts={['same way', 'opposite way']} value={p.opp} onChange={(opp) => set({ opp })} />
      <Slide label="Current in each" min={0} max={20} step={0.5} value={p.I} onChange={(I) => set({ I })} show={(v) => v.toFixed(1) + ' A'} />
      <Slide label="Gap d" min={2} max={8} step={0.1} value={p.d} onChange={(d) => set({ d })} show={(v) => v.toFixed(1) + ' cm'} />
      <Readout>f = μ₀I<sub>a</sub>I<sub>b</sub>/2πd = <b>{sci(o.f)} N/m</b>, {o.rep ? 'repel' : 'attract'}. (1 A each, 1 m apart → 2 × 10<sup>−7</sup> N/m: the ampere.)</Readout>
    </div>
  </>);
}

/* ─────────── 10 · Torque on a rectangular loop (4.9.1) ─────────── */
function bTorque(c) {
  const { scene } = c, a = 1.6, b = 1.3, cy = 2.7, Bt = 0.5, A = 0.1 * 0.08, J = 0.05;
  scene.add(board(13.5, 8));
  [[-4.6, 'N'], [4.6, 'S']].forEach(([x, n]) => { const bx = box(1.8, 4.4, 3.6, 0xeeeae1); bx.position.set(x, 2.2, 0); scene.add(bx); pole(n, V(x, 4.75, 0), scene); });
  const fl = new THREE.Group(); scene.add(fl);
  const ls = []; for (const y of [1.2, 2.7, 4.2]) for (const z of [-1.3, 1.3]) ls.push([[V(-3.65, y, z), V(3.65, y, z)]]);
  fieldLines(fl, ls, RED, 0.45, 2.4);
  const ax = cyl(0.05, 5.4, 0xdedad0); ax.position.set(0, cy, 0); scene.add(ax);
  const base = cyl(0.4, 0.2, 0xe6e1d5); base.position.y = 0.1; scene.add(base);
  const coil = new THREE.Group(); coil.position.y = cy; scene.add(coil);
  const C = [V(-a, b, 0), V(a, b, 0), V(a, -b, 0), V(-a, -b, 0)];
  coil.add(tube([...C, C[0], C[1]], 0.1, 0xd9a066));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2 * a, 2 * b), new THREE.MeshBasicMaterial({ color: 0xe7dcc4, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false })); coil.add(face);
  ['A', 'B', 'C', 'D'].forEach((n, i) => { const l = label(n, 'l3'); l.position.copy(C[i]).multiplyScalar(1.15); coil.add(l); });
  const beads = new Beads(coil).path([...C, C[0]], 0.3);
  const Fs = C.map(() => new Arrow(scene, BLUE, 0.05)), ma = new Arrow(scene, 0x6b3fa0, 0.06, '<b>m</b>');
  const cl = cell(1.8, 0.28); cl.position.set(-2.2, 0, 3); scene.add(cl);
  const sw = knife(); sw.position.set(2, 0, 3); scene.add(sw); c.pick(sw, () => c.set({ run: !c.p.run }));
  scene.add(tube([V(-3.1, 0.28, 3), V(-3.6, 0.28, 3), V(-3.6, 0.28, 1.2), V(-0.1, 0.28, 1.2), V(-0.1, 0.2, 0.3)], 0.05), tube([V(-1.3, 0.28, 3), V(1.4, 0.28, 3)], 0.05), tube([V(2.7, 0.28, 3), V(3.4, 0.28, 3), V(3.4, 0.28, 1.4), V(0.1, 0.28, 1.4), V(0.1, 0.2, 0.3)], 0.05));
  callout(scene, 1, V(-4.6, 4.4, 1.8), V(-5.6, 5.4, 2.6)); callout(scene, 2, V(4.6, 4.4, 1.8), V(5.6, 5.4, 2.6));
  callout(scene, 4, V(0, 5.3, 0), V(0.8, 6, 0.6)); callout(scene, 5, V(-2.2, 0.5, 3), V(-2.8, 1.5, 4));
  let psi = 0, w = 0, far = false, ph = 0;
  return (dt, t, p) => {
    const I = p.run ? p.I : 0;
    if (!p.run) { psi = p.start * D2R - Math.PI / 2; w = 0; far = p.start > 25; }
    const n = V(0, 0, -1).applyAxisAngle(V(0, 1, 0), psi);        // right-hand normal of A→B→C→D
    const m = n.clone().multiplyScalar(p.N * I * A);
    const tau = m.clone().cross(V(Bt, 0, 0));                         // τ = m × B
    if (p.run) { w += (tau.y / J - 0.7 * w) * dt; psi += w * dt; }
    coil.rotation.y = psi;
    const W = C.map((q) => q.clone().applyAxisAngle(V(0, 1, 0), psi).add(V(0, cy, 0)));
    W.forEach((q, i) => { const r = W[(i + 1) % 4], l = r.clone().sub(q), F = l.clone().normalize().cross(V(1, 0, 0)).multiplyScalar(I ? 0.5 + I * 0.45 : 0); Fs[i].set(q.clone().add(r).multiplyScalar(0.5), F); });
    ma.set(V(0, cy, 0), n.clone().multiplyScalar(2.3));
    if (I) ph -= I * 0.8 * dt; beads.update(ph);
    sw.set(p.run, dt);
    const th = Math.acos(Math.max(-1, Math.min(1, n.x)));
    c.out({ th: th / D2R, tau: p.N * p.I * A * Bt * Math.sin(th) * (p.run ? 1 : 1) });
    if (p.run && far && Math.abs(w) < 0.02 && th < 3 * D2R) c.done();
  };
}
export function FigTorque({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bTorque} p={p} set={set} out={setO} done={done} cam={[6.5, 7, 12]} target={[0, 2.4, 0]} />
    <div className="ctl">
      <Slide label="Start angle θ (m to B)" min={0} max={180} step={1} value={p.start} onChange={(start) => set({ start, run: false })} show={(v) => v + '°'} />
      <Slide label="Current I" min={0.5} max={3} step={0.1} value={p.I} onChange={(I) => set({ I })} show={(v) => v.toFixed(1) + ' A'} />
      <Slide label="Turns N" min={1} max={50} step={1} value={p.N} onChange={(N) => set({ N })} show={(v) => v + ''} />
      <button className="btn" onClick={() => set({ run: !p.run })}>{p.run ? 'Hold the coil' : 'Release (close switch)'}</button>
      <Readout>A = 10 × 8 cm², B = 0.5 T · θ = <b>{Math.round(o.th ?? 0)}°</b> · τ = NIAB sin θ = <b>{(o.tau ?? 0).toFixed(3)} N m</b></Readout>
    </div>
  </>);
}

/* ─────────── 11 · Loop as a magnetic dipole (4.9.2) ─────────── */
function bDipole(c) {
  const { scene } = c, C = V(0, 2.6, 0), R = 0.8, um = 0.05 / R;
  scene.add(board(14, 9));
  const pts = ringPts(C, R, 'xz', 90);
  scene.add(tube(pts, 0.07, 0xd9a066, true));
  const st = cyl(0.05, C.y, 0xdedad0); st.position.set(R, C.y / 2, 0); scene.add(st);
  const segs = segsOf(pts);
  const fl = new THREE.Group(); scene.add(fl);
  const inside = (q) => Math.abs(q.x) < 7 && q.y > 0.05 && q.y < 9.5 && Math.abs(q.z) < 6;
  const wires = [(q) => Math.hypot(q.y - C.y, Math.hypot(q.x, q.z) - R)];
  fieldLines(fl, [-0.7, -0.4, 0, 0.4, 0.7].flatMap((s) => [[traceLine(segs, V(s * R, C.y, 0), { h: 0.06, steps: 900, inside, wires, wireDist: 0.07 })], ...(s ? [[traceLine(segs, V(0, C.y, s * R), { h: 0.06, steps: 900, inside, wires, wireDist: 0.07 })]] : [])]), RED, 0.5, 2.2);
  pole('N', V(0, C.y + 0.6, 0), scene); pole('S', V(0, C.y - 0.6, 0), scene);
  const beads = new Beads(scene).path(pts, 0.25);
  const ma = new Arrow(scene, 0x6b3fa0, 0.05, '<b>m</b>'); ma.set(C, V(0, 1.1, 0));
  const P = mesh(new THREE.SphereGeometry(0.11, 16, 12), toon(0xffffff), 0.02, 0); scene.add(P);
  const Ba = new Arrow(scene, BLUE, 0.05, '<b>B</b>');
  const guide = lineOf([V(), V()], INK, { dash: 0.2, opacity: 0.5 }); scene.add(guide);
  callout(scene, 1, V(-R, C.y, 0), V(-2, C.y + 1, 0.4)); callout(scene, 2, V(R, 1, 0), V(1.8, 0.9, 1.2));
  let ph = 0;
  return (dt, t, p) => {
    const eq = p.where === 1, u = p.u, pos = eq ? V(u * R, C.y, 0) : V(0, C.y + u * R, 0);
    P.position.copy(pos); setLine(guide, [C, pos]);
    const B = bs(segs, pos).multiplyScalar(1e-7 / um), mm = Math.PI * 0.05 * 0.05, x = u * 0.05;
    const dip = (1e-7 * (eq ? 1 : 2) * mm) / (x * x * x), err = Math.abs(B.length() - dip) / B.length();
    Ba.set(pos, B.clone().normalize().multiplyScalar(Math.max(0.35, Math.min(2.4, 0.8 + 0.5 * Math.log10(B.length() / 1e-7)))));
    ph -= 0.7 * dt; beads.update(ph);
    c.out({ B: B.length(), dip, err });
    if (!eq && err < 0.05) c.done();
  };
}
export function FigDipole({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bDipole} p={p} set={set} out={setO} done={done} cam={[7, 8, 13]} target={[0, 3.6, 0]} />
    <div className="ctl">
      <Pick label="Probe on the" opts={['axis', 'equator']} value={p.where} onChange={(where) => set({ where })} />
      <Slide label="Distance x" min={1.5} max={6} step={0.05} value={p.u} onChange={(u) => set({ u })} show={(v) => v.toFixed(2) + ' R'} />
      <Readout>R = 5 cm, I = 1 A. Exact (Biot–Savart): <b>{sci(o.B)} T</b> · dipole formula (μ₀/4π){p.where ? ' m/x³' : ' 2m/x³'}: <b>{sci(o.dip)} T</b> · error <b>{((o.err ?? 0) * 100).toFixed(1)}%</b></Readout>
    </div>
  </>);
}

/* ─────────── 12 · Moving-coil galvanometer (4.10) ─────────── */
function poleGeo(sg) {
  const s = new THREE.Shape(), Rp = 1.35, xe = Math.sqrt(Rp * Rp - 1.2 * 1.2);
  if (sg < 0) { s.moveTo(-3, -1.2); s.lineTo(-xe, -1.2); s.absarc(0, 0, Rp, Math.atan2(-1.2, -xe), Math.atan2(1.2, -xe), true); s.lineTo(-3, 1.2); }
  else { s.moveTo(3, 1.2); s.lineTo(xe, 1.2); s.absarc(0, 0, Rp, Math.atan2(1.2, xe), Math.atan2(-1.2, xe), true); s.lineTo(3, -1.2); }
  const g = new THREE.ExtrudeGeometry(s, { depth: 2.6, bevelEnabled: false, curveSegments: 32 });
  g.rotateX(-Math.PI / 2); return g;
}
function bGalvo(c) {
  const { scene } = c, cy = 1.8;
  scene.add(board(11, 8));
  [-1, 1].forEach((sg) => { const m = mesh(poleGeo(sg), toon(0xece7dc), 0, 30); m.position.y = 0.5; scene.add(m); pole(sg < 0 ? 'N' : 'S', V(sg * 2.2, 3.5, 0), scene); });
  const yoke = box(6, 2.6, 0.5, 0xe6e1d5); yoke.position.set(0, 1.8, -1.6); scene.add(yoke);
  const core = cyl(0.9, 2.4, 0xcfc9bb); core.position.y = cy; scene.add(core);
  const rad = new THREE.Group(); scene.add(rad);
  for (let k = -4; k <= 4; k++) for (const sd of [0, Math.PI]) { const a = sd + k * 0.2; rad.add(lineOf([V(0.95 * Math.cos(a), cy, 0.95 * Math.sin(a)), V(1.32 * Math.cos(a), cy, 1.32 * Math.sin(a))], RED, { opacity: 0.7 })); }
  const mov = new THREE.Group(); scene.add(mov);
  const C = [V(-1.12, cy + 1.05, 0), V(1.12, cy + 1.05, 0), V(1.12, cy - 1.05, 0), V(-1.12, cy - 1.05, 0)];
  mov.add(tube([...C, C[0], C[1]], 0.11, 0xd9a066));
  const sp = cyl(0.04, 2.2, 0xdedad0); sp.position.y = cy + 1.9; mov.add(sp);
  const ptr = box(0.05, 0.05, 3.6, 0x2a2723); ptr.position.set(0, cy + 2.7, 1.8); mov.add(ptr);
  const tip = mesh(new THREE.ConeGeometry(0.06, 0.25, 8), toon(RED), 0, 0); tip.rotation.x = Math.PI / 2; tip.position.set(0, cy + 2.7, 3.65); mov.add(tip);
  const spiral = lineOf(Array.from({ length: 120 }, (_, i) => { const t = i / 119, r = 0.08 + 0.4 * t, f = t * Math.PI * 8; return V(r * Math.cos(f), cy + 2.3, r * Math.sin(f)); }), 0x8a5a2b);
  const springG = new THREE.Group(); springG.add(spiral); scene.add(springG);
  const plate = new THREE.Mesh(new THREE.RingGeometry(3.2, 4.0, 64, 1, -Math.PI / 2 - 0.95, 1.9), toon(0xfbfaf6, { side: THREE.DoubleSide }));
  plate.rotation.x = -Math.PI / 2; plate.position.y = cy + 2.62; plate.receiveShadow = true; scene.add(plate);
  for (let v = -30; v <= 30; v += 2) {
    const a = (v * 50 / 30) * D2R, L = v % 10 ? 0.15 : 0.3;
    scene.add(lineOf([V(3.25 * Math.sin(a), cy + 2.64, 3.25 * Math.cos(a)), V((3.25 + L) * Math.sin(a), cy + 2.64, (3.25 + L) * Math.cos(a))], INK));
    if (!(v % 10)) { const l = label(String(v), 'tick3'); l.position.set(3.85 * Math.sin(a), cy + 2.66, 3.85 * Math.cos(a)); scene.add(l); }
  }
  const Fs = [new Arrow(scene, BLUE, 0.05), new Arrow(scene, BLUE, 0.05)];
  callout(scene, 1, V(0, cy + 2.7, 3), V(-1.6, cy + 3.6, 3.4)); callout(scene, 2, V(1.12, cy - 0.6, 0), V(2.0, cy - 1.6, 2.2));
  callout(scene, 3, V(-0.5, cy - 1.1, 0.7), V(-1.6, 0.4, 2.6)); callout(scene, 4, V(-2.6, 2.4, 1.2), V(-3.6, 3.4, 2.2)); callout(scene, 5, V(0.4, cy + 2.3, 0), V(1.6, cy + 3.4, -0.6));
  let phi = 0, w = 0;
  return (dt, t, p) => {
    const tgt = Math.max(-30, Math.min(30, (p.N / 50) * p.I)); // φ = (NAB/k) I, pins at ±30
    w += (40 * (tgt - phi) - 7 * w) * dt; phi += w * dt;
    const ang = (phi * 50 / 30) * D2R;
    mov.rotation.y = ang; springG.rotation.y = ang * 0.6;
    const sg = Math.sign(p.I), mag = Math.min(1.4, 0.4 + Math.abs(p.I) / 40);
    [0, 1].forEach((k) => { const x = k ? 1.12 : -1.12, pos = V(x, cy, 0).applyAxisAngle(V(0, 1, 0), ang), tdir = V(0, 0, k ? -1 : 1).applyAxisAngle(V(0, 1, 0), ang); Fs[k].set(pos, tdir.multiplyScalar(sg * mag * (p.I ? 1 : 0))); });
    c.out({ phi });
    if (p.I === 10 && Math.abs(phi - 20) < 0.3 && Math.abs(w) < 0.5) c.done();
  };
}
export function FigGalvo({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bGalvo} p={p} set={set} out={setO} done={done} cam={[2.5, 12, 8.5]} target={[0, 2.2, 0.8]} />
    <div className="ctl">
      <Slide label="Current I" min={-50} max={50} step={1} value={p.I} onChange={(I) => set({ I })} show={(v) => v + ' μA'} />
      <Slide label="Turns N" min={25} max={150} step={5} value={p.N} onChange={(N) => set({ N })} show={(v) => v + ' turns'} />
      <Readout>Current sensitivity NAB/k = <b>{(p.N / 50).toFixed(1)} div/μA</b> · φ = <b>{(o.phi ?? 0).toFixed(1)} div</b>{Math.abs((p.N / 50) * p.I) > 30 ? ' — off scale!' : ''}</Readout>
    </div>
  </>);
}

/* ─────────── 13 · Ammeter and voltmeter (4.10, Example 4.12) ─────────── */
function meterBox(scene, pos, rotY = 0) {
  const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = rotY; scene.add(g);
  const b = box(1.9, 0.8, 1.3, 0xf1ede4); b.position.y = 0.4; g.add(b);
  const lab = label('', 'lcd3'); lab.position.set(0, 1.15, 0); g.add(lab);
  return { g, lab };
}
function bMeter(c) {
  const { scene } = c, Y = 0.28;
  scene.add(board(14, 10));
  const grp = new THREE.Group(); scene.add(grp);
  const bm = new Beads(scene, 300), bg = new Beads(scene, 60), bsh = new Beads(scene, 80);
  let kind = -1, parts = {}, ph = [0, 0, 0];
  const build = (k) => {
    grp.traverse((o) => { o.geometry?.dispose(); if (o.isCSS2DObject) o.element.remove(); }); grp.clear(); parts = {};
    const cl = cell(2, 0.28); cl.position.set(-0.5, 0, -3.2); grp.add(cl);
    if (k === 0) {
      const R1 = resistor(1.8); R1.rotation.y = Math.PI / 2; R1.position.set(4, Y, 0); grp.add(R1);
      parts.m = meterBox(grp, V(0, 0, 3));
      const sh = resistor(1.2, 0.14, [0x2a2723, 0x2a2723, 0xc0392b]); sh.position.set(0, Y, 4.6); grp.add(sh); parts.sh = sh;
      parts.shw = tube([V(1.6, Y, 3), V(1.6, Y, 4.6), V(-1.6, Y, 4.6), V(-1.6, Y, 3)], 0.05); grp.add(parts.shw);
      grp.add(tube([V(-1.5, Y, -3.2), V(-4, Y, -3.2), V(-4, Y, 3), V(-1, Y, 3)], 0.06), tube([V(0.5, Y, -3.2), V(4, Y, -3.2), V(4, Y, 3), V(1, Y, 3)], 0.06));
      bm.path([V(-1.6, Y, 3), V(-4, Y, 3), V(-4, Y, -3.2), V(4, Y, -3.2), V(4, Y, 3), V(1.6, Y, 3)], 0.3); bg.path([V(1.6, Y, 3), V(-1.6, Y, 3)], 0.3); bsh.path([V(1.6, Y, 3), V(1.6, Y, 4.6), V(-1.6, Y, 4.6), V(-1.6, Y, 3)], 0.3);
      const l1 = label('3 Ω', 'l3'); l1.position.set(4.6, 0.9, 0); grp.add(l1); const l2 = label('3 V', 'l3'); l2.position.set(-0.5, 1.0, -3.2); grp.add(l2);
      const l3 = label('shunt r<sub>s</sub> = 0.02 Ω', 'l3 small'); l3.position.set(0, 0.8, 5.2); grp.add(l3); parts.l3 = l3;
    } else {
      const R1 = resistor(1.8); R1.rotation.y = Math.PI / 2; R1.position.set(-4, Y, 0); grp.add(R1);
      const R2 = resistor(1.8, 0.2, [0x2d55d8, 0x2a2723, 0xd9a066]); R2.rotation.y = Math.PI / 2; R2.position.set(3, Y, 0); grp.add(R2);
      grp.add(tube([V(-1.5, Y, -3.2), V(-4, Y, -3.2), V(-4, Y, 3), V(3, Y, 3), V(3, Y, -3.2), V(0.5, Y, -3.2)], 0.06));
      parts.m = meterBox(grp, V(5.6, 0, 0.9), Math.PI / 2);
      const Rs = resistor(1.3, 0.16, [0x2a2723, 0x2a2723, 0x2a2723]); Rs.rotation.y = Math.PI / 2; Rs.position.set(5.6, Y, -1.6); grp.add(Rs);
      grp.add(tube([V(3, Y, -2.6), V(5.6, Y, -2.6), V(5.6, Y, 2.6), V(3, Y, 2.6)], 0.045));
      bm.path([V(3, Y, -3.2), V(-4, Y, -3.2), V(-4, Y, 3), V(3, Y, 3), V(3, Y, -3.2)], 0.3); bg.path([V(3, Y, -2.6), V(5.6, Y, -2.6), V(5.6, Y, 2.6), V(3, Y, 2.6)], 0.3); bsh.path([V(0, -5, 0), V(0, -5, 0.1)], 1);
      [['3 kΩ', -4.6], ['3 kΩ', 2.3]].forEach(([t, x]) => { const l = label(t, 'l3'); l.position.set(x, 0.9, 0); grp.add(l); });
      const l2 = label('3 V', 'l3'); l2.position.set(-0.5, 1.0, -3.2); grp.add(l2); const l4 = label('R (series)', 'l3 small'); l4.position.set(6.5, 0.8, -1.6); grp.add(l4);
    }
  };
  return (dt, t, p) => {
    if (p.kind !== kind) { kind = p.kind; build(kind); }
    let I, IG, Ish, txt, extra = {};
    if (kind === 0) {
      const RG = 60, rs = 0.02, Rm = p.mode === 0 ? RG : p.mode === 1 ? (RG * rs) / (RG + rs) : 0;
      I = 3 / (3 + Rm); IG = p.mode === 1 ? (I * rs) / (RG + rs) : I; Ish = p.mode === 1 ? I - IG : 0;
      bsh.pts.visible = p.mode === 1;
      parts.sh.visible = parts.shw.visible = parts.l3.visible = p.mode !== 0;
      parts.m.lab.element.innerHTML = (p.mode === 2 ? 'ideal A: ' : p.mode === 1 ? 'G + shunt: ' : 'G alone: ') + '<b>' + I.toFixed(3) + ' A</b>';
      txt = I; extra = { IG };
    } else {
      const R2 = 3000, RV = 60 + p.R * 1000, Rp = (R2 * RV) / (R2 + RV), V2 = (3 * Rp) / (3000 + Rp);
      I = 3 / (3000 + Rp); IG = V2 / RV; Ish = 0;
      parts.m.lab.element.innerHTML = 'V: <b>' + V2.toFixed(3) + ' V</b>';
      txt = V2; extra = { RV, dist: (1.5 - V2) / 1.5 }; bsh.pts.visible = false;
    }
    const sp = (x) => Math.min(3, x * (kind ? 2400 : 2.6));
    ph[0] -= sp(I) * dt; ph[1] -= sp(IG) * dt; ph[2] -= sp(Ish) * dt;
    bm.update(ph[0]); bg.update(ph[1]); bsh.update(ph[2]);
    c.out({ I, IG, txt, ...extra });
    if (kind === 1 && extra.dist < 0.01) c.done();
  };
}
export function FigMeter({ p, set, done }) {
  const [o, setO] = useState({});
  return (<>
    <Scene3D build={bMeter} p={p} set={set} out={setO} done={done} cam={[3, 11, 12]} target={[0.6, 0, 0.6]} />
    <div className="ctl">
      <Pick label="Build" opts={['ammeter', 'voltmeter']} value={p.kind} onChange={(kind) => set({ kind })} />
      {p.kind === 0
        ? <Pick label="Meter" opts={['G (60 Ω)', 'G + shunt', 'ideal']} value={p.mode} onChange={(mode) => set({ mode })} />
        : <Slide label="Series R" min={0} max={500} step={5} value={p.R} onChange={(R) => set({ R })} show={(v) => v + ' kΩ'} />}
      <Readout>{p.kind === 0
        ? <>Example 4.12: circuit current <b>{(o.I ?? 0).toFixed(3)} A</b> · through the meter’s coil {p.mode === 2 ? '— (ideal meter, 0 Ω)' : <>{sci(o.IG)} A</>}</>
        : <>True voltage across 3 kΩ: 1.500 V · meter (R<sub>V</sub> = {((o.RV ?? 0) / 1000).toFixed(2)} kΩ) reads <b>{(o.txt ?? 0).toFixed(3)} V</b> · disturbance <b>{((o.dist ?? 0) * 100).toFixed(1)}%</b></>}</Readout>
    </div>
  </>);
}
