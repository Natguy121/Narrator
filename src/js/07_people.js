/* People, animals and traffic. Person models face +Z at ry=0; facing vector = (sin ry, cos ry). */

const NPCS = [];
const NPCById = {};
const _geoCache = new Map();
function partGeo(key, build) {
  let g = _geoCache.get(key);
  if (!g) { const b = new Batch(); build(b); g = b.build(G.mat.npc).geometry; _geoCache.set(key, g); }
  return g;
}
function makePerson(o = {}) {
  const s = o.scale || 1, skin = o.skin || spick(PAL.skin), shirt = o.shirt || spick(PAL.shirt), pants = o.pants || spick(PAL.pants);
  const hair = o.hair || (o.elder ? spick(['#c9c9c9', '#e2e2e2', '#9a9a9a']) : spick(['#1a1a1a', '#2b2018', '#3a2a1e', '#1a1a1a']));
  const style = o.hairStyle || spick(['short', 'short', 'bob', 'bun', 'cap', 'long']);
  const root = new THREE.Group();
  const hips = new THREE.Group(); hips.position.y = 0.82 * s; root.add(hips);
  const legG = partGeo(`leg|${pants}|${s}|${o.dress || ''}`, (b) => { b.box(0, -0.8 * s, 0.02, 0.17 * s, 0.8 * s, 0.19 * s, pants, { ao: false }); b.box(0, -0.82 * s, 0.05 * s, 0.18 * s, 0.1 * s, 0.26 * s, o.shoes || '#2a2a2a', { ao: false }); });
  const mk = (g) => { const m = new THREE.Mesh(g, G.mat.npc); m.castShadow = true; return m; };
  const legL = mk(legG), legR = mk(legG); legL.position.x = -0.1 * s; legR.position.x = 0.1 * s; hips.add(legL, legR);
  const torso = new THREE.Group(); hips.add(torso);
  const torsoG = partGeo(`torso|${shirt}|${s}|${o.apron || ''}|${o.dress || ''}|${o.uniform || ''}`, (b) => {
    b.box(0, 0, 0, 0.46 * s, 0.62 * s, 0.26 * s, shirt, { ao: false });
    if (o.dress) b.box(0, -0.42 * s, 0, 0.5 * s, 0.45 * s, 0.3 * s, o.dress, { ao: false });
    if (o.apron) b.box(0, -0.2 * s, 0.135 * s, 0.38 * s, 0.6 * s, 0.02, o.apron, { ao: false });
    if (o.uniform) { b.box(0, 0.45 * s, 0.134 * s, 0.12 * s, 0.15 * s, 0.01, '#f2f2f2', { ao: false }); b.box(0, 0.06 * s, 0.135 * s, 0.03, 0.4 * s, 0.01, o.uniform, { ao: false }); }
    b.box(0, 0.56 * s, 0, 0.12 * s, 0.08 * s, 0.12 * s, skin, { ao: false });
  });
  torso.add(mk(torsoG));
  const armG = partGeo(`arm|${shirt}|${skin}|${s}`, (b) => { b.box(0, -0.52 * s, 0, 0.12 * s, 0.52 * s, 0.14 * s, shirt, { ao: false }); b.box(0, -0.64 * s, 0, 0.1 * s, 0.13 * s, 0.11 * s, skin, { ao: false }); });
  const armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-0.3 * s, 0.56 * s, 0); armR.position.set(0.3 * s, 0.56 * s, 0);
  armL.add(mk(armG)); armR.add(mk(armG)); torso.add(armL, armR);
  const head = new THREE.Group(); head.position.y = 0.62 * s; torso.add(head);
  const headG = partGeo(`head|${skin}|${hair}|${style}|${s}|${o.hat || ''}|${o.glasses ? 1 : 0}|${o.beard ? 1 : 0}`, (b) => {
    const H = 0.3 * s;
    b.box(0, 0, 0, 0.27 * s, H, 0.27 * s, skin, { ao: false });
    b.box(-0.06 * s, H * 0.55, 0.136 * s, 0.045 * s, 0.05 * s, 0.01, '#141414', { ao: false });
    b.box(0.06 * s, H * 0.55, 0.136 * s, 0.045 * s, 0.05 * s, 0.01, '#141414', { ao: false });
    b.box(0, H * 0.25, 0.136 * s, 0.07 * s, 0.02 * s, 0.01, '#8a4a3a', { ao: false });
    if (o.glasses) { b.box(0, H * 0.56, 0.142 * s, 0.24 * s, 0.07 * s, 0.01, '#222', { ao: false }); }
    if (o.beard) b.box(0, H * 0.05, 0.13 * s, 0.2 * s, 0.1 * s, 0.03, hair, { ao: false });
    if (style !== 'bald') b.box(0, H * 0.82, -0.01, 0.29 * s, 0.1 * s, 0.29 * s, hair, { ao: false });
    if (style === 'short' || style === 'bob' || style === 'long' || style === 'bun') b.box(0, H * 0.35, -0.12 * s, 0.29 * s, H * 0.6, 0.06 * s, hair, { ao: false });
    if (style === 'bob') { b.box(-0.14 * s, H * 0.3, 0, 0.03, H * 0.6, 0.26 * s, hair, { ao: false }); b.box(0.14 * s, H * 0.3, 0, 0.03, H * 0.6, 0.26 * s, hair, { ao: false }); }
    if (style === 'long') b.box(0, -H * 0.4, -0.12 * s, 0.27 * s, H * 0.8, 0.06 * s, hair, { ao: false });
    if (style === 'bun') b.ball(0, H * 1.0, -0.08 * s, 0.08 * s, hair);
    if (style === 'cap' || o.hat === 'cap') { b.box(0, H * 0.85, 0, 0.3 * s, 0.1 * s, 0.3 * s, o.hatColor || '#c0392b', { ao: false }); b.box(0, H * 0.85, 0.18 * s, 0.26 * s, 0.03, 0.14 * s, o.hatColor || '#c0392b', { ao: false }); }
    if (o.hat === 'chef') b.cyl(0, H * 0.9, 0, 0.15 * s, 0.22 * s, '#f5f5f5', { seg: 8 });
    if (o.hat === 'peaked') { b.box(0, H * 0.85, 0, 0.31 * s, 0.1 * s, 0.31 * s, '#1f2a44', { ao: false }); b.box(0, H * 0.82, 0.18 * s, 0.28 * s, 0.03, 0.12 * s, '#111', { ao: false }); }
    if (o.hat === 'sun') b.cyl(0, H * 0.9, 0, 0.26 * s, 0.05 * s, '#d9c08a', { seg: 8 });
    if (o.hat === 'helmet') { b.ball(0, H * 0.75, 0, 0.19 * s, o.hatColor || '#f2c230', { smooth: true }); }
  });
  head.add(mk(headG));
  return { root, hips, torso, legL, legR, armL, armR, head, s, height: 1.75 * s };
}
function handItem(arm, kind) {
  const b = new Batch();
  if (kind === 'broom') { b.box(0, -1.2, 0.1, 0.04, 1.3, 0.04, '#8a6a3a'); b.box(0, -1.35, 0.1, 0.25, 0.3, 0.06, '#c9a86a', { rx: 0.3 }); }
  if (kind === 'cane') b.box(0, -0.95, 0.12, 0.04, 0.95, 0.04, '#5a3a24');
  if (kind === 'fan') b.box(0, -0.68, 0.12, 0.02, 0.3, 0.3, '#c0392b');
  if (kind === 'erhu') { b.box(0, -0.85, 0.15, 0.04, 0.9, 0.04, '#3a2416'); b.cyl(0, -1.3, 0.15, 0.07, 0.12, '#3a2416', { seg: 6 }); }
  if (kind === 'brush') { b.box(0, -1.25, 0.25, 0.035, 1.6, 0.035, '#8a6a3a', { rx: 0.5 }); }
  if (kind === 'dumpling') { b.ball(0, -0.72, 0.18, 0.18, '#f4ecd8', { sy: 0.7, smooth: true }); }
  if (kind === 'bag') b.box(0, -0.85, 0.1, 0.28, 0.32, 0.12, '#d63a2f');
  if (kind === 'birdcage') { b.box(0, -0.75, 0.15, 0.02, 0.25, 0.02, '#333'); b.cyl(0, -1.25, 0.15, 0.18, 0.4, '#a8834a', { seg: 8 }); }
  if (kind === 'phone') b.box(0, -0.68, 0.1, 0.08, 0.14, 0.02, '#111');
  if (kind === 'oranges') { b.box(0, -0.95, 0.1, 0.3, 0.32, 0.22, '#d63a2f'); }
  const m = b.build(G.mat.npc); m.castShadow = true; arm.add(m); return m;
}

