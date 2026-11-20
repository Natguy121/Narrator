/* The neighborhood. Layout (meters; x east, z south, north is -z):
   Neon Road runs east-west along z=0. North: hutong (west), noodle shop, temple plaza+temple, neon shops, park (east).
   South: wet market (west), shops, Happiness Lane -> home (center), metro kiosk, night market (east). */

const PI = Math.PI;
const glassB = new Batch();

function buildCity() {
  buildStreets();
  buildLaneAndHome();
  buildSouthShops();
  buildMarket();
  buildNightMarket();
  buildHutong();
  buildNoodleShop();
  buildTeaHouse();
  buildCourtyard();
  buildTemple();
  buildPlazaAndShops();
  buildPark();
  buildKiosk('neon', 14, 10.25, '霓虹路站', 'Neon Road Stn');
  buildKiosk('park', 70, -23.75, '人民公园站', "People's Park Stn");
  buildKiosk('night', 50, 52.25, '夜市站', 'Night Market Stn');
  buildSkyline();
  defineZones();
}

/* ------------------------------------------------------------------ STREETS */
function buildStreets() {
  groundQuad('road', -130, -4.5, 130, 4.5, -0.12, 7);
  groundQuad('pavers', -130, -8, 130, -4.5, 0, 2.4);
  groundQuad('pavers', -130, 4.5, 130, 8, 0, 2.4);
  for (let x = -110; x < 130; x += 40) {
    S.box(x, -0.12, -4.5, 40, 0.13, 0.22, PAL.curb, { ao: false });
    S.box(x, -0.12, 4.5, 40, 0.13, 0.22, PAL.curb, { ao: false });
    S.box(x, -0.115, -0.09, 40, 0.012, 0.09, '#e3b23c', { ao: false });
    S.box(x, -0.115, 0.09, 40, 0.012, 0.09, '#e3b23c', { ao: false });
    S.box(x, -0.115, -4.1, 40, 0.012, 0.1, '#dcdad3', { ao: false });
    S.box(x, -0.115, 4.1, 40, 0.012, 0.1, '#dcdad3', { ao: false });
  }
  for (const cx of [0, -48]) {
    for (let i = -3; i <= 3; i++) S.box(cx + i * 0.85, -0.113, 0, 0.5, 0.012, 8.4, '#e9e7e0', { ao: false });
    S.box(cx - 3.9, -0.113, 2.25, 0.3, 0.012, 4.3, '#e9e7e0', { ao: false });
    S.box(cx + 3.9, -0.113, -2.25, 0.3, 0.012, 4.3, '#e9e7e0', { ao: false });
  }
  // manhole covers, puddles (dark glossy patches on the tile)
  for (const [x, z] of [[-20, 1.8], [12, -2.2], [35, 2], [-62, -1.6]]) S.cyl(x, -0.12, z, 0.45, 0.012, '#2a2b2e', { seg: 12, ao: false });
  for (let x = -72; x <= 72; x += 18) { streetLamp(x, -4.95, 1); streetLamp(x + 9, 4.95, -1); }
  const busy = (x) => [0, -48, -23, -50, 14, 50, -58, -62, 4, -4].some((v) => Math.abs(v - x) < 3.5);
  for (let x = -74; x <= 74; x += 9) {
    if (!busy(x) && x !== -38 && !(x > 34 && x < 80)) tree(x + 2, -5.45, SR() < 0.5 ? 'ginkgo' : 'leaf', 0.85, { planter: true });
    if (!busy(x + 4) && !(x > -78 && x < -40) && x !== 23) tree(x + 4.5, 5.45, SR() < 0.6 ? 'ginkgo' : 'leaf', 0.85, { planter: true });
  }
  // shared bikes
  const bikeCols = ['#f2c230', '#f07c1e', '#2f8bd8'];
  for (let i = 0; i < 6; i++) bike(6.5 + i * 0.7, 7.25, PI / 2 + sr(-0.1, 0.1), bikeCols[i % 3]);
  for (let i = 0; i < 5; i++) bike(-36 + i * 0.7, -7.25, PI / 2 + sr(-0.1, 0.1), bikeCols[(i + 1) % 3]);
  Col.add(6, 6.5, 10.4, 8); Col.add(-36.5, -8, -32.6, -6.5);
  // bus stop
  S.box(-12, 0, 7.6, 5, 0.1, 0.8, '#3a3e44'); S.box(-12, 2.6, 7.2, 5.4, 0.12, 1.8, '#3a3e44');
  for (const dx of [-2.4, 2.4]) S.box(-12 + dx, 0, 7.8, 0.1, 2.6, 0.1, '#3a3e44');
  S.box(-12, 0.45, 7.75, 4, 0.08, 0.45, '#9aa0a6');
  const busTex = signTexture({ cn: '霓虹路 公交站', en: 'Neon Road Bus Stop · 88 · 12 · 305', bg: '#1d4f91', fg: '#ffffff', w: 512, h: 128 });
  makeSign(-12, 2.95, 6.3, 3.6, 0.9, 0, busTex);
  Col.add(-14.5, 7.4, -9.5, 8);
  trashBins(-8.5, 7.4, 0); trashBins(24, -7.4, PI); trashBins(-41, 7.4, 0);
  const st = signTexture({ cn: '霓虹路', en: 'Neon Road', style: 'street', bg: '#1a4fa0', fg: '#ffffff', w: 256, h: 96 });
  makeSign(-3.9, 2.6, 5.6, 1.4, 0.52, PI / 2, st); S.box(-4.3, 0, 5.6, 0.1, 2.9, 0.1, '#555');
}

/* ------------------------------------------------------------------ LANE + HOME */
function buildLaneAndHome() {
  groundQuad('pavers', -4.5, 8, 4.5, 61, 0, 1.6);
  S.box(0, 0, 34, 0.35, 0.02, 52, '#77746e', { ao: false }); // drain line
  bldg(-16, 20, -4.5, 40, 19, { style: 'resi', faces: ['e'], color: '#d8cdb9', litP: 0.6 });
  bldg(-16, 40, -4.5, 60, 16, { style: 'resi', faces: ['e'], color: '#cdbfae', litP: 0.6 });
  bldg(4.5, 20, 16, 40, 18, { style: 'resi', faces: ['w'], color: '#d6c3b5', litP: 0.6 });
  bldg(4.5, 40, 16, 60, 21, { style: 'resi', faces: ['w'], color: '#c9c1b2', litP: 0.6 });
  // home: building 3
  bldg(-16, 60, 16, 80, 20, { style: 'resi', faces: ['n'], color: '#e0d3bd', litP: 0.7, skipU: (u, y) => y < 4 && Math.abs(u - 16) < 3 });
  S.box(0, 0, 59.7, 3.4, 3.1, 0.6, '#8d8578');
  S.box(0, 0.05, 59.35, 2.4, 2.5, 0.1, '#2a3540');
  WN.box(0, 0.1, 59.3, 2.2, 2.3, 0.04, '#ffd9a0');
  S.box(0, 3.1, 58.9, 4.2, 0.2, 2.2, '#6f675c');
  LB.box(0, 2.95, 58.5, 0.8, 0.1, 0.3, '#fff0c8'); halo(0, 2.85, 58.4, '#ffe0a0', 'M');
  const hs = signTexture({ cn: '幸福小区 3号楼', en: 'Happiness Residences · Bldg 3', bg: '#8b1e17', fg: '#ffd76a', w: 512, h: 128 });
  makeSign(0, 3.65, 58.98, 3.6, 0.9, PI, hs);
  for (let i = 0; i < 6; i++) S.box(-3.0 + (i % 3) * 0.32, 1.2 + Math.floor(i / 3) * 0.32, 59.38, 0.28, 0.28, 0.08, '#7f8c8d');
  pot(-2.2, 58.6, 1, '#e74c3c'); pot(2.3, 58.6, 0.9);
  A.homeDoor = new THREE.Vector3(0, 0, 59.2);
  A.start = { x: 0, z: 56.8, yaw: 0 };
  // cat's planter (east side)
  lowWall(3.2, 48, 4.5, 52, 0.55, '#9a958c');
  S.box(3.85, 0.55, 50, 1.2, 0.15, 3.9, '#5d7a3a', { ao: false });
  A.cat = { x: 3.75, y: 0.62, z: 50, ry: -PI / 2 };
  // grandpas' chess table
  S.box(-2.6, 0, 38, 0.9, 0.7, 0.9, '#7a5a3a'); S.box(-2.6, 0.7, 38, 0.95, 0.04, 0.95, '#d8b678');
  for (let i = 0; i < 10; i++) S.cyl(-2.6 + sr(-0.35, 0.35), 0.74, 38 + sr(-0.35, 0.35), 0.05, 0.03, i % 2 ? '#c0392b' : '#1a1a1a', { seg: 8, ao: false });
  stool(-2.6, 37.25, '#555'); stool(-2.6, 38.75, '#555');
  Col.add(-3.2, 36.9, -2.0, 39.1);
  A.grandpa = { x: -2.6, z: 37.2, ry: 0 }; A.grandpa2 = { x: -2.6, z: 38.8, ry: PI }; A.onlooker = { x: -1.45, z: 37.9, ry: -PI / 2 };
  // bikes along the east wall + delivery scooter
  const bc = ['#f2c230', '#2f8bd8', '#333', '#c0392b', '#f07c1e'];
  for (let z = 14, i = 0; z < 46; z += 1.9, i++) if (Math.abs(z - 38) > 2) bike(3.75, z, 0, bc[i % bc.length]);
  Col.add(2.95, 13.5, 4.5, 46.5);
  eScooter(-3.8, 24, PI / 2, '#3a7bd5'); Col.box(-3.8, 24, 0.5, 1.4);
  pot(-3.9, 30, 1, '#e05a7a'); pot(-3.9, 31, 0.8); pot(-3.9, 44, 1.1, '#f1c40f'); pot(-3.9, 52, 0.9);
  // laundry lines across the lane
  for (const [z, y] of [[18, 8], [27, 10.5], [35, 7.5], [45, 9], [53, 6.8]]) {
    wire(-4.5, y, z, 4.5, y, z);
    for (let x = -3.6; x < 3.8; x += sr(0.6, 1.0)) S.box(x, y - 0.7, z, sr(0.35, 0.6), sr(0.5, 0.8), 0.03, spick(PAL.shirt), { ao: false });
  }
  for (const [z, y] of [[22, 6], [40, 6.2], [48, 5.8]]) { wire(-4.5, y, z - 3, 4.5, y + 0.5, z + 2); }
  for (const z of [16, 33, 50]) { S.box(-4.35, 3.4, z, 0.3, 0.12, 0.3, '#333'); LB.box(-4.15, 3.25, z, 0.25, 0.2, 0.25, '#ffe0a8'); halo(-4.1, 3.2, z, '#ffd090', 'M'); }
  const ls = signTexture({ cn: '幸福里', en: 'Happiness Lane', style: 'street', bg: '#1a4fa0', fg: '#ffffff', w: 256, h: 96 });
  makeSign(-4.43, 2.8, 9.5, 1.3, 0.5, PI / 2, ls);
}

