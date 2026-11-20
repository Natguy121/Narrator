/* Consequences (harmless, funny), navigation + glowing hint trail, rules. */

const CONS_LINES = {
  stare: ['Everyone is staring. Smile. No. Do not smile. That is worse.', 'Now the whole street is looking at you. Congratulations, you are a landmark.', 'They are staring. They cannot hear me. They just know.', 'Silence. Total silence. Do you feel that? That is judgment.'],
  rearrange: ['Look what you did. The street rearranged itself.', 'Great. Everything moved. I had a map. I had a beautiful map.', 'The city reshuffled itself. It does that when you are rude.', 'And now nothing is where it was. The milk tea shop is a pharmacy. Thanks.'],
  floaty: ['Gravity has gone floaty. That is what happens. Everyone knows that.', 'Oh, now gravity is on holiday. Wonderful.', 'You are floating. It is a consequence. Enjoy it. But do not.', 'Feel lighter? That is guilt leaving your body. And gravity.'],
  flicker: ['The lights! Who touched the lights?', 'No no no no. That is not supposed to happen. Is that me? Am I doing that?', 'Everyone stay calm! I am calm! I am the calmest voice in this head!', 'Power is fine! It is fine! It is flickering because it is... artistic!'],
  dumplingChase: ['Oh no. The dumpling auntie saw that. Run. Or accept the dumpling.', 'There is a woman chasing you with a dumpling. I do not make the rules. I do. Not this one.', 'She is coming. With a dumpling. You cannot outrun generosity.', 'Dumpling incoming. This is what happens.'],
  rainCloud: ['You have your own personal rain cloud now. You earned it.', 'A tiny cloud. Just for you. Raining. On you.', 'The weather has opinions about you.', 'It is not raining. It is raining on you. Specifically.'],
  bigHeads: ['Why are everyone\'s heads enormous? Did you do that?', 'Big heads. Everyone. That is a consequence. Do not ask me how.', 'Oh dear. Everyone\'s head is huge now. Act normal.', 'Their heads are bigger than their opinions now.'],
  mono: ['I have switched you to black and white. Think about what you did.', 'No color for you. Like a sad old film.', 'Grayscale. You have been drained. Spiritually.', 'This is what disappointment looks like. In black and white.'],
  tilt: ['The street is tilted. You tilted it. With rudeness.', 'Everything is crooked now. Like your moral compass.', 'Lean into it. Literally. The world is leaning.', 'Hold on. The city is at an angle. Your fault.'],
  scooterCircle: ['Scooters. Circling you. Like sharks. Electric, honking sharks.', 'Beep beep. They know what you did.', 'The scooters are surrounding you. This is a scooter intervention.', 'Delivery riders. All of them. Circling. Judging.'],
  pigeons: ['The pigeons are upset. Look at them. Upset.', 'You scared the pigeons. They have families.', 'Pigeon explosion. That is on you.', 'Birds everywhere. A feathery consequence.'],
};

