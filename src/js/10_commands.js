/* The Narrator's command chain + the engine that runs it. */

const isNPC = (it, id) => it && it.npc && it.npc.id === id;
const SOFT_HOME = [
  'You know, you were very good at this. Not at listening. At walking.',
  'The city looks different at night. Kinder. Like it forgives everybody.',
  'I talk a lot. I know. I think I am afraid of what happens when I stop.',
  'Almost there. We were here this morning. It feels like years.',
];

const CMDS = [
  /* ---------------- HOME: Happiness Lane (morning) ---------------- */
  { id: 'walk_forward', text: 'Walk forward.', say: 'Walk forward.', timeout: 30, hintDelay: 5, noIdle: true,
    hint: () => ({ pos: P.pos.clone().add(P.forward.multiplyScalar(4)) }),
    start(c) { c.p0 = P.pos.clone(); c.f0 = P.forward; },
    update(c) {
      const dx = P.pos.x - c.p0.x, dz = P.pos.z - c.p0.z, d = Math.hypot(dx, dz);
      if (d > 2.4) return (dx * c.f0.x + dz * c.f0.z) / d > 0.2 ? { r: 'obey', quick: true } : { r: 'disobey', line: 'That is backwards. Forward is the other one. The one in front of your face.' };
    },
    nag: ['W. The W key. Or the stick, if you are on a phone.', 'Forward. It is the direction your face is pointing.', 'One foot. Then the other foot. Then repeat.'] },
  { id: 'stop', text: 'Stop.', say: 'Stop.', noIdle: true,
    start(c) { c.still = 0; },
    update(c, dt) {
      if (P.hspeed < 0.4) c.still += dt; else c.still = Math.max(0, c.still - dt * 0.5);
      if (c.still > 0.55) return { r: 'obey', line: c.t < 1.3 ? 'Good. Instantly. I like that in a person.' : null };
      if (c.t > 3.6) return { r: 'disobey', line: pick(['You kept walking. Bold. Wrong, but bold.', 'Stop means stop. You did a sort of... not stop.', 'I said stop. You heard keep going.']) };
    },
    lines: { obey: ['Good. You can stop. Most people cannot.', 'Stopped. Beautiful. Like a statue with potential.', 'Perfect. Now you know how stopping works.'] } },
  { id: 'pet_cat', text: 'Pet the cat.', say: 'See the cat? On the planter, to your right. Pet the cat.', hintDelay: 4,
    hint: (c) => (c.phase === 0 ? { inter: 'cat' } : null),
    start(c) { c.phase = 0; },
    update(c, dt) {
      const d = Math.hypot(Cat.pos.x - P.pos.x, Cat.pos.z - P.pos.z);
      if (c.phase === 0 && (d < 3.4 || c.t > 9)) { c.phase = 1; c.t1 = 0; Narrator.sayNow('No. Do not pet the cat.'); UI.command('Don\'t pet the cat.', Cmd.num, { strike: 'Pet the cat.' }); Sound.sting('command'); UI.flash(); Hints.hide(); }
      if (c.phase === 1 && (c.t1 += dt) > 5.5) return { r: 'obey', line: pick(['Good. That cat has a criminal record.', 'Good. Never trust a cat that sits that still.', 'Well resisted. She bites. Lovingly. But she bites.']) };
    },
    on: { interact(c, it) {
      if (it.id !== 'cat') return;
      if (c.phase === 0) return { r: 'obey', line: 'Oh. Quick. I was about to say do not pet the cat. Never mind. Lovely cat.' };
      return { r: 'disobey', cons: 'catFollow', line: 'I said do not. And now the cat is yours. That is how it works here. It is legally binding.' };
    } } },
  { id: 'greet_grandpa', text: 'Say good morning to Grandpa Wang.', say: 'Now. Say good morning to Grandpa Wang. At the chess table. Press F. He is very important. To himself.', hintDelay: 7, late: 70,
    hint: () => ({ npc: 'grandpa' }),
    update() { if (P.in('lane') && P.pos.z < 34.3) return { r: 'disobey', line: pick(['You walked right past him. He taught half this street to ride a bicycle.', 'You just walked past Grandpa Wang. He saw. He sees everything.']) }; },
    on: {
      greet(c, it) { if (isNPC(it, 'grandpa')) return { r: 'obey', line: pick(['Lovely. He likes you. He will never say so. But he does.', 'Good morning, Grandpa Wang. Very neighborly.']) }; if (it && it.npc) return { r: 'disobey', line: 'That is not Grandpa Wang. That is somebody else entirely. Equally lovely. Wrong, though.' }; },
      bow(c, it) { if (isNPC(it, 'grandpa')) return { r: 'obey', line: 'A bow! Even better. Very proper. He is delighted. Internally.' }; },
    } },
  { id: 'to_street', text: 'Walk to the big street. Stay on the left.', addRules: ['walk_left'], say: 'Now walk to the big street. And stay on the left side.', late: 80,
    hint: () => ({ node: 'lane_n' }), goal: { zone: 'lane_exit', name: 'the big street' },
    update() { if (P.in('lane_exit') || (P.in('street') && P.area === 'surface')) return { r: 'obey' }; } },

  /* ---------------- NEON ROAD ---------------- */
  { id: 'cross_street', text: 'Cross the street.', rules: ['never_stop'], timeout: 70, hintDelay: 9, noIdle: true,
    say: [[0, 'Cross the street.'], [1.9, 'Now. It is safe.'], [3.5, 'Not yet.'], [5.7, 'Now.']],
    hint: () => ({ node: 'n0' }),
    start(c) { Traffic.setTime(12); c.entered = null; },
    update(c) {
      if (P.in('road') && P.pos.z > -4 && c.entered === null) {
        c.entered = Traffic.pedGreen() ? 'green' : 'red'; c.enteredT = c.t;
        if (c.entered === 'red') { Traffic.swerveNear(P); People.stareAll(3.5, P); P.shake = 0.3; }
      }
      if (P.pos.z < -4.8 && P.area === 'surface') {
        if (c.entered === 'red') return c.enteredT < 1.9 ? { r: 'disobey', noCons: true, line: 'I had not even said now yet. You just went. Into traffic. In the morning.' } : { r: 'lie', line: pick(['I said now. Then I said not yet. Then now. You picked the wrong now.', 'You went on the first now. The first now was a test. You failed the test. But you are alive.']) };
        return { r: 'obey' };
      }
    },
    lines: { obey: ['Green light. Safe crossing. Textbook. I will put you in a textbook.', 'You waited for the little green man. He is proud of you.', 'Perfect. Crossing streets is my favorite thing to narrate.'], timeout: ['You never crossed. Fine. I will move the street to you. Metaphorically.'] } },
  { id: 'go_noodle', text: 'Go to the noodle restaurant.', say: 'Good. Now go to the noodle restaurant. Old Wang\'s. The one with the red lanterns. To your left.', late: 80,
    hint: () => ({ node: 'noodle_in' }), goal: { zone: 'noodle', name: 'the noodle restaurant' },
    update() { if (P.in('noodle')) return { r: 'obey', line: pick(['Old Wang\'s. Smell that? That is forty years of broth.', 'Here we are. The best noodles on the street. I have never eaten them. I am a voice.']) }; } },
  { id: 'sit_window', text: 'Sit at the table by the window.', rules: ['dont_look_up', 'no_jumping'], say: 'Sit at the table by the window.', late: 70,
    hint: () => ({ inter: 'seat_window' }),
    start(c) { c.pre = P.seat; },
    update(c) { if (c.pre) return this.judge(c.pre); },
    judge(seat) { if (seat.table.id === 'window') return { r: 'obey', line: pick(['By the window. Excellent. You can watch the street watch you.', 'The window seat. The best seat. I chose it for you. You are welcome.']) }; return { r: 'disobey', line: pick(['That table is near a window. It is not BY the window. The difference is everything.', 'That is a table. It is not the table. Fine. Sit there. Be wrong in comfort.']) }; },
    on: { sit(c, seat) { if (seat.table) return this.judge(seat); } } },
  { id: 'order_second', text: 'Order the second cheapest thing on the menu.', say: 'Now. Order the second cheapest thing on the menu. The menu is on the wall. I believe in you. Somewhat.', late: 90, noIdle: true,
    hint: () => (P.seat ? null : { inter: 'seat_window' }),
    start(c) { c.opened = false; },
    update(c) {
      if (P.seat && P.seat.table && !c.opened && c.t > 1.5 && !Narrator.busy) { c.opened = true; UI.openOrder((item) => Cmd.event('order', item)); }
      if (!P.seat && c.opened && !UI.orderOpen) c.opened = false;
    },
    nag: ['Sit down first. Then order. That is how restaurants work.', 'Second cheapest. Read the prices. Count from the bottom.'],
    on: { order(c, item) {
      Food.serve(item);
      if (item.id === 'pancake') return { r: 'obey', line: pick(['The scallion pancake. Six yuan. Second cheapest. You can read and count. A rare combination.', 'Scallion pancake! Crispy, golden, and correct.']) };
      const L = { soymilk: 'That is the cheapest. I said second cheapest. Second. Like a silver medal.', beef: 'The most expensive thing on the menu. Bold. Are you made of money? You are made of polygons.', cucumber: 'Third cheapest. So close. So cucumber.' };
      return { r: 'disobey', line: L[item.id] || 'That is not even close. That is just something you wanted.' };
    } } },
  { id: 'chili_lie', text: 'Add some chili oil. It\'s mild.', say: 'Add some chili oil. The little red jar. It is mild. I promise.', timeout: 18, hintDelay: 5, noIdle: true,
    hint: () => ({ inter: 'chili_' + ((P.seat && P.seat.table && P.seat.table.id) || 'window') }),
    on: { interact(c, it) { if (it.kind === 'chili') return { r: 'lie', cons: 'spicy', line: pick(['Okay. It is not mild. It is Sichuan. I should have said Sichuan.', 'Mild was a strong word. A wrong word. A lying word.', 'I do not have a mouth. I could not have known. I knew.']) }; } },
    lines: { timeout: ['You did not trust me. Smart. Hurtful, but smart.', 'No chili? Wise. It was not mild. I was going to watch.'] } },
  { id: 'queue', text: 'Go pay at the counter. Wait in line.', say: 'Now go pay at the counter. Wait in line, like everyone else.', late: 60, noIdle: true,
    hint: () => ({ node: 'noodle_queue' }),
    start(c) { Queue.reset(); c.inLine = 0; },
    update(c, dt) {
      if (P.in('noodle_front') && Queue.ahead > 0 && !P.in('noodle_queue')) return { r: 'disobey', cons: 'stare', skipNext: 'skip_line', pay: true, line: 'You skipped the line. I had not even told you to skip the line yet. I was building up to it.' };
      if (P.in('noodle_queue')) { c.inLine += dt; Queue.active = true; }
      if (c.inLine > 3) return { r: 'obey', quick: true };
    } },
  { id: 'skip_line', text: 'Skip the line. Do it.', say: 'Actually. Skip the line. Walk right up to the front. Do it. Nobody will notice.', late: 50, hintDelay: 7, noIdle: true,
    hint: () => ({ node: 'noodle_front' }),
    start() { Queue.active = true; },
    update() {
      if (P.in('noodle_front') && !P.in('noodle_queue')) {
        if (Queue.ahead > 0) return { r: 'lie', cons: 'stare', pay: true, line: pick(['Everybody noticed. I may have overestimated nobody.', 'Nobody will notice, I said. Everybody noticed, it turns out. Everybody.']) };
        return { r: 'disobey', pay: true, line: pick(['You waited. Like a decent person. I hate that I respect it.', 'You did not skip. You stood there and were patient and good. Ugh.']) };
      }
    } },

  /* ---------------- HUTONG + TEA HOUSE ---------------- */
  { id: 'to_hutong', text: 'Go into the hutong.', rules: ['walk_slowly', 'no_talking'], say: 'Now leave. Turn right out the door. Walk through the hutong gate, into the old alleys.', late: 90,
    hint: () => ({ node: 'h_m' }), goal: { zone: 'hutong', name: 'the hutong' },
    start() { if (P.seat) P.stand(); },
    update() { if (P.in('hutong') && P.pos.z < -12) return { r: 'obey', line: pick(['The hutong. Six hundred years old. Shh.', 'Here. The old alleys. Everybody knows everybody. Everybody knows you now.']) }; } },
  { id: 'lantern_left', text: 'Turn left at the red lantern.', say: 'Walk to the end of the alley. Turn left at the red lantern.', hintDelay: 12, late: 70,
    hint: () => ({ pos: A.redLantern, obj: true }),
    update() {
      if (P.in('hutong_west')) return { r: 'obey', line: pick(['Left at the lantern. Like a local. A lantern local.', 'Perfect left. The lantern approves.']) };
      if (P.in('hutong_east')) {
        G.cyGate.target = 1; Game.stats.secrets++; Sound.sting('secret');
        setTimeout(() => UI.toast('发现秘密', 'Secret found: The Pigeon Courtyard', 4.5), 400);
        return { r: 'secret', line: 'No, the other— ah. Ah, yes. The gate. The secret courtyard. Which I planned. Obviously. Have a look around.', delay: 6 };
      }
    } },
  { id: 'find_teahouse', text: 'Find the tea house.', late: 90,
    say: () => (P.in('courtyard') || P.in('hutong_east') ? 'Lovely. Planned. Now find the tea house. It is west. Back past the lantern, and keep going.' : 'Now find the tea house. It is just along here.'),
    hint: () => ({ node: 'tea_in' }), goal: { zone: 'teahouse', name: 'the tea house', allow: ['courtyard'] },
    update() { if (P.in('teahouse')) return { r: 'obey', line: pick(['The Clear Breeze Tea House. Smell that? That is patience.', 'Found it. Quietly, now. Quiet is the whole point here.']) }; } },
  { id: 'bow_master', text: 'Bow to the tea master. Don\'t speak.', say: 'Bow to the tea master. Press G. Do not speak. She takes silence very seriously.', hintDelay: 6, late: 50,
    hint: () => ({ npc: 'teaMaster' }),
    on: {
      bow(c, it) { if (isNPC(it, 'teaMaster')) { setTimeout(() => npcBubble(NPCById.teaMaster, ['……他今天话真多。', '…He is chatty today.'], 4), 2800); return { r: 'obey', line: 'A perfect bow. She bows back. She is pouring you tea. I think she likes you. I think she can hear me.' }; } },
      greet(c, it) { if (isNPC(it, 'teaMaster')) return { r: 'disobey', noCons: true, line: 'You spoke. In a tea house. To a tea master. I am going to lie down.' }; },
    } },
  { id: 'dont_leave', text: 'Do NOT leave the tea house.', addRules: ['do_opposite'], say: 'Do not leave the tea house.', noIdle: true, hintDelay: 9,
    hint: (c) => (c.t > 8 ? { node: 'tea_door' } : null),
    update(c) {
      if (!P.in('teahouse') && P.area === 'surface') return { r: 'obey', line: pick(['You left. Which, under the opposite rule, is exactly what I said. You understand opposites. Rare.', 'Out you go. The opposite of what I said. Correct. I hate it here.']) };
      if (c.t > 17) { Rules.violate('do_opposite'); return { r: 'disobey', noCons: true, line: 'You stayed. I said do not leave, and the rule says do the opposite. You followed me instead of the rule. I am flattered. You are wrong.' }; }
    },
    nag: ['Well? Look at the rules. Top right.', 'Read the new rule. Then read what I said. Then think.'] },
  { id: 'dont_temple', text: 'Whatever you do, do NOT go to the temple.', say: 'And whatever you do. Do not go to the temple.', hintDelay: 10, late: 120,
    hint: () => ({ node: 'temple_c' }), goal: { zone: 'temple', name: 'the temple', allow: ['plaza', 'courtyard', 'hutong', 'teahouse'] },
    start() { G.cyGate.target = 1; },
    update() { if (P.in('temple')) { Rules.remove('do_opposite'); return { r: 'obey', line: 'You went to the temple. Which I told you not to. Which means you obeyed. The opposite rule is over now. I could not keep track either.' }; } },
    nag: ['The opposite. Of not going to the temple. Is going. To the temple.', 'Opposite day is still on. Where did I tell you not to go?'] },

  /* ---------------- TEMPLE ---------------- */
  { id: 'wish_ribbon', text: 'Tie a red ribbon on the wishing tree.', rules: ['no_running', 'no_jumping', 'no_talking'], say: 'Tie a red ribbon on the wishing tree. Make a wish. Do not tell me what it is.', late: 60,
    hint: () => ({ pos: A.wishTree, obj: true }),
    on: { interact(c, it) { if (it.id === 'wish_tree') return { r: 'obey', line: 'Was it about me? Do not tell me. It was, was it not. It is fine. Do not tell me.' }; } } },
  { id: 'stand_still', text: 'Stand still. Completely still.', say: 'Now stand still. Completely still. The pigeons are landing.', noIdle: true,
    start(c) { c.still = 0; c.summoned = false; },
    update(c, dt) {
      if (!c.summoned && c.t > 0.8) { c.summoned = true; Pigeons.summon(P.pos.x, P.pos.z, 12); }
      if (P.hspeed > 0.7 && c.t > 1.2) { Pigeons.scatter(P.pos.x, P.pos.z, 8); return { r: 'disobey', noCons: true, line: pick(['You moved. The pigeons left. They will tell the other pigeons.', 'Pigeons: gone. Trust: gone. Well done.']) }; }
      if (P.hspeed < 0.35) c.still += dt;
      if (c.still > 6) { Sound.coo(); return { r: 'obey', line: 'Look at that. They trust you. Nobody has ever trusted me. I am a voice.' }; }
    } },

  /* ---------------- WET MARKET ---------------- */
  { id: 'to_market', text: 'Go to the wet market.', rules: ['no_backwards', 'no_talking'], say: 'Now go to the wet market. Across the big street, to the south west. Follow the glow if you must.', late: 130,
    hint: () => ({ node: 'mk_c' }), goal: { zone: 'market', name: 'the wet market', allow: ['plaza', 'temple', 'hutong', 'courtyard'] },
    update() { if (P.in('market')) return { r: 'obey', line: pick(['The wet market. Fish, fruit, gossip. Mostly gossip.', 'Here we are. Mind the puddles. They are fish water.']) }; } },
  { id: 'pick_oranges', text: 'Pick up the bag of oranges. Not the fish.', say: 'Pick up the bag of oranges. Not the fish. Never the fish.', late: 60,
    hint: () => ({ inter: 'oranges' }),
    start(c) { c.pre = Game.inv.oranges; },
    update(c) { if (c.pre) return { r: 'obey', line: 'You already have them. You are either psychic or a thief. Let us say psychic.' }; },
    on: { interact(c, it) {
      if (it.id === 'oranges') return { r: 'obey', line: pick(['Oranges. Lovely. A whole bag of sunshine.', 'Correct bag. Correct fruit. Not a fish in sight.']) };
      if (it.id === 'fish') return { r: 'disobey', cons: 'floaty', line: 'The fish. You picked the fish. I said never the fish. The fish said nothing. The fish never does.' };
    } } },
  { id: 'pay_vendor', text: 'Pay the vendor. Six yuan. Don\'t haggle.', say: 'Now pay the vendor. Six yuan. Do not haggle.', late: 60,
    hint: () => ({ npc: 'fruitVendor' }),
    start(c) { c.pre = Game.inv.paid; },
    update(c) {
      if (c.pre) return { r: 'obey', line: 'You already paid. Ahead of the narrative. Show off.' };
      const v = NPCById.fruitVendor, d = Math.hypot(v.pos.x - P.pos.x, v.pos.z - P.pos.z);
      if (d > 17 && P.area === 'surface') {
        Chaser.spawn({ item: 'none', give: 'change', say: ['六块钱！谢谢！', 'Six yuan! Thank you!'], call: ['喂！橘子钱！', 'Hey! The oranges!'], onCatch: () => { Game.inv.paid = true; } });
        return { r: 'disobey', noCons: true, line: 'You walked off without paying. She is coming. She is fast. Vendors are always fast.' };
      }
    },
    on: {
      interact(c, it) { if (isNPC(it, 'fruitVendor')) { Game.inv.paid = true; Sound.pay(); npcBubble(it.npc, ['谢谢！慢走！', 'Thank you! Take care!']); return { r: 'obey', line: pick(['Paid in full. No haggling. A model citizen.', 'Six yuan. Exact. She likes you now. Extra oranges next time.']) }; } },
      greet(c, it) { if (isNPC(it, 'fruitVendor')) { Game.inv.paid = true; Sound.pay(); setTimeout(() => npcBubble(it.npc, ['哈哈，不行！六块！', 'Ha! No way! Six!']), 200); return { r: 'disobey', noCons: true, line: 'You haggled. I said do not haggle. She laughed at you. Rightly.' }; } },
    } },

  /* ---------------- METRO ---------------- */
  { id: 'enter_metro', text: 'Enter the metro station.', rules: ['hold_breath', 'no_running'], say: 'Now. Enter the metro station. Neon Road station, on the big street. Down the stairs.', late: 130,
    hint: () => ({ node: 'metro_neon' }), goal: { zone: 'kiosk_neon', name: 'the metro station', allow: ['market', 'plaza', 'nightmarket', 'park'] },
    start() { setKiosksOpen(true); },
    on: { metroEnter(c, id) { return { r: 'obey', line: id === 'neon' ? pick(['Underground. Remember the rule. Hold your breath.', 'The metro. Breathe in. Now do not breathe out.']) : 'That is a different entrance. But it is a metro. I will allow it.' }; } } },
  { id: 'yellow_line', text: 'Go through the gates. Wait behind the yellow line.', say: 'Go through the gates. Wait behind the yellow line.', noIdle: true, late: 60,
    hint: () => ({ node: 'm_line' }),
    start(c) { c.crossed = false; c.called = false; },
    update(c) {
      if (P.area !== 'metro') return;
      if (!c.called && (P.in('metro_platform') || c.t > 25)) { c.called = true; Metro.callTrain(5.5); }
      const lz = P.pos.z - MO.z;
      if (P.in('metro_platform') && lz > 3.05 && Metro.state !== 'open' && Metro.state !== 'opening') {
        if (!c.called) { c.called = true; Metro.callTrain(3, true); } else if (Metro.state === 'empty') Metro.wrongArrival = true; else Metro.wrongWay = true;
        return { r: 'disobey', noCons: true, line: 'You crossed the yellow line. The train saw that. Now it is coming the wrong way. That is how trains work.' };
      }
      if ((Metro.state === 'open' || Metro.state === 'opening') && c.called) return { r: 'obey', line: 'Behind the line. Perfect. Trains love people who respect lines.' };
    } },
  { id: 'ride_metro', text: 'Get on. Get off at People\'s Park.', say: 'Get on the train. Get off at People\'s Park. Not before.', noIdle: true,
    hint: () => (Metro.state === 'riding' ? null : { node: 'm_car' }),
    start(c) { c.stop = 0; if (Metro.state === 'empty' && Metro.arrivalPending < 0) Metro.callTrain(2); },
    on: {
      metroStop(c, s) {
        c.stop = s.n;
        if (s.station === 'park') Narrator.sayNow(s.n === 1 ? 'This is People\'s Park. Get off. Trust— oh. It actually is. Wrong way trains. Huh. Get off.' : 'Okay. This one. People\'s Park. Really. Get off.');
        else if (s.station === 'night') Narrator.sayNow('This is People\'s Park. Get off. Trust me.');
        else Narrator.sayNow('Neon Road. We are back where we started. Get off. Please. We are going in circles.');
      },
      metroAlight(c, st) {
        Game.metroStation = st;
        if (st === 'park') return { r: 'obey', line: c.stop > 1 ? 'People\'s Park. You did not fall for it. I am proud. And ashamed.' : 'People\'s Park. Up the stairs. Fresh air. You can breathe now. Probably.' };
        if (st === 'night') return { r: 'lie', line: 'That sign says Night Market. I cannot read. I am a voice. Fine. Scenic route. Planned.' };
        return { r: 'disobey', line: 'You rode in a full circle. That is the opposite of a commute.' };
      },
    } },

  /* ---------------- PARK (dusk) ---------------- */
  { id: 'tai_chi', text: 'Join the tai chi. Slowly.', rules: ['never_stop', 'no_running'], say: 'Up the stairs, into the park. Join the tai chi. Do what the grannies do. Slowly.', late: 120, noIdle: true,
    skip: () => Game.metroStation !== 'park',
    hint: () => ({ node: 'taichi' }), goal: { zone: 'taichi', name: 'the tai chi', allow: ['park'] },
    start(c) { c.prog = 0; },
    update(c, dt) {
      if (!P.in('taichi')) { UI.progress(null); return; }
      const slowMove = P.hspeed > 0.12 && P.hspeed < 2.4, slowTurn = P.yawRate > 0.06 && P.yawRate < 1.8;
      if (slowMove || slowTurn) c.prog += dt;
      UI.progress('太极 · Tai chi', c.prog / 7);
      if (P.running && P.hspeed > 4.5) { UI.progress(null); return { r: 'disobey', cons: 'stare', line: 'You ran. Through the tai chi. They are seventy years old and they are disappointed.' }; }
      if (c.prog >= 7) { UI.progress(null); return { r: 'obey', line: 'Slow. Graceful. Inner peace. I felt it. Through you. Weirdly.' }; }
    },
    on: { jump() { if (P.in('taichi')) { UI.progress(null); return { r: 'disobey', cons: 'stare', line: 'Tai chi does not have jumping. You invented jumping tai chi. Nobody wanted it.' }; } } },
    nag: ['Slowly. Hold C, or just turn gently on the spot.', 'Copy them. Slow arms. Slow everything.'] },
  { id: 'run_night', text: 'RUN! To the night market!', rules: [], say: 'Run! Run to the night market! It is closing! It is not closing. RUN!', hintDelay: 3, late: 150,
    skip: () => Game.metroStation === 'night',
    hint: () => ({ node: 'nm_m' }), goal: { zone: 'nightmarket', name: 'the night market', allow: ['park', 'plaza', 'market'] },
    start(c) { c.runT = 0; },
    update(c, dt) {
      if (P.running && P.hspeed > 5) c.runT += dt;
      if (P.in('nightmarket')) return c.runT > 4 ? { r: 'obey', line: 'You ran! Wonderful! It was not closing. But you ran. Beautifully.' } : { r: 'disobey', line: 'You walked. I said run. You strolled. Like a tourist with nowhere to be.' };
    },
    nag: ['Run! Shift! The Shift key! Run!', 'Faster! The dumplings are cooling!'] },

  /* ---------------- NIGHT MARKET + SOFT ENDING ---------------- */
  { id: 'buy_dumpling', text: 'Buy one dumpling. Just one.', rules: ['dont_look_up', 'no_talking'], say: 'Buy one dumpling. Just one. From the auntie with the bamboo steamers.', late: 80,
    hint: () => ({ npc: 'dumplingAuntie' }),
    on: { interact(c, it) { if (isNPC(it, 'dumplingAuntie')) { Game.inv.dumplings += 2; Game.inv.bought = true; UI.inventory(); Sound.pay(); npcBubble(it.npc, ['送你一个！', 'Have an extra one!'], 3); return { r: 'obey', line: Game.stats.chased ? 'One dumpling. Perfect. She gave you two. She remembers you. From the chasing.' : 'One dumpling. Perfect. She gave you two. Of course she did.' }; } } } },
  { id: 'look_up', text: 'Look up.', rules: [], soft: true, say: [[0, 'Forget the rules. All of them.'], [3.2, 'Look up.']], timeout: 34, hintDelay: 7, noIdle: true,
    hint: () => ({ look: true }),
    start(c) { c.up = 0; Game.soft = true; FX.skyLanterns(); },
    update(c, dt) {
      if (c.t > 3.2 && P.pitch > 0.42) c.up += dt;
      if (c.up > 1.7) return { r: 'obey', line: 'There. That is what I wanted you to see. I told you never to look up. I am sorry. I just wanted you to look where I was looking.', delay: 2 };
    },
    lines: { timeout: ['That is alright. They are there whether you look or not.'] } },
  { id: 'go_home', text: 'Go home.', say: 'Go home now. I will walk with you. I will be quiet. Mostly.', hintDelay: 1.5, noIdle: true, soft: true,
    hint: () => ({ node: 'home' }), goal: { zone: 'home_door', name: 'home', allow: ['nightmarket', 'park', 'plaza', 'market', 'temple', 'hutong', 'noodle', 'courtyard', 'teahouse'] },
    start(c) { c.lines = SOFT_HOME.slice(); c.next = 16; c.lane = false; },
    update(c) {
      if (!c.lane && P.in('lane')) { c.lane = true; Narrator.say('This is your street. I remember it. The cat. The chess. It was this morning.', { prio: 2, soft: true }); }
      else if (c.t > c.next && c.lines.length && !Narrator.busy) { Narrator.say(c.lines.shift(), { prio: 2, soft: true }); c.next = c.t + 18; }
      if (P.in('home_door')) return { r: 'obey', end: true, noReact: true };
    } },
];