/* ---------------- NPC ---------------- */
const NPC_DEFAULT = { behavior: 'idle', area: 'surface', speed: 1.3, interact: true };
function addNPC(o) {
  o = Object.assign({}, NPC_DEFAULT, o);
  const p = makePerson(o.look || {});
  const n = Object.assign(p, {
    id: o.id || 'npc' + NPCS.length, name: o.name || '', behavior: o.behavior, area: o.area, speed: o.speed,
    pos: new THREE.Vector3(o.x, 0, o.z), ry: o.ry || 0, baseRy: o.ry || 0, home: new THREE.Vector3(o.x, 0, o.z),
    path: o.path || null, pathI: 0, pathDir: 1, wait: rand(0, 2), phase: rand(0, TAU), walk: 0, t: rand(0, 10),
    seated: !!o.seated, low: !!o.low, anim: o.anim || null, animT: 0, bubbleCD: rand(3, 10), lookAt: 0, stareT: 0, headScale: 1, headScaleT: 1,
    bowT: 0, waveT: 0, hearT: 0, bumpCD: 0, visible: true, opts: o, kid: !!o.kid, scooter: null, hidden: false, greeted: false,
  });
  n.root.position.copy(n.pos); n.root.rotation.y = n.ry;
  if (o.item) n.item = handItem(o.itemArm === 'L' ? n.armL : n.armR, o.item);
  if (o.kid) { const sb = new Batch(); sb.box(0, 0.08, 0, 0.18, 0.04, 0.7, '#e74c3c'); sb.box(0, 0.08, 0.32, 0.04, 0.85, 0.04, '#888'); sb.box(0, 0.9, 0.32, 0.35, 0.04, 0.04, '#888'); for (const z of [-0.28, 0.28]) sb.cyl(0, 0.04, z, 0.05, 0.05, '#222', { rz: PI / 2, center: true }); n.scooter = sb.build(G.mat.npc); n.root.add(n.scooter); n.hips.position.y += 0.1; }
  G.scene.add(n.root);
  NPCS.push(n); NPCById[n.id] = n;
  if (o.interact) {
    n.inter = Inter.add({ id: 'npc_' + n.id, kind: 'npc', npc: n, x: n.pos.x, y: 1.4, z: n.pos.z, r: 3.1, area: n.area, F: 'Say hello', G: 'Bow', E: o.E || null, angle: 32 });
  }
  return n;
}
function npcFace(n, x, z) { return Math.atan2(x - n.pos.x, z - n.pos.z); }
function npcBubble(n, pair, dur = 2.6) { if (!n || n.hidden) return; UI.bubble(n, pair[0], pair[1], dur); }

