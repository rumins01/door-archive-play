// 장면 배경입니다. 방 설계서의 scene 값으로 벽 또는 하늘, 바닥, 배경 요소를 조합해 그립니다.
// 그림체는 18시 기준판과 같습니다. 평면 그라데이션과 얇은 선만 쓰고, 움직임과 질감 타일은 쓰지 않습니다.
import { R, C, E, P, L, poly, r } from './escape-props.js?v=escape-9';

export const FLOOR = 368;
const grad = (id, [a, b], attrs = 'x2="0" y2="1"') => `<linearGradient id="${id}" ${attrs}><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
// 정해진 씨앗으로 같은 그림을 늘 같게 그립니다.
const seeded = seed => { let x = seed * 9301 + 49297; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); };
const sum = s => [...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0);

export const WALLS = {
  plaster: ['#33302a', '#1c1a16'], wallpaper: ['#35302c', '#1d1a17'], wood: ['#3a2c1e', '#1f170f'], brick: ['#3a2a24', '#1e1512'],
  stone: ['#34322e', '#1a1917'], log: ['#3e2e1e', '#21180f'], tile: ['#2f3532', '#181c1a'], steel: ['#2b3133', '#15191a'],
  concrete: ['#323232', '#191919'], shoji: ['#3a362c', '#1e1b16'], marble: ['#3a3732', '#1e1c19'], sandstone: ['#43382a', '#221c14'],
  curtain: ['#3a1e1c', '#1c0f0e'], paper: ['#3b3730', '#1f1c18'], hull: ['#3b2b1e', '#1f160f'], padded: ['#2e2a33', '#17151a'],
};
export const SKIES = {
  night: ['#0f1420', '#232b3a'], dawn: ['#1c1f2c', '#4a3a36'], dusk: ['#1a1a26', '#3e2e30'], polar: ['#0c1416', '#1d2c30'],
  storm: ['#1c1e20', '#33363a'], water: ['#0d2026', '#1d3a42'], space: ['#07080b', '#14161c'], fog: ['#22262a', '#3a3e40'],
};
export const GROUNDS = {
  planks: ['#4b3a27', '#1e160d'], checker: ['#3a3a36', '#1a1a18'], stone: ['#3a3732', '#181715'], carpet: ['#3e2422', '#1c100f'],
  tatami: ['#4a4430', '#201d14'], grate: ['#2f3332', '#141716'], concrete: ['#383836', '#181817'], marble: ['#45423c', '#1f1e1b'],
  deck: ['#4a3826', '#1f170e'], grass: ['#26301f', '#11160e'], snow: ['#454a4c', '#25292b'], sand: ['#4a4232', '#211d15'],
  seabed: ['#2e3430', '#121614'], roof: ['#2f2f30', '#151516'], platform: ['#3a3a38', '#1a1a19'], dirt: ['#3a3024', '#191510'],
};

// 창이나 문틈으로 보이는 바깥입니다. 사각형 안에만 그립니다.
function outside(u, kind, x, y, w, h) {
  const sky = SKIES[kind === 'snow' || kind === 'forest' || kind === 'city' || kind === 'sea' ? 'night' : kind] ?? SKIES.night;
  let s = grad(`${u}-o${r(x)}${r(y)}`, sky) + R(x, y, w, h, `url(#${u}-o${r(x)}${r(y)})`);
  const rnd = seeded(sum(kind) + x);
  if (['night', 'snow', 'forest', 'city', 'sea', 'polar', 'space'].includes(kind)) for (let i = 0; i < 6; i++) s += C(x + 6 + rnd() * (w - 12), y + 6 + rnd() * h * .45, .9 + rnd(), '#cfd6dc', 'opacity=".55"');
  if (kind === 'snow') s += poly([[x, y + h], [x, y + h * .7], [x + w * .35, y + h * .58], [x + w * .7, y + h * .72], [x + w, y + h * .62], [x + w, y + h]], '#59606a', 'opacity=".9"');
  if (kind === 'sea') s += R(x, y + h * .62, w, h * .38, '#16303a') + L(x + 4, y + h * .7, x + w - 4, y + h * .7, '#5a7a84', 1, 'opacity=".5"');
  if (kind === 'city') for (let i = 0; i < 5; i++) { const bw = w / 5, bh = h * (.25 + rnd() * .4); s += R(x + i * bw, y + h - bh, bw - 2, bh, '#141820') + C(x + i * bw + bw / 2, y + h - bh + 8, 1.6, '#b39a5e', 'opacity=".7"'); }
  if (kind === 'forest') for (let i = 0; i < 4; i++) s += poly([[x + i * w / 4, y + h], [x + i * w / 4 + w / 8, y + h * .45], [x + (i + 1) * w / 4, y + h]], '#16201a');
  if (kind === 'dawn' || kind === 'dusk') s += E(x + w * .7, y + h * .85, w * .2, h * .1, '#7a5a44', 'opacity=".55"');
  if (kind === 'water') for (let i = 0; i < 3; i++) s += C(x + w * (.25 + i * .25), y + h * (.75 - i * .2), 2 + i, 'none', 'stroke="#7fa0a8" stroke-width="1" opacity=".5"');
  return s;
}
const colX = c => ({ L: 70, C: 180, R: 290 })[c] ?? 180;

