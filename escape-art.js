// 방탈출 장면과 아이템 그림입니다. 상태를 받아 SVG 문자열만 돌려주므로 브라우저, 앱, 테스트에서 같이 씁니다.
// 그림체 기준은 2026-10-04 18시 공개판(사서의 방)입니다. 그라데이션과 평면 그림자만 쓰고, 질감 타일과 늘 흐르는 움직임은 쓰지 않습니다.
import { check, cleanInput, freshState, lockControls, lockIn, lockReady, SEQUENCE_LOCKS, VIEW_W, VIEW_H } from './escape-engine.js?v=escape-10';
import { PROPS, ITEM_ART, MUTED } from './escape-props.js?v=escape-10';
import { LOCK_FORMS, STAR_POINTS } from './escape-locks.js?v=escape-10';
import { ICONS, icon } from './escape-icons.js?v=escape-10';
import { sceneView, sceneZoom } from './escape-scenes.js?v=escape-10';
import { clueMark } from './escape-clues.js?v=escape-10';

import { COLORS, COLOR_NAMES, DIRECTION_NAMES, SYMBOL_NAMES } from './escape-names.js?v=escape-10';
export { COLORS, COLOR_NAMES, DIRECTION_NAMES, SYMBOL_NAMES };
// 색을 구분하기 어려운 사람도 같은 색을 찾을 수 있게 색마다 무늬를 함께 씁니다.
const PATTERN = { red: 'dots', blue: 'lines', green: 'diag', yellow: null };
const NUM_FONT = 'font-family="Georgia, \'Times New Roman\', serif"';
const MONO_FONT = 'font-family="ui-monospace, SFMono-Regular, Menlo, monospace"';
// 방마다 벽과 바닥 색만 조금 다르게 씁니다. 사서의 방은 18시 공개판 색 그대로입니다.
const PALETTE = {
  library: { wall: ['#2f3829', '#1a2119'], floor: ['#4b3a27', '#1e160d'] },
  darkroom: { wall: ['#2b3130', '#171b1a'], floor: ['#3a3128', '#18130e'] },
  pressroom: { wall: ['#3a332c', '#1e1a16'], floor: ['#45362a', '#1c150f'] },
  // 생성 방(kit)의 분위기 색입니다. 모두 채도와 명도를 낮게 둡니다.
  parlor: { wall: ['#33302a', '#1c1a16'], floor: ['#4b3a27', '#1e160d'] },
  sea: { wall: ['#28343a', '#151c20'], floor: ['#3a3a34', '#18170f'] },
  steel: { wall: ['#2c3133', '#16191a'], floor: ['#34332f', '#151412'] },
  snow: { wall: ['#2f3538', '#181c1e'], floor: ['#4a3a2a', '#1e160e'] },
  garden: { wall: ['#2e3528', '#181d15'], floor: ['#3e3424', '#19140c'] },
  museum: { wall: ['#3a3630', '#1d1b18'], floor: ['#4a3d2c', '#1f170f'] },
  train: { wall: ['#3a2a28', '#1d1514'], floor: ['#3c3026', '#18120d'] },
  tower: { wall: ['#353330', '#1a1918'], floor: ['#3e3a33', '#191714'] },
  stage: { wall: ['#3a2624', '#1c1312'], floor: ['#3a2c22', '#17110c'] },
  night: { wall: ['#262a36', '#13151c'], floor: ['#2f2c2a', '#131210'] },
  bakery: { wall: ['#3b3329', '#1e1a14'], floor: ['#4a3826', '#1e160d'] },
  paper: { wall: ['#3a352b', '#1d1a15'], floor: ['#45372a', '#1c150f'] },
};

let seq = 0;
const R = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const C = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const E = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const P = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const L = (x1, y1, x2, y2, stroke, w = 1, extra = '') => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${stroke}" stroke-width="${w}" fill="none" ${extra}/>`;
const T = (x, y, text, size, fill, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="middle" dominant-baseline="central" ${extra}>${text}</text>`;
const pol = (cx, cy, len, deg) => [cx + len * Math.sin(deg * Math.PI / 180), cy - len * Math.cos(deg * Math.PI / 180)];

function defs(u, pal = PALETTE.library) {
  const lin = (id, stops, attrs = 'x2="0" y2="1"') => `<linearGradient id="${u}-${id}" ${attrs}>${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  return `<defs>
    ${lin('wall', [[0, pal.wall[0]], [1, pal.wall[1]]])}
    ${lin('floor', [[0, pal.floor[0]], [1, pal.floor[1]]])}
    ${lin('wood', [[0, '#76583a'], [.5, '#55402a'], [1, '#3a2b1b']])}
    ${lin('woodl', [[0, '#93714a'], [1, '#634a30']])}
    ${lin('brass', [[0, '#6e5a36'], [.45, '#e2c588'], [.6, '#a98c55'], [1, '#5f4c2c']], 'x2="1" y2="1"')}
    ${lin('steel', [[0, '#5b6661'], [.5, '#3c4542'], [1, '#262d2a']], 'x2="1" y2="1"')}
    ${lin('paper', [[0, '#efe5cc'], [1, '#cdbf9b']])}
    ${lin('night', [[0, '#0d1822'], [1, '#253c4c']])}
    ${lin('shade', [[0, '#3f6b4a'], [1, '#1f3d29']])}
    ${lin('film', [[0, '#1b1a18'], [1, '#2c2a26']])}
    ${lin('hall', [[0, '#f6d999'], [1, '#8a6a3a']])}
    ${lin('neg', [[0, '#8a5a2e'], [1, '#5a3618']])}
    ${lin('ray', [[0, '#f3d38c', .28], [1, '#f3d38c', 0]])}
    <radialGradient id="${u}-glow"><stop offset="0" stop-color="#ffd98f" stop-opacity=".75"/><stop offset=".5" stop-color="#ffcf7a" stop-opacity=".22"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
    <radialGradient id="${u}-sh"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="${u}-vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#050806" stop-opacity="0"/><stop offset="1" stop-color="#050806" stop-opacity=".62"/></radialGradient>
    <pattern id="${u}-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.5" fill="#fff" fill-opacity=".5"/></pattern>
    <pattern id="${u}-lines" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="2.2" fill="#fff" fill-opacity=".42"/></pattern>
    <pattern id="${u}-diag" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.2" height="7" fill="#fff" fill-opacity=".42"/></pattern>
  </defs>`;
}

function shape(kind, x, y, s, fill, extra = '') {
  if (kind === 'circle') return C(x, y, s, fill, extra);
  if (kind === 'square') return R(x - s * .9, y - s * .9, s * 1.8, s * 1.8, fill, extra);
  if (kind === 'triangle') return P(`M${x} ${y - s * 1.1}L${x + s * 1.1} ${y + s * .85}L${x - s * 1.1} ${y + s * .85}Z`, fill, extra);
  return P(`M${x} ${y - s * 1.25}L${x + s} ${y}L${x} ${y + s * 1.25}L${x - s} ${y}Z`, fill, extra);
}
function swatch(u, color, draw) {
  const base = draw(COLORS[color] ?? color);
  return PATTERN[color] ? base + draw(`url(#${u}-${PATTERN[color]})`) : base;
}
function arrow(dir, x, y, s, fill, extra = '') {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir] ?? 0;
  return `<path d="M0 ${-s}L${s * .9} ${s * .05}H${s * .34}V${s}H${-s * .34}V${s * .05}H${-s * .9}Z" fill="${fill}" transform="translate(${x} ${y}) rotate(${rot})" ${extra}/>`;
}
function spine(u, x, y, w, h, color, mark = null) {
  let out = swatch(u, color, fill => R(x, y, w, h, fill, 'rx="2"'));
  out += R(x, y + h * .07, w, h * .035, '#000', 'opacity=".28"') + R(x, y + h * .88, w, h * .035, '#000', 'opacity=".28"') + R(x + w * .12, y, w * .1, h, '#fff', 'opacity=".07"');
  if (mark) {
    const s = Math.min(w * .26, 12);
    out += C(x + w / 2, y + h * .46, s * 1.75, '#f0e5c6') + shape(mark, x + w / 2, y + h * .46, s, '#2a2118');
  }
  return out;
}
const TONES = ['#5d4330', '#3f4a3c', '#6b3b2e', '#4a4038', '#2f3a40', '#77603d', '#523629'];
function filler(u, x0, x1, base, maxH, seed) {
  let out = '', x = x0, i = seed;
  while (x < x1 - 7) {
    const w = Math.min(10 + ((i * 7) % 9), x1 - x);
    const h = maxH - ((i * 13) % 22);
    out += spine(u, x, base - h, w, h, TONES[i % TONES.length]);
    x += w + 1.5; i++;
  }
  return out;
}
// part: 'body'는 판에 굽는 시계 몸체와 눈금, 'face'는 코드로 덧그리는 숫자와 바늘(정답 단서)입니다.
function clockFace(u, cx, cy, Rr, numerals, part = 'all') {
  const body = part !== 'face', face = part !== 'body';
  let out = '';
  if (body) out += C(cx, cy + Rr * .04, Rr * 1.02, '#000', 'opacity=".35"') + C(cx, cy, Rr, `url(#${u}-brass)`) + C(cx, cy, Rr * .9, '#2a221a') + C(cx, cy, Rr * .85, `url(#${u}-paper)`);
  if (body) for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0;
    if (!big && !numerals) continue;
    const [x1, y1] = pol(cx, cy, Rr * (big ? .7 : .76), i * 6), [x2, y2] = pol(cx, cy, Rr * .8, i * 6);
    out += L(x1.toFixed(1), y1.toFixed(1), x2.toFixed(1), y2.toFixed(1), '#3a2f22', big ? Rr * .035 : Rr * .012);
  }
  if (!face) return out;
  if (numerals) for (let n = 1; n <= 12; n++) { const [x, y] = pol(cx, cy, Rr * .56, n * 30); out += T(x.toFixed(1), y.toFixed(1), n, Rr * .15, '#3a2f22', NUM_FONT); }
  const [hx, hy] = pol(cx, cy, Rr * .42, 290), [mx, my] = pol(cx, cy, Rr * .66, 240);
  out += L(cx, cy, hx.toFixed(1), hy.toFixed(1), '#1d1812', Rr * .08, 'stroke-linecap="round"') + L(cx, cy, mx.toFixed(1), my.toFixed(1), '#1d1812', Rr * .05, 'stroke-linecap="round"') + C(cx, cy, Rr * .07, `url(#${u}-brass)`);
  out += P(`M${cx - Rr * .55} ${cy - Rr * .6}L${cx - Rr * .12} ${cy - Rr * .14}L${cx + Rr * .04} ${cy - Rr * .3}L${cx + Rr * .5} ${cy + Rr * .22}`, 'none', `stroke="#fff" stroke-opacity=".6" stroke-width="${Math.max(1, Rr * .014)}"`);
  out += P(`M${cx - Rr * .7} ${cy - Rr * .2}A${Rr * .75} ${Rr * .75} 0 0 1 ${cx - Rr * .1} ${cy - Rr * .74}`, 'none', `stroke="#fff" stroke-opacity=".18" stroke-width="${Rr * .06}" stroke-linecap="round"`);
  return out;
}
function alarmIcon(x, y, s, color) {
  return C(x, y, s, 'none', `stroke="${color}" stroke-width="${s * .18}"`) + C(x - s * .75, y - s * .85, s * .38, color) + C(x + s * .75, y - s * .85, s * .38, color)
    + L(x, y, x, y - s * .55, color, s * .14) + L(x, y, x + s * .4, y, color, s * .14) + L(x - s * .6, y + s * .8, x - s * .85, y + s * 1.15, color, s * .16) + L(x + s * .6, y + s * .8, x + s * .85, y + s * 1.15, color, s * .16);
}
function bookIcon(x, y, s, color) {
  return P(`M${x} ${y - s * .55}Q${x - s * .5} ${y - s * .8} ${x - s} ${y - s * .6}V${y + s * .6}Q${x - s * .5} ${y + s * .4} ${x} ${y + s * .65}Q${x + s * .5} ${y + s * .4} ${x + s} ${y + s * .6}V${y - s * .6}Q${x + s * .5} ${y - s * .8} ${x} ${y - s * .55}Z`, 'none', `stroke="${color}" stroke-width="${s * .12}" stroke-linejoin="round"`)
    + L(x, y - s * .55, x, y + s * .65, color, s * .1);
}
function filmStrip(u, x, y, w, h, holes = true, cut = null, fill = null) {
  let out = R(x, y, w, h, fill ?? `url(#${u}-film)`, 'rx="2"');
  if (holes) {
    const n = Math.max(2, Math.floor(w / 12));
    for (let i = 0; i < n; i++) {
      const hx = x + 4 + i * ((w - 8) / n);
      out += R(hx, y + 3, (w - 8) / n * .55, h * .12, '#8d877a', 'rx="1"') + R(hx, y + h - 3 - h * .12, (w - 8) / n * .55, h * .12, '#8d877a', 'rx="1"');
    }
  }
  if (cut === 'right') out += P(`M${x + w - 6} ${y}L${x + w} ${y + h * .25}L${x + w - 7} ${y + h * .5}L${x + w} ${y + h * .75}L${x + w - 5} ${y + h}H${x + w + 2}V${y}Z`, '#0e100e');
  if (cut === 'left') out += P(`M${x + 6} ${y}L${x} ${y + h * .25}L${x + 7} ${y + h * .5}L${x} ${y + h * .75}L${x + 5} ${y + h}H${x - 2}V${y}Z`, '#0e100e');
  return out;
}
function filmIcon(x, y, w, h, color) {
  let out = R(x - w / 2, y - h / 2, w, h, 'none', `stroke="${color}" stroke-width="2.5" rx="2"`);
  for (let i = 0; i < 4; i++) out += R(x - w / 2 + 6 + i * (w - 12) / 4, y - h / 2 + 4, 5, 4, color) + R(x - w / 2 + 6 + i * (w - 12) / 4, y + h / 2 - 8, 5, 4, color);
  return out + R(x - w * .22, y - h * .18, w * .44, h * .36, 'none', `stroke="${color}" stroke-width="2"`);
}
function screw(x, y, s) {
  return C(x, y, s, '#a7a99f', 'stroke="#2a2e2b" stroke-width="2"') + L(x - s * .6, y - s * .6, x + s * .6, y + s * .6, '#2a2e2b', s * .22) + L(x - s * .6, y + s * .6, x + s * .6, y - s * .6, '#2a2e2b', s * .22);
}
function bulbArt(x, y, s, lit, u) {
  return (lit ? C(x, y, s * 2.4, `url(#${u}-glow)`) : '') + C(x, y, s, lit ? '#fff3c4' : '#e9eef0', `fill-opacity="${lit ? 1 : .55}" stroke="#d9dccf" stroke-width="2"`)
    + P(`M${x - s * .3} ${y + s * .2}Q${x} ${y - s * .4} ${x + s * .3} ${y + s * .2}`, 'none', `stroke="${lit ? '#c9892c' : '#8a8d84'}" stroke-width="${s * .1}"`)
    + R(x - s * .45, y + s * .85, s * .9, s * .55, '#a7a99f', 'rx="2"') + L(x - s * .45, y + s * 1.05, x + s * .45, y + s * 1.05, '#5f625b', 2) + L(x - s * .45, y + s * 1.25, x + s * .45, y + s * 1.25, '#5f625b', 2);
}
function bundle(u, x, y, w, h, key) {
  let out = R(x + 6, y + 8, w, h, '#000', 'opacity=".35" rx="3"');
  for (let i = 0; i < 4; i++) out += R(x + i * 2, y + i * 3, w - 4, h - 8, i === 3 ? `url(#${u}-paper)` : '#cdbf9b', 'rx="2" stroke="#8d7c5a" stroke-width="1"');
  out += R(x + 6, y + 9 + h * .25, w - 14, 3, '#6d604a', 'opacity=".6"') + R(x + 6, y + 9 + h * .4, w * .6, 3, '#6d604a', 'opacity=".6"') + R(x + 6, y + 9 + h * .55, w * .7, 3, '#6d604a', 'opacity=".6"');
  out += R(x + w / 2 - 4, y, 8, h, '#9e3b30') + R(x, y + h / 2 - 4, w, 8, '#9e3b30');
  if (key) out += `<g transform="translate(${x + w * .62} ${y + h * .62}) rotate(-25)">${keyArt(0, 0, w * .2, u)}</g>`;
  return out;
}
function keyArt(x, y, s, u) {
  return C(x - s * 1.1, y, s * .7, 'none', `stroke="url(#${u}-brass)" stroke-width="${s * .34}"`) + R(x - s * .45, y - s * .16, s * 2.2, s * .32, `url(#${u}-brass)`)
    + R(x + s * 1.2, y + s * .1, s * .26, s * .6, `url(#${u}-brass)`) + R(x + s * 1.65, y + s * .1, s * .26, s * .45, `url(#${u}-brass)`);
}
function handleArt(x, y, s, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">${R(-s * 1.6, -s * .42, s * 2.6, s * .84, '#d8a93a', `rx="${s * .4}" stroke="#7a5a18" stroke-width="2"`)}${[-1, -.5, 0, .5].map(k => L(-s * .9 + k * s * .5 + s * .5, -s * .36, -s * .9 + k * s * .5 + s * .5, s * .36, '#9b7322', 2)).join('')}${R(s * 1, -s * .2, s * .5, s * .4, '#6a6d66')}${C(-s * 1.25, 0, s * .14, '#7a5a18')}</g>`;
}
function bladeArt(x, y, s, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">${R(-s * .2, -s * .18, s * 2.2, s * .36, '#b9bcb4', 'stroke="#55594f" stroke-width="1.5"')}${P(`M${s * 2} ${-s * .18}L${s * 2.45} ${-s * .08}V${s * .08}L${s * 2} ${s * .18}Z`, '#d9dbd3', 'stroke="#55594f" stroke-width="1.5"')}${R(-s * .55, -s * .3, s * .4, s * .6, '#7b7f77', 'stroke="#55594f" stroke-width="1.5"')}</g>`;
}