const Consequences = {
  floaty: 0, tilt: 0, mono: 0, rain: 0, flick: 0, heads: 0, circle: 0, recent: [],
  pool: ['stare', 'rearrange', 'floaty', 'flicker', 'dumplingChase', 'rainCloud', 'bigHeads', 'mono', 'tilt', 'scooterCircle', 'pigeons'],
  ok(name) {
    const surf = P.area === 'surface', indoor = P.in('noodle') || P.in('teahouse');
    if (['rearrange', 'scooterCircle', 'pigeons', 'rainCloud'].includes(name) && (!surf || indoor)) return false;
    if (name === 'rearrange' && !G.props.some((p) => p.mesh.position.distanceTo(P.pos) < 45)) return false;
    if (name === 'scooterCircle' && (P.in('hutong') || P.in('lane') || P.in('courtyard'))) return false;
    if (name === 'dumplingChase' && (Chaser.active || P.area !== 'surface')) return false;
    if (name === 'floaty' && this.floaty > 0) return false;
    if (name === 'mono' && this.mono > 0) return false;
    return true;
  },
  random(pref) {
    if (pref && this.ok(pref) && Math.random() < 0.6 && !this.recent.includes(pref)) return pref;
    const opts = this.pool.filter((n) => this.ok(n) && !this.recent.includes(n));
    return opts.length ? pick(opts) : pick(this.pool.filter((n) => this.ok(n))) || 'stare';
  },
  trigger(name) {
    this.recent.push(name); if (this.recent.length > 3) this.recent.shift();
    Sound.sting('consequence'); UI.flash('rgba(255,120,60,0.25)');
    Game.stats.consequences++;
    switch (name) {
      case 'stare': People.stareAll(6, P); Sound.duck(0.12, 4); Sound.recordScratch(); break;
      case 'rearrange': this.rearrange(); break;
      case 'floaty': this.floaty = 14; Sound.warble(); UI.tint('rgba(170,140,255,0.12)', 14); break;
      case 'flicker': this.flick = 3.2; Sound.buzz(3); break;
      case 'dumplingChase': Chaser.spawn({ look: 'auntie', item: 'dumpling', give: 'dumpling' }); break;
      case 'rainCloud': this.rain = 15; this.showCloud(true); break;
      case 'bigHeads': this.heads = 12; for (const n of NPCS) n.headScaleT = 2.3; Sound.boing(); break;
      case 'mono': this.mono = 9; $('#c').style.filter = 'grayscale(1) contrast(1.15) sepia(0.15)'; Sound.tone(200, 1.2, { type: 'triangle', glide: 90, gain: 0.08 }); break;
      case 'tilt': this.tilt = 8; Sound.tone(300, 0.8, { glide: 150, gain: 0.08 }); break;
      case 'scooterCircle': this.circle = 8; this.startCircle(); break;
      case 'pigeons': Pigeons.burst(P.pos.x, P.pos.z); break;
      case 'spicy': UI.tint('rgba(255,40,0,0.32)', 3.5); P.shake = 0.6; Sound.sizzle(); setTimeout(() => Sound.gasp(), 300); steamBurst(P.pos.x - Math.sin(P.yaw) * 0.6, P.pos.y + 1.4, P.pos.z - Math.cos(P.yaw) * 0.6, 16, 0.25); break;
      case 'gasp': People.stareAll(4, P); Sound.duck(0.2, 3); break;
    }
    return pick(CONS_LINES[name] || ['Consequences.']);
  },
  rearrange() {
    const near = G.props.filter((p) => p.mesh.position.distanceTo(P.pos) < 45 && !p.anim);
    const pos = near.map((p) => p.mesh.position.clone()), rot = near.map((p) => p.mesh.rotation.y);
    for (let i = pos.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * i); [pos[i], pos[j]] = [pos[j], pos[i]]; [rot[i], rot[j]] = [rot[j], rot[i]]; }
    near.forEach((p, i) => { p.anim = { from: p.mesh.position.clone(), to: pos[i], ry0: p.mesh.rotation.y, ry1: rot[i] + rand(-0.5, 0.5), t: 0 }; if (p.mesh.userData.col) p.mesh.userData.col.on = false; });
    // neon signs swap their faces too
    const signs = G.signs.filter((s) => s.rearrange && Math.hypot(s.x - P.pos.x, s.z - P.pos.z) < 60);
    const maps = signs.map((s) => s.mat.map);
    for (let i = maps.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * i); [maps[i], maps[j]] = [maps[j], maps[i]]; }
    signs.forEach((s, i) => { s.mat.map = maps[i]; s.mat.needsUpdate = true; });
    Sound.whoosh(); P.shake = 0.35;
  },
  showCloud(on) {
    if (!this.cloud) {
      const b = new Batch(); for (let i = 0; i < 6; i++) b.ball(sr(-0.9, 0.9), sr(-0.2, 0.2), sr(-0.6, 0.6), sr(0.5, 0.8), '#7d8590', { smooth: true });
      this.cloud = b.build(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })); G.scene.add(this.cloud);
      const n = 120, pos = new Float32Array(n * 6); this.drops = pos;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.rainLines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xa8c8ff, transparent: true, opacity: 0.6 })); this.rainLines.frustumCulled = false; G.scene.add(this.rainLines);
      for (let i = 0; i < n; i++) pos[i * 6 + 1] = Math.random() * 3;
    }
    this.cloud.visible = on; this.rainLines.visible = on;
  },
  startCircle() {
    if (!this.scooters) { this.scooters = [0, 1, 2].map(() => { const g = vehicleMesh('scooter'); const r = makePerson({ shirt: '#f2c230', hat: 'helmet', hatColor: '#f2c230' }); r.hips.position.y = 0.72; r.legL.rotation.x = r.legR.rotation.x = -1.2; r.armL.rotation.x = r.armR.rotation.x = -1.1; r.root.rotation.y = PI / 2; r.root.position.x = -0.2; g.add(r.root); G.scene.add(g); return g; }); }
    this.scooters.forEach((s) => (s.visible = true)); this.circleA = 0; this.beepT = 0;
  },
  update(dt) {
    if (this.floaty > 0) this.floaty -= dt;
    if (this.tilt > 0) this.tilt -= dt;
    if (this.mono > 0) { this.mono -= dt; if (this.mono <= 0) $('#c').style.filter = ''; }
    if (this.flick > 0) { this.flick -= dt; G.flicker = this.flick > 0 ? 1 : 0; }
    if (this.heads > 0) { this.heads -= dt; if (this.heads <= 0) for (const n of NPCS) n.headScaleT = 1; }
    for (const p of G.props) if (p.anim) {
      const a = p.anim; a.t += dt / 1.4; const k = smoothstep(0, 1, a.t);
      p.mesh.position.lerpVectors(a.from, a.to, k); p.mesh.position.y = a.from.y + Math.sin(k * PI) * 2.2;
      p.mesh.rotation.y = lerp(a.ry0, a.ry1, k);
      if (a.t >= 1) { p.mesh.position.copy(a.to); p.anim = null; if (p.mesh.userData.col) { const c = p.mesh.userData.col, w = c.x1 - c.x0, d = c.z1 - c.z0; c.x0 = a.to.x - w / 2; c.x1 = a.to.x + w / 2; c.z0 = a.to.z - d / 2; c.z1 = a.to.z + d / 2; } }
    }
    if (this.rain > 0) {
      this.rain -= dt;
      if (this.rain <= 0) this.showCloud(false);
      else {
        this.cloud.position.set(P.pos.x, P.pos.y + 3.6 + Math.sin(Narrator.t * 2) * 0.1, P.pos.z);
        const d = this.drops;
        for (let i = 0; i < d.length / 6; i++) {
          let y = d[i * 6 + 1] - dt * 9; if (y < 0) { y = 3.2; d[i * 6] = rand(-1, 1); d[i * 6 + 2] = rand(-0.8, 0.8); }
          d[i * 6 + 1] = y; d[i * 6 + 3] = d[i * 6]; d[i * 6 + 4] = y + 0.25; d[i * 6 + 5] = d[i * 6 + 2];
        }
        this.rainLines.position.set(P.pos.x, P.pos.y, P.pos.z);
        this.rainLines.geometry.attributes.position.needsUpdate = true;
      }
    }
    if (this.circle > 0) {
      this.circle -= dt; this.circleA += dt * 1.6; this.beepT -= dt;
      this.scooters.forEach((s, i) => { const a = this.circleA + i * TAU / 3; s.position.set(P.pos.x + Math.cos(a) * 3.4, groundY(P.pos.x, P.pos.z, 'surface'), P.pos.z + Math.sin(a) * 3.4); s.rotation.y = -a - PI; });
      if (this.beepT < 0) { this.beepT = rand(0.5, 1.1); Sound.scooterBeep(rand(-0.8, 0.8)); }
      if (this.circle <= 0) this.scooters.forEach((s) => (s.visible = false));
    }
  },
  clear() {
    this.floaty = this.tilt = this.mono = this.rain = this.flick = this.heads = 0; this.circle = 0; if (this.scooters) this.scooters.forEach((s) => (s.visible = false));
    $('#c').style.filter = ''; G.flicker = 0; if (this.cloud) this.showCloud(false);
    for (const n of NPCS) { n.headScaleT = 1; n.stareT = 0; }
    UI.tint(null);
  },
};