/* ------------------------------------------------------------------ SOUTH SHOPS */
function buildSouthShops() {
  bldg(-42, 8, -32, 20, 16, { faces: ['n'], color: '#d4c2a8', shop: { face: 'n', cn: '面包房', en: 'Bakery', bg: '#f4e3c3', fg: '#8a4b2e', awning: '#c97b4a', lit: '#ffe2b0' } });
  bldg(-32, 8, -22, 20, 12, { faces: ['n'], color: '#bfb3a5', shop: { face: 'n', cn: '理发店', en: 'Barber', neon: true, fg: '#46d6ff', awning: '#2f5d8a' } });
  // barber pole
  for (let i = 0; i < 6; i++) LB.box(-31.2, 0.6 + i * 0.3, 7.8, 0.22, 0.15, 0.22, i % 2 ? '#e03b3b' : '#f5f5f5');
  S.box(-31.2, 0.4, 7.8, 0.3, 0.2, 0.3, '#888'); halo(-31.2, 1.4, 7.6, '#ff8080', 'M');
  bldg(-22, 8, -13, 20, 24, { faces: ['n'], color: '#c8c4bc', shop: { face: 'n', cn: '手机通讯', en: 'Phones & SIM', neon: true, fg: '#4dffd2', awning: '#1d6f5f', vertical: { cn: '电信营业厅', color: '#4dc3ff', y: 9 } } });
  bldg(-13, 8, -4.5, 20, 18, { faces: ['n', 'e'], color: '#d9c4b0', shop: { face: 'n', cn: '重庆火锅', en: 'Chongqing Hotpot', neon: true, fg: '#ff4a3a', awning: '#8b1e17' } });
  bldg(-42, 20, -16, 80, 14, { faces: [], color: '#b9ae9e' });
  bldg(4.5, 8, 11, 20, 14, { faces: ['n', 'w'], color: '#cfc4b4', shop: { face: 'n', cn: '新华书店', en: 'Books', bg: '#7b1d1d', fg: '#f8e5a0', awning: '#5a3a2a' } });
  bldg(11, 12.5, 17, 20, 9, { faces: ['n'], color: '#bab4a9' });
  bldg(17, 8, 26, 20, 28, { faces: ['n'], color: '#9fa6ad', shop: { face: 'n', cn: '如家宾馆', en: 'Home Inn Hotel', neon: true, fg: '#5aa8ff', awning: '#1f3d6b', vertical: { cn: '宾馆', color: '#ffd23f', y: 10 } } });
  bldg(26, 8, 35, 20, 15, { faces: ['n'], color: '#d6c9b5', shop: { face: 'n', cn: '东北饺子馆', en: 'Northeast Dumpling House', bg: '#b3261e', fg: '#ffe08a', awning: '#b3261e' } });
  bldg(35, 8, 43.5, 20, 20, { faces: ['n', 'e'], color: '#c3c7cc', shop: { face: 'n', cn: '便民超市', en: 'Mini Mart', neon: true, fg: '#ffcf3a', awning: '#d35400' } });
  bldg(35, 20, 43.5, 50, 14, { faces: ['e'], style: 'resi', color: '#cbbca8' });
  bldg(16, 20, 35, 80, 26, { faces: [], color: '#a9a49b' });
  bldg(4.5, 60, 16, 80, 12, { faces: [], color: '#b5ab9c' });
  bldg(35, 50, 43.5, 80, 18, { faces: [], color: '#b0a69a' });
}

/* ------------------------------------------------------------------ WET MARKET */
function buildMarket() {
  groundQuad('tiles', -79, 8, -43, 41, 0.01, 1.4);
  const roofC = '#7b8a8f';
  S.box(-61, 5.5, 25, 37, 0.4, 33, roofC, { ao: false });
  S.prism(-61, 5.9, 25, 33.5, 2.2, 37, '#5f6d73', { ry: PI / 2 });
  // walls W/S/E
  S.box(-79.5, 0, 25, 1, 5.5, 33, '#c9c3b8'); Col.add(-80, 8, -79, 42);
  S.box(-61, 0, 41.5, 37, 5.5, 1, '#c9c3b8'); Col.add(-80, 41, -42, 42);
  S.box(-42.5, 0, 25, 1, 5.5, 33, '#c9c3b8'); Col.add(-43, 8, -42, 42);
  for (const x of [-73, -67, -55, -49]) { S.box(x, 0, 9, 0.45, 5.5, 0.45, '#5b6268'); Col.box(x, 9, 0.45, 0.45); }
  for (const x of [-73, -67, -55, -49]) for (const z of [24.5, 35]) { S.box(x, 0, z, 0.35, 5.5, 0.35, '#5b6268'); Col.box(x, z, 0.35, 0.35); }
  const ms = signTexture({ cn: '东门菜市场', en: 'East Gate Wet Market', bg: '#14632f', fg: '#ffffff', w: 768, h: 192 });
  S.box(-61, 4.6, 8.7, 13, 1.9, 0.3, '#0f4d24');
  makeSign(-61, 5.55, 8.5, 12, 3, PI, ms);
  makeSign(-61, 5.55, 8.5, 12, 3, PI, ms).mesh.rotation.y = 0; // readable from the street (faces north... both ways)
  for (let x = -76; x < -45; x += 4) for (const z of [15, 25, 34]) { LB.ball(x, 4.6, z, 0.16, '#fff1c8'); S.box(x, 4.75, z, 0.02, 0.8, 0.02, '#222'); halo(x, 4.5, z, '#ffe6b0', 'M'); }
  // stalls: [x, z, kind]
  const stalls = [
    [-70, 19, 'veg'], [-62, 19, 'fruit'], [-53, 19, 'fish'], [-46.5, 19, 'tofu'],
    [-70, 30, 'eggs'], [-62, 30, 'mush'], [-53, 30, 'noodle'], [-46.5, 30, 'spice'],
  ];
  const names = {
    veg: ['蔬菜', 'Vegetables'], fruit: ['新鲜水果', 'Fresh Fruit'], fish: ['活鱼', 'Live Fish'], tofu: ['豆腐', 'Tofu'],
    eggs: ['鸡蛋', 'Eggs'], mush: ['菌菇', 'Mushrooms'], noodle: ['手工面', 'Fresh Noodles'], spice: ['干货调料', 'Spices & Dried Goods'],
  };
  for (const [x, z, k] of stalls) {
    S.box(x, 0, z, 3.0, 0.95, 1.1, '#d8d4cc'); S.box(x, 0.95, z, 3.1, 0.06, 1.2, '#b7b2a8');
    Col.box(x, z, 3.0, 1.1);
    S.box(x, 2.4, z + 0.55, 3.0, 0.05, 0.05, '#555');
    const tex = signTexture({ cn: names[k][0], en: names[k][1], bg: '#c0392b', fg: '#fff3c4', w: 384, h: 128 });
    makeSign(x, 2.2, z - 0.62, 2.0, 0.66, PI, tex);
    S.box(x, 1.9, z - 0.58, 0.04, 0.6, 0.04, '#444');
    const y = 1.01;
    const pile = (c, r, n, sp = 1.2) => { for (let i = 0; i < n; i++) S.ball(x + sr(-sp, sp), y + r, z + sr(-0.35, 0.35), r, jit(c, 0.1), { smooth: true }); };
    if (k === 'veg') { pile('#6aa84f', 0.2, 10); pile('#c0392b', 0.07, 20); pile('#6a3d7a', 0.1, 8); }
    if (k === 'fruit') {
      for (let i = 0; i < 26; i++) S.ball(x - 1.1 + sr(0, 1.0), y + 0.09 + (i % 3) * 0.06, z + sr(-0.35, 0.3), 0.09, '#f39c12', { smooth: true });
      pile('#d64535', 0.09, 12, 0.5); for (let i = 0; i < 5; i++) S.box(x + 0.7 + sr(-0.2, 0.2), y, z + sr(-0.3, 0.3), 0.35, 0.08, 0.1, '#f1d04b', { ry: sr(-1, 1) });
      pile('#cddc6a', 0.18, 3, 0.3);
    }
    if (k === 'fish') {
      for (let i = 0; i < 2; i++) { glassB.box(x - 0.8 + i * 1.6, y, z, 1.3, 0.75, 0.9, '#7fc8e8'); S.box(x - 0.8 + i * 1.6, y, z, 1.25, 0.6, 0.85, '#2d6e8a', { ao: false }); }
      A.fishTanks = [[x - 0.8, z], [x + 0.8, z]];
      steamEmitter(x, 1.9, z, 0.6, { spread: 0.6 });
    }
    if (k === 'tofu') for (let i = 0; i < 8; i++) S.box(x + sr(-1.1, 1.1), y, z + sr(-0.3, 0.3), 0.3, 0.14, 0.3, '#f4efe0');
    if (k === 'eggs') pile('#e9dcc4', 0.06, 40);
    if (k === 'mush') { pile('#8a6a4a', 0.08, 24); pile('#efe4d0', 0.06, 18); }
    if (k === 'noodle') for (let i = 0; i < 6; i++) S.box(x + sr(-1.1, 1.1), y, z + sr(-0.3, 0.3), 0.4, 0.1, 0.3, '#f2e3b3');
    if (k === 'spice') { pile('#b3261e', 0.1, 14); pile('#7a5230', 0.1, 14); }
    A['stall_' + k] = { x, z: z + 0.95, ry: PI };
  }
  // the bag of oranges (interactable), on the front edge of the fruit stall
  const bag = new Batch();
  for (let i = 0; i < 7; i++) bag.ball(sr(-0.12, 0.12), 0.09 + Math.floor(i / 3) * 0.12, sr(-0.08, 0.08), 0.085, '#f39c12', { smooth: true });
  bag.box(0, 0, 0, 0.32, 0.36, 0.24, '#d63a2f', { ao: false });
  G.orangeBag = bag.build(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, transparent: true, opacity: 1 }));
  G.orangeBag.geometry.translate(0, 0, 0);
  G.orangeBag.position.set(-61.0, 1.0, 18.35); G.scene.add(G.orangeBag);
  const pt = signTexture({ cn: '橘子 ¥6/袋', en: 'Oranges ¥6 / bag', bg: '#fff6d8', fg: '#b3261e', w: 256, h: 96 });
  makeSign(-61.6, 1.35, 18.37, 0.6, 0.23, PI, pt);
  A.oranges = new THREE.Vector3(-61.0, 1.1, 18.3);
  A.fish = new THREE.Vector3(-53, 1.3, 18.4);
  crate(-66, 21.5, 0.2); crate(-57, 21.3, -0.1, '#3d7ab8'); crate(-49, 12, 0.3);
  pot(-44, 11, 1);
}