function wallBase(u, o = {}) {
  const f = o.floor ?? 388;
  let out = R(0, 0, VIEW_W, VIEW_H, `url(#${u}-wall)`);
  if (o.brick) {
    for (let y = 30, r = 0; y < f - 6; y += 18, r++) {
      out += L(0, y, VIEW_W, y, '#000', 1, 'opacity=".2"');
      for (let x = (r % 2) * 22; x < VIEW_W; x += 44) out += L(x, y, x, Math.min(y + 18, f - 6), '#000', 1, 'opacity=".14"');
    }
  } else for (let x = 12; x < VIEW_W; x += 24) out += L(x, 0, x, f - 4, '#fff', 1, 'opacity=".025"');
  out += R(0, f, VIEW_W, VIEW_H - f, `url(#${u}-floor)`) + R(0, f - 6, VIEW_W, 9, '#140f09');
  for (let i = 0; i < 6; i++) out += L(-40 + i * 90, 480, 40 + i * 60, f + 3, '#000', 1.5, 'opacity=".25"');
  return out;
}
function zoomBase(u, tone = 'wall') {
  const fill = tone === 'wood' ? `url(#${u}-wood)` : tone === 'dark' ? '#121512' : `url(#${u}-wall)`;
  return R(0, 0, VIEW_W, VIEW_H, fill) + R(0, 0, VIEW_W, VIEW_H, '#000', 'opacity=".25"');
}

function glyph(name, x, y, s, color, extra = '') {
  if (name === 'sun') return C(x, y, s * .55, color, extra) + Array.from({ length: 8 }, (_, i) => { const [x1, y1] = pol(x, y, s * .78, i * 45), [x2, y2] = pol(x, y, s * 1.12, i * 45); return L(x1.toFixed(1), y1.toFixed(1), x2.toFixed(1), y2.toFixed(1), color, s * .16, 'stroke-linecap="round"'); }).join('');
  if (name === 'moon') return P(`M${x + s * .45} ${y - s}A${s} ${s} 0 0 0 ${x + s * .45} ${y + s}A${s * 1.3} ${s * 1.3} 0 0 1 ${x + s * .45} ${y - s}Z`, color, extra);
  if (name === 'star') return P(Array.from({ length: 10 }, (_, i) => { const [px, py] = pol(x, y, i % 2 ? s * .45 : s * 1.05, i * 36); return `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`; }).join('') + 'Z', color, extra);
  if (name === 'drop') return P(`M${x} ${y - s * 1.1}C${x + s * .3} ${y - s * .5} ${x + s * .85} ${y} ${x + s * .85} ${y + s * .35}A${s * .85} ${s * .85} 0 0 1 ${x - s * .85} ${y + s * .35}C${x - s * .85} ${y} ${x - s * .3} ${y - s * .5} ${x} ${y - s * 1.1}Z`, color, extra);
  if (name === 'leaf') return P(`M${x - s} ${y + s}C${x - s} ${y - s * .3} ${x - s * .2} ${y - s} ${x + s} ${y - s}C${x + s} ${y + s * .2} ${x + s * .2} ${y + s} ${x - s} ${y + s}Z`, color, extra) + L(x - s * .8, y + s * .8, x + s * .5, y - s * .5, '#00000055', s * .14);
  if (name === 'eye') return P(`M${x - s * 1.1} ${y}Q${x} ${y - s} ${x + s * 1.1} ${y}Q${x} ${y + s} ${x - s * 1.1} ${y}Z`, 'none', `stroke="${color}" stroke-width="${s * .2}"`) + C(x, y, s * .38, color, extra);
  if (name === 'key') return C(x - s * .45, y, s * .45, 'none', `stroke="${color}" stroke-width="${s * .22}"`) + L(x, y, x + s, y, color, s * .22) + L(x + s * .7, y, x + s * .7, y + s * .4, color, s * .2) + L(x + s, y, x + s, y + s * .4, color, s * .2);
  if (name === 'crown') return P(`M${x - s} ${y + s * .6}L${x - s} ${y - s * .5}L${x - s * .45} ${y}L${x} ${y - s * .8}L${x + s * .45} ${y}L${x + s} ${y - s * .5}L${x + s} ${y + s * .6}Z`, color, extra);
  if (ICONS[name]) return icon(name, x, y, s, color);
  return C(x, y, s * .6, color, extra);
}

function tongsArt() {
  return P('M4 -1L44 -9L46 -5L6 1Z', '#cfd3cc', 'stroke="#55594f" stroke-width="1"') + P('M4 1L44 9L46 5L6 -1Z', '#b9bdb6', 'stroke="#55594f" stroke-width="1"')
    + R(38, -14, 12, 7, '#c0392b', 'rx="2" transform="rotate(-11 44 -10)"') + R(38, 7, 12, 7, '#c0392b', 'rx="2" transform="rotate(11 44 10)"')
    + C(4, 0, 5, 'none', 'stroke="#9aa09a" stroke-width="2.5"');
}

function memoArt(x, y, w, h, rot = 0) {
  return `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">${R(x + 2, y + 3, w, h, '#000', 'opacity=".35"')}${R(x, y, w, h, '#efe5cc', 'stroke="#8d7c5a" stroke-width="1"')}${[.3, .5, .7].map(k => R(x + w * .15, y + h * k, w * .7, Math.max(1, h * .05), '#6d604a', 'opacity=".6"')).join('')}${P(`M${x + w * .72} ${y}L${x + w} ${y + h * .28}H${x + w * .72}Z`, '#d6c9a6')}</g>`;
}

function ribbon(x, y, s) {
  return P(`M${x} ${y}h${s}v${s * 3.2}l${-s / 2} ${-s * .7}l${-s / 2} ${s * .7}Z`, '#a3322a', 'stroke="#5a1712" stroke-width="1"') + R(x, y, s, s * .5, '#d6ab3f');
}

function pointer(x, y, s, dir, color) {
  const vertical = dir === 'up' || dir === 'down';
  const sx = vertical ? x + s * .6 : x;
  const tip = { left: [-1.9, -.2], right: [1.9, -.2], up: [.7, -2.4], down: [.75, 2.1] }[dir] ?? [1.9, 0];
  const [tx, ty] = [x + tip[0] * s, y + tip[1] * s];
  const ang = Math.atan2(ty - (y - s * .25), tx - sx);
  const hx = tx + Math.cos(ang) * s * .35, hy = ty + Math.sin(ang) * s * .35;
  return C(x, y - s * 1.05, s * .42, color) + P(`M${x - s * .5} ${y - s * .5}Q${x} ${y - s * .7} ${x + s * .5} ${y - s * .5}L${x + s * .55} ${y + s * .9}H${x - s * .55}Z`, color)
    + L(sx, y - s * .25, tx.toFixed(1), ty.toFixed(1), color, s * .26, 'stroke-linecap="round"')
    + P(`M${hx.toFixed(1)} ${hy.toFixed(1)}L${(tx + Math.cos(ang + 1.9) * s * .3).toFixed(1)} ${(ty + Math.sin(ang + 1.9) * s * .3).toFixed(1)}L${(tx + Math.cos(ang - 1.9) * s * .3).toFixed(1)} ${(ty + Math.sin(ang - 1.9) * s * .3).toFixed(1)}Z`, color)
    + L(x - s * .3, y + s * .9, x - s * .35, y + s * 1.8, color, s * .22) + L(x + s * .3, y + s * .9, x + s * .35, y + s * 1.8, color, s * .22);
}

function groupPhoto(x, y, w, h, withSign = true) {
  const s = h / 9;
  let out = R(x, y, w, h, '#efe9dc') + R(x + w * .06, y + h * .07, w * .88, h * .74, '#5a5348');
  out += R(x + w * .06, y + h * .07, w * .88, h * .3, '#7b7264');
  [.17, .32, .47, .62].forEach((k, i) => { const cx = x + w * k, cy = y + h * .52; out += C(cx, cy - s * 1.2, s * .7, '#2a2520') + P(`M${cx - s} ${cy - s * .4}H${cx + s}L${cx + s * 1.1} ${y + h * .81}H${cx - s * 1.1}Z`, i % 2 ? '#3a332c' : '#2a2520'); });
  const fx = x + w * .83, fy = y + h * .52;
  out += C(fx, fy - s * 1.2, s * .7, '#1c1916') + P(`M${fx - s} ${fy - s * .4}H${fx + s}L${fx + s * 1.1} ${y + h * .81}H${fx - s * 1.1}Z`, '#8a3a2c');
  if (withSign) out += R(x + w * .26, y + h * .62, w * .48, h * .15, '#f2ecd8', 'stroke="#2a2520" stroke-width=".8"') + T(x + w * .5, y + h * .695, '05·12', h * .12, '#2a2520', NUM_FONT);
  return out;
}

// 새 방 그림이 쓰는 이름을 18시 그림체에 맞춥니다. 움직임 묶음(G)은 그림만 남기고, 그림자는 평면 타원, 나무 상자는 그라데이션만 씁니다.
const G = (cls, body) => body;
const origin = () => '';
const dust = () => '';
const shadow = (u, cx, cy, rx, ry = 8) => E(cx, cy, rx, ry, '#060807', 'opacity=".42"');
const woodBox = (u, x, y, w, h, extra = 'stroke="#22170d" stroke-width="2"') => R(x, y, w, h, `url(#${u}-wood)`, extra);

// 그림 판(plate) 층 나누기입니다. DESIGN_v7.md 참고.
// full: 지금처럼 SVG로 모두 그립니다(판이 없을 때, 테스트).
// bake: 판을 만들 때 쓰는 입력 그림입니다. 벽, 가구처럼 그림으로 구울 부분만 그립니다.
// over: 판 위에 덧그리는 층입니다. 단서, 주울 물건, 자물쇠 입력, 빛처럼 코드가 책임질 부분과, 처음 상태에서 바뀐 부분만 그립니다.
let LAYER = { mode: 'full', is: () => false, fresh: () => false, patch: () => null };
// 판에 구울 부분입니다.
const bg = svg => (LAYER.mode === 'over' ? '' : svg);
// 항상 코드로 그리는 부분입니다. 정답과 관련된 그림, 주울 물건, 빛은 판에 굽지 않습니다.
const fg = svg => (LAYER.mode === 'bake' ? '' : svg);
// 상태에 따라 바뀌는 부분입니다. 판에는 처음 상태가 구워져 있으므로, over 층에서는 처음과 달라졌을 때만
// 그 상태의 판 조각(patch)을 얹고, 조각이 없으면 SVG로 그립니다.
// 여러 조건에 따라 모양이 바뀌는 부분입니다. 판에는 처음 상태가 구워져 있으므로, over 층에서는
// 조건 중 하나라도 처음과 달라졌을 때만 조각(patch)을 얹고, 조각이 없으면 지금 상태를 SVG로 그립니다.
// renderFresh를 주면, 조각이 없을 때 처음 모습과 그림이 같으면(상태가 바뀌어도 그림은 그대로인 소품) 아무것도 덧그리지 않습니다.
// 판에 이미 그려진 물건을 SVG로 한 번 더 그려 두 개로 보이던 문제를 막습니다.
const KIT_EXITS = new Set(['door', 'gate', 'hatch', 'ladder', 'elevator', 'stonedoor', 'sliding', 'curtainexit']);
function swAll(key, conds, render, renderFresh = null) {
  if (LAYER.mode !== 'over') return render();
  if (conds.every(c => LAYER.is(c) === LAYER.fresh(c))) return '';
  const patch = LAYER.patch(key, true);
  if (patch !== null && patch !== undefined) return patch;
  const now = render();
  return renderFresh && now === renderFresh() ? '' : now;
}
// 키트 방의 소품과 판자(plate, inside) 중 상태에 따라 바뀌는 것의 조건 목록입니다. 판 사양(scripts/plates)도 이 함수를 씁니다.
export const PROP_STATES = ['on', 'empty', 'frost', 'bloom'];
export const propConds = p => PROP_STATES.filter(k => p[k]).map(k => p[k]);
export const kitPatchKey = (kind, i) => `${kind}${i}`;
function sw(key, cond, whenTrue, whenFalse = '') {
  const now = LAYER.is(cond);
  if (LAYER.mode !== 'over') return now ? whenTrue : whenFalse;
  if (now === LAYER.fresh(cond)) return '';
  return LAYER.patch(key, now) ?? (now ? whenTrue : whenFalse);
}