const People = {
  hearCD: 6,
  update(dt, P, cam) {
    this.hearCD -= dt;
    for (const n of NPCS) {
      if (n.hidden) { n.root.visible = false; continue; }
      const dx = n.pos.x - cam.position.x, dz = n.pos.z - cam.position.z;
      const d = Math.hypot(dx, dz);
      const vis = n.area === P.area && d < (G.low ? 55 : 75);
      n.root.visible = vis;
      n.t += dt; n.bumpCD -= dt; n.bubbleCD -= dt;
      if (!vis && n.behavior !== 'walker' && n.behavior !== 'chaser' && n.behavior !== 'queue') continue;
      this.behave(n, dt, P, d);
      this.animate(n, dt, P, d);
      n.root.position.set(n.pos.x, n.pos.y + (n.bobY || 0), n.pos.z);
      n.root.rotation.y = n.ry;
      if (n.inter) { n.inter.x = n.pos.x; n.inter.z = n.pos.z; n.inter.on = !n.hidden; }
    }
  },
  behave(n, dt, P, d) {
    const stare = n.stareT > 0 && d < 30;
    if (n.stareT > 0) n.stareT -= dt;
    if (stare) { n.walk = damp(n.walk, 0, 8, dt); n.ry = dampAngle(n.ry, npcFace(n, P.pos.x, P.pos.z), 6, dt); return; }
    if (n.bowT > 0 || n.waveT > 0) { if (!n.seated) n.ry = dampAngle(n.ry, npcFace(n, P.pos.x, P.pos.z), 5, dt); n.walk = damp(n.walk, 0, 8, dt); return; }
    switch (n.behavior) {
      case 'walker': case 'kid': {
        if (!n.path) break;
        if (n.wait > 0) { n.wait -= dt; n.walk = damp(n.walk, 0, 6, dt); break; }
        const tgt = n.path[n.pathI];
        const tx = tgt[0] - n.pos.x, tz = tgt[1] - n.pos.z, td = Math.hypot(tx, tz);
        if (td < 0.4) {
          n.pathI += n.pathDir;
          if (n.pathI >= n.path.length || n.pathI < 0) { if (n.opts.loop) n.pathI = 0; else { n.pathDir *= -1; n.pathI = clamp(n.pathI + n.pathDir * 2, 0, n.path.length - 1); } n.wait = n.behavior === 'kid' ? rand(0, 1) : rand(0.5, 4); }
          break;
        }
        // yield to the player
        const px = P.pos.x - n.pos.x, pz = P.pos.z - n.pos.z, pd = Math.hypot(px, pz);
        const fx = tx / td, fz = tz / td;
        let sp = n.speed;
        if (pd < 1.6 && (px * fx + pz * fz) > 0 && P.area === n.area) { sp = 0; if (n.bubbleCD < 0 && Math.random() < 0.02) { npcBubble(n, pick([['借过！', 'Excuse me!'], ['让一让～', 'Coming through~']])); n.bubbleCD = 8; } }
        n.ry = dampAngle(n.ry, Math.atan2(fx, fz), 6, dt);
        n.pos.x += fx * sp * dt; n.pos.z += fz * sp * dt;
        n.walk = damp(n.walk, sp > 0 ? 1 : 0, 6, dt);
        break;
      }
      case 'sweeper': {
        if (n.wait > 0) { n.wait -= dt; n.walk = damp(n.walk, 0, 4, dt); break; }
        if (!n.target || Math.hypot(n.target[0] - n.pos.x, n.target[1] - n.pos.z) < 0.3) { n.target = [n.home.x + rand(-4, 4), n.home.z + rand(-3, 3)]; n.wait = rand(2, 5); break; }
        const tx = n.target[0] - n.pos.x, tz = n.target[1] - n.pos.z, td = Math.hypot(tx, tz);
        n.ry = dampAngle(n.ry, Math.atan2(tx, tz), 3, dt);
        n.pos.x += tx / td * 0.5 * dt; n.pos.z += tz / td * 0.5 * dt; n.walk = damp(n.walk, 0.5, 4, dt);
        break;
      }
      case 'goto': case 'queue': case 'chaser': {
        const tg = n.target; if (!tg) { n.walk = damp(n.walk, 0, 6, dt); if (n.behavior === 'queue' && n.faceRy !== undefined) n.ry = dampAngle(n.ry, n.faceRy, 5, dt); break; }
        const tx = tg[0] - n.pos.x, tz = tg[1] - n.pos.z, td = Math.hypot(tx, tz);
        const sp = n.behavior === 'chaser' ? n.speed : n.speed;
        if (td < (n.behavior === 'chaser' ? 1.2 : 0.15)) { n.walk = damp(n.walk, 0, 8, dt); if (n.onArrive) { const f = n.onArrive; n.onArrive = null; f(n); } if (n.behavior !== 'chaser') n.target = null; break; }
        n.ry = dampAngle(n.ry, Math.atan2(tx, tz), 8, dt);
        const step = Math.min(td, sp * dt);
        n.pos.x += tx / td * step; n.pos.z += tz / td * step;
        n.walk = damp(n.walk, n.behavior === 'chaser' ? 1.6 : 1, 6, dt);
        break;
      }
      default: {
        // idle: turn head toward the player when close
        n.walk = damp(n.walk, 0, 6, dt);
        if (!n.seated && n.behavior === 'idle' && d < 5 && P.area === n.area) n.ry = dampAngle(n.ry, npcFace(n, P.pos.x, P.pos.z), 1.2, dt);
        else if (n.behavior === 'idle') n.ry = dampAngle(n.ry, n.baseRy, 1.0, dt);
      }
    }
  },
  animate(n, dt, P, d) {
    const s = n.s;
    n.phase += dt * (n.walk > 1.2 ? 11 : 7.5) * Math.max(0.2, n.walk);
    const w = Math.min(1.4, n.walk), sw = Math.sin(n.phase);
    let lL = sw * 0.55 * w, lR = -sw * 0.55 * w, aLx = -sw * 0.45 * w, aRx = sw * 0.45 * w, aLz = 0.06, aRz = -0.06, tX = 0, hX = 0, hY = 0, hipY = 0.82 * s;
    let bob = Math.abs(Math.cos(n.phase)) * 0.04 * w;
    if (n.seated) { lL = lR = -1.45; hipY = n.low ? 0.18 : 0.47; bob = 0; aLx = aRx = -0.5; tX = 0.05; }
    if (n.kid) { lL = 0.05; lR = -0.3; aLx = aRx = -0.9; bob = 0; }
    switch (n.anim) {
      case 'taichi': { const k = n.t * 0.55 + (n.syncOff || 0); aLx = -0.4 - (Math.sin(k) * 0.5 + 0.5) * 1.2; aRx = -0.4 - (Math.sin(k + 0.6) * 0.5 + 0.5) * 1.2; aLz = 0.3 + Math.sin(k * 0.5) * 0.4; aRz = -0.3 - Math.sin(k * 0.5) * 0.4; lL = Math.sin(k) * 0.15; lR = -Math.sin(k) * 0.15; hipY -= 0.06 + Math.sin(k) * 0.04; n.ry = n.baseRy + Math.sin(k * 0.5) * 0.35; break; }
      case 'sweep': { aLx = aRx = -0.7 + Math.sin(n.t * 3) * 0.35; aLz = 0.25; aRz = -0.25; tX = 0.25; break; }
      case 'chess': { if (Math.sin(n.t * 0.7) > 0.85) aRx = -1.2; tX = 0.2; break; }
      case 'erhu': { aLx = -0.9; aRx = -0.5; aRz = -0.6 + Math.sin(n.t * 2.4) * 0.45; tX = 0.1; break; }
      case 'cook': { aLx = aRx = -0.9 + Math.sin(n.t * 5) * 0.25; tX = 0.15; break; }
      case 'vendor': { if (Math.sin(n.t * 0.9) > 0.6) { aRx = -1.6; aRz = -0.2 + Math.sin(n.t * 8) * 0.2; } break; }
      case 'phone': { aRx = -1.4; aRz = 0.3; hX = 0.35; break; }
      case 'brush': { aLx = aRx = -0.7 + Math.sin(n.t * 0.8) * 0.2; aLz = 0.2; aRz = -0.2; tX = 0.35; hX = 0.3; break; }
      case 'pour': { aRx = -0.8 + Math.sin(n.t * 1.2) * 0.15; tX = 0.1; break; }
      case 'eat': { aRx = -1.3 + Math.sin(n.t * 4) * 0.2; hX = 0.2; tX = 0.15; break; }
    }
    if (n.bowT > 0) { n.bowT -= dt; const k = Math.sin(clamp(n.bowT / 1.4, 0, 1) * PI); tX = 0.75 * k; hX = 0.2 * k; }
    if (n.waveT > 0) { n.waveT -= dt; aRx = -0.3; aRz = -2.5 + Math.sin(n.t * 12) * 0.35; }
    if (n.hearT > 0) { n.hearT -= dt; hX = -0.55; hY = Math.sin(n.t * 3) * 0.5; }
    else if (d < 6 && P.area === n.area && !(n.stareT > 0)) { // look at player
      const target = npcFace(n, P.pos.x, P.pos.z) - n.ry;
      hY = clamp(wrapAngle(target), -1.1, 1.1);
      hX = Math.max(hX, -0.1);
    }
    if (n.stareT > 0) { hY = 0; hX = -0.05; aLx = aRx = 0; }
    n.legL.rotation.x = lL; n.legR.rotation.x = lR;
    n.armL.rotation.x = aLx; n.armR.rotation.x = aRx; n.armL.rotation.z = aLz; n.armR.rotation.z = aRz;
    n.torso.rotation.x = tX + (n.opts.look && n.opts.look.elder ? 0.12 : 0);
    n.head.rotation.x = hX; n.head.rotation.y = damp(n.head.rotation.y, hY, 6, dt);
    n.hips.position.y = hipY + bob;
    n.headScale = damp(n.headScale, n.headScaleT, 4, dt); n.head.scale.setScalar(n.headScale);
    n.bobY = Consequences.floaty > 0 ? Math.sin(n.t * 2 + n.phase) * 0.25 + 0.3 : 0;
  },
  nearest(P, maxD, filter) {
    let best = null, bd = maxD;
    for (const n of NPCS) { if (n.hidden || n.area !== P.area) continue; if (filter && !filter(n)) continue; const d = Math.hypot(n.pos.x - P.pos.x, n.pos.z - P.pos.z); if (d < bd) { bd = d; best = n; } }
    return best;
  },
  greet(n, P) {
    n.waveT = 1.4; const ev = G.progress > 0.62;
    const pool = G.progress < 0.25 && Math.random() < 0.6 ? LINES.npcMorning : ev && Math.random() < 0.5 ? LINES.npcEvening : LINES.npcHello;
    npcBubble(n, n.helloLine || pick(pool));
    Sound.tone(520, 0.15, { type: 'triangle', gain: 0.05 }); Sound.tone(700, 0.2, { type: 'triangle', gain: 0.05, when: 0.12 });
  },
  bow(n) { n.bowT = 1.4; npcBubble(n, pick(LINES.npcBow)); },
  stareAll(sec, P) { for (const n of NPCS) if (n.area === P.area && Math.hypot(n.pos.x - P.pos.x, n.pos.z - P.pos.z) < 30) { n.stareT = sec; } const near = this.nearest(P, 12); if (near) npcBubble(near, pick(LINES.npcStare)); },
  hear(P) {
    if (this.hearCD > 0) return;
    const n = this.nearest(P, 9, (x) => x.behavior !== 'chaser');
    if (!n) return;
    this.hearCD = rand(12, 25);
    n.hearT = 2.2; setTimeout(() => npcBubble(n, pick(LINES.npcHear)), 600);
  },
};
function dampAngle(a, b, k, dt) { return a + wrapAngle(b - a) * (1 - Math.exp(-k * dt)); }