/* A vendor running after you with something (a dumpling, your change...). */
const Chaser = {
  npc: null, active: false, t: 0,
  spawn(o = {}) {
    if (!this.npc) {
      this.npc = addNPC({ id: 'chaser', x: 0, z: 0, behavior: 'chaser', speed: 5.2, look: { shirt: '#c0392b', apron: '#f4f4f4', hairStyle: 'bun', hair: '#9a9a9a' }, item: 'dumpling', interact: false });
    }
    const n = this.npc; const fw = P.forward;
    let sx = P.pos.x - fw.x * 11, sz = P.pos.z - fw.z * 11;
    for (let k = 0; k < 8 && (Col.pointBlocked(sx, sz, 0.4) || !Col.segmentClear(sx, sz, P.pos.x, P.pos.z, 0.2)); k++) { const a = k * PI / 4; sx = P.pos.x + Math.cos(a) * 8; sz = P.pos.z + Math.sin(a) * 8; }
    n.pos.set(sx, 0, sz); n.area = P.area; n.hidden = false; n.behavior = 'chaser'; n.speed = o.speed || 5.2;
    n.item.visible = o.item !== 'none';
    this.give = o.give || 'dumpling'; this.say = o.say || ['拿着！拿着！', 'Take it! Take it!']; this.onCatch = o.onCatch;
    this.active = true; this.t = 0; Game.stats.chased = true;
    setTimeout(() => npcBubble(n, o.call || ['等一下！', 'Wait!'], 2), 300);
  },
  update(dt) {
    if (!this.active) return;
    const n = this.npc; this.t += dt;
    n.target = [P.pos.x, P.pos.z];
    if (P.area !== n.area) { this.end(); return; }
    // stay out of walls: if blocked, hop toward the player
    if (Col.pointBlocked(n.pos.x, n.pos.z, 0.2)) { n.pos.x = lerp(n.pos.x, P.pos.x, 0.1); n.pos.z = lerp(n.pos.z, P.pos.z, 0.1); }
    const d = Math.hypot(P.pos.x - n.pos.x, P.pos.z - n.pos.z);
    if (d < 1.4) {
      npcBubble(n, this.say, 2.4); Sound.pay();
      if (this.give === 'dumpling') { Game.inv.dumplings++; UI.floatIcon('🥟', n.root.position, '#fff'); UI.inventory(); }
      if (this.onCatch) this.onCatch();
      this.leave();
    } else if (this.t > 22) { npcBubble(n, ['哎呀，算了！', 'Oh, forget it!'], 2); this.leave(); }
  },
  leave() { const n = this.npc; this.active = false; n.behavior = 'goto'; n.speed = 1.4; const fw = P.forward; n.target = [n.pos.x - fw.x * 8, n.pos.z - fw.z * 8]; n.onArrive = (m) => { m.hidden = true; }; setTimeout(() => { n.hidden = true; }, 7000); },
  end() { this.active = false; if (this.npc) this.npc.hidden = true; },
};