// 상태에 따라 바뀌는 사서의 방 장면입니다.
const library = {
  north(u, s, is) {
    let out = bg(wallBase(u) + E(180, 438, 170, 30, '#3a1f1a', 'opacity=".75"') + E(180, 438, 150, 24, '#5a2c22', 'opacity=".6"'));
    out += bg(clockFace(u, 180, 72, 42, false, 'body')) + fg(clockFace(u, 180, 72, 42, false, 'face'));
    out += bg(R(110, 120, 140, 272, '#3a2a19') + R(114, 124, 132, 266, '#20170f'));
    out += sw('door', 'door-open',
      R(120, 130, 120, 260, `url(#${u}-hall)`) + P('M120 130L150 140V384L120 392Z', `url(#${u}-wood)`, 'stroke="#2a1c10" stroke-width="2"')
        + P('M120 390H240L300 480H60Z', '#f3d38c', 'opacity=".22"') + R(150, 150, 70, 190, '#fff', 'opacity=".08"'),
      R(120, 130, 120, 260, `url(#${u}-wood)`, 'stroke="#2a1c10" stroke-width="2"')
        + R(132, 144, 96, 104, 'none', 'stroke="#2a1c10" stroke-width="3" opacity=".7"') + R(132, 262, 96, 112, 'none', 'stroke="#2a1c10" stroke-width="3" opacity=".7"')
        + C(224, 254, 7, `url(#${u}-brass)`) + R(217, 266, 14, 26, `url(#${u}-brass)`, 'rx="3"') + C(224, 275, 3, '#120d08') + R(223, 276, 2, 8, '#120d08'));
    out += bg(R(10, 318, 108, 74, `url(#${u}-wood)`, 'stroke="#2a1c10" stroke-width="2"') + L(14, 354, 114, 354, '#2a1c10', 2) + C(64, 336, 3, `url(#${u}-brass)`) + C(64, 372, 3, `url(#${u}-brass)`));
    out += bg(R(18, 232, 92, 86, `url(#${u}-steel)`, 'rx="4" stroke="#1b201e" stroke-width="2"'));
    out += sw('safe', 'open:safe',
      R(26, 240, 76, 70, '#0d0f0e') + P('M26 240L12 246V306L26 310Z', '#4a5450', 'stroke="#1b201e" stroke-width="1.5"'),
      R(26, 240, 76, 70, 'none', 'stroke="#1b201e" stroke-width="2"') + R(20, 248, 5, 12, '#1b201e') + R(20, 290, 5, 12, '#1b201e') + R(92, 262, 6, 26, `url(#${u}-brass)`, 'rx="3"'));
    if (is('open:safe')) out += fg(is('got:key') ? '' : bundle(u, 38, 262, 50, 40, true));
    else out += fg(filmIcon(60, 252, 34, 14, '#c9b27a')
      + arrow('up', 64, 268, 5, '#c9b27a') + arrow('down', 64, 292, 5, '#c9b27a') + arrow('left', 52, 280, 5, '#c9b27a') + arrow('right', 76, 280, 5, '#c9b27a')
      + [0, 1, 2, 3].map(i => C(52 + i * 8, 303, 2.2, '#4b4436')).join(''));
    out += bg(L(318, 112, 318, 386, `url(#${u}-wood)`, 6) + P('M300 388L336 388L318 378Z', '#2a1c10') + L(304, 118, 332, 118, '#3a2a19', 4)
      + P('M298 128Q318 116 338 128L346 268Q318 280 290 268Z', '#2f4436', 'stroke="#1a261d" stroke-width="2"') + P('M318 126L312 200L318 268L324 200Z', '#253629')
      + P('M302 214H330V236Q316 242 302 236Z', '#263a2d', 'stroke="#1a261d" stroke-width="1.5"'));
    if (!is('got:memo1')) out += fg(memoArt(306, 202, 18, 14, -10));
    return out;
  },
  east(u, s, is) {
    let out = bg(wallBase(u) + R(24, 20, 312, 376, `url(#${u}-wood)`, 'stroke="#22170d" stroke-width="3"') + R(34, 30, 292, 354, '#1b1510'));
    out += bg(R(30, 156, 300, 8, `url(#${u}-woodl)`) + R(30, 272, 300, 8, `url(#${u}-woodl)`) + R(30, 384, 300, 8, `url(#${u}-woodl)`));
    out += bg(filler(u, 36, 214, 156, 96, 1) + filler(u, 266, 326, 156, 92, 5));
    // 튀어나온 책은 옆면과 그림자를 그려 다른 책보다 앞으로 나와 보이게 합니다.
    out += sw('book', 'book-pulled', R(222, 70, 36, 86, '#120e0a') + E(240, 154, 14, 2, '#5a4a36', 'opacity=".6"'), R(212, 154, 50, 6, '#000', 'opacity=".45"') + P('M222 62L212 70V160L222 156Z', '#5b2e1e') + P('M222 62L212 70H246L256 62Z', '#c39a62') + spine(u, 222, 62, 34, 94, '#9a5234') + R(250, 62, 6, 94, '#000', 'opacity=".22"') + R(228, 84, 22, 4, '#e2c588', 'opacity=".7"') + R(228, 132, 22, 4, '#e2c588', 'opacity=".7"'));
    // 가운데 칸의 색과 무늬는 정답 단서라서 판에 굽지 않습니다.
    const mid = [['#6b4a33', null], ['yellow', 'diamond'], ['#4b5446', null], ['red', 'circle'], ['blue', 'triangle'], ['#5a3f2c', null], ['green', 'square'], ['#3f3a35', null]];
    mid.forEach(([color, mark], i) => { const h = 92 - ((i * 11) % 14); out += fg(spine(u, 42 + i * 35.5, 272 - h, 32, h, color, mark)); });
    out += bg([0, 1, 2].map(i => R(44 + i * 4, 362 - i * 18, 128 - i * 12, 16, TONES[i + 2], 'rx="2" stroke="#120e0a"')).join(''));
    out += bg(R(196, 314, 110, 70, `url(#${u}-woodl)`, 'stroke="#2a1c10" stroke-width="2"'));
    out += sw('box', 'open:box', P('M196 314L204 294H298L306 314Z', '#2a1f14', 'stroke="#2a1c10" stroke-width="2"') + R(200, 300, 102, 14, '#0e0b08'),
      P('M196 314L202 302H300L306 314Z', `url(#${u}-wood)`, 'stroke="#2a1c10" stroke-width="2"'));
    if (!is('open:box')) out += fg(bookIcon(251, 333, 9, '#3a2a19'));
    const boxDraft = is('open:box') ? s.room.locks.box.answer : cleanInput(s.room.locks.box, s.drafts.box);
    boxDraft.forEach((color, i) => { out += fg(swatch(u, color, fill => C(224 + i * 18, 362, 6.5, fill, 'stroke="#2a1c10" stroke-width="1.5"'))); });
    return out;
  },
  south(u, s, is) {
    let out = bg(wallBase(u));
    if (is('projected')) {
      let light = P('M126 168L176 104H344V216H176Z', '#ffe1a0', 'opacity=".12"') + R(176, 104, 168, 112, '#f2d9a2', 'opacity=".85" rx="3"');
      for (let i = 0; i < 6; i++) light += R(184 + i * 26, 110, 12, 7, '#8a7651', 'opacity=".55"') + R(184 + i * 26, 203, 12, 7, '#8a7651', 'opacity=".55"');
      ['right', 'up', 'right', 'down'].forEach((dir, i) => { light += arrow(dir, 202 + i * 39, 160, 15, '#3a2a19'); });
      out += fg(light);
    }
    if (is('lamp-on')) out += fg(C(86, 214, 90, `url(#${u}-glow)`) + P('M44 212H128L170 292H8Z', '#ffd98f', 'opacity=".14"'));
    out += bg(R(6, 288, 348, 18, `url(#${u}-woodl)`, 'stroke="#2a1c10" stroke-width="2"') + R(14, 306, 332, 86, `url(#${u}-wood)`, 'stroke="#2a1c10" stroke-width="2"'));
    out += bg(R(24, 316, 78, 30, 'none', 'stroke="#2a1c10" stroke-width="2"') + R(24, 352, 78, 30, 'none', 'stroke="#2a1c10" stroke-width="2"') + R(258, 316, 78, 30, 'none', 'stroke="#2a1c10" stroke-width="2"') + R(258, 352, 78, 30, 'none', 'stroke="#2a1c10" stroke-width="2"'));
    out += bg([[63, 331], [63, 367], [297, 331], [297, 367]].map(([x, y]) => C(x, y, 3, `url(#${u}-brass)`)).join(''));
    out += sw('drawer', 'open:drawer', R(116, 312, 128, 10, '#0c0906') + R(112, 320, 136, 72, `url(#${u}-woodl)`, 'stroke="#2a1c10" stroke-width="2"'),
      R(116, 312, 128, 76, `url(#${u}-woodl)`, 'stroke="#2a1c10" stroke-width="2"'));
    const top = is('open:drawer') ? 8 : 0;
    out += fg(alarmIcon(180, 324 + top, 5, '#3a2a19'));
    (is('open:drawer') ? s.room.locks.drawer.answer : cleanInput(s.room.locks.drawer, s.drafts.drawer)).forEach((n, i) => { out += fg(R(146 + i * 24, 338 + top, 20, 24, '#efe5cc', 'stroke="#2a1c10" stroke-width="2" rx="2"') + T(156 + i * 24, 350 + top, n, 15, '#2a1c10', NUM_FONT)); });
    out += fg(R(160, 372 + top, 40, 6, `url(#${u}-brass)`, 'rx="3"'));
    out += bg(E(86, 292, 34, 7, `url(#${u}-brass)`) + R(83, 208, 6, 84, `url(#${u}-brass)`));
    if (is('lamp-on')) out += fg(`<g transform="rotate(180 86 225)">${bulbArt(86, 225, 9, true, u)}</g>`);
    out += bg(P('M62 152H110L138 210H34Z', `url(#${u}-shade)`, 'stroke="#1a2e20" stroke-width="2"') + R(32, 208, 108, 6, `url(#${u}-brass)`, 'rx="2"'));
    if (is('projected')) out += fg(R(42, 214, 88, 14, `url(#${u}-film)`, 'opacity=".9"'));
    out += bg(R(266, 278, 64, 10, '#e2d5b4', 'transform="rotate(-4 298 283)"') + R(270, 272, 60, 10, '#cbbd98', 'transform="rotate(3 300 277)"') + C(232, 280, 8, '#1d2a31') + R(229, 266, 6, 8, '#1d2a31'));
    return out;
  },
  west(u, s, is) {
    let out = bg(wallBase(u));
    let win = R(162, 46, 164, 196, `url(#${u}-wood)`, 'stroke="#22170d" stroke-width="3"') + R(172, 56, 144, 176, `url(#${u}-night)`);
    for (let i = 0; i < 16; i++) { const x = 176 + ((i * 37) % 136), y = 62 + ((i * 53) % 150); win += L(x, y, x - 6, y + 18, '#9fb7c6', 1.2, 'opacity=".45"'); }
    win += P('M172 92Q200 74 236 88Q262 70 300 84Q316 86 316 96V56H172Z', '#1b2833') + L(244, 56, 244, 232, `url(#${u}-wood)`, 6) + L(172, 144, 316, 144, `url(#${u}-wood)`, 6);
    win += R(156, 240, 176, 10, `url(#${u}-woodl)`);
    out += bg(win);
    out += bg(C(80, 70, 4, '#9e3b30') + R(22, 70, 116, 164, `url(#${u}-paper)`, 'transform="rotate(-1.5 80 152)" stroke="#8d7c5a" stroke-width="1.5"'));
    // 분류표의 그림, 번호, 모양은 정답 단서라서 판에 굽지 않습니다.
    let chart = bookIcon(80, 92, 11, '#4a3a26');
    ['triangle', 'square', 'circle', 'diamond'].forEach((kind, i) => { const y = 124 + i * 28; chart += T(56, y, i + 1, 18, '#3a2f22', NUM_FONT) + shape(kind, 102, y, 8, '#3a2f22'); });
    out += fg(chart);
    out += bg(R(146, 284, 164, 96, '#000', 'opacity=".25"'));
    let closed = R(152, 290, 152, 84, `url(#${u}-steel)`, 'rx="3" stroke="#1b201e" stroke-width="2"');
    for (let y = 304; y < 364; y += 10) closed += R(170, y, 116, 4, '#151a18', 'rx="2"');
    closed += screw(162, 300, 5) + screw(294, 300, 5) + screw(162, 364, 5) + screw(294, 364, 5);
    out += sw('panel', 'panel-open', R(152, 290, 152, 84, '#0b0d0c', 'stroke="#2a2e2b" stroke-width="2"') + R(160, 300, 136, 64, '#171310'), closed);
    if (is('panel-open')) {
      if (!is('got:bulb')) out += fg(C(198, 336, 9, '#e9eef0', 'opacity=".55"'));
      if (!is('got:film-r')) out += fg(R(240, 330, 34, 18, `url(#${u}-film)`));
      // 떼어 낸 판 조각(panel)이 문짝까지 덮습니다. 판이 없을 때만 SVG 문짝을 그립니다.
      out += sw('panel', 'panel-open', P('M306 300L330 296L334 388L310 390Z', `url(#${u}-steel)`, 'stroke="#1b201e" stroke-width="1.5"'));
    }
    return out;
  },
  clock(u) {
    return bg(zoomBase(u) + clockFace(u, 180, 212, 150, true, 'body')) + fg(clockFace(u, 180, 212, 150, true, 'face'));
  },
  safe(u, s, is) {
    let out = bg(zoomBase(u, 'dark') + R(30, 34, 300, 372, `url(#${u}-steel)`, 'rx="10" stroke="#151a18" stroke-width="3"'));
    out += sw('safe', 'open:safe',
      R(54, 60, 252, 320, '#0b0c0b', 'rx="4"') + R(54, 300, 252, 8, '#2a302d') + P('M54 60L14 74V368L54 380Z', '#46504c', 'stroke="#151a18" stroke-width="2"'),
      R(48, 52, 264, 336, 'none', 'stroke="#151a18" stroke-width="3" rx="6"') + R(20, 92, 12, 48, '#1b201e', 'rx="3"') + R(20, 300, 12, 48, '#1b201e', 'rx="3"') + R(300, 176, 16, 76, `url(#${u}-brass)`, 'rx="6" stroke="#3b2f1a" stroke-width="2"'));
    if (is('open:safe')) return out + fg(is('got:key') ? '' : bundle(u, 100, 180, 160, 116, true));
    // 금고 앞면의 필름 그림, 단추, 불빛은 자물쇠와 단서라서 코드로 그립니다.
    let face = filmIcon(180, 82, 120, 40, '#d4bb82');
    const lock = s.room.locks.safe;
    const [px, py] = lock.at[0];
    face += C(px, py, 100, '#1f2422', 'stroke="#59625d" stroke-width="3"') + C(px, py, 22, `url(#${u}-brass)`);
    for (const c of lockControls(lock)) {
      const x = c.x + c.w / 2, y = c.y + c.h / 2;
      face += R(x - 25, y - 25, 50, 50, `url(#${u}-brass)`, 'rx="10" stroke="#3b2f1a" stroke-width="2"') + arrow(c.dir, x, y, 13, '#2a2118');
    }
    const lit = cleanInput(lock, s.drafts.safe).length;
    const [lx, ly] = lock.lights;
    lock.answer.forEach((_, i) => { face += C(lx + (i - (lock.answer.length - 1) / 2) * 28, ly, 8, i < lit ? '#f2cf7c' : '#2a2e2b', 'stroke="#151a18" stroke-width="2"'); });
    return out + fg(face);
  },
  books(u, s, is) {
    let out = bg(zoomBase(u, 'dark') + R(0, 396, VIEW_W, 20, `url(#${u}-woodl)`));
    const set = [['#6b4a33', null], ['yellow', 'diamond'], ['#4b5446', null], ['red', 'circle'], ['blue', 'triangle'], ['#5a3f2c', null], ['green', 'square'], ['#3f3a35', null]];
    set.forEach(([color, mark], i) => { const h = 320 - ((i * 23) % 40); out += fg(spine(u, 14 + i * 42, 396 - h, 38, h, color, mark)); });
    if (!is('got:bookmark')) out += fg(ribbon(323, 150, 9));
    return out;
  },
  box(u, s, is) {
    let out = bg(zoomBase(u, 'dark'));
    out += sw('box', 'open:box', P('M38 96L60 16H300L322 96Z', '#2a1f14', 'stroke="#140e08" stroke-width="3"') + R(30, 96, 300, 80, '#0d0a07', 'stroke="#140e08" stroke-width="3"'),
      P('M30 170L54 70H306L330 170Z', `url(#${u}-wood)`, 'stroke="#140e08" stroke-width="3"'));
    if (is('open:box')) { if (!is('got:film-l')) out += fg(filmStrip(u, 124, 118, 112, 46, true, 'right')); }
    else out += fg(bookIcon(180, 120, 30, '#2a1c10'));
    out += bg(R(30, 170, 300, 236, `url(#${u}-woodl)`, 'stroke="#140e08" stroke-width="3"') + R(44, 214, 272, 108, '#3a2a19', 'rx="8"'));
    const draft = cleanInput(s.room.locks.box, s.drafts.box);
    s.room.locks.box.at.forEach(([x, y], i) => { out += fg(C(x, y + 3, 26, '#000', 'opacity=".4"') + C(x, y, 26, `url(#${u}-brass)`) + swatch(u, draft[i], fill => C(x, y, 20, fill))); });
    return out;
  },
  drawer(u, s, is) {
    let out = bg(zoomBase(u, 'dark'));
    const lock = s.room.locks.drawer;
    if (is('open:drawer')) {
      // 열린 서랍 안쪽과 앞판은 한 조각입니다. 앞판(y 336 아래)과 안의 물건은 겹치지 않습니다.
      out += sw('drawer', 'open:drawer', R(36, 150, 288, 190, '#2a1f14', 'stroke="#140e08" stroke-width="3"') + R(48, 162, 264, 166, '#1a130c')
        + R(24, 336, 312, 80, `url(#${u}-woodl)`, 'stroke="#140e08" stroke-width="3"') + R(140, 366, 80, 12, `url(#${u}-brass)`, 'rx="6"'));
      if (!is('got:memo2')) out += fg(memoArt(222, 164, 64, 44, 8));
      if (!is('got:handle')) out += fg(handleArt(180, 260, 40, -8));
      return out;
    }
    out += bg(R(24, 112, 312, 300, `url(#${u}-woodl)`, 'stroke="#140e08" stroke-width="3"') + R(40, 128, 280, 268, 'none', 'stroke="#3a2a19" stroke-width="2" opacity=".6"'));
    out += fg(alarmIcon(180, 152, 15, '#3a2a19'));
    const draft = cleanInput(lock, s.drafts.drawer);
    lock.at.forEach(([x, y], i) => {
      out += fg(P(`M${x - 13} ${y - 30}L${x} ${y - 43}L${x + 13} ${y - 30}`, 'none', 'stroke="#1e140a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'));
      out += fg(P(`M${x - 13} ${y + 30}L${x} ${y + 43}L${x + 13} ${y + 30}`, 'none', 'stroke="#1e140a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'));
      out += fg(R(x - 22, y - 22, 44, 44, '#efe5cc', 'stroke="#2a1c10" stroke-width="3" rx="4"') + T(x, y + 1, draft[i], 28, '#2a1c10', NUM_FONT));
    });
    out += bg(R(140, 330, 80, 12, `url(#${u}-brass)`, 'rx="6"'));
    return out;
  },
  poster(u) {
    let out = bg(zoomBase(u) + R(40, 34, 280, 374, `url(#${u}-paper)`, 'stroke="#8d7c5a" stroke-width="2"') + C(180, 46, 6, '#9e3b30'));
    let chart = bookIcon(180, 92, 30, '#4a3a26');
    ['triangle', 'square', 'circle', 'diamond'].forEach((kind, i) => { const y = 160 + i * 62; chart += T(122, y, i + 1, 40, '#3a2f22', NUM_FONT) + shape(kind, 230, y, 20, '#3a2f22'); });
    return out + fg(chart);
  },
  panel(u, s, is) {
    let out = bg(zoomBase(u));
    let open = R(36, 96, 288, 268, '#0b0d0c', 'stroke="#2a2e2b" stroke-width="3"');
    for (let y = 110; y < 360; y += 22) open += L(40, y, 320, y, '#1d1814', 2);
    let closed = R(36, 96, 288, 268, `url(#${u}-steel)`, 'rx="8" stroke="#151a18" stroke-width="3"');
    for (let y = 146; y < 326; y += 20) closed += R(84, y, 192, 8, '#151a18', 'rx="4"');
    closed += screw(62, 122, 13) + screw(298, 122, 13) + screw(62, 338, 13) + screw(298, 338, 13);
    out += sw('panel', 'panel-open', open, closed);
    if (is('panel-open')) {
      if (!is('got:bulb')) out += fg(bulbArt(120, 236, 30, false, u));
      if (!is('got:film-r')) out += fg(filmStrip(u, 202, 238, 100, 46, true, 'left'));
    }
    return out;
  },
  lamp(u, s, is) {
    let out = bg(zoomBase(u));
    if (is('projected')) {
      let light = R(40, 20, 280, 74, '#f2d9a2', 'opacity=".9" rx="4"');
      for (let i = 0; i < 9; i++) light += R(50 + i * 30, 25, 14, 7, '#8a7651', 'opacity=".55"') + R(50 + i * 30, 82, 14, 7, '#8a7651', 'opacity=".55"');
      ['right', 'up', 'right', 'down'].forEach((dir, i) => { light += arrow(dir, 75 + i * 70, 57, 19, '#3a2a19'); });
      light += P('M110 104L40 94H320L250 104Z', '#ffe1a0', 'opacity=".25"');
      out += fg(light);
    }
    const on = is('lamp-on');
    if (on) out += fg(C(180, 296, 150, `url(#${u}-glow)`));
    out += bg(R(176, 344, 8, 72, `url(#${u}-brass)`) + E(180, 418, 80, 14, `url(#${u}-brass)`));
    out += bg(R(156, 240, 48, 26, `url(#${u}-brass)`, 'rx="4"') + R(164, 264, 32, 22, `url(#${u}-brass)`) + [0, 1, 2].map(i => L(164, 268 + i * 6, 196, 268 + i * 6, '#5a4a30', 2)).join(''));
    if (on) out += fg(`<g transform="rotate(180 180 318)">${bulbArt(180, 318, 26, true, u)}</g>`);
    // 전구가 없으면 소켓 구멍과 빈 전구 자리(점선)를 보여 줍니다.
    else out += fg(E(180, 287, 16, 6, '#0b0906', 'stroke="#8a7146" stroke-width="2"') + C(180, 318, 24, 'none', 'stroke="#e9eef0" stroke-opacity=".55" stroke-width="2.5" stroke-dasharray="6 6"'));
    out += bg(P('M130 110H230L296 236H64Z', `url(#${u}-shade)`, 'stroke="#13241a" stroke-width="3"') + R(60, 232, 240, 12, `url(#${u}-brass)`, 'rx="4"'));
    if (is('projected')) out += fg(filmStrip(u, 92, 248, 176, 40, true));
    return out;
  },
};

