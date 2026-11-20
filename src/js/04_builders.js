/* Reusable builders for the city: ground quads, buildings with facades, props, trees, lanterns. */

const S = new ChunkedBatch(40);   // lit solid geometry
const LB = new ChunkedBatch(40);  // emissive (unlit) geometry: lanterns, bulbs, neon tubes
const WN = new ChunkedBatch(60);  // night-lit windows (additive, fade in at dusk)
const A = {};                     // named anchors (positions) used by NPCs and commands
const Inter = {                   // interactable things
  list: [],
  add(o) { const it = Object.assign({ r: 2.3, area: 'surface', on: true, y: 1.0, angle: 40 }, o); this.list.push(it); return it; },
  get(id) { return this.list.find((i) => i.id === id); },
};

/* ---- textured ground quads, batched per material ---- */
const GroundB = {};
function groundQuad(mat, x0, z0, x1, z1, y = 0, tile = 2, area) {
  const b = GroundB[mat] || (GroundB[mat] = { pos: [], uv: [] });
  const P = [[x0, z1], [x1, z1], [x1, z0], [x0, z1], [x1, z0], [x0, z0]];
  for (const [x, z] of P) { b.pos.push(x, y, z); b.uv.push(x / tile, -z / tile); }
}
function buildGround() {
  for (const k of Object.keys(GroundB)) {
    const b = GroundB[k];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    const n = new Float32Array(b.pos.length); for (let i = 1; i < n.length; i += 3) n[i] = 1;
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, G.ground[k]); m.receiveShadow = true; m.matrixAutoUpdate = false;
    G.scene.add(m);
  }
}

/* ---- faces: helper to place things on a building side ---- */
function faceFrame(f, x0, z0, x1, z1) {
  switch (f) {
    case 'n': return { f, len: x1 - x0, at: (u, out) => [x0 + u, z0 - out], ry: Math.PI, alongX: true };
    case 's': return { f, len: x1 - x0, at: (u, out) => [x1 - u, z1 + out], ry: 0, alongX: true };
    case 'w': return { f, len: z1 - z0, at: (u, out) => [x0 - out, z1 - u], ry: -Math.PI / 2, alongX: false };
    default: return { f, len: z1 - z0, at: (u, out) => [x1 + out, z0 + u], ry: Math.PI / 2, alongX: false };
  }
}
function fbox(B, F, u, y, a, h, t, out, color, o) {
  const [x, z] = F.at(u, out);
  if (F.alongX) B.box(x, y, z, a, h, t, color, o); else B.box(x, y, z, t, h, a, color, o);
}
function fsign(F, u, y, w, h, tex, o = {}) { const [x, z] = F.at(u, o.out || 0.09); return makeSign(x, y, z, w, h, F.ry, tex, o); }
const LIT = ['#ffcf8a', '#ffd9a0', '#ffe6bd', '#cfe3ff', '#ffc070', '#a8c4ff', '#ffb6a0'];