/* ---------------- Navigation graph + glowing hint trail ---------------- */
const NAV = {
  n: {}, adj: {},
  add(id, x, z, area = 'surface') { this.n[id] = { id, x, z, area }; this.adj[id] = this.adj[id] || []; },
  link(a, b, cond) { this.adj[a].push({ to: b, cond }); this.adj[b].push({ to: a, cond }); },
  chain(ids) { for (let i = 0; i < ids.length - 1; i++) this.link(ids[i], ids[i + 1]); },
  build() {
    const A_ = (id, x, z) => this.add(id, x, z);
    A_('home', 0, 57.8); A_('lane_s', 0, 48); A_('lane_m', -1, 32); A_('lane_n', -1, 12);
    this.chain(['home', 'lane_s', 'lane_m', 'lane_n']);
    const sx = [-70, -58, -48, -38, -23, -10, 0, 14, 30, 50, 70];
    sx.forEach((x) => A_('s' + x, x, 6.6)); this.chain(sx.map((x) => 's' + x));
    const nx = [-70, -62, -50, -38, -23, -10, 0, 14, 30, 50, 70];
    nx.forEach((x) => A_('n' + x, x, -6.3)); this.chain(nx.map((x) => 'n' + x));
    this.link('lane_n', 's0'); this.link('s0', 'n0'); this.link('s-48', 'n-50');
    A_('noodle_door', -23.3, -8.9); A_('noodle_in', -23.3, -12.5); A_('noodle_window', -27.8, -11.6); A_('noodle_queue', -19.6, -9.8); A_('noodle_front', -19.7, -14.3);
    this.link('n-23', 'noodle_door'); this.link('noodle_door', 'noodle_in'); this.link('noodle_in', 'noodle_window'); this.link('noodle_door', 'noodle_queue'); this.link('noodle_queue', 'noodle_front');
    A_('h_gate', -50, -9.6); A_('h_m', -50, -24); A_('h_T', -50, -40); A_('h_w', -60, -40); A_('tea_door', -66, -40.2); A_('tea_in', -66, -44.5); A_('tea_master', -65.5, -46.9);
    A_('h_e', -46, -40); A_('cy_gate', -42.5, -40); A_('cy_c', -37, -42.5); A_('cy_moon', -31.5, -46); A_('passage', -23, -46); A_('temple_moon', -15, -46); A_('temple_w', -11.5, -46);
    this.link('n-50', 'h_gate'); this.chain(['h_gate', 'h_m', 'h_T', 'h_w', 'tea_door', 'tea_in', 'tea_master']); this.link('h_T', 'h_e');
    this.link('h_e', 'cy_gate', () => G.cyGate.open > 0.5); this.chain(['cy_gate', 'cy_c', 'cy_moon', 'passage', 'temple_moon', 'temple_w']);
    A_('plaza_s', 0, -9.2); A_('plaza_m', 0, -20); A_('temple_gate', 0, -29.6); A_('temple_in', 0, -34); A_('temple_c', -4.6, -38.4); A_('temple_sw', -11, -38.2); A_('tree', -6.1, -42.3);
    this.link('n0', 'plaza_s'); this.chain(['plaza_s', 'plaza_m', 'temple_gate', 'temple_in', 'temple_c', 'tree']); this.link('temple_c', 'temple_sw'); this.link('temple_sw', 'temple_w');
    A_('park_gate', 50, -9.6); A_('park_m', 50, -20); A_('taichi', 54.5, -29.5); A_('park_e', 62, -29.8); A_('park_metro', 70, -27.6);
    this.link('n50', 'park_gate'); this.chain(['park_gate', 'park_m', 'taichi', 'park_e', 'park_metro']);
    A_('nm_gate', 50, 8.4); A_('nm_m', 50, 26); A_('nm_dump', 46.6, A.dumplingAuntie.z); A_('nm_s', 50, 46); A_('nm_metro', 50, 49);
    this.link('s50', 'nm_gate'); this.chain(['nm_gate', 'nm_m', 'nm_s', 'nm_metro']); this.link('nm_m', 'nm_dump');
    A_('mk_gate', -58, 9.8); A_('mk_c', -58, 15); A_('mk_fruit', -61.3, 17.5);
    this.link('s-58', 'mk_gate'); this.chain(['mk_gate', 'mk_c', 'mk_fruit']);
    A_('metro_neon', 14, 9.2); this.link('s14', 'metro_neon');
    const M = (id, x, z) => this.add(id, MO.x + x, MO.z + z, 'metro');
    M('m_arrive', -13.5, -15); M('m_conc', 0, -14); M('m_gate', 0, -8); M('m_plat', 0, -3); M('m_line', -3.5, 1.8); M('m_door', -3.5, 4.9); M('m_car', -3.5, 6.3); M('m_exitin', 13, -15); M('m_exit', 17, -15);
    this.chain(['m_arrive', 'm_conc', 'm_gate', 'm_plat', 'm_line', 'm_door', 'm_car']); this.link('m_conc', 'm_exitin'); this.link('m_exitin', 'm_exit');
  },
  nearest(x, z, area) {
    let best = null, bd = 1e9, fallback = null, fd = 1e9;
    for (const id in this.n) {
      const nd = this.n[id]; if (nd.area !== area) continue;
      const d = Math.hypot(nd.x - x, nd.z - z);
      if (d < fd) { fd = d; fallback = id; }
      if (d < bd && d < 40 && Col.segmentClear(x, z, nd.x, nd.z, 0.15)) { bd = d; best = id; }
    }
    return best || fallback;
  },
  path(a, b) {
    const dist = { [a]: 0 }, prev = {}, open = new Set([a]);
    while (open.size) {
      let u = null, ud = 1e9; for (const k of open) if (dist[k] < ud) { ud = dist[k]; u = k; }
      open.delete(u); if (u === b) break;
      for (const e of this.adj[u]) {
        if (e.cond && !e.cond()) continue;
        const nd = ud + Math.hypot(this.n[u].x - this.n[e.to].x, this.n[u].z - this.n[e.to].z);
        if (dist[e.to] === undefined || nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; open.add(e.to); }
      }
    }
    if (a !== b && !prev[b]) return null;
    const out = [b]; let c = b; while (c !== a) { c = prev[c]; out.unshift(c); }
    return out.map((id) => this.n[id]);
  },
};

