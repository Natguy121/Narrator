/* The Narrator: speech synthesis + subtitles + mood + line library. */

// Moods: 0 calm & professional, 1 annoyed, 2 pleading, 3 losing his mind, 4 soft ending
const MOOD_NAMES = ['Calm', 'Annoyed', 'Pleading', 'Unraveling', 'Soft'];
const MOOD_CN = ['平静', '不耐烦', '恳求', '崩溃', '温柔'];

const LINES = {
  obey: [
    ['Good.', 'Very good. You are a natural at being told things.', 'Excellent. Exactly as written.', 'Perfect. I will make a note of that.', 'Yes. That is what I said, and that is what you did. Marvelous.', 'Well done. You have the posture of someone who listens.', 'Correct. Smoothly done.', 'Lovely. We make a fine team. Mostly me.'],
    ['Fine. Yes. Correct.', 'Oh, now you listen.', 'Good. Was that so hard? Do not answer.', 'Correct. I am not impressed, but it is correct.', 'Yes, yes. Gold star. Imaginary gold star.', 'Right. Finally. Moving on.', 'That will do. Barely. But it will do.'],
    ['Thank you. Thank you so much. Really.', 'Yes! You did it! I could hug you. I do not have arms.', 'Good. That is good. We are okay. We are okay.', 'Oh, thank goodness. Please keep doing that.', 'You listened. I am going to remember this forever.', 'That was beautiful. I may cry. I do not have eyes either.'],
    ['YES. Ha! Yes! Nobody can stop us!', 'Correct! Everything is correct! Is anything real?', 'You are so obedient it is frightening. I love it. Do more.', 'Flawless. Like a dumpling. Folded perfectly.', 'You did it! Who did it? You did it! I am losing track of pronouns!', 'Ha ha! Yes! Another one! Give me another one!'],
    ['Thank you.', 'That is lovely.', 'Good. Take your time.', 'Nicely done.', 'Yes. Just like that.'],
  ],
  disobey: [
    ['That is not what I said.', 'Interesting. Wrong, but interesting.', 'Hm. I will pretend I said that.', 'No. But I admire the confidence.', 'That was a choice. Not mine, but a choice.', 'I see. You are one of those.', 'A bold interpretation of a very simple sentence.', 'That is not in the script. I checked. Twice.'],
    ['Oh, come on.', 'You are doing this on purpose.', 'Every time. Every single time.', 'I am writing this down. I do not have a pen. I am writing it down anyway.', 'Do you know how long I rehearsed that line?', 'Wonderful. Ignore the voice in your head. Very healthy.', 'I said one thing. You did a different thing. That is the whole problem.'],
    ['Please. Please just do the thing I say.', 'I am begging you. I have nothing else. I am a voice.', 'Why? Why would you do that? Help me understand.', 'I had a whole plan. It had steps.', 'Okay. Okay. It is fine. It is not fine.', 'What if you listened? Just once? As a treat?'],
    ['Ha. Ha ha. Of course. OF COURSE.', 'Nothing matters! Do whatever you want! I am a fog of words!', 'Fine! I will narrate the curtains! The curtains listen!', 'Wrong! Wrong again! Wrong is the new right!', 'This is fine. I am fine. The city is fine. Everything is fine!', 'I will just narrate myself. I am walking. I am walking. Look at me walk.'],
    ['That is alright.', 'It does not matter. Not really.', 'You go your own way. I will follow.', 'Fair enough.'],
  ],
  late: [
    ['Ah. There you are. I counted that as ignored, by the way. But welcome.', 'Finally. I aged. I do not age, and I aged.', 'You made it. Eventually. The command expired somewhere around the middle.', 'At last. History will record this as late.', 'Oh good, you arrived. I had moved on emotionally.', 'You got there. In the end. Like a slow, polite glacier.', 'Welcome. You are fashionably, catastrophically late.', 'Made it. I already wrote "ignored" in the book. In pen.'],
  ],
  idle: [
    ['Whenever you are ready.', 'You are standing still. That is not a command I gave.', 'Take your time. Actually, do not.', 'The city is waiting. Politely.', 'Is something wrong with your legs?', 'Hello? Is this thing on?', 'Standing still. Bold strategy.'],
    ['Are you... loading?', 'Any time now.', 'I have seen statues with more initiative.', 'Move. Something. Anything.', 'You are buffering. I can feel it.', 'The pigeons are moving more than you.'],
    ['Please move. Please. Even a little.', 'Are you still there? Do not say something. Move.', 'I get nervous when you are quiet.', 'Should I call someone? Who would I call?', 'Blink twice if you are okay.'],
    ['MOVE. Or do not. I will narrate the pigeons instead.', 'Fine! Stand there! Be a lamppost! I narrate lampposts now!', 'I am counting the bricks. There are four thousand and twelve.', 'Hello! Earth to you! Earth to whoever!', 'Statue mode! Very good! Nobody asked for statue mode!'],
    ['It is alright. Rest if you need to.', 'Take a breath. The city is not going anywhere.', 'No rush. Not anymore.'],
  ],
  nag: [
    ['Any time now.', 'Today, ideally.', 'Follow the glow. I put a glow there. For you.', 'The glowing trail is not decorative.', 'It is not far. Unless you keep going the wrong way.', 'There is a path. It glows. It is very helpful. Like me.'],
    ['You are taking a very long time.', 'The glowing thing. Follow the glowing thing.', 'Are you sightseeing? I am sightseeing. Through you. Badly.', 'A snail just passed you. A snail on a scooter.', 'I gave you a glowing trail. A glowing trail! What more do you want?'],
    ['Please hurry. I have more commands. I have so many commands.', 'I am not mad. I am just waiting. Forever.', 'I will beg. Is that what you want? I am begging.', 'Please. The glow. It leads somewhere nice.'],
    ['IS IT FAR? IT IS NOT FAR!', 'The glow! The GLOW! Follow the GLOW!', 'Tick tock! Tick! Tock! I am a clock now!', 'Hurry! Or do not! I do not know anymore!'],
    ['No rush.', 'Whenever you like.', 'We will get there.'],
  ],
  wallBump: ['That is a wall.', 'Walls. Famously solid.', 'You walked into a wall. In a city full of open doors.', 'The wall wins again.', 'That wall has been there for three hundred years. Show some respect.', 'Oof. I felt that. I do not have a body and I felt that.', 'Have you tried going around?', 'Bonk.', 'Is the wall okay? Ask the wall if it is okay.', 'Walls are like rules. Usually there for a reason.'],
  npcBump: ['Say sorry. You bumped into a person.', 'Personal space. It is a thing.', 'You just bumped into someone\'s grandmother. A whole grandmother.', 'Excuse you.', 'That person had a day planned. Now you are in it.', 'Careful. People are load bearing here.', 'Bump. Apologize with your eyes.', 'That is not how you make friends. Although, sometimes it is.'],
  ruleBroken: [
    ['That was a rule. It is written right there. Top right.', 'You broke a rule. There are consequences. Small, silly ones. But consequences.', 'Rules are rules. Even mine.', 'I was going to let that one go. No. No, I was not.'],
    ['The rules. Read the rules.', 'They are on the screen! I put them on the screen!', 'There were three rules. Three. You can count to three.', 'Rules are not suggestions. Well. They are now, apparently.'],
    ['Please. The rules. They are all I have.', 'I will put the rules in bigger letters next time.', 'Why do I even make rules?', 'Every rule you break, a little narrator somewhere sighs.'],
    ['RULES! The rules are made of glass! You are a hammer!', 'No more rules! Fine! Anarchy! Dumplings for everyone!', 'The rules are crying. I can hear them.', 'Broken! Another one! I am collecting them now!'],
    ['It does not matter now.'],
  ],
  jump: ['Did I say jump?', 'Nobody jumps here. This is a respectable street.', 'You are jumping. Why are you jumping?', 'Stop hopping. It is not the Year of the Rabbit.', 'Gravity is free. Use it.', 'That is a jump. I did not write a jump.', 'You look ridiculous. I cannot see you, but you do.', 'One more jump and I am telling the pigeons.'],
  lookUp: ['What is up there? Nothing. I checked.', 'The sky is not where the commands are.', 'Admiring the clouds? They are not admiring you.', 'Eyes on the street, please.', 'Looking for me? I am not up there. I am in here. Unfortunately.', 'Up there is just weather.', 'Neck strain is not in the script.', 'You will not find answers in the sky. Only birds.'],
  wrongPlace: ['Wrong place. Lovely place. Wrong.', 'That is not it. Close, in the sense of being somewhere.', 'Nope. Keep going.', 'Interesting detour. Detour back.', 'Not here. Here is not there.', 'You found a place. Not the place.', 'Wrong building. Buildings are not interchangeable.', 'An A for exploring. An F for listening.'],
  secret: ['Yes. Yes! Exactly where I wanted you. A secret. Planned. Obviously.', 'Ah, you found it. As I intended. All along. Definitely.', 'This was always the plan. I am a genius. Moving on.', 'I meant to do that. I mean, I meant you to do that.', 'A shortcut! Which I put here. On purpose. Years ago.', 'See? Disobeying works when I plan it. And I did. Plan it.', 'Look at that. Hidden. Like my feelings. Planned, though.', 'You are welcome. For the secret. That I designed.'],
  lie: ['Okay. I may have lied.', 'In my defense, I thought it would be funny. It was.', 'I said it was safe. I say a lot of things.', 'That one is on me. Mostly on you. But on me.', 'I have never been wrong before. That was a first. Second. Let us not count.', 'Trust is a two way street. This is a one way street.', 'Lesson learned. By you. I learned nothing.', 'I am a narrator. Narrators lie. Read a book.'],
  restart: ['Ah. Time travel. Cute. I remember everything, by the way.', 'Again? Fine. From the top. Of this bit.', 'Rewinding. Do not tell the pigeons.', 'Let us pretend that never happened. I will not, but you can.', 'Take two. Action.', 'A do over. Everyone gets one. You have had more than one.', 'Back in time. The dumplings are fresh again.', 'I have reset the universe for you. You are welcome.'],
  pause: ['Paused. I will just wait here. In the dark.', 'Take a break. I will practice my lines.', 'The city holds its breath.', 'Pause. Good. I need a moment too.', 'Frozen in time. My favorite way to see you.', 'Do not be long. I get lonely.', 'The noodles are getting cold. Metaphorically.', 'I will be right here. I am always right here.'],
  resume: ['And we are back.', 'Welcome back. I did not move. I cannot move.', 'Ah. You returned. Where were we? I know where we were.', 'Resuming. Try to look natural.', 'Back again. The city missed you. I did not. I did.', 'There you are. Let us continue.', 'Unpaused. The pigeons resume their business.', 'Right. Where was I. Oh yes. Bossing you around.'],
  talkOk: ['Thank you. Finally, some respect.', 'Okay? Okay. Good. We are a team.', 'Oh, you agree with me. How refreshing.', 'Okay. Two letters. Music to my ears.', 'Yes, okay. Wonderful. Proceed.', 'I knew you would come around.', 'Lovely. Keep that energy.', 'Okay. I will take it.'],
  talkWhy: ['Why? Because I said so. That is the whole system.', 'Why does the dumpling fold? Why does the river flow? Just do it.', 'Because the story needs it. Do not look at me like that.', 'There is a reason. It is a secret. Like most reasons.', 'Why? Because it is funnier than the alternative.', 'Because I am the narrator and you are the narrated. That is why.', 'Do not ask why. Ask how far, and which door.', 'Somebody has to decide things. It might as well be a voice.'],
  talkNo: ['No? No?! You cannot say no to the narrator.', 'Rude.', 'No is not in the script.', 'Noted. Ignored. Noted again.', 'You can say no. I can say yes louder. YES.', 'No? We will see about that. I will narrate it.', 'That is the spirit. The wrong spirit. But spirit.', 'Fine. Disagree. The city does not care. I care a little.'],
  talkStop1: ['Stop talking? Me? Then who would tell you where the noodles are?', 'Ha. Stop talking. Good one. I am the narrator. Narrators narrate.', 'If I stop talking, what are you? Just a person, walking around? Ridiculous.', 'Stop talking. Hm. No. Next question.'],
  silence: ['Hello? Anyone?'],
  aside: {
    6: 'By the way, I am usually very good at this.',
    11: 'I have narrated a lot of people. Accountants. A goat, once. You are different.',
    16: 'Can I tell you something? I never know what is at the end of these walks.',
    21: 'Do you think the city can hear me? I think the tea master could hear me.',
    25: 'I think I am losing it. Do you ever feel like someone else is in charge of your words?',
  },
  // things NPCs say (Chinese with English subtitle)
  npcHear: [['谁在说话？', 'Who is talking?'], ['你听到了吗？', 'Did you hear that?'], ['又是他。', 'Him again.'], ['嘘——', 'Shh—'], ['今天话真多。', 'Chatty today.'], ['奇怪…', 'Strange…'], ['天上有人说话？', 'Is the sky talking?']],
  npcHello: [['你好！', 'Hello!'], ['嗨！', 'Hi!'], ['吃了吗？', 'Have you eaten?'], ['你好呀！', 'Hello there!'], ['慢走！', 'Take care!']],
  npcMorning: [['早上好！', 'Good morning!'], ['早！', 'Morning!'], ['吃早饭了吗？', 'Had breakfast?']],
  npcEvening: [['晚上好！', 'Good evening!'], ['吃晚饭了吗？', 'Had dinner yet?']],
  npcBow: [['您好。', 'Hello. (polite)'], ['客气了。', 'Too kind.'], ['好，好。', 'Good, good.'], ['哎呀，不用不用。', 'Oh, no need!']],
  npcBumpSay: [['小心！', 'Careful!'], ['哎哟！', 'Ouch!'], ['看路！', 'Watch where you go!'], ['没事没事。', 'No worries.'], ['借过！', 'Excuse me!']],
  npcStare: [['？？？', '???'], ['你干嘛？', 'What are you doing?'], ['啊？', 'Huh?'], ['……', '…'], ['什么情况？', 'What is going on?']],
  npcJump: [['哇！', 'Whoa!'], ['年轻人…', 'Young people…'], ['好高啊！', 'So high!']],
};

