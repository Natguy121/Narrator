/* Renderer, scene, lights, sky, time of day, shared materials and decorative systems. */

const G = {
  renderer: null, scene: null, camera: null, clock: new THREE.Clock(),
  low: IS_TOUCH, glow: 0, wet: 0.4, progress: 0, todT: 0, indoorOverride: 0,
  signs: [], props: [], lights: [], flicker: 0, flickerT: 0, worldTilt: 0,
};
const PAL = {
  concrete: ['#c9c2b4', '#bdb6a8', '#d4cbb9', '#b8b0a3', '#cfc6b8', '#c2b9a6'],
  tile: ['#e4ddd0', '#d8d2c6', '#efe8dc', '#dcd5ca'],
  pink: ['#d9b8a8', '#cfa999', '#d6b3a0'],
  brick: ['#7c7d7b', '#868784', '#737472', '#80807c'],
  roof: '#45484e', red: '#b3261e', deepRed: '#8b2a20', gold: '#e0b04a', wood: '#7a4a2a', darkWood: '#4a2e1c',
  glass: '#4a5d6e', leaf: ['#4e7d3a', '#5d8c42', '#3f6b33', '#68924a'], ginkgo: ['#e8c23a', '#f0cf4a', '#d9ae2a'],
  maple: ['#c8442a', '#d65a2e', '#b83a22'], curb: '#a19b90', metal: '#5b6068', black: '#222326', white: '#f1efe9',
  lantern: '#e0402c', shirt: ['#3f6fb5', '#c0392b', '#2e8b57', '#e6b422', '#7d5ba6', '#ececec', '#3b3b3b', '#d35400', '#1f7a8c', '#a83f5f', '#5f7f3f', '#8a6d4a'],
  pants: ['#2b2f3a', '#3a3a3a', '#4a5568', '#5b4636', '#1f2a44', '#6b6b6b'],
  skin: ['#f1c9a5', '#e8b98f', '#d9a679', '#c99366', '#f5d3b5'],
  hair: ['#1a1a1a', '#2b2018', '#3a2a1e', '#bdbdbd', '#d9d9d9', '#4a3426'],
};

const TOD = [
  { t: 0.00, top: '#86acd6', hor: '#f6d7b4', fog: '#ddcdb9', fogD: 0.0125, sun: '#ffdcae', sunI: 2.6, elev: 18, az: -65, hs: '#d2e2f6', hg: '#8a7a66', hi: 1.15, glow: 0.12, exp: 1.0, stars: 0 },
  { t: 0.22, top: '#5f97da', hor: '#d3e4f2', fog: '#c9d5dd', fogD: 0.0115, sun: '#fff4e0', sunI: 3.0, elev: 50, az: -25, hs: '#d8e8ff', hg: '#8e8573', hi: 1.2, glow: 0.08, exp: 1.0, stars: 0 },
  { t: 0.42, top: '#5d90d2', hor: '#e7e0cf', fog: '#d4d0c4', fogD: 0.012, sun: '#ffeacb', sunI: 2.8, elev: 40, az: 25, hs: '#d5e2f5', hg: '#8c7f6a', hi: 1.1, glow: 0.12, exp: 1.0, stars: 0 },
  { t: 0.58, top: '#6b88bb', hor: '#f7c88e', fog: '#e2bd98', fogD: 0.013, sun: '#ffb46c', sunI: 2.5, elev: 17, az: 55, hs: '#f0d4b2', hg: '#7d6650', hi: 1.0, glow: 0.35, exp: 1.02, stars: 0 },
  { t: 0.70, top: '#4b5190', hor: '#f08a5d', fog: '#ba8274', fogD: 0.0145, sun: '#ff7b46', sunI: 1.7, elev: 7, az: 70, hs: '#c89eb2', hg: '#5a4248', hi: 0.8, glow: 0.7, exp: 1.06, stars: 0 },
  { t: 0.82, top: '#1e2452', hor: '#7c4b70', fog: '#3f3252', fogD: 0.017, sun: '#9a86e0', sunI: 0.45, elev: 12, az: 80, hs: '#5c5c9e', hg: '#2a2030', hi: 0.6, glow: 0.94, exp: 1.12, stars: 0.4 },
  { t: 1.00, top: '#0b1132', hor: '#2c2b55', fog: '#1e1e38', fogD: 0.019, sun: '#a3b6ff', sunI: 0.45, elev: 45, az: -30, hs: '#404d8a', hg: '#1a1622', hi: 0.55, glow: 1.0, exp: 1.18, stars: 1 },
];
const _todC = {};
function todSample(t) {
  t = clamp(t, 0, 1);
  let a = TOD[0], b = TOD[TOD.length - 1];
  for (let i = 0; i < TOD.length - 1; i++) if (t >= TOD[i].t && t <= TOD[i + 1].t) { a = TOD[i]; b = TOD[i + 1]; break; }
  const k = smoothstep(0, 1, (t - a.t) / Math.max(1e-5, b.t - a.t));
  const o = {};
  for (const key of Object.keys(a)) {
    if (typeof a[key] === 'string') {
      const ca = _todC[a[key]] || (_todC[a[key]] = new THREE.Color(a[key]));
      const cb = _todC[b[key]] || (_todC[b[key]] = new THREE.Color(b[key]));
      o[key] = ca.clone().lerp(cb, k);
    } else o[key] = lerp(a[key], b[key], k);
  }
  return o;
}