// 붉은 암실입니다. 배전함을 맞추면 붉은 안전등이 켜지고, 그 빛에서만 보이는 것이 생깁니다.
const DIRS = ['left', 'up', 'right', 'down'];
function photoSheet(x, y, w, h, dir, lit) {
  let out = R(x + 2, y + 3, w, h, '#000', 'opacity=".4"') + R(x, y, w, h, dir ? '#1d1b19' : '#d9d6cc', 'stroke="#8a8676" stroke-width="1"');
  if (dir) out += pointer(x + w * .48, y + h * .5, Math.min(w, h) * .14, dir, lit);
  else out += R(x + w * .1, y + h * .1, w * .8, h * .8, '#e9e6dc', 'opacity=".6"');
  return out;
}
function tray(u, cx, cy, w, h, sym, liquid) {
  return E(cx, cy + h * .55, w * .6, h * .25, `url(#${u}-sh)`)
    + P(`M${cx - w / 2} ${cy + h / 2}L${cx - w / 2 + w * .1} ${cy - h / 2}H${cx + w / 2 - w * .1}L${cx + w / 2} ${cy + h / 2}Z`, '#dcd7c6', 'stroke="#7d796b" stroke-width="2"')
    + P(`M${cx - w / 2 + w * .07} ${cy + h / 2 - h * .14}L${cx - w / 2 + w * .15} ${cy - h / 2 + h * .18}H${cx + w / 2 - w * .15}L${cx + w / 2 - w * .07} ${cy + h / 2 - h * .14}Z`, liquid)
    + L(cx - w / 2 + w * .16, cy - h / 2 + h * .25, cx + w / 2 - w * .2, cy - h / 2 + h * .25, '#fff', 1.2, 'opacity=".25"')
    + R(cx - 12, cy + h / 2 + 6, 24, 24, '#efe5cc', 'rx="4" stroke="#6d604a" stroke-width="1.5"') + glyph(sym, cx, cy + h / 2 + 18, 7, '#2a2118');
}
const darkroom = {
  north(u, s, is) {
    const red = is('red');
    let out = bg(wallBase(u, { floor: 368, light: red ? null : [180, 64, 170] }));
    out += bg(R(44, 74, 110, 130, '#000', 'opacity=".3"') + R(40, 70, 110, 130, `url(#${u}-paper)`, 'transform="rotate(-1 95 135)" stroke="#8d7c5a" stroke-width="1.5"') + C(95, 76, 3.5, '#9e3b30'));
    ['drop', 'leaf', 'star'].forEach((g, i) => { const y = 102 + i * 38; out += fg(glyph(g, 95, y, 10, '#3a2f22') + (i < 2 ? arrow('down', 95, y + 19, 5, '#6d604a') : '')); });
    out += bg(L(262, 70, 262, 84, '#2a2a28', 4) + (red ? '' : '') + P('M216 84H308L298 142H226Z', '#1b1d1c', 'stroke="#3a3f3c" stroke-width="2"')) + fg(R(232, 94, 60, 38, red ? '#ff5a44' : '#4a1512', 'rx="3"') + [0, 1, 2].map(i => L(234, 103 + i * 10, 290, 103 + i * 10, '#000', 1.5, 'opacity=".35"')).join('') + T(262, 154, 'SAFE LIGHT', 8, '#8d958f', 'letter-spacing="1"'));
    out += bg(L(180, 26, 180, 48, '#111', 2) + R(175, 46, 10, 6, '#2a2a28')) + fg(red ? C(180, 60, 9, '#3a3a36') : G('amb-flicker', C(180, 60, 44, `url(#${u}-glow)`)) + C(180, 60, 9, '#fff2c8'));
    out += bg(shadow(u, 180, 374, 170, 9) + woodBox(u, 24, 262, 312, 104) + L(180, 268, 180, 360, '#1a120a', 2) + C(166, 314, 3, `url(#${u}-brass)`) + C(194, 314, 3, `url(#${u}-brass)`));
    out += bg(P('M14 262L22 246H338L346 262Z', '#3b3f3d', 'stroke="#1e2120" stroke-width="2"') + L(22, 247, 338, 247, '#fff', 1, 'opacity=".14"'));
    ['leaf', 'star', 'drop'].forEach((g, i) => {
      const x0 = 40 + i * 86, x1 = x0 + 76;
      out += bg(P(`M${x0} 256L${x0 + 8} 232H${x1 - 8}L${x1} 256Z`, '#d9d4c4', 'stroke="#8a8676" stroke-width="2"') + P(`M${x0 + 6} 252L${x0 + 12} 236H${x1 - 12}L${x1 - 6} 252Z`, '#5d6a63', 'opacity=".9"'));
      out += fg(R(x0 + 29, 268, 18, 18, '#efe5cc', 'rx="3" stroke="#6d604a" stroke-width="1"') + glyph(g, x0 + 38, 277, 5, '#2a2118'));
    });
    if (is('soaking') && !is('open:dip')) out += fg(P('M228 244L236 236H270L276 244Z', '#f4f1e8', 'opacity=".9"'));
    if (is('open:dip') && !is('got:photo')) out += fg(G('anim-fade', P('M142 244L150 236H184L190 244Z', '#3a332c')));
    if (!is('got:tongs')) out += fg(`<g transform="translate(296 242) rotate(-10) scale(1.05)">${tongsArt()}</g>`);
    return out;
  },
  east(u, s, is) {
    const red = is('red'), open = is('open:door');
    let out = bg(wallBase(u, { floor: 368, light: red ? null : [180, 40, 160] }));
    out += bg(R(156, 62, 68, 26, '#151716', 'rx="4"')) + fg(R(162, 67, 56, 16, red ? '#ff5a44' : '#3a1210', 'rx="3"') + T(190, 75, '현상 중', 10, red ? '#3a0a06' : '#1c0906'));
    out += bg(R(34, 172, 64, 82, '#000', 'opacity=".35" rx="4"') + R(30, 166, 64, 82, `url(#${u}-steel)`, 'rx="4" stroke="#1b201e" stroke-width="2"') + L(32, 168, 92, 168, '#fff', 1, 'opacity=".2"'));
    const sw = is('open:panel') ? s.room.locks.panel.answer : cleanInput(s.room.locks.panel, s.drafts.panel);
    sw.forEach((v, i) => { const x = 37 + i * 13.5; out += fg(R(x, 190, 9, 26, '#0b0c0c', 'rx="3"') + R(x + 1, v ? 191 : 203, 7, 12, `url(#${u}-brass)`, 'rx="2"')); });
    out += fg(glyph('sun', 48, 232, 4, '#c9b27a') + glyph('moon', 78, 232, 4, '#9aa3a8')) + bg(L(62, 248, 62, 356, '#111', 3));
    out += bg(shadow(u, 190, 376, 90, 8) + R(116, 96, 148, 276, '#141413'));
    // 문이 열린 모습은 판 조각으로, 닫힌 문의 숫자판과 손잡이는 코드로 그립니다.
    out += swAll('door', ['open:door'], () => (open
      ? R(124, 104, 132, 268, `url(#${u}-hall)`) + G('anim-swing', P('M124 104L156 116V360L124 372Z', '#2a2d2c', 'stroke="#111" stroke-width="2"'), origin(124, 238))
        + G('amb-rays', P('M124 372H256L340 480H40Z', `url(#${u}-ray)`)) + dust([[160, 200, 0], [200, 260, 1.3], [230, 180, 2.2], [180, 320, .7]])
      : R(124, 104, 132, 268, '#2a2d2c', 'stroke="#111" stroke-width="2"') + R(124, 104, 132, 268, 'none', 'stroke="#0c0c0c" stroke-width="5" opacity=".7"')));
    if (!open) out += fg(R(214, 214, 28, 40, '#1c1f1e', 'rx="4" stroke="#4a524e" stroke-width="1.5"') + [0, 1, 2].map(r => [0, 1, 2].map(c => C(221 + c * 7, 224 + r * 9, 2, '#8d958f')).join('')).join('') + C(240, 284, 6, `url(#${u}-brass)`));
    let apron = L(306, 116, 306, 128, '#888', 2) + C(306, 116, 4, `url(#${u}-brass)`) + P('M290 128H322L338 300H274Z', '#3b2c22', 'stroke="#1b130c" stroke-width="2"') + P('M286 220H326V258Q306 266 286 258Z', '#2e221a', 'stroke="#1b130c" stroke-width="1.5"');
    out += bg(G('amb-sway', apron, origin(306, 118)));
    if (!is('got:memo3')) out += fg(memoArt(296, 208, 20, 15, 8));
    return out;
  },
  south(u, s, is) {
    const red = is('red');
    let out = bg(wallBase(u, { floor: 368, light: red ? null : [180, 40, 160] }));
    out += bg(P('M14 52Q160 70 306 52', 'none', 'stroke="#cfc9b8" stroke-width="1.5"'));
    [34, 96, 158, 220].forEach((x, i) => { out += fg(photoSheet(x, 60, 52, 64, red ? DIRS[i] : null, '#f1e9d8') + R(x + 22, 52, 8, 14, '#b88a52', 'rx="2"')); });
    out += bg(shadow(u, 180, 374, 150, 9) + woodBox(u, 40, 272, 280, 14) + R(56, 286, 10, 82, `url(#${u}-wood)`) + R(294, 286, 10, 82, `url(#${u}-wood)`) + R(66, 340, 228, 6, `url(#${u}-wood)`));
    out += bg(R(96, 258, 168, 14, '#1e2120', 'rx="2"') + R(110, 254, 140, 6, red ? '#e7dccb' : '#f2ede2', 'opacity=".25"'));
    out += bg(R(172, 150, 14, 110, `url(#${u}-steel)`) + R(128, 140, 104, 52, '#1b1e1d', 'rx="6" stroke="#3a403d" stroke-width="2"') + L(132, 142, 228, 142, '#fff', 1, 'opacity=".15"') + P('M164 192H196L190 212H170Z', '#111'));
    if (is('neg-in')) out += fg(R(136, 168, 88, 8, `url(#${u}-neg)`));
    out += fg(`<g transform="rotate(4 213 223)">${R(192, 206, 44, 36, '#d9c99a')}${['sun', 'moon', 'sun', 'sun'].map((g, i) => glyph(g, 199 + i * 10, 224, 3.4, '#3a2f22')).join('')}</g>`);
    return out;
  },
  west(u, s, is) {
    const red = is('red');
    let out = bg(wallBase(u, { floor: 368, light: red ? null : [180, 40, 160] }));
    out += bg(shadow(u, 180, 374, 165, 9) + R(24, 84, 10, 284, `url(#${u}-wood)`) + R(326, 84, 10, 284, `url(#${u}-wood)`));
    [172, 270, 362].forEach(y => { out += bg(R(24, y, 312, 8, `url(#${u}-woodl)`) + R(34, y + 8, 292, 8, '#000', 'opacity=".3"')); });
    const bottles = [[44, 26, 62, '#8a5a1e'], [84, 30, 54, '#3f6b4a'], [126, 24, 66, '#c9d6d3'], [164, 28, 58, '#3a5a8a'], [214, 34, 68, '#5a3a1e'], [266, 24, 48, '#8a5a1e']];
    bottles.forEach(([x, w, h, c]) => { const y = 172 - h; out += bg(R(x, y + 14, w, h - 14, c, 'rx="5"') + R(x + w * .3, y, w * .4, 16, c) + R(x + w * .25, y - 4, w * .5, 6, '#1b1b1b', 'rx="2"') + R(x + 4, y + 18, 4, h - 26, '#fff', 'opacity=".25"') + R(x + 5, y + h * .45, w - 10, 14, '#efe5cc', 'opacity=".8"')); });
    if (!is('got:bookmark')) out += fg(ribbon(199, 128, 8));
    out += bg(woodBox(u, 50, 214, 126, 56));
    const tiles = is('open:negbox') ? s.room.locks.negbox.answer : cleanInput(s.room.locks.negbox, s.drafts.negbox);
    if (is('open:negbox')) out += fg(G('anim-lid', P('M50 214L58 196H168L176 214Z', '#3a2a19', 'stroke="#22170d" stroke-width="2"'), origin(113, 214)));
    tiles.forEach((d, i) => { const x = 68 + i * 30, y = 248; out += fg(R(x - 10, y - 10, 20, 20, '#c8b27a', 'rx="2"') + arrow(d, x, y, 6, '#2a2118')); });
    out += bg(R(206, 220, 16, 50, '#c9d6d3', 'opacity=".55" rx="3"') + P('M248 230H284L270 252V270H262V252Z', '#7b8a86'));
    out += bg(R(200, 292, 130, 78, '#000', 'opacity=".35"') + R(196, 288, 130, 78, `url(#${u}-steel)`, 'stroke="#1b201e" stroke-width="2"') + L(261, 290, 261, 364, '#1b201e', 2) + C(250, 330, 3, `url(#${u}-brass)`) + C(272, 330, 3, `url(#${u}-brass)`));
    out += fg(C(232, 310, 9, '#efe5cc') + glyph('sun', 232, 310, 5, '#3a2f22') + L(224, 318, 240, 302, '#9e3b30', 2.5));
    if (is('got:paper')) out += fg(G('anim-swing', P('M261 290L292 284V372L261 366Z', '#4a5450', 'stroke="#1b201e" stroke-width="1.5"'), origin(261, 328, '--sx:2.1')));
    return out;
  },
  chart(u) {
    let out = bg(zoomBase(u) + R(66, 36, 236, 372, '#000', 'opacity=".3"') + R(60, 30, 236, 372, `url(#${u}-paper)`, 'stroke="#8d7c5a" stroke-width="2"') + C(178, 42, 6, '#9e3b30'));
    ['drop', 'leaf', 'star'].forEach((g, i) => { const y = 102 + i * 120; out += fg(glyph(g, 178, y, 34, '#3a2f22') + (i < 2 ? arrow('down', 178, y + 60, 14, '#6d604a') : '')); });
    return out;
  },
  photos(u, s, is) {
    const red = is('red');
    let out = bg(zoomBase(u, 'dark') + P('M0 132Q180 160 360 132', 'none', 'stroke="#cfc9b8" stroke-width="2"'));
    [18, 104, 190, 276].forEach((x, i) => { out += fg(photoSheet(x, 150, 66, 96, red ? DIRS[i] : null, '#f1e9d8') + R(x + 28, 138, 10, 22, '#b88a52', 'rx="3"')); });
    return out;
  },
  tray(u, s, is) {
    let out = bg(zoomBase(u, 'dark') + R(0, 240, VIEW_W, 180, '#2c302e') + L(0, 240, 360, 240, '#fff', 1, 'opacity=".12"'));
    const lock = s.room.locks.dip;
    const draft = cleanInput(lock, s.drafts.dip);
    lock.at.forEach(([x, y], i) => {
      const sym = lock.symbols[i];
      out += fg(tray(u, x, y - 8, 96, 64, sym, '#5d6a63'));
      if (sym === 'drop' && is('soaking') && !is('open:dip')) out += fg(P(`M${x - 30} ${y + 6}L${x - 22} ${y - 18}H${x + 22}L${x + 30} ${y + 6}Z`, '#f4f1e8', 'opacity=".9"'));
      if (sym === 'star' && is('open:dip') && !is('got:photo')) out += fg(G('anim-fade', `<g transform="translate(${x - 34} ${y - 30}) scale(.6)">${groupPhoto(0, 0, 112, 80, true)}</g>`));
    });
    if (!is('open:dip')) {
      const [lx, ly] = lock.lights;
      lock.answer.forEach((_, i) => { const cx = lx + (i - (lock.answer.length - 1) / 2) * 30; out += fg((i < draft.length ? C(cx, ly, 16, `url(#${u}-glow)`) : '') + C(cx, ly, 8, i < draft.length ? '#f2cf7c' : '#2a2e2b', 'stroke="#151a18" stroke-width="2"')); });
    }
    return out;
  },
  panel(u) {
    return bg(zoomBase(u) + R(36, 138, 300, 250, '#000', 'opacity=".35" rx="10"') + R(30, 130, 300, 250, `url(#${u}-steel)`, 'rx="10" stroke="#151a18" stroke-width="3"')
      + screw(52, 152, 8) + screw(308, 152, 8) + screw(52, 358, 8) + screw(308, 358, 8)) + fg(P('M186 150L170 176H182L174 200L196 168H184L192 150Z', '#d6ab3f'));
  },
  door(u) {
    return bg(zoomBase(u, 'dark') + R(0, 0, VIEW_W, VIEW_H, '#232625')
      + R(76, 58, 220, 344, '#000', 'opacity=".45" rx="12"') + R(70, 52, 220, 344, '#1a1d1c', 'rx="12" stroke="#4a524e" stroke-width="2"') + L(74, 54, 286, 54, '#fff', 1, 'opacity=".15"'));
  },
  enlarger(u, s, is) {
    let out = bg(zoomBase(u) + R(20, 360, 320, 60, `url(#${u}-wood)`));
    out += bg(R(70, 312, 220, 52, '#1e2120', 'rx="4"') + R(84, 320, 192, 36, '#ebe5d6', 'opacity=".25"'));
    out += bg(R(170, 170, 20, 150, `url(#${u}-steel)`) + R(100, 110, 160, 86, '#1b1e1d', 'rx="8" stroke="#3a403d" stroke-width="2"') + L(104, 113, 256, 113, '#fff', 1, 'opacity=".18"'));
    out += bg(R(112, 148, 136, 18, '#0b0c0c', 'rx="3"'));
    if (is('neg-in')) out += fg(G('anim-slide', R(116, 150, 128, 14, `url(#${u}-neg)`) + [0, 1, 2, 3, 4, 5].map(i => R(120 + i * 20, 152, 8, 3, '#e0b98a', 'opacity=".7"')).join('')));
    out += bg(P('M156 196H204L196 236H164Z', '#111') + E(180, 236, 16, 5, '#2f3a3a'));
    out += fg(`<g transform="rotate(4 238 230)">${R(198, 202, 84, 60, '#000', 'opacity=".3"')}${R(196, 200, 84, 60, '#d9c99a')}${['sun', 'moon', 'sun', 'sun'].map((g, i) => glyph(g, 211 + i * 18, 230, 7, '#3a2f22')).join('')}</g>`);
    return out;
  },
  negbox(u, s, is) {
    let out = bg(zoomBase(u, 'dark'));
    // 상자 뚜껑이 열린 모습은 판 조각으로, 필름 그림과 필름 조각은 코드로 그립니다.
    out += sw('negbox', 'open:negbox', G('anim-lid', P('M30 140L56 70H304L330 140Z', '#3a2a19', 'stroke="#22170d" stroke-width="3"'), origin(180, 140)) + R(30, 140, 300, 110, '#0d0a07'), P('M30 140L46 110H314L330 140Z', `url(#${u}-wood)`, 'stroke="#22170d" stroke-width="3"') + R(30, 140, 300, 110, `url(#${u}-wood)`, 'stroke="#22170d" stroke-width="3"'));
    if (is('open:negbox')) { if (!is('got:negative')) out += fg(R(110, 170, 140, 46, `url(#${u}-neg)`, 'rx="2"') + [0, 1, 2, 3, 4, 5, 6].map(i => R(116 + i * 19, 174, 9, 5, '#e0b98a', 'opacity=".7"') + R(116 + i * 19, 207, 9, 5, '#e0b98a', 'opacity=".7"')).join('')); } else out += fg(filmIcon(180, 196, 120, 40, '#c9b27a'));
    out += bg(R(30, 250, 300, 120, `url(#${u}-woodl)`, 'stroke="#22170d" stroke-width="3"'));
    return out;
  },
};