/* ------------------------------------------------------------------ NIGHT MARKET */
function buildNightMarket() {
  groundQuad('stone', 43.5, 8, 56.5, 50, 0.005, 2);
  // arch
  for (const x of [44.2, 55.8]) { S.box(x, 0, 9.2, 0.6, 5.6, 0.6, '#a8221a'); Col.box(x, 9.2, 0.6, 0.6); }
  S.box(50, 5.0, 9.2, 13.2, 0.5, 0.7, '#8b1e17');
  S.prism(50, 5.5, 9.2, 1.8, 0.9, 13.8, PAL.roof, { ry: PI / 2 });
  const at = signTexture({ cn: '美食夜市', en: 'Night Food Market', style: 'neon', fg: '#ffcf3a', fg2: '#ff6a3a', w: 768, h: 192 });
  makeSign(50, 4.3, 8.82, 6, 1.5, PI, at, { neon: true, color: '#ffb23a' });
  makeSign(50, 4.3, 9.58, 6, 1.5, 0, at, { neon: true, color: '#ffb23a', streak: false });
  const types = [
    ['烤串', 'Skewers', 'skewer'], ['臭豆腐', 'Stinky Tofu', 'tofu'], ['饺子', 'Dumplings', 'dumpling'], ['糖葫芦', 'Candied Haws', 'haws'],
    ['煎饼果子', 'Jianbing', 'jianbing'], ['珍珠奶茶', 'Bubble Tea', 'tea'], ['烤红薯', 'Sweet Potato', 'potato'], ['小龙虾', 'Crayfish', 'cray'],
    ['牛肉面', 'Beef Noodles', 'noodle'], ['包子', 'Steamed Buns', 'bun'], ['炒饭', 'Fried Rice', 'rice'], ['烧烤', 'BBQ', 'skewer'],
    ['冰粉', 'Ice Jelly', 'tea'], ['汤圆', 'Tangyuan', 'bun'], ['铁板鱿鱼', 'Grilled Squid', 'skewer'], ['水果捞', 'Fruit Cups', 'fruit'],
  ];
  const awn = ['#c0392b', '#e67e22', '#2980b9', '#16a085', '#8e44ad', '#d35400', '#27ae60', '#b3261e'];
  A.nmVendors = [];
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 8; i++) {
      const z = 13 + i * 4.5, t = types[side * 8 + i];
      const west = side === 0;
      const cx = west ? 44.9 : 55.1, ry = west ? PI / 2 : -PI / 2, face = west ? 1 : -1;
      S.box(cx, 0, z, 1.0, 0.95, 3.6, '#5a4636'); S.box(cx, 0.95, z, 1.1, 0.06, 3.7, '#d9d2c4');
      Col.add(cx - 0.6, z - 1.85, cx + 0.6, z + 1.85);
      for (const dz of [-1.8, 1.8]) S.box(cx - face * 0.9, 0, z + dz, 0.08, 2.9, 0.08, '#333');
      S.box(cx + face * 0.1, 2.75, z, 2.4, 0.08, 4.0, awn[(i + side * 3) % awn.length], { rz: face * -0.18, ao: false });
      const tex = signTexture({ cn: t[0], en: t[1], bg: '#1b1b1f', fg: '#ffd76a', style: 'neon', w: 384, h: 128 });
      const sg = makeSign(cx + face * 1.12, 2.45, z, 2.3, 0.77, west ? PI / 2 : -PI / 2, tex, { neon: true, color: '#ffc04a', streak: false });
      sg.mesh.rotation.y = ry;
      stringLights(cx + face * 1.2, 2.25, z - 1.9, cx + face * 1.2, 2.25, z + 1.9, 8, ['#ffe7a8', '#ffd27a'], 0.15);
      const y = 1.01, fx = cx + face * 0.15;
      if (t[2] === 'skewer') { for (let k = 0; k < 12; k++) S.box(fx, y + 0.05, z - 1.2 + k * 0.2, 0.6, 0.05, 0.04, '#8a4a2a'); LB.box(fx, y, z, 0.5, 0.04, 2.6, '#ff5a1f'); steamEmitter(fx, 1.3, z, 5, { smoke: true, spread: 0.8 }); }
      if (t[2] === 'dumpling' || t[2] === 'bun') { for (let k = 0; k < 3; k++) { S.cyl(fx, y + k * 0.18, z - 0.8 + k * 0.05, 0.32, 0.17, '#c9a464', { seg: 12 }); } S.cyl(fx, y, z + 0.8, 0.32, 0.36, '#c9a464', { seg: 12 }); steamEmitter(fx, 1.6, z - 0.8, 6, { spread: 0.25 }); }
      if (t[2] === 'haws') for (let k = 0; k < 10; k++) for (let j = 0; j < 5; j++) LB.ball(fx + sr(-0.1, 0.1), y + 0.4 + j * 0.1, z - 1.3 + k * 0.28, 0.045, '#e8231c');
      if (t[2] === 'tofu' || t[2] === 'jianbing' || t[2] === 'rice' || t[2] === 'noodle' || t[2] === 'cray') { S.cyl(fx, y, z, 0.42, 0.12, '#2a2a2a', { seg: 12 }); steamEmitter(fx, 1.3, z, 4, { smoke: t[2] === 'tofu', spread: 0.3 }); }
      if (t[2] === 'potato') { S.cyl(fx, y, z, 0.35, 0.8, '#3a3a3a'); for (let k = 0; k < 6; k++) S.ball(fx + sr(-0.2, 0.2), y + 0.82, z + sr(-0.2, 0.2), 0.1, '#7a3a2a', { sy: 0.6 }); }
      if (t[2] === 'tea' || t[2] === 'fruit') for (let k = 0; k < 8; k++) S.cyl(fx + sr(-0.15, 0.15), y, z - 1.2 + k * 0.33, 0.07, 0.22, spick(['#f6c9a8', '#e8a0c0', '#c8e8a0', '#ffe08a']), { seg: 6 });
      A.nmVendors.push({ x: west ? 44.05 : 55.95, z, ry: west ? PI / 2 : -PI / 2, type: t[2] });
      if (t[2] === 'dumpling') { A.dumplingStall = { x: cx, z }; A.dumplingAuntie = { x: 44.05, z, ry: PI / 2 }; }
    }
  }
  // overhead lantern & light strings (for "look up")
  for (let z = 12; z <= 48; z += 4) {
    stringLights(43.6, 5.2, z, 56.4, 5.2, z + 2, 16, ['#ffd27a', '#ff8a5a', '#ffe9b8', '#7ad7ff'], 0.8);
    if (z % 8 === 0) lanternString(43.6, 6.2, z + 1, 56.4, 6.2, z + 1, 7, 0.6, 0.3);
  }
  // tables
  for (const z of [20, 33.5]) { table(50, z, 1.4, 0.9, '#e8e3d5', 0.72); for (const dx of [-1.0, 1.0]) stool(50 + dx, z, '#2f6db5'); }
  bldg(56.5, 8, 80, 50, 16, { faces: ['w', 'n'], style: 'resi', color: '#c7b39f' });
  for (const z of [18, 30, 42]) { const tx = signTexture({ cn: spick(['卡拉OK', '烧烤', '啤酒', '夜宵', '足疗']), style: 'neon', fg: spick(['#ff4fa3', '#36e0ff', '#ffcf3a', '#7dff6a']), w: 256, h: 96 }); makeSign(56.4, 4.6, z, 2.6, 1, -PI / 2, tx, { neon: true, color: '#ff7ab8', streak: false }); }
  bldg(56.5, 50, 80, 80, 22, { faces: [], color: '#a69c90' });
  bldg(43.5, 50, 47, 80, 12, { faces: [], color: '#9a9288' });
  bldg(53, 50, 56.5, 80, 12, { faces: [], color: '#9a9288' });
}

