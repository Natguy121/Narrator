/* Core helpers: math, rng, event bus, geometry batching, colliders, zones, canvas textures. */

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
const smoothstep = (a, b, v) => { const t = invLerp(a, b, v); return t * t * (3 - 2 * t); };
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const wrapAngle = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const dist2D = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SR = mulberry32(1120);
const sr = (a = 0, b = 1) => a + SR() * (b - a);
const sri = (a, b) => Math.floor(sr(a, b + 1));
const spick = (arr) => arr[Math.floor(SR() * arr.length)];
const IS_TOUCH = (window.matchMedia && matchMedia('(pointer: coarse)').matches) ||
  (('ontouchstart' in window) && navigator.maxTouchPoints > 0);
const $ = (s) => document.querySelector(s);

/* ---------------- Event bus ---------------- */
const Bus = {
  h: {},
  on(t, f) { (this.h[t] || (this.h[t] = [])).push(f); },
  emit(t, d) { const l = this.h[t]; if (l) for (const f of l.slice()) f(d); },
};

/* ---------------- Colors ---------------- */
const _colCache = new Map();
function col(c) {
  if (c && c.isColor) return c;
  let r = _colCache.get(c);
  if (!r) { r = new THREE.Color(c); _colCache.set(c, r); }
  return r;
}
function jit(hex, a = 0.08) { return new THREE.Color(hex).multiplyScalar(1 + sr(-a, a)); }
function mix(a, b, t) { return new THREE.Color(a).lerp(new THREE.Color(b), t); }

/* ---------------- Base geometries (non-indexed) ---------------- */
function prismGeo() { // gable roof: triangle in XY (base y=0..apex y=1), extruded on Z
  const A = [-0.5, 0], B = [0.5, 0], T = [0, 1], z0 = -0.5, z1 = 0.5;
  const v = [];
  const tri = (a, b, c) => v.push(...a, ...b, ...c);
  const P = (p, z) => [p[0], p[1], z];
  tri(P(A, z1), P(B, z1), P(T, z1));
  tri(P(B, z0), P(A, z0), P(T, z0));
  tri(P(A, z0), P(A, z1), P(T, z1)); tri(P(A, z0), P(T, z1), P(T, z0));
  tri(P(B, z1), P(B, z0), P(T, z0)); tri(P(B, z1), P(T, z0), P(T, z1));
  tri(P(A, z0), P(B, z0), P(B, z1)); tri(P(A, z0), P(B, z1), P(A, z1));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}
function hipRoofGeo(w, d, h, ridge = 0.5) { // rectangular hip roof, base at y=0
  const rx = Math.max(0, (w - d) / 2) * ridge + 0.001;
  const A = [-w / 2, 0, -d / 2], B = [w / 2, 0, -d / 2], C = [w / 2, 0, d / 2], D = [-w / 2, 0, d / 2];
  const R1 = [-rx, h, 0], R2 = [rx, h, 0];
  const v = [];
  const tri = (a, b, c) => v.push(...a, ...b, ...c);
  tri(D, C, R2); tri(D, R2, R1);
  tri(B, A, R1); tri(B, R1, R2);
  tri(A, D, R1); tri(C, B, R2);
  tri(A, B, C); tri(A, C, D);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1).toNonIndexed(),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1).toNonIndexed(),
  cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1).toNonIndexed(),
  cyl12: new THREE.CylinderGeometry(0.5, 0.5, 1, 12, 1).toNonIndexed(),
  cone4: new THREE.ConeGeometry(0.5, 1, 4, 1).toNonIndexed(),
  cone6: new THREE.ConeGeometry(0.5, 1, 6, 1).toNonIndexed(),
  cone8: new THREE.ConeGeometry(0.5, 1, 8, 1).toNonIndexed(),
  ico: new THREE.IcosahedronGeometry(0.5, 0),
  ico1: new THREE.IcosahedronGeometry(0.5, 1),
  lantern: new THREE.SphereGeometry(0.5, 8, 6).toNonIndexed(),
  plane: new THREE.PlaneGeometry(1, 1).toNonIndexed(),
  prism: prismGeo(),
  torus: new THREE.TorusGeometry(0.5, 0.07, 4, 12).toNonIndexed(),
};