// 자물쇠는 공통 모양으로 그립니다. skin이 custom이면 방 그림이 직접 그립니다.
// 열린 뒤에도 스위치, 타일, 기호 단추, 숫자판은 마지막 모습으로 남기고 숫자 바퀴, 색 단추, 화살표는 감춥니다.
function lockArt(u, room, viewId, s) {
  const found = lockIn(room, viewId);
  if (!found) return '';
  const [id, lock] = found;
  const open = s.open.includes(id);
  if (lock.skin === 'custom' || (open && ['dial', 'color', 'direction'].includes(lock.type))) return '';
  if (room.art === 'kit' && (open || !lockReady(lock, s))) return '';
  const draft = open ? lock.answer : cleanInput(lock, s.drafts?.[id]);
  // 모양(form)이 정해진 자물쇠는 escape-locks.js의 그림을 씁니다. 손으로 만든 방의 자물쇠는 아래 공통 모양 그대로입니다.
  const F = lock.form ? LOCK_FORMS[lock.form] : null;
  if (F) return F.draw(u, lock, draft, { glyph, arrow, swatch, shape, controls: lockControls(lock) });
  let out = '';
  if (lock.type === 'dial') {
    lock.at.forEach(([x, y], i) => {
      out += P(`M${x - 13} ${y - 30}L${x} ${y - 43}L${x + 13} ${y - 30}`, 'none', 'stroke="#e8e2d0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".85"')
        + P(`M${x - 13} ${y + 30}L${x} ${y + 43}L${x + 13} ${y + 30}`, 'none', 'stroke="#e8e2d0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".85"')
        + (lock.tags?.[i] ? swatch(u, lock.tags[i], fill => C(x, y - 72, 10, fill, 'stroke="#1b1712" stroke-width="2"')) : '')
        + R(x - 22, y - 20, 44, 44, '#000', 'opacity=".35" rx="4"') + R(x - 22, y - 22, 44, 44, '#efe5cc', 'stroke="#2a1c10" stroke-width="3" rx="4"') + R(x - 22, y - 22, 44, 12, '#000', 'opacity=".12" rx="4"') + T(x, y + 1, draft[i], 28, '#2a1c10', NUM_FONT);
    });
    return out;
  }
  if (lock.type === 'color') {
    lock.at.forEach(([x, y], i) => { out += C(x, y + 3, 26, '#000', 'opacity=".4"') + C(x, y, 26, `url(#${u}-brass)`) + swatch(u, draft[i], fill => C(x, y, 20, fill)) + C(x - 7, y - 7, 5, '#fff', 'opacity=".25"'); });
    return out;
  }
  for (const c of lockControls(lock)) {
    const x = c.x + c.w / 2, y = c.y + c.h / 2;
    if (lock.type === 'switch') {
      const on = draft[c.index] === 1;
      out += R(x - 24, y - 28, 48, 56, '#1c1f1e', 'rx="8" stroke="#4a524e" stroke-width="2"') + R(x - 8, y - 18, 16, 36, '#0b0c0c', 'rx="6"')
        + R(x - 11, on ? y - 21 : y - 1, 22, 22, `url(#${u}-brass)`, 'rx="5" stroke="#3b2f1a" stroke-width="1.5"')
        + (on ? C(x, y - 50, 18, `url(#${u}-glow)`) : '') + C(x, y - 50, 13, '#0f1110', 'stroke="#3a403d" stroke-width="1.5"') + glyph(on ? 'sun' : 'moon', x, y - 50, 7, on ? '#f2cf7c' : '#8d979c');
    } else if (lock.type === 'rotate') {
      out += R(x - 26, y - 24, 52, 52, '#000', 'opacity=".4" rx="8"') + R(x - 26, y - 26, 52, 52, `url(#${u}-brass)`, 'rx="8" stroke="#3b2f1a" stroke-width="2"') + arrow(draft[c.index], x, y, 15, '#2a2118');
    } else if (lock.type === 'symbol') {
      out += C(x, y + 3, 28, '#000', 'opacity=".4"') + C(x, y, 28, `url(#${u}-brass)`) + C(x, y, 22, '#1d1a15') + glyph(c.sym, x, y, 11, '#ecd9a8');
    } else if (lock.type === 'direction') {
      out += R(x - 25, y - 23, 50, 50, '#000', 'opacity=".35" rx="10"') + R(x - 25, y - 25, 50, 50, `url(#${u}-brass)`, 'rx="10" stroke="#3b2f1a" stroke-width="2"') + arrow(c.dir, x, y, 13, '#2a2118');
    } else {
      out += R(x - 26, y - 24, 52, 52, '#000', 'opacity=".45" rx="8"') + R(x - 26, y - 26, 52, 52, '#2b302e', 'rx="8" stroke="#59625d" stroke-width="2"') + L(x - 22, y - 24, x + 22, y - 24, '#fff', 1, 'opacity=".18"')
        + T(x, y + 1, c.key === '<' ? '←' : c.key, 22, c.key === 'C' || c.key === '<' ? '#d7b77b' : '#e8e4d8', MONO_FONT);
    }
  }
  if (SEQUENCE_LOCKS.includes(lock.type) && lock.lights) {
    const [lx, ly] = lock.lights, n = lock.answer.length;
    if (lock.type === 'keypad') {
      out += R(lx - 17 * n - 12, ly - 20, 34 * n + 24, 40, '#0b120e', 'rx="6" stroke="#3c4a40" stroke-width="2"');
      for (let i = 0; i < n; i++) out += T(lx + (i - (n - 1) / 2) * 34, ly + 1, draft[i] ?? '·', 24, draft[i] !== undefined ? (open ? '#f2cf7c' : '#9fe0a8') : '#3a4a3e', MONO_FONT);
    } else for (let i = 0; i < n; i++) { const cx = lx + (i - (n - 1) / 2) * 28; out += (i < draft.length ? C(cx, ly, 16, `url(#${u}-glow)`) : '') + C(cx, ly, 8, i < draft.length ? '#f2cf7c' : '#2a2e2b', 'stroke="#151a18" stroke-width="2"'); }
  }
  return out;
}