const Hints = {
  target: null, visible: false, N: 70, t: 0, recalc: 0,
  build() {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.N * 3); this.col = new Float32Array(this.N * 3);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, fogToBlack(new THREE.PointsMaterial({ size: 0.55, map: TEX.halo, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
    this.points.frustumCulled = false; this.points.renderOrder = 5; G.scene.add(this.points);
    const bm = new THREE.MeshBasicMaterial({ map: TEX.beam, color: 0xffd27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 14, 16, 1, true), bm); this.beam.geometry.translate(0, 7, 0);
    const rm = new THREE.MeshBasicMaterial({ map: TEX.ring, color: 0xffd27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.ring = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), rm); this.ring.rotation.x = -PI / 2;
    this.arrow = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 4), new THREE.MeshBasicMaterial({ color: 0xffd27a, toneMapped: false })); this.arrow.rotation.x = PI;
    G.scene.add(this.beam, this.ring, this.arrow);
    this.hide();
  },
  show(t) { if (!t) return; this.target = t; this.visible = true; this.recalc = 0; },
  hide() { this.visible = false; this.target = null; this.points.visible = this.beam.visible = this.ring.visible = this.arrow.visible = false; UI.edgeArrow(null); UI.lookHint(false); },
  resolve(t) { // -> {x,y,z,area,node?}
    if (t.look) return null;
    if (t.node) { const n = NAV.n[t.node]; return { x: n.x, y: t.y || 0, z: n.z, area: n.area, node: t.node, obj: t.obj }; }
    if (t.inter) { const it = Inter.get(t.inter); return it ? { x: it.x, y: it.y, z: it.z, area: it.area, obj: true } : null; }
    if (t.npc) { const n = NPCById[t.npc]; return n ? { x: n.pos.x, y: 1.9, z: n.pos.z, area: n.area, obj: true } : null; }
    if (t.pos) return { x: t.pos.x, y: t.pos.y || 0, z: t.pos.z, area: t.area || 'surface', obj: !!t.obj };
    return null;
  },
  update(dt) {
    this.t += dt;
    if (!this.visible || !this.target) return;
    const t = this.target;
    if (t.look) { UI.lookHint(true); this.points.visible = this.beam.visible = this.ring.visible = this.arrow.visible = false; return; }
    const r = this.resolve(t); if (!r) return;
    let goal = r;
    // cross-area routing (metro <-> surface)
    if (r.area !== P.area) {
      if (P.area === 'metro') goal = { x: NAV.n.m_exit.x, y: 0, z: NAV.n.m_exit.z, area: 'metro', node: 'm_exit' };
      else goal = { x: NAV.n.metro_neon.x, y: 0, z: NAV.n.metro_neon.z, area: 'surface', node: 'metro_neon' };
    }
    this.recalc -= dt;
    if (this.recalc <= 0 || !this.poly) {
      this.recalc = 0.5;
      const start = NAV.nearest(P.pos.x, P.pos.z, P.area);
      const endN = goal.node || NAV.nearest(goal.x, goal.z, goal.area);
      let poly = [{ x: P.pos.x, z: P.pos.z }];
      const direct = Math.hypot(goal.x - P.pos.x, goal.z - P.pos.z) < 30 && Col.segmentClear(P.pos.x, P.pos.z, goal.x, goal.z, 0.2);
      if (!direct && start && endN) {
        const path = NAV.path(start, endN);
        if (path) { // skip nodes we can already see past
          let i = 0; while (i < path.length - 1 && Col.segmentClear(P.pos.x, P.pos.z, path[i + 1].x, path[i + 1].z, 0.2) && Math.hypot(path[i + 1].x - P.pos.x, path[i + 1].z - P.pos.z) < 25) i++;
          for (let k = i; k < path.length; k++) poly.push(path[k]);
        }
      }
      poly.push({ x: goal.x, z: goal.z });
      this.poly = poly;
    }
    // lay dots along the polyline
    let k = 0, carry = 1.4;
    const gy = P.area === 'surface' ? 0 : 0;
    for (let s = 0; s < this.poly.length - 1 && k < this.N; s++) {
      const a = this.poly[s], b = this.poly[s + 1]; const L = Math.hypot(b.x - a.x, b.z - a.z);
      let d = carry;
      while (d < L && k < this.N) {
        const x = lerp(a.x, b.x, d / L), z = lerp(a.z, b.z, d / L);
        const wave = 0.45 + 0.55 * Math.max(0, Math.sin(this.t * 4 - k * 0.45));
        this.pos.set([x, groundY(x, z, P.area) + 0.18 + Math.sin(this.t * 3 + k * 0.6) * 0.04, z], k * 3);
        this.col.set([1.0 * wave, 0.78 * wave, 0.38 * wave], k * 3);
        k++; d += 1.1;
      }
      carry = d - L;
    }
    for (let i = k; i < this.N; i++) this.pos[i * 3 + 1] = -999;
    this.points.geometry.attributes.position.needsUpdate = true; this.points.geometry.attributes.color.needsUpdate = true;
    this.points.visible = true;
    const sameArea = r.area === P.area;
    this.beam.visible = sameArea && !r.obj; this.ring.visible = sameArea; this.arrow.visible = sameArea && !!r.obj;
    this.beam.position.set(r.x, groundY(r.x, r.z, r.area), r.z); this.beam.material.opacity = 0.5 + 0.2 * Math.sin(this.t * 3);
    this.ring.position.set(r.x, (r.obj ? r.y - 0.2 : groundY(r.x, r.z, r.area) + 0.05), r.z); this.ring.scale.setScalar(1 + 0.25 * Math.sin(this.t * 4));
    if (r.obj) this.ring.position.y = Math.max(0.05, r.y - 0.4);
    this.arrow.position.set(r.x, r.y + 0.75 + Math.sin(this.t * 5) * 0.12, r.z); this.arrow.rotation.y += dt * 2;
    // edge arrow when the goal is off screen
    const v = new THREE.Vector3(goal.x, (goal.y || 0) + 1, goal.z).project(G.camera);
    const off = v.z > 1 || Math.abs(v.x) > 0.95 || Math.abs(v.y) > 0.95;
    UI.edgeArrow(off ? v : null);
  },
};