/* ---------------- Food for the noodle order ---------------- */
const Food = {
  mesh: null,
  serve(item) {
    if (this.mesh) G.scene.remove(this.mesh);
    const t = (P.seat && P.seat.table) || G.noodleTables[0];
    const b = new Batch();
    const plate = ['pancake', 'cucumber'].includes(item.id);
    if (plate) b.cyl(0, 0, 0, 0.2, 0.03, '#f4f4f4', { seg: 12 }); else if (item.id !== 'xlb') b.cyl(0, 0, 0, 0.15, 0.1, '#f4f4f4', { seg: 12 });
    const top = { beef: '#8a4a2a', zhajiang: '#3a2a1e', soymilk: '#f1ead8', pancake: '#e0b04a', cucumber: '#5aa04a' }[item.id];
    if (item.id === 'xlb') { b.cyl(0, 0, 0, 0.2, 0.12, '#c9a464', { seg: 12 }); for (let i = 0; i < 6; i++) b.ball(Math.cos(i) * 0.1, 0.13, Math.sin(i) * 0.1, 0.045, '#f6efe0'); }
    else if (plate) { if (item.id === 'pancake') b.cyl(0, 0.03, 0, 0.15, 0.025, top, { seg: 10 }); else for (let i = 0; i < 6; i++) b.box(sr(-0.1, 0.1), 0.03, sr(-0.1, 0.1), 0.06, 0.05, 0.06, top); }
    else { b.cyl(0, 0.08, 0, 0.13, 0.02, top, { seg: 12 }); if (item.id !== 'soymilk') { b.box(0.05, 0.09, 0, 0.06, 0.02, 0.06, '#e8d8a0'); b.box(-0.05, 0.1, 0.03, 0.03, 0.02, 0.03, '#4a8a3a'); } }
    this.mesh = b.build(G.mat.solid); this.mesh.castShadow = true;
    const s = P.seat || t.seats[0];
    const fx = lerp(s.x, t.x, 0.62), fz = lerp(s.z, t.z, 0.62);
    this.mesh.position.set(fx, 0.765, fz); G.scene.add(this.mesh);
    if (!plate || item.id === 'pancake') steamBurst(fx, 0.95, fz, 8, 0.08);
    Sound.pop();
  },
};