/* ------------------------------------------------------------------ HUTONG */
function buildHutong() {
  groundQuad('bricks', -51.6, -41.6, -48.4, -8, 0.005, 2.2);
  groundQuad('bricks', -73, -41.6, -51.6, -38.4, 0.005, 2.2);
  groundQuad('bricks', -48.4, -41.6, -44, -38.4, 0.005, 2.2);
  // SW block (between main street and E-W alley, west of the N-S alley)
  hutongBlock(-80, -38.4, -51.6, -8, { e: { doors: [8, 18, 26], windows: [4, 13, 22] }, n: { doors: [6, 15], windows: [10, 20, 25] }, s: { doors: [], windows: [6, 12, 20], lanterns: false, details: false } }, { trees: 3 });
  hutongBlock(-48.4, -38.4, -30, -8, { w: { doors: [6, 16, 24], windows: [11, 20, 28] }, s: { doors: [], windows: [5, 14], details: false } }, { trees: 2, treeKind: 'ginkgo' });
  hutongBlock(-58, -54, -44, -41.6, { s: { doors: [4, 10], windows: [7, 12] }, e: { doors: [6], windows: [3, 9] } }, { trees: 1 });
  hutongBlock(-80, -54, -73, -38.4, { e: { doors: [8], windows: [] } }, {});
  hutongBlock(-80, -80, -44, -54, {}, { trees: 4 });
  // the steamed bun window on the main street (south face of SW block)
  S.box(-62, 0, -7.4, 2.6, 0.95, 0.8, '#7a5236'); Col.box(-62, -7.4, 2.6, 0.8);
  for (let k = 0; k < 3; k++) S.cyl(-62.6 + k * 0.6, 0.95, -7.4, 0.28, 0.4 - k * 0.1, '#c9a464', { seg: 12 });
  steamEmitter(-62, 1.4, -7.4, 6, { spread: 0.6 });
  const bt = signTexture({ cn: '老北京包子', en: 'Old Beijing Steamed Buns', bg: '#7b1d1d', fg: '#ffe08a', w: 512, h: 128 });
  makeSign(-62, 3.0, -7.92, 4, 1, 0, bt);
  A.bunVendor = { x: -62, z: -8.3, ry: 0 };
  // hutong gate at the alley entrance
  for (const x of [-52, -48]) { S.box(x, 0, -8.6, 0.5, 4.4, 0.5, '#9c2a1d'); Col.box(x, -8.6, 0.5, 0.5); }
  S.box(-50, 3.9, -8.6, 4.8, 0.5, 0.7, '#7b1d1d');
  S.prism(-50, 4.4, -8.6, 1.9, 0.9, 5.6, PAL.roof, { ry: PI / 2 });
  const hg = signTexture({ cn: '杨柳胡同', en: 'Willow Hutong', style: 'street', bg: '#1a4fa0', fg: '#ffffff', w: 512, h: 160 });
  makeSign(-50, 3.35, -8.22, 2.6, 0.82, 0, hg);
  lantern(-51.2, 3.0, -8.0, 0.25); lantern(-48.8, 3.0, -8.0, 0.25);
  // THE red lantern at the T-junction
  lantern(-50, 3.1, -40, 0.55);
  wire(-51.6, 3.9, -40, -48.4, 3.9, -40);
  A.redLantern = new THREE.Vector3(-50, 3.1, -40);
  // lived-in details
  bike(-51.0, -16, PI / 2, '#2f8bd8'); bike(-49.0, -27, -PI / 2, '#333'); Col.add(-51.5, -16.6, -50.6, -15.4); Col.add(-49.4, -27.6, -48.5, -26.4);
  for (let i = 0; i < 9; i++) S.ball(-51.1 + sr(-0.2, 0.2), 0.2 + Math.floor(i / 3) * 0.3, -31 + (i % 3) * 0.45, 0.24, '#8db556', { sy: 1.2 });
  Col.add(-51.6, -31.4, -50.6, -29.6);
  propMesh((b) => { b.box(0, 0.5, 0, 1.6, 0.08, 1.0, '#3a6ea5'); for (const s of [-0.6, 0.6]) b.prim(GEO.torus, s, 0.3, 0.55, 0.6, 0.6, 0.6, '#222', { center: true, ry: 0 }); b.prim(GEO.torus, 1.1, 0.3, 0, 0.6, 0.6, 0.6, '#222', { center: true }); b.box(1.0, 0.6, 0, 0.08, 0.6, 0.08, '#333'); b.box(1.0, 1.0, 0, 0.08, 0.08, 0.6, '#333'); for (let i = 0; i < 4; i++) b.box(sr(-0.5, 0.5), 0.58, sr(-0.3, 0.3), 0.4, 0.3, 0.4, '#c79b5b'); }, -49.1, -34.5, PI / 2, { kind: 'cart', col: [1.2, 2.2] });
  for (const z of [-14, -22, -30, -36]) { wire(-51.6, 3.7, z, -48.4, 3.8, z + 1.5); }
  for (const z of [-19, -33]) { wire(-51.6, 3.4, z, -48.4, 3.4, z); for (let x = -51.2; x < -48.6; x += 0.7) S.box(x, 2.85, z, 0.4, 0.55, 0.03, spick(PAL.shirt), { ao: false }); }
  for (const x of [-56, -63, -69]) { wire(x, 3.6, -41.6, x + 1, 3.7, -38.4); }
  pot(-48.8, -12, 0.9, '#e74c3c'); pot(-51.2, -24, 1); pot(-58, -38.9, 0.8, '#f1c40f'); pot(-67, -38.9, 1);
  A.hutongStool = { x: -49.0, z: -21.5, ry: -PI / 2 };
  S.box(-48.95, 0, -21.5, 0.4, 0.4, 0.4, '#6b4f3a');
  A.cat2 = { x: -51.4, y: 3.62, z: -12.5 };
}

/* ------------------------------------------------------------------ NOODLE SHOP */
function buildNoodleShop() {
  const wallC = '#e9dcc2';
  groundQuad('tiles', -29.7, -21.7, -16.3, -8.3, 0.01, 1.1);
  // shell
  S.box(-23, 0, -21.85, 14, 4.5, 0.3, wallC); Col.add(-30, -22, -16, -21.7);
  S.box(-29.85, 0, -15, 0.3, 4.5, 14, wallC); Col.add(-30, -22, -29.7, -8);
  S.box(-16.15, 0, -15, 0.3, 4.5, 14, wallC); Col.add(-16.3, -22, -16, -8);
  // front wall with windows and door
  const front = (x0, x1) => {
    const cx = (x0 + x1) / 2, w = x1 - x0;
    S.box(cx, 0, -8.15, w, 0.85, 0.3, '#8b2a20'); S.box(cx, 3.0, -8.15, w, 1.5, 0.3, '#8b2a20');
    glassB.box(cx, 0.85, -8.15, w, 2.15, 0.06, '#9fc4d8');
    S.box(cx, 0.85, -8.15, w, 0.08, 0.34, '#3a2a1c'); S.box(cx, 2.95, -8.15, w, 0.08, 0.34, '#3a2a1c');
    Col.add(x0, -8.3, x1, -8);
  };
  front(-29.7, -24.6); front(-22.0, -16.3);
  S.box(-29.85, 0, -8.15, 0.3, 4.5, 0.3, '#5a1e16'); S.box(-16.15, 0, -8.15, 0.3, 4.5, 0.3, '#5a1e16');
  S.box(-23.3, 2.75, -8.15, 2.6, 1.75, 0.3, '#8b2a20');
  // door curtain strips (plastic) - cosmetic
  for (let x = -24.45; x < -22.1; x += 0.3) glassB.box(x, 0.35, -8.1, 0.27, 2.35, 0.015, '#cfe3e8', { ao: false });
  // ceiling + upper floors
  S.box(-23, 4.2, -15, 14, 0.3, 14, '#d8ccb4');
  S.box(-23, 4.5, -15, 14, 9, 14, '#c9b8a2');
  facade(faceFrame('s', -30, -22, -16, -8), 13.5, '#c9b8a2', { style: 'resi', litP: 0.6, startY: 5.6 }, 's');
  // interior wainscot + decor
  S.box(-23, 0, -21.65, 13.4, 1.0, 0.08, '#a8321f'); S.box(-29.65, 0, -15, 0.08, 1.0, 13.4, '#a8321f'); S.box(-16.35, 0, -15, 0.08, 1.0, 13.4, '#a8321f');
  // signage outside
  const ns = signTexture({ cn: '老王面馆', en: "Old Wang's Noodles", bg: '#9c2a1d', fg: '#ffd76a', border: '#e0b04a', w: 768, h: 192, serif: true });
  makeSign(-23, 3.75, -7.98, 6.8, 1.15, 0, ns);
  halo(-23, 3.75, -7.4, '#ffb070', 'L');
  lantern(-25.3, 3.0, -7.55, 0.34); lantern(-20.7, 3.0, -7.55, 0.34);
  const vs = signTexture({ cn: '拉面', en: 'Noodles', vertical: true, style: 'neon', fg: '#ff4a3a', w: 128, h: 512 });
  makeSign(-16.0, 7.5, -7.3, 0.9, 3.6, PI / 2, vs, { neon: true, color: '#ff4a3a', double: true });
  S.box(-16.0, 5.5, -7.8, 0.15, 4, 0.15, '#333');
  // kitchen counter
  S.box(-24.3, 0, -19.9, 10.8, 1.05, 1.0, '#9aa3a8'); S.box(-24.3, 0, -19.38, 10.8, 1.0, 0.04, '#a8321f');
  Col.add(-29.7, -21.7, -16.3, -19.4);
  S.cyl(-27.5, 1.05, -20.1, 0.42, 0.55, '#7d8288', { seg: 12 }); S.cyl(-26.4, 1.05, -20.1, 0.35, 0.45, '#7d8288', { seg: 12 });
  LB.box(-27.5, 1.6, -20.1, 0.7, 0.02, 0.7, '#ffcc99');
  steamEmitter(-27.5, 1.7, -20.1, 8, { spread: 0.25 }); steamEmitter(-26.4, 1.55, -20.1, 5, { spread: 0.2 });
  for (let i = 0; i < 5; i++) S.cyl(-22.5 + i * 0.05, 1.05 + i * 0.07, -20.0, 0.17, 0.07, '#f2f2f2', { seg: 12 });
  // menu board
  G.menuTex = canvasTex(1024, 360, (g, w, h) => {
    g.fillStyle = '#3b2416'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9a441'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#ffd76a'; g.textAlign = 'center'; g.font = `bold 52px ${FONT_SERIF}`; g.fillText('菜单 · MENU', w / 2, 66);
    g.textAlign = 'left';
    MENU.forEach((m, i) => {
      const cx = i < 3 ? 60 : 540, cy = 140 + (i % 3) * 72;
      g.fillStyle = '#fff3d6'; g.font = `bold 38px ${FONT_CN}`; g.fillText(m.cn, cx, cy);
      g.font = `24px ${FONT_EN}`; g.fillStyle = '#e8d6b0'; g.fillText(m.en, cx, cy + 28);
      g.textAlign = 'right'; g.font = `bold 40px ${FONT_EN}`; g.fillStyle = '#ffd76a'; g.fillText('¥' + m.price, cx + 420, cy + 8); g.textAlign = 'left';
    });
  });
  makeSign(-24.3, 2.95, -21.66, 4.6, 1.62, 0, G.menuTex);
  // cashier counter
  S.box(-17.9, 0, -14.8, 1.1, 1.05, 3.0, '#8b5e3c'); S.box(-18.47, 0, -14.8, 0.04, 1.0, 3.0, '#a8321f');
  Col.add(-18.45, -16.3, -16.3, -13.3);
  S.box(-17.9, 1.05, -15.3, 0.4, 0.25, 0.35, '#2a2a2a');
  const qr = canvasTex(128, 160, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 160); g.fillStyle = '#1aad19'; g.fillRect(0, 0, 128, 28); g.fillStyle = '#000'; for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if ((x * 7 + y * 13 + x * y) % 3 === 0) g.fillRect(19 + x * 10, 40 + y * 10, 10, 10); g.fillStyle = '#fff'; g.font = 'bold 16px sans-serif'; g.fillText('扫码支付', 30, 20); });
  makeSign(-18.0, 1.3, -14.3, 0.22, 0.28, -PI / 2, qr);
  S.box(-18.0, 1.05, -14.3, 0.04, 0.2, 0.04, '#ccc');
  S.ball(-17.8, 1.18, -16.0, 0.11, '#e0b04a', { smooth: true }); S.ball(-17.8, 1.35, -16.0, 0.08, '#e0b04a', { smooth: true });
  A.cook = { x: -24.5, z: -20.9, ry: 0 };
  A.cashier = { x: -16.85, z: -14.8, ry: -PI / 2 };
  A.queueSpots = [[-19.35, -14.75], [-19.35, -13.45], [-19.35, -12.15], [-19.35, -10.85]];
  // tables + seats
  const tables = [
    { id: 'window', x: -27.8, z: -10.0, seats: [{ x: -27.8, z: -10.95, yaw: PI }] },
    { id: 't2', x: -27.8, z: -14.6, seats: [{ x: -27.8, z: -13.65, yaw: 0, taken: false }, { x: -27.8, z: -15.55, yaw: PI, taken: true }] },
    { id: 't3', x: -24.0, z: -16.3, seats: [{ x: -24.0, z: -17.25, yaw: PI, taken: false }, { x: -24.0, z: -15.35, yaw: 0, taken: true }] },
    { id: 't4', x: -21.6, z: -11.6, seats: [{ x: -22.55, z: -11.6, yaw: -PI / 2 }] },
  ];
  G.noodleTables = tables;
  A.diners = [];
  for (const t of tables) {
    const wide = t.id === 't4';
    table(t.x, t.z, wide ? 0.8 : 1.2, wide ? 1.2 : 0.8, '#8b5e3c');
    S.cyl(t.x + 0.32, 0.76, t.z + 0.05, 0.07, 0.16, '#b3261e', { seg: 8 }); S.cyl(t.x + 0.32, 0.92, t.z + 0.05, 0.05, 0.05, '#d9a441', { seg: 8 });
    S.cyl(t.x + 0.48, 0.76, t.z + 0.05, 0.05, 0.18, '#3a2a1c', { seg: 8 });
    S.box(t.x - 0.4, 0.76, t.z, 0.12, 0.2, 0.08, '#c8a060');
    Inter.add({ id: 'chili_' + t.id, kind: 'chili', x: t.x + 0.32, y: 0.85, z: t.z + 0.05, r: 1.7, E: 'Add chili oil', table: t });
    for (const s of t.seats) {
      stool(s.x, s.z, '#b3261e');
      if (s.taken) { A.diners.push({ x: s.x, z: s.z, ry: s.yaw === 0 ? PI : 0, seated: true }); continue; }
      Inter.add({ id: 'seat_' + t.id, kind: 'seat', x: s.x, y: 0.5, z: s.z, r: 1.5, E: t.id === 'window' ? 'Sit by the window' : 'Sit', seat: { x: s.x, z: s.z, yaw: s.yaw, table: t } });
    }
  }
  A.diners.push({ x: -21.6, z: -10.65, ry: PI, seated: true });
  for (const [x, z] of [[-26, -12.5], [-20, -12.5], [-26, -18], [-20, -18]]) { LB.lantern(x, 3.6, z, 0.3, '#ffd9a0'); halo(x, 3.6, z, '#ffd090', 'M'); }
  addLight(-23, 3.4, -14.5, '#ffd6a0', 16, 16);
  // calendar poster & lucky character
  makeSign(-29.64, 2.2, -14, 0.9, 1.2, PI / 2, signTexture({ cn: '福', w: 128, h: 160, bg: '#c0281c', fg: '#ffd76a', serif: true }));
}
const MENU = [
  { id: 'beef', cn: '牛肉面', en: 'Beef Noodle Soup', price: 22 },
  { id: 'zhajiang', cn: '炸酱面', en: 'Zhajiang Noodles', price: 16 },
  { id: 'xlb', cn: '小笼包', en: 'Soup Dumplings', price: 14 },
  { id: 'cucumber', cn: '拍黄瓜', en: 'Smashed Cucumber', price: 8 },
  { id: 'pancake', cn: '葱油饼', en: 'Scallion Pancake', price: 6 },
  { id: 'soymilk', cn: '豆浆', en: 'Soy Milk', price: 3 },
];