/* ---------------- Rules ---------------- */
const RULE_DEFS = {
  walk_left: { text: 'Only walk on the left side of the lane.', say: 'New rule. Only walk on the left side of the lane.', pref: 'bigHeads',
    check(dt, r) { return P.in('lane') && P.hspeed > 1 && P.pos.x > 0.35; }, limit: 1.4,
    lines: ['Left. The other left. My left. Your left. Left.', 'That is the right side. Which is the wrong side.', 'The right side is for bicycles and people who do not listen.'] },
  never_stop: { text: 'Never stop moving.', say: 'New rule. Never stop moving.', pref: 'rearrange',
    check(dt, r) { return P.hspeed < 0.3 && !P.seat && !Game.overlayOpen() && Math.abs(P.yawRate) < 0.4; }, limit: 2.8,
    lines: ['You stopped. I said never. Never is a long time, I know.', 'Keep moving! Like a shark. A polite shark.', 'Stopping is for people without rules.'] },
  dont_look_up: { text: 'Don\'t look up.', say: 'New rule. Do not look up.', pref: 'flicker',
    check() { return P.pitch > 0.62; }, limit: 0.5,
    lines: ['I said do not look up! There is nothing up there! Do not check!', 'Eyes down! The ceiling is private.', 'Why do you always look up? What do you think is up there? Me?'] },
  no_talking: { text: 'Don\'t talk to anyone.', say: 'New rule. Do not talk to anyone.', pref: 'stare',
    event(type, d) { return type === 'greet' && d && d.kind === 'npc'; },
    lines: ['You spoke. Out loud. To a human.', 'Words! You used words! The rule said none!', 'Talking is for people who did not read the rules.'] },
  walk_slowly: { text: 'Walk slowly in the hutong.', key: 'hold C', keyTouch: 'push the stick gently', say: 'New rule. Walk slowly in the hutong. Hold C. The alleys are old. They startle easily.', pref: 'rainCloud', warnFirst: 'Slowly! Hold C! The hutong is sleeping.',
    check() { return P.in('hutong') && P.hspeed > 2.6; }, limit: 1.1,
    lines: ['Slowly! The hutong is old. It startles easily.', 'Slow down. The bricks are napping.', 'This alley is six hundred years old. It does not do fast.'] },
  do_opposite: { text: 'Do the opposite of what I say.', say: 'New rule. Do the opposite of what I say.', pref: 'tilt',
    lines: ['The opposite! The rule says the opposite! Of what I say! Which is this!', 'You did what I said. Which, under the rules, means you did not. Keep up.', 'Read the rule again. Slowly. Then do the opposite of reading it.'] },
  no_running: { text: 'No running.', say: 'New rule. No running.', pref: 'floaty',
    check() { return P.running && P.hspeed > 5.5; }, limit: 0.6,
    lines: ['No running! This is a sacred space. And a slippery one.', 'Walk. Like a civilized ghost.', 'Running is how accidents happen. And consequences. Mostly consequences.'] },
  no_jumping: { text: 'No jumping.', say: 'New rule. No jumping.', pref: 'bigHeads',
    event(type) { return type === 'jump'; },
    lines: ['You jumped. In a temple. The pigeons saw.', 'Feet on the ground. Both of them. Always.', 'That was a jump. A hop. An offense.'] },
  no_backwards: { text: 'Never walk backwards.', say: 'New rule. Never walk backwards.', pref: 'tilt',
    check() { return P.backwards; }, limit: 0.7,
    lines: ['Backwards! Like a crab. A rule breaking crab.', 'Face where you are going. It is polite.', 'Moonwalking is not walking. It is worse.'] },
  hold_breath: { text: 'Hold your breath in the metro.', key: 'hold H', keyTouch: 'hold the breath button', say: 'New rule. Hold your breath in the metro. Hold H. It is perfectly safe. Everyone does it.', pref: 'gasp', lie: true, maxBreaks: 2, concede: 'Fine. Breathe. Breathe! That rule was ambitious. I may have lied about it being safe.',
    check() { return P.area === 'metro' && !P.holding && Metro.state !== 'empty' && !Game.overlayOpen(); }, limit: 3.2, resetWhen: () => P.holding,
    event(type) { return type === 'gasp' && P.area === 'metro'; },
    lines: ['Breathe— no, do not breathe! Hold it!', 'You breathed. Loudly. On public transport.', 'I said hold your breath. It is perfectly safe. Probably.'] },
};
const Rules = {
  active: [],
  has(id) { return this.active.some((r) => r.id === id); },
  set(ids, o = {}) {
    const keep = this.active.filter((r) => ids.includes(r.id));
    const added = ids.filter((id) => !this.has(id));
    const removed = this.active.filter((r) => !ids.includes(r.id));
    this.active = keep.concat(added.map((id) => ({ id, def: RULE_DEFS[id], acc: 0, cd: 3, warned: false })));
    UI.rules(this.active, added, removed.map((r) => r.id));
    if (added.length) { Sound.sting('rule'); UI.flash('rgba(255,210,120,0.22)'); }
    return added;
  },
  add(id) { if (!this.has(id)) return this.set(this.active.map((r) => r.id).concat([id])); return []; },
  remove(id) { this.set(this.active.map((r) => r.id).filter((x) => x !== id)); },
  clear() { this.set([]); },
  update(dt) {
    if (Game.state !== 'play' || Game.silenceMode) return;
    for (const r of this.active) {
      r.cd -= dt;
      if (!r.def.check) continue;
      if (r.def.resetWhen && r.def.resetWhen()) { r.acc = 0; continue; }
      if (r.def.check(dt, r)) r.acc += dt; else r.acc = Math.max(0, r.acc - dt * 0.5);
      if (r.acc > r.def.limit && r.cd <= 0) this.broken(r);
    }
  },
  event(type, d) {
    if (Game.silenceMode) return;
    for (const r of this.active) if (r.def.event && r.cd <= 0 && r.def.event(type, d)) this.broken(r);
  },
  violate(id) { const r = this.active.find((x) => x.id === id); if (r) this.broken(r, true); },
  broken(r, force) {
    r.acc = 0; r.cd = 9;
    if (r.def.warnFirst && !r.warned && !force) { r.warned = true; r.cd = 4; Narrator.say(r.def.warnFirst, { prio: 2 }); UI.ruleWarn(r.id); return; }
    Game.stats.rulesBroken++; Game.annoy(7);
    r.count = (r.count || 0) + 1;
    if (r.def.maxBreaks && r.count >= r.def.maxBreaks) setTimeout(() => { if (this.has(r.id)) { this.remove(r.id); Narrator.say(r.def.concede, { prio: 2 }); } }, 3500);
    UI.ruleBroken(r.id); Sound.sting('break');
    const cons = Consequences.random(r.def.pref === 'gasp' ? 'stare' : r.def.pref);
    const cl = Consequences.trigger(r.def.pref === 'gasp' ? 'gasp' : cons);
    if (r.def.pref === 'gasp' && cons !== 'stare') Consequences.trigger(cons);
    if (r.def.lie && !r.lieSaid) { r.lieSaid = true; Game.stats.lies++; setTimeout(() => Narrator.react('lie'), 2500); }
    const line = Math.random() < 0.5 ? pick(r.def.lines) : (Math.random() < 0.5 ? cl : Narrator.line('ruleBroken'));
    Narrator.say(cons === 'flicker' ? pick(CONS_LINES.flicker) : line, { prio: 2 });
    Bus.emit('ruleBroken', r.id);
  },
};