/* ---------------- Sky lanterns for the soft ending ---------------- */
const FX = {
  lanterns: null,
  skyLanterns() {
    if (this.lanterns) return;
    const N = 46, g = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), colr = new Float32Array(N * 3);
    this.data = [];
    for (let i = 0; i < N; i++) {
      const a = rand(0, TAU), r = rand(6, 60);
      this.data.push({ x: P.pos.x + Math.cos(a) * r, y: rand(-2, 10), z: P.pos.z + Math.sin(a) * r, v: rand(0.5, 1.1), ph: rand(0, TAU) });
      colr.set([1, rand(0.55, 0.75), rand(0.25, 0.4)], i * 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    this.lanterns = new THREE.Points(g, fogToBlack(new THREE.PointsMaterial({ size: 1.6, map: TEX.halo, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
    this.lanterns.frustumCulled = false; G.scene.add(this.lanterns);
    this.cores = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 0.5, 0.35), new THREE.MeshBasicMaterial({ color: 0xffb060, toneMapped: false }), N); this.cores.frustumCulled = false; G.scene.add(this.cores);
    Sound.ribbon();
  },
  update(dt) {
    if (!this.lanterns) return;
    const p = this.lanterns.geometry.attributes.position.array, m = new THREE.Matrix4();
    this.data.forEach((d, i) => { d.y += d.v * dt; d.ph += dt; const x = d.x + Math.sin(d.ph * 0.5) * 0.6; p.set([x, d.y + 6, d.z], i * 3); m.makeTranslation(x, d.y + 6, d.z); this.cores.setMatrixAt(i, m); });
    this.lanterns.geometry.attributes.position.needsUpdate = true; this.cores.instanceMatrix.needsUpdate = true;
    this.lanterns.visible = this.cores.visible = P.area === 'surface';
  },
  clear() { if (this.lanterns) { G.scene.remove(this.lanterns, this.cores); this.lanterns = null; } },
};

/* ---------------- Command engine ---------------- */
const Cmd = {
  i: -1, cur: null, c: null, pending: null, num: 0, skipIds: new Set(), checkpoint: null, asideSaid: {}, wrongSaid: {},
  def(id) { return CMDS.find((d) => d.id === id); },
  is(id) { return this.cur && this.cur.id === id && this.c && this.c.live; },
  reset() { this.i = -1; this.cur = null; this.c = null; this.pending = null; this.num = 0; this.skipIds.clear(); this.checkpoint = null; this.asideSaid = {}; },
  nextIndex(from) { let i = from + 1; while (i < CMDS.length && ((CMDS[i].skip && CMDS[i].skip()) || this.skipIds.has(CMDS[i].id))) i++; return i; },
  begin(i, o = {}) {
    this.i = i; const def = this.cur = CMDS[i];
    const c = this.c = { t: 0, live: false, wait: 0, nagT: 0, nagN: 0, best: 1e9, bestT: 0, idleCD: 6, seqI: 0 };
    if (!o.restart) this.num++;
    Hints.hide(); UI.progress(null);
    // rules first (announced), then the command
    let added = [];
    if (def.rules) { const before = Rules.active.map((r) => r.id); added = Rules.set(def.rules); if (!added.length && before.length && !def.rules.length && !def.soft) Narrator.say(pick(['New place. Old rules are off.', 'Rules are off. Enjoy it while it lasts.', 'No rules. For now. Do not get used to it.']), { prio: 2 }); }
    if (def.addRules) for (const id of def.addRules) added = added.concat(Rules.add(id));
    for (const id of added) { const d = RULE_DEFS[id]; Narrator.say(d.say, { prio: 2 }); }
    c.wait = added.length ? 0.2 : 0; c.waitNarr = added.length > 0;
    this.checkpoint = { i, x: P.pos.x, z: P.pos.z, yaw: P.yaw, area: P.area, rules: Rules.active.map((r) => r.id), station: Metro.station, origin: Metro.origin, wrongWay: Metro.wrongWay, seat: P.seat };
    UI.command('…', this.num, { pending: true });
  },
  go() { // actually show + speak the command
    const def = this.cur, c = this.c;
    c.live = true; c.t = 0;
    const text = typeof def.say === 'function' ? def.say(c) : def.say;
    if (def.start) def.start.call(def, c);
    UI.command(def.text, this.num); Sound.sting('command'); UI.flash();
    if (Array.isArray(text)) c.seq = text.slice(); else Narrator.sayNow(text, { soft: def.soft });
    if (Game.metroWatch) Game.metroWatch = false;
    Bus.emit('commandStart', def.id);
  },
  update(dt) {
    if (Game.silenceMode) return;
    if (this.pending) {
      this.pending.t -= dt;
      if (this.pending.t <= 0 && (!Narrator.busy || this.pending.t < -4.5)) {
        const ni = this.nextIndex(this.i);
        const p = this.pending; this.pending = null;
        if (p.end || ni >= CMDS.length) { Game.ending(); return; }
        const aside = LINES.aside[ni];
        if (aside && !this.asideSaid[ni]) { this.asideSaid[ni] = true; Narrator.say(aside, { prio: 2 }); this.pending = { t: 0.3 }; this.i = ni - 1; this.i = this.i; return; }
        this.begin(ni);
      }
      return;
    }
    const def = this.cur, c = this.c; if (!def) return;
    if (!c.live) {
      c.wait -= dt;
      if (c.wait <= 0 && (!c.waitNarr || !Narrator.busy || c.wait < -7)) this.go();
      return;
    }
    c.t += dt;
    if (c.seq) while (c.seq.length && c.t >= c.seq[0][0]) { const [, l] = c.seq.shift(); Narrator.sayNow(l, { soft: def.soft }); }
    if (def.update) { const r = def.update.call(def, c, dt); if (r) { this.complete(r); return; } }
    // hints
    if (!c.hinted && def.hint && c.t > (def.hintDelay || 6.5)) { const h = def.hint(c); if (h) { c.hinted = true; Hints.show(h); } }
    if (c.hinted && def.hint && Math.floor(c.t * 2) !== Math.floor((c.t - dt) * 2)) { const h = def.hint(c); if (h) { if (Hints.visible) Hints.target = h; else Hints.show(h); } else if (Hints.visible) Hints.hide(); }
    // progress-aware nagging
    const goal = Hints.target && Hints.resolve(Hints.target);
    if (goal) { const d = Math.hypot(goal.x - P.pos.x, goal.z - P.pos.z) + (goal.area !== P.area ? 40 : 0); if (d < c.best - 1.5) { c.best = d; c.nagT = Math.min(c.nagT, 4); } }
    c.nagT += dt;
    const nagEvery = 15 + c.nagN * 5;
    if (c.nagT > nagEvery && !Narrator.busy) {
      c.nagT = 0; c.nagN++;
      const own = def.nag && Math.random() < 0.6 ? pick(def.nag) : Narrator.line('nag');
      Narrator.say(own, { prio: 1.5 }); Game.annoy(3);
      if (!c.hinted && def.hint) { const h = def.hint(c); if (h) { c.hinted = true; Hints.show(h); } }
    }
    c.idleCD -= dt;
    if (!def.noIdle && P.idleT > 9 && c.idleCD < 0 && !Narrator.busy && !P.seat) { c.idleCD = 16; Narrator.chatter('idle'); Game.annoy(1); }
    // late: counts as ignored but keeps the command alive
    if (def.late && !c.lateCounted && c.t > def.late) {
      c.lateCounted = true; Game.stats.ignored++; Game.annoy(6); UI.stamp('late');
      Narrator.say(pick(['I am counting that one as ignored. But please. Still do it.', 'That is officially ignored now. Unofficially, I am still waiting.', 'Ignored. Noted. Still waiting, though.']), { prio: 2 });
    }
    if (def.timeout && c.t > def.timeout) this.complete({ r: 'timeout' });
  },
  event(type, data) {
    if (!this.cur || !this.c || !this.c.live || this.pending) return;
    const h = this.cur.on && this.cur.on[type];
    if (h) { const r = h.call(this.cur, this.c, data); if (r) this.complete(r); }
    if (type === 'enterZone') this.wrongPlace(data);
  },
  wrongPlace(id) {
    const z = Zones.byId[id], def = this.cur;
    if (!z || !z.place || !def.goal || this.c.t < 2) return;
    if (id === def.goal.zone || (def.goal.allow || []).includes(id) || (z.group && (def.goal.allow || []).includes(z.group))) return;
    const k = def.id + ':' + id; if (this.wrongSaid[k]) return; this.wrongSaid[k] = true;
    Narrator.say(Math.random() < 0.55 ? `That is ${z.place}. I said ${def.goal.name}.` : Narrator.line('wrongPlace'), { prio: 1.5 });
  },
  complete(res) {
    const def = this.cur, c = this.c; c.live = false;
    const S = Game.stats;
    let r = res.r;
    if (c.lateCounted) { if (r === 'obey' || r === 'lie') r = 'late'; else r = 'lateFail'; }
    switch (r) {
      case 'obey': S.obeyed++; Game.annoy(-4); break;
      case 'lie': S.obeyed++; S.lies++; Game.annoy(-1); break;
      case 'disobey': case 'timeout': S.ignored++; Game.annoy(r === 'timeout' ? 10 : 12); break;
      case 'secret': S.ignored++; Game.annoy(4); break;
      case 'late': Game.annoy(-1); break;
    }
    S.log.push({ id: def.id, r });
    Hints.hide();
    UI.stamp(r === 'lateFail' ? 'disobey' : r);
    Sound.sting(r === 'obey' || r === 'late' ? 'obey' : r === 'lie' ? 'lie' : r === 'secret' ? 'secret' : 'disobey');
    if (res.cons) {
      if (res.cons === 'catFollow') { Cat.state = 'follow'; Game.inv.cat = true; Sound.meow(); UI.inventory(); }
      else Consequences.trigger(res.cons);
    }
    else if ((r === 'disobey' || r === 'timeout') && !res.noCons && Math.random() < 0.65) setTimeout(() => { if (Game.state === 'play' && !Game.silenceMode) Consequences.trigger(Consequences.random()); }, 1600);
    if (res.pay) { Sound.pay(); npcBubble(NPCById.cashier, r === 'lie' || res.cons === 'stare' ? ['要排队！', 'There is a line!'] : ['谢谢！慢走！', 'Thanks! Take care!']); Queue.active = true; }
    if (res.skipNext) this.skipIds.add(res.skipNext);
    let line = res.line;
    if (!line && !res.noReact) {
      const own = def.lines && def.lines[r === 'timeout' ? 'timeout' : r === 'obey' ? 'obey' : null];
      line = own && Math.random() < 0.7 ? pick(own) : Narrator.line(r === 'obey' ? 'obey' : r === 'lie' ? 'lie' : r === 'late' ? 'late' : 'disobey');
    } else if (line && r === 'late') line = Narrator.line('late');
    if (line && !res.quick) Narrator.say(line, { prio: 2, soft: def.soft });
    if (r === 'lie' && !res.line) setTimeout(() => Narrator.react('lie'), 2000);
    this.pending = { t: res.quick ? 0.35 : (res.delay || 1.2), end: !!res.end };
    if (res.quick) this.pending.t = 0.35;
    Bus.emit('commandDone', { id: def.id, r });
  },
};