// 배경 요소입니다. 'window:L'처럼 이름 뒤에 칸이나 값을 붙입니다.
const FEAT = {
  window: (u, sc, a = 'C') => { const x = colX(a) - 48, y = 64, w = 96, h = 104; return R(x - 8, y - 8, w + 16, h + 16, '#2a1f15') + outside(u, sc.out ?? 'night', x, y, w, h) + L(x + w / 2, y, x + w / 2, y + h, '#2a1f15', 5) + L(x, y + h / 2, x + w, y + h / 2, '#2a1f15', 5); },
  band: (u, sc) => { let s = R(0, 70, 360, 108, '#1b1712') + outside(u, sc.out ?? 'snow', 6, 80, 348, 88); for (let x = 6; x <= 354; x += 87) s += R(x - 4, 74, 8, 100, '#2f251a'); return s + R(0, 178, 360, 10, '#2f251a'); },
  porthole: (u, sc, a = 'C') => { const x = colX(a), id = `${u}-port-${x}`; return `<clipPath id="${id}">${C(x, 104, 28, '#fff')}</clipPath>` + C(x, 104, 38, '#4a3f2e') + C(x, 104, 30, '#1a1712') + `<g clip-path="url(#${id})">${outside(u, sc.out ?? 'sea', x - 30, 74, 60, 60)}</g>` + C(x, 104, 30, 'none', 'stroke="#6b5a3e" stroke-width="5"') + [0, 1, 2, 3, 4, 5].map(i => C(x + Math.cos(i * 1.047) * 34, 104 + Math.sin(i * 1.047) * 34, 2.2, '#8a7650')).join(''); },
  columns: () => [26, 334].map(x => R(x - 18, 30, 36, FLOOR - 30, '#3e3a33') + R(x - 24, 22, 48, 14, '#4a453c') + R(x - 24, FLOOR - 16, 48, 16, '#4a453c') + [-9, 0, 9].map(d => L(x + d, 40, x + d, FLOOR - 20, '#000', 1.5, 'opacity=".25"')).join('')).join(''),
  rafters: () => poly([[0, 0], [180, 0], [0, 150]], '#120d09', 'opacity=".55"') + poly([[360, 0], [180, 0], [360, 150]], '#120d09', 'opacity=".55"') + L(0, 150, 180, 0, '#4a3826', 10) + L(360, 150, 180, 0, '#4a3826', 10) + L(60, 100, 300, 100, '#3a2b1d', 7),
  beams: () => [24, 120].map(y => R(0, y, 360, 14, '#3a2b1d') + R(0, y + 14, 360, 4, '#000', 'opacity=".3"')).join(''),
  dome: (u) => { let s = P('M0 210Q180 -60 360 210V0H0Z', '#0b0e14') + R(150, 0, 60, 200, '#141c2c'); for (let i = 0; i < 10; i++) s += C(158 + (i * 37) % 44, 10 + (i * 53) % 180, 1.2, '#d6dbe0', 'opacity=".7"'); return s + [60, 120, 240, 300].map(x => P(`M${x} 210Q180 ${x < 180 ? -40 : -40} ${360 - x} 210`, 'none', 'stroke="#2f343c" stroke-width="3" opacity=".7"')).join('') + R(146, 0, 4, 200, '#3a4049') + R(210, 0, 4, 200, '#3a4049'); },
  skyline: (u, sc) => { const rnd = seeded(31), H = sc.horizon ?? 300; let s = ''; for (let x = 0; x < 360; x += 30 + Math.floor(rnd() * 14)) { const h = 50 + rnd() * 110, w = 26 + rnd() * 16; s += R(x, H - h, w, h, '#12161d'); for (let k = 0; k < 4; k++) if (rnd() > .55) s += R(x + 5 + (k % 2) * 10, H - h + 10 + Math.floor(k / 2) * 18, 5, 7, '#9c8550', 'opacity=".55"'); } return s; },
  mountains: (u, sc) => { const H = sc.horizon ?? 300; return poly([[0, H], [0, H - 70], [70, H - 140], [140, H - 60], [220, H - 160], [300, H - 80], [360, H - 120], [360, H]], '#1d242b') + poly([[200, H - 145], [220, H - 160], [242, H - 140], [230, H - 136], [218, H - 146]], '#5a6066', 'opacity=".7"') + poly([[0, H], [0, H - 30], [120, H - 70], [250, H - 30], [360, H - 50], [360, H]], '#161b20'); },
  trees: (u, sc) => { const H = sc.horizon ?? 300, rnd = seeded(7); let s = ''; for (let i = 0; i < 9; i++) { const x = i * 42 + rnd() * 16, h = 90 + rnd() * 90; s += R(x - 3, H - 30, 6, 30, '#120f0b') + poly([[x - 26, H - 24], [x, H - h], [x + 26, H - 24]], i % 2 ? '#17211a' : '#1b261e'); } return s; },
  sea: (u, sc) => { const H = sc.horizon ?? 300; let s = R(0, H - 60, 360, 60, '#13262e'); for (let i = 0; i < 5; i++) s += L(10 + i * 70, H - 46 + (i % 2) * 18, 50 + i * 70, H - 46 + (i % 2) * 18, '#4f6e78', 1.5, 'opacity=".45"'); return s; },
  pier: (u, sc) => { const H = sc.horizon ?? 300; let s = R(0, H - 48, 360, 48, '#173039') + poly([[120, H - 44], [240, H - 44], [290, H], [70, H]], '#5a422b') + [100, 260].map(x => R(x - 4, H - 38, 8, 38, '#372718')).join(''); for (let i = 0; i < 4; i++) { const y = H - 40 + i * 12, d = (y - H + 44) * 1.15; s += L(120 - d, y, 240 + d, y, '#2d2014', 2); } return s + L(114, H - 72, 76, H - 26, '#755738', 3) + L(246, H - 72, 284, H - 26, '#755738', 3) + [114, 76, 246, 284].map((x, i) => L(x, H - (i % 2 ? 26 : 72), x, H - (i % 2 ? 2 : 44), '#755738', 3)).join(''); },
  tracks: () => { let s = poly([[150, FLOOR], [210, FLOOR], [340, 480], [20, 480]], '#1a1814'); for (let i = 0; i < 6; i++) { const y = FLOOR + 6 + i * i * 3.4, k = (y - FLOOR) / 112; s += L(150 - 130 * k, y, 210 + 130 * k, y, '#3a2c1e', 3 + i); } return s + L(166, FLOOR, 60, 480, '#6b6f70', 3) + L(194, FLOOR, 300, 480, '#6b6f70', 3); },
  railing: () => { let s = R(0, 286, 360, 6, '#3a3f42'); for (let x = 10; x < 360; x += 28) s += R(x, 292, 4, 76, '#2e3336'); return s + R(0, 330, 360, 3, '#2e3336'); },
  fence: () => { let s = R(0, 200, 360, 4, '#4a5050'); for (let x = -164; x < 524; x += 24) s += L(x, 204, x + 164, FLOOR, '#414747', 1, 'opacity=".65"') + L(x, 204, x - 164, FLOOR, '#414747', 1, 'opacity=".65"'); return s + R(0, FLOOR - 4, 360, 4, '#3a3f42') + [10, 180, 350].map(x => R(x - 3, 196, 6, FLOOR - 196, '#4a5050')).join(''); },
  lattice: (u, sc) => { const H = sc.horizon ?? 300; let s = poly([[150, H], [170, 20], [190, 20], [210, H]], 'none', 'stroke="#2e3438" stroke-width="5"'); for (let y = 40; y < H; y += 36) { const k = (y - 20) / (H - 20), a = 170 - 20 * k, b = 190 + 20 * k; s += L(a, y, b, y + 36, '#2e3438', 2) + L(b, y, a, y + 36, '#2e3438', 2); } return s + C(180, 18, 5, '#7a3a2e'); },
  proscenium: () => R(0, 0, 360, 40, '#4a2420') + P('M0 0H70Q40 200 60 368H0Z', '#5a2a24') + P('M360 0H290Q320 200 300 368H360Z', '#5a2a24') + R(0, 36, 360, 8, '#8a7040', 'opacity=".7"') + [20, 40, 320, 340].map(x => L(x, 44, x + (x < 180 ? 14 : -14), 360, '#3a1a16', 3, 'opacity=".6"')).join(''),
  seats: () => { let s = ''; for (let row = 0; row < 3; row++) for (let x = -10 + row * 12; x < 370; x += 34) s += P(`M${x} ${FLOOR + 20 + row * 34}q14 -22 28 0v14h-28Z`, row ? '#2a1414' : '#331816'); return s; },
  blackboard: () => R(40, 70, 280, 150, '#4a3826') + R(48, 78, 264, 134, '#1d2a24') + L(60, 120, 120, 118, '#8a9488', 2, 'opacity=".35"') + L(70, 150, 160, 152, '#8a9488', 2, 'opacity=".3"') + R(60, 212, 240, 8, '#3a2b1d'),
  shelves: () => { let s = ''; for (const y of [90, 170, 250]) { s += R(0, y, 360, 6, '#2e2116'); for (let x = 4; x < 356; x += 9 + ((x * 7) % 5)) s += R(x, y - 34 + ((x * 3) % 10), 7, 34 - ((x * 3) % 10), ['#3a2f24', '#2f3329', '#3a2626', '#2c3036'][(x / 9 | 0) % 4]); } return s; },
  pipes: () => R(0, 18, 360, 12, '#3e4542') + R(0, 36, 360, 8, '#353b38') + R(330, 18, 12, 350, '#3e4542') + [60, 180, 300].map(x => R(x - 4, 14, 8, 20, '#59605a')).join(''),
  lanterns: () => { let s = L(0, 30, 360, 50, '#3a2b1d', 2); for (let i = 0; i < 6; i++) { const x = 30 + i * 60, y = 30 + i * 3.3; s += L(x, y, x, y + 14, '#3a2b1d', 1.5) + E(x, y + 30, 13, 17, '#6a3226') + R(x - 9, y + 12, 18, 4, '#2a1f15') + R(x - 9, y + 46, 18, 4, '#2a1f15') + L(x - 12, y + 30, x + 12, y + 30, '#4a2018', 1, 'opacity=".6"'); } return s; },
  bunting: () => { let s = P('M0 40Q180 90 360 40', 'none', 'stroke="#3a2b1d" stroke-width="1.5"'); for (let i = 0; i < 10; i++) { const x = 18 + i * 36, y = 40 + 50 * Math.sin((i + .5) / 10 * Math.PI) * .8; s += poly([[x - 9, y], [x + 9, y], [x, y + 18]], ['#5a2a24', '#3d4a52', '#5c5034'][i % 3]); } return s; },
  skeleton: () => { const ink = '#8a806c'; let s = P('M30 294Q55 224 115 196T230 180Q280 166 307 115', 'none', `stroke="${ink}" stroke-width="5" stroke-linecap="round" opacity=".6"`); for (let i = 0; i < 8; i++) { const x = 112 + i * 15, y = 196 - i * 2; s += E(x, y, 4, 5, ink, 'opacity=".65"') + P(`M${x} ${y + 4}q-12 24 5 40`, 'none', `stroke="${ink}" stroke-width="2.5" opacity=".65"`); } for (let i = 0; i < 5; i++) s += E(267 + i * 8, 161 - i * 10, 4, 3, ink, `transform="rotate(-50 ${267 + i * 8} ${161 - i * 10})" opacity=".7"`); for (const x of [130, 220]) s += C(x, 228, 7, ink, 'opacity=".6"') + L(x, 229, x - 8, 268, ink, 4, 'opacity=".65"') + C(x - 8, 268, 4, ink) + L(x - 8, 268, x - 2, 306, ink, 3, 'opacity=".65"') + L(x - 6, 306, x + 13, 306, ink, 3); return s + P('M300 112L305 95L337 97L345 108L319 118Z', ink, 'opacity=".7"') + C(312, 103, 4, '#24211b') + L(319, 116, 340, 112, '#2b2720', 2); },
  glyphband: () => { let s = R(0, 50, 360, 40, '#3a2f20'); for (let i = 0; i < 9; i++) { const x = 20 + i * 40; s += P(`M${x - 20} 74q10 -10 20 0t20 0`, 'none', 'stroke="#7a6a48" stroke-width="2"') + P(`M${x - 6} 64q6 -8 12 0`, 'none', 'stroke="#7a6a48" stroke-width="1.5" opacity=".7"'); } return s + L(0, 56, 360, 56, '#7a6a48', 1.5, 'opacity=".6"') + L(0, 84, 360, 84, '#7a6a48', 1.5, 'opacity=".6"'); },
  kelp: () => { let s = ''; for (let i = 0; i < 6; i++) { const x = 20 + i * 64; s += P(`M${x} ${FLOOR}q-14 -60 4 -120q12 -50 -6 -110`, 'none', `stroke="${i % 2 ? '#1f3a2a' : '#23402e'}" stroke-width="7" stroke-linecap="round"`); } for (let i = 0; i < 8; i++) s += C(40 + i * 41, 60 + (i * 67) % 220, 2 + (i % 3), 'none', 'stroke="#6f9298" stroke-width="1" opacity=".45"'); return s; },
  shafts: () => [60, 170, 280].map((x, i) => poly([[x - 12, 0], [x + 12, 0], [x + 50 - i * 10, FLOOR], [x - 10 - i * 10, FLOOR]], '#7fa4ab', 'opacity=".06"')).join(''),
  moon: () => C(280, 70, 26, '#b9bca8', 'opacity=".75"') + C(272, 64, 5, '#9a9d8c', 'opacity=".6"') + C(290, 80, 3.5, '#9a9d8c', 'opacity=".6"'),
  earth: () => C(80, 80, 30, '#25404a') + P('M62 70q10 -14 24 -6t6 18q-12 8 -24 2Z', '#3a5a40', 'opacity=".8"') + C(80, 80, 30, 'none', 'stroke="#5a7a84" stroke-width="2" opacity=".5"'),
  aurora: () => P('M0 120Q90 60 180 110T360 80V130Q270 160 180 140T0 170Z', '#2f5a4a', 'opacity=".35"') + P('M0 90Q120 40 240 90T360 60V90Q250 120 140 100T0 120Z', '#3a4a6a', 'opacity=".25"'),
  drift: () => P(`M0 ${FLOOR - 6}Q60 ${FLOOR - 30} 120 ${FLOOR - 8}T240 ${FLOOR - 14}T360 ${FLOOR - 4}V${FLOOR + 10}H0Z`, '#555b5f'),
  snowfall: () => { const rnd = seeded(5); let s = ''; for (let i = 0; i < 40; i++) s += C(rnd() * 360, rnd() * 300, .9 + rnd() * 1.4, '#cfd6dc', 'opacity=".45"'); return s; },
  rain: () => { let s = ''; for (let i = 0; i < 30; i++) { const x = (i * 47) % 380, y = (i * 83) % 300; s += L(x, y, x - 8, y + 22, '#7a8a94', 1, 'opacity=".25"'); } return s; },
  bulbs: () => { let s = R(30, 40, 300, 10, '#3a2b1d'); for (let x = 40; x <= 320; x += 28) s += C(x, 45, 7, '#c9b47a', 'opacity=".55"'); return s; },
  corridor: () => { let s = poly([[0, 0], [130, 150], [130, 290], [0, 480]], '#1e1b17') + poly([[360, 0], [230, 150], [230, 290], [360, 480]], '#1e1b17') + R(130, 150, 100, 140, '#121010') + poly([[0, 0], [360, 0], [230, 150], [130, 150]], '#151310'); for (const k of [.3, .6]) { const x = 130 * k, y0 = 150 * k, y1 = 480 - 190 * k; s += R(x + 6, y0 + 40, 26 * (1 - k * .5), (y1 - y0) * .5, '#2a2017', 'opacity=".9"'); s += R(360 - x - 32 * (1 - k * .5), y0 + 40, 26 * (1 - k * .5), (y1 - y0) * .5, '#2a2017', 'opacity=".9"'); } return s + R(170, 190, 20, 80, '#3a2b1d'); },
  graves: (u, sc) => { const H = sc.horizon ?? 300; return [[40, 26], [110, 20], [250, 24], [320, 18]].map(([x, h]) => P(`M${x - 12} ${H}V${H - h}Q${x} ${H - h - 14} ${x + 12} ${H - h}V${H}Z`, '#2a2e2c') + L(x - 5, H - h + 6, x + 5, H - h + 6, '#3e4442', 2)).join(''); },
  consoles: () => { let s = R(0, 200, 360, 60, '#1d2224'); for (let x = 10; x < 360; x += 70) s += R(x, 90, 60, 44, '#0f1416') + R(x + 4, 94, 52, 36, '#1f3a30', 'opacity=".8"') + L(x + 8, 112, x + 48, 104, '#5f8a6a', 1.5, 'opacity=".7"'); return s; },
  lasers: () => [[0, 120, 360, 260], [0, 280, 360, 140], [60, 0, 300, 368]].map(([a, b, c, d]) => L(a, b, c, d, '#8e3b30', 1.5, 'opacity=".5"')).join(''),
  rigging: () => { let s = ''; for (const x of [40, 110, 250, 320]) s += L(x, 0, x, 160 + (x % 50), '#4a4036', 2) + R(x - 9, 160 + (x % 50), 18, 26, '#3a3026', 'rx="4"'); return s + R(0, 26, 360, 8, '#2e2a26'); },
  stands: () => [60, 130, 230, 300].map(x => L(x, FLOOR, x, 290, '#2a2a2a', 3) + poly([[x - 20, 270], [x + 20, 270], [x + 16, 296], [x - 16, 296]], '#2a2a2a')).join(''),
  clouds: () => [[70, 70, 50], [250, 50, 64], [180, 110, 40]].map(([x, y, w]) => E(x, y, w, w * .28, '#3a404a', 'opacity=".55"')).join(''),
  lamppost: (u, sc, a = 'R') => { const x = colX(a); return C(x, 117, 26, `url(#${u}-glow)`, 'opacity=".3"') + R(x - 3, 133, 6, FLOOR - 133, '#353b3d') + R(x - 9, FLOOR - 10, 18, 10, '#353b3d') + poly([[x - 12, 100], [x + 12, 100], [x + 9, 132], [x - 9, 132]], '#b7a477', 'stroke="#25292b" stroke-width="3"') + L(x, 103, x, 130, '#353b3d', 2) + poly([[x - 16, 100], [x, 89], [x + 16, 100]], '#353b3d'); },
  arch: () => P('M110 368V170Q180 80 250 170V368', 'none', 'stroke="#4a453c" stroke-width="16"'),
  shojiwall: () => { let s = R(0, 50, 360, 280, '#4a463c', 'opacity=".55"'); for (let x = 0; x <= 360; x += 45) s += R(x - 2, 50, 4, 280, '#2a2117'); for (let y = 50; y <= 330; y += 56) s += R(0, y - 2, 360, 4, '#2a2117'); return s; },
  crates: () => [[0, 270, 70, 98], [64, 300, 60, 68], [300, 250, 60, 118]].map(([x, y, w, h]) => R(x, y, w, h, '#2b2118') + L(x + 4, y + h - 4, x + w - 4, y + 4, '#1a130d', 3)).join(''),
  stairs: (u, sc, a = 'L') => { let s = ''; for (let i = 0; i < 7; i++) { const w = 20 + i * 15, y = 200 + i * 24, x = a === 'L' ? 0 : 360 - w; s += R(x, y, w, FLOOR - y, '#302b24') + R(x, y, w, 5, '#565047') + L(x, y + 23, x + w, y + 23, '#1b1814', 1.5); } return s; },
  catwalk: () => { let s = R(0, 300, 360, 12, '#2e3336'); for (let x = 0; x < 360; x += 24) s += L(x, 300, x + 12, 312, '#1a1d1f', 2); return s + R(0, 250, 360, 4, '#3a3f42') + [20, 180, 340].map(x => R(x - 2, 250, 4, 50, '#3a3f42')).join(''); },
  bunks: () => [10, 132].map(x => L(x, 100, x, FLOOR, '#6a4e32', 5)).join('') + [[12, 120], [12, 240]].map(([x, y]) => R(x, y, 118, 22, '#49404c', 'rx="4"') + E(x + 23, y, 17, 5, '#b3ac99') + R(x - 2, y + 22, 122, 8, '#5a412b')).join('') + [165, 201, 237, 273, 309, 345].map(y => L(105, y, 127, y, '#7a5e3f', 3)).join('') + L(105, 144, 105, FLOOR, '#5a412b', 3),
  hearth: () => P('M90 368V170H270V368', '#2e2a26') + R(80, 150, 200, 24, '#3a342e') + R(120, 230, 120, 138, '#120f0c') + [140, 180, 220].map(x => L(x, 174, x, 205, '#3a3530', 2) + E(x, 214, 13, 10, '#2f2c28')).join(''),
};