/* ---- buildings ---- */
function bldg(x0, z0, x1, z1, h, o = {}) {
  const color = o.color || spick(PAL.concrete);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
  S.box(cx, 0, cz, w, h, d, color, { aoMin: 0.72 });
  if (o.collide !== false) Col.add(x0, z0, x1, z1);
  S.box(cx, h, cz, w + 0.25, 0.3, d + 0.25, new THREE.Color(color).multiplyScalar(0.82));
  if (o.roof !== false && h > 7) {
    if (SR() < 0.6) { S.cyl(cx + sr(-w / 4, w / 4), h + 0.3, cz + sr(-d / 4, d / 4), 1.1, 2.2, '#9aa0a6'); S.cone(cx + sr(-w / 4, w / 4), h + 2.5, cz, 1.2, 0.6, '#7d8288'); }
    if (SR() < 0.5) S.box(cx + sr(-w / 3, w / 3), h + 0.3, cz + sr(-d / 3, d / 3), 2.5, 2, 2, '#b6b0a6');
    if (SR() < 0.4) S.box(cx + sr(-w / 3, w / 3), h + 0.3, cz + sr(-d / 3, d / 3), 0.08, 4, 0.08, '#444');
    if (h > 20 && SR() < 0.5) { const ax = cx + sr(-w / 4, w / 4), az = cz + sr(-d / 4, d / 4); S.box(ax, h + 0.3, az, 0.1, 6, 0.1, '#555'); LB.box(ax, h + 6.3, az, 0.25, 0.25, 0.25, '#ff2a2a'); halo(ax, h + 6.4, az, '#ff3030', 'M'); }
  }
  for (const f of (o.faces || [])) facade(faceFrame(f, x0, z0, x1, z1), h, color, o, f);
}
function facade(F, h, color, o, fname) {
  const shop = o.shop && o.shop.face === fname ? o.shop : null;
  const resi = o.style === 'resi';
  const startY = o.startY || (shop ? 4.6 : 1.1), floorH = o.floorH || 3.0;
  const span = F.len, cols = Math.max(1, Math.floor((span - 1.2) / (o.winGap || 2.7)));
  const gap = span / cols;
  const glassC = o.glass || PAL.glass;
  for (let y = startY; y + 1.7 < h - 0.4; y += floorH) {
    for (let c = 0; c < cols; c++) {
      const u = gap * (c + 0.5);
      if (o.skipU && o.skipU(u, y)) continue;
      const ww = Math.min(1.4, gap * 0.6);
      fbox(S, F, u, y, ww + 0.2, 1.8, 0.12, 0.02, new THREE.Color(color).multiplyScalar(0.75));
      fbox(S, F, u, y + 0.1, ww, 1.6, 0.1, 0.07, glassC);
      if (SR() < (o.litP || 0.5)) fbox(WN, F, u, y + 0.12, ww * 0.94, 1.55, 0.04, 0.13, spick(LIT));
      if (resi && SR() < 0.55) { // balcony with laundry
        fbox(S, F, u, y - 0.1, ww + 0.9, 0.15, 1.0, 0.55, '#bcb6ab');
        fbox(S, F, u, y - 0.1, ww + 0.9, 0.95, 0.05, 1.05, spick(['#d8d4cc', '#c9c4ba', '#b9c4c9', '#d6cbb8']));
        if (SR() < 0.6) for (let k = 0; k < 3; k++) fbox(S, F, u - 0.5 + k * 0.5, y + 0.9, 0.38, 0.55, 0.03, 0.9, spick(PAL.shirt), { ao: false });
        if (SR() < 0.4) { const [px, pz] = F.at(u + 0.5, 0.8); S.ball(px, y + 0.35, pz, 0.25, spick(PAL.leaf)); }
      } else if (SR() < 0.22) { // AC unit
        fbox(S, F, u + ww / 2 + 0.55, y + 0.2, 0.75, 0.55, 0.35, 0.2, '#e8e6e0');
      }
    }
  }
  if (shop) shopFront(F, h, shop);
  if (o.trim) fbox(S, F, span / 2, (shop ? 4.2 : 3.2), span, 0.25, 0.15, 0.08, o.trim);
}
function shopFront(F, h, s) {
  const span = F.len, u0 = s.u0 || 0.4, u1 = s.u1 || span - 0.4, mid = (u0 + u1) / 2, w = u1 - u0;
  fbox(S, F, mid, 0, w, 0.35, 0.2, 0.08, '#55534f');
  fbox(S, F, mid, 0.35, w - 0.2, 2.5, 0.06, 0.05, s.glass || '#24323d');
  fbox(WN, F, mid, 0.4, w - 0.4, 2.4, 0.03, 0.1, s.lit || '#ffdca0');
  if (s.awning) { const [x, z] = F.at(mid, 0.8); if (F.alongX) S.box(x, 2.95, z, w, 0.12, 1.6, s.awning, { rx: F.f === 'n' ? -0.25 : 0.25, ao: false }); else S.box(x, 2.95, z, 1.6, 0.12, w, s.awning, { rz: F.f === 'e' ? -0.25 : 0.25, ao: false }); }
  if (s.cn) {
    const tex = signTexture({ cn: s.cn, en: s.en, style: s.neon ? 'neon' : (s.style || 'plain'), bg: s.bg, fg: s.fg, fg2: s.fg2, w: 512, h: 160, border: s.border });
    fsign(F, mid, 3.75, Math.min(w, 7), Math.min(w, 7) * 160 / 512, tex, { neon: !!s.neon, color: s.fg, out: 0.12 });
    if (!s.neon) halo(...(() => { const [x, z] = F.at(mid, 0.4); return [x, 3.75, z]; })(), s.fg || '#ffd76a', 'M');
  }
  if (s.vertical) {
    const v = s.vertical;
    const tex = signTexture({ cn: v.cn, en: v.en, vertical: true, style: 'neon', fg: v.color, w: 128, h: 512 });
    const [x, z] = F.at(v.u !== undefined ? v.u : 0.6, 0.7);
    const sg = makeSign(x, v.y || 8, z, 1.1, 4.4, F.ry + (F.alongX ? Math.PI / 2 : Math.PI / 2), tex, { neon: true, color: v.color, double: true });
    S.box(x, (v.y || 8) - 2.3, z, 0.18, 4.6, 0.18, '#333');
    return sg;
  }
}