/* ------------------------------------------------------------------ TEA HOUSE */
function buildTeaHouse() {
  const x0 = -73, x1 = -58, z0 = -54, z1 = -41.6;
  groundQuad('wood', x0 + 0.3, z0 + 0.3, x1 - 0.3, z1 - 0.3, 0.01, 2);
  const wallC = '#e8e0cf', woodC = '#4a2e1c';
  S.box((x0 + x1) / 2, 0, z0 + 0.15, x1 - x0, 4, 0.3, wallC); Col.add(x0, z0, x1, z0 + 0.3);
  S.box(x0 + 0.15, 0, (z0 + z1) / 2, 0.3, 4, z1 - z0, wallC); Col.add(x0, z0, x0 + 0.3, z1);
  S.box(x1 - 0.15, 0, (z0 + z1) / 2, 0.3, 4, z1 - z0, wallC); Col.add(x1 - 0.3, z0, x1, z1);
  // front (south) wall with lattice windows + door gap x in [-67.3,-64.7]
  for (const [a, b] of [[x0, -67.3], [-64.7, x1]]) {
    const cx = (a + b) / 2, w = b - a;
    S.box(cx, 0, z1 - 0.15, w, 0.9, 0.3, woodC); S.box(cx, 2.9, z1 - 0.15, w, 1.1, 0.3, woodC);
    S.box(cx, 0.9, z1 - 0.15, w, 2.0, 0.12, '#2a1a10');
    for (let x = a + 0.35; x < b; x += 0.35) S.box(x, 0.9, z1 - 0.08, 0.05, 2.0, 0.06, '#7a4a2a');
    for (let y = 1.2; y < 2.9; y += 0.4) S.box(cx, y, z1 - 0.08, w, 0.05, 0.06, '#7a4a2a');
    WN.box(cx, 0.95, z1 - 0.04, w - 0.2, 1.9, 0.02, '#ffc070');
    Col.add(a, z1 - 0.3, b, z1);
  }
  S.box(-66, 2.75, z1 - 0.15, 2.6, 1.25, 0.3, woodC);
  for (const x of [x0 + 0.2, -67.3, -64.7, x1 - 0.2]) S.box(x, 0, z1 + 0.05, 0.3, 4, 0.3, '#7b1d1d');
  // roof
  S.box((x0 + x1) / 2, 3.9, (z0 + z1) / 2, x1 - x0, 0.2, z1 - z0, '#5a3a24');
  S.prism((x0 + x1) / 2, 4.0, (z0 + z1) / 2, 14.6, 2.4, 16.4, PAL.roof, { ry: PI / 2 });
  const ts = signTexture({ cn: '清风茶馆', en: 'Clear Breeze Tea House', style: 'plaque', bg: '#2a1a10', fg: '#e8c068', w: 768, h: 192, serif: true });
  makeSign(-66, 3.45, z1 + 0.06, 4.4, 1.1, 0, ts);
  lantern(-68.0, 2.9, z1 + 0.5, 0.3); lantern(-64.0, 2.9, z1 + 0.5, 0.3);
  // interior
  for (let i = 0; i < 4; i++) { S.box(-65.5, 0.6 + i * 0.7, z0 + 0.5, 9, 0.06, 0.45, '#5a3a24'); for (let k = 0; k < 14; k++) S.cyl(-69.6 + k * 0.6 + sr(-0.1, 0.1), 0.66 + i * 0.7, z0 + 0.5, 0.11, sr(0.25, 0.4), spick(['#b3261e', '#2e8b57', '#d9a441', '#3b5b8a', '#6b4f3a', '#e8e0cf']), { seg: 8 }); }
  Col.add(-70.2, z0, -60.8, z0 + 0.8);
  const scroll = signTexture({ cn: '茶', en: '', vertical: true, bg: '#efe6cf', fg: '#1a1a1a', w: 160, h: 480, serif: true });
  makeSign(x0 + 0.32, 2.0, -48, 0.8, 2.4, PI / 2, scroll);
  const scroll2 = signTexture({ cn: '静心', vertical: true, bg: '#efe6cf', fg: '#1a1a1a', w: 160, h: 480, serif: true });
  makeSign(x1 - 0.32, 2.0, -48, 0.8, 2.4, -PI / 2, scroll2);
  // tea table + master + cushion
  S.box(-65.5, 0, -48.6, 1.8, 0.42, 1.0, '#5a3a24'); Col.box(-65.5, -48.6, 1.8, 1.0);
  S.ball(-65.7, 0.55, -48.75, 0.13, '#6b3a22', { smooth: true }); S.box(-65.52, 0.55, -48.75, 0.18, 0.04, 0.04, '#6b3a22');
  for (let i = 0; i < 3; i++) S.cyl(-65.0 + i * 0.18, 0.42, -48.3, 0.045, 0.06, '#f2efe6', { seg: 8 });
  S.cyl(-65.5, 0, -47.5, 0.35, 0.12, '#a8321f', { seg: 12 });
  A.teaMaster = { x: -65.5, z: -49.5, ry: 0 };
  A.teaCushion = { x: -65.5, z: -47.45, yaw: 0 };
  Inter.add({ id: 'tea_cushion', kind: 'seat', x: -65.5, y: 0.4, z: -47.45, r: 1.5, E: 'Sit on the cushion', seat: { x: -65.5, z: -47.45, yaw: 0, low: true } });
  Inter.add({ id: 'teacup', kind: 'tea', x: -65.0, y: 0.48, z: -48.3, r: 1.8, E: 'Sip the tea' });
  // side table with patrons
  S.box(-61.2, 0, -51.3, 1.4, 0.42, 0.9, '#5a3a24'); Col.box(-61.2, -51.3, 1.4, 0.9);
  A.teaPatrons = [{ x: -62.3, z: -51.3, ry: PI / 2, seated: true, low: true }, { x: -60.1, z: -51.3, ry: -PI / 2, seated: true, low: true }];
  // guzheng
  S.box(-70.6, 0, -46, 0.5, 0.55, 1.9, '#3a2416'); S.box(-70.6, 0.55, -46, 0.5, 0.06, 1.9, '#7a4a2a');
  for (let i = 0; i < 8; i++) S.box(-70.75 + i * 0.04, 0.62, -46, 0.008, 0.008, 1.8, '#e8e0cf', { ao: false });
  Col.box(-70.6, -46, 0.6, 2.0);
  pot(-59.2, -43, 0.9); pot(-71.9, -52.8, 1.1, '#e05a7a');
  for (const [x, z] of [[-69, -46], [-62, -46], [-65.5, -51.5]]) { LB.lantern(x, 3.3, z, 0.28, '#ffcf8a'); halo(x, 3.3, z, '#ffc070', 'M'); S.box(x, 3.5, z, 0.02, 0.4, 0.02, '#222'); }
  addLight(-65.5, 3.2, -47.5, '#ffcf96', 13, 14);
  steamEmitter(-65.0, 0.55, -48.3, 1.5, { spread: 0.05 });
}