function initGraphics() {
  const canvas = $('#c');
  const r = G.renderer = new THREE.WebGLRenderer({ canvas, antialias: !G.low, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, G.low ? 1.5 : 1.75));
  r.setSize(window.innerWidth, window.innerHeight);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.0;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = !G.low;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = G.scene = new THREE.Scene();
  G.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.08, 900);
  G.camera.rotation.order = 'YXZ';
  scene.add(G.camera);
  scene.fog = new THREE.FogExp2(0xdddddd, 0.013);
  G.hemi = new THREE.HemisphereLight(0xffffff, 0x886644, 1.1); scene.add(G.hemi);
  G.sun = new THREE.DirectionalLight(0xffffff, 2.5);
  G.sun.castShadow = !G.low;
  const sc = G.sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 220;
  G.sun.shadow.mapSize.set(2048, 2048); G.sun.shadow.bias = -0.0006; G.sun.shadow.normalBias = 0.04;
  scene.add(G.sun); scene.add(G.sun.target);
  G.playerLight = new THREE.PointLight(0xffc890, 0, 14, 2); scene.add(G.playerLight);
  // Sky dome
  G.skyU = {
    top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color('#2a2a30') },
    sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, stars: { value: 0 }, time: { value: 0 },
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: G.skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; uniform float stars; uniform float time;
      varying vec3 vD;
      void main(){
        vec3 d = normalize(vD); float h = d.y;
        vec3 c = mix(hor, top, smoothstep(0.0, 0.6, h));
        c = mix(c, bot, smoothstep(0.02, -0.3, h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunCol * (pow(s, 600.0) * 6.0 + pow(s, 14.0) * 0.4 + pow(s, 3.0) * 0.08);
        if (stars > 0.0 && h > 0.0) {
          vec3 p = floor(d * 260.0);
          float n = fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
          float tw = 0.6 + 0.4 * sin(time * 2.0 + n * 90.0);
          c += vec3(0.9, 0.95, 1.0) * step(0.9978, n) * stars * smoothstep(0.04, 0.35, h) * tw;
        }
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  G.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), skyMat);
  G.sky.renderOrder = -10; G.sky.frustumCulled = false;
  scene.add(G.sky);
  // Moon
  G.moon = new THREE.Mesh(new THREE.CircleGeometry(9, 24), new THREE.MeshBasicMaterial({ color: 0xfff6dd, fog: false, transparent: true, opacity: 0, depthWrite: false }));
  G.moon.renderOrder = -9; scene.add(G.moon);
  // Shared materials
  G.mat = {
    solid: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, flatShading: true }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    lit: new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0 }),
    npc: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, flatShading: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fc4d8, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.22, depthWrite: false }),
  };
  fogToBlack(G.mat.lit);
  initEnvMap();
  const gm = (map, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ map, roughness: 0.85, metalness: 0 }, o));
  G.ground = {
    road: gm(TEX.asphalt, { roughnessMap: TEX.asphaltRough, roughness: 1, metalness: 0.25, envMap: G.envTex, envMapIntensity: 0.6 }),
    pavers: gm(TEX.pavers, { roughness: 0.6, envMap: G.envTex, envMapIntensity: 0.35 }),
    bricks: gm(TEX.bricks, { roughness: 0.8 }),
    stone: gm(TEX.stone, { roughness: 0.75 }),
    grass: gm(TEX.grass, { roughness: 1 }),
    tiles: gm(TEX.tiles, { roughness: 0.45, envMap: G.envTex, envMapIntensity: 0.25 }),
    wood: gm(TEX.wood, { roughness: 0.7 }),
    metro: gm(TEX.metroFloor, { roughness: 0.3, envMap: G.envTex, envMapIntensity: 0.5 }),
    water: gm(TEX.water, { roughness: 0.15, metalness: 0.3, envMap: G.envTex, envMapIntensity: 1.0, color: 0x9ab }),
    dirt: gm(null, { color: 0x8a7558, roughness: 1 }),
  };
  initHalos(); initStreaks(); initSteam();
  window.addEventListener('resize', onResize);
}
function onResize() {
  if (!G.renderer) return;
  G.camera.aspect = window.innerWidth / window.innerHeight; G.camera.updateProjectionMatrix();
  G.renderer.setSize(window.innerWidth, window.innerHeight);
}