/* ---------------- Batch: merges many primitives into one mesh with vertex colors ---------------- */
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _sv = new THREE.Vector3(), _pv = new THREE.Vector3();
const _eu = new THREE.Euler(), _v3 = new THREE.Vector3(), _n3 = new THREE.Vector3(), _nm = new THREE.Matrix3();
class Batch {
  constructor() { this.pos = []; this.nor = []; this.col = []; }
  get empty() { return this.pos.length === 0; }
  addGeo(geo, matrix, color, o) {
    const P = geo.attributes.position, N = geo.attributes.normal;
    _nm.getNormalMatrix(matrix);
    const c = col(color);
    const ao = o && o.ao !== false;
    const aoMin = (o && o.aoMin) || 0.62;
    let topShade = (o && o.top) || 1;
    for (let i = 0; i < P.count; i++) {
      _v3.fromBufferAttribute(P, i);
      const ly = _v3.y;
      _v3.applyMatrix4(matrix);
      _n3.fromBufferAttribute(N, i).applyMatrix3(_nm).normalize();
      this.pos.push(_v3.x, _v3.y, _v3.z);
      this.nor.push(_n3.x, _n3.y, _n3.z);
      let f = ao ? aoMin + (1 - aoMin) * clamp(ly + 0.5, 0, 1) : 1;
      if (_n3.y > 0.9) f *= topShade;
      this.col.push(c.r * f, c.g * f, c.b * f);
    }
  }
  // Primitive helpers. For box/cyl/etc. y is the BOTTOM.
  prim(geo, x, y, z, sx, sy, sz, color, o = {}) {
    _eu.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ');
    _q.setFromEuler(_eu);
    _m4.compose(_pv.set(x, y + (o.center ? 0 : sy / 2), z), _q, _sv.set(sx, sy, sz));
    this.addGeo(geo, _m4, color, o);
  }
  box(x, y, z, w, h, d, color, o) { this.prim(GEO.box, x, y, z, w, h, d, color, o); }
  cyl(x, y, z, r, h, color, o = {}) { this.prim(o.seg === 6 ? GEO.cyl6 : o.seg === 12 ? GEO.cyl12 : GEO.cyl8, x, y, z, r * 2, h, (o.rz2 || r) * 2, color, o); }
  cone(x, y, z, r, h, color, o = {}) { this.prim(o.seg === 4 ? GEO.cone4 : o.seg === 6 ? GEO.cone6 : GEO.cone8, x, y, z, r * 2, h, r * 2, color, o); }
  ball(x, y, z, r, color, o = {}) { this.prim(o.smooth ? GEO.ico1 : GEO.ico, x, y, z, r * 2 * (o.sx || 1), r * 2 * (o.sy || 1), r * 2 * (o.sz || 1), color, Object.assign({ center: true, ao: false }, o)); }
  lantern(x, y, z, r, color, o = {}) { this.prim(GEO.lantern, x, y, z, r * 2, r * 1.7, r * 2, color, Object.assign({ center: true, ao: false }, o)); }
  prism(x, y, z, w, h, d, color, o) { this.prim(GEO.prism, x, y, z, w, h, d, color, Object.assign({ ao: false, center: true }, o)); }
  geo(g, x, y, z, color, o = {}) {
    _eu.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'); _q.setFromEuler(_eu);
    _m4.compose(_pv.set(x, y, z), _q, _sv.set(o.s || 1, o.s || 1, o.s || 1));
    this.addGeo(g.index ? g.toNonIndexed() : g, _m4, color, Object.assign({ ao: false }, o));
  }
  build(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return new THREE.Mesh(g, material);
  }
}
// Routes primitives into spatial chunks so frustum culling still works on merged geometry.
class ChunkedBatch {
  constructor(size = 40) { this.size = size; this.map = new Map(); }
  at(x, z) {
    const k = Math.floor(x / this.size) + ',' + Math.floor(z / this.size);
    let b = this.map.get(k); if (!b) { b = new Batch(); this.map.set(k, b); }
    return b;
  }
  box(x, y, z, w, h, d, c, o) { this.at(x, z).box(x, y, z, w, h, d, c, o); }
  prim(g, x, y, z, sx, sy, sz, c, o) { this.at(x, z).prim(g, x, y, z, sx, sy, sz, c, o); }
  cyl(x, y, z, r, h, c, o) { this.at(x, z).cyl(x, y, z, r, h, c, o); }
  cone(x, y, z, r, h, c, o) { this.at(x, z).cone(x, y, z, r, h, c, o); }
  ball(x, y, z, r, c, o) { this.at(x, z).ball(x, y, z, r, c, o); }
  lantern(x, y, z, r, c, o) { this.at(x, z).lantern(x, y, z, r, c, o); }
  prism(x, y, z, w, h, d, c, o) { this.at(x, z).prism(x, y, z, w, h, d, c, o); }
  geo(g, x, y, z, c, o) { this.at(x, z).geo(g, x, y, z, c, o); }
  build(material, parent, o = {}) {
    const meshes = [];
    for (const b of this.map.values()) {
      if (b.empty) continue;
      const m = b.build(material);
      m.castShadow = !!o.cast; m.receiveShadow = !!o.receive;
      m.matrixAutoUpdate = false; m.updateMatrix();
      if (o.order !== undefined) m.renderOrder = o.order;
      parent.add(m); meshes.push(m);
    }
    return meshes;
  }
}