// 출판사 인쇄소입니다. 두 교정지의 차이, 거꾸로 새긴 금속판, 잉크와 활자를 맞춰 지워진 이름을 다시 찍습니다.
const ORN_LEFT = ['star', 'key', 'moon', 'eye', 'crown'];
const ORN_RIGHT = ['star', null, 'moon', null, null];
function typeBlock(x, y, w, h, faded = false) {
  let out = R(x + 2, y + 3, w, h, '#000', 'opacity=".35"') + R(x, y, w, h, faded ? '#a6a194' : '#8f8a7e', 'rx="2" stroke="#4a4740" stroke-width="1.5"');
  const n = Math.max(3, Math.floor(w / 11)), cw = (w - 8) / n;
  for (let i = 0; i < n; i++) out += R((x + 4 + i * cw).toFixed(1), (y + h * .2).toFixed(1), (cw - 2.5).toFixed(1), (h * .6).toFixed(1), faded ? '#c4bfb1' : '#55524a', 'rx="1"');
  return out + L(x + 2, y + 2, x + w - 2, y + 2, '#fff', 1, 'opacity=".35"');
}
function rollerArt(x, y, s, inked) {
  return R(x - s * .1, y - s * 1.5, s * .2, s * 1.1, '#6a4524', 'rx="2"') + R(x - s * .06, y - s * .42, s * .12, s * .42, '#9a9c95')
    + R(x - s * .85, y, s * 1.7, s * .66, inked ? '#0d0d0d' : '#3d3d3a', `rx="${s * .3}"`) + R(x - s * .75, y + s * .1, s * 1.5, s * .12, '#fff', `opacity="${inked ? .45 : .18}"`)
    + R(x - s * .95, y + s * .2, s * .12, s * .26, '#9a9c95') + R(x + s * .83, y + s * .2, s * .12, s * .26, '#9a9c95');
}
function inkTin(x, y, s) {
  return E(x, y + s, s * .8, s * .2, '#000', 'opacity=".35"') + R(x - s * .7, y - s * .45, s * 1.4, s * 1.4, '#1d2c4c', 'rx="3"') + R(x - s * .7, y - s * .45, s * .25, s * 1.4, '#fff', 'opacity=".12"')
    + E(x, y - s * .45, s * .7, s * .18, '#56637c') + R(x - s * .7, y + s * .05, s * 1.4, s * .42, '#efe5cc') + glyph('drop', x, y + s * .26, s * .16, '#1d2c4c');
}
function coverArt(x, y, w, h) {
  return R(x + 3, y + 4, w, h, '#000', 'opacity=".35"') + R(x, y, w, h, '#f6efdc', 'stroke="#b9ad8e" stroke-width="1.5"') + bookIcon(x + w / 2, y + h * .22, h * .14, '#6d604a')
    + T(x + w / 2, y + h * .52, '은서', h * .16, '#2a2118', 'font-weight="700"') + T(x + w / 2, y + h * .76, '한결', h * .16, '#2a2118', 'font-weight="700"');
}
const pressroom = {
  north(u, s, is) {
    let out = bg(wallBase(u, { floor: 368, stripes: false, brick: true }));
    out += bg(L(150, 26, 150, 56, '#111', 2) + P('M128 72L138 56H162L172 72Z', '#2c2f2d', 'stroke="#111" stroke-width="1.5"') + G('amb-flicker', '' + C(150, 74, 5, '#fff2c8')));
    out += bg(shadow(u, 145, 378, 120, 9) + C(42, 296, 32, 'none', 'stroke="#2e3331" stroke-width="7"') + [0, 45, 90, 135].map(a => { const [x1, y1] = pol(42, 296, 30, a), [x2, y2] = pol(42, 296, 30, a + 180); return L(x1.toFixed(1), y1.toFixed(1), x2.toFixed(1), y2.toFixed(1), '#2e3331', 4); }).join(''));
    out += bg(R(40, 360, 210, 16, '#1e2120') + R(58, 150, 18, 212, `url(#${u}-steel)`) + R(214, 150, 18, 212, `url(#${u}-steel)`) + R(50, 132, 190, 22, `url(#${u}-steel)`, 'stroke="#151a18" stroke-width="1.5"') + [64, 120, 176, 226].map(x => C(x, 143, 2.5, '#9aa29c')).join(''));
    out += bg(R(136, 154, 18, 40, `url(#${u}-brass)`) + R(84, 194, 122, 14, `url(#${u}-steel)`) + R(78, 250, 134, 26, '#202221', 'stroke="#111" stroke-width="1.5"') + R(88, 236, 114, 16, 'none', 'stroke="#a98c55" stroke-width="2"'));
    if (is('inked-bed')) out += fg(R(92, 238, 106, 12, '#0b0b0b') + L(96, 240, 190, 240, '#fff', 1, 'opacity=".35"'));
    else if (is('typeset')) out += fg(R(92, 238, 106, 12, '#6f6b62'));
    out += fg(is('printed') ? L(232, 300, 258, 338, '#2e3331', 6, 'stroke-linecap="round"') + C(260, 342, 7, '#7a2a1e') : L(232, 300, 254, 200, '#2e3331', 6, 'stroke-linecap="round"') + C(256, 194, 7, '#7a2a1e'));
    if (is('printed') && !is('got:cover')) out += fg(G('anim-fade', C(140, 340, 50, `url(#${u}-glow)`) + `<g transform="rotate(-3 140 340)">${coverArt(110, 318, 60, 44)}</g>`));
    out += bg(shadow(u, 304, 392, 46, 6) + R(262, 128, 84, 262, '#2a1d12'));
    // 문이 열린 모습은 판 조각으로, 문의 책 표시는 코드로 그립니다.
    out += sw('door', 'door-open', R(268, 134, 72, 252, `url(#${u}-hall)`) + G('anim-swing', P('M268 134L284 142V380L268 386Z', `url(#${u}-wood)`, 'stroke="#1a120a" stroke-width="2"'), origin(268, 260, '--sx:4.5'))
        + G('amb-rays', P('M268 386H340L360 480H190Z', `url(#${u}-ray)`)) + dust([[290, 200, 0], [312, 262, 1.4], [298, 320, 2.5]]), R(268, 134, 72, 252, `url(#${u}-wood)`, 'stroke="#1a120a" stroke-width="2"') + R(276, 146, 56, 66, 'none', 'stroke="#1a120a" stroke-width="2.5" opacity=".7"') + R(276, 296, 56, 78, 'none', 'stroke="#1a120a" stroke-width="2.5" opacity=".7"'));
    if (!is('door-open')) out += fg(bookIcon(304, 228, 8, '#c9b27a')) + bg(R(280, 244, 48, 20, `url(#${u}-brass)`, 'rx="3"') + R(286, 250, 36, 7, '#0b0806', 'rx="2"') + C(330, 278, 4, `url(#${u}-brass)`));
    return out;
  },
  east(u, s, is) {
    let out = bg(wallBase(u, { floor: 368, stripes: false, brick: true, light: [170, 50, 150] }));
    out += bg(shadow(u, 164, 376, 140, 8) + woodBox(u, 30, 64, 268, 300) + R(24, 58, 280, 10, `url(#${u}-woodl)`));
    for (let r = 0; r < 7; r++) for (let c = 0; c < 6; c++) {
      if (r === 3 && c === 2) continue;
      const x = 42 + c * 42, y = 76 + r * 40;
      out += bg(R(x, y, 36, 32, `url(#${u}-woodl)`, 'stroke="#22170d" stroke-width="1.2"') + R(x + 6, y + 4, 24, 5, '#efe5cc', 'opacity=".45"') + R(x + 12, y + 18, 12, 5, `url(#${u}-brass)`, 'rx="2"'));
    }
    out += sw('case', 'open:case', R(126, 196, 36, 32, '#0d0a07') + G('anim-slide', R(122, 204, 44, 34, `url(#${u}-woodl)`, 'stroke="#22170d" stroke-width="1.5"') + R(130, 210, 28, 10, '#8f8a7e')), R(126, 196, 36, 32, '#4a3520', 'stroke="#7a6040" stroke-width="1.5"'));
    if (!is('open:case')) out += fg([0, 1, 2].map(i => C(136 + i * 8, 207, 2.2, '#2a2e2b')).join('') + glyph('star', 144, 220, 4, '#d6ab3f'));
    out += bg(L(330, 120, 330, 140, '#8d8f88', 2) + C(330, 120, 3, '#8d8f88'));
    if (!is('got:roller')) out += fg(G('amb-sway', rollerArt(330, 180, 26, false), origin(330, 140)));
    return out;
  },
  south(u, s, is) {
    let out = bg(wallBase(u, { floor: 368, stripes: false, brick: true }));
    out += bg(R(20, 34, 320, 192, '#6a5136', 'stroke="#2a1c10" stroke-width="3"'));
    const sheet = (x, names, orn) => {
      let o = R(x + 3, 47, 138, 172, '#000', 'opacity=".3"') + R(x, 44, 138, 172, `url(#${u}-paper)`, 'stroke="#8d7c5a" stroke-width="1"') + C(x + 69, 50, 3.5, '#9e3b30');
      o += R(x + 14, 60, 110, 5, '#6d604a', 'opacity=".6"') + bookIcon(x + 69, 92, 12, '#4a3a26');
      names.forEach((n, i) => { const y = 128 + i * 26; o += n ? T(x + 69, y, n, 15, '#2a2118', 'font-weight="700"') : R(x + 46, y - 7, 46, 14, '#e3d7b8') + L(x + 48, y - 4, x + 90, y + 4, '#cbbf9f', 1.5); });
      orn.forEach((g, i) => { if (g) o += glyph(g, x + 18 + i * 25.5, 192, 7, '#3a2f22'); });
      return o;
    };
    out += fg(sheet(32, ['은서', '한결'], ORN_LEFT) + sheet(190, ['은서', null], ORN_RIGHT));
    out += bg(L(95, 236, 66, 258, '#777', 1.5) + L(95, 236, 124, 258, '#777', 1.5) + C(95, 236, 3, '#999'));
    out += bg(R(48, 262, 102, 66, '#000', 'opacity=".35" rx="4"') + R(44, 258, 102, 66, `url(#${u}-steel)`, 'rx="4" stroke="#151a18" stroke-width="2"')) + fg(`<g transform="translate(95 292) scale(-1 1)">${T(0, 0, '583', 34, '#cfd4cd', `${NUM_FONT} font-weight="700"`)}</g>`);
    out += bg(shadow(u, 296, 384, 40, 6) + P('M262 300H330L322 378H270Z', '#2a2e2b', 'stroke="#111" stroke-width="2"') + [276, 290, 304, 318].map(x => L(x, 302, x - 2, 376, '#111', 1.5)).join(''));
    out += bg(P('M272 300L280 288L292 292L290 304Z', '#d9cfb3') + P('M294 296L304 284L318 290L312 302Z', '#cfc5a8') + P('M312 302L320 292L328 298L322 306Z', '#e2d8bd'));
    if (!is('got:type2')) out += fg(R(288, 284, 22, 8, '#8f8a7e', 'stroke="#4a4740"') + C(312, 280, 3, '#fff',));
    return out;
  },
  west(u, s, is) {
    let out = bg(wallBase(u, { floor: 368, stripes: false, brick: true, light: [180, 40, 150] }));
    out += bg(R(24, 76, 10, 160, `url(#${u}-wood)`) + R(326, 76, 10, 160, `url(#${u}-wood)`));
    [136, 222].forEach(y => { out += bg(R(24, y, 312, 8, `url(#${u}-woodl)`) + R(34, y + 8, 292, 8, '#000', 'opacity=".3"')); });
    const stack = (x, w, n, base) => Array.from({ length: n }, (_, i) => R(x + (i % 2) * 2, base - (i + 1) * 7, w, 6, i % 3 ? '#e9dfc5' : '#d6cba9', 'stroke="#8d7c5a" stroke-width=".6"')).join('');
    out += bg(stack(40, 62, 5, 136) + stack(122, 70, 7, 136) + stack(212, 56, 4, 136) + stack(282, 44, 6, 136));
    if (!is('got:memo4')) out += fg(memoArt(58, 92, 22, 16, -10));
    if (!is('got:bookmark')) out += fg(ribbon(298, 136, 8));
    [[50, '#1d2c4c'], [86, '#111'], [122, '#6b1f1a'], [158, '#1d2c4c']].forEach(([x, c]) => { out += bg(R(x, 192, 26, 30, c, 'rx="4"') + R(x + 4, 186, 18, 8, '#2a2a28', 'rx="2"') + R(x + 4, 196, 4, 22, '#fff', 'opacity=".2"')); });
    out += bg(R(206, 196, 110, 26, `url(#${u}-wood)`, 'stroke="#22170d" stroke-width="1.5"') + [0, 1, 2, 3, 4, 5].map(i => R(212 + i * 17, 202, 12, 14, '#5a564d', 'rx="1"')).join(''));
    out += bg(shadow(u, 180, 380, 90, 7) + R(104, 254, 160, 120, '#000', 'opacity=".35"') + R(100, 250, 160, 120, `url(#${u}-steel)`, 'stroke="#1b201e" stroke-width="2"') + L(102, 252, 258, 252, '#fff', 1, 'opacity=".2"'));
    if (is('open:cabinet')) {
      out += sw('cabinet', 'open:cabinet', R(106, 256, 148, 108, '#0b0c0c')) + fg(is('got:ink') ? '' : inkTin(180, 314, 22)) + sw('cabinet', 'open:cabinet', G('anim-swing', P('M106 256L88 262V358L106 364Z', '#4a5450', 'stroke="#1b201e" stroke-width="1.5"'), origin(106, 310, '--sx:-8')));
    } else {
      out += fg(glyph('drop', 180, 276, 8, '#c9b27a'));
      cleanInput(s.room.locks.cabinet, s.drafts.cabinet).forEach((n, i) => { out += fg(R(152 + i * 20, 292, 16, 22, '#efe5cc', 'stroke="#2a1c10" stroke-width="1.5" rx="2"') + T(160 + i * 20, 303, n, 13, '#2a1c10', NUM_FONT)); });
      out += bg(R(236, 296, 8, 30, `url(#${u}-brass)`, 'rx="3"'));
    }
    return out;
  },
  press(u, s, is) {
    let out = bg(zoomBase(u, 'dark') + R(30, 394, 262, 24, '#1a1c1b'));
    out += bg(R(36, 90, 250, 24, `url(#${u}-steel)`, 'stroke="#151a18" stroke-width="2"') + R(44, 114, 24, 280, `url(#${u}-steel)`) + R(254, 114, 24, 280, `url(#${u}-steel)`) + [56, 110, 166, 222, 266].map(x => C(x, 102, 3.5, '#9aa29c')).join(''));
    out += bg(R(150, 114, 22, 34, `url(#${u}-brass)`) + R(76, 148, 170, 18, `url(#${u}-steel)`, 'stroke="#151a18" stroke-width="1.5"'));
    out += bg(R(80, 176, 162, 124, '#191b1a', 'stroke="#0b0c0c" stroke-width="2"') + R(92, 188, 138, 100, 'none', 'stroke="#a98c55" stroke-width="3"'));
    if (is('typeset')) out += fg(typeBlock(102, 206, 118, 28) + typeBlock(102, 246, 118, 28, true));
    else out += fg(R(102, 206, 118, 68, 'none', 'stroke="#e9eef0" stroke-opacity=".45" stroke-width="2" stroke-dasharray="6 6"'));
    if (is('inked-bed')) out += fg(G('anim-fade', R(102, 206, 118, 68, '#0a0a0a', 'opacity=".82"') + L(108, 212, 212, 212, '#fff', 1.5, 'opacity=".4"')));
    const down = is('printed');
    out += bg(C(276, 320, 12, `url(#${u}-steel)`)) + fg(L(276, 320, down ? 344 : 334, down ? 360 : 168, '#3a403d', 9, 'stroke-linecap="round"') + C(down ? 346 : 336, down ? 366 : 160, 14, '#7a2a1e', 'stroke="#3a120c" stroke-width="2"'));
    if (down && !is('got:cover')) out += fg(G('anim-slide', C(160, 350, 70, `url(#${u}-glow)`) + coverArt(100, 314, 122, 72)));
    return out;
  },
  case(u, s, is) {
    let out = bg(zoomBase(u, 'dark') + R(30, 104, 312, 310, '#000', 'opacity=".4"') + woodBox(u, 24, 96, 312, 310, 'stroke="#140e08" stroke-width="3"') + R(40, 112, 280, 278, 'none', 'stroke="#3a2a19" stroke-width="2" opacity=".6"'));
    if (is('open:case')) out += sw('case', 'open:case', G('anim-slide', R(40, 128, 280, 96, '#1a130c', 'stroke="#140e08" stroke-width="2"') + [1, 2, 3].map(i => L(40 + i * 70, 128, 40 + i * 70, 224, '#2a1f14', 3)).join(''))) + fg(is('got:type1') ? '' : typeBlock(110, 158, 140, 40));
    else out += bg(R(124, 140, 112, 44, `url(#${u}-brass)`, 'rx="6" stroke="#3b2f1a" stroke-width="2"')) + fg(bookIcon(180, 162, 12, '#3a2f22'));
    out += bg(R(18, 236, 324, 68, '#2a1f14', 'rx="12"'));
    return out;
  },
  proofs(u) {
    let out = bg(zoomBase(u) + R(4, 26, 352, 370, '#6a5136'));
    const big = (x, title, names, orn) => {
      let o = R(x + 4, 44, 160, 340, '#000', 'opacity=".3"') + R(x, 40, 160, 340, `url(#${u}-paper)`, 'stroke="#8d7c5a" stroke-width="1.5"') + C(x + 80, 50, 5, '#9e3b30');
      o += T(x + 80, 74, title, 13, '#6d604a') + bookIcon(x + 80, 122, 22, '#4a3a26');
      names.forEach((n, i) => { const y = 190 + i * 44; o += n ? T(x + 80, y, n, 28, '#2a2118', 'font-weight="700"') : R(x + 44, y - 13, 72, 26, '#e6dbbd') + L(x + 48, y - 6, x + 110, y + 4, '#cbbf9f', 2) + L(x + 52, y + 6, x + 106, y - 4, '#cbbf9f', 2); });
      orn.forEach((g, i) => { if (g) o += glyph(g, x + 18 + i * 31, 330, 11, '#3a2f22'); });
      return o;
    };
    return out + fg(big(14, '초판 교정', ['은서', '한결'], ORN_LEFT) + big(186, '인쇄본', ['은서', null], ORN_RIGHT));
  },
  plate(u) {
    return bg(zoomBase(u) + L(180, 70, 90, 132, '#777', 2.5) + L(180, 70, 270, 132, '#777', 2.5) + C(180, 70, 6, '#999')
      + R(58, 138, 260, 170, '#000', 'opacity=".4" rx="10"') + R(50, 130, 260, 170, `url(#${u}-steel)`, 'rx="10" stroke="#151a18" stroke-width="3"')
      + screw(72, 152, 8) + screw(288, 152, 8) + screw(72, 278, 8) + screw(288, 278, 8))
      + fg(`<g transform="translate(180 218) scale(-1 1)">${T(3, 4, '583', 96, '#1b201e', `${NUM_FONT} font-weight="700" opacity=".5"`)}${T(0, 0, '583', 96, '#d9ddd6', `${NUM_FONT} font-weight="700"`)}</g>`);
  },
  cabinet(u, s, is) {
    let out = bg(zoomBase(u, 'dark') + R(38, 68, 300, 350, '#000', 'opacity=".4" rx="8"') + R(30, 60, 300, 350, `url(#${u}-steel)`, 'rx="8" stroke="#151a18" stroke-width="3"'));
    if (is('open:cabinet')) {
      out += sw('cabinet', 'open:cabinet', R(46, 76, 268, 318, '#0b0c0c', 'rx="4"') + R(46, 280, 268, 8, '#2a302d') + G('anim-swing', P('M46 76L12 90V380L46 394Z', '#46504c', 'stroke="#151a18" stroke-width="2"'), origin(46, 235, '--sx:-7.9')), '');
      if (!is('got:ink')) out += fg(inkTin(180, 212, 44));
      return out;
    }
    return out + bg(R(46, 76, 268, 318, 'none', 'stroke="#151a18" stroke-width="3" rx="6"')) + fg(glyph('drop', 180, 120, 22, '#c9b27a')) + bg(R(300, 210, 14, 70, `url(#${u}-brass)`, 'rx="6" stroke="#3b2f1a" stroke-width="2"'));
  },
};