/* ------------------------------------------------------------------ SECRET COURTYARD + PASSAGE */
function buildCourtyard() {
  groundQuad('stone', -44, -54, -30, -38.4, 0.005, 2);
  groundQuad('bricks', -30, -47.5, -16, -44.5, 0.005, 2);
  hutongBlock(-44, -80, -30, -54, { s: { doors: [7], windows: [3, 11] } }, { trees: 1 });
  hutongBlock(-30, -44.5, -16, -22, { n: { doors: [], windows: [4, 10] } }, {});
  hutongBlock(-30, -80, -16, -47.5, { s: { doors: [7], windows: [3, 11] } }, { trees: 2, treeKind: 'ginkgo' });
  // east wall with moon gate (opening z in [-47.5,-44.5])
  const wallC = '#8a8b88';
  S.box(-29.85, 0, -50.75, 0.3, 3.6, 6.5, wallC); Col.add(-30, -54, -29.7, -47.5);
  S.box(-29.85, 0, -41.45, 0.3, 3.6, 6.1, wallC); Col.add(-30, -44.5, -29.7, -38.4);
  S.box(-29.85, 3.0, -46, 0.3, 0.6, 3, wallC);
  S.prim(GEO.torus, -29.85, 1.7, -46, 3.4, 3.4, 3.4, '#e8e0cf', { center: true, ry: PI / 2 });
  // gate between the E-W alley and the courtyard: closed until you disobey
  S.box(-44, 2.7, -40, 0.5, 0.5, 3.6, '#5a3a24'); S.prism(-44, 3.2, -40, 1.6, 0.7, 3.8, PAL.roof);
  const mkDoor = (side) => {
    const g = new THREE.Group();
    const b = new Batch(); b.box(0, 0, side * -0.8, 0.12, 2.7, 1.6, '#7b1d1d'); b.box(0.08, 1.2, side * -1.3, 0.05, 0.12, 0.12, '#d9a441');
    const m = b.build(G.mat.solid); m.castShadow = true; g.add(m);
    g.position.set(-44, 0, -40 + side * 1.6); G.scene.add(g); return g;
  };
  G.cyGate = { left: mkDoor(1), right: mkDoor(-1), col: Col.add(-44.2, -41.6, -43.8, -38.4), open: 0, target: 0 };
  // courtyard features
  tree(-37, -47.5, 'persimmon', 1.3);
  propMesh((b) => { for (const [x, z] of [[-0.8, -0.5], [0.8, -0.5], [-0.8, 0.5], [0.8, 0.5]]) b.box(x, 0, z, 0.1, 1.6, 0.1, '#4a3426'); b.box(0, 1.6, 0, 2, 1.1, 1.3, '#8a6a4a'); b.prism(0, 2.7, 0, 1.4, 0.5, 2.2, '#5a3a24', { ry: PI / 2 }); for (let i = 0; i < 3; i++) b.box(-0.6 + i * 0.6, 1.9, 0.66, 0.3, 0.3, 0.02, '#1a1a1a'); }, -41, -51.6, 0, { kind: 'coop', col: [2.1, 1.4], movable: false });
  S.cyl(-36, 0, -42.2, 0.55, 0.75, '#9a968e', { seg: 8 }); Col.box(-36, -42.2, 1.1, 1.1);
  for (const [x, z] of [[-36.9, -41.5], [-35.1, -42.9]]) S.cyl(x, 0, z, 0.2, 0.45, '#9a968e', { seg: 6 });
  wire(-44, 3.3, -44, -30, 3.3, -50); for (let t = 0.15; t < 0.9; t += 0.15) S.box(lerp(-44, -30, t), 2.75, lerp(-44, -50, t), 0.45, 0.6, 0.03, spick(PAL.shirt), { ry: 0.4, ao: false });
  pot(-43.4, -43, 1, '#e05a7a'); pot(-30.6, -53.2, 1.1); pot(-43.3, -53.2, 0.9, '#f1c40f');
  bike(-31, -52.5, 0.2, '#333');
  A.erhu = { x: -32.6, z: -40.8, ry: -PI / 2 + 0.3, seated: true };
  S.box(-32.4, 0, -40.8, 0.4, 0.42, 0.4, '#6b4f3a');
  for (let i = 0; i < 3; i++) lantern(-40 + i * 4, 3.0, -38.8, 0.22);
}

/* ------------------------------------------------------------------ TEMPLE */
function buildTemple() {
  const red = '#8b2a20', tileY = '#d9a441', tileG = '#3f6b52';
  groundQuad('stone', -15.6, -52, 15.6, -30.4, 0.005, 2.5);
  groundQuad('stone', -2.5, -30.4, 2.5, -29, 0.006, 2.5);
  const wall = (x0, z0, x1, z1) => { S.box((x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, 4.2, z1 - z0, red, { aoMin: 0.8 }); S.prism((x0 + x1) / 2, 4.2, (z0 + z1) / 2, x1 - x0 > z1 - z0 ? 1.0 : x1 - x0 + 0.6, 0.6, x1 - x0 > z1 - z0 ? x1 - x0 + 0.6 : z1 - z0, '#4a4d52', { ry: x1 - x0 > z1 - z0 ? PI / 2 : 0 }); Col.add(x0, z0, x1, z1); };
  wall(-16, -30.4, -2.8, -30); wall(2.8, -30.4, 16, -30);
  wall(-16.4, -52, -16, -47.5); wall(-16.4, -44.5, -16, -30);
  S.box(-16.2, 3.0, -46, 0.4, 1.2, 3, red);
  S.prim(GEO.torus, -16.2, 1.7, -46, 3.4, 3.4, 3.4, '#e0b04a', { center: true, ry: PI / 2 });
  wall(16, -52, 16.4, -30);
  // gate building
  for (const x of [-4.2, -2.8, 2.8, 4.2]) for (const z of [-31.2, -29.2]) { S.cyl(x, 0, z, 0.22, 4.2, '#a8221a', { seg: 8 }); Col.box(x, z, 0.44, 0.44); }
  S.box(0, 4.2, -30.2, 9.4, 0.6, 2.6, '#7b1d1d');
  S.geo(hipRoofGeo(11, 4.4, 1.8), 0, 4.8, -30.2, tileG);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.box(sx * 5.4, 4.85, -30.2 + sz * 2.1, 0.5, 0.15, 0.5, tileG, { rz: sx * 0.5, rx: sz * -0.5 });
  const pl = signTexture({ cn: '静心寺', en: 'Temple of the Quiet Heart', style: 'plaque', bg: '#1d3557', fg: '#f2c14e', w: 768, h: 224, serif: true });
  makeSign(0, 3.75, -28.88, 3.4, 1.0, 0, pl);
  lantern(-2.0, 3.3, -28.8, 0.32); lantern(2.0, 3.3, -28.8, 0.32);
  // main hall
  S.box(0, 0, -57, 22, 0.9, 10, '#b5aea2'); Col.add(-11, -80, 11, -52);
  for (let i = 0; i < 4; i++) S.box(0, 0, -52.2 + i * 0.0 - i * 0.3, 6, 0.9 - i * 0.22, 0.6, '#b5aea2');
  S.box(0, 0.9, -57, 18, 4.4, 7, red);
  for (let x = -7.5; x <= 7.5; x += 3) { S.cyl(x, 0.9, -53.3, 0.25, 4.4, '#a8221a', { seg: 8 }); }
  for (let x = -6; x <= 6; x += 3) { S.box(x, 1.0, -53.48, 2.2, 3.4, 0.06, '#5a1e16'); for (let k = 0; k < 6; k++) S.box(x - 0.9 + k * 0.36, 1.1, -53.43, 0.04, 3.2, 0.04, '#d9a441'); WN.box(x, 1.1, -53.4, 2.0, 3.1, 0.02, '#ffb860'); }
  S.box(0, 5.3, -56.6, 19.4, 0.5, 8.4, '#7b1d1d');
  S.geo(hipRoofGeo(23, 11, 2.0), 0, 5.8, -56.6, tileY);
  S.box(0, 7.8, -56.6, 15, 1.4, 4.2, red);
  S.geo(hipRoofGeo(18, 7.5, 2.4), 0, 9.2, -56.6, tileY);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { S.box(sx * 11.3, 5.85, -56.6 + sz * 5.3, 0.7, 0.2, 0.7, tileY, { rz: sx * 0.6, rx: sz * -0.6 }); S.box(sx * 8.8, 9.25, -56.6 + sz * 3.6, 0.6, 0.18, 0.6, tileY, { rz: sx * 0.6, rx: sz * -0.6 }); }
  S.box(0, 11.5, -56.6, 9, 0.35, 0.35, '#c08a2a');
  const hp = signTexture({ cn: '大雄宝殿', en: 'Hall of Great Strength', style: 'plaque', bg: '#1d3557', fg: '#f2c14e', w: 512, h: 192, serif: true });
  makeSign(0, 5.0, -53.0, 3.2, 1.1, 0, hp);
  for (let x = -6; x <= 6; x += 4) { lantern(x, 4.6, -52.9, 0.35); }
  for (let i = -2; i <= 2; i++) S.cyl(i * 1.0, 0.9, -52.5, 0.28, 0.12, '#b8862e', { seg: 8 });
  // incense burner
  S.cyl(0, 0, -41, 0.9, 0.5, '#9a968e'); S.cyl(0, 0.5, -41, 0.75, 1.0, '#6b5a3a', { seg: 8 });
  S.cone(0, 1.5, -41, 0.95, 0.9, '#5a4a2e', { seg: 6 }); S.cyl(0, 2.4, -41, 0.15, 0.4, '#6b5a3a', { seg: 6 });
  Col.box(0, -41, 1.8, 1.8);
  steamEmitter(0, 1.6, -41, 2, { smoke: true, spread: 0.3 });
  for (let i = 0; i < 6; i++) LB.box(sr(-0.4, 0.4), 1.5, -41 + sr(-0.4, 0.4), 0.02, 0.3, 0.02, '#ff6a2a');
  // wishing tree with red ribbons
  tree(-8.5, -43, 'leaf', 1.7, { col: false });
  Col.box(-8.5, -43, 1.0, 1.0);
  G.ribbons = new ChunkedBatch(100);
  for (let i = 0; i < 70; i++) { const a = sr(0, TAU), r = sr(0.8, 2.6); LB.box(-8.5 + Math.cos(a) * r, sr(2.4, 4.2), -43 + Math.sin(a) * r, 0.06, sr(0.35, 0.7), 0.02, '#e3241c', { ry: sr(0, PI) }); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; S.box(-8.5 + Math.cos(a) * 1.9, 0, -43 + Math.sin(a) * 1.9, 0.12, 0.6, 0.12, '#7b1d1d'); }
  A.wishTree = new THREE.Vector3(-8.5, 1.4, -43);
  // bell pavilion
  for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) { S.cyl(9 + dx, 0, -43 + dz, 0.16, 3.6, '#a8221a', { seg: 8 }); Col.box(9 + dx, -43 + dz, 0.35, 0.35); }
  S.cone(9, 4.3, -43, 2.6, 1.6, tileG, { seg: 4, ry: PI / 4 });
  S.box(9, 3.5, -43, 3.2, 0.2, 3.2, '#7b1d1d');
  S.cyl(9, 1.6, -43, 0.55, 1.4, '#7a6a3a', { seg: 12 }); S.cone(9, 3.0, -43, 0.55, 0.3, '#7a6a3a', { seg: 12 });
  A.bell = new THREE.Vector3(9, 2.1, -43);
  // ginkgo trees + stone lanterns
  for (const [x, z] of [[-12.5, -34], [12.5, -34], [-13, -49.5], [13, -49.5]]) tree(x, z, 'ginkgo', 1.25);
  for (const z of [-34, -38, -46]) for (const x of [-3.2, 3.2]) { S.box(x, 0, z, 0.5, 0.9, 0.5, '#9a968e'); S.box(x, 0.9, z, 0.6, 0.45, 0.6, '#a8a297'); LB.box(x, 0.95, z, 0.3, 0.32, 0.62, '#ffcf8a'); S.cone(x, 1.35, z, 0.55, 0.4, '#8a857b', { seg: 4, ry: PI / 4 }); halo(x, 1.15, z, '#ffc070', 'S'); Col.box(x, z, 0.6, 0.6); }
  A.sweeper = { x: 2, z: -36, ry: 0 };
  A.templeVisitors = [{ x: -1.5, z: -50.8, ry: PI }, { x: 1.4, z: -51, ry: PI }];
  addLight(0, 4.5, -46, '#ffcc88', 10, 18, { night: true });
}

