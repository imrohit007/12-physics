'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export { THREE };
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const INK = 0x2a2723, RED = 0xc0392b, BLUE = 0x2d55d8, PAPER = 0xf7f4ec;
export const MU0 = 4 * Math.PI * 1e-7;

/* ── materials ── */
let grad;
const gradient = () => {
  if (grad) return grad;
  grad = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1);
  grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
  return grad;
};
export const toon = (color = PAPER, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: gradient(), ...o });
let hatchT;
export const hatch = () => {
  if (hatchT) return hatchT;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#ece7dc'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(42,39,35,.55)'; g.lineWidth = 1.4;
  for (let i = -64; i < 128; i += 9) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); }
  hatchT = new THREE.CanvasTexture(c); hatchT.wrapS = hatchT.wrapT = THREE.RepeatWrapping; hatchT.colorSpace = THREE.SRGBColorSpace;
  return hatchT;
};
const hullMat = (t) => new THREE.ShaderMaterial({
  uniforms: { t: { value: t } },
  vertexShader: 'uniform float t; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * t, 1.0); }',
  fragmentShader: 'void main(){ gl_FragColor = vec4(0.165,0.153,0.137,1.0); }',
  side: THREE.BackSide,
});
// ink outline: hull for smooth meshes, crease edges for boxy ones
export function ink(mesh, t = 0.025, crease = 35) {
  if (t) mesh.add(new THREE.Mesh(mesh.geometry, hullMat(t)));
  if (crease) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, crease), new THREE.LineBasicMaterial({ color: INK })));
  mesh.castShadow = true;
  return mesh;
}
export const mesh = (geo, mat = toon(), inkT = 0.025, crease = 35) => ink(new THREE.Mesh(geo, mat), inkT, crease);
export const box = (w, h, d, c = PAPER) => mesh(new THREE.BoxGeometry(w, h, d), toon(c), 0, 20);
export const cyl = (r, h, c = PAPER, seg = 32, r2 = r) => mesh(new THREE.CylinderGeometry(r2, r, h, seg), toon(c), 0.02, 40);

export function board(w, d, h = 0.35) {
  const side = new THREE.MeshLambertMaterial({ map: hatch() });
  const top = toon(0xfbfaf6);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, side, side, side]);
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: INK })));
  m.position.y = -h / 2; m.receiveShadow = true;
  return m;
}

/* ── curves ── */
export function polyCurve(pts) {
  const c = new THREE.CurvePath();
  for (let i = 1; i < pts.length; i++) c.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
  return c;
}
export function tube(pts, r = 0.07, c = 0xfdfcf8, smooth = false) {
  const curve = smooth ? new THREE.CatmullRomCurve3(pts) : polyCurve(pts);
  const seg = Math.min(1200, Math.max(16, pts.length * (smooth ? 4 : 2)));
  return mesh(new THREE.TubeGeometry(curve, seg, r, 10, false), toon(c), 0.018, 0);
}
// arc-length sampler over a polyline of Vector3
export function track(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const L = cum[cum.length - 1] || 1;
  const at = (s, out = V()) => {
    s = ((s % L) + L) % L;
    let lo = 1, hi = cum.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < s) lo = m + 1; else hi = m; }
    const f = (s - cum[lo - 1]) / (cum[lo] - cum[lo - 1] || 1);
    return out.lerpVectors(pts[lo - 1], pts[lo], f);
  };
  return { L, at };
}

/* ── glowing electron beads ── */
let dotT;
const dotTex = () => {
  if (dotT) return dotT;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(190,210,255,1)'); r.addColorStop(0.18, 'rgba(40,90,255,1)'); r.addColorStop(0.42, 'rgba(30,75,250,.85)'); r.addColorStop(0.7, 'rgba(40,90,255,.25)'); r.addColorStop(1, 'rgba(40,80,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (dotT = new THREE.CanvasTexture(c));
};
export class Beads {
  constructor(scene, max = 400, size = 0.5, color = 0xffffff) {
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({ map: dotTex(), size, color, transparent: true, depthWrite: false });
    // nudge each bead toward the camera so it shows in front of its own wire but still hides behind other objects
    mat.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', 'vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 ); mvPosition.xyz += normalize( -mvPosition.xyz ) * 0.2; gl_Position = projectionMatrix * mvPosition;'); };
    this.pts = new THREE.Points(this.geo, mat);
    this.pts.frustumCulled = false; this.pts.renderOrder = 10; this.max = max; scene.add(this.pts);
  }
  path(pts, gap = 0.3) { this.t = track(pts); this.n = Math.min(this.max, Math.max(1, Math.round(this.t.L / gap))); this.geo.setDrawRange(0, this.n); return this; }
  update(phase) {
    if (!this.t) return;
    const g = this.t.L / this.n, v = V();
    // beads below the board top are parked out of sight
    for (let k = 0; k < this.n; k++) { this.t.at(k * g + phase, v); if (v.y < -0.05) v.set(0, -999, 0); this.pos.set([v.x, v.y, v.z], k * 3); }
    this.geo.attributes.position.needsUpdate = true;
  }
}

