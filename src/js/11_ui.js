/* HUD, overlays, bubbles. */

const UI = {
  bubbles: [], floats: [], toastT: 0, tintT: 0, subT: 0, orderOpen: false, talkOpen: false,
  init() {
    if (IS_TOUCH) document.body.classList.add('touch');
    this.el = {
      cmd: $('#cmd'), cmdText: $('#cmd-text'), cmdNum: $('#cmd-num'), strike: $('#cmd-strike'), stamp: $('#stamp'),
      rules: $('#rules-list'), ruleCount: $('#rulecount'), sub: $('#subtitle'), prompt: $('#prompt'), cross: $('#crosshair'),
      breath: $('#breath'), breathBar: $('#breath .bar i'), progress: $('#progress'), toast: $('#toast'), inv: $('#inv'),
      edge: $('#edge'), lookup: $('#lookup'), lock: $('#lockhint'), bubbles: $('#bubbles'), flash: $('#flash'), tint: $('#tint'),
      loc: $('#loc'), clock: $('#clock'), sky: $('#sky'), mood: $('#moodname'), moodbar: $('#moodbar i'), cmdcount: $('#cmdcount'),
    };
    const keys = IS_TOUCH ? [] : [['WASD', 'move'], ['Mouse', 'look'], ['Shift', 'run'], ['C', 'walk slowly'], ['Space', 'jump'], ['E', 'use'], ['F', 'say hello'], ['G', 'bow'], ['H', 'hold breath'], ['Q', 'talk back'], ['Esc', 'pause']];
    $('#keys').innerHTML = keys.map(([k, v]) => `<span class="key">${k}</span>${v}`).join(' &nbsp; ');
    const how = [['WASD / arrows', 'Walk'], ['Mouse', 'Look around (click to capture)'], ['Shift', 'Run'], ['C (hold)', 'Walk slowly'], ['Space', 'Jump'], ['E', 'Use / pick up / sit / pay'], ['F', 'Say hello (talking!)'], ['G', 'Bow'], ['H (hold)', 'Hold your breath'], ['Q', 'Talk back to the Narrator'], ['Esc / P', 'Pause, restart from last command']];
    const howT = [['Left thumb', 'Drag to walk (gently = slowly)'], ['Right thumb', 'Drag to look'], ['E / F / G', 'Use · Say hello · Bow'], ['⇧', 'Toggle running'], ['H', 'Hold to hold your breath'], ['💬', 'Talk back to the Narrator'], ['❚❚', 'Pause']];
    $('#how-grid').innerHTML = (IS_TOUCH ? howT : how).map(([k, v]) => `<span class="key">${k}</span><span>${v}</span>`).join('');
    if (IS_TOUCH) $('#breathkey').textContent = 'H button';
  },
  show(id, on) { $(id).classList.toggle('hidden', !on); },
  subtitle(text, mood) {
    const s = this.el.sub;
    if (!text || !Settings.subs) { s.classList.remove('on'); return; }
    s.innerHTML = `<span class="who">THE NARRATOR</span>${text.replace(/</g, '&lt;')}`;
    s.classList.add('on'); s.classList.toggle('m3', mood === 3);
  },
  command(text, num, o = {}) {
    const e = this.el;
    e.cmdText.textContent = text; e.cmdNum.textContent = o.pending ? '' : '#' + num;
    e.strike.classList.toggle('hidden', !o.strike); if (o.strike) e.strike.textContent = o.strike;
    if (!o.pending) { e.cmd.classList.remove('pop'); void e.cmd.offsetWidth; e.cmd.classList.add('pop'); }
    e.cmd.style.opacity = o.pending ? 0.55 : 1;
    if (e.cmdcount) e.cmdcount.textContent = 'Command ' + num;
  },
  stamp(r) {
    const map = { obey: ['OBEYED', '#3fbf8a'], late: ['LATE', '#f2c14e'], lie: ['LIED TO', '#c77dff'], secret: ['SECRET', '#36e0ff'], disobey: ['IGNORED', '#e2412f'], timeout: ['IGNORED', '#e2412f'], lateFail: ['IGNORED', '#e2412f'] };
    const [t, c] = map[r] || map.disobey;
    const s = this.el.stamp; s.textContent = t; s.style.color = c; s.classList.remove('show'); void s.offsetWidth; s.classList.add('show');
  },
  flash(color = 'rgba(255,240,200,0.28)') {
    const f = this.el.flash; f.style.background = color; f.style.transition = 'none'; f.style.opacity = 1;
    requestAnimationFrame(() => { f.style.transition = 'opacity 0.7s'; f.style.opacity = 0; });
  },
  tint(color, secs) {
    const t = this.el.tint;
    if (!color) { t.style.opacity = 0; this.tintT = 0; return; }
    t.style.background = `radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, ${color} 100%)`; t.style.opacity = 1; this.tintT = secs;
  },
  toast(cn, en, secs = 3) { const t = this.el.toast; t.querySelector('.cn').textContent = cn; t.querySelector('.en').textContent = en; t.classList.add('on'); this.toastT = secs; },
  rules(active, added, removed) {
    const ol = this.el.rules;
    if (!active.length) { ol.innerHTML = '<div class="none">No rules. For now.</div>'; }
    else ol.innerHTML = active.map((r, i) => {
      const k = IS_TOUCH ? r.def.keyTouch : r.def.key;
      return `<li data-id="${r.id}" class="${added.includes(r.id) ? 'new' : ''}"><span class="n">${i + 1}</span><span>${r.def.text}${k ? `<span class="k">(${k})</span>` : ''}</span></li>`;
    }).join('');
    this.el.ruleCount.textContent = active.length + '/3';
    this.show('#breath', active.some((r) => r.id === 'hold_breath'));
  },
  ruleBroken(id) { const li = this.el.rules.querySelector(`li[data-id="${id}"]`); if (li) { li.classList.remove('broken'); void li.offsetWidth; li.classList.add('broken'); } },
  ruleWarn(id) { const li = this.el.rules.querySelector(`li[data-id="${id}"]`); if (li) { li.classList.remove('warn'); void li.offsetWidth; li.classList.add('warn'); } },
  progress(label, f) {
    if (label === null) { this.show('#progress', false); return; }
    this.show('#progress', true); $('#progress span').textContent = label; $('#progress .bar i').style.width = Math.round(clamp(f, 0, 1) * 100) + '%';
  },
  edgeArrow(v) {
    const e = this.el.edge;
    if (!v) { e.style.display = 'none'; return; }
    let x = v.x, y = v.y; if (v.z > 1) { x = -x; y = -y; }
    const a = Math.atan2(y, x); const m = 0.86;
    const k = Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    const ex = Math.cos(a) / k * m, ey = Math.sin(a) / k * m;
    e.style.display = 'block'; e.style.left = ((ex + 1) / 2 * window.innerWidth) + 'px'; e.style.top = ((1 - ey) / 2 * window.innerHeight) + 'px';
    e.style.transform = `rotate(${-a + Math.PI}rad)`;
  },
  lookHint(on) { this.show('#lookup', on); },
  lockHint(on) { this.show('#lockhint', on); },
  inventory() {
    const I = Game.inv, out = [];
    if (I.oranges) out.push('<span>🍊</span>');
    if (I.dumplings) out.push(`<span>🥟<small>×${I.dumplings}</small></span>`);
    if (I.cat) out.push('<span>🐈</span>');
    if (I.ribbon) out.push('<span>🎀</span>');
    this.el.inv.innerHTML = out.join('');
  },
  bubble(n, cn, en, dur = 2.6) {
    const old = this.bubbles.find((b) => b.n === n); if (old) { old.el.remove(); this.bubbles.splice(this.bubbles.indexOf(old), 1); }
    if (this.bubbles.length > 4) { const b = this.bubbles.shift(); b.el.remove(); }
    const el = document.createElement('div'); el.className = 'bubble'; el.innerHTML = `${cn}<small>${en}</small>`;
    this.el.bubbles.appendChild(el); this.bubbles.push({ n, el, t: dur });
  },
  floatIcon(ch, pos, color = '#fff') {
    const el = document.createElement('div'); el.className = 'float'; el.textContent = ch; el.style.color = color;
    this.el.bubbles.appendChild(el); this.floats.push({ el, pos: pos.clone ? pos.clone() : new THREE.Vector3(pos.x, pos.y, pos.z), t: 1.6 });
  },
  project(p, out) {
    const v = new THREE.Vector3(p.x, p.y, p.z).project(G.camera);
    out.x = (v.x + 1) / 2 * window.innerWidth; out.y = (1 - v.y) / 2 * window.innerHeight; out.ok = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
    return out;
  },
  openOrder(cb) {
    const items = MENU.slice().sort(() => Math.random() - 0.5);
    const box = $('#order .items');
    box.innerHTML = items.map((m, i) => `<button data-i="${i}"><span><span class="key">${i + 1}</span><span class="cn">${m.cn}</span><span class="en">${m.en}</span></span><span class="p">¥${m.price}</span></button>`).join('');
    this.orderItems = items; this.orderCb = cb; this.orderOpen = true; this.show('#order', true);
    Input.releaseLock();
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => this.pickOrder(+b.dataset.i)));
  },
  pickOrder(i) {
    if (!this.orderOpen || !this.orderItems[i]) return;
    this.orderOpen = false; this.show('#order', false); Sound.sting('ui');
    const it = this.orderItems[i]; npcBubble(NPCById.cook, ['好嘞！' + it.cn + '！', 'Coming right up! ' + it.en + '!'], 2.5);
    if (!IS_TOUCH) Input.requestLock();
    this.orderCb && this.orderCb(it);
  },
  openTalk() {
    const showStop = Game.stats.talkNo >= 2 || Narrator.mood >= 2 || Cmd.num >= 15;
    const opts = [['ok', 'Okay.'], ['why', 'Why?'], ['no', 'No.']];
    if (showStop) opts.push(['stop', 'Please stop talking.']);
    $('#talk .opts').innerHTML = opts.map(([k, t], i) => `<button data-k="${k}" class="${k === 'stop' ? 'stop' : ''}"><span class="key">${i + 1}</span>${t}</button>`).join('');
    $('#talk .opts').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => Game.talkBack(b.dataset.k)));
    this.talkKeys = opts.map((o) => o[0]);
    this.talkOpen = true; this.show('#talk', true); this.talkT = 8;
  },
  closeTalk() { this.talkOpen = false; this.show('#talk', false); },
  update(dt) {
    const e = this.el;
    // prompt
    const it = P.target;
    let html = '';
    const lab = (v) => (typeof v === 'function' ? v() : v);
    if (it && Game.state === 'play' && !Game.paused) {
      const E = lab(it.E), F = it.F && (it.npc && it.npc.id === 'fruitVendor' && Cmd.is('pay_vendor') ? 'Haggle' : it.F), Gb = it.G;
      if (E) html += `<div class="kp"><kbd>E</kbd>${E}</div>`;
      if (F) html += `<div class="kp"><kbd>F</kbd>${F}</div>`;
      if (Gb) html += `<div class="kp"><kbd>G</kbd>${Gb}</div>`;
      if (IS_TOUCH) { $('#tb-e small').textContent = E || 'Use'; $('#tb-e').classList.toggle('ready', !!E); $('#tb-f').classList.toggle('ready', !!F); $('#tb-g').classList.toggle('ready', !!Gb); $('#tb-f small').textContent = F === 'Haggle' ? 'Haggle' : 'Hello'; }
    } else if (IS_TOUCH) { $('#tb-e small').textContent = 'Use'; ['#tb-e', '#tb-f', '#tb-g'].forEach((s) => $(s).classList.remove('ready')); }
    if (P.seat && !it) html += `<div class="kp"><kbd>${IS_TOUCH ? '◀▶' : 'WASD'}</kbd>Stand up</div>`;
    if (html !== this._ph) { e.prompt.innerHTML = html; this._ph = html; }
    e.cross.classList.toggle('t', !!it);
    // breath
    if (!e.breath.classList.contains('hidden') || P.holding) {
      if (P.holding) this.show('#breath', true);
      e.breathBar.style.width = Math.round(P.breath * 100) + '%'; e.breath.classList.toggle('holding', P.holding);
    }
    // status
    const pl = P.place;
    const cn = pl ? pl.cn : (P.area === 'metro' ? '地铁站' : '街坊'), en = pl ? pl.en : (P.area === 'metro' ? 'Metro' : 'The Neighborhood');
    const locKey = cn + en + (P.area === 'metro' ? Metro.station : '');
    if (locKey !== this._loc) { this._loc = locKey; const extra = P.area === 'metro' ? ` · ${STATIONS[Metro.station].en}` : ''; e.loc.innerHTML = `<span class="cn">${cn}</span><span class="en">${en}${extra}</span>`; }
    const mins = Math.round(lerp(7 * 60 + 30, 21 * 60 + 40, G.progress));
    const clk = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    if (clk !== this._clk) { this._clk = clk; e.clock.textContent = clk; e.sky.textContent = G.progress < 0.62 ? '☀' : G.progress < 0.78 ? '🌇' : '🌙'; }
    e.mood.textContent = MOOD_NAMES[Narrator.mood]; e.moodbar.style.width = Math.round(Game.annoyance) + '%';
    // timers
    if (this.toastT > 0 && (this.toastT -= dt) <= 0) e.toast.classList.remove('on');
    if (this.tintT > 0 && (this.tintT -= dt) <= 0) e.tint.style.opacity = 0;
    if (this.talkOpen && (this.talkT -= dt) <= 0) this.closeTalk();
    // bubbles follow their NPC heads
    const o = {};
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i]; b.t -= dt;
      const n = b.n, hp = n.root ? { x: n.root.position.x, y: n.root.position.y + (n.height || 1.7) * (n.headScale > 1.2 ? 1.25 : 1) + 0.35, z: n.root.position.z } : n;
      this.project(hp, o);
      const vis = o.ok && (!n.area || n.area === P.area) && Math.hypot(hp.x - P.pos.x, hp.z - P.pos.z) < 26;
      b.el.style.display = vis ? 'block' : 'none'; b.el.style.left = o.x + 'px'; b.el.style.top = o.y + 'px';
      if (b.t <= 0) { b.el.remove(); this.bubbles.splice(i, 1); }
    }
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i]; f.t -= dt; this.project({ x: f.pos.x, y: f.pos.y + 0.8, z: f.pos.z }, o);
      f.el.style.left = o.x + 'px'; f.el.style.top = o.y + 'px'; f.el.style.display = o.ok ? 'block' : 'none';
      if (f.t <= 0) { f.el.remove(); this.floats.splice(i, 1); }
    }
  },
  clearBubbles() { for (const b of this.bubbles) b.el.remove(); this.bubbles = []; for (const f of this.floats) f.el.remove(); this.floats = []; },
  fadeText(t) { const f = $('#fade .ftext'); if (!t) { f.classList.remove('on'); return; } f.textContent = t; f.classList.add('on'); },
  fade(on) { $('#fade').classList.toggle('on', on); },
};