/* Additive glows must fade to black in fog (not to the fog color), or distant lights become bright blobs. */
function fogToBlack(m) {
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', `#ifdef USE_FOG
      #ifdef FOG_EXP2
        float fogF = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
      #else
        float fogF = smoothstep( fogNear, fogFar, vFogDepth );
      #endif
      gl_FragColor.rgb *= ( 1.0 - fogF );
    #endif`);
  };
  m.customProgramCacheKey = () => 'fog2black';
  return m;
}

/* Equirect env map painted on a canvas: sky gradient + neon blobs at night. Gives wet surfaces something to reflect. */
function initEnvMap() {
  const c = makeCanvas(256, 128); G.envCanvas = c;
  G.envTex = new THREE.CanvasTexture(c);
  G.envTex.mapping = THREE.EquirectangularReflectionMapping; G.envTex.colorSpace = THREE.SRGBColorSpace;
  G.envLast = -1;
}
function paintEnv(s) {
  const c = G.envCanvas, g = c.getContext('2d'), w = c.width, h = c.height;
  const lg = g.createLinearGradient(0, 0, 0, h);
  lg.addColorStop(0, '#' + s.top.getHexString(THREE.SRGBColorSpace));
  lg.addColorStop(0.48, '#' + s.hor.getHexString(THREE.SRGBColorSpace));
  lg.addColorStop(0.52, '#' + s.fog.clone().multiplyScalar(0.6).getHexString(THREE.SRGBColorSpace));
  lg.addColorStop(1, '#1a1a1e');
  g.fillStyle = lg; g.fillRect(0, 0, w, h);
  // building silhouettes along the horizon + neon smudges
  const rng = mulberry32(7);
  for (let x = 0; x < w; x += 6) {
    const bh = 8 + rng() * 26;
    g.fillStyle = `rgba(20,20,28,${0.35 + 0.4 * s.glow})`; g.fillRect(x, h * 0.5 - bh, 6, bh);
  }
  const neon = ['#ff3d7f', '#36e0ff', '#ffb02e', '#ff4433', '#7dff6a', '#b06bff'];
  for (let i = 0; i < 40; i++) {
    const x = rng() * w, y = h * 0.5 - rng() * 30, r = 3 + rng() * 9;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const nc = neon[Math.floor(rng() * neon.length)];
    gr.addColorStop(0, nc); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.15 + 0.85 * s.glow; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1;
  }
  G.envTex.needsUpdate = true;
}