/* ------------------------------------------------------------------ PLAZA + NORTH SHOPS */
function buildPlazaAndShops() {
  groundQuad('stone', -10, -30, 10, -8, 0.004, 2.5);
  // paifang
  const tileG = '#3f6b52';
  for (const x of [-5.2, -2.0, 2.0, 5.2]) { S.box(x, 0, -14, 0.5, x === -2 || x === 2 ? 5.6 : 4.4, 0.5, '#a8221a'); S.box(x, 0, -14, 0.8, 0.5, 0.8, '#9a968e'); Col.box(x, -14, 0.8, 0.8); }
  S.box(0, 4.9, -14, 4.6, 0.5, 0.5, '#7b1d1d'); S.prism(0, 5.6, -14, 1.5, 0.9, 5.4, tileG, { ry: PI / 2 });
  for (const sx of [-1, 1]) { S.box(sx * 3.6, 3.8, -14, 3.6, 0.4, 0.45, '#7b1d1d'); S.prism(sx * 3.6, 4.2, -14, 1.3, 0.7, 4.1, tileG, { ry: PI / 2 }); }
  const pf = signTexture({ cn: '静心', en: 'Quiet Heart', style: 'plaque', bg: '#1d3557', fg: '#f2c14e', w: 384, h: 160, serif: true });
  makeSign(0, 4.5, -13.73, 2.4, 1.0, 0, pf); makeSign(0, 4.5, -14.27, 2.4, 1.0, PI, pf);
  for (const x of [-7.5, 7.5]) for (const z of [-20, -26]) tree(x, z, 'ginkgo', 1.0, { planter: true });
  bench(-7.6, -23, 0); bench(7.6, -23, 0);
  // convenience store
  bldg(-16, -30, -10, -8, 14, { faces: ['s', 'e'], color: '#d9d6cf', shop: { face: 's', cn: '便利店', en: '24H Convenience', bg: '#f7f7f7', fg: '#0f6db5', fg2: '#e2412f', awning: '#0f6db5', lit: '#eaf4ff' } });
  // neon shops
  bldg(10, -30, 18, -8, 22, { faces: ['s', 'w'], color: '#c5c9ce', shop: { face: 's', cn: '珍珠奶茶', en: 'Bubble Tea', neon: true, fg: '#ff5fa2', awning: '#ff7fb5', vertical: { cn: '网吧', en: 'NET', color: '#36e0ff', u: 7.2, y: 9 } } });
  bldg(18, -30, 27, -8, 30, { faces: ['s'], color: '#b9c0c4', shop: { face: 's', cn: '大药房', en: 'Pharmacy', neon: true, fg: '#3dff8a', awning: '#1e7a4a' } });
  for (let i = 0; i < 3; i++) { LB.box(22.5, 6.2, -7.7, 1.6, 0.5, 0.12, '#3dff8a'); LB.box(22.5, 5.65, -7.7, 0.5, 1.6, 0.12, '#3dff8a'); }
  halo(22.5, 6.4, -7.4, '#3dff8a', 'L'); streak(22.5, -7.0, '#3dff8a', 1.2, 7);
  bldg(27, -30, 36, -8, 18, { faces: ['s', 'e'], color: '#c9bfb3', shop: { face: 's', cn: '星光KTV', en: 'Starlight Karaoke', neon: true, fg: '#c77dff', awning: '#5a2a8a', vertical: { cn: 'KTV', color: '#ff4fa3', u: 1, y: 10 } } });
  bldg(16.4, -55, 36, -30, 42, { faces: ['s', 'e'], color: '#a7aeb5', litP: 0.45 });
  bldg(16.4, -80, 36, -55, 34, { faces: ['e'], color: '#b3aea6', litP: 0.45 });
  const big = signTexture({ cn: '霓虹城', en: 'NEON CITY', style: 'neon', fg: '#36e0ff', fg2: '#ff4fa3', w: 512, h: 192 });
  makeSign(26, 26, -29.9, 12, 4.5, 0, big, { neon: true, color: '#36e0ff', streak: false });
}

/* ------------------------------------------------------------------ PARK */
function buildPark() {
  // grass with a hole for the metro kiosk
  groundQuad('grass', 36, -80, 80, -26, 0, 3); groundQuad('grass', 36, -26, 67, -8, 0, 3); groundQuad('grass', 73, -26, 80, -8, 0, 3); groundQuad('grass', 67, -21.5, 73, -8, 0, 3);
  groundQuad('pavers', 48, -62, 52, -8, 0.01, 2);
  groundQuad('pavers', 38, -32, 78, -28, 0.012, 2);
  groundQuad('stone', 48, -38, 62, -24, 0.014, 2.5);
  groundQuad('pavers', 62, -27.5, 73, -26, 0.013, 2);
  // fence along the street with gate
  for (const [a, b] of [[36, 46], [54, 80]]) {
    S.box((a + b) / 2, 0, -8.3, b - a, 0.25, 0.25, '#7d8288');
    for (let x = a; x <= b; x += 0.5) S.box(x, 0, -8.3, 0.05, 1.1, 0.05, '#3d4147');
    S.box((a + b) / 2, 1.05, -8.3, b - a, 0.06, 0.06, '#3d4147');
    Col.add(a, -8.45, b, -8.15);
  }
  S.box(37.2, 0, -44, 0.25, 1.1, 72, '#3d4147'); Col.add(36, -80, 36.4, -8);
  for (const x of [45.5, 54.5]) { S.box(x, 0, -8.6, 1.0, 3.6, 1.0, '#a8a297'); Col.box(x, -8.6, 1.0, 1.0); LB.lantern(x, 3.9, -8.6, 0.3, '#ffe8b8'); halo(x, 3.9, -8.6, '#ffe0a0', 'M'); }
  const ps = signTexture({ cn: '人民公园', en: "People's Park", style: 'plaque', bg: '#2a4a2e', fg: '#f2e6c0', w: 512, h: 160, serif: true });
  S.box(50, 3.4, -8.6, 9, 0.5, 0.4, '#5a4a3a');
  makeSign(50, 4.25, -8.38, 4.2, 1.3, 0, ps); makeSign(50, 4.25, -8.82, 4.2, 1.3, PI, ps);
  // pond
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 28), G.ground.water);
  pond.rotation.x = -PI / 2; pond.scale.set(9, 6, 1); pond.position.set(63, 0.03, -55); pond.receiveShadow = true;
  pond.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * 4; });
  G.scene.add(pond); G.pond = pond;
  for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; S.box(63 + Math.cos(a) * 9.2, 0, -55 + Math.sin(a) * 6.2, 1.8, 0.3, 0.6, '#9a968e', { ry: -a + PI / 2 }); }
  Col.add(54.5, -60, 71.5, -50); Col.add(56, -61.5, 70, -48.5);
  // pavilion
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; const x = 44 + Math.cos(a) * 2.6, z = -52 + Math.sin(a) * 2.6; S.cyl(x, 0, z, 0.15, 3.0, '#a8221a', { seg: 6 }); Col.box(x, z, 0.35, 0.35); }
  S.cyl(44, 0, -52, 3.0, 0.3, '#a8a297', { seg: 6 });
  S.cone(44, 3.0, -52, 3.7, 2.0, '#3f6b52', { seg: 6 }); S.cyl(44, 2.95, -52, 3.1, 0.25, '#7b1d1d', { seg: 6 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; S.box(44 + Math.cos(a) * 3.6, 3.05, -52 + Math.sin(a) * 3.6, 0.5, 0.12, 0.25, '#3f6b52', { ry: -a, rz: 0.5 }); }
  lantern(44, 2.4, -52, 0.3);
  // trees
  const trees = [[40, -14, 'maple'], [43, -26, 'leaf'], [40, -36, 'ginkgo'], [42, -44, 'leaf'], [39, -60, 'maple'], [44, -68, 'pine'], [52, -72, 'leaf'], [60, -70, 'ginkgo'], [70, -70, 'maple'], [76, -60, 'leaf'], [76, -44, 'pine'], [72, -38, 'maple'], [76, -14, 'leaf'], [64, -14, 'ginkgo'], [58, -18, 'maple'], [66, -40, 'leaf'], [56, -44, 'willow'], [70, -47, 'willow'], [72, -63, 'willow'], [56, -64, 'willow'], [44, -36, 'maple']];
  for (const [x, z, k] of trees) tree(x, z, k, sr(1.0, 1.35));
  bench(47, -20, PI / 2); bench(47, -40, PI / 2); bench(53, -46, PI / 2); bench(60, -27, 0); bench(42, -29, 0);
  for (const [x, z] of [[47.6, -16], [52.4, -36], [47.6, -56], [60, -31.8], [70, -31.8], [42, -31.8]]) { S.cyl(x, 0, z, 0.07, 3.4, '#2d3136'); LB.ball(x, 3.55, z, 0.22, '#fff0d0', { smooth: true }); halo(x, 3.55, z, '#ffe6b0', 'M'); Col.box(x, z, 0.25, 0.25); }
  // water calligraphy on the path
  const wc = canvasTex(512, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(30,26,22,0.75)'; g.font = `bold 96px ${FONT_SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('上善若水', w / 2, h / 2); });
  const cal = makeSign(49.8, 0.03, -21, 3.6, 0.9, 0, wc, { transparent: true }); cal.mesh.rotation.set(-PI / 2, 0, PI / 2);
  A.calligrapher = { x: 48.6, z: -18.6, ry: PI };
  // tai chi
  A.taichiLead = { x: 55, z: -36, ry: 0 };
  A.taichi = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) A.taichi.push({ x: 51.5 + c * 3.2 + r * 0.8, z: -32 + r * 3.0, ry: PI });
  const tc = signTexture({ cn: '太极广场', en: 'Tai Chi Square', bg: '#2a4a2e', fg: '#f2e6c0', w: 384, h: 128 });
  makeSign(62.3, 1.6, -31, 1.6, 0.53, -PI / 2, tc); S.box(62.4, 0, -31, 0.08, 1.4, 0.08, '#444');
  A.parkKids = [[50, -50], [50, -14]];
  A.parkCouple = [{ x: 47.25, z: -40.4, ry: PI / 2, seated: true }, { x: 47.25, z: -39.6, ry: PI / 2, seated: true }];
}