// 바닥 위의 결입니다.
function ground(u, kind, top) {
  const id = `${u}-sg`;
  let s = grad(id, GROUNDS[kind] ?? GROUNDS.planks) + R(0, top, 360, 480 - top, `url(#${id})`);
  const h = 480 - top;
  if (['planks', 'deck', 'tatami'].includes(kind)) for (let i = 0; i < 6; i++) s += L(-40 + i * 90, 480, 40 + i * 60, top + 3, '#000', 1.5, 'opacity=".25"');
  if (kind === 'tatami') s += L(0, top + h * .45, 360, top + h * .45, '#2a2618', 3, 'opacity=".6"');
  if (['checker', 'marble', 'stone', 'concrete', 'platform', 'grate'].includes(kind)) for (let i = 1; i < 4; i++) s += L(0, top + h * i / 4 * (i / 3), 360, top + h * i / 4 * (i / 3), '#000', 1, 'opacity=".25"');
  if (kind === 'checker') { const ys = [top, top + h * .1, top + h * .28, top + h * .57, 480]; for (let j = 0; j < 4; j++) for (let i = -4; i < 5; i++) if ((i + j) % 2 === 0) { const w0 = 26 + (ys[j] - top) * .35, w1 = 26 + (ys[j + 1] - top) * .35; s += poly([[180 + i * w0, ys[j]], [180 + (i + 1) * w0, ys[j]], [180 + (i + 1) * w1, ys[j + 1]], [180 + i * w1, ys[j + 1]]], '#66655a', 'opacity=".3"'); } }
  if (kind === 'grate') for (let i = -3; i <= 8; i++) s += L(180 + (i - 3) * 19, top, 180 + (i - 3) * 66, 480, '#6d7770', 2, 'opacity=".24"');
  if (kind === 'roof') for (let y = top + 8, i = 0; y < 480; y += 20, i++) { s += L(0, y, 360, y, '#090a0b', 2); for (let x = (i % 2) * 26; x < 360; x += 52) s += L(x, y, x, y + 20, '#56575a', 1, 'opacity=".22"'); }
  if (kind === 'carpet') s += R(30, top + 8, 300, h - 8, 'none', 'stroke="#6a4a2a" stroke-width="3" opacity=".5"');
  if (kind === 'platform') s += R(0, top + 4, 360, 5, '#7a6a3a', 'opacity=".7"');
  if (['snow', 'sand', 'seabed', 'grass', 'dirt'].includes(kind)) s += P(`M0 ${top + 4}Q90 ${top - 4} 180 ${top + 3}T360 ${top + 2}`, 'none', 'stroke="#fff" stroke-width="1" opacity=".08"');
  if (kind === 'seabed') s += [40, 150, 300].map(x => E(x, top + 30, 20, 8, '#3a403a')).join('');
  return s;
}
function featureLayer(u, sc, list) {
  return list.map(f => { const [name, arg] = f.split(':'); return FEAT[name]?.(u, sc, arg) ?? ''; }).join('');
}