/* Time of day: progress 0 (morning) -> 1 (night) */
function applyTimeOfDay(p, dt) {
  G.progress = p;
  const s = todSample(p);
  const indoor = G.indoorOverride;
  G.glow = s.glow;
  G.skyU.top.value.copy(s.top); G.skyU.hor.value.copy(s.hor); G.skyU.stars.value = s.stars;
  G.skyU.time.value += dt;
  G.skyU.bot.value.copy(s.fog).multiplyScalar(0.5);
  const el = Math.max(s.elev, 10) * DEG, az = s.az * DEG;
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const skySunEl = s.elev * DEG;
  G.skyU.sunDir.value.set(Math.sin(az) * Math.cos(skySunEl), Math.sin(skySunEl), -Math.cos(az) * Math.cos(skySunEl));
  G.skyU.sunCol.value.copy(s.sun).multiplyScalar(p > 0.8 ? 0.0 : 1);
  G.sunDir = dir;
  G.sun.color.copy(s.sun);
  G.sun.intensity = s.sunI * (1 - indoor) * (1 - G.flicker * 0.7);
  G.hemi.color.copy(s.hs); G.hemi.groundColor.copy(s.hg);
  G.hemi.intensity = lerp(s.hi, 1.25, indoor) * (1 - G.flicker * 0.8);
  if (indoor > 0.5) { G.hemi.color.set('#e8f0ff'); G.hemi.groundColor.set('#8a8a90'); }
  G.scene.fog.color.copy(indoor > 0.5 ? new THREE.Color('#2a2d36') : s.fog);
  G.scene.fog.density = indoor > 0.5 ? 0.012 : s.fogD;
  G.renderer.toneMappingExposure = s.exp;
  // night lights
  const glow = indoor > 0.5 ? 1 : s.glow;
  const fl = G.flicker > 0 ? (Math.random() < 0.5 ? 0.15 : 1) : 1;
  G.mat.glow.color.setScalar(lerp(0.55, 1.15, glow) * fl);
  G.mat.lit.opacity = Math.pow(glow, 1.4) * fl;
  for (const sg of G.signs) sg.mat.color.setScalar((sg.neon ? lerp(0.7, 1.4, glow) : lerp(0.95, 1.1, glow)) * (sg.neon ? fl : 1));
  for (const hp of G.haloSets) hp.material.opacity = Math.pow(glow, 1.3) * hp.userData.base * fl;
  G.streakMat.opacity = glow * (0.35 + 0.65 * G.wet) * fl;
  G.playerLight.intensity = glow * 6 * (1 - indoor);
  for (const L of G.lights) L.light.intensity = L.base * (L.night ? lerp(0.4, 1, glow) : 1) * fl;
  G.ground.road.envMapIntensity = 0.35 + 0.9 * G.wet * glow;
  G.moon.material.opacity = smoothstep(0.8, 0.95, p) * (1 - indoor);
  // repaint env reflections when the light changes noticeably
  if (Math.abs(G.envLast - p) > 0.04) { G.envLast = p; paintEnv(s); }
  G.tod = s;
}
function updateSkyFollow(cam) {
  G.sky.position.copy(cam.position);
  const md = new THREE.Vector3(0.45, 0.42, -0.78).normalize();
  G.moon.position.copy(cam.position).addScaledVector(md, 380); G.moon.lookAt(cam.position);
  // shadow camera follows the player (snapped to texels to avoid shimmering)
  const step = 90 / 2048;
  const tx = Math.round(cam.position.x / step) * step, tz = Math.round(cam.position.z / step) * step;
  const d = G.sunDir || new THREE.Vector3(0, 1, 0);
  G.sun.target.position.set(tx, 0, tz);
  G.sun.position.set(tx + d.x * 100, d.y * 100, tz + d.z * 100);
  G.playerLight.position.set(cam.position.x, cam.position.y + 1.6, cam.position.z);
}

