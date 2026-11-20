/* Game state machine, main loop, endings. */

CONS_LINES.gasp = ['Everyone heard that. That was the loudest breath in the history of public transport.', 'You breathed. Everyone turned around. Public transport is a stage, and you were the show.', 'A gasp. In the metro. People will talk about this at dinner.'];
CONS_LINES.spicy = ['That was hot.', 'Very hot.'];
LINES.edge = ['There is nothing out there. I have not written it yet.', 'That is the edge of the story. Turn around.', 'Beyond here is just fog and my unfinished ideas.', 'No. That way is the rest of the city. It is not ready.', 'The map ends here. Like all maps. Eventually.', 'Out there? Accountants. Traffic. Nothing for you.', 'You have reached the end of the neighborhood. Congratulations. Go back.', 'I only built this much. Be grateful.'];

LINES.teaSip = ['Good tea? Do not answer. You are not allowed to talk.', 'Sip. Slowly. That tea is older than me.', 'Delicate. Floral. I am guessing. I cannot taste.', 'That is a very serious cup of tea.', 'Mm. I imagine that was lovely.', 'Sipping without being told. Initiative. I will allow it.', 'Careful. Hot. That one is not a lie.', 'Lovely. Tea is the only thing in this city quieter than you.'];

const ENDINGS = {
  obedient: { title: 'The Good Listener', cn: '听话的人', lines: ['You did everything I said.', 'Every little thing.', 'Can I tell you a secret? I never know where we are going. I just say things. And you make them true.', 'Goodnight. Same time tomorrow?'] },
  rebel: { title: 'The Unwritten', cn: '不按剧本的人', lines: ['You did not listen to a single word.', 'The street rearranged itself. Strangers stared. Somebody chased you with a dumpling.', 'It was the best walk I have ever narrated.', 'Do not tell anyone. Goodnight.'] },
  balanced: { title: 'The Walk', cn: '散步', lines: ['Some of it you did. Some of it you did not.', 'I suppose that is what people do.', 'I am starting to think I was never really in charge.', 'I am starting to think that is fine. Goodnight.'] },
  silence: { title: 'The Quiet', cn: '安静', lines: ['…thank you for the walk.'] },
};