/* ---------------- Populate the city ---------------- */
function spawnPeople() {
  const L = (o) => o;
  // lane (morning)
  addNPC({ id: 'grandpa', name: 'Grandpa Wang', x: A.grandpa.x, z: A.grandpa.z, ry: A.grandpa.ry, seated: true, anim: 'chess', look: { elder: true, shirt: '#3b5b8a', pants: '#2b2f3a', hairStyle: 'short', hair: '#d9d9d9', glasses: true }, behavior: 'seated' });
  NPCById.grandpa.helloLine = ['早上好！小家伙。', 'Good morning, kiddo.'];
  addNPC({ id: 'grandpa2', x: A.grandpa2.x, z: A.grandpa2.z, ry: A.grandpa2.ry, seated: true, anim: 'chess', look: { elder: true, shirt: '#8a6d4a', hairStyle: 'bald', beard: true, hair: '#cfcfcf' }, behavior: 'seated' });
  addNPC({ id: 'onlooker', x: A.onlooker.x, z: A.onlooker.z, ry: A.onlooker.ry, look: { elder: true, shirt: '#a83f5f', hairStyle: 'bun', hair: '#bdbdbd' }, item: 'fan' });
  addNPC({ id: 'kid1', behavior: 'kid', kid: true, speed: 3.2, x: -1.5, z: 20, path: [[-1.5, 14], [-1.5, 50], [1.8, 50], [1.8, 14]], look: { scale: 0.62, shirt: '#e6b422', hairStyle: 'short', hat: 'helmet', hatColor: '#3498db' } });
  addNPC({ id: 'neighbor', x: 2.6, z: 57.5, ry: PI, look: { shirt: '#5f7f3f', hairStyle: 'bob' }, item: 'phone', anim: 'phone' });
  // street walkers
  const sideN = -6.2, sideS = 6.4;
  const walkers = [
    [[-70, sideN], [-30, sideN]], [[-28, sideN - 0.8], [8, sideN - 0.8]], [[10, sideN], [44, sideN]], [[30, sideN - 0.9], [70, sideN - 0.9]],
    [[-74, sideS], [-44, sideS]], [[-40, sideS + 0.7], [-2, sideS + 0.7]], [[18, sideS], [60, sideS]], [[-20, sideS - 0.6], [30, sideS - 0.6]],
    [[40, sideN], [74, sideN]], [[-60, sideS + 0.9], [-20, sideS + 0.9]],
  ];
  walkers.forEach((p, i) => addNPC({ behavior: 'walker', x: p[0][0] + 2, z: p[0][1], path: p, speed: rand(1.1, 1.6), look: { shirt: spick(PAL.shirt), elder: i % 4 === 0, hairStyle: spick(['short', 'bob', 'long', 'cap', 'bun']) }, item: i % 3 === 0 ? 'phone' : i % 5 === 1 ? 'bag' : null, anim: i % 3 === 0 ? 'phone' : null }));
  addNPC({ id: 'bunVendor', x: A.bunVendor.x, z: A.bunVendor.z + 0.0, ry: PI, look: { apron: '#f4f4f4', shirt: '#c0392b', hat: 'chef' }, anim: 'vendor' });
  NPCById.bunVendor.pos.z = -8.9; NPCById.bunVendor.ry = 0; NPCById.bunVendor.baseRy = 0; NPCById.bunVendor.home.z = -8.9;
  // noodle shop
  addNPC({ id: 'cook', x: A.cook.x, z: A.cook.z, ry: A.cook.ry, anim: 'cook', look: { apron: '#f4f4f4', shirt: '#ececec', hat: 'chef', pants: '#3a3a3a' }, interact: false });
  addNPC({ id: 'cashier', name: 'Auntie Li', x: A.cashier.x, z: A.cashier.z, ry: A.cashier.ry, look: { shirt: '#c0392b', apron: '#1f2a44', hairStyle: 'bun' }, behavior: 'seated2' });
  A.diners.forEach((d, i) => addNPC({ x: d.x, z: d.z, ry: d.ry, seated: true, anim: 'eat', behavior: 'seated', look: { shirt: spick(PAL.shirt) } }));
  Queue.init();
  // hutong
  addNPC({ id: 'stoolman', x: A.hutongStool.x, z: A.hutongStool.z, ry: A.hutongStool.ry, seated: true, behavior: 'seated', look: { elder: true, shirt: '#ececec', hairStyle: 'bald', hair: '#bbb' }, item: 'fan', anim: 'vendor' });
  addNPC({ behavior: 'walker', x: -50, z: -20, path: [[-50, -12], [-50, -37], [-60, -40], [-50, -37]], speed: 0.9, look: { elder: true, shirt: '#3b3b3b', hairStyle: 'cap', hatColor: '#3b3b3b' }, item: 'birdcage' });
  addNPC({ behavior: 'walker', x: -62, z: -40, path: [[-70, -40], [-52, -40]], speed: 1.2, look: { shirt: '#7d5ba6', hairStyle: 'long' } });
  addNPC({ id: 'erhu', x: A.erhu.x, z: A.erhu.z, ry: A.erhu.ry, seated: true, behavior: 'seated', anim: 'erhu', item: 'erhu', itemArm: 'L', look: { elder: true, shirt: '#2b2f3a', hairStyle: 'short', hair: '#d0d0d0' } });
  // tea house
  addNPC({ id: 'teaMaster', name: 'the tea master', x: A.teaMaster.x, z: A.teaMaster.z, ry: A.teaMaster.ry, seated: true, low: true, anim: 'pour', behavior: 'seated', look: { shirt: '#e8e0cf', pants: '#3a2a1e', hairStyle: 'bun', hair: '#1a1a1a' } });
  A.teaPatrons.forEach((d) => addNPC({ x: d.x, z: d.z, ry: d.ry, seated: true, low: true, behavior: 'seated', look: { elder: true, shirt: spick(PAL.shirt) } }));
  // temple + plaza
  addNPC({ id: 'sweeper', name: 'the old man', x: A.sweeper.x, z: A.sweeper.z, ry: 0, behavior: 'sweeper', anim: 'sweep', item: 'broom', look: { elder: true, shirt: '#6b6b6b', pants: '#3a3a3a', hairStyle: 'bald', hair: '#ccc', beard: true } });
  A.templeVisitors.forEach((v) => addNPC({ x: v.x, z: v.z, ry: v.ry, look: { shirt: spick(PAL.shirt), hairStyle: 'bob' } }));
  addNPC({ behavior: 'walker', x: 0, z: -12, path: [[-6, -10], [-6, -27], [6, -27], [6, -10]], speed: 1.0, look: { elder: true, shirt: '#a83f5f', hairStyle: 'bun' }, opts: {}, item: 'bag' });
  // market
  const mv = [['stall_veg', 'vegVendor'], ['stall_fruit', 'fruitVendor'], ['stall_fish', 'fishVendor'], ['stall_tofu', 'tofuVendor'], ['stall_eggs'], ['stall_mush'], ['stall_noodle'], ['stall_spice']];
  for (const [k, id] of mv) { const a = A[k]; addNPC({ id, x: a.x, z: a.z, ry: a.ry, anim: 'vendor', look: { apron: spick(['#2e8b57', '#1f2a44', '#c0392b', '#f4f4f4']), shirt: spick(PAL.shirt), hairStyle: spick(['bun', 'short', 'bob', 'cap']) } }); }
  NPCById.fruitVendor.name = 'the fruit auntie'; NPCById.fruitVendor.opts.look.hairStyle = 'bun';
  for (let i = 0; i < 6; i++) addNPC({ behavior: 'walker', x: -70 + i * 4, z: 24, path: i % 2 ? [[-74, 24.5], [-45, 24.5]] : [[-74, 13.5], [-45, 13.5], [-45, 35.5], [-74, 35.5]], speed: rand(0.8, 1.2), look: { elder: i % 2 === 0, shirt: spick(PAL.shirt), hairStyle: spick(['bun', 'short', 'bob']) }, item: i % 2 ? 'bag' : null });
  // park
  addNPC({ id: 'taichiLead', x: A.taichiLead.x, z: A.taichiLead.z, ry: A.taichiLead.ry, anim: 'taichi', behavior: 'still', look: { elder: true, shirt: '#f2f2f2', pants: '#f2f2f2', hairStyle: 'short', hair: '#ddd' } });
  A.taichi.forEach((p, i) => { const n = addNPC({ x: p.x, z: p.z, ry: p.ry, anim: 'taichi', behavior: 'still', look: { elder: true, shirt: i % 2 ? '#f2f2f2' : '#c0392b', pants: '#f2f2f2', hairStyle: 'bun', hair: '#cfcfcf' } }); n.syncOff = 0; n.baseRy = PI; });
  NPCById.taichiLead.baseRy = 0;
  addNPC({ id: 'calligrapher', x: A.calligrapher.x, z: A.calligrapher.z, ry: A.calligrapher.ry, anim: 'brush', item: 'brush', behavior: 'still', look: { elder: true, shirt: '#2b2f3a', hairStyle: 'cap', hatColor: '#5a4636' } });
  A.parkCouple.forEach((p) => addNPC({ x: p.x, z: p.z, ry: p.ry, seated: true, behavior: 'seated', look: { shirt: spick(PAL.shirt), hairStyle: spick(['long', 'short']) } }));
  addNPC({ behavior: 'kid', kid: true, speed: 3.0, x: 50, z: -40, path: [[50, -12], [50, -58], [49, -58], [49, -12]], look: { scale: 0.6, shirt: '#e74c3c', hat: 'helmet', hatColor: '#f1c40f' } });
  addNPC({ behavior: 'walker', x: 60, z: -30, path: [[40, -30], [76, -30]], speed: 1.1, look: { shirt: '#1f7a8c', hairStyle: 'cap' } });
  // night market
  for (const v of A.nmVendors) {
    const isD = v.type === 'dumpling' && A.dumplingAuntie && v.z === A.dumplingAuntie.z;
    addNPC({ id: isD ? 'dumplingAuntie' : undefined, name: isD ? 'the dumpling auntie' : '', x: v.x, z: v.z, ry: v.ry, anim: 'vendor', look: { apron: isD ? '#f4f4f4' : spick(['#2e8b57', '#1f2a44', '#c0392b']), shirt: isD ? '#c0392b' : spick(PAL.shirt), hairStyle: isD ? 'bun' : spick(['short', 'cap', 'bob', 'bun']), hair: isD ? '#9a9a9a' : undefined } });
  }
  for (let i = 0; i < 9; i++) addNPC({ behavior: 'walker', x: 48 + (i % 3), z: 12 + i * 4, path: [[46.5 + (i % 4) * 2.2, 11], [46.5 + (i % 4) * 2.2, 48]], speed: rand(0.7, 1.2), look: { shirt: spick(PAL.shirt), hairStyle: spick(['long', 'short', 'bob', 'cap', 'bun']) }, item: i % 3 === 0 ? 'phone' : null, anim: i % 3 === 0 ? 'phone' : null });
  // metro
  addNPC({ id: 'attendant', name: 'the metro attendant', x: A.attendant.x, z: A.attendant.z, ry: A.attendant.ry, area: 'metro', look: { shirt: '#1f2a44', pants: '#1f2a44', hat: 'peaked', uniform: '#c0392b' } });
  A.platformPeople.forEach((p, i) => addNPC({ x: p.x, z: p.z, ry: p.ry, area: 'metro', item: 'phone', anim: 'phone', look: { shirt: spick(PAL.shirt), hairStyle: spick(['short', 'long', 'bob']) } }));
  // seated passengers inside the train (decor)
  for (const [x, z, ry] of [[-12, 4.75, 0], [-6, 7.85, PI], [6.5, 4.75, 0], [12.5, 7.85, PI]]) {
    const p = makePerson({ shirt: spick(PAL.shirt) }); p.hips.position.y = 0.47; p.legL.rotation.x = p.legR.rotation.x = -1.45; p.armL.rotation.x = p.armR.rotation.x = -0.6;
    p.root.position.set(x, 0, z); p.root.rotation.y = ry; Metro.train.add(p.root);
  }
  for (const n of NPCS) if (n.behavior === 'seated2') { n.behavior = 'idle'; }
}