/* ---------------- Halos (additive glow sprites via Points, one draw call per size class) ---------------- */
G.haloData = { S: [], M: [], L: [] };
G.haloSets = [];
function halo(x, y, z, color, cls = 'M') { G.haloData[cls].push(x, y, z, col(color).r, col(color).g, col(color).b); }
function initHalos() { /* built after the world is created */ }
function buildHalos() {
  const sizes = { S: 0.55, M: 1.9, L: 4.2 }, base = { S: 0.95, M: 0.8, L: 0.55 };
  for (const k of ['S', 'M', 'L']) {
    const d = G.haloData[k]; if (!d.length) continue;
    const pos = [], colr = [];
    for (let i = 0; i < d.length; i += 6) { pos.push(d[i], d[i + 1], d[i + 2]); colr.push(d[i + 3], d[i + 4], d[i + 5]); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
    const m = new THREE.PointsMaterial({ size: sizes[k], map: TEX.halo, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false, opacity: 0 });
    fogToBlack(m);
    const p = new THREE.Points(g, m); p.userData.base = base[k]; p.frustumCulled = false;
    G.scene.add(p); G.haloSets.push(p);
  }
}

/* ---------------- Wet-street reflection streaks (camera-facing ground quads) ---------------- */
G.streaks = [];
function streak(x, z, color, w = 0.8, len = 6, y = 0.02, area = 'surface') { G.streaks.push({ x, z, y, c: col(color), w, len, area }); }
function initStreaks() {
  G.streakMat = fogToBlack(new THREE.MeshBasicMaterial({ map: TEX.streak, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0 }));
}
function buildStreaks() {
  const n = G.streaks.length;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 18), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 12), 2));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 18), 3));
  const uv = g.attributes.uv.array, c = g.attributes.color.array;
  for (let i = 0; i < n; i++) {
    const s = G.streaks[i];
    uv.set([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], i * 12);
    for (let k = 0; k < 6; k++) c.set([s.c.r * 0.8, s.c.g * 0.8, s.c.b * 0.8], i * 18 + k * 3);
  }
  G.streakMesh = new THREE.Mesh(g, G.streakMat); G.streakMesh.frustumCulled = false; G.streakMesh.renderOrder = 2;
  G.scene.add(G.streakMesh);
}
function updateStreaks(cam) {
  if (!G.streakMesh || G.streakMat.opacity < 0.01) return;
  const p = G.streakMesh.geometry.attributes.position.array;
  const cx = cam.position.x, cz = cam.position.z;
  for (let i = 0; i < G.streaks.length; i++) {
    const s = G.streaks[i];
    let dx = cx - s.x, dz = cz - s.z; const d = Math.hypot(dx, dz) || 1;
    if (d > 70) { p.fill(0, i * 18, i * 18 + 18); continue; }
    dx /= d; dz /= d;
    const L = Math.min(s.len, d * 0.85), px = -dz * s.w / 2, pz = dx * s.w / 2;
    const ax = s.x, az = s.z, bx = s.x + dx * L, bz = s.z + dz * L, y = s.y;
    p.set([ax - px, y, az - pz, ax + px, y, az + pz, bx + px, y, bz + pz, ax - px, y, az - pz, bx + px, y, bz + pz, bx - px, y, bz - pz], i * 18);
  }
  G.streakMesh.geometry.attributes.position.needsUpdate = true;
}

