/* The metro: an underground station (placed far away at MO) whose signage swaps per station, a train, and a tunnel ride. */

const MO = { x: 0, z: 400 };
const STATIONS = {
  neon: { cn: '霓虹路', en: 'Neon Road', color: '#d7262e' },
  night: { cn: '夜市', en: 'Night Market', color: '#f29a2e' },
  park: { cn: '人民公园', en: "People's Park", color: '#2e9b57' },
};
const Metro = {
  state: 'empty', t: 0, station: 'neon', origin: 'neon', wrongWay: false, trainX: -150, door: 0, doorTarget: 0,
  ridden: 0, rideT: 0, holdOpen: true, openT: 0, playerInside: false, sway: 0, arrivalPending: -1, wrongArrival: false,
  L(x, z) { return [MO.x + x, MO.z + z]; },
  build() {
    const B = new Batch(), GL = new Batch(), gl = new Batch();
    const L = (x, z) => [MO.x + x, MO.z + z];
    const bx = (b, x, y, z, w, h, d, c, o) => { const [X, Z] = L(x, z); b.box(X, y, Z, w, h, d, c, o); };
    const col = (x0, z0, x1, z1) => { const [a, b] = L(x0, z0), [c, d] = L(x1, z1); return Col.add(a, b, c, d); };
    const wallC = '#dfe3e6', ceilC = '#c9ced3';
    // floors
    { const [a, b] = L(-16, -22), [c, d] = L(16, -8); groundQuad('metro', a, b, c, d, 0, 1.5); }
    { const [a, b] = L(-30, -8), [c, d] = L(30, 4), _ = 0; groundQuad('metro', a, b, c, d, 0.001, 1.5); }
    // concourse walls
    bx(B, 0, 0, -22.2, 32.4, 4, 0.4, wallC); col(-16.2, -22.4, 16.2, -22);
    bx(B, -16.2, 0, -19.6, 0.4, 4, 5.2, wallC); bx(B, -16.2, 0, -10.4, 0.4, 4, 5.2, wallC); bx(B, -16.2, 3.0, -15, 0.4, 1, 4, wallC);
    col(-16.4, -22, -16, -8);
    bx(B, 16.2, 0, -19.6, 0.4, 4, 5.2, wallC); bx(B, 16.2, 0, -10.4, 0.4, 4, 5.2, wallC); bx(B, 16.2, 3.0, -15, 0.4, 1, 4, wallC);
    col(16, -22, 16.4, -17); col(16, -13, 16.4, -8); col(17.6, -17, 18, -13); col(16, -17.2, 18, -17); col(16, -13, 18, -12.8);
    // stairs: entry (west, going up out of view) and exit (east)
    for (let i = 0; i < 10; i++) { bx(B, -16.6 - i * 0.4, i * 0.3, -15, 0.4, 0.3, 3.6, '#a3a8ae'); bx(B, 16.6 + i * 0.4, i * 0.3, -15, 0.4, 0.3, 3.6, '#a3a8ae'); }
    bx(B, -18.5, 0, -16.9, 4, 4, 0.2, wallC); bx(B, -18.5, 0, -13.1, 4, 4, 0.2, wallC);
    bx(B, 18.5, 0, -16.9, 4, 4, 0.2, wallC); bx(B, 18.5, 0, -13.1, 4, 4, 0.2, wallC);
    bx(GL, 18.5, 3.9, -15, 4, 0.1, 3.6, '#ffffff');
    // concourse ceiling + lights
    bx(B, 0, 4, -15, 32.4, 0.3, 14.4, ceilC);
    for (let x = -12; x <= 12; x += 6) bx(GL, x, 3.92, -15, 3.5, 0.08, 0.4, '#ffffff');
    // ticket machines
    for (const x of [-10, -7.5]) { bx(B, x, 0, -21.4, 1.2, 1.9, 0.8, '#2b5f9e'); bx(GL, x, 1.1, -20.99, 0.8, 0.5, 0.02, '#9fe0ff'); col(x - 0.6, -22, x + 0.6, -21); }
    // gate line at z=-8 with three gates (x=-3,0,3)
    const gates = [-3, 0, 3];
    const cab = (x) => { bx(B, x, 0, -8, 0.32, 1.05, 1.6, '#9aa3ab'); bx(GL, x, 1.05, -8.6, 0.25, 0.02, 0.25, '#7dffb0'); };
    for (const x of [-3.6, -2.4, -0.6, 0.6, 2.4, 3.6]) cab(x);
    col(-30, -8.15, -3.6, -7.85); col(-2.4, -8.15, -0.6, -7.85); col(0.6, -8.15, 2.4, -7.85); col(3.6, -8.15, 30, -7.85);
    for (const [a, b] of [[-30, -3.7], [3.7, 30]]) bx(B, (a + b) / 2, 0, -8, b - a, 1.2, 0.08, '#8fb8c8');
    bx(B, -23, 0, -8, 14, 4.2, 0.3, wallC); bx(B, 23, 0, -8, 14, 4.2, 0.3, wallC);
    this.gates = gates.map((x) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.06), new THREE.MeshStandardMaterial({ color: 0xc23b3b, transparent: true, opacity: 0.8 }));
      const [X, Z] = L(x, -8); m.position.set(X, 0.7, Z); G.scene.add(m);
      return { x, mesh: m, col: col(x - 0.6, -8.1, x + 0.6, -7.9), open: 0 };
    });
    // platform walls, ceiling, lights
    bx(B, -30.2, 0, -2, 0.4, 4.5, 12, wallC); col(-30.4, -8, -30, 4);
    bx(B, 30.2, 0, -2, 0.4, 4.5, 12, wallC); col(30, -8, 30.4, 4);
    bx(B, 0, 4.5, -2, 60.8, 0.3, 12.4, ceilC);
    for (let x = -27; x <= 27; x += 6) bx(GL, x, 4.42, -1, 4.2, 0.08, 0.5, '#ffffff');
    for (const x of [-22, -11, 11, 22]) { bx(B, x, 0, -2.5, 0.9, 4.5, 0.9, '#cfd4d8'); col(x - 0.45, -2.95, x + 0.45, -2.05); }
    for (const x of [-16.5, 16.5]) { bx(B, x, 0.42, -5.5, 2.2, 0.08, 0.5, '#2b5f9e'); col(x - 1.1, -5.8, x + 1.1, -5.2); }
    // yellow line + tactile strip
    bx(B, 0, 0.005, 3.2, 60, 0.012, 0.16, '#f2c230', { ao: false });
    bx(B, 0, 0.005, 2.85, 60, 0.012, 0.3, '#d9c26a', { ao: false });
    // screen doors (glass wall at z=4 with door gaps at the train doors)
    this.doorXs = [-10, -3.5, 3.5, 10];
    let prev = -30;
    for (const dx of this.doorXs) { const a = prev, b = dx - 0.75; bx(B, (a + b) / 2, 0, 4, b - a, 0.2, 0.12, '#55606b'); bx(B, (a + b) / 2, 2.4, 4, b - a, 0.5, 0.15, '#55606b'); glassPane(a, b); col(a, 3.92, b, 4.08); prev = dx + 0.75; }
    bx(B, (prev + 30) / 2, 0, 4, 30 - prev, 0.2, 0.12, '#55606b'); bx(B, (prev + 30) / 2, 2.4, 4, 30 - prev, 0.5, 0.15, '#55606b'); glassPane(prev, 30); col(prev, 3.92, 30, 4.08);
    function glassPane(a, b) { const [X, Z] = L((a + b) / 2, 4); glassB.box(X, 0.2, Z, b - a, 2.2, 0.05, '#9fc4d8'); }
    this.screen = this.doorXs.map((dx) => {
      const mk = (s) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.2, 0.06), G.mat.glass); const [X, Z] = L(dx + s * 0.375, 4); m.position.set(X, 1.3, Z); G.scene.add(m); return m; };
      return { dx, a: mk(-1), b: mk(1), col: col(dx - 0.75, 3.92, dx + 0.75, 4.08) };
    });
    // track pit + far wall
    bx(B, 0, -1.3, 7, 64, 1.3, 6, '#2a2c30');
    bx(B, 0, -1.3, 10.1, 64, 6, 0.4, wallC);
    bx(B, 0, 4.5, 7, 64, 0.3, 6.4, ceilC);
    for (const x of [-31, 31]) bx(B, x, -1.3, 7, 2, 6, 6.2, '#111214');
    // dynamic accent material + station name panels
    this.accent = new THREE.MeshBasicMaterial({ color: STATIONS.neon.color, toneMapped: false });
    const stripe = (x, y, z, w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.accent); const [X, Z] = L(x, z); m.position.set(X, y, Z); G.scene.add(m); };
    stripe(0, 3.2, 9.85, 62, 0.35, 0.05); stripe(0, 3.0, -7.82, 61, 0.2, 0.05); stripe(0, 3.3, -21.95, 32, 0.25, 0.05);
    this.nameTex = {};
    for (const k of Object.keys(STATIONS)) this.nameTex[k] = signTexture({ cn: STATIONS[k].cn, en: STATIONS[k].en, bg: '#f4f6f8', fg: STATIONS[k].color, fg2: '#333', w: 512, h: 160 });
    this.namePanels = [];
    for (const x of [-20, 0, 20]) { const [X, Z] = L(x, 9.85); this.namePanels.push(makeSign(X, 1.6, Z, 5, 1.56, PI, this.nameTex.neon)); }
    for (const x of [-22, -11, 11, 22]) for (const s of [-1, 1]) { const [X, Z] = L(x, -2.5 + s * 0.47); this.namePanels.push(makeSign(X, 2.4, Z, 0.85, 0.27, s > 0 ? 0 : PI, this.nameTex.neon)); }
    { const [X, Z] = L(0, -21.95); this.namePanels.push(makeSign(X, 2.5, Z, 4, 1.25, 0, this.nameTex.neon)); }
    const ex = signTexture({ cn: '出口 →', en: 'Exit', bg: '#1c8c4c', fg: '#ffffff', w: 384, h: 128 });
    { const [X, Z] = L(15.9, -15); makeSign(X, 3.2, Z, 2, 0.66, -PI / 2, ex); }
    { const [X, Z] = L(8, -8.2); makeSign(X, 3.4, Z, 2, 0.66, PI, ex); }
    { const [X, Z] = L(-8, -7.8); makeSign(X, 3.4, Z, 2.4, 0.66, 0, signTexture({ cn: '乘车 ↓', en: 'To Trains', bg: '#2b5f9e', fg: '#fff', w: 384, h: 128 })); }
    // build station meshes
    const solid = B.build(G.mat.solid); solid.receiveShadow = true; G.scene.add(solid);
    const glow = GL.build(G.mat.glow); G.scene.add(glow);
    // tunnel shown during rides (walls just outside the train + scrolling lights)
    this.tunnel = new THREE.Group(); G.scene.add(this.tunnel);
    const tb = new Batch();
    tb.box(MO.x, -1.3, MO.z + 4.15, 140, 6, 0.1, '#17191c'); tb.box(MO.x, -1.3, MO.z + 8.65, 140, 6, 0.1, '#17191c');
    for (let x = -70; x < 70; x += 7) { tb.box(MO.x + x, 1.0, MO.z + 4.22, 0.4, 0.2, 0.05, '#454a50'); tb.box(MO.x + x, 1.0, MO.z + 8.58, 0.4, 0.2, 0.05, '#454a50'); }
    this.tunnel.add(tb.build(G.mat.solid));
    const tl = new Batch();
    for (let x = -70; x < 70; x += 6) { tl.box(MO.x + x, 2.0, MO.z + 4.25, 1.4, 0.12, 0.04, '#bfe4ff'); tl.box(MO.x + x + 3, 0.6, MO.z + 8.55, 1.4, 0.12, 0.04, '#ffd59a'); }
    this.tunnelLights = tl.build(G.mat.glow); this.tunnel.add(this.tunnelLights);
    this.tunnel.visible = false;
    this.buildTrain();
    // zones
    { const [a, b] = L(-16, -22), [c, d] = L(16, -8); Zones.rect('metro_concourse', a, b, c, d, { area: 'metro', cn: '地铁站', en: 'Metro Station', prio: 5 }); }
    { const [a, b] = L(-30, -7.8), [c, d] = L(30, 4); Zones.rect('metro_platform', a, b, c, d, { area: 'metro', cn: '站台', en: 'Platform', prio: 5 }); }
    { const [a, b] = L(-14.8, 4.45), [c, d] = L(14.8, 8.1); Zones.rect('metro_car', a, b, c, d, { area: 'metro', cn: '地铁车厢', en: 'Metro Car', prio: 6 }); }
    { const [a, b] = L(16.3, -16.8), [c, d] = L(18, -13.2); Zones.rect('metro_exit', a, b, c, d, { area: 'metro' }); }
    A.metroArrive = { x: MO.x - 13.5, z: MO.z - 15, yaw: -PI / 2 };
    A.metroGate = new THREE.Vector3(MO.x, 0, MO.z - 8);
    A.metroLine = new THREE.Vector3(MO.x - 3.5, 0, MO.z + 1.5);
    A.metroExit = new THREE.Vector3(MO.x + 17, 0, MO.z - 15);
    A.metroDoor = new THREE.Vector3(MO.x + 3.5, 0, MO.z + 5.5);
    A.attendant = { x: MO.x + 6, z: MO.z - 10.5, ry: -PI / 2 };
    A.platformPeople = [{ x: MO.x - 18, z: MO.z + 1.5, ry: 0 }, { x: MO.x + 7, z: MO.z + 2, ry: 0 }, { x: MO.x + 15, z: MO.z - 4, ry: PI / 2 }];
  },
  buildTrain() {
    const g = this.train = new THREE.Group(); G.scene.add(g);
    const B = new Batch(), GL = new Batch();
    const body = '#e9edf0', stripe = '#2b5f9e';
    const z0 = 4.3, z1 = 8.3, zc = 6.3;
    B.box(0, -0.9, zc, 30, 0.9, 4, '#3a3f45');
    B.box(0, -0.02, zc, 30, 0.04, 3.9, '#8e959c');
    // near wall pieces between door gaps
    let prev = -15;
    const doorXs = [-10, -3.5, 3.5, 10];
    const piece = (a, b, z) => { const c = (a + b) / 2, w = b - a; B.box(c, 0, z, w, 0.9, 0.12, body); B.box(c, 0.9, z, w, 1.1, 0.04, '#26313b'); B.box(c, 2.0, z, w, 0.6, 0.12, body); B.box(c, 0.72, z + (z < 6 ? -0.07 : 0.07), w, 0.12, 0.02, stripe); };
    for (const dx of doorXs) { piece(prev, dx - 0.7, z0); prev = dx + 0.7; }
    piece(prev, 15, z0); piece(-15, 15, z1);
    for (const dx of doorXs) B.box(dx, 2.0, z0, 1.4, 0.6, 0.12, body);
    B.box(0, 2.6, zc, 30, 0.3, 4.1, '#d9dee2');
    B.box(-15, 0, zc, 0.15, 2.6, 4, body);
    B.box(15.4, -0.9, zc, 0.8, 3.6, 4, body, { rz: -0.25 }); B.box(15.6, 0.9, zc, 0.06, 1.0, 3.2, '#26313b', { rz: -0.25 });
    GL.box(15.9, -0.4, zc - 1.4, 0.05, 0.25, 0.4, '#ffffff'); GL.box(15.9, -0.4, zc + 1.4, 0.05, 0.25, 0.4, '#ffffff');
    // interior: seats, poles, lights
    for (let i = 0; i < 5; i++) {
      const a = [-15, -9.3, -2.8, 4.2, 10.7][i], b = [-10.7, -4.2, 2.8, 9.3, 15][i];
      B.box((a + b) / 2, 0, z0 + 0.4, b - a - 0.3, 0.45, 0.5, '#2f6db5'); B.box((a + b) / 2, 0, z1 - 0.4, b - a - 0.3, 0.45, 0.5, '#2f6db5');
      B.box((a + b) / 2, 0.45, z0 + 0.2, b - a - 0.3, 0.5, 0.08, '#2f6db5'); B.box((a + b) / 2, 0.45, z1 - 0.2, b - a - 0.3, 0.5, 0.08, '#2f6db5');
    }
    for (const dx of doorXs) { B.cyl(dx, 0, zc, 0.03, 2.6, '#c0c6cc'); }
    B.box(0, 2.15, z0 + 0.8, 29, 0.03, 0.03, '#c0c6cc'); B.box(0, 2.15, z1 - 0.8, 29, 0.03, 0.03, '#c0c6cc');
    GL.box(0, 2.55, zc - 0.8, 28, 0.05, 0.2, '#ffffff'); GL.box(0, 2.55, zc + 0.8, 28, 0.05, 0.2, '#ffffff');
    const m = B.build(G.mat.solid); g.add(m);
    g.add(GL.build(G.mat.glow));
    // LED display texture
    this.ledCanvas = makeCanvas(512, 64); this.ledTex = new THREE.CanvasTexture(this.ledCanvas); this.ledTex.colorSpace = THREE.SRGBColorSpace;
    for (const dx of [-6.7, 6.7]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.3), new THREE.MeshBasicMaterial({ map: this.ledTex, toneMapped: false })); s.position.set(dx, 2.3, z1 - 0.13); s.rotation.y = PI; g.add(s); }
    this.setLED('欢迎乘坐地铁', 'Welcome aboard');
    // doors
    const dm = new THREE.MeshStandardMaterial({ color: 0xe9edf0, roughness: 0.5 });
    const wm = new THREE.MeshStandardMaterial({ color: 0x26313b, roughness: 0.2 });
    this.trainDoors = doorXs.map((dx) => {
      const mk = () => { const d = new THREE.Group(); const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.0, 0.08), dm); p.position.y = 1.0; d.add(p); const w = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.9, 0.09), wm); w.position.y = 1.35; d.add(w); g.add(d); return d; };
      return { dx, a: mk(), b: mk() };
    });
    // passengers inside (decor)
    this.seated = [];
    g.position.set(MO.x - 150, 0, MO.z);
    // train colliders (only matter when stopped at x=0; the screen doors guard otherwise)
    const col = (x0, zz0, x1, zz1) => Col.add(MO.x + x0, MO.z + zz0, MO.x + x1, MO.z + zz1);
    prev = -15;
    for (const dx of doorXs) { col(prev, 4.2, dx - 0.7, 4.42); prev = dx + 0.7; }
    col(prev, 4.2, 15, 4.42); col(-15, 8.2, 15, 8.45); col(-15.3, 4.2, -15, 8.4); col(15, 4.2, 15.3, 8.4);
    this.trainDoorCols = doorXs.map((dx) => col(dx - 0.7, 4.2, dx + 0.7, 4.42));
    this.setDoors(0);
  },
  setLED(cn, en) {
    const g = this.ledCanvas.getContext('2d');
    g.fillStyle = '#120a06'; g.fillRect(0, 0, 512, 64);
    g.fillStyle = '#ff9a2a'; g.font = `bold 30px ${FONT_CN}`; g.textBaseline = 'middle';
    g.fillText(cn, 14, 32); g.font = `bold 22px ${FONT_EN}`; g.textAlign = 'right'; g.fillText(en, 500, 33); g.textAlign = 'left';
    this.ledTex.needsUpdate = true;
  },
  setDoors(v) {
    this.door = v;
    for (const d of this.trainDoors) { d.a.position.set(d.dx - 0.35 - v * 0.68, 0, 4.3); d.b.position.set(d.dx + 0.35 + v * 0.68, 0, 4.3); }
    for (const s of this.screen) { s.a.position.x = MO.x + s.dx - 0.375 - v * 0.7; s.b.position.x = MO.x + s.dx + 0.375 + v * 0.7; s.col.on = v < 0.8; }
    for (const c of this.trainDoorCols) c.on = v < 0.8;
  },
  setStation(id) {
    this.station = id;
    for (const p of this.namePanels) { p.mat.map = this.nameTex[id]; p.mat.needsUpdate = true; }
    this.accent.color.set(STATIONS[id].color);
  },
  route() { return this.wrongWay ? ['neon', 'park', 'night'] : ['neon', 'night', 'park']; },
  nextStation() { const r = this.route(); return r[(r.indexOf(this.station) + 1) % 3]; },
  reset(station, o = {}) {
    this.setStation(station); this.origin = station; this.ridden = 0; this.wrongWay = !!o.wrongWay;
    this.state = 'empty'; this.t = 0; this.trainX = -150; this.train.position.x = MO.x - 150; this.setDoors(0);
    this.tunnel.visible = false; this.arrivalPending = -1; this.playerInside = false; this.holdOpen = true; this.boardT = 0; this.alighted = false; this.sway = 0;
    for (const gt of this.gates) { gt.open = 0; gt.col.on = true; gt.mesh.rotation.y = 0; }
    this.setLED('下一站：' + STATIONS[this.nextStation()].cn, 'Next: ' + STATIONS[this.nextStation()].en);
  },
  placeTrainOpen(station) { this.reset(station); this.state = 'open'; this.trainX = 0; this.train.position.x = MO.x; this.setDoors(1); this.doorTarget = 1; this.openT = 0; },
  callTrain(delay = 4, wrong = false) { if (this.state !== 'empty' || this.arrivalPending >= 0) return; this.arrivalPending = delay; this.wrongArrival = wrong; },
  update(dt, P) {
    this.t += dt;
    // gates open as you walk up
    for (const gt of this.gates) {
      const gx = MO.x + gt.x, gz = MO.z - 8;
      const near = P.area === 'metro' && Math.abs(P.pos.x - gx) < 0.9 && Math.abs(P.pos.z - gz) < 1.6;
      if (near && gt.open < 0.1) Sound.gateBeep();
      gt.open = damp(gt.open, near ? 1 : 0, 10, dt); gt.col.on = gt.open < 0.5;
      gt.mesh.scale.x = 1 - gt.open * 0.9; gt.mesh.material.color.set(gt.open > 0.5 ? 0x3bc27a : 0xc23b3b);
    }
    if (this.arrivalPending >= 0) {
      this.arrivalPending -= dt;
      if (this.arrivalPending < 0) {
        this.state = 'arriving'; this.t = 0; this.trainX = this.wrongArrival ? 150 : -150;
        this.train.rotation.y = 0; Sound.chime(); Sound.trainArrive(5, this.wrongArrival);
        if (this.wrongArrival) { this.wrongWay = true; UI.toast('本次列车反向运行', 'This train is running the wrong way', 4); setTimeout(() => Sound.sadHorn(), 1500); }
        else UI.toast('列车即将进站', 'Train arriving. Please stand behind the yellow line.', 3.5);
        this.setLED('下一站：' + STATIONS[this.nextStation()].cn, 'Next: ' + STATIONS[this.nextStation()].en);
      }
    }
    const inCar = P.area === 'metro' && Zones.contains(Zones.byId.metro_car, P.pos.x, P.pos.z);
    const wasInside = this.playerInside; this.playerInside = inCar;
    switch (this.state) {
      case 'arriving': {
        const k = clamp(this.t / 5, 0, 1), e = 1 - Math.pow(1 - k, 3);
        this.trainX = (this.wrongArrival ? 150 : -150) * (1 - e);
        if (k >= 1) { this.state = 'opening'; this.t = 0; Bus.emit('metroStopped', this.station); }
        break;
      }
      case 'opening':
        this.setDoors(clamp(this.t / 1.0, 0, 1));
        if (this.t >= 1) { this.state = 'open'; this.t = 0; this.openT = 0; Bus.emit('metroDoorsOpen', this.station); }
        break;
      case 'open':
        this.openT += dt;
        if (inCar) this.boardT += dt; else this.boardT = 0;
        if (!wasInside && inCar) Bus.emit('metroBoard', this.station);
        if (wasInside && !inCar && this.ridden > 0 && !this.alighted) { this.alighted = true; Bus.emit('metroAlight', this.station); }
        {
          let close = false;
          if (this.ridden === 0) close = this.boardT > 2.0;
          else if (this.alighted) close = this.openT > 2.5 && !inCar;
          else close = this.openT > 7 && inCar;
          if (close) { this.state = 'closing'; this.t = 0; Sound.doorBeeps(); }
        }
        break;
      case 'closing':
        this.setDoors(1 - clamp(this.t / 1.4, 0, 1));
        if (this.t >= 1.4) {
          this.setDoors(0); this.t = 0;
          if (inCar) { this.state = 'riding'; this.rideT = 0; this.tunnel.visible = true; Bus.emit('metroDepart', this.station); this.setLED('下一站：' + STATIONS[this.nextStation()].cn, 'Next: ' + STATIONS[this.nextStation()].en); }
          else { this.state = 'departing'; Sound.trainArrive(3.5); }
        }
        break;
      case 'riding': {
        this.rideT += dt;
        const D = 7.5, k = this.rideT / D;
        const speed = 28 * smoothstep(0, 0.25, k) * (1 - smoothstep(0.75, 1, k));
        this.tunnelLights.position.x = (this.tunnelLights.position.x - speed * dt * (this.wrongWay ? -1 : 1)) % 6;
        this.sway = Math.sin(this.rideT * 2.3) * 0.012 * (speed / 28) + Math.sin(this.rideT * 7.1) * 0.004 * (speed / 28);
        if (this.rideT > D) {
          this.sway = 0; this.tunnel.visible = false; this.ridden++;
          this.setStation(this.nextStation()); this.alighted = false;
          Sound.chime(); UI.toast(STATIONS[this.station].cn + ' 到了', STATIONS[this.station].en + '. Doors opening.', 3.5);
          this.setLED(STATIONS[this.station].cn + ' 到了', STATIONS[this.station].en);
          this.state = 'opening'; this.t = 0; Bus.emit('metroStop', { station: this.station, n: this.ridden });
        }
        break;
      }
      case 'departing': {
        const k = clamp(this.t / 4, 0, 1);
        this.trainX = 150 * k * k;
        if (k >= 1) { this.state = 'empty'; this.trainX = -150; }
        break;
      }
    }
    this.train.position.x = MO.x + this.trainX;
    this.train.visible = Math.abs(this.trainX) < 149;
  },
};