/* ── arrows and labels ── */
export function label(text, cls = 'l3') {
  const d = document.createElement('div'); d.className = cls; d.innerHTML = text;
  return new CSS2DObject(d);
}
export class Arrow {
  constructor(scene, color = RED, r = 0.05, text) {
    const m = toon(color, { emissive: color, emissiveIntensity: 0.25 });
    this.g = new THREE.Group();
    this.shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 12), m); this.shaft.position.y = 0.5;
    this.head = new THREE.Mesh(new THREE.ConeGeometry(r * 3, r * 7, 16), m);
    this.g.add(this.shaft, this.head);
    if (text) { this.lab = label(text, 'vec3'); this.g.add(this.lab); this.lab.element.style.color = '#' + new THREE.Color(color).getHexString(); }
    scene.add(this.g);
  }
  set(from, vec) {
    const L = vec.length();
    this.g.visible = L > 0.05;
    if (!this.g.visible) return;
    const hl = Math.min(this.head.geometry.parameters.height, L * 0.45);
    this.g.position.copy(from);
    this.g.quaternion.setFromUnitVectors(V(0, 1, 0), vec.clone().normalize());
    this.shaft.scale.y = L - hl; this.shaft.position.y = (L - hl) / 2;
    this.head.scale.setScalar(hl / this.head.geometry.parameters.height); this.head.position.y = L - hl / 2;
    if (this.lab) this.lab.position.set(0, L + 0.25, 0);
  }
}
// numbered callout: leader line from anchor to label point
export function callout(scene, n, anchor, at) {
  const g = new THREE.BufferGeometry().setFromPoints([anchor, at]);
  const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: INK }));
  const l = label(String(n), 'num3'); l.position.copy(at);
  scene.add(line, l);
  return { move(a, b) { g.setFromPoints([a, b]); l.position.copy(b); } };
}
export function lineOf(pts, color = INK, o = {}) {
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = o.dash ? new THREE.LineDashedMaterial({ color, dashSize: o.dash, gapSize: o.dash * 0.7, transparent: true, opacity: o.opacity ?? 1 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity: o.opacity ?? 1 });
  const l = new THREE.Line(geo, mat);
  if (o.dash) l.computeLineDistances();
  return l;
}

/* ── Biot–Savart ── */
// segs: flat Float32Array [ax,ay,az,bx,by,bz,...]; returns B (unit current, μ0/4π = 1) at p
export function bs(segs, p, out = V()) {
  let bx = 0, by = 0, bz = 0;
  for (let i = 0; i < segs.length; i += 6) {
    const dx = segs[i + 3] - segs[i], dy = segs[i + 4] - segs[i + 1], dz = segs[i + 5] - segs[i + 2];
    const rx = p.x - (segs[i] + dx / 2), ry = p.y - (segs[i + 1] + dy / 2), rz = p.z - (segs[i + 2] + dz / 2);
    const r2 = rx * rx + ry * ry + rz * rz + 1e-6, k = 1 / (r2 * Math.sqrt(r2));
    bx += (dy * rz - dz * ry) * k; by += (dz * rx - dx * rz) * k; bz += (dx * ry - dy * rx) * k;
  }
  return out.set(bx, by, bz);
}
export function segsOf(pts) {
  const s = new Float32Array((pts.length - 1) * 6);
  for (let i = 1; i < pts.length; i++) s.set([pts[i - 1].x, pts[i - 1].y, pts[i - 1].z, pts[i].x, pts[i].y, pts[i].z], (i - 1) * 6);
  return s;
}
// trace a field line both ways from seed; stops at bounds, near wires, or when it closes
export function traceLine(segs, seed, { h = 0.06, steps = 900, inside = () => true, wireDist = 0.12, wires = [] } = {}) {
  const run = (sgn) => {
    const out = [], p = seed.clone(), b = V(), m = V();
    for (let i = 0; i < steps; i++) {
      bs(segs, p, b).normalize().multiplyScalar(sgn * h);
      m.copy(p).addScaledVector(b, 0.5);
      bs(segs, m, b).normalize().multiplyScalar(sgn * h);
      p.add(b);
      if (!inside(p) || wires.some((w) => w(p) < wireDist)) break;
      out.push(p.clone());
      if (i > 40 && p.distanceTo(seed) < h * 1.2) { out.push(seed.clone()); return { pts: out, closed: true }; }
    }
    return { pts: out, closed: false };
  };
  const f = run(1);
  if (f.closed) return [seed.clone(), ...f.pts];
  return [...run(-1).pts.reverse(), seed.clone(), ...f.pts];
}
export function fieldLines(group, lines, color = RED, opacity = 0.75, arrowsEvery = 2.2) {
  group.clear();
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const cone = new THREE.ConeGeometry(0.07, 0.22, 10), cm = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  for (const [pts, dirSign = 1] of lines) {
    if (pts.length < 2) continue;
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    const t = track(pts);
    for (let s = arrowsEvery / 2; s < t.L; s += arrowsEvery) {
      const a = t.at(s), b = t.at(s + 0.05 * dirSign), c = new THREE.Mesh(cone, cm);
      c.position.copy(a); c.quaternion.setFromUnitVectors(V(0, 1, 0), b.sub(a).normalize()); group.add(c);
    }
  }
}