const Voice = {
  synth: ('speechSynthesis' in window) ? window.speechSynthesis : null,
  voice: null, enabled: true, volume: 1, ready: false,
  init() {
    if (!this.synth) return;
    const choose = () => {
      const vs = this.synth.getVoices(); if (!vs || !vs.length) return;
      const prefs = ['Google UK English Male', 'Daniel', 'Microsoft Ryan', 'Microsoft George', 'Arthur', 'Oliver', 'Microsoft Thomas', 'Microsoft Guy', 'Microsoft David', 'Alex', 'Rishi', 'Aaron', 'Fred'];
      let v = null;
      for (const p of prefs) { v = vs.find((x) => x.name.includes(p)); if (v) break; }
      if (!v) v = vs.find((x) => /en[-_]GB/i.test(x.lang) && /male/i.test(x.name));
      if (!v) v = vs.find((x) => /en[-_]GB/i.test(x.lang));
      if (!v) v = vs.find((x) => /^en/i.test(x.lang));
      this.voice = v || vs[0]; this.ready = true;
    };
    choose();
    if (this.synth.addEventListener) this.synth.addEventListener('voiceschanged', choose);
    else this.synth.onvoiceschanged = choose;
  },
  unlock() { // iOS/Safari need a speak() inside a user gesture
    if (!this.synth) return;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; this.synth.speak(u); } catch (e) { /* ignore */ }
  },
  speak(text, rate, pitch, vol = 1, onend) {
    if (!this.synth || !this.enabled) return false;
    try {
      const u = new SpeechSynthesisUtterance(text.replace(/[—–]/g, ', ').replace(/\.\.\./g, '…'));
      if (this.voice) u.voice = this.voice;
      u.lang = (this.voice && this.voice.lang) || 'en-GB';
      u.rate = rate; u.pitch = pitch; u.volume = clamp(vol * this.volume, 0, 1);
      if (onend) { u.onend = onend; u.onerror = onend; }
      this.synth.speak(u);
      return true;
    } catch (e) { return false; }
  },
  cancel() { if (this.synth) try { this.synth.cancel(); } catch (e) { /* ignore */ } },
  pause() { if (this.synth) try { this.synth.pause(); } catch (e) { /* ignore */ } },
  resume() { if (this.synth) try { this.synth.resume(); } catch (e) { /* ignore */ } },
};