// 생성 방(art: kit)은 장면 데이터의 물건(props)과 표식(marks)만으로 그립니다. 그림체는 18시 기준판과 같습니다.
const MATS = { wood: 'wood', steel: 'steel', brass: 'brass' };
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
const rd = v => Math.round(v * 10) / 10;
function pipsArt(n, x, y, s) {
  const d = s * .5;
  return R(rd(x - s + 1.5), rd(y - s + 2.5), rd(s * 2), rd(s * 2), '#000', `opacity=".3" rx="${rd(s * .3)}"`) + R(rd(x - s), rd(y - s), rd(s * 2), rd(s * 2), '#e6dfcc', `rx="${rd(s * .3)}" stroke="#8d8676" stroke-width="1.5"`)
    + (PIPS[n] ?? []).map(([a, b]) => C(rd(x + a * d), rd(y + b * d), rd(s * .17), '#2a2118')).join('');
}
function tallyArt(n, x, y, s, ink) {
  const gap = s * .34, gw = gap * 4, sp = gap * 1.8, groups = [];
  for (let left = n; left > 0; left -= 5) groups.push(Math.min(5, left));
  let gx = x - (groups.length * gw + (groups.length - 1) * sp) / 2, out = '';
  for (const g of groups) {
    for (let i = 0; i < Math.min(4, g); i++) out += L(rd(gx + (i + .5) * gap), rd(y - s * .7), rd(gx + (i + .5) * gap), rd(y + s * .7), ink, rd(s * .12), 'stroke-linecap="round"');
    if (g === 5) out += L(rd(gx - gap * .2), rd(y + s * .5), rd(gx + gw + gap * .2), rd(y - s * .5), ink, rd(s * .12), 'stroke-linecap="round"');
    gx += gw + sp;
  }
  return out;
}
function lampArt(u, on, x, y, s) {
  return L(x, rd(y - s * 2.4), x, rd(y - s), '#151817', 1.5) + (on ? C(x, y, rd(s * 2.4), `url(#${u}-glow)`) : '') + R(rd(x - s * .4), rd(y - s * 1.2), rd(s * .8), rd(s * .45), '#3a3f3c')
    + C(x, y, rd(s * .85), on ? '#f2cf7c' : '#2f3431', 'stroke="#151817" stroke-width="1.5"');
}
function pathArt(m) {
  const { x, y, cell, cols, rows, start, moves } = m;
  let out = '';
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) out += C(rd(x + c * cell), rd(y + r * cell), 3.5, '#8d8676', 'opacity=".85"');
  let [c, r] = start;
  const pts = [[c, r]];
  for (const d of moves) { if (d === 'up') r--; else if (d === 'down') r++; else if (d === 'left') c--; else c++; pts.push([c, r]); }
  const d = 'M' + pts.map(([a, b]) => `${rd(x + a * cell)} ${rd(y + b * cell)}`).join('L');
  out += P(d, 'none', 'stroke="#000" stroke-opacity=".35" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"') + P(d, 'none', 'stroke="#c8644f" stroke-width="4" stroke-dasharray="8 5" stroke-linecap="round" stroke-linejoin="round"');
  const [ex, ey] = pts[pts.length - 1].map((v, i) => (i ? y : x) + v * cell);
  return out + C(rd(x + start[0] * cell), rd(y + start[1] * cell), 8, 'none', 'stroke="#8e3b30" stroke-width="3"') + L(ex - 7, ey - 7, ex + 7, ey + 7, '#8e3b30', 3.5) + L(ex + 7, ey - 7, ex - 7, ey + 7, '#8e3b30', 3.5);
}
function itemMark(u, m) {
  const f = itemArt(m.id);
  if (!f) return '';
  const s = m.s ?? 64;
  return E(m.x, rd(m.y + s * .36), rd(s * .34), rd(s * .07), '#000', 'opacity=".35"') + `<g transform="translate(${rd(m.x - s / 2)} ${rd(m.y - s / 2)}) scale(${rd(s / .64) / 100})">${f(u)}</g>`;
}
function kitMark(u, m) {
  const own = clueMark(u, m, { glyph, arrow, swatch, shape, colors: COLORS });
  if (own !== null && own !== undefined) return own;
  const ink = m.c ?? '#2a2118';
  switch (m.t) {
    case 'shape': return swatch(u, m.c, fill => shape(m.k ?? 'circle', m.x, m.y, m.s, fill, 'stroke="#1b1712" stroke-width="2"'));
    case 'glyph': return glyph(m.n, m.x, m.y, m.s, ink);
    case 'arrow': return arrow(m.d, m.x, m.y, m.s, ink);
    case 'num': return T(m.x, m.y, m.v, m.s, ink, NUM_FONT);
    case 'pips': return pipsArt(m.n, m.x, m.y, m.s);
    case 'tally': return tallyArt(m.n, m.x, m.y, m.s, ink);
    case 'lamp': return lampArt(u, m.on, m.x, m.y, m.s);
    case 'bar': return E(m.x, m.y + 2, rd(m.w * .8), 4, '#000', 'opacity=".3"') + swatch(u, m.c, fill => R(rd(m.x - m.w / 2), rd(m.y - m.h), m.w, rd(m.h), fill, 'rx="3"')) + L(m.x, rd(m.y - m.h), m.x, rd(m.y - m.h - 7), '#1b1b1b', 1.5);
    case 'veil': {
      // 어둠은 검은 사각형이 아니라 가장자리가 풀린 그림자로 덮습니다. 물건의 모양은 보이고 단서는 아직 그려지지 않습니다.
      if (m.k === 'dark') return `<defs><radialGradient id="${u}-murk" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#030404" stop-opacity=".7"/><stop offset=".62" stop-color="#030404" stop-opacity=".5"/><stop offset="1" stop-color="#030404" stop-opacity="0"/></radialGradient></defs>`
        + E(180, 225, 190, 170, `url(#${u}-murk)`);
      // 먼지와 김도 가장자리가 풀린 덮개로 그려 판 위에서 회색 사각형처럼 보이지 않게 합니다.
      if (m.k === 'dust' || m.k === 'fog') {
        const col = m.k === 'dust' ? '#d9d2bf' : '#dfe6e4';
        return `<defs><radialGradient id="${u}-haze" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${col}" stop-opacity=".96"/><stop offset=".7" stop-color="${col}" stop-opacity=".88"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs>`
          + E(180, 225, 176, 150, `url(#${u}-haze)`) + [[110, 170, 60], [230, 220, 70], [150, 290, 50]].map(([a, b, rr]) => E(a, b, rr, rr * .45, '#fff', 'opacity=".18"')).join('');
      }
      const f = ['#000', .6];
      const blobs = [[110, 170, 60], [230, 220, 70], [150, 290, 50]].map(([a, b, rr]) => E(a, b, rr, rr * .45, f[0], 'opacity=".5"')).join('');
      return R(36, 100, 288, 250, f[0], `opacity="${f[1]}" rx="6"`) + blobs;
    }
    case 'card': return R(40, 106, 288, 244, '#000', 'opacity=".35"') + R(36, 100, 288, 244, `url(#${u}-paper)`, 'stroke="#8d7c5a" stroke-width="1.5"') + C(180, 112, 4, '#9e3b30');
    case 'path': return pathArt(m);
    case 'plank': return R(m.x + 2, m.y + 5, m.w, 9, '#000', 'opacity=".35"') + R(m.x, m.y, m.w, 9, `url(#${u}-woodl)`, 'stroke="#22170d" stroke-width="1.5"');
    case 'item': return itemMark(u, m);
    case 'clock': return PROPS.clock(u, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2, { time: m.time, empty: m.time === null });
    case 'slot': return R(rd(m.x - m.s / 2), rd(m.y - m.s / 2), m.s, m.s, '#0b0c0b', 'rx="10" opacity=".72"') + R(rd(m.x - m.s / 2), rd(m.y - m.s / 2), m.s, m.s, 'none', 'rx="10" stroke="#cbb98d" stroke-opacity=".55" stroke-width="2" stroke-dasharray="6 5"');
    case 'plate': return R(m.x + 3, m.y + 5, m.w, m.h, '#000', 'opacity=".4" rx="8"') + R(m.x, m.y, m.w, m.h, `url(#${u}-${MATS[m.m] ?? 'wood'})`, 'rx="8" stroke="#1a140e" stroke-width="2"')
      + R(m.x + 10, m.y + 10, m.w - 20, m.h - 20, 'none', 'rx="4" stroke="#000" stroke-opacity=".3" stroke-width="2"') + [[14, 14], [m.w - 14, 14], [14, m.h - 14], [m.w - 14, m.h - 14]].map(([a, b]) => C(m.x + a, m.y + b, 4, '#a7a99f', 'stroke="#2a2e2b" stroke-width="1.5"')).join('');
    case 'inside': return R(m.x + 3, m.y + 5, m.w, m.h, '#000', 'opacity=".4" rx="6"') + R(m.x, m.y, m.w, m.h, `url(#${u}-${MATS[m.m] ?? 'wood'})`, 'rx="6" stroke="#1a140e" stroke-width="2"')
      + R(m.x + 16, m.y + 16, m.w - 32, m.h - 32, '#2a2118') + R(m.x + 40, m.y + 40, m.w - 80, m.h - 80, '#33281c') + R(m.x + 16, m.y + 16, m.w - 32, 30, '#000', 'opacity=".35"')
      + R(m.x + 16, m.y + m.h * .55, m.w - 32, 8, `url(#${u}-woodl)`) + R(m.x + 16, m.y + m.h * .55 + 8, m.w - 32, 10, '#000', 'opacity=".3"') + L(m.x + 18, m.y + 18, m.x + 40, m.y + 40, '#000', 2, 'opacity=".4"') + L(m.x + m.w - 18, m.y + 18, m.x + m.w - 40, m.y + 40, '#000', 2, 'opacity=".4"');
    default: return '';
  }
}
function kitView(u, room, viewId, is) {
  const v = room.views[viewId];
  const ok = conds => (conds ?? []).every(is);
  // 장면(scene)이 있는 방은 이야기에 맞는 배경을, 없는 방은 예전 벽과 바닥을 그립니다.
  const sc = room.scene;
  // 층 나누기(DESIGN_v7.md): 장면 배경과 상태가 없는 소품은 판에 굽고, 시계처럼 정답을 담은 소품과 표시(marks)는 코드로,
  // 상태에 따라 바뀌는 소품과 판자(plate, inside)는 처음과 달라졌을 때만 조각이나 SVG로 얹습니다.
  let out = bg(v.kind === 'wall' ? (sc ? sceneView(u, sc, ['north', 'east', 'south', 'west'].indexOf(viewId)) : wallBase(u, { floor: 368, brick: room.brick }))
    : (sc ? sceneZoom(u, sc, v.tone) : zoomBase(u, v.tone ?? 'wall')));
  (v.props ?? []).forEach((p, i) => {
    if (!ok(p.if) || !PROPS[p.kind]) return;
    const drawAt = at => PROPS[p.kind](u, p.x, p.y, p.w, p.h, { on: p.on ? at(p.on) : false, empty: p.empty ? at(p.empty) : false, frost: p.frost ? at(p.frost) : false, tone: p.bloom && !at(p.bloom) ? undefined : p.tone, time: p.time, blank: p.blank });
    const draw = () => drawAt(is);
    const conds = propConds(p);
    // 시계는 바늘이 정답이거나 정답처럼 읽힐 수 있어서 늘 코드로 그립니다(판에는 시계를 그리지 않음).
    if (p.time !== undefined || p.kind === 'clock') out += fg(draw());
    // 판 위에서 조각 그림이 없는 소품은 SVG로 다시 그리지 않습니다(판의 물건과 겹쳐 두 개로 보임). 출구만 열린 모습을 그립니다.
    else if (conds.length) out += swAll(kitPatchKey('p', i), conds, draw, KIT_EXITS.has(p.kind) ? () => drawAt(LAYER.mode === 'over' ? LAYER.fresh : is) : () => draw());
    else out += bg(draw());
  });
  (v.marks ?? []).forEach(m => {
    if (m.t === 'plate' || m.t === 'inside') { out += swAll(kitPatchKey('m', `${m.x}_${m.y}`), m.if ?? [], () => (ok(m.if) ? kitMark(u, m) : '')); return; }
    if (ok(m.if)) out += fg(kitMark(u, m));
  });
  // 불이 꺼진 방은 장면 전체를 어둡게 덮습니다. 불을 켜면 덮개가 사라집니다. 판에는 불이 켜진 모습을 굽습니다.
  if (room.dark && !is(room.dark)) out += fg(R(0, 0, VIEW_W, VIEW_H, '#020303', `opacity="${v.kind === 'wall' ? .48 : .36}"`));
  return out;
}
const kitItem = id => {
  const [base, ...rest] = String(id).split('_');
  const f = ITEM_ART[base];
  if (!f) return null;
  const tone = rest.find(x => MUTED[x]);
  return u => f(u, tone);
};

