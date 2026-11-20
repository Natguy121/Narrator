/* Player controller: keyboard/mouse + touch, physics, collisions, interaction targeting. */

const Settings = { sens: 1, invert: false, voice: true, volume: 0.8, subs: true };
try { Object.assign(Settings, JSON.parse(localStorage.getItem('narrator-settings') || '{}')); } catch (e) { /* ignore */ }
function saveSettings() { try { localStorage.setItem('narrator-settings', JSON.stringify(Settings)); } catch (e) { /* ignore */ } }

const Input = {
  keys: {}, pressed: new Set(), mdx: 0, mdy: 0, locked: false, drag: false,
  joy: { x: 0, y: 0, id: null, ox: 0, oy: 0 }, look: { id: null, x: 0, y: 0 }, runToggle: false, breathBtn: false,
  enabled: false,
  init() {
    window.addEventListener('keydown', (e) => {
      const k = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(k)) e.preventDefault();
      if (!this.keys[k]) this.pressed.add(k);
      this.keys[k] = true;
      Game.onKey(k, e);
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    document.addEventListener('mousemove', (e) => {
      if (this.locked || this.drag) { this.mdx += e.movementX || 0; this.mdy += e.movementY || 0; }
    });
    const canvas = $('#c');
    canvas.addEventListener('mousedown', (e) => {
      if (Game.state !== 'play' || IS_TOUCH) return;
      if (!this.locked && !Game.overlayOpen()) {
        this.requestLock();
        this.drag = true;
      }
    });
    window.addEventListener('mouseup', () => { this.drag = false; });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      if (!this.locked && Game.state === 'play' && !Game.paused && !Game.overlayOpen() && !Game.expectUnlock) Game.pause();
      Game.expectUnlock = false;
      UI.lockHint(!this.locked && Game.state === 'play' && !Game.paused && !IS_TOUCH && !Game.overlayOpen());
    });
    if (IS_TOUCH) this.initTouch();
  },
  requestLock() {
    const c = $('#c');
    try { const p = c.requestPointerLock && c.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { /* ignore */ }
  },
  releaseLock() { if (document.pointerLockElement) { Game.expectUnlock = true; document.exitPointerLock(); } },
  initTouch() {
    const tc = $('#touch');
    const zone = $('#touch-zone');
    const knob = $('#joy-knob'), base = $('#joy-base');
    zone.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) {
        if (t.clientX < window.innerWidth * 0.45 && this.joy.id === null) {
          this.joy.id = t.identifier; this.joy.ox = t.clientX; this.joy.oy = t.clientY; this.joy.x = this.joy.y = 0;
          base.style.left = (t.clientX - 60) + 'px'; base.style.top = (t.clientY - 60) + 'px'; base.classList.add('on');
          knob.style.transform = 'translate(0px,0px)';
        } else if (this.look.id === null) { this.look.id = t.identifier; this.look.x = t.clientX; this.look.y = t.clientY; }
      }
      e.preventDefault();
    }, { passive: false });
    zone.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.joy.id) {
          let dx = t.clientX - this.joy.ox, dy = t.clientY - this.joy.oy; const d = Math.hypot(dx, dy), R = 60;
          if (d > R) { dx *= R / d; dy *= R / d; }
          this.joy.x = dx / R; this.joy.y = dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`;
        } else if (t.identifier === this.look.id) {
          this.mdx += (t.clientX - this.look.x) * 1.9; this.mdy += (t.clientY - this.look.y) * 1.9;
          this.look.x = t.clientX; this.look.y = t.clientY;
        }
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.joy.id) { this.joy.id = null; this.joy.x = this.joy.y = 0; base.classList.remove('on'); }
        if (t.identifier === this.look.id) this.look.id = null;
      }
    };
    zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
    const btn = (id, down, up) => {
      const el = $(id); if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); el.classList.add('down'); down && down(); }, { passive: false });
      el.addEventListener('touchend', (e) => { e.preventDefault(); el.classList.remove('down'); up && up(); }, { passive: false });
      el.addEventListener('touchcancel', () => { el.classList.remove('down'); up && up(); });
    };
    btn('#tb-e', () => Game.onKey('KeyE')); btn('#tb-f', () => Game.onKey('KeyF')); btn('#tb-g', () => Game.onKey('KeyG'));
    btn('#tb-jump', () => Game.onKey('Space')); btn('#tb-talk', () => Game.onKey('KeyQ')); btn('#tb-pause', () => Game.onKey('Escape'));
    btn('#tb-run', () => { this.runToggle = !this.runToggle; $('#tb-run').classList.toggle('active', this.runToggle); });
    btn('#tb-breath', () => { this.breathBtn = true; }, () => { this.breathBtn = false; });
  },
  consume(k) { const h = this.pressed.has(k); this.pressed.delete(k); return h; },
  endFrame() { this.pressed.clear(); this.mdx = 0; this.mdy = 0; },
};

const P = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, roll: 0, area: 'surface', vy: 0, onGround: true,
  speed: 0, hspeed: 0, running: false, sneaking: false, seat: null, breath: 1, holding: false, breathLock: 0,
  zones: new Set(), zoneList: [], eye: 1.62, eyeCur: 1.62, bobT: 0, stepAcc: 0, shake: 0, dip: 0, frozen: false,
  pushT: 0, jumpTimes: [], target: null, yawRate: 0, lookUpT: 0, idleT: 0, moveDist: 0, lastPos: new THREE.Vector3(), fovKick: 0,
  teleport(x, z, yaw, area = 'surface') {
    this.area = area; this.pos.set(x, groundY(x, z, area), z); this.vel.set(0, 0, 0); this.vy = 0;
    if (yaw !== undefined) this.yaw = yaw; this.pitch = 0; this.seat = null; this.eyeCur = this.eye = 1.62;
    this.lastPos.copy(this.pos);
    this.updateZones(true);
  },
  sit(seat) {
    this.seat = seat; this.pos.set(seat.x, 0, seat.z); this.yaw = seat.yaw; this.pitch = -0.15; this.vel.set(0, 0, 0);
    this.eye = seat.low ? 0.95 : 1.18; Bus.emit('sit', seat);
  },
  stand() { if (!this.seat) return; const s = this.seat; this.seat = null; this.eye = 1.62; Bus.emit('stand', s); },
  get forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); },
  update(dt) {
    const cam = G.camera;
    // look
    const sens = 0.0022 * Settings.sens;
    const dyaw = -Input.mdx * sens, dpitch = -Input.mdy * sens * (Settings.invert ? -1 : 1);
    if (!this.frozen) { this.yaw += dyaw; this.pitch = clamp(this.pitch + dpitch, -1.45, 1.45); }
    this.yawRate = damp(this.yawRate, Math.abs(dyaw) / Math.max(dt, 1e-3), 8, dt);
    // movement input
    let ix = 0, iz = 0;
    const K = Input.keys;
    if (!this.frozen && Input.enabled) {
      if (K.KeyW || K.ArrowUp) iz -= 1; if (K.KeyS || K.ArrowDown) iz += 1;
      if (K.KeyA || K.ArrowLeft) ix -= 1; if (K.KeyD || K.ArrowRight) ix += 1;
      ix += Input.joy.x; iz += Input.joy.y;
    }
    let mag = Math.min(1, Math.hypot(ix, iz));
    if (mag > 0.05 && this.seat) { if (mag > 0.4) this.stand(); else mag = 0; }
    if (this.seat) { ix = iz = 0; mag = 0; }
    const touchSlow = IS_TOUCH && Input.joy.id !== null && mag < 0.6;
    this.sneaking = (K.KeyC || K.ControlLeft || touchSlow) && mag > 0.05;
    this.running = !this.sneaking && (K.ShiftLeft || K.ShiftRight || Input.runToggle) && mag > 0.1 && !Game.noRunInput;
    const top = this.running ? 7.6 : this.sneaking ? 1.75 : 4.3;
    const fw = this.forward, rt = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = new THREE.Vector3();
    if (mag > 0.01) { wish.addScaledVector(rt, ix).addScaledVector(fw, -iz); wish.normalize().multiplyScalar(top * (IS_TOUCH ? Math.max(mag, this.sneaking ? 1 : 0.4) : 1)); }
    const acc = this.onGround ? 12 : 3;
    this.vel.x = damp(this.vel.x, wish.x, acc, dt); this.vel.z = damp(this.vel.z, wish.z, acc, dt);
    // jump + gravity
    const grav = Consequences.floaty > 0 ? 3.2 : 15;
    if (Input.consume('Space') && this.onGround && !this.seat && !this.frozen && Input.enabled) {
      this.vy = Consequences.floaty > 0 ? 6.5 : 4.8; this.onGround = false; Bus.emit('jump');
      const now = Narrator.t; this.jumpTimes.push(now); this.jumpTimes = this.jumpTimes.filter((t) => now - t < 6);
    }
    this.vy -= grav * dt;
    // integrate
    const before = this.pos.clone();
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; this.pos.y += this.vy * dt;
    const gy = groundY(this.pos.x, this.pos.z, this.area);
    if (this.pos.y <= gy) { if (!this.onGround && this.vy < -3) Sound.step({ run: true }); this.pos.y = gy; this.vy = 0; this.onGround = true; }
    // collisions
    const hits = Col.resolve(this.pos, 0.34);
    for (const n of NPCS) {
      if (n.hidden || n.area !== this.area) continue;
      const dx = this.pos.x - n.pos.x, dz = this.pos.z - n.pos.z, d = Math.hypot(dx, dz);
      const R = n.kid ? 0.55 : 0.62;
      if (d < R && d > 1e-4) {
        this.pos.x = n.pos.x + dx / d * R; this.pos.z = n.pos.z + dz / d * R;
        if (this.hspeed > 1.4 && n.bumpCD <= 0) { n.bumpCD = 4; Sound.bump(); npcBubble(n, pick(LINES.npcBumpSay)); Bus.emit('npcBump', n); if (n.behavior === 'walker') n.wait = 1.2; }
      }
    }
    if (this.area === 'surface') {
      const lim = 79.5;
      const cx = clamp(this.pos.x, -lim, lim), cz = clamp(this.pos.z, -lim, lim);
      if (cx !== this.pos.x || cz !== this.pos.z) { this.pos.x = cx; this.pos.z = cz; this.edgeT = (this.edgeT || 0) + dt; if (this.edgeT > 0.6) { this.edgeT = -6; Bus.emit('edge'); } }
    }
    // wall bump detection
    const moved = Math.hypot(this.pos.x - before.x, this.pos.z - before.z);
    const wishSp = Math.hypot(wish.x, wish.z);
    if (wishSp > 2 && hits > 0 && moved < wishSp * dt * 0.3) { this.pushT += dt; if (this.pushT > 0.45) { this.pushT = -3; Sound.bump(); this.shake = Math.max(this.shake, 0.12); Bus.emit('wallBump'); } }
    else if (this.pushT > 0) this.pushT = Math.max(0, this.pushT - dt);
    else this.pushT = Math.min(0, this.pushT + dt);
    this.hspeed = damp(this.hspeed, moved / Math.max(dt, 1e-4), 10, dt);
    this.speed = this.hspeed;
    if (this.hspeed < 0.25) this.idleT += dt; else this.idleT = 0;
    // backwards detection (for the "never walk backwards" rule)
    const vlen = Math.hypot(this.vel.x, this.vel.z);
    this.backwards = vlen > 1 && (this.vel.x * fw.x + this.vel.z * fw.z) / vlen < -0.6;
    // breath
    const wantHold = (K.KeyH || Input.breathBtn) && this.breathLock <= 0;
    this.breathLock -= dt;
    if (wantHold) { this.breath -= dt / 12; this.holding = true; if (this.breath <= 0) { this.breath = 0; this.holding = false; this.breathLock = 1.8; Sound.gasp(); this.shake = 0.25; Bus.emit('gasp'); } }
    else { this.holding = false; this.breath = Math.min(1, this.breath + dt / 4); }
    // footsteps
    if (this.onGround && this.hspeed > 0.6) {
      this.stepAcc += moved; this.bobT += moved * (this.running ? 1.25 : 1.6);
      const stride = this.running ? 1.05 : this.sneaking ? 0.6 : 0.78;
      if (this.stepAcc > stride) { this.stepAcc = 0; const indoor = this.zones.has('teahouse'); Sound.step({ run: this.running, soft: this.sneaking, wood: indoor, wet: this.area === 'surface' && !indoor ? G.wet * (0.3 + G.glow * 0.7) : 0 }); }
    }
    // camera
    this.eyeCur = damp(this.eyeCur, this.eye, 6, dt);
    const bobAmp = this.running ? 0.07 : this.sneaking ? 0.015 : 0.04;
    const bob = Math.sin(this.bobT * PI) * bobAmp * Math.min(1, this.hspeed / 3);
    this.shake = Math.max(0, this.shake - dt * 0.8);
    const sh = this.shake * this.shake;
    this.dip = Math.max(0, this.dip - dt);
    const dipA = Math.sin(clamp(this.dip / 1.2, 0, 1) * PI) * 0.6;
    cam.position.set(this.pos.x + rand(-1, 1) * sh * 0.3, this.pos.y + this.eyeCur + bob + rand(-1, 1) * sh * 0.3 - dipA * 0.25, this.pos.z + rand(-1, 1) * sh * 0.3);
    this.roll = damp(this.roll, (Consequences.tilt > 0 ? 0.2 : 0) + (this.area === 'metro' ? Metro.sway : 0), 2, dt);
    cam.rotation.set(this.pitch - dipA, this.yaw, this.roll);
    const fov = 72 + (this.running && this.hspeed > 5 ? 5 : 0) + this.fovKick;
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = damp(cam.fov, fov, 5, dt); cam.updateProjectionMatrix(); }
    if (this.pitch > 0.75) this.lookUpT += dt; else this.lookUpT = 0;
    this.updateZones(false);
    this.findTarget();
  },
  updateZones(silent) {
    const list = Zones.at(this.pos.x, this.pos.z, this.zoneList).filter((z) => z.area === this.area);
    const now = new Set();
    for (const z of list) { now.add(z.id); if (z.group) now.add(z.group); }
    if (!silent) {
      for (const id of now) if (!this.zones.has(id)) Bus.emit('enterZone', id);
      for (const id of this.zones) if (!now.has(id)) Bus.emit('exitZone', id);
    }
    this.zones = now;
    let best = null; for (const z of list) if (z.cn && (!best || z.prio > best.prio)) best = z;
    this.place = best;
  },
  in(id) { return this.zones.has(id); },
  findTarget() {
    const cam = G.camera;
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation);
    let best = null, bs = -1e9;
    for (const it of Inter.list) {
      if (!it.on || it.area !== this.area) continue;
      const dx = it.x - this.pos.x, dz = it.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > it.r) continue;
      const v = new THREE.Vector3(it.x - cam.position.x, it.y - cam.position.y, it.z - cam.position.z);
      const ang = v.angleTo(dir) / DEG;
      if (ang > it.angle && d > 1.0) continue;
      if (ang > 80) continue;
      const s = -ang * 0.05 - d;
      if (s > bs) { bs = s; best = it; }
    }
    this.target = best;
  },
  npcInView(maxD = 4.2, deg = 38) { // lenient target for greeting/bowing
    if (this.target && this.target.kind === 'npc') return this.target;
    const f = this.forward; let best = null, bs = 1e9;
    for (const n of NPCS) {
      if (n.hidden || n.area !== this.area || !n.inter) continue;
      const dx = n.pos.x - this.pos.x, dz = n.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d > maxD || d < 0.01) continue;
      const ang = Math.acos(clamp((dx * f.x + dz * f.z) / d, -1, 1)) / DEG;
      if (ang > deg) continue;
      const s = d + ang * 0.03; if (s < bs) { bs = s; best = n.inter; }
    }
    return best;
  },
  lookingAt(x, y, z, deg) {
    const cam = G.camera, dir = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation);
    const v = new THREE.Vector3(x - cam.position.x, y - cam.position.y, z - cam.position.z);
    return v.angleTo(dir) / DEG < deg;
  },
};