/* ---------------- Colliders (axis-aligned boxes on the XZ plane) ---------------- */
const Col = {
  cell: 4, grid: new Map(), all: [], stamp: 0,
  key(cx, cz) { return cx * 73856093 ^ cz * 19349663; },
  add(x0, z0, x1, z1, o = {}) {
    const c = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), on: true, tag: o.tag || '', s: 0 };
    this.all.push(c);
    const cs = this.cell;
    for (let cx = Math.floor(c.x0 / cs); cx <= Math.floor(c.x1 / cs); cx++)
      for (let cz = Math.floor(c.z0 / cs); cz <= Math.floor(c.z1 / cs); cz++) {
        const k = this.key(cx, cz);
        let l = this.grid.get(k); if (!l) { l = []; this.grid.set(k, l); }
        l.push(c);
      }
    return c;
  },
  box(cx, cz, w, d, o) { return this.add(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, o); },
  near(x, z, r, out) {
    out.length = 0; this.stamp++;
    const cs = this.cell;
    for (let cx = Math.floor((x - r) / cs); cx <= Math.floor((x + r) / cs); cx++)
      for (let cz = Math.floor((z - r) / cs); cz <= Math.floor((z + r) / cs); cz++) {
        const l = this.grid.get(this.key(cx, cz)); if (!l) continue;
        for (const c of l) if (c.on && c.s !== this.stamp) { c.s = this.stamp; out.push(c); }
      }
    return out;
  },
  _tmp: [],
  // Push a circle out of all boxes. Returns number of contacts.
  resolve(p, r) {
    let hits = 0;
    for (let it = 0; it < 3; it++) {
      const list = this.near(p.x, p.z, r + 0.5, this._tmp);
      let moved = false;
      for (const c of list) {
        const qx = clamp(p.x, c.x0, c.x1), qz = clamp(p.z, c.z0, c.z1);
        let dx = p.x - qx, dz = p.z - qz;
        const d2 = dx * dx + dz * dz;
        if (d2 < r * r) {
          if (d2 > 1e-8) {
            const d = Math.sqrt(d2), push = r - d;
            p.x += dx / d * push; p.z += dz / d * push;
          } else { // center inside the box: push out along smallest axis
            const l = p.x - c.x0, rr = c.x1 - p.x, t = p.z - c.z0, b = c.z1 - p.z;
            const m = Math.min(l, rr, t, b);
            if (m === l) p.x = c.x0 - r; else if (m === rr) p.x = c.x1 + r; else if (m === t) p.z = c.z0 - r; else p.z = c.z1 + r;
          }
          hits++; moved = true;
        }
      }
      if (!moved) break;
    }
    return hits;
  },
  pointBlocked(x, z, pad = 0) {
    const list = this.near(x, z, pad + 0.1, this._tmp);
    for (const c of list) if (x > c.x0 - pad && x < c.x1 + pad && z > c.z0 - pad && z < c.z1 + pad) return true;
    return false;
  },
  segmentClear(ax, az, bx, bz, pad = 0.2) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(d / 0.6));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (this.pointBlocked(lerp(ax, bx, t), lerp(az, bz, t), pad)) return false;
    }
    return true;
  },
};