/* ---------------- Steam / smoke particles ---------------- */
const Steam = { emitters: [], N: 260, i: 0 };
function initSteam() {
  const g = new THREE.BufferGeometry();
  Steam.pos = new Float32Array(Steam.N * 3); Steam.vel = new Float32Array(Steam.N * 3); Steam.life = new Float32Array(Steam.N);
  Steam.col = new Float32Array(Steam.N * 3);
  g.setAttribute('position', new THREE.BufferAttribute(Steam.pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(Steam.col, 3));
  const m = new THREE.PointsMaterial({ size: 0.9, map: TEX.soft, transparent: true, depthWrite: false, vertexColors: true, opacity: 0.55, sizeAttenuation: true });
  Steam.points = new THREE.Points(g, m); Steam.points.frustumCulled = false;
  for (let i = 0; i < Steam.N; i++) Steam.pos[i * 3 + 1] = -999;
}
function steamEmitter(x, y, z, rate = 4, o = {}) { const e = { x, y, z, rate, acc: Math.random(), smoke: !!o.smoke, area: o.area || 'surface', on: true, spread: o.spread || 0.15 }; Steam.emitters.push(e); return e; }
function steamBurst(x, y, z, n = 10, spread = 0.4) { for (let i = 0; i < n; i++) spawnSteam(x + rand(-spread, spread), y, z + rand(-spread, spread), false, 1.6); }
function spawnSteam(x, y, z, smoke, up = 1) {
  const i = Steam.i = (Steam.i + 1) % Steam.N;
  Steam.pos.set([x, y, z], i * 3);
  Steam.vel.set([rand(-0.12, 0.12), rand(0.5, 0.9) * up, rand(-0.12, 0.12)], i * 3);
  Steam.life[i] = rand(1.6, 2.6);
  const c = smoke ? rand(0.45, 0.6) : rand(0.85, 1);
  Steam.col.set([c, c, c], i * 3);
}
function updateSteam(dt, cam, area) {
  for (const e of Steam.emitters) {
    if (!e.on || e.area !== area) continue;
    const d = Math.hypot(cam.position.x - e.x, cam.position.z - e.z); if (d > 40) continue;
    e.acc += dt * e.rate;
    while (e.acc > 1) { e.acc--; spawnSteam(e.x + rand(-e.spread, e.spread), e.y, e.z + rand(-e.spread, e.spread), e.smoke); }
  }
  for (let i = 0; i < Steam.N; i++) {
    if (Steam.life[i] <= 0) { Steam.pos[i * 3 + 1] = -999; continue; }
    Steam.life[i] -= dt;
    Steam.pos[i * 3] += Steam.vel[i * 3] * dt; Steam.pos[i * 3 + 1] += Steam.vel[i * 3 + 1] * dt; Steam.pos[i * 3 + 2] += Steam.vel[i * 3 + 2] * dt;
    Steam.vel[i * 3] *= 0.99; Steam.vel[i * 3 + 2] *= 0.99;
    const f = clamp(Steam.life[i] / 2, 0, 1);
    const c = Steam.col[i * 3]; Steam.col[i * 3 + 1] = c * f; Steam.col[i * 3 + 2] = c * f; Steam.col[i * 3] = c;
  }
  Steam.points.geometry.attributes.position.needsUpdate = true;
  Steam.points.geometry.attributes.color.needsUpdate = true;
}

/* ---------------- Signs ---------------- */
function makeSign(x, y, z, w, h, ry, tex, o = {}) {
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: !!o.transparent, side: o.double ? THREE.DoubleSide : THREE.FrontSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z); m.rotation.y = ry;
  G.scene.add(m);
  const s = { mesh: m, mat, neon: !!o.neon, tex, x, z, rearrange: o.rearrange !== false && !!o.neon, tag: o.tag };
  G.signs.push(s);
  if (o.neon && o.color) {
    halo(x + Math.sin(ry) * 0.3, y, z + Math.cos(ry) * 0.3, o.color, 'L');
    if (o.streak !== false) streak(x + Math.sin(ry) * 0.6, z + Math.cos(ry) * 0.6, o.color, Math.min(w, 2.2) * 0.7, 7, o.streakY || 0.02);
  }
  return s;
}

/* ---------------- Interior/accent point lights ---------------- */
function addLight(x, y, z, color, intensity, dist, o = {}) {
  if (G.low && !o.always) return null;
  const l = new THREE.PointLight(color, intensity, dist, 2); l.position.set(x, y, z);
  G.scene.add(l);
  const L = { light: l, base: intensity, night: !!o.night };
  G.lights.push(L); return L;
}