/* ---------------- Noodle shop queue ---------------- */
const Queue = {
  npcs: [], timer: 0, active: false,
  init() {
    for (let i = 0; i < 3; i++) {
      const s = A.queueSpots[i];
      const n = addNPC({ id: 'queue' + i, x: s[0], z: s[1], ry: PI, behavior: 'queue', speed: 1.2, look: { shirt: spick(PAL.shirt), hairStyle: spick(['short', 'bob', 'long', 'cap']) }, item: i === 1 ? 'phone' : null, anim: i === 1 ? 'phone' : null });
      n.faceRy = PI; this.npcs.push(n);
    }
  },
  reset() {
    this.npcs.forEach((n, i) => { n.hidden = false; n.pos.set(A.queueSpots[i][0], 0, A.queueSpots[i][1]); n.target = null; n.ry = PI; n.behavior = 'queue'; n.slot = i; n.paid = false; });
    this.timer = 4.5; this.active = false;
  },
  get ahead() { return this.npcs.filter((n) => !n.paid && !n.hidden).length; },
  update(dt) {
    if (!this.active) return;
    this.timer -= dt;
    if (this.timer <= 0 && this.ahead > 0) {
      this.timer = 3.4;
      const front = this.npcs.find((n) => !n.paid && n.slot === 0);
      if (front) {
        front.paid = true; Sound.pay(); npcBubble(NPCById.cashier, ['谢谢！慢走！', 'Thanks! Take care!'], 2);
        front.target = [-23.2, -9.2]; front.onArrive = (n) => { n.target = [-23.2, -5.5]; n.onArrive = (m) => { m.hidden = true; }; };
        for (const n of this.npcs) if (!n.paid) { n.slot--; n.target = A.queueSpots[n.slot]; }
      }
    }
  },
};