/* ---------------- Zones (named regions for locations & triggers) ---------------- */
const Zones = {
  list: [], byId: {},
  rect(id, x0, z0, x1, z1, o = {}) {
    const z = Object.assign({ id, type: 'rect', x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), prio: 0, area: 'surface' }, o);
    this.list.push(z); this.byId[id] = z; return z;
  },
  circle(id, x, z, r, o = {}) {
    const zz = Object.assign({ id, type: 'circle', x, z, r, prio: 0, area: 'surface' }, o);
    this.list.push(zz); this.byId[id] = zz; return zz;
  },
  contains(z, x, zz) {
    if (z.type === 'rect') return x >= z.x0 && x <= z.x1 && zz >= z.z0 && zz <= z.z1;
    return (x - z.x) ** 2 + (zz - z.z) ** 2 <= z.r * z.r;
  },
  at(x, z, out) {
    out.length = 0;
    for (const zn of this.list) if (this.contains(zn, x, z)) out.push(zn);
    return out;
  },
  center(id) {
    const z = this.byId[id]; if (!z) return null;
    return z.type === 'rect' ? new THREE.Vector3((z.x0 + z.x1) / 2, 0, (z.z0 + z.z1) / 2) : new THREE.Vector3(z.x, 0, z.z);
  },
};