// 벽 시점 배경입니다. 실내는 벽과 바닥, 바깥은 하늘과 땅을 그립니다.
export function sceneView(u, sc, vi) {
  const key = 'NESW'[vi] ?? 'N';
  const list = [...(sc.all ?? []), ...(sc[key] ?? [])];
  const behind = list.filter(f => !['seats', 'tracks', 'drift', 'railing', 'snowfall', 'rain', 'kelp', 'shafts', 'crates', 'stands'].includes(f.split(':')[0]));
  const front = list.filter(f => !behind.includes(f));
  let s;
  if (sc.sky) {
    const H = sc.horizon ?? 300;
    s = grad(`${u}-sw`, SKIES[sc.sky] ?? SKIES.night) + R(0, 0, 360, 480, `url(#${u}-sw)`);
    if (['night', 'polar', 'space'].includes(sc.sky)) { const rnd = seeded(sum(sc.sky) + vi); for (let i = 0; i < 22; i++) s += C(rnd() * 360, rnd() * (H - 60), .7 + rnd() * 1.1, '#d6dbe0', `opacity="${(.3 + rnd() * .4).toFixed(2)}"`); }
    if (sc.sky === 'dawn' || sc.sky === 'dusk') s += C(sc.sky === 'dawn' ? 85 : 276, H - (sc.sky === 'dawn' ? 150 : 130), 24, '#a68c70', 'opacity=".45"');
    s += featureLayer(u, sc, behind);
    if (sc.sky === 'fog') s += R(0, 0, 360, H, '#a4aaa7', 'opacity=".12"') + P(`M0 ${H - 75}Q90 ${H - 100} 180 ${H - 70}T360 ${H - 82}V${H}H0Z`, '#919c99', 'opacity=".13"');
    s += sc.sky === 'water' && !sc.ground ? '' : ground(u, sc.ground ?? (sc.sky === 'space' ? 'grate' : 'dirt'), sc.ground === 'seabed' ? FLOOR - 10 : H);
  } else {
    s = grad(`${u}-sw`, WALLS[sc.wall] ?? WALLS.plaster) + R(0, 0, 360, FLOOR, `url(#${u}-sw)`) + wallMarks(sc.wall) + featureLayer(u, sc, behind) + ground(u, sc.ground ?? 'planks', FLOOR) + R(0, FLOOR - 6, 360, 9, '#140f09');
  }
  const clip = `${u}-scene-clip`;
  return `<clipPath id="${clip}">${R(0, 0, 360, 480, '#fff')}</clipPath><g clip-path="url(#${clip})">${s}${featureLayer(u, sc, front)}</g>`;
}
function wallMarks(kind) {
  let s = '';
  if (kind === 'plaster') for (let x = 12; x < 360; x += 24) s += L(x, 0, x, FLOOR - 4, '#fff', 1, 'opacity=".025"');
  if (kind === 'wallpaper') { for (let x = 0; x < 360; x += 18) s += R(x, 0, 6, FLOOR - 90, '#fff', 'opacity=".03"'); s += R(0, FLOOR - 90, 360, 84, '#2e2318') + L(0, FLOOR - 90, 360, FLOOR - 90, '#4a3826', 4); }
  if (kind === 'wood' || kind === 'hull') for (let x = 0; x < 360; x += 30) s += L(x, 0, x, FLOOR, '#000', 1.5, 'opacity=".28"');
  if (kind === 'hull') for (let y = 40; y < FLOOR; y += 46) s += P(`M0 ${y}Q180 ${y - 16} 360 ${y}`, 'none', 'stroke="#000" stroke-width="1.5" opacity=".25"');
  if (kind === 'brick') for (let y = 30, k = 0; y < FLOOR - 6; y += 18, k++) { s += L(0, y, 360, y, '#000', 1, 'opacity=".2"'); for (let x = (k % 2) * 22; x < 360; x += 44) s += L(x, y, x, y + 18, '#000', 1, 'opacity=".14"'); }
  if (kind === 'stone' || kind === 'sandstone') for (let y = 0, k = 0; y < FLOOR; y += 52, k++) { s += L(0, y, 360, y, '#000', 2, 'opacity=".25"'); for (let x = (k % 2) * 50; x < 360; x += 100) s += L(x, y, x, y + 52, '#000', 2, 'opacity=".22"'); }
  if (kind === 'log') for (let y = 0; y < FLOOR; y += 32) s += R(0, y + 2, 360, 28, '#4a3826', 'rx="14" opacity=".35"') + C(8, y + 16, 12, '#5a4632', 'opacity=".5"') + C(352, y + 16, 12, '#5a4632', 'opacity=".5"');
  if (kind === 'tile') { for (let y = 0; y < FLOOR; y += 30) s += L(0, y, 360, y, '#000', 1, 'opacity=".22"'); for (let x = 0; x < 360; x += 30) s += L(x, 0, x, FLOOR, '#000', 1, 'opacity=".18"'); }
  if (kind === 'steel') for (let y = 0; y < FLOOR; y += 92) { s += L(0, y, 360, y, '#000', 2, 'opacity=".35"'); for (let x = 10; x < 360; x += 40) s += C(x, y + 8, 2, '#5a6266', 'opacity=".6"'); }
  if (kind === 'concrete') for (const [x, y] of [[0, 120], [0, 240], [120, 0], [240, 0]]) s += x ? L(x, 0, x, FLOOR, '#000', 1.5, 'opacity=".2"') : L(0, y, 360, y, '#000', 1.5, 'opacity=".2"');
  if (kind === 'shoji') { for (let x = 0; x <= 360; x += 40) s += R(x - 2, 0, 4, FLOOR, '#2a2117'); for (let y = 0; y <= FLOOR; y += 46) s += R(0, y - 2, 360, 4, '#2a2117'); }
  if (kind === 'marble') s += P('M0 80Q90 120 160 60T360 100', 'none', 'stroke="#fff" stroke-width="1" opacity=".06"') + P('M0 240Q120 200 240 260T360 220', 'none', 'stroke="#fff" stroke-width="1" opacity=".05"');
  if (kind === 'curtain') for (let x = 0; x < 360; x += 24) s += L(x, 0, x + 4, FLOOR, '#000', 6, 'opacity=".22"');
  if (kind === 'paper') for (let i = 0; i < 8; i++) s += poly([[i * 45, 0], [i * 45 + 45, 0], [i * 45 + 22, 120]], '#fff', 'opacity=".03"') + poly([[i * 45 + 22, 120], [i * 45 + 67, 120], [i * 45 + 45, 260]], '#000', 'opacity=".08"');
  if (kind === 'padded') for (let y = 20; y < FLOOR; y += 60) for (let x = 20; x < 360; x += 60) s += R(x - 26, y - 26, 52, 52, '#fff', 'rx="8" opacity=".03"');
  return s;
}
// 확대 화면 바탕입니다. 장면의 벽이나 하늘 색을 어둡게 깔아 같은 장소로 읽히게 합니다.
export function sceneZoom(u, sc, tone) {
  const pair = sc.sky ? SKIES[sc.sky] ?? SKIES.night : WALLS[sc.wall] ?? WALLS.plaster;
  const fill = tone === 'dark' ? '#121512' : `url(#${u}-sz)`;
  return grad(`${u}-sz`, pair) + R(0, 0, 360, 480, fill) + R(0, 0, 360, 480, '#000', 'opacity=".28"');
}
export const SCENE_FEATURES = Object.keys(FEAT);