/* ── small parts ── */
export function compass(r = 0.38) {
  const g = new THREE.Group();
  const body = cyl(r, 0.12, 0xfdfcf8, 32); body.position.y = 0.06; g.add(body);
  const needle = new THREE.Group();
  const nmat = toon(RED), smat = toon(0x3a3633);
  const n = new THREE.Mesh(new THREE.ConeGeometry(0.06, r * 0.85, 4), nmat); n.rotation.z = -Math.PI / 2; n.position.x = r * 0.42; n.scale.z = 0.4;
  const s = new THREE.Mesh(new THREE.ConeGeometry(0.06, r * 0.85, 4), smat); s.rotation.z = Math.PI / 2; s.position.x = -r * 0.42; s.scale.z = 0.4;
  needle.add(n, s); needle.position.y = 0.15; g.add(needle);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.03), toon(0xffffff)); pin.position.y = 0.17; g.add(pin);
  g.needle = needle; g.ang = 0; g.w = 0;
  // point needle along horizontal vector (bx, bz) with a damped spring
  g.aim = (bx, bz, dt) => {
    const tgt = Math.atan2(-bz, bx), d = Math.atan2(Math.sin(tgt - g.ang), Math.cos(tgt - g.ang));
    g.w += (d * 40 - g.w * 6) * dt; g.ang += g.w * dt; needle.rotation.y = g.ang;
    return Math.abs(d);
  };
  return g;
}
// cylinder cell lying along x; + terminal at +x end (flip puts it at −x). Axis height = r.
export function cell(len = 2.2, r = 0.32) {
  const g = new THREE.Group(), k = new THREE.Group(); k.position.y = r; g.add(k);
  const b = cyl(r, len, 0xf4f2ed); b.rotation.z = Math.PI / 2; k.add(b);
  const band = cyl(r * 1.02, len * 0.35, 0xd8d2c4); band.rotation.z = Math.PI / 2; band.position.x = -len * 0.3; k.add(band);
  const nub = cyl(r * 0.3, 0.14, 0xdcd6c8); nub.rotation.z = Math.PI / 2; nub.position.x = len / 2 + 0.07; k.add(nub);
  const plus = label('+', 'sign3'), minus = label('−', 'sign3');
  plus.position.set(len / 2 - 0.25, r + 0.2, 0); minus.position.set(-len / 2 + 0.25, r + 0.2, 0);
  k.add(plus, minus);
  g.flip = (f) => { k.rotation.y = f ? Math.PI : 0; };
  return g;
}
export function resistor(len = 1.6, r = 0.2, bands = [0xc0392b, 0x2a2723, 0xd9a066]) {
  const g = new THREE.Group();
  const b = cyl(r, len, 0xe9dcc0); b.rotation.z = Math.PI / 2; g.add(b);
  bands.forEach((col, i) => { const s = cyl(r * 1.04, 0.1, col); s.rotation.z = Math.PI / 2; s.position.x = -len * 0.25 + i * 0.22; g.add(s); });
  return g;
}
export function ringPts(C, R, plane = 'yz', n = 96, sense = 1) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (sense * i / n) * Math.PI * 2, c = Math.cos(a) * R, s = Math.sin(a) * R;
    return plane === 'yz' ? V(C.x, C.y + c, C.z + s) : plane === 'xz' ? V(C.x + c, C.y, C.z - s) : V(C.x + c, C.y + s, C.z);
  });
}
export function knife() {
  const g = new THREE.Group();
  const base = box(1.6, 0.14, 0.5, 0xf1ede4); base.position.y = 0.07; g.add(base);
  [-0.6, 0.6].forEach((x) => { const p = box(0.14, 0.3, 0.14, 0xe2ddd0); p.position.set(x, 0.29, 0); g.add(p); });
  const blade = new THREE.Group(); blade.position.set(-0.6, 0.4, 0);
  const b = box(1.25, 0.06, 0.12, 0xddd6c6); b.position.x = 0.62; blade.add(b);
  const h = cyl(0.06, 0.32, 0xfbfaf6); h.position.set(1.2, 0.16, 0); blade.add(h);
  g.add(blade); g.blade = blade;
  g.set = (on, dt = 1) => { blade.rotation.z += ((on ? 0 : 0.7) - blade.rotation.z) * Math.min(1, dt * 12); };
  return g;
}