/* ---------------- The cat ---------------- */
const Cat = {
  build() {
    const g = new THREE.Group();
    const b = new Batch();
    const c = '#d9822b', dk = '#a85a1a';
    b.box(0, 0.14, 0, 0.22, 0.2, 0.46, c); for (let i = 0; i < 3; i++) b.box(0, 0.335, -0.12 + i * 0.12, 0.225, 0.012, 0.05, dk, { ao: false });
    this.body = b.build(G.mat.npc); this.body.castShadow = true; g.add(this.body);
    const hb = new Batch(); hb.box(0, -0.08, 0, 0.2, 0.17, 0.17, c, { ao: false }); hb.cone(-0.06, 0.09, 0, 0.04, 0.08, c, { seg: 4 }); hb.cone(0.06, 0.09, 0, 0.04, 0.08, c, { seg: 4 });
    hb.box(-0.045, 0.0, 0.086, 0.03, 0.03, 0.01, '#1a3a1a', { ao: false }); hb.box(0.045, 0.0, 0.086, 0.03, 0.03, 0.01, '#1a3a1a', { ao: false }); hb.box(0, -0.04, 0.088, 0.03, 0.02, 0.01, '#e88a8a', { ao: false });
    this.head = new THREE.Group(); const hm = hb.build(G.mat.npc); this.head.add(hm); this.head.position.set(0, 0.36, 0.25); g.add(this.head);
    const tb = new Batch(); tb.box(0, 0, -0.17, 0.05, 0.05, 0.34, c);
    this.tail = new THREE.Group(); this.tail.add(tb.build(G.mat.npc)); this.tail.position.set(0, 0.3, -0.22); g.add(this.tail);
    const lb = new Batch(); lb.box(0, -0.14, 0, 0.06, 0.14, 0.06, c, { ao: false });
    const lg = lb.build(G.mat.npc).geometry;
    this.legs = [[-0.07, 0.16], [0.07, 0.16], [-0.07, -0.16], [0.07, -0.16]].map(([x, z]) => { const m = new THREE.Mesh(lg, G.mat.npc); m.position.set(x, 0.14, z); g.add(m); return m; });
    this.g = g; G.scene.add(g);
    this.reset();
    this.inter = Inter.add({ id: 'cat', kind: 'cat', x: A.cat.x, y: A.cat.y + 0.2, z: A.cat.z, r: 2.4, E: 'Pet the cat', angle: 45 });
    // a second, decorative cat sleeping on a hutong wall
    const c2 = new THREE.Mesh(this.body.geometry, G.mat.npc); c2.position.set(A.cat2.x, A.cat2.y - 0.1, A.cat2.z); c2.rotation.y = 0.3; c2.scale.set(1.1, 0.7, 1.1); G.scene.add(c2);
  },
  reset() { this.state = 'sit'; this.pos = new THREE.Vector3(A.cat.x, A.cat.y, A.cat.z); this.ry = A.cat.ry; this.walk = 0; this.t = 0; this.area = 'surface'; this.meowT = 6; this.vy = 0; },
  pet() { Sound.purr(); Sound.meow(); this.purrT = 1.5; UI.floatIcon('♥', this.g.position, '#ff6b8a'); },
  update(dt, P) {
    this.t += dt;
    const g = this.g;
    if (this.state === 'follow') {
      if (this.area !== P.area) { this.area = P.area; this.pos.set(P.pos.x + 1.5, 0, P.pos.z + 1.5); }
      const fx = P.pos.x - Math.sin(P.yaw) * 1.6 + Math.cos(P.yaw) * 0.9, fz = P.pos.z + Math.cos(P.yaw) * 1.6 + Math.sin(P.yaw) * 0.9;
      const dx = fx - this.pos.x, dz = fz - this.pos.z, d = Math.hypot(dx, dz);
      const sp = d > 0.5 ? Math.min(d * 2.2, 8) : 0;
      if (d > 0.01) { this.pos.x += dx / d * sp * dt; this.pos.z += dz / d * sp * dt; }
      if (d > 25) { this.pos.set(fx, 0, fz); }
      if (sp > 0.2) this.ry = dampAngle(this.ry, Math.atan2(dx, dz), 8, dt);
      this.pos.y = damp(this.pos.y, groundY(this.pos.x, this.pos.z, this.area) + (Consequences.floaty > 0 ? 0.6 + Math.sin(this.t * 2) * 0.3 : 0), 8, dt);
      this.walk = damp(this.walk, sp > 0.2 ? 1 : 0, 8, dt);
      this.meowT -= dt; if (this.meowT < 0) { this.meowT = rand(10, 22); const d2 = Math.hypot(P.pos.x - this.pos.x, P.pos.z - this.pos.z); Sound.meow(clamp((this.pos.x - P.pos.x) / 6, -1, 1)); if (d2 < 6) UI.floatIcon('♪', g.position, '#ffd76a'); }
    }
    const ph = this.t * 12 * this.walk;
    this.legs.forEach((l, i) => { l.rotation.x = Math.sin(ph + (i % 2 ? PI : 0) + (i > 1 ? PI : 0)) * 0.6 * this.walk; });
    this.tail.rotation.x = 0.6 + Math.sin(this.t * 2) * 0.2; this.tail.rotation.y = Math.sin(this.t * 1.3) * 0.5;
    this.head.rotation.y = this.state === 'sit' && P.area === 'surface' ? clamp(wrapAngle(Math.atan2(P.pos.x - this.pos.x, P.pos.z - this.pos.z) - this.ry), -1, 1) : 0;
    if (this.purrT > 0) { this.purrT -= dt; this.head.rotation.z = Math.sin(this.t * 6) * 0.15; } else this.head.rotation.z = 0;
    g.visible = this.area === P.area;
    g.position.copy(this.pos); g.rotation.y = this.ry;
    if (this.state === 'sit') { this.legs.forEach((l, i) => { if (i > 1) l.rotation.x = -1.2; }); g.rotation.x = -0.25; } else g.rotation.x = 0;
    this.inter.x = this.pos.x; this.inter.z = this.pos.z; this.inter.y = this.pos.y + 0.3; this.inter.area = this.area;
  },
};
function groundY(x, z, area) { return area === 'surface' && Math.abs(z) < 4.5 && Math.abs(x) < 130 ? -0.12 : 0; }