const Game = {
  state: 'loading', paused: false, annoyance: 0, silenceMode: false, soft: false, metroStation: null, expectUnlock: false,
  stopCount: 0, playT: 0, transit: false, cds: {}, ribbons: [],
  overlayOpen() { return UI.orderOpen || this.paused || this.state !== 'play'; },
  init() {
    initTextures(); initGraphics(); Voice.init(); UI.init(); Input.init();
    Voice.enabled = Settings.voice; Sound.vol = Settings.volume;
    buildCity(); Metro.build(); Traffic.build();
    if (!glassB.empty) { const gm = glassB.build(G.mat.glass); gm.renderOrder = 3; G.scene.add(gm); }
    S.build(G.mat.solid, G.scene, { cast: !G.low, receive: true }); LB.build(G.mat.glow, G.scene); WN.build(G.mat.lit, G.scene, { order: 1 });
    buildGround(); buildHalos(); buildStreaks(); G.scene.add(Steam.points);
    spawnPeople(); Cat.build(); Pigeons.build(); NAV.build(); Hints.build();
    Inter.add({ id: 'oranges', kind: 'oranges', x: A.oranges.x, y: A.oranges.y, z: A.oranges.z, r: 2.3, E: 'Pick up the oranges', angle: 45 });
    Inter.add({ id: 'fish', kind: 'fish', x: A.fish.x, y: A.fish.y, z: A.fish.z, r: 2.3, E: 'Grab a fish', angle: 40 });
    Inter.add({ id: 'bell', kind: 'bell', x: A.bell.x, y: A.bell.y, z: A.bell.z, r: 3.2, E: 'Ring the bell', angle: 40 });
    Inter.add({ id: 'wish_tree', kind: 'wish', x: A.wishTree.x, y: A.wishTree.y, z: A.wishTree.z, r: 3.6, E: 'Tie a red ribbon', angle: 50 });
    NPCById.fruitVendor.inter.E = () => (Cmd.is('pay_vendor') || (Game.inv.oranges && !Game.inv.paid) ? 'Pay ¥6' : null);
    NPCById.dumplingAuntie.inter.E = () => (!Game.inv.bought || Cmd.is('buy_dumpling') ? 'Buy one dumpling (¥2)' : null);
    this.wire();
    this.resetRun();
    this.bindUI();
    G.camera.position.set(0, 3, 0);
    applyTimeOfDay(0.86, 0);
    try { G.renderer.compile(G.scene, G.camera); } catch (e) { /* ignore */ }
    $('#loading').classList.add('hidden');
    this.toTitle();
    this.last = performance.now();
    const loop = () => { requestAnimationFrame(loop); this.frame(); };
    loop();
  },
  wire() {
    Bus.on('interact', (it) => { this.act(it); Cmd.event('interact', it); });
    Bus.on('greet', (it) => { Rules.event('greet', it); Cmd.event('greet', it); });
    Bus.on('bow', (it) => Cmd.event('bow', it));
    Bus.on('jump', () => { Rules.event('jump'); Cmd.event('jump'); if (P.jumpTimes.length >= 3) this.chat('jump', 22); const n = People.nearest(P, 4); if (n && Math.random() < 0.3) npcBubble(n, pick(LINES.npcJump)); });
    Bus.on('gasp', () => Rules.event('gasp'));
    Bus.on('sit', (s) => Cmd.event('sit', s));
    Bus.on('enterZone', (id) => {
      Cmd.event('enterZone', id);
      if (id.startsWith('kiosk_')) { const k = G.kiosks[id.slice(6)]; if (k && !k.shutter.on) this.enterMetro(k.id); }
      if (id === 'metro_exit') this.exitMetro();
    });
    for (const ev of ['metroStop', 'metroAlight', 'metroBoard', 'metroDepart']) Bus.on(ev, (d) => Cmd.event(ev, d));
    Bus.on('wallBump', () => { this.stats.wallBumps++; this.chat('wallBump', 9); });
    Bus.on('npcBump', () => { this.stats.npcBumps++; this.annoy(1); this.chat('npcBump', 10); });
    Bus.on('edge', () => this.chat('edge', 8));
    Bus.on('narratorLine', () => { if (Math.random() < 0.13 && this.state === 'play') People.hear(P); });
  },
  chat(type, cd) {
    if (this.state !== 'play') return;
    const t = Narrator.t; if ((this.cds[type] || -99) > t) return;
    this.cds[type] = t + cd; Narrator.chatter(type);
  },
  act(it) {
    switch (it.kind) {
      case 'seat': P.sit(it.seat); Sound.tone(160, 0.18, { gain: 0.1, glide: 110 }); break;
      case 'cat': Cat.pet(); break;
      case 'tea': Sound.slurp(); steamBurst(it.x, it.y + 0.1, it.z, 6, 0.05); if (!Cmd.cur || Math.random() < 0.5) this.chat('teaSip', 30); break;
      case 'chili': if (!Cmd.is('chili_lie')) { Consequences.trigger('spicy'); Narrator.say('That was chili oil. Very hot chili oil. Nobody asked you to do that.', { prio: 1.5 }); } break;
      case 'oranges': if (!this.inv.oranges) { this.inv.oranges = true; G.orangeBag.visible = false; it.on = false; UI.floatIcon('🍊', new THREE.Vector3(it.x, it.y, it.z)); UI.inventory(); Sound.pop(); } break;
      case 'fish': Sound.tone(300, 0.25, { glide: 700, gain: 0.08 }); UI.floatIcon('🐟', new THREE.Vector3(it.x, it.y, it.z)); npcBubble(NPCById.fishVendor, ['那是我的鱼！', 'That is my fish!']); break;
      case 'bell': Sound.templeBell(); P.shake = 0.1; break;
      case 'wish': {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.6, 0.02), new THREE.MeshBasicMaterial({ color: 0xff2a1c, toneMapped: false }));
        const a = rand(0, TAU); m.position.set(A.wishTree.x + Math.cos(a) * 1.6, rand(2.3, 3.2), A.wishTree.z + Math.sin(a) * 1.6); m.rotation.y = rand(0, PI);
        G.scene.add(m); this.ribbons.push(m); this.inv.ribbon = true; UI.inventory(); Sound.ribbon(); UI.floatIcon('🎀', m.position);
        break;
      }
      case 'npc': {
        const n = it.npc;
        if (n.id === 'fruitVendor' && !Cmd.is('pay_vendor') && this.inv.oranges && !this.inv.paid) { this.inv.paid = true; Sound.pay(); npcBubble(n, ['谢谢！', 'Thank you!']); }
        if (n.id === 'dumplingAuntie' && !Cmd.is('buy_dumpling')) { this.inv.dumplings++; this.inv.bought = true; UI.inventory(); Sound.pay(); npcBubble(n, ['好吃！', 'Delicious!']); }
        break;
      }
    }
  },
  onKey(k) {
    if (k === 'Enter' && this.state === 'title') { this.start(); return; }
    if (this.state === 'intro') { if (['Space', 'Enter', 'Escape', 'KeyE', 'KeyW'].includes(k)) this.skipIntro(); return; }
    if (this.state !== 'play') return;
    if (k === 'Escape' || k === 'KeyP') { if (UI.orderOpen) return; if (UI.talkOpen) { UI.closeTalk(); return; } if (this.paused) this.resume(); else this.pause(); return; }
    if (this.paused) return;
    const digit = /^Digit([1-9])$/.exec(k) || /^Numpad([1-9])$/.exec(k);
    if (UI.orderOpen) { if (digit) UI.pickOrder(+digit[1] - 1); return; }
    if (UI.talkOpen) { if (digit && UI.talkKeys[+digit[1] - 1]) { this.talkBack(UI.talkKeys[+digit[1] - 1]); return; } if (k === 'KeyQ') { UI.closeTalk(); return; } }
    if (!Input.enabled) return;
    if (k === 'Space' && IS_TOUCH) Input.pressed.add('Space');
    switch (k) {
      case 'KeyE': { const it = P.target; if (it) { const E = typeof it.E === 'function' ? it.E() : it.E; if (E) Bus.emit('interact', it); } break; }
      case 'KeyF': {
        const it = P.npcInView();
        if (it) People.greet(it.npc, P); else { const f = P.forward; UI.floatIcon('你好？', new THREE.Vector3(P.pos.x + f.x * 2, P.pos.y + 1.2, P.pos.z + f.z * 2), '#fff'); Sound.tone(440, 0.15, { type: 'triangle', gain: 0.04 }); }
        Bus.emit('greet', it); break;
      }
      case 'KeyG': { P.dip = 1.2; const it = P.npcInView(); if (it) setTimeout(() => People.bow(it.npc), 450); Bus.emit('bow', it); break; }
      case 'KeyQ': UI.openTalk(); break;
    }
  },
  talkBack(k) {
    UI.closeTalk();
    const said = { ok: 'Okay.', why: 'Why?', no: 'No.', stop: 'Please stop talking.' }[k];
    UI.toast('你', `You: “${said}”`, 1.8);
    if (Rules.has('no_talking') && !this.cds.talkJoke) { this.cds.talkJoke = 1; Narrator.say('Talking to me does not count. I am not anyone. I am the narrator.', { prio: 1.5 }); }
    switch (k) {
      case 'ok': this.stats.talkOk++; this.annoy(-3); Narrator.say(Narrator.line('talkOk'), { prio: 2.5, interrupt: true }); break;
      case 'why': this.annoy(1); Narrator.say(Narrator.line('talkWhy'), { prio: 2.5, interrupt: true }); break;
      case 'no': this.stats.talkNo++; this.annoy(5); Narrator.say(Narrator.line('talkNo'), { prio: 2.5, interrupt: true }); break;
      case 'stop': if (this.stopCount++ === 0) { this.annoy(4); Narrator.say(Narrator.line('talkStop1'), { prio: 2.5, interrupt: true }); } else this.silence(); break;
    }
  },
  silence() {
    if (this.silenceMode) return;
    this.silenceMode = true; this.stats.silenced = true;
    if (Cmd.c) Cmd.c.live = false; Cmd.pending = null; Hints.hide(); UI.progress(null); Chaser.end();
    Narrator.queue.length = 0;
    const seq = ['Oh.', 'You mean it.', 'Alright. I will be quiet.', 'The way home is lit. You will not need me for that.'];
    seq.forEach((l, i) => Narrator.say(l, { prio: 3, interrupt: i === 0, force: true, soft: true, onEnd: i === seq.length - 1 ? () => this.afterSilence() : null }));
    Sound.tone(220, 2.5, { type: 'triangle', gain: 0.06, glide: 110 });
  },
  afterSilence() {
    Narrator.silent = true; Rules.active = []; UI.rules([], [], []); $('#rules').style.opacity = 0.3;
    UI.command('', Cmd.num, { pending: true }); $('#cmd').style.opacity = 0.18;
    setKiosksOpen(true);
    setTimeout(() => { if (this.state === 'play') Hints.show({ node: 'home' }); }, 3000);
  },
  annoy(v) { this.annoyance = clamp(this.annoyance + v, 0, 100); this.peak = Math.max(this.peak, this.annoyance); },
  mood() {
    if (this.silenceMode || this.soft) return 4;
    const n = Cmd.num;
    const prog = n <= 6 ? 0 : n <= 13 ? 1 : n <= 20 ? 2 : 3;
    const ann = this.annoyance < 25 ? 0 : this.annoyance < 50 ? 1 : this.annoyance < 75 ? 2 : 3;
    return Math.max(prog, ann);
  },
  resetRun() {
    this.stats = { obeyed: 0, ignored: 0, rulesBroken: 0, lies: 0, secrets: 0, consequences: 0, wallBumps: 0, npcBumps: 0, talkNo: 0, talkOk: 0, restarts: 0, log: [], chased: false, silenced: false };
    this.inv = { oranges: false, paid: false, dumplings: 0, cat: false, bought: false, ribbon: false };
    this.annoyance = 0; this.peak = 0; this.hist = [0]; this.histT = 0; this.silenceMode = false; this.soft = false; this.metroStation = null;
    this.stopCount = 0; this.playT = 0; this.paused = false; this.cds = {}; this.transit = false;
    Narrator.reset(); Narrator.mood = 0; Cmd.reset(); Rules.active = []; UI.rules([], [], []);
    Consequences.clear(); Chaser.end(); Hints.hide(); FX.clear(); UI.clearBubbles(); UI.progress(null); UI.closeTalk();
    for (const p of G.props) { p.anim = null; p.mesh.position.copy(p.home); p.mesh.rotation.y = p.ry; if (p.mesh.userData.col) { const c = p.mesh.userData.col, w = c.x1 - c.x0, d = c.z1 - c.z0; c.x0 = p.home.x - w / 2; c.x1 = p.home.x + w / 2; c.z0 = p.home.z - d / 2; c.z1 = p.home.z + d / 2; c.on = true; } }
    for (const s of G.signs) { s.mat.map = s.tex; s.mat.needsUpdate = true; }
    for (const m of this.ribbons) G.scene.remove(m); this.ribbons = [];
    G.cyGate.target = 0; G.cyGate.open = 0; setKiosksOpen(false); Metro.reset('neon');
    Cat.reset(); Queue.reset(); Queue.active = false;
    G.orangeBag.visible = true; const ob = Inter.get('oranges'); if (ob) ob.on = true;
    if (Food.mesh) { G.scene.remove(Food.mesh); Food.mesh = null; }
    for (const n of NPCS) { n.stareT = 0; n.headScaleT = 1; }
    $('#rules').style.opacity = 1; $('#cmd').style.opacity = 1;
    G.progress = 0; UI.inventory();
    P.teleport(A.start.x, A.start.z, A.start.yaw, 'surface');
  },
  bindUI() {
    const on = (id, f) => $(id).addEventListener('click', (e) => { e.stopPropagation(); Sound.sting('ui'); f(); });
    on('#b-begin', () => this.start());
    on('#b-how', () => { UI.show('#how', true); });
    on('#b-how-close', () => UI.show('#how', false));
    const vtxt = () => { $('#b-voice').textContent = 'Voice: ' + (Settings.voice ? 'On' : 'Off'); $('#b-voice2').textContent = Settings.voice ? 'On' : 'Off'; };
    const toggleVoice = () => { Settings.voice = !Settings.voice; Voice.enabled = Settings.voice; if (!Settings.voice) Voice.cancel(); vtxt(); saveSettings(); };
    on('#b-voice', toggleVoice); on('#b-voice2', toggleVoice); vtxt();
    on('#b-sound', () => { Sound.init(); Sound.setMuted(!Sound.muted); $('#b-sound').textContent = 'Sound: ' + (Sound.muted ? 'Off' : 'On'); });
    on('#b-resume', () => this.resume());
    on('#b-restart-cmd', () => this.restartFromCheckpoint());
    on('#b-restart', () => { UI.show('#pause', false); this.paused = false; this.start(); });
    on('#b-quit', () => { UI.show('#pause', false); this.paused = false; Voice.cancel(); this.toTitle(); });
    on('#b-again', () => { UI.show('#result', false); this.start(); });
    on('#b-title', () => { UI.show('#result', false); this.toTitle(); });
    const vol = $('#r-vol'), sens = $('#r-sens');
    vol.value = Settings.volume; sens.value = Settings.sens;
    vol.addEventListener('input', () => { Settings.volume = +vol.value; Sound.setVolume(Settings.volume); Voice.volume = Settings.volume > 0 ? Math.min(1, Settings.volume + 0.2) : 0; saveSettings(); });
    sens.addEventListener('input', () => { Settings.sens = +sens.value; saveSettings(); });
    const inv = () => { $('#b-invert').textContent = Settings.invert ? 'On' : 'Off'; };
    on('#b-invert', () => { Settings.invert = !Settings.invert; inv(); saveSettings(); }); inv();
    $('#c').addEventListener('click', () => { if (this.state === 'intro') this.skipIntro(); });
    $('#title').addEventListener('click', (e) => { if (e.target === $('#title')) { /* clicking the backdrop does nothing */ } });
  },
  toTitle() {
    this.state = 'title'; this.paused = false; Input.enabled = false; Input.releaseLock();
    ['#hud', '#touch', '#pause', '#result', '#how', '#order', '#talk'].forEach((s) => UI.show(s, false)); UI.show('#title', true); UI.fade(false); UI.fadeText(null);
    Narrator.reset(); this.titleT = 0; G.indoorOverride = 0; P.area = 'surface';
    applyTimeOfDay(0.86, 0); G.progress = 0.86;
  },
  start() {
    Sound.init(); Sound.setVolume(Settings.volume); Voice.unlock();
    if (!IS_TOUCH) Input.requestLock();
    this.resetRun();
    ['#title', '#result', '#pause', '#how'].forEach((s) => UI.show(s, false));
    UI.show('#hud', true); UI.show('#touch', IS_TOUCH);
    this.state = 'intro'; this.introT = 0; P.frozen = true; Input.enabled = false;
    if (!this.avatar) { this.avatar = makePerson({ shirt: '#d9a43a', pants: '#2b2f3a', hairStyle: 'short', hair: '#1a1a1a', skin: '#e8b98f' }); this.avatar.root.rotation.y = PI; this.avatar.root.position.set(A.start.x, 0, A.start.z); G.scene.add(this.avatar.root); }
    this.avatar.root.visible = true; this.avatar.armR.rotation.z = -2.4;
    G.progress = 0; applyTimeOfDay(0, 0);
    UI.command('…', 1, { pending: true });
    Narrator.say('This is you. A regular person, on a regular morning.', { prio: 3 });
    Narrator.say('I am the Narrator. I tell you what to do. You do it. Let us begin.', { prio: 3 });
  },
  skipIntro() {
    if (this.state !== 'intro') return;
    this.state = 'play'; P.frozen = false; Input.enabled = true; this.introT = 99;
    if (this.avatar) this.avatar.root.visible = false;
    Narrator.queue.length = 0; if (Narrator.cur) Narrator.finish(true);
    P.teleport(A.start.x, A.start.z, A.start.yaw, 'surface');
    Cmd.begin(0);
    if (!IS_TOUCH && !Input.locked) Input.requestLock();
  },
  pause() {
    if (this.state !== 'play' || this.paused) return;
    this.paused = true; Voice.pause(); if (Sound.ctx) Sound.ctx.suspend();
    $('#pause-quote').textContent = '“' + Narrator.line('pause') + '”';
    const S = this.stats;
    $('#pause-stats').innerHTML = `<span>Obeyed <b>${S.obeyed}</b></span><span>Ignored <b>${S.ignored}</b></span><span>Rules broken <b>${S.rulesBroken}</b></span><span>Annoyance <b>${Math.round(this.annoyance)}%</b></span>`;
    $('#b-restart-cmd').disabled = !Cmd.checkpoint || this.silenceMode;
    UI.show('#pause', true); Input.releaseLock(); Sound.sting('pause');
  },
  resume() {
    if (!this.paused) return;
    this.paused = false; UI.show('#pause', false); Voice.resume(); if (Sound.ctx) Sound.ctx.resume();
    if (!IS_TOUCH) Input.requestLock();
    if (Math.random() < 0.35 && !Narrator.busy) Narrator.say(Narrator.line('resume'), { prio: 1 });
  },
  restartFromCheckpoint() {
    const cp = Cmd.checkpoint; if (!cp || this.silenceMode) return;
    this.paused = false; UI.show('#pause', false); Voice.resume(); if (Sound.ctx) Sound.ctx.resume();
    if (!IS_TOUCH) Input.requestLock();
    UI.fade(true); Input.enabled = false; this.stats.restarts++;
    setTimeout(() => {
      Consequences.clear(); Chaser.end(); Hints.hide(); UI.closeTalk(); UI.clearBubbles(); UI.progress(null);
      if (UI.orderOpen) { UI.orderOpen = false; UI.show('#order', false); }
      Narrator.reset();
      const def = CMDS[cp.i];
      if (cp.area === 'metro') { if (def.id === 'ride_metro') Metro.placeTrainOpen(cp.origin); else Metro.reset(cp.origin); Metro.wrongWay = cp.wrongWay; }
      P.teleport(cp.x, cp.z, cp.yaw, cp.area);
      if (cp.seat) P.sit(cp.seat);
      if (Cat.state === 'follow') Cat.pos.set(cp.x + 1, 0, cp.z + 1);
      Rules.set(cp.rules);
      Cmd.pending = null; Cmd.begin(cp.i, { restart: true });
      Cmd.c.wait = 0.4; Cmd.c.waitNarr = true;
      Narrator.say(Narrator.line('restart'), { prio: 3 });
      UI.fade(false); Input.enabled = true;
    }, 750);
  },
  enterMetro(k) {
    if (this.transit) return; this.transit = true; UI.fade(true); Input.enabled = false; Sound.whoosh();
    setTimeout(() => {
      Metro.reset(k); setKiosksOpen(true);
      P.teleport(A.metroArrive.x, A.metroArrive.z, A.metroArrive.yaw, 'metro');
      UI.fade(false); Input.enabled = true; this.transit = false;
      UI.toast(STATIONS[k].cn + '站', STATIONS[k].en + ' Station', 2.5);
      Cmd.event('metroEnter', k);
    }, 900);
  },
  exitMetro() {
    if (this.transit) return; this.transit = true; UI.fade(true); Input.enabled = false; Sound.whoosh();
    setTimeout(() => {
      const st = Metro.station, k = G.kiosks[st];
      P.teleport(k.exit.x, k.exit.z, k.exit.yaw, 'surface');
      if (!this.metroStation && Metro.ridden > 0) this.metroStation = st;
      UI.fade(false); Input.enabled = true; this.transit = false;
      UI.toast(STATIONS[st].cn, STATIONS[st].en, 2.2);
    }, 900);
  },
  endingType() {
    if (this.silenceMode) return 'silence';
    const S = this.stats, ratio = S.obeyed / Math.max(1, S.obeyed + S.ignored);
    if (ratio >= 0.72 && S.rulesBroken <= 6) return 'obedient';
    if (ratio < 0.45 || (ratio < 0.62 && S.rulesBroken >= 9)) return 'rebel';
    return 'balanced';
  },
  ending(type) {
    if (this.state !== 'play') return;
    type = type || this.endingType();
    this.endType = type; this.state = 'ending'; Input.enabled = false; P.frozen = true;
    Hints.hide(); UI.closeTalk(); Chaser.end(); UI.progress(null);
    P.yaw = PI; // turn to face the door
    const E = ENDINGS[type];
    const lines = E.lines.slice();
    if (type !== 'silence' && this.inv.cat) lines.splice(lines.length - 1, 0, 'And the cat. You have a cat now. That is on you.');
    Narrator.silent = false; Narrator.mood = 4;
    setTimeout(() => {
      UI.fade(true);
      let i = 0;
      const next = () => {
        if (i >= lines.length) { setTimeout(() => this.showResult(type), 1200); return; }
        const l = lines[i++]; UI.fadeText(l);
        Narrator.say(l, { prio: 3, force: true, soft: true, sub: false, vol: type === 'silence' ? 0.55 : 1, onEnd: () => setTimeout(next, 500) });
      };
      setTimeout(next, 1200);
    }, 900);
  },
  showResult(type) {
    this.state = 'result'; UI.fadeText(null); UI.show('#hud', false); UI.show('#touch', false); Input.releaseLock();
    const E = ENDINGS[type], S = this.stats;
    const total = S.obeyed + S.ignored;
    $('#end-title').textContent = E.title; $('#end-cn').textContent = E.cn;
    const quotes = { obedient: 'You did everything I said. Every little thing.', rebel: 'It was the best walk I have ever narrated. Do not tell anyone.', balanced: 'I am starting to think I was never really in charge.', silence: 'He said nothing else. The city was loud enough.' };
    $('#end-quote').textContent = '“' + quotes[type] + '”';
    const pk = Math.round(this.peak);
    const desc = pk < 20 ? 'Serene' : pk < 40 ? 'Mildly peeved' : pk < 60 ? 'Visibly twitching' : pk < 80 ? 'Unraveling' : 'Completely lost it';
    const mins = Math.floor(this.playT / 60), secs = Math.floor(this.playT % 60);
    const stats = [
      [`${S.obeyed}/${total}`, 'Commands obeyed'], [S.ignored, 'Commands ignored'], [S.rulesBroken, 'Rules broken'],
      [`${pk}%`, 'Peak annoyance · ' + desc], [S.lies, 'Lies believed'], [S.secrets, 'Secrets found'],
      [`${mins}:${String(secs).padStart(2, '0')}`, 'Time walked'], [this.inv.dumplings, 'Dumplings received'], [this.inv.cat ? 'Yes' : 'No', 'Adopted a cat'],
    ];
    $('#end-stats').innerHTML = stats.map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
    const cv = $('#end-graph'), g = cv.getContext('2d'), w = cv.width, h = cv.height;
    g.clearRect(0, 0, w, h);
    const hs = this.hist.concat([this.annoyance]);
    const grd = g.createLinearGradient(0, h, 0, 0); grd.addColorStop(0, '#3fbf8a'); grd.addColorStop(0.5, '#f2c14e'); grd.addColorStop(1, '#e2412f');
    g.beginPath(); hs.forEach((v, i) => { const x = i / Math.max(1, hs.length - 1) * (w - 16) + 8, y = h - 8 - v / 100 * (h - 16); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.strokeStyle = grd; g.lineWidth = 3; g.stroke();
    g.lineTo(w - 8, h - 8); g.lineTo(8, h - 8); g.closePath(); g.globalAlpha = 0.15; g.fillStyle = grd; g.fill(); g.globalAlpha = 1;
    UI.show('#result', true); UI.fade(false);
  },
  frame() {
    const now = performance.now(); let dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (this.state === 'loading') return;
    const cam = G.camera;
    if (!this.paused) {
      if (this.state === 'title') this.titleCam(dt);
      else if (this.state === 'intro') this.introCam(dt);
      else P.update(dt);
      if (this.state === 'play') {
        this.playT += dt;
        this.histT += dt; if (this.histT > 3) { this.histT = 0; this.hist.push(this.annoyance); }
        if (this.silenceMode && P.in('home_door')) this.ending('silence');
        if (P.lookUpT > 4.5 && !Rules.has('dont_look_up') && !Cmd.is('look_up') && !this.soft) this.chat('lookUp', 35);
      }
      People.update(dt, P, cam); Traffic.update(dt, P); Cat.update(dt, P); Pigeons.update(dt, P);
      Metro.update(dt, P); Queue.update(dt); Chaser.update(dt); Consequences.update(dt); FX.update(dt);
      updateSteam(dt, cam, this.state === 'title' ? 'surface' : P.area);
      Hints.update(dt);
      if (this.state === 'play') { Rules.update(dt); Cmd.update(dt); }
      Narrator.mood = this.mood();
      Narrator.update(dt);
      // time of day follows the walk
      if (this.state === 'play' || this.state === 'intro' || this.state === 'ending') {
        const target = this.silenceMode ? 1 : clamp((Cmd.num - 1) / 27, 0, 1);
        const rate = this.silenceMode ? 0.02 : 0.012;
        G.progress += clamp(target - G.progress, -rate * dt * 4, rate * dt);
        G.indoorOverride = P.area === 'metro' ? 1 : 0;
        applyTimeOfDay(G.progress, dt);
      } else applyTimeOfDay(G.progress, dt);
      // courtyard gate
      const gt = G.cyGate; gt.open = damp(gt.open, gt.target, 2.5, dt);
      gt.left.rotation.y = -gt.open * 1.5; gt.right.rotation.y = gt.open * 1.5; gt.col.on = gt.open < 0.5;
      // sound environment
      if (Sound.ok) {
        const inZ = (id) => P.in(id) ? 1 : 0;
        const surf = P.area === 'surface' && this.state !== 'title';
        const crowd = this.state === 'title' ? 0.6 : Math.max(inZ('nightmarket') * 1, inZ('market') * 0.9, inZ('noodle') * 0.55, inZ('street') * 0.5, P.area === 'metro' ? 0.35 : 0, inZ('park') * 0.3, inZ('hutong') * 0.15, 0.1);
        const tea = Math.hypot(P.pos.x + 65.5, P.pos.z + 48), erhu = Math.hypot(P.pos.x + 32.6, P.pos.z + 40.8);
        Sound.update(dt, {
          traffic: this.state === 'title' ? 0.8 : surf ? clamp(1 - Math.abs(P.pos.z) / 32, 0.12, 1) : 0, crowd, park: surf ? inZ('park') : 0,
          metro: P.area === 'metro' ? 1 : 0, train: P.area === 'metro' ? (Metro.state === 'riding' ? 1 : Metro.state === 'arriving' || Metro.state === 'departing' ? 0.5 : 0) : 0,
          indoor: Math.max(inZ('noodle'), inZ('teahouse')), rain: Consequences.rain > 0 ? 1 : 0, night: G.glow, stalls: inZ('nightmarket') + inZ('noodle') * 0.4,
          music: surf ? clamp(1 - tea / 20, 0, 1) + inZ('temple') * 0.25 + (this.soft ? 0.5 : 0) : 0, erhu: surf ? clamp(1 - erhu / 16, 0, 1) : 0, temple: inZ('temple'),
        });
      }
      UI.update(dt);
    }
    updateSkyFollow(cam); updateStreaks(cam);
    if (!window.__noRender) G.renderer.render(G.scene, cam);
    Input.endFrame();
  },
  titleCam(dt) {
    this.titleT += dt;
    const t = this.titleT * 0.035;
    const x = Math.sin(t) * 32 - 6, z = 1.6 + Math.sin(t * 2.3) * 1.2;
    G.camera.position.set(x, 2.3 + Math.sin(t * 1.7) * 0.4, z);
    G.camera.rotation.set(0.06, -0.9 + Math.sin(t * 0.8) * 0.5, 0);
    P.pos.set(x, 0, z); P.area = 'surface';
  },
  introCam(dt) {
    this.introT += dt;
    const k = clamp((this.introT - 0.6) / 4.4, 0, 1), e = smoothstep(0, 1, k);
    G.camera.position.set(A.start.x + lerp(0.6, 0, e), lerp(17, 1.62, Math.pow(e, 0.8)), lerp(A.start.z + 2.6, A.start.z, e));
    const look = new THREE.Vector3(A.start.x, lerp(0.9, 1.62, e), lerp(A.start.z - 0.4, A.start.z - 10, Math.pow(e, 1.6)));
    if (this.avatar) this.avatar.root.visible = e < 0.9;
    const m = new THREE.Matrix4().lookAt(G.camera.position, look, new THREE.Vector3(0, 1, 0));
    G.camera.quaternion.setFromRotationMatrix(m); G.camera.rotation.reorder('YXZ');
    P.pos.set(A.start.x, 0, A.start.z);
    if (this.introT > 5 && (!Narrator.busy || this.introT > 9.5)) this.skipIntro();
  },
};

window.addEventListener('DOMContentLoaded', () => {
  try { Game.init(); }
  catch (e) { console.error(e); $('#loading').innerHTML = '<div style="max-width:520px;text-align:center;padding:20px">Something went wrong while building the city.<br><small>' + String(e && e.message) + '</small></div>'; }
});
// Debug / test hooks
window.__N = { Game, Cmd, CMDS, P, Metro, G, Rules, NPCById, Narrator, Traffic, Hints, Consequences, Cat, UI, Zones, Col };