/* ---- props ---- */
function propMesh(build, x, z, ry, o = {}) {
  const b = new Batch(); build(b);
  const m = b.build(G.mat.solid);
  m.position.set(x, o.y || 0, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true;
  G.scene.add(m);
  if (o.movable !== false) G.props.push({ mesh: m, home: new THREE.Vector3(x, o.y || 0, z), ry, kind: o.kind || 'prop' });
  if (o.col) m.userData.col = Col.box(x, z, o.col[0], o.col[1]);
  return m;
}
function bike(x, z, ry, color) {
  return propMesh((b) => {
    for (const s of [-0.52, 0.52]) b.prim(GEO.torus, s, 0.36, 0, 0.72, 0.72, 0.72, '#1d1d1d', { center: true });
    b.box(0, 0.4, 0, 1.0, 0.07, 0.07, color, { rz: 0.35 }); b.box(-0.1, 0.55, 0, 0.9, 0.07, 0.07, color, { rz: -0.2 });
    b.box(-0.25, 0.36, 0, 0.07, 0.55, 0.07, color, { rz: 0.25 }); b.box(-0.3, 0.88, 0, 0.32, 0.08, 0.16, '#222');
    b.box(0.45, 0.4, 0, 0.06, 0.7, 0.06, '#333', { rz: -0.2 }); b.box(0.55, 1.0, 0, 0.06, 0.06, 0.55, '#333');
    b.box(0.68, 0.72, 0, 0.32, 0.22, 0.34, color === '#f2c230' ? '#333' : '#aaa');
  }, x, z, ry, { kind: 'bike' });
}
function eScooter(x, z, ry, color) {
  return propMesh((b) => {
    for (const s of [-0.6, 0.6]) b.cyl(s, 0, 0, 0.24, 0.12, '#1d1d1d', { rx: Math.PI / 2, center: true, seg: 12 });
    b.box(0, 0.15, 0, 1.25, 0.25, 0.32, color); b.box(-0.25, 0.42, 0, 0.75, 0.3, 0.36, color);
    b.box(-0.25, 0.75, 0, 0.7, 0.1, 0.3, '#222'); b.box(0.55, 0.3, 0, 0.18, 0.75, 0.38, color, { rz: -0.25 });
    b.box(0.65, 1.05, 0, 0.08, 0.08, 0.62, '#222'); b.box(0.72, 0.85, 0, 0.1, 0.16, 0.16, '#ffe9b0');
  }, x, z, ry, { kind: 'scooter' });
}
function trashBins(x, z, ry) {
  return propMesh((b) => {
    b.box(-0.33, 0, 0, 0.55, 0.95, 0.5, '#2f6db5'); b.box(0.33, 0, 0, 0.55, 0.95, 0.5, '#6b6f73');
    b.box(-0.33, 0.95, 0, 0.6, 0.08, 0.55, '#24558e'); b.box(0.33, 0.95, 0, 0.6, 0.08, 0.55, '#55595d');
  }, x, z, ry, { kind: 'bins', col: [1.3, 0.6] });
}
function pot(x, z, s = 1, flower) {
  return propMesh((b) => {
    b.cyl(0, 0, 0, 0.32 * s, 0.5 * s, '#8a4b2e'); b.ball(0, 0.65 * s, 0, 0.42 * s, spick(PAL.leaf));
    if (flower) for (let i = 0; i < 4; i++) b.ball(sr(-0.25, 0.25) * s, 0.85 * s, sr(-0.25, 0.25) * s, 0.09 * s, flower);
  }, x, z, 0, { kind: 'pot' });
}
function crate(x, z, ry, color = '#c79b5b') { return propMesh((b) => { b.box(0, 0, 0, 0.6, 0.4, 0.45, color); b.box(0, 0.4, 0, 0.55, 0.36, 0.42, color); }, x, z, ry, { kind: 'crate' }); }
function bench(x, z, ry, color = '#8a5a35') {
  S.box(x, 0.42, z, ry ? 0.5 : 1.8, 0.07, ry ? 1.8 : 0.5, color);
  if (ry) { S.box(x + 0.24, 0.5, z, 0.06, 0.45, 1.8, color); for (const s of [-0.75, 0.75]) S.box(x, 0, z + s, 0.45, 0.42, 0.08, '#444'); }
  else { S.box(x, 0.5, z + 0.24, 1.8, 0.45, 0.06, color); for (const s of [-0.75, 0.75]) S.box(x + s, 0, z, 0.08, 0.42, 0.45, '#444'); }
  Col.box(x, z, ry ? 0.6 : 1.8, ry ? 1.8 : 0.6);
}
function streetLamp(x, z, side) { // side: +1 arm points +z, -1 arm points -z
  S.cyl(x, 0, z, 0.09, 6.2, '#3d4147'); S.box(x, 6.0, z + side * 0.6, 0.1, 0.1, 1.3, '#3d4147');
  LB.box(x, 5.85, z + side * 1.1, 0.45, 0.14, 0.3, '#ffe2a8'); halo(x, 5.75, z + side * 1.1, '#ffcf8a', 'L');
  streak(x, z + side * 1.1, '#ffcf8a', 0.9, 6, Math.abs(z + side * 1.1) < 4.5 ? -0.1 : 0.02);
  Col.box(x, z, 0.3, 0.3);
}
function lantern(x, y, z, r = 0.32, color = PAL.lantern, haloCls = 'M') {
  LB.lantern(x, y, z, r, color);
  S.cyl(x, y + r * 0.8, z, r * 0.45, r * 0.25, '#d9a83a'); S.cyl(x, y - r * 1.05, z, r * 0.45, r * 0.25, '#d9a83a');
  LB.box(x, y - r * 1.6, z, 0.04, r * 0.7, 0.04, '#ffcc44');
  S.box(x, y + r, z, 0.02, 0.5, 0.02, '#222');
  halo(x, y, z, color === PAL.lantern ? '#ff6a3a' : color, haloCls);
}
function stringLights(x0, y0, z0, x1, y1, z1, n, colors, sag = 0.6) {
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t), y = lerp(y0, y1, t) - Math.sin(t * Math.PI) * sag;
    const c = Array.isArray(colors) ? colors[i % colors.length] : colors;
    LB.ball(x, y, z, 0.07, c); if (i % 2 === 0) halo(x, y, z, c, 'S');
    if (i < n) { const t2 = (i + 1) / n, x2 = lerp(x0, x1, t2), z2 = lerp(z0, z1, t2), y2 = lerp(y0, y1, t2) - Math.sin(t2 * Math.PI) * sag; const L = Math.hypot(x2 - x, y2 - y, z2 - z); const B = S.at(x, z); _wire(B, x, y, z, x2, y2, z2, L); }
  }
}
function lanternString(x0, y0, z0, x1, y1, z1, n, sag = 0.5, r = 0.26) {
  for (let i = 1; i < n; i++) {
    const t = i / n; lantern(lerp(x0, x1, t), lerp(y0, y1, t) - Math.sin(t * Math.PI) * sag - 0.35, lerp(z0, z1, t), r);
  }
  const B = S.at(x0, z0); _wire(B, x0, y0, z0, x1, y1, z1, Math.hypot(x1 - x0, y1 - y0, z1 - z0));
}
function _wire(B, x0, y0, z0, x1, y1, z1, L) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, mz = (z0 + z1) / 2;
  const ry = Math.atan2(-(z1 - z0), x1 - x0);
  const rz = Math.atan2(y1 - y0, Math.hypot(x1 - x0, z1 - z0));
  _eu.set(0, ry, rz, 'YXZ'); _q.setFromEuler(_eu);
  _m4.compose(_pv.set(mx, my, mz), _q, _sv.set(L, 0.025, 0.025));
  B.addGeo(GEO.box, _m4, '#202020', { ao: false });
}
function wire(x0, y0, z0, x1, y1, z1) { _wire(S.at(x0, z0), x0, y0, z0, x1, y1, z1, Math.hypot(x1 - x0, y1 - y0, z1 - z0)); }
function tree(x, z, kind = 'leaf', s = 1, o = {}) {
  const trunkC = kind === 'pine' ? '#5a4030' : '#6b4f3a';
  const th = (kind === 'willow' ? 2.6 : 2.2) * s;
  S.cyl(x, 0, z, 0.16 * s, th, trunkC, { seg: 6 });
  const pal = kind === 'ginkgo' ? PAL.ginkgo : kind === 'maple' ? PAL.maple : kind === 'persimmon' ? ['#7a8a3a', '#8a7a35'] : PAL.leaf;
  if (kind === 'pine') { for (let i = 0; i < 3; i++) S.cone(x, th + i * 1.1 * s - 0.5, z, (1.6 - i * 0.4) * s, 1.8 * s, '#2f5a35'); }
  else if (kind === 'willow') {
    S.ball(x, th + 1.0 * s, z, 1.7 * s, '#7fa54a', { sy: 0.8 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; S.box(x + Math.cos(a) * 1.3 * s, th - 1.2 * s, z + Math.sin(a) * 1.3 * s, 0.25, 2.4 * s, 0.25, '#8db556', { ao: false }); }
  } else {
    for (let i = 0; i < 3; i++) S.ball(x + sr(-0.6, 0.6) * s, th + (0.8 + i * 0.45) * s, z + sr(-0.6, 0.6) * s, (1.25 - i * 0.18) * s, spick(pal));
    if (kind === 'persimmon') for (let i = 0; i < 14; i++) LB.ball(x + sr(-1.2, 1.2) * s, th + sr(0.5, 2) * s, z + sr(-1.2, 1.2) * s, 0.1, '#ff8a1e');
  }
  if (o.col !== false) Col.box(x, z, 0.45 * s, 0.45 * s);
  if (o.planter) { S.box(x, 0, z, 1.3, 0.45, 1.3, '#9a958c'); Col.box(x, z, 1.3, 1.3); }
}
function lowWall(x0, z0, x1, z1, h, color, o = {}) { S.box((x0 + x1) / 2, 0, (z0 + z1) / 2, Math.abs(x1 - x0) || 0.3, h, Math.abs(z1 - z0) || 0.3, color, o); if (o.collide !== false) Col.add(Math.min(x0, x1) - (x0 === x1 ? 0.15 : 0), Math.min(z0, z1) - (z0 === z1 ? 0.15 : 0), Math.max(x0, x1) + (x0 === x1 ? 0.15 : 0), Math.max(z0, z1) + (z0 === z1 ? 0.15 : 0)); }
function table(x, z, w = 1.2, d = 0.8, color = '#8b5e3c', h = 0.76) {
  S.box(x, h - 0.05, z, w, 0.06, d, color);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.box(x + sx * (w / 2 - 0.08), 0, z + sz * (d / 2 - 0.08), 0.06, h - 0.05, 0.06, '#3a2a1c');
  Col.box(x, z, w, d);
}
function stool(x, z, color = '#c0392b') { S.cyl(x, 0, z, 0.18, 0.45, color, { seg: 8 }); }
// Gable-roofed single storey hutong wall segment along a face
function hutongFront(F, h = 3.5, o = {}) {
  const span = F.len;
  // roof overhang along the face
  const [rx, rz] = F.at(span / 2, -0.6);
  if (F.alongX) S.prism(rx, h, rz, 2.6, 1.1, span, PAL.roof, { ry: Math.PI / 2 }); else S.prism(rx, h, rz, 2.6, 1.1, span, PAL.roof);
  fbox(S, F, span / 2, h - 0.15, span, 0.18, 0.2, 0.05, '#5a5d62');
  // doors
  const doors = o.doors || [];
  for (const u of doors) {
    fbox(S, F, u, 0, 1.7, 2.6, 0.12, 0.05, '#3a2c22');
    fbox(S, F, u - 0.4, 0.05, 0.74, 2.35, 0.08, 0.1, '#9c2a1d'); fbox(S, F, u + 0.4, 0.05, 0.74, 2.35, 0.08, 0.1, '#9c2a1d');
    fbox(S, F, u - 0.12, 1.2, 0.08, 0.08, 0.06, 0.16, '#d9a83a'); fbox(S, F, u + 0.12, 1.2, 0.08, 0.08, 0.06, 0.16, '#d9a83a');
    fbox(S, F, u, 0, 2.2, 0.25, 0.5, 0.25, '#9a968e'); // step
    fbox(S, F, u, 2.7, 2.4, 0.18, 0.9, 0.45, PAL.roof);
    if (o.fu !== false && SR() < 0.7) { const tex = TEX.fu || (TEX.fu = signTexture({ cn: '福', w: 128, h: 128, bg: '#c0281c', fg: '#f7d36b', serif: true })); const [x, z] = F.at(u - 0.4, 0.16); const sg = makeSign(x, 1.55, z, 0.38, 0.38, F.ry, tex); sg.mesh.rotation.z = Math.PI / 4 + Math.PI; }
    if (o.lanterns !== false && SR() < 0.5) { const [lx, lz] = F.at(u - 1.0, 0.45); lantern(lx, 2.45, lz, 0.2); const [lx2, lz2] = F.at(u + 1.0, 0.45); lantern(lx2, 2.45, lz2, 0.2); }
  }
  // small lattice windows
  for (const u of (o.windows || [])) {
    fbox(S, F, u, 1.3, 1.2, 1.0, 0.1, 0.04, '#3a2a1e');
    for (let i = -1; i <= 1; i++) fbox(S, F, u + i * 0.3, 1.32, 0.04, 0.96, 0.05, 0.1, '#6a4a2e');
    fbox(S, F, u, 1.78, 1.12, 0.04, 0.05, 0.1, '#6a4a2e');
    fbox(WN, F, u, 1.35, 1.0, 0.85, 0.02, 0.06, '#ffc888');
  }
  // electric meter boxes / pipes for lived-in detail
  if (o.details !== false) for (let u = 2 + sr(0, 3); u < span - 1; u += sr(5, 9)) {
    if (doors.some((d) => Math.abs(d - u) < 1.6) || (o.windows || []).some((d) => Math.abs(d - u) < 1.2)) continue;
    const k = SR();
    if (k < 0.35) fbox(S, F, u, 1.7, 0.4, 0.5, 0.18, 0.1, '#7a7f84');
    else if (k < 0.55) fbox(S, F, u, 0, 0.08, h - 0.2, 0.08, 0.06, '#4a4a4a');
    else if (k < 0.75) { const [px, pz] = F.at(u, 0.4); pot(px, pz, sr(0.7, 1), SR() < 0.5 ? '#e05a7a' : null); }
  }
}
// Hutong courtyard block: grey brick volume with roofs; fronts given as faces with doors.
function hutongBlock(x0, z0, x1, z1, fronts = {}, o = {}) {
  const h = o.h || 3.5;
  const color = spick(PAL.brick);
  S.box((x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, h, z1 - z0, color, { aoMin: 0.78 });
  Col.add(x0, z0, x1, z1);
  // inner roofs (courtyard houses) for silhouette
  const w = x1 - x0, d = z1 - z0;
  const n = Math.max(1, Math.floor((w * d) / 120));
  for (let i = 0; i < n; i++) {
    const rw = sr(6, 11), rd = sr(4, 6), cx = sr(x0 + rw / 2, x1 - rw / 2), cz = sr(z0 + rd / 2, z1 - rd / 2);
    if (rw > w || rd > d) continue;
    const alongX = SR() < 0.5;
    S.prism(cx, h, cz, alongX ? rw : rd, sr(1.0, 1.5), alongX ? rd : rw, PAL.roof, { ry: alongX ? 0 : Math.PI / 2 });
  }
  if (o.trees) for (let i = 0; i < o.trees; i++) { const tx = sr(x0 + 2, x1 - 2), tz = sr(z0 + 2, z1 - 2); S.cyl(tx, h, tz, 0.2, 1.5, '#6b4f3a'); S.ball(tx, h + 2.6, tz, sr(1.6, 2.4), spick(o.treeKind === 'ginkgo' ? PAL.ginkgo : PAL.leaf)); }
  for (const f of Object.keys(fronts)) hutongFront(faceFrame(f, x0, z0, x1, z1), h, fronts[f]);
}
function dynMat(color) { return new THREE.MeshBasicMaterial({ color, toneMapped: false }); }