/* ------------------------------------------------------------------ METRO KIOSKS */
function buildKiosk(id, cx, cz, cn, en) {
  const w = 6, d = 4.5, x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const frame = '#3d4a57';
  // side + back walls (glass with frames)
  for (const x of [x0, x1]) { S.box(x, 0, cz, 0.15, 2.9, d, frame); glassB.box(x, 0.3, cz, 0.06, 2.4, d - 0.2, '#9fc4d8'); Col.add(x - 0.15, z0, x + 0.15, z1); }
  S.box(cx, 0, z1, w, 2.9, 0.15, frame); Col.add(x0, z1 - 0.15, x1, z1 + 0.1);
  S.box(cx, 2.9, cz, w + 0.6, 0.3, d + 0.6, '#2f3a45');
  S.box(cx, 0, z0 + 0.1, 0.12, 2.9, 0.12, frame);
  // stairs going down
  for (let i = 0; i < 8; i++) S.box(cx, -0.25 - i * 0.28, z0 + 0.6 + i * 0.42, w - 0.4, 0.28, 0.42, '#8f949a');
  S.box(cx, -3, cz + 0.5, w - 0.3, 3, d - 0.4, '#1a1c20');
  LB.box(cx, 2.75, cz, w - 1, 0.06, 0.3, '#eaf4ff'); halo(cx, 2.6, cz, '#dfefff', 'M');
  const mt = signTexture({ cn: cn, en: en, bg: '#f4f6f8', fg: '#0d4fa3', fg2: '#3a3a3a', w: 512, h: 128 });
  makeSign(cx, 3.45, z0 - 0.32, 4.6, 1.15, PI, mt); makeSign(cx, 3.45, z0 - 0.33, 4.6, 1.15, 0, mt).mesh.position.z = z0 - 0.27;
  S.box(cx, 2.95, z0 - 0.3, 4.8, 1.0, 0.1, '#2f3a45');
  const logo = canvasTex(128, 128, (g) => { g.fillStyle = '#d7262e'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = `bold 70px ${FONT_EN}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('M', 64, 68); });
  makeSign(x0 - 0.05, 2.3, z0 + 0.4, 0.8, 0.8, PI, logo); halo(x0 - 0.05, 2.3, z0 - 0.2, '#ff5050', 'M');
  // closed shutter (dynamic collider) when the metro is not part of the walk
  const shutter = Col.add(x0, z0 - 0.15, x1, z0 + 0.15);
  const sm = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 2.6, 0.06), new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.5, metalness: 0.6 }));
  sm.position.set(cx, 1.3, z0 + 0.05); G.scene.add(sm);
  G.kiosks = G.kiosks || {};
  G.kiosks[id] = { id, cx, cz, z0, shutter, shutterMesh: sm, cn, en, exit: { x: cx, z: z0 - 1.6, yaw: 0 } };
  Zones.rect('kiosk_' + id, x0 + 0.3, z0 + 0.4, x1 - 0.3, z1 - 0.3, { kiosk: id });
}
function setKiosksOpen(open) {
  for (const k of Object.values(G.kiosks)) { k.shutter.on = !open; k.shutterMesh.visible = !open; }
}

/* ------------------------------------------------------------------ SKYLINE */
function buildSkyline() {
  for (const side of [-1, 1]) for (let x = 82; x < 135; x += sr(8, 14)) {
    const sx = side * x, w = sr(7, 12);
    bldg(sx - w / 2, -24, sx + w / 2, -8.5, sr(18, 45), { faces: ['s'], collide: false, litP: 0.4, roof: false });
    bldg(sx - w / 2, 8.5, sx + w / 2, 24, sr(14, 40), { faces: ['n'], collide: false, litP: 0.4, roof: false });
  }
  for (let i = 0; i < 46; i++) {
    const a = i / 46 * TAU + sr(-0.05, 0.05), r = sr(115, 170);
    const x = Math.cos(a) * r, z = Math.sin(a) * r, w = sr(10, 22), h = sr(35, 110);
    S.box(x, 0, z, w, h, sr(10, 22), spick(['#8e96a3', '#9aa1a8', '#7f8894', '#a39d95']), { aoMin: 0.8 });
    if (SR() < 0.5) { LB.box(x, h + 0.2, z, 0.5, 0.5, 0.5, '#ff2a2a'); halo(x, h + 0.5, z, '#ff3a3a', 'L'); }
    for (let k = 0; k < 10; k++) WN.box(x + sr(-w / 2, w / 2), sr(4, h - 4), z, 1.2, 1.4, sr(10, 22) + 0.1, spick(LIT));
  }
}

/* ------------------------------------------------------------------ ZONES */
function defineZones() {
  Zones.rect('lane', -4.5, 8, 4.5, 60.5, { cn: '幸福里', en: 'Happiness Lane', prio: 2 });
  Zones.rect('lane_exit', -4.5, 7.5, 4.5, 11.5);
  Zones.circle('home_door', 0, 59.0, 1.9);
  Zones.rect('street', -130, -8, 130, 8, { cn: '霓虹路', en: 'Neon Road', prio: 1 });
  Zones.rect('road', -130, -4.5, 130, 4.5);
  Zones.rect('north_walk', -130, -8.6, 130, -4.5);
  Zones.rect('south_walk', -130, 4.5, 130, 8.6);
  Zones.rect('noodle', -29.7, -21.7, -16.3, -8.3, { cn: '老王面馆', en: "Old Wang's Noodles", prio: 5, place: 'the noodle restaurant' });
  Zones.rect('noodle_queue', -20.5, -14.0, -18.5, -8.4);
  Zones.rect('noodle_front', -21.0, -16.5, -18.45, -13.95);
  Zones.rect('hutong', -51.6, -41.6, -48.4, -8.6, { cn: '杨柳胡同', en: 'Willow Hutong', prio: 3, group: 'hutong', place: 'the hutong' });
  Zones.rect('hutong_ew', -73, -41.6, -44, -38.4, { cn: '杨柳胡同', en: 'Willow Hutong', prio: 3, group: 'hutong', place: 'the hutong' });
  Zones.rect('hutong_west', -73, -41.6, -53.8, -38.4);
  Zones.rect('hutong_east', -47.2, -41.6, -44, -38.4);
  Zones.rect('courtyard', -44, -54, -29.7, -38.4, { cn: '鸽子院', en: 'Pigeon Courtyard', prio: 4, group: 'hutong', place: 'the pigeon courtyard' });
  Zones.rect('passage', -29.7, -47.5, -16.4, -44.5, { cn: '月亮门小巷', en: 'Moon Gate Passage', prio: 3, group: 'hutong' });
  Zones.rect('teahouse', -72.7, -53.7, -58.3, -41.9, { cn: '清风茶馆', en: 'Clear Breeze Tea House', prio: 5, place: 'the tea house' });
  Zones.rect('temple', -15.6, -52, 15.6, -30.4, { cn: '静心寺', en: 'Temple of the Quiet Heart', prio: 4, place: 'the temple' });
  Zones.rect('plaza', -10, -30, 10, -8.6, { cn: '寺前广场', en: 'Temple Plaza', prio: 3, place: 'the temple plaza' });
  Zones.rect('park', 36, -80, 80, -8.45, { cn: '人民公园', en: "People's Park", prio: 3, place: 'the park' });
  Zones.rect('taichi', 47.5, -38.5, 62.5, -24, { cn: '太极广场', en: 'Tai Chi Square', prio: 4 });
  Zones.rect('market', -79, 8.6, -43, 41, { cn: '东门菜市场', en: 'East Gate Wet Market', prio: 4, place: 'the wet market' });
  Zones.rect('nightmarket', 43.5, 8.6, 56.5, 50, { cn: '美食夜市', en: 'Night Food Market', prio: 4, place: 'the night market' });
}
