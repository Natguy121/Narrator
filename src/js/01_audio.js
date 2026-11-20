/* Procedural WebAudio: ambience beds, crowd murmur, footsteps, stings, city sounds. No assets. */

const Sound = {
  ctx: null, ok: false, vol: 0.8, muted: false,
  beds: {}, envT: {}, syllT: 0, birdT: 0, cricketT: 0, pluckT: 0, chimeT: 0, erhuT: 0,
  init() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = this.vol;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(ctx.destination);
    this.sfx = this.gain(0.9, this.master);
    this.amb = this.gain(0.75, this.master);
    this.mus = this.gain(0.6, this.master);
    // noise buffers
    const sr = ctx.sampleRate;
    const mk = (secs, fn) => { const b = ctx.createBuffer(1, sr * secs, sr); const d = b.getChannelData(0); fn(d); return b; };
    this.white = mk(2, (d) => { for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; });
    this.pink = mk(4, (d) => { let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.05) * 0.9; } });
    this.brown = mk(4, (d) => { let l = 0; for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } });
    // ambience beds
    this.bed('traffic', this.brown, 'lowpass', 380, 0.7);
    this.bed('murmur', this.pink, 'bandpass', 520, 0.8);
    this.bed('wind', this.pink, 'bandpass', 900, 0.4);
    this.bed('rain', this.white, 'highpass', 2500, 0.3);
    this.bed('metro', this.brown, 'lowpass', 160, 1.0);
    this.bed('sizzle', this.white, 'highpass', 4000, 0.5);
    // Karplus-Strong plucks (pentatonic) for the tea house + soft moments
    this.plucks = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.26, 739.99, 880].map((f) => this.ks(f));
    this.ok = true;
  },
  gain(v, dest) { const g = this.ctx.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; },
  bed(name, buf, type, freq, q) {
    const ctx = this.ctx, s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    s.loopStart = Math.random(); s.playbackRate.value = 1;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.gain(0, this.amb);
    s.connect(f); f.connect(g); s.start(0, Math.random() * 2);
    this.beds[name] = { s, f, g, v: 0 };
  },
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : v, this.ctx.currentTime, 0.05); },
  setMuted(m) { this.muted = m; this.setVolume(this.vol); },
  duck(amount, secs) { // used for "everyone stares" silence
    if (!this.ok) return; const t = this.ctx.currentTime;
    this.amb.gain.cancelScheduledValues(t); this.amb.gain.setTargetAtTime(0.75 * amount, t, 0.05);
    this.amb.gain.setTargetAtTime(0.75, t + secs, 0.6);
  },
  /* ---------- primitives ---------- */
  tone(freq, dur, o = {}) {
    if (!this.ok) return;
    const ctx = this.ctx, t = ctx.currentTime + (o.when || 0);
    const osc = ctx.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glide), t + (o.glideT || dur));
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vibRate || 6; lg.gain.value = o.vib; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.1); }
    const g = ctx.createGain(); const pk = o.gain === undefined ? 0.2 : o.gain;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pk, t + (o.attack || 0.005));
    if (o.sustain) g.gain.setValueAtTime(pk, t + o.sustain);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.filter) { const f = ctx.createBiquadFilter(); f.type = o.filter; f.frequency.value = o.ff || 1000; f.Q.value = o.fq || 1; if (o.ffGlide) f.frequency.exponentialRampToValueAtTime(o.ffGlide, t + dur); node.connect(f); node = f; }
    node.connect(g);
    let out = g;
    if (o.pan !== undefined && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); out = p; }
    out.connect(o.dest || this.sfx);
    osc.start(t); osc.stop(t + dur + 0.05);
  },
  noise(dur, o = {}) {
    if (!this.ok) return;
    const ctx = this.ctx, t = ctx.currentTime + (o.when || 0);
    const s = ctx.createBufferSource(); s.buffer = o.buf || this.white; s.playbackRate.value = o.rate || 1;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1000, t); f.Q.value = o.q || 1;
    if (o.glide) f.frequency.exponentialRampToValueAtTime(o.glide, t + dur);
    const g = ctx.createGain(); const pk = o.gain === undefined ? 0.2 : o.gain;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + (o.attack || 0.005));
    if (o.sustain) g.gain.setValueAtTime(pk, t + o.sustain);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g);
    let out = g;
    if (o.pan !== undefined && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); out = p; }
    out.connect(o.dest || this.sfx);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },
  bell(f, dur = 1.2, gain = 0.15, when = 0, dest) {
    [[1, 1], [2.76, 0.35], [5.4, 0.12], [2.0, 0.2]].forEach(([m, a]) => this.tone(f * m, dur / (m > 2 ? 2 : 1), { gain: gain * a, when, attack: 0.003, dest }));
  },
  ks(freq) { // Karplus-Strong plucked string buffer
    const ctx = this.ctx, sr = ctx.sampleRate, len = Math.floor(sr * 2.2);
    const b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0);
    const N = Math.max(2, Math.round(sr / freq)); const buf = new Float32Array(N);
    for (let i = 0; i < N; i++) buf[i] = Math.random() * 2 - 1;
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const nx = (idx + 1) % N;
      const v = (buf[idx] + buf[nx]) * 0.4985;
      d[i] = buf[idx]; buf[idx] = v; idx = nx;
    }
    return b;
  },
  pluck(i, gain = 0.25, when = 0, dest) {
    if (!this.ok) return;
    const ctx = this.ctx, s = ctx.createBufferSource(); s.buffer = this.plucks[clamp(i, 0, this.plucks.length - 1)];
    const g = this.gain(gain, dest || this.mus);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600;
    s.connect(f); f.connect(g); s.start(ctx.currentTime + when);
  },
  /* ---------- game sounds ---------- */
  step(o = {}) {
    if (!this.ok) return;
    const run = o.run, wet = o.wet || 0, soft = o.soft;
    const g = (run ? 0.32 : soft ? 0.1 : 0.2);
    this.noise(run ? 0.09 : 0.075, { type: 'lowpass', freq: o.wood ? 700 : run ? 1300 : 1000, gain: g, attack: 0.004 });
    this.tone(o.wood ? 120 : 90, 0.06, { gain: g * 0.6, glide: 50 });
    this.noise(0.035, { type: 'bandpass', freq: 2600, q: 2, gain: g * 0.25, when: 0.01 });
    if (wet > 0.05) this.noise(0.12, { type: 'highpass', freq: 3000, gain: 0.08 * wet * (run ? 1.5 : 1), when: 0.015 });
  },
  sting(kind) {
    if (!this.ok) return;
    switch (kind) {
      case 'command':
        this.bell(880, 0.9, 0.14); this.bell(1318.5, 1.1, 0.12, 0.09);
        this.tone(110, 0.5, { gain: 0.12, glide: 70 });
        break;
      case 'rule':
        [1, 1.48, 2.1, 2.76, 3.9].forEach((m, i) => this.tone(98 * m, 2.6 - i * 0.3, { gain: 0.11 / (i + 1), attack: 0.01 }));
        this.noise(1.2, { type: 'bandpass', freq: 400, glide: 1800, gain: 0.05, attack: 0.4 });
        break;
      case 'obey':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.35, { type: 'triangle', gain: 0.08, when: i * 0.06 }));
        break;
      case 'disobey':
        this.tone(260, 0.45, { type: 'sawtooth', glide: 120, gain: 0.09, filter: 'lowpass', ff: 900 });
        this.tone(200, 0.6, { type: 'sawtooth', glide: 85, gain: 0.09, filter: 'lowpass', ff: 700, when: 0.38 });
        break;
      case 'secret':
        [587.33, 739.99, 880, 1174.66, 1479.98, 1760].forEach((f, i) => this.bell(f, 0.8, 0.07, i * 0.07));
        break;
      case 'lie':
        [392, 370, 311].forEach((f, i) => this.tone(f, i === 2 ? 1.2 : 0.3, { type: 'sawtooth', gain: 0.08, filter: 'lowpass', ff: 1200, when: i * 0.28 }));
        break;
      case 'consequence':
        this.noise(0.8, { type: 'bandpass', freq: 300, glide: 3500, q: 1.5, gain: 0.12, attack: 0.25 });
        this.tone(70, 0.6, { gain: 0.18, glide: 40, when: 0.25 });
        break;
      case 'break':
        this.tone(440, 0.12, { type: 'square', gain: 0.05 }); this.tone(330, 0.25, { type: 'square', gain: 0.05, when: 0.1 });
        break;
      case 'pause': this.tone(330, 0.3, { type: 'triangle', gain: 0.08, glide: 220 }); break;
      case 'ui': this.tone(1200, 0.06, { gain: 0.05 }); break;
    }
  },
  scooterBeep(pan = 0, g = 0.06) { this.tone(1750, 0.11, { type: 'square', gain: g, pan, filter: 'lowpass', ff: 3000 }); this.tone(1750, 0.11, { type: 'square', gain: g, pan, when: 0.16, filter: 'lowpass', ff: 3000 }); },
  carHorn(pan = 0, g = 0.05) { this.tone(400, 0.35, { type: 'sawtooth', gain: g, pan, filter: 'lowpass', ff: 1400 }); this.tone(500, 0.35, { type: 'sawtooth', gain: g * 0.8, pan, filter: 'lowpass', ff: 1400 }); },
  bikeBell(pan = 0) { this.bell(2200, 0.5, 0.05); this.bell(2200, 0.5, 0.05, 0.15); },
  meow(pan = 0) { this.tone(650, 0.55, { type: 'sawtooth', glide: 950, glideT: 0.2, gain: 0.05, filter: 'bandpass', ff: 1500, fq: 3, pan, attack: 0.04 }); this.tone(950, 0.35, { type: 'sawtooth', glide: 520, gain: 0.04, filter: 'bandpass', ff: 1400, fq: 3, when: 0.2, pan }); },
  purr() { this.noise(1.4, { type: 'lowpass', freq: 220, gain: 0.12, buf: this.brown, attack: 0.2, sustain: 0.9 }); },
  coo(pan = 0) { this.tone(360, 0.32, { glide: 430, gain: 0.05, vib: 18, vibRate: 22, pan, attack: 0.05 }); this.tone(420, 0.45, { glide: 320, gain: 0.05, vib: 18, vibRate: 22, when: 0.35, pan, attack: 0.05 }); },
  flap() { for (let i = 0; i < 10; i++) this.noise(0.08, { type: 'bandpass', freq: 900 + Math.random() * 800, gain: 0.08, when: i * 0.05 + Math.random() * 0.03 }); },
  recordScratch() { this.tone(900, 0.35, { type: 'sawtooth', glide: 160, gain: 0.08, filter: 'bandpass', ff: 1500, fq: 2 }); this.noise(0.3, { type: 'bandpass', freq: 2500, glide: 500, q: 4, gain: 0.15 }); },
  boing() { this.tone(160, 0.6, { glide: 700, gain: 0.12, vib: 30, vibRate: 12 }); },
  warble() { this.tone(300, 1.6, { gain: 0.08, vib: 90, vibRate: 3, attack: 0.1 }); this.tone(600, 1.6, { gain: 0.04, vib: 120, vibRate: 2.3, attack: 0.1 }); },
  buzz(d = 1.5) { this.tone(110, d, { type: 'sawtooth', gain: 0.05, filter: 'bandpass', ff: 900, fq: 2, vib: 40, vibRate: 13 }); for (let i = 0; i < 8; i++) this.noise(0.05, { type: 'highpass', freq: 3000, gain: 0.1, when: Math.random() * d }); },
  whoosh() { this.noise(0.7, { type: 'bandpass', freq: 400, glide: 3000, q: 1.2, gain: 0.14, attack: 0.3 }); },
  gasp() { this.noise(0.55, { type: 'bandpass', freq: 1500, glide: 700, q: 1.5, gain: 0.25, attack: 0.08 }); this.noise(0.9, { type: 'bandpass', freq: 600, q: 1, gain: 0.12, when: 0.6, attack: 0.2 }); },
  sizzle() { this.noise(1.5, { type: 'highpass', freq: 3500, gain: 0.12, attack: 0.02 }); for (let i = 0; i < 10; i++) this.noise(0.03, { type: 'highpass', freq: 5000, gain: 0.15, when: Math.random() * 1.4 }); },
  chime() { [783.99, 659.25, 523.25, 783.99].forEach((f, i) => { this.tone(f, 1.2, { type: 'triangle', gain: 0.1, when: i * 0.32 }); this.tone(f * 2, 0.6, { gain: 0.02, when: i * 0.32 }); }); },
  doorBeeps() { for (let i = 0; i < 4; i++) this.tone(1050, 0.12, { type: 'square', gain: 0.04, when: i * 0.3, filter: 'lowpass', ff: 2500 }); },
  gateBeep() { this.tone(1600, 0.07, { gain: 0.07 }); this.tone(2100, 0.1, { gain: 0.07, when: 0.08 }); },
  trainArrive(dur = 4.5, reverse = false) {
    this.noise(dur, { type: 'lowpass', freq: 200, glide: 900, buf: this.brown, gain: 0.5, attack: dur * 0.6 });
    this.noise(1.6, { type: 'bandpass', freq: 3200, q: 18, gain: 0.05, when: dur - 1.6, glide: 2600, attack: 0.3 });
    if (reverse) for (let i = 0; i < 6; i++) this.tone(900, 0.2, { type: 'square', gain: 0.04, when: i * 0.55, filter: 'lowpass', ff: 1800 });
  },
  sadHorn() { this.tone(233, 0.7, { type: 'sawtooth', gain: 0.07, filter: 'lowpass', ff: 900 }); this.tone(208, 1.4, { type: 'sawtooth', gain: 0.07, filter: 'lowpass', ff: 800, when: 0.7, glide: 180 }); },
  pay() { this.bell(2093, 0.4, 0.06); this.bell(2637, 0.6, 0.06, 0.08); },
  pop() { this.tone(500, 0.12, { glide: 1200, gain: 0.08 }); },
  bump() { this.tone(95, 0.12, { gain: 0.2, glide: 55 }); this.noise(0.06, { type: 'lowpass', freq: 600, gain: 0.15 }); },
  chew() { for (let i = 0; i < 4; i++) this.noise(0.08, { type: 'lowpass', freq: 700, gain: 0.08, when: i * 0.18 }); },
  slurp() { this.noise(0.6, { type: 'bandpass', freq: 800, glide: 2400, q: 3, gain: 0.08, attack: 0.1 }); },
  ribbon() { [1174.66, 1479.98, 1760].forEach((f, i) => this.bell(f, 1.6, 0.05, i * 0.12)); },
  templeBell() { [1, 1.5, 2.2, 3.1].forEach((m, i) => this.tone(146 * m, 5 - i, { gain: 0.08 / (i + 1), attack: 0.003 })); },
  /* ---------- ambience driver ---------- */
  setBed(name, v, dt) {
    const b = this.beds[name]; if (!b) return;
    b.v = damp(b.v, v, 1.5, dt);
    b.g.gain.setTargetAtTime(b.v, this.ctx.currentTime, 0.1);
  },
  update(dt, env) {
    if (!this.ok) return;
    const t = this.ctx.currentTime;
    this.setBed('traffic', 0.16 * env.traffic * (1 - env.indoor * 0.75), dt);
    this.setBed('murmur', 0.07 * env.crowd + 0.012, dt);
    this.setBed('wind', 0.025 + 0.04 * env.park + 0.02 * env.night, dt);
    this.setBed('rain', 0.22 * env.rain, dt);
    this.setBed('metro', 0.25 * env.metro + 0.35 * (env.train || 0), dt);
    this.setBed('sizzle', 0.05 * (env.stalls || 0), dt);
    // crowd syllables: formant-ish noise bursts with gliding filters = murmur of voices
    this.syllT -= dt;
    if (this.syllT <= 0 && env.crowd > 0.05) {
      this.syllT = rand(0.05, 0.35) / (0.4 + env.crowd);
      const f = rand(380, 1300), d = rand(0.08, 0.26);
      this.noise(d, { type: 'bandpass', freq: f, glide: f * rand(0.75, 1.3), q: rand(5, 9), gain: 0.05 * env.crowd * (1 - env.indoor * 0.5), attack: 0.03, pan: rand(-0.8, 0.8), dest: this.amb });
    }
    // birds in the morning / park
    this.birdT -= dt;
    if (this.birdT <= 0) {
      this.birdT = rand(0.6, 3.5);
      const b = (1 - env.night) * (0.25 + env.park) * (1 - env.indoor) * (1 - env.metro);
      if (Math.random() < b) { const f = rand(2600, 4200), n = randInt(1, 4); for (let i = 0; i < n; i++) this.tone(f, 0.09, { glide: f * rand(1.1, 1.4), gain: 0.025, when: i * 0.11, pan: rand(-1, 1), dest: this.amb }); }
    }
    // crickets at night
    this.cricketT -= dt;
    if (this.cricketT <= 0) {
      this.cricketT = rand(0.3, 1.2);
      const c = env.night * (0.2 + env.park) * (1 - env.indoor) * (1 - env.metro);
      if (Math.random() < c) for (let i = 0; i < 3; i++) this.tone(4600, 0.05, { gain: 0.012, when: i * 0.07, pan: rand(-1, 1), dest: this.amb });
    }
    // tea house / temple music: soft pentatonic plucks
    this.pluckT -= dt;
    if (this.pluckT <= 0) {
      this.pluckT = rand(0.35, 1.1);
      if (env.music > 0.02) {
        if (!this._phrase || this._phrase.length === 0) this._phrase = Array.from({ length: randInt(3, 7) }, () => randInt(0, 8));
        this.pluck(this._phrase.shift(), 0.22 * env.music);
      }
    }
    // erhu in the secret courtyard
    this.erhuT -= dt;
    if (this.erhuT <= 0) {
      this.erhuT = rand(1.2, 2.4);
      if (env.erhu > 0.02) {
        const notes = [293.66, 329.63, 369.99, 440, 493.88, 587.33];
        const f = pick(notes), d = rand(0.9, 1.8);
        this.tone(f, d, { type: 'sawtooth', gain: 0.05 * env.erhu, attack: 0.25, sustain: d * 0.6, vib: 5, vibRate: 5.5, filter: 'bandpass', ff: 1400, fq: 0.8, glide: f * rand(0.97, 1.03) });
      }
    }
    // temple wind chimes
    this.chimeT -= dt;
    if (this.chimeT <= 0) { this.chimeT = rand(1.5, 4); if (env.temple > 0.1 && Math.random() < 0.6) this.bell(pick([1568, 1760, 2093, 2349]), 1.6, 0.025 * env.temple, 0, this.amb); }
  },
};