/* ── React host ── */
export function Scene3D({ build, p, set, out, done, cam = [7, 6, 10], target = [0, 1, 0], h = 520, minD = 6, maxD = 40 }) {
  const box3 = useRef(null), pRef = useRef(p), cb = useRef({});
  pRef.current = p; cb.current = { out, done, set };
  useEffect(() => {
    const el = box3.current;
    let W = el.clientWidth || 600, H = el.clientHeight || h;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const css = new CSS2DRenderer(); css.setSize(W, H); css.domElement.className = 'labels3'; el.appendChild(css.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 300);
    camera.position.set(...cam).sub(V(...target)).multiplyScalar(1.3).add(V(...target));
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...target); controls.enableDamping = true; controls.enablePan = false; controls.enableZoom = false;
    controls.minDistance = minD; controls.maxDistance = maxD; controls.maxPolarAngle = Math.PI * 0.495;
    controls.update();

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cbb0, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(-6, 14, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); sun.shadow.bias = -0.0005;
    scene.add(sun);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.36; floor.receiveShadow = true; scene.add(floor);

    const picks = [];
    let last = 0;
    const ctx = {
      scene, camera, el,
      get p() { return pRef.current; },
      out: (o) => { const now = performance.now(); if (now - last > 120) { last = now; cb.current.out?.(o); } },
      done: () => cb.current.done?.(),
      set: (patch) => cb.current.set?.(patch),
      pick: (obj, fn) => { picks.push([obj, fn]); },
    };
    const update = build(ctx) || (() => {});

    // click (not drag) on a pickable part
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let down = null;
    const hit = (e) => {
      ndc.set((e.offsetX / renderer.domElement.clientWidth) * 2 - 1, -(e.offsetY / renderer.domElement.clientHeight) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      for (const [obj, fn] of picks) if (ray.intersectObject(obj, true).length) return fn;
      return null;
    };
    const pd = (e) => { down = [e.clientX, e.clientY]; };
    const pu = (e) => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) hit(e)?.(); down = null; };
    const pm = (e) => { if (!down) renderer.domElement.style.cursor = hit(e) ? 'pointer' : 'grab'; };
    renderer.domElement.addEventListener('pointerdown', pd);
    renderer.domElement.addEventListener('pointerup', pu);
    renderer.domElement.addEventListener('pointermove', pm);

    let visible = true;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(el);
    const ro = new ResizeObserver(() => {
      W = el.clientWidth; H = el.clientHeight; if (!W || !H) return;
      renderer.setSize(W, H); css.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix();
    });
    ro.observe(el);

    el.__snap = () => { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); };
    let raf, prev = performance.now(), t = 0;
    // test hook: advance the simulation n frames even when rAF is paused (hidden tab)
    el.__step = (n = 60) => { for (let k = 0; k < n; k++) { t += 1 / 60; update(1 / 60, t, pRef.current); } controls.update(); renderer.render(scene, camera); css.render(scene, camera); };
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      if (!visible) return;
      t += dt;
      update(dt, t, pRef.current);
      controls.update();
      renderer.render(scene, camera); css.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); controls.dispose();
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose()); });
      renderer.dispose(); renderer.forceContextLoss(); el.innerHTML = '';
    };
  }, []);
  return <div className="scene3" ref={box3} style={{ height: h }} />;
}