/* ---------------- Pigeons (instanced) ---------------- */
const Pigeons = {
  N: 44, birds: [],
  build() {
    const b = new Batch();
    b.ball(0, 0.12, 0, 0.1, '#8a8f99', { sz: 1.6, smooth: true }); b.ball(0, 0.22, 0.13, 0.065, '#5d6b7a', { smooth: true });
    b.box(0, 0.2, 0.2, 0.025, 0.025, 0.05, '#e0a040', { ao: false }); b.box(0, 0.12, -0.16, 0.12, 0.03, 0.12, '#6b717a', { ao: false });
    b.box(-0.09, 0.15, 0, 0.04, 0.06, 0.18, '#7a808a', { ao: false }); b.box(0.09, 0.15, 0, 0.04, 0.06, 0.18, '#7a808a', { ao: false });
    const geo = b.build(G.mat.npc).geometry;
    this.mesh = new THREE.InstancedMesh(geo, G.mat.npc, this.N); this.mesh.castShadow = true; this.mesh.frustumCulled = false;
    G.scene.add(this.mesh);
    const homes = [[0, -38, 12], [-37, -44, 8], [52, -22, 10], [0, -20, 6], [-58, 14, 4], [50, 30, 4]];
    let i = 0;
    for (const [hx, hz, n] of homes) for (let k = 0; k < n && i < this.N; k++, i++) {
      this.birds.push({ home: [hx, hz], pos: new THREE.Vector3(hx + rand(-3, 3), 0, hz + rand(-3, 3)), vel: new THREE.Vector3(), state: 'ground', t: rand(0, 5), ry: rand(0, TAU), peck: rand(0, 3), target: null });
    }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(1, 1, 1);
  },
  scatter(x, z, r = 6) {
    let any = false;
    for (const b of this.birds) if (Math.hypot(b.pos.x - x, b.pos.z - z) < r && b.state !== 'fly') { b.state = 'fly'; b.vel.set((b.pos.x - x) * 0.6 + rand(-2, 2), rand(4, 6), (b.pos.z - z) * 0.6 + rand(-2, 2)); b.t = rand(2.5, 4); any = true; }
    if (any) Sound.flap();
  },
  summon(x, z, n = 10) { // land around a point (stand-still command)
    const list = this.birds.slice(0, n);
    list.forEach((b, i) => { const a = i / n * TAU; b.state = 'land'; b.target = new THREE.Vector3(x + Math.cos(a) * rand(0.8, 1.8), 0, z + Math.sin(a) * rand(0.8, 1.8)); if (b.pos.y < 0.5) { b.pos.set(x + rand(-12, 12), rand(6, 10), z + rand(-12, 12)); } });
    Sound.flap();
  },
  burst(x, z) { // consequence: a flock explodes around you
    const list = this.birds.slice(this.N - 12);
    list.forEach((b) => { b.pos.set(x + rand(-1.5, 1.5), rand(0.2, 1.5), z + rand(-1.5, 1.5)); b.state = 'fly'; b.vel.set(rand(-4, 4), rand(3, 7), rand(-4, 4)); b.t = rand(2, 3.5); });
    Sound.flap(); Sound.coo();
  },
  update(dt, P) {
    let i = 0;
    for (const b of this.birds) {
      b.t -= dt;
      if (b.state === 'ground') {
        b.peck -= dt;
        if (b.peck < 0) { b.peck = rand(0.6, 2.5); b.ry += rand(-1, 1); if (Math.random() < 0.3) { b.pos.x += Math.sin(b.ry) * 0.3; b.pos.z += Math.cos(b.ry) * 0.3; } }
        b.pos.y = 0;
        if (P.area === 'surface' && Math.hypot(P.pos.x - b.pos.x, P.pos.z - b.pos.z) < 1.4 && P.speed > 2.5) this.scatter(P.pos.x, P.pos.z, 3);
      } else if (b.state === 'fly') {
        b.vel.y -= 1.5 * dt; b.pos.addScaledVector(b.vel, dt); b.ry = Math.atan2(b.vel.x, b.vel.z);
        if (b.t < 0) { b.state = 'return'; b.target = new THREE.Vector3(b.home[0] + rand(-3, 3), 0, b.home[1] + rand(-3, 3)); }
      } else if (b.state === 'return' || b.state === 'land') {
        const d = b.target.clone().sub(b.pos); const dl = d.length();
        if (dl < 0.15) { b.state = 'ground'; b.pos.copy(b.target); b.pos.y = 0; }
        else { d.normalize(); b.pos.addScaledVector(d, Math.min(dl, (b.state === 'land' ? 5 : 7) * dt)); b.ry = Math.atan2(d.x, d.z); }
      }
      const flying = b.state !== 'ground';
      this._q.setFromEuler(new THREE.Euler(flying ? Math.sin(b.t * 20) * 0.15 : (b.peck < 0.25 ? 0.5 : 0), b.ry, flying ? Math.sin(b.t * 25) * 0.3 : 0));
      this._m.compose(b.pos, this._q, this._s);
      this.mesh.setMatrixAt(i++, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.visible = P.area === 'surface';
  },
};

/* ---------------- Traffic ---------------- */
function vehicleMesh(type) {
  const b = new Batch();
  if (type === 'scooter') {
    const c = spick(['#f2c230', '#3a7bd5', '#e74c3c', '#ececec', '#2ecc71']);
    for (const s of [-0.6, 0.6]) b.cyl(s, 0.24, 0, 0.24, 0.12, '#1d1d1d', { rx: PI / 2, center: true, seg: 12 });
    b.box(0, 0.15, 0, 1.25, 0.25, 0.32, c); b.box(-0.25, 0.42, 0, 0.75, 0.3, 0.36, c); b.box(0.55, 0.3, 0, 0.18, 0.75, 0.38, c, { rz: -0.25 });
    b.box(0.65, 1.05, 0, 0.08, 0.08, 0.62, '#222'); b.box(-0.55, 0.75, 0, 0.45, 0.45, 0.45, spick(['#f2c230', '#2f8bd8', '#f2c230']));
  } else if (type === 'bus') {
    b.box(0, 0.35, 0, 10, 2.6, 2.5, '#2e86c1'); b.box(0, 1.5, 0, 9.6, 1.0, 2.52, '#1b2a36'); b.box(0, 2.95, 0, 9.4, 0.2, 2.3, '#d6eaf8');
    for (const x of [-3.5, 3.5]) for (const z of [-1.1, 1.1]) b.cyl(x, 0.45, z, 0.45, 0.3, '#1d1d1d', { rx: PI / 2, center: true, seg: 12 });
  } else {
    const taxi = type === 'taxi';
    const c = taxi ? '#2e9b57' : spick(['#ecf0f1', '#2c3e50', '#7f8c8d', '#c0392b', '#bdc3c7']);
    b.box(0, 0.3, 0, 4.2, 0.75, 1.8, c); b.box(-0.2, 1.05, 0, 2.2, 0.6, 1.6, taxi ? '#f2c230' : c); b.box(-0.2, 1.08, 0, 2.25, 0.5, 1.62, '#1b2a36');
    if (taxi) b.box(-0.2, 1.65, 0, 0.6, 0.18, 0.3, '#ffffff');
    for (const x of [-1.35, 1.35]) for (const z of [-0.85, 0.85]) b.cyl(x, 0.33, z, 0.33, 0.25, '#1d1d1d', { rx: PI / 2, center: true, seg: 12 });
  }
  const m = b.build(G.mat.npc); m.castShadow = true;
  const g = new THREE.Group(); g.add(m);
  const lb = new Batch();
  const L = type === 'bus' ? 5 : type === 'scooter' ? 0.75 : 2.1, W = type === 'bus' ? 0.9 : type === 'scooter' ? 0 : 0.6;
  for (const z of (W ? [-W, W] : [0])) { lb.box(L, type === 'scooter' ? 0.85 : 0.55, z, 0.05, 0.15, 0.3, '#fff3d0'); lb.box(-L, 0.6, z, 0.05, 0.12, 0.3, '#ff2a1a'); }
  g.add(lb.build(G.mat.glow));
  return g;
}
const Traffic = {
  cars: [], cycle: 30, t: 0, forced: null,
  phase(t) { // returns {car:'g'|'y'|'r', ped:'g'|'f'|'r'}
    t = ((t % this.cycle) + this.cycle) % this.cycle;
    if (t < 14) return { car: 'g', ped: 'r' };
    if (t < 16.5) return { car: 'y', ped: 'r' };
    if (t < 17.5) return { car: 'r', ped: 'r' };
    if (t < 26.5) return { car: 'r', ped: 'g' };
    if (t < 29) return { car: 'r', ped: 'f' };
    return { car: 'r', ped: 'r' };
  },
  get state() { return this.phase(this.t); },
  pedGreen() { const s = this.state.ped; return s === 'g' || s === 'f'; },
  setTime(t) { this.t = t; },
  build() {
    // signals at crosswalks x=0 and x=-48
    this.signals = [];
    const pedTex = (green) => canvasTex(64, 96, (g) => { g.fillStyle = '#111'; g.fillRect(0, 0, 64, 96); g.fillStyle = green ? '#3dff6a' : '#ff3030'; g.beginPath(); g.arc(32, 18, 8, 0, TAU); g.fill(); if (green) { g.fillRect(26, 28, 12, 30); g.save(); g.translate(30, 56); g.rotate(0.4); g.fillRect(-4, 0, 8, 28); g.restore(); g.save(); g.translate(36, 56); g.rotate(-0.5); g.fillRect(-4, 0, 8, 28); g.restore(); } else { g.fillRect(24, 28, 16, 32); g.fillRect(25, 60, 6, 28); g.fillRect(33, 60, 6, 28); } });
    this.pedG = pedTex(true); this.pedR = pedTex(false);
    for (const cx of [0, -48]) {
      for (const [x, z, ry] of [[cx - 3.6, 5.0, PI], [cx + 3.6, -5.0, 0]]) {
        S.cyl(x, 0, z, 0.07, 2.6, '#2d3136');
        const m = new THREE.MeshBasicMaterial({ map: this.pedR, toneMapped: false });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.48), m); p.position.set(x, 2.35, z + (ry ? -0.08 : 0.08)); p.rotation.y = ry; G.scene.add(p);
        S.box(x, 2.08, z, 0.38, 0.55, 0.14, '#222');
        this.signals.push({ kind: 'ped', mat: m });
        Col.box(x, z, 0.25, 0.25);
      }
      for (const [x, z, ry] of [[cx - 4.4, 5.0, -PI / 2], [cx + 4.4, -5.0, PI / 2]]) {
        S.cyl(x, 0, z, 0.1, 5.4, '#2d3136'); S.box(x, 5.2, z - Math.sign(z) * 1.6, 0.12, 0.12, 3.2, '#2d3136');
        const hz = z - Math.sign(z) * 3.0;
        S.box(x, 4.4, hz, 0.35, 1.1, 0.35, '#222');
        const mats = ['#ff2a1a', '#ffb000', '#2aff6a'].map((c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
        mats.forEach((m, i) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.22), m); l.position.set(x + (ry < 0 ? -0.19 : 0.19), 5.3 - i * 0.33, hz); G.scene.add(l); });
        this.signals.push({ kind: 'car', mats });
        Col.box(x, z, 0.3, 0.3);
      }
    }
    // vehicles
    const spec = [['scooter', 1, 8.5], ['taxi', 1, 10], ['scooter', 1, 7.5], ['car', 1, 9.5], ['bus', 1, 7.5], ['scooter', -1, 8], ['car', -1, 10], ['taxi', -1, 9.5], ['scooter', -1, 7], ['car', -1, 9]];
    spec.forEach(([type, dir, sp], i) => {
      const g = vehicleMesh(type); G.scene.add(g);
      const lane = dir > 0 ? 2.3 : -2.3;
      let rider = null;
      if (type === 'scooter') { rider = makePerson({ shirt: spick(['#f2c230', '#2f8bd8', '#f2c230', '#e74c3c']), hat: 'helmet', hatColor: spick(['#f2c230', '#2f8bd8']) }); rider.hips.position.y = 0.72; rider.legL.rotation.x = rider.legR.rotation.x = -1.2; rider.armL.rotation.x = rider.armR.rotation.x = -1.1; rider.root.position.set(-0.2, 0, 0); rider.root.rotation.y = PI / 2; g.add(rider.root); }
      this.cars.push({ g, type, dir, lane, x: -110 * dir + i * 23 * dir, v: sp, max: sp, len: type === 'bus' ? 10 : type === 'scooter' ? 1.6 : 4.4, beepCD: 0, swerve: 0 });
    });
  },
  update(dt, P) {
    this.t += dt;
    const st = this.state;
    for (const s of this.signals) {
      if (s.kind === 'ped') { const on = st.ped === 'g' || (st.ped === 'f' && Math.sin(this.t * 8) > 0); s.mat.map = st.ped === 'r' || !on ? this.pedR : this.pedG; s.mat.color.setScalar(st.ped === 'f' && !on ? 0.3 : 1); }
      else s.mats.forEach((m, i) => m.color.set(['#ff2a1a', '#ffb000', '#2aff6a'][i]).multiplyScalar(['r', 'y', 'g'][i] === st.car ? 1.4 : 0.12));
    }
    for (const c of this.cars) {
      let target = c.max;
      // red light stop lines
      if (st.car !== 'g') for (const cx of [0, -48]) {
        const stopX = cx - 4.8 * c.dir, ahead = (stopX - c.x) * c.dir;
        if (ahead > -0.5 && ahead < 14) target = Math.min(target, Math.max(0, (ahead - 0.3 - c.len / 2) * 1.2));
      }
      // vehicle ahead
      for (const o of this.cars) if (o !== c && o.dir === c.dir) { const gap = (o.x - c.x) * c.dir - (o.len + c.len) / 2; if (gap > 0 && gap < 10) target = Math.min(target, Math.max(0, (gap - 2) * 1.5)); }
      // the player in the road
      c.beepCD -= dt;
      if (P.area === 'surface' && Math.abs(P.pos.z - c.lane) < 1.9) {
        const ahead = (P.pos.x - c.x) * c.dir - c.len / 2;
        if (ahead > -0.5 && ahead < 11) { target = Math.min(target, Math.max(0, (ahead - 1.4) * 1.3)); if (c.beepCD < 0 && ahead < 8) { c.beepCD = 2.5; const pan = clamp((c.x - P.pos.x) / 10, -1, 1); if (c.type === 'scooter') Sound.scooterBeep(pan); else Sound.carHorn(pan, 0.04); Bus.emit('honk', c); } }
      }
      c.v = damp(c.v, target, c.v > target ? 6 : 1.5, dt);
      c.x += c.v * dt * c.dir;
      if (c.x * c.dir > 118) c.x = -118 * c.dir;
      c.swerve = damp(c.swerve, 0, 1.5, dt);
      c.g.position.set(c.x, -0.12, c.lane + Math.sin(c.swerve * 3) * c.swerve);
      c.g.rotation.y = (c.dir > 0 ? 0 : PI) + c.swerve * 0.3;
      c.g.visible = P.area === 'surface' && Math.abs(c.x - P.pos.x) < 110;
    }
  },
  swerveNear(P) { let best = null, bd = 30; for (const c of this.cars) { const d = Math.abs(c.x - P.pos.x); if (d < bd) { bd = d; best = c; } } if (best) { best.swerve = 1; Sound.scooterBeep(0, 0.08); } },
};