const ITEMS = {
  blade: () => bladeArt(14, 42, 17, -40),
  handle: () => handleArt(32, 32, 14, -40),
  driver: () => `<g transform="translate(22 42) rotate(-40)">${R(-16, -4.6, 26, 9.2, '#d8a93a', 'rx="4" stroke="#7a5a18" stroke-width="2"')}${[-9, -4, 1, 6].map(x => L(x, -3.8, x, 3.8, '#9b7322', 1.6)).join('')}${R(10, -2.4, 5, 4.8, '#6a6d66')}${R(15, -2, 22, 4, '#b9bcb4', 'stroke="#55594f" stroke-width="1.2"')}${P('M37 -2L41 -.8V.8L37 2Z', '#d9dbd3', 'stroke="#55594f" stroke-width="1"')}</g>`,
  'film-l': u => filmStrip(u, 12, 18, 36, 28, true, 'right'),
  'film-r': u => filmStrip(u, 16, 18, 36, 28, true, 'left'),
  film: u => filmStrip(u, 6, 18, 52, 28, true),
  bulb: u => bulbArt(32, 26, 13, false, u),
  key: u => keyArt(28, 32, 12, u),
  manuscript: u => bundle(u, 12, 14, 40, 34, false),
  tongs: () => `<g transform="translate(12 44) rotate(-32) scale(.85)">${tongsArt()}</g>`,
  negative: u => `<g transform="rotate(-12 32 32)">${filmStrip(u, 6, 20, 52, 24, true, null, `url(#${u}-neg)`)}</g>`,
  paper: () => R(14, 12, 36, 44, '#000', 'opacity=".3"') + R(12, 10, 36, 44, '#f7f5ee', 'stroke="#b9b3a2" stroke-width="1.5"') + P('M38 10H48V20Z', '#ddd8c9'),
  exposed: () => R(14, 12, 36, 44, '#000', 'opacity=".3"') + R(12, 10, 36, 44, '#f1ede2', 'stroke="#b9b3a2" stroke-width="1.5"') + R(16, 16, 28, 26, '#cfc8b8', 'opacity=".7"') + C(24, 28, 3, '#b6ad99') + C(34, 28, 3, '#b6ad99'),
  photo: () => `<g transform="rotate(-4 32 32)">${R(6, 14, 54, 40, '#000', 'opacity=".35"')}${groupPhoto(4, 12, 54, 40, true)}</g>`,
  memo: () => memoArt(10, 14, 44, 36, -6),
  bookmark: () => `<g transform="rotate(-18 32 32)">${ribbon(26, 6, 12)}</g>`,
  roller: () => rollerArt(32, 30, 20, false),
  ink: () => inkTin(32, 30, 20),
  inked: () => rollerArt(32, 30, 20, true),
  type1: () => `<g transform="rotate(-20 32 32)">${typeBlock(6, 22, 52, 20)}</g>`,
  type2: () => `<g transform="rotate(-20 32 32)">${typeBlock(6, 22, 52, 20, true)}</g>`,
  nameline: () => `<g transform="rotate(-20 32 32)">${typeBlock(6, 14, 52, 16)}${typeBlock(6, 32, 52, 16, true)}${L(12, 12, 12, 52, '#9e3b30', 2)}${L(52, 12, 52, 52, '#9e3b30', 2)}</g>`,
  cover: () => `<g transform="rotate(-6 32 32)">${coverArt(12, 8, 40, 50)}</g>`,
};
const ARTS = { library, darkroom, pressroom };
const itemArt = id => ITEMS[id] ?? kitItem(id) ?? (id.startsWith('memo') ? ITEMS.memo : null);

// 그림 판(plate) 목록입니다. 앱이 판 그림을 미리 불러온 뒤 setPlates로 넣습니다. 목록에 없으면 지금처럼 SVG로만 그립니다.
// 형식: { [방 id]: { [시점]: { src, patches: { [조각 이름]: { src, rect: [x, y, w, h] } } } } }
let PLATES = {};
export function setPlates(map) { PLATES = map && typeof map === 'object' ? map : {}; }
export const plateFor = (room, viewId) => PLATES[room?.id]?.[viewId] ?? null;

// opts.layer: 'bake'는 판을 만들 입력 그림(굽는 부분만), 'full'은 판을 무시하고 SVG로만 그립니다.
export function drawView(room, viewId, s, label = '', opts = {}) {
  const u = `a${++seq}`;
  const art = ARTS[room.art] ?? library;
  const state = { ...s, room };
  const is = cond => check(cond, state);
  const plate = opts.layer === 'bake' || opts.layer === 'full' ? null : plateFor(room, viewId);
  const mode = opts.layer === 'bake' ? 'bake' : plate ? 'over' : 'full';
  const fresh = { ...freshState(room), room };
  const used = new Set();
  // 판 조각은 판과 같은 층(덧그림 필터 밖)에 얹습니다. 같은 조각은 한 장면에 한 번만 얹고,
  // 조각이 있으면 빈 문자열을 돌려줘 SVG 대체를 막습니다.
  let patchLayer = '';
  const patchImage = (key, now) => {
    const p = now ? plate?.patches?.[key] : null;
    if (!p) return null;
    if (!used.has(key)) { used.add(key); patchLayer += `<image href="${p.src}" x="${p.rect[0]}" y="${p.rect[1]}" width="${p.rect[2]}" height="${p.rect[3]}" preserveAspectRatio="none"/>`; }
    return '';
  };
  const prev = LAYER;
  LAYER = { mode, is, fresh: cond => check(cond, fresh), patch: patchImage };
  let scene;
  try { scene = room.art === 'kit' ? kitView(u, room, viewId, is) : art[viewId]?.(u, state, is) ?? zoomBase(u); }
  finally { LAYER = prev; }
  const base = plate ? `<image href="${plate.src}" x="0" y="0" width="${VIEW_W}" height="${VIEW_H}" preserveAspectRatio="none"/>` : '';
  // 판 위에 덧그리는 층은 채도와 밝기를 조금 낮추고 그림자를 넣어 그림 속 조명에 맞춥니다. 정답 색은 그대로 구분됩니다.
  const matte = plate ? `<defs><filter id="${u}-matte" x="-5%" y="-5%" width="110%" height="110%"><feColorMatrix type="saturate" values=".82"/><feComponentTransfer><feFuncR type="linear" slope=".9"/><feFuncG type="linear" slope=".88"/><feFuncB type="linear" slope=".84"/></feComponentTransfer><feDropShadow dx="0" dy="1.4" stdDeviation="1.4" flood-color="#000" flood-opacity=".55"/></filter></defs>` : '';
  const sceneLayer = plate ? `${matte}<g filter="url(#${u}-matte)">${scene}</g>` : scene;
  let body = base + patchLayer + sceneLayer + (mode === 'bake' ? '' : lockArt(u, room, viewId, state));
  // 붉은 안전등이 켜지면 방 전체를 어둡고 붉게 덮습니다. 단서가 이 빛에서만 보이므로 빼지 않습니다.
  if (mode !== 'bake' && room.art === 'darkroom' && is('red')) body += R(0, 0, VIEW_W, VIEW_H, '#9c2216', 'style="mix-blend-mode:multiply" opacity=".62"');
  const role = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  // 판에는 조명과 가장자리 어둠이 이미 그려져 있어서, 판을 쓸 때와 구울 때는 비네트를 겹치지 않습니다.
  const vig = mode === 'full' ? R(0, 0, VIEW_W, VIEW_H, `url(#${u}-vig)`, 'pointer-events="none"') : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" preserveAspectRatio="xMidYMid meet" ${role} focusable="false" data-layer="${mode}">${defs(u, PALETTE[room.tone] ?? PALETTE[room.art] ?? PALETTE.library)}${body}${vig}</svg>`;
}
export function drawItem(id, label = '') {
  const u = `i${++seq}`;
  const body = itemArt(id)?.(u) ?? C(32, 32, 14, '#a9ada1');
  const role = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" ${role} focusable="false">${defs(u)}${body}</svg>`;
}
export const roomTone = room => PALETTE[room?.tone] ?? PALETTE[room?.art] ?? PALETTE.library;
export const hasArt = (room, viewId) => (room.art === 'kit' ? !!room.views?.[viewId] : typeof (ARTS[room.art] ?? {})[viewId] === 'function');
export const hasItemArt = id => typeof itemArt(id) === 'function';