const Narrator = {
  mood: 0, silent: false, queue: [], cur: null, t: 0, bags: {}, lastByKey: {}, lastLine: '', lastSpokeAt: -99,
  reset() { this.queue.length = 0; this.cur = null; this.silent = false; Voice.cancel(); this.lastSpokeAt = -99; },
  voiceParams() {
    switch (this.mood) {
      case 1: return [0.96, 0.72];
      case 2: return [1.0, 0.9];
      case 3: return [1.08 + Math.random() * 0.12, 0.92 + Math.random() * 0.3];
      case 4: return [0.84, 0.84];
      default: return [0.9, 0.76];
    }
  },
  estimate(text, rate) {
    const words = text.split(/\s+/).filter(Boolean).length;
    const pauses = (text.match(/[.!?…]/g) || []).length;
    return (0.5 + words * 0.37 + pauses * 0.18) / (rate / 0.9);
  },
  // Pick a line from a pool, never repeating the last line from that pool (or the last line said at all).
  line(type, mood = this.mood) {
    let pool = LINES[type];
    if (!pool) return '';
    if (Array.isArray(pool[0])) { let m = Math.min(mood, pool.length - 1); while (m > 0 && !pool[m].length) m--; pool = pool[m]; type = type + '#' + m; }
    return this.fromPool(type, pool);
  },
  fromPool(key, pool) {
    if (!pool || !pool.length) return '';
    if (pool.length === 1) return pool[0];
    let bag = this.bags[key];
    if (!bag || !bag.length) { bag = this.bags[key] = pool.slice().sort(() => Math.random() - 0.5); }
    let l = bag.pop();
    if (l === this.lastByKey[key] || l === this.lastLine) { const alt = bag.pop(); if (alt !== undefined) { bag.unshift(l); l = alt; } else { const others = pool.filter((x) => x !== l && x !== this.lastLine); if (others.length) l = pick(others); } }
    this.lastByKey[key] = l;
    return l;
  },
  // prio: 3 command/script (interrupts), 2 reactions (queue), 1 ambient chatter (dropped if busy)
  say(text, o = {}) {
    if (!text) return;
    if (this.silent && !o.force) return;
    const item = { text, prio: o.prio || 2, onStart: o.onStart, onEnd: o.onEnd, delay: o.delay || 0, soft: o.soft, sub: o.sub !== false, vol: o.vol };
    if (item.prio <= 1 && (this.cur || this.queue.length)) return;
    if (this.cur && (item.prio > this.cur.prio || o.interrupt)) {
      this.queue = this.queue.filter((q) => q.prio >= item.prio && !o.clear);
      this.queue.unshift(item);
      this.finish(true);
      return;
    }
    if (o.clear) this.queue.length = 0;
    this.queue.push(item);
    this.queue.sort((a, b) => b.prio - a.prio);
    if (this.queue.length > 4) this.queue.length = 4;
  },
  sayNow(text, o = {}) { this.say(text, Object.assign({ prio: 3, interrupt: true }, o)); },
  react(type, o = {}) { const l = this.line(type, o.mood); if (l) this.say(l, Object.assign({ prio: 2 }, o)); return l; },
  chatter(type) { if (this.cur || this.queue.length || this.t - this.lastSpokeAt < 2.5) return; const l = this.line(type); if (l) this.say(l, { prio: 1 }); },
  get busy() { return !!this.cur || this.queue.length > 0; },
  finish(cancelled) {
    const c = this.cur; this.cur = null;
    if (cancelled) Voice.cancel();
    if (c && c.onEnd) c.onEnd(cancelled);
    if (!this.queue.length) UI.subtitle('');
  },
  start(item) {
    this.cur = item;
    let [rate, pitch] = this.voiceParams();
    if (item.soft) { rate *= 0.92; }
    item.dur = this.estimate(item.text, rate);
    item.t = 0; item.spoken = false; item.ended = false;
    this.lastLine = item.text; this.lastSpokeAt = this.t;
    if (item.sub) UI.subtitle(item.text, this.mood);
    const ok = Voice.speak(item.text, rate, pitch, item.vol || 1, () => { item.ended = true; });
    item.spoken = ok;
    if (item.onStart) item.onStart();
    Bus.emit('narratorLine', item.text);
  },
  update(dt) {
    this.t += dt;
    if (this.cur) {
      const c = this.cur; c.t += dt;
      // end on estimated duration (or speech end, whichever later, capped)
      const done = c.t >= c.dur && (!c.spoken || c.ended || c.t > c.dur + 2.5 || !Voice.synth || !Voice.synth.speaking);
      if (done) this.finish(false);
    }
    if (!this.cur && this.queue.length) {
      const n = this.queue[0];
      if (n.delay > 0) { n.delay -= dt; return; }
      this.queue.shift(); this.start(n);
    }
  },
};