/* ---------------- Canvas textures ---------------- */
const FONT_CN = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC","WenQuanYi Zen Hei","Noto Sans SC",sans-serif';
const FONT_SERIF = '"Songti SC","STSong","SimSun","Noto Serif CJK SC","Source Han Serif SC",Georgia,serif';
const FONT_EN = '"Helvetica Neue",Arial,"Segoe UI",sans-serif';
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function canvasTex(w, h, draw, o = {}) {
  const c = makeCanvas(w, h), g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  return t;
}
function fitText(g, text, maxW, size, font, weight = 'bold') {
  let s = size;
  do { g.font = `${weight} ${s}px ${font}`; if (g.measureText(text).width <= maxW) break; s -= 2; } while (s > 8);
  return s;
}
// Signs: Chinese headline + English subtitle. style: 'plain' | 'neon' | 'plaque' | 'street' | 'lightbox'
function signTexture(o) {
  const w = o.w || 512, h = o.h || 192;
  return canvasTex(w, h, (g) => {
    const neon = o.style === 'neon';
    g.fillStyle = o.bg || (neon ? '#0d0a14' : '#9c2a1d');
    g.fillRect(0, 0, w, h);
    if (o.style === 'plaque') { // carved wood plaque
      g.strokeStyle = o.border || '#d9a441'; g.lineWidth = h * 0.06; g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
    } else if (o.style === 'street') {
      g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    } else if (o.border) {
      g.strokeStyle = o.border; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const fg = o.fg || '#ffd76a';
    const vertical = !!o.vertical;
    const cnFont = o.serif ? FONT_SERIF : FONT_CN;
    if (vertical) {
      const chars = [...(o.cn || '')];
      const step = (h * (o.en ? 0.8 : 0.92)) / Math.max(1, chars.length);
      const size = Math.min(step * 0.86, w * 0.78);
      g.font = `bold ${size}px ${cnFont}`;
      chars.forEach((ch, i) => {
        const y = step * (i + 0.5) + h * 0.03;
        if (neon) { g.shadowColor = fg; g.shadowBlur = size * 0.35; g.fillStyle = fg; g.fillText(ch, w / 2, y); g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.globalAlpha = 0.55; g.fillText(ch, w / 2, y); g.globalAlpha = 1; }
        else { g.fillStyle = fg; g.fillText(ch, w / 2, y); }
      });
      if (o.en) {
        const es = fitText(g, o.en, w * 0.9, w * 0.2, FONT_EN);
        g.font = `bold ${es}px ${FONT_EN}`;
        g.fillStyle = neon ? '#ffffff' : fg; g.globalAlpha = 0.9;
        g.fillText(o.en, w / 2, h * 0.9); g.globalAlpha = 1;
      }
      return;
    }
    const cnSize = fitText(g, o.cn || '', w * 0.9, (o.en ? h * 0.58 : h * 0.72) * (o.cnScale || 1), cnFont);
    const cy = o.en ? h * 0.4 : h * 0.52;
    g.font = `bold ${cnSize}px ${cnFont}`;
    if (neon) {
      g.shadowColor = fg; g.shadowBlur = cnSize * 0.4; g.fillStyle = fg; g.fillText(o.cn, w / 2, cy);
      g.shadowBlur = cnSize * 0.15; g.fillText(o.cn, w / 2, cy); g.shadowBlur = 0;
      g.globalAlpha = 0.6; g.fillStyle = '#fff'; g.fillText(o.cn, w / 2, cy); g.globalAlpha = 1;
    } else { g.fillStyle = fg; g.fillText(o.cn, w / 2, cy); }
    if (o.en) {
      const es = fitText(g, o.en, w * 0.88, h * 0.2, FONT_EN);
      g.font = `bold ${es}px ${FONT_EN}`;
      if (neon) { g.shadowColor = o.fg2 || fg; g.shadowBlur = 12; }
      g.fillStyle = o.fg2 || (neon ? '#f4f4ff' : fg);
      g.fillText(o.en.toUpperCase(), w / 2, h * 0.8); g.shadowBlur = 0;
    }
  });
}
const TEX = {};
function initTextures() {
  TEX.halo = canvasTex(64, 64, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    r.addColorStop(0.5, 'rgba(255,255,255,0.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
  TEX.soft = canvasTex(64, 64, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.6, 'rgba(255,255,255,0.25)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
  TEX.streak = canvasTex(32, 128, (g, w, h) => { // vertical: bright at v=0 (bottom row in GL)
    const lg = g.createLinearGradient(0, h, 0, 0);
    lg.addColorStop(0, 'rgba(255,255,255,0.9)'); lg.addColorStop(0.35, 'rgba(255,255,255,0.35)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
    const hg = g.createLinearGradient(0, 0, w, 0);
    hg.addColorStop(0, 'rgba(0,0,0,1)'); hg.addColorStop(0.5, 'rgba(0,0,0,0)'); hg.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = hg; g.fillRect(0, 0, w, h);
  });
  TEX.beam = canvasTex(16, 128, (g, w, h) => {
    const lg = g.createLinearGradient(0, h, 0, 0);
    lg.addColorStop(0, 'rgba(255,255,255,0.85)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.25)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
  });
  TEX.ring = canvasTex(128, 128, (g, w) => {
    g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 7; g.shadowColor = '#fff'; g.shadowBlur = 10;
    g.beginPath(); g.arc(w / 2, w / 2, w * 0.38, 0, TAU); g.stroke();
  });
  // Wet asphalt: color + roughness (puddles are glossy)
  const puddles = [];
  for (let i = 0; i < 9; i++) puddles.push([sr(0, 512), sr(0, 512), sr(18, 60), sr(10, 26), sr(0, 3)]);
  TEX.asphalt = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#3a3b40'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = sri(40, 80); g.fillStyle = `rgba(${v},${v},${v + 4},0.35)`; g.fillRect(sr(0, w), sr(0, h), sr(1, 3), sr(1, 3)); }
    for (const [x, y, rx, ry, a] of puddles) { g.fillStyle = 'rgba(20,22,30,0.55)'; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill(); }
  }, { repeat: [1, 1] });
  TEX.asphaltRough = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { const v = sri(150, 230); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(sr(0, w), sr(0, h), 3, 3); }
    for (const [x, y, rx, ry, a] of puddles) { g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill(); }
  }, { repeat: [1, 1], linear: true });
  TEX.pavers = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8f8a82'; g.fillRect(0, 0, w, h);
    const s = 32;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const v = sri(-14, 14);
      g.fillStyle = `rgb(${150 + v},${144 + v},${134 + v})`;
      g.fillRect(x + 1.5, y + 1.5, s - 3, s - 3);
    }
  }, { repeat: [1, 1] });
  TEX.bricks = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6f6f6c'; g.fillRect(0, 0, w, h);
    const bw = 42, bh = 20;
    for (let r = 0, y = 0; y < h; y += bh, r++) for (let x = (r % 2) * -bw / 2; x < w; x += bw) {
      const v = sri(-10, 12);
      g.fillStyle = `rgb(${128 + v},${128 + v},${124 + v})`; g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
    }
  }, { repeat: [1, 1] });
  TEX.stone = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#9c968c'; g.fillRect(0, 0, w, h);
    const s = 64;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const v = sri(-12, 12);
      g.fillStyle = `rgb(${172 + v},${165 + v},${152 + v})`; g.fillRect(x + 2, y + 2, s - 4, s - 4);
    }
  }, { repeat: [1, 1] });
  TEX.grass = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5d7a3a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${sri(60, 120)},${sri(110, 150)},${sri(40, 70)},0.5)`; g.fillRect(sr(0, w), sr(0, h), 2, sr(2, 5)); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${sri(190, 230)},${sri(150, 190)},40,0.6)`; g.beginPath(); g.arc(sr(0, w), sr(0, h), sr(1, 3), 0, TAU); g.fill(); }
  }, { repeat: [1, 1] });
  TEX.tiles = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c9bca4'; g.fillRect(0, 0, w, h);
    const s = 64;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const v = sri(-8, 8), alt = ((x + y) / s) % 2 ? 10 : 0;
      g.fillStyle = `rgb(${205 + v - alt},${192 + v - alt},${168 + v - alt})`; g.fillRect(x + 1, y + 1, s - 2, s - 2);
    }
  }, { repeat: [1, 1] });
  TEX.wood = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6b4428'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) { const v = sri(-12, 12); g.fillStyle = `rgb(${110 + v},${72 + v},${44 + v})`; g.fillRect(0, y + 1, w, 30); }
    for (let i = 0; i < 200; i++) { g.fillStyle = 'rgba(40,20,10,0.25)'; g.fillRect(sr(0, w), sr(0, h), sr(10, 60), 1); }
  }, { repeat: [1, 1] });
  TEX.metroFloor = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#b9bcc0'; g.fillRect(0, 0, w, h);
    const s = 64;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) { const v = sri(-6, 6); g.fillStyle = `rgb(${200 + v},${203 + v},${208 + v})`; g.fillRect(x + 1, y + 1, s - 2, s - 2); }
  }, { repeat: [1, 1] });
  TEX.water = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2d5560'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { g.strokeStyle = `rgba(160,210,220,${sr(0.05, 0.2)})`; g.lineWidth = 1.5; g.beginPath(); const x = sr(0, w), y = sr(0, h); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 3, x + 16, y); g.stroke(); }
  }, { repeat: [1, 1] });
}
