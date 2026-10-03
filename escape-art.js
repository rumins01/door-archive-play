// 방탈출 장면과 아이템 그림입니다. 상태를 받아 SVG 문자열만 돌려주므로 브라우저, 앱, 테스트에서 같이 씁니다.
import { check, cleanInput, lockControls, VIEW_W, VIEW_H } from './escape-engine.js';

export const COLORS = { red: '#b8483a', blue: '#3f6d9c', green: '#4d8757', yellow: '#d6ab3f' };
export const COLOR_NAMES = { red: '빨강', blue: '파랑', green: '초록', yellow: '노랑' };
export const DIRECTION_NAMES = { up: '위', right: '오른쪽', down: '아래', left: '왼쪽' };
// 색을 구분하기 어려운 사람도 같은 색을 찾을 수 있게 색마다 무늬를 함께 씁니다.
const PATTERN = { red: 'dots', blue: 'lines', green: 'diag', yellow: null };
const NUM_FONT = 'font-family="Georgia, \'Times New Roman\', serif"';

let seq = 0;
const R = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const C = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const E = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const P = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const L = (x1, y1, x2, y2, stroke, w = 1, extra = '') => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${stroke}" stroke-width="${w}" fill="none" ${extra}/>`;
const T = (x, y, text, size, fill, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="middle" dominant-baseline="central" ${extra}>${text}</text>`;
const pol = (cx, cy, len, deg) => [cx + len * Math.sin(deg * Math.PI / 180), cy - len * Math.cos(deg * Math.PI / 180)];

function defs(u) {
  const lin = (id, stops, attrs = 'x2="0" y2="1"') => `<linearGradient id="${u}-${id}" ${attrs}>${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  return `<defs>
    ${lin('wall', [[0, '#2f3829'], [1, '#1a2119']])}
    ${lin('floor', [[0, '#4b3a27'], [1, '#1e160d']])}
    ${lin('wood', [[0, '#76583a'], [.5, '#55402a'], [1, '#3a2b1b']])}
    ${lin('woodl', [[0, '#93714a'], [1, '#634a30']])}
    ${lin('brass', [[0, '#6e5a36'], [.45, '#e2c588'], [.6, '#a98c55'], [1, '#5f4c2c']], 'x2="1" y2="1"')}
    ${lin('steel', [[0, '#5b6661'], [.5, '#3c4542'], [1, '#262d2a']], 'x2="1" y2="1"')}
    ${lin('paper', [[0, '#efe5cc'], [1, '#cdbf9b']])}
    ${lin('night', [[0, '#0d1822'], [1, '#253c4c']])}
    ${lin('shade', [[0, '#3f6b4a'], [1, '#1f3d29']])}
    ${lin('film', [[0, '#1b1a18'], [1, '#2c2a26']])}
    ${lin('hall', [[0, '#f6d999'], [1, '#8a6a3a']])}
    <radialGradient id="${u}-glow"><stop offset="0" stop-color="#ffd98f" stop-opacity=".75"/><stop offset=".5" stop-color="#ffcf7a" stop-opacity=".22"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
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
function clockFace(u, cx, cy, Rr, numerals) {
  let out = C(cx, cy + Rr * .04, Rr * 1.02, '#000', 'opacity=".35"') + C(cx, cy, Rr, `url(#${u}-brass)`) + C(cx, cy, Rr * .9, '#2a221a') + C(cx, cy, Rr * .85, `url(#${u}-paper)`);
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0;
    if (!big && !numerals) continue;
    const [x1, y1] = pol(cx, cy, Rr * (big ? .7 : .76), i * 6), [x2, y2] = pol(cx, cy, Rr * .8, i * 6);
    out += L(x1.toFixed(1), y1.toFixed(1), x2.toFixed(1), y2.toFixed(1), '#3a2f22', big ? Rr * .035 : Rr * .012);
  }
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
function filmStrip(u, x, y, w, h, holes = true, cut = null) {
  let out = R(x, y, w, h, `url(#${u}-film)`, 'rx="2"');
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

function wallBase(u) {
  let out = R(0, 0, VIEW_W, VIEW_H, `url(#${u}-wall)`);
  for (let x = 12; x < VIEW_W; x += 24) out += L(x, 0, x, 384, '#fff', 1, 'opacity=".025"');
  out += R(0, 388, VIEW_W, 92, `url(#${u}-floor)`) + R(0, 382, VIEW_W, 9, '#140f09');
  for (let i = 0; i < 6; i++) out += L(-40 + i * 90, 480, 40 + i * 60, 391, '#000', 1.5, 'opacity=".25"');
  return out;
}
function zoomBase(u, tone = 'wall') {
  const fill = tone === 'wood' ? `url(#${u}-wood)` : tone === 'dark' ? '#121512' : `url(#${u}-wall)`;
  return R(0, 0, VIEW_W, VIEW_H, fill) + R(0, 0, VIEW_W, VIEW_H, '#000', 'opacity=".25"');
}

// 상태에 따라 바뀌는 사서의 방 장면입니다.
const library = {
  north(u, s, is) {
    let out = wallBase(u) + E(180, 438, 170, 30, '#3a1f1a', 'opacity=".75"') + E(180, 438, 150, 24, '#5a2c22', 'opacity=".6"');
    out += clockFace(u, 180, 72, 42, false);
    out += R(110, 120, 140, 272, '#3a2a19') + R(114, 124, 132, 266, '#20170f');
    if (is('door-open')) {
      out += R(120, 130, 120, 260, `url(#${u}-hall)`) + P('M120 130L150 140V384L120 392Z', `url(#${u}-wood)`, 'stroke="#2a1c10" stroke-width="2"')
        + P('M120 390H240L300 480H60Z', '#f3d38c', 'opacity=".22"') + R(150, 150, 70, 190, '#fff', 'opacity=".08"');
    } else {
      out += R(120, 130, 120, 260, `url(#${u}-wood)`, 'stroke="#2a1c10" stroke-width="2"')
        + R(132, 144, 96, 104, 'none', 'stroke="#2a1c10" stroke-width="3" opacity=".7"') + R(132, 262, 96, 112, 'none', 'stroke="#2a1c10" stroke-width="3" opacity=".7"')
        + C(224, 254, 7, `url(#${u}-brass)`) + R(217, 266, 14, 26, `url(#${u}-brass)`, 'rx="3"') + C(224, 275, 3, '#120d08') + R(223, 276, 2, 8, '#120d08');
    }
    out += R(10, 318, 108, 74, `url(#${u}-wood)`, 'stroke="#2a1c10" stroke-width="2"') + L(14, 354, 114, 354, '#2a1c10', 2) + C(64, 336, 3, `url(#${u}-brass)`) + C(64, 372, 3, `url(#${u}-brass)`);
    out += R(18, 232, 92, 86, `url(#${u}-steel)`, 'rx="4" stroke="#1b201e" stroke-width="2"');
    if (is('open:safe')) {
      out += R(26, 240, 76, 70, '#0d0f0e') + P('M26 240L12 246V306L26 310Z', '#4a5450', 'stroke="#1b201e" stroke-width="1.5"');
      if (!is('got:key')) out += bundle(u, 38, 262, 50, 40, true);
    } else {
      out += R(26, 240, 76, 70, 'none', 'stroke="#1b201e" stroke-width="2"') + R(20, 248, 5, 12, '#1b201e') + R(20, 290, 5, 12, '#1b201e') + R(92, 262, 6, 26, `url(#${u}-brass)`, 'rx="3"') + filmIcon(60, 252, 34, 14, '#c9b27a')
        + arrow('up', 64, 268, 5, '#c9b27a') + arrow('down', 64, 292, 5, '#c9b27a') + arrow('left', 52, 280, 5, '#c9b27a') + arrow('right', 76, 280, 5, '#c9b27a')
        + [0, 1, 2, 3].map(i => C(52 + i * 8, 303, 2.2, '#4b4436')).join('');
    }
    out += L(318, 112, 318, 386, `url(#${u}-wood)`, 6) + P('M300 388L336 388L318 378Z', '#2a1c10') + L(304, 118, 332, 118, '#3a2a19', 4)
      + P('M298 128Q318 116 338 128L346 268Q318 280 290 268Z', '#2f4436', 'stroke="#1a261d" stroke-width="2"') + P('M318 126L312 200L318 268L324 200Z', '#253629');
    return out;
  },
  east(u, s, is) {
    let out = wallBase(u) + R(24, 20, 312, 376, `url(#${u}-wood)`, 'stroke="#22170d" stroke-width="3"') + R(34, 30, 292, 354, '#1b1510');
    out += R(30, 156, 300, 8, `url(#${u}-woodl)`) + R(30, 272, 300, 8, `url(#${u}-woodl)`) + R(30, 384, 300, 8, `url(#${u}-woodl)`);
    out += filler(u, 36, 214, 156, 96, 1) + filler(u, 266, 326, 156, 92, 5);
    if (is('book-pulled')) out += R(222, 70, 36, 86, '#120e0a') + E(240, 154, 14, 2, '#5a4a36', 'opacity=".6"');
    // 튀어나온 책은 옆면과 그림자를 그려 다른 책보다 앞으로 나와 보이게 합니다.
    else out += R(212, 154, 50, 6, '#000', 'opacity=".45"') + P('M222 62L212 70V160L222 156Z', '#5b2e1e') + P('M222 62L212 70H246L256 62Z', '#c39a62') + spine(u, 222, 62, 34, 94, '#9a5234') + R(250, 62, 6, 94, '#000', 'opacity=".22"') + R(228, 84, 22, 4, '#e2c588', 'opacity=".7"') + R(228, 132, 22, 4, '#e2c588', 'opacity=".7"');
    const mid = [['#6b4a33', null], ['yellow', 'diamond'], ['#4b5446', null], ['red', 'circle'], ['blue', 'triangle'], ['#5a3f2c', null], ['green', 'square'], ['#3f3a35', null]];
    mid.forEach(([color, mark], i) => { const h = 92 - ((i * 11) % 14); out += spine(u, 42 + i * 35.5, 272 - h, 32, h, color, mark); });
    out += [0, 1, 2].map(i => R(44 + i * 4, 362 - i * 18, 128 - i * 12, 16, TONES[i + 2], 'rx="2" stroke="#120e0a"')).join('');
    out += R(196, 314, 110, 70, `url(#${u}-woodl)`, 'stroke="#2a1c10" stroke-width="2"');
    if (is('open:box')) out += P('M196 314L204 294H298L306 314Z', '#2a1f14', 'stroke="#2a1c10" stroke-width="2"') + R(200, 300, 102, 14, '#0e0b08');
    else out += P('M196 314L202 302H300L306 314Z', `url(#${u}-wood)`, 'stroke="#2a1c10" stroke-width="2"') + bookIcon(251, 333, 9, '#3a2a19');
    const boxDraft = is('open:box') ? s.room.locks.box.answer : cleanInput(s.room.locks.box, s.drafts.box);
    boxDraft.forEach((color, i) => { out += swatch(u, color, fill => C(224 + i * 18, 362, 6.5, fill, 'stroke="#2a1c10" stroke-width="1.5"')); });
    return out;
  },
  south(u, s, is) {
    let out = wallBase(u);
    if (is('projected')) {
      out += P('M126 168L176 104H344V216H176Z', '#ffe1a0', 'opacity=".12"') + R(176, 104, 168, 112, '#f2d9a2', 'opacity=".85" rx="3"');
      for (let i = 0; i < 6; i++) out += R(184 + i * 26, 110, 12, 7, '#8a7651', 'opacity=".55"') + R(184 + i * 26, 203, 12, 7, '#8a7651', 'opacity=".55"');
      ['right', 'up', 'right', 'down'].forEach((dir, i) => { out += arrow(dir, 202 + i * 39, 160, 15, '#3a2a19'); });
    }
    if (is('lamp-on')) out += C(86, 214, 90, `url(#${u}-glow)`) + P('M44 212H128L170 292H8Z', '#ffd98f', 'opacity=".14"');
    out += R(6, 288, 348, 18, `url(#${u}-woodl)`, 'stroke="#2a1c10" stroke-width="2"') + R(14, 306, 332, 86, `url(#${u}-wood)`, 'stroke="#2a1c10" stroke-width="2"');
    out += R(24, 316, 78, 30, 'none', 'stroke="#2a1c10" stroke-width="2"') + R(24, 352, 78, 30, 'none', 'stroke="#2a1c10" stroke-width="2"') + R(258, 316, 78, 30, 'none', 'stroke="#2a1c10" stroke-width="2"') + R(258, 352, 78, 30, 'none', 'stroke="#2a1c10" stroke-width="2"');
    out += [[63, 331], [63, 367], [297, 331], [297, 367]].map(([x, y]) => C(x, y, 3, `url(#${u}-brass)`)).join('');
    if (is('open:drawer')) out += R(116, 312, 128, 10, '#0c0906') + R(112, 320, 136, 72, `url(#${u}-woodl)`, 'stroke="#2a1c10" stroke-width="2"');
    else out += R(116, 312, 128, 76, `url(#${u}-woodl)`, 'stroke="#2a1c10" stroke-width="2"');
    const top = is('open:drawer') ? 8 : 0;
    out += alarmIcon(180, 324 + top, 5, '#3a2a19');
    (is('open:drawer') ? s.room.locks.drawer.answer : cleanInput(s.room.locks.drawer, s.drafts.drawer)).forEach((n, i) => { out += R(146 + i * 24, 338 + top, 20, 24, '#efe5cc', 'stroke="#2a1c10" stroke-width="2" rx="2"') + T(156 + i * 24, 350 + top, n, 15, '#2a1c10', NUM_FONT); });
    out += R(160, 372 + top, 40, 6, `url(#${u}-brass)`, 'rx="3"');
    out += E(86, 292, 34, 7, `url(#${u}-brass)`) + R(83, 208, 6, 84, `url(#${u}-brass)`);
    if (is('lamp-on')) out += `<g transform="rotate(180 86 225)">${bulbArt(86, 225, 9, true, u)}</g>`;
    out += P('M62 152H110L138 210H34Z', `url(#${u}-shade)`, 'stroke="#1a2e20" stroke-width="2"') + R(32, 208, 108, 6, `url(#${u}-brass)`, 'rx="2"');
    if (is('projected')) out += R(42, 214, 88, 14, `url(#${u}-film)`, 'opacity=".9"');
    out += R(266, 278, 64, 10, '#e2d5b4', 'transform="rotate(-4 298 283)"') + R(270, 272, 60, 10, '#cbbd98', 'transform="rotate(3 300 277)"') + C(232, 280, 8, '#1d2a31') + R(229, 266, 6, 8, '#1d2a31');
    return out;
  },
  west(u, s, is) {
    let out = wallBase(u);
    out += R(162, 46, 164, 196, `url(#${u}-wood)`, 'stroke="#22170d" stroke-width="3"') + R(172, 56, 144, 176, `url(#${u}-night)`);
    for (let i = 0; i < 16; i++) { const x = 176 + ((i * 37) % 136), y = 62 + ((i * 53) % 150); out += L(x, y, x - 6, y + 18, '#9fb7c6', 1.2, 'opacity=".45"'); }
    out += P('M172 92Q200 74 236 88Q262 70 300 84Q316 86 316 96V56H172Z', '#1b2833') + L(244, 56, 244, 232, `url(#${u}-wood)`, 6) + L(172, 144, 316, 144, `url(#${u}-wood)`, 6);
    out += R(156, 240, 176, 10, `url(#${u}-woodl)`);
    out += C(80, 70, 4, '#9e3b30') + R(22, 70, 116, 164, `url(#${u}-paper)`, 'transform="rotate(-1.5 80 152)" stroke="#8d7c5a" stroke-width="1.5"');
    out += bookIcon(80, 92, 11, '#4a3a26');
    ['triangle', 'square', 'circle', 'diamond'].forEach((kind, i) => { const y = 124 + i * 28; out += T(56, y, i + 1, 18, '#3a2f22', NUM_FONT) + shape(kind, 102, y, 8, '#3a2f22'); });
    out += R(146, 284, 164, 96, '#000', 'opacity=".25"');
    if (is('panel-open')) {
      out += R(152, 290, 152, 84, '#0b0d0c', 'stroke="#2a2e2b" stroke-width="2"') + R(160, 300, 136, 64, '#171310');
      if (!is('got:bulb')) out += C(198, 336, 9, '#e9eef0', 'opacity=".55"');
      if (!is('got:film-r')) out += R(240, 330, 34, 18, `url(#${u}-film)`);
      out += P('M306 300L330 296L334 388L310 390Z', `url(#${u}-steel)`, 'stroke="#1b201e" stroke-width="1.5"');
    } else {
      out += R(152, 290, 152, 84, `url(#${u}-steel)`, 'rx="3" stroke="#1b201e" stroke-width="2"');
      for (let y = 304; y < 364; y += 10) out += R(170, y, 116, 4, '#151a18', 'rx="2"');
      out += screw(162, 300, 5) + screw(294, 300, 5) + screw(162, 364, 5) + screw(294, 364, 5);
    }
    return out;
  },
  clock(u) {
    return zoomBase(u) + clockFace(u, 180, 212, 150, true);
  },
  safe(u, s, is) {
    let out = zoomBase(u, 'dark') + R(30, 34, 300, 372, `url(#${u}-steel)`, 'rx="10" stroke="#151a18" stroke-width="3"');
    if (is('open:safe')) {
      out += R(54, 60, 252, 320, '#0b0c0b', 'rx="4"') + R(54, 300, 252, 8, '#2a302d') + P('M54 60L14 74V368L54 380Z', '#46504c', 'stroke="#151a18" stroke-width="2"');
      if (!is('got:key')) out += bundle(u, 100, 180, 160, 116, true);
      return out;
    }
    out += R(48, 52, 264, 336, 'none', 'stroke="#151a18" stroke-width="3" rx="6"') + R(20, 92, 12, 48, '#1b201e', 'rx="3"') + R(20, 300, 12, 48, '#1b201e', 'rx="3"') + R(300, 176, 16, 76, `url(#${u}-brass)`, 'rx="6" stroke="#3b2f1a" stroke-width="2"') + filmIcon(180, 82, 120, 40, '#d4bb82');
    const lock = s.room.locks.safe;
    const [px, py] = lock.at[0];
    out += C(px, py, 100, '#1f2422', 'stroke="#59625d" stroke-width="3"') + C(px, py, 22, `url(#${u}-brass)`);
    for (const c of lockControls(lock)) {
      const x = c.x + c.w / 2, y = c.y + c.h / 2;
      out += R(x - 25, y - 25, 50, 50, `url(#${u}-brass)`, 'rx="10" stroke="#3b2f1a" stroke-width="2"') + arrow(c.dir, x, y, 13, '#2a2118');
    }
    const lit = cleanInput(lock, s.drafts.safe).length;
    const [lx, ly] = lock.lights;
    lock.answer.forEach((_, i) => { out += C(lx + (i - (lock.answer.length - 1) / 2) * 28, ly, 8, i < lit ? '#f2cf7c' : '#2a2e2b', 'stroke="#151a18" stroke-width="2"'); });
    return out;
  },
  books(u) {
    let out = zoomBase(u, 'dark') + R(0, 396, VIEW_W, 20, `url(#${u}-woodl)`);
    const set = [['#6b4a33', null], ['yellow', 'diamond'], ['#4b5446', null], ['red', 'circle'], ['blue', 'triangle'], ['#5a3f2c', null], ['green', 'square'], ['#3f3a35', null]];
    set.forEach(([color, mark], i) => { const h = 320 - ((i * 23) % 40); out += spine(u, 14 + i * 42, 396 - h, 38, h, color, mark); });
    return out;
  },
  box(u, s, is) {
    let out = zoomBase(u, 'dark');
    if (is('open:box')) {
      out += P('M38 96L60 16H300L322 96Z', '#2a1f14', 'stroke="#140e08" stroke-width="3"') + R(30, 96, 300, 80, '#0d0a07', 'stroke="#140e08" stroke-width="3"');
      if (!is('got:film-l')) out += filmStrip(u, 124, 118, 112, 46, true, 'right');
    } else {
      out += P('M30 170L54 70H306L330 170Z', `url(#${u}-wood)`, 'stroke="#140e08" stroke-width="3"') + bookIcon(180, 120, 30, '#2a1c10');
    }
    out += R(30, 170, 300, 236, `url(#${u}-woodl)`, 'stroke="#140e08" stroke-width="3"') + R(44, 214, 272, 108, '#3a2a19', 'rx="8"');
    const draft = cleanInput(s.room.locks.box, s.drafts.box);
    s.room.locks.box.at.forEach(([x, y], i) => { out += C(x, y + 3, 26, '#000', 'opacity=".4"') + C(x, y, 26, `url(#${u}-brass)`) + swatch(u, draft[i], fill => C(x, y, 20, fill)); });
    return out;
  },
  drawer(u, s, is) {
    let out = zoomBase(u, 'dark');
    const lock = s.room.locks.drawer;
    if (is('open:drawer')) {
      out += R(36, 150, 288, 190, '#2a1f14', 'stroke="#140e08" stroke-width="3"') + R(48, 162, 264, 166, '#1a130c');
      if (!is('got:handle')) out += handleArt(180, 260, 40, -8);
      out += R(24, 336, 312, 80, `url(#${u}-woodl)`, 'stroke="#140e08" stroke-width="3"') + R(140, 366, 80, 12, `url(#${u}-brass)`, 'rx="6"');
      return out;
    }
    out += R(24, 112, 312, 300, `url(#${u}-woodl)`, 'stroke="#140e08" stroke-width="3"') + R(40, 128, 280, 268, 'none', 'stroke="#3a2a19" stroke-width="2" opacity=".6"');
    out += alarmIcon(180, 152, 15, '#3a2a19');
    const draft = cleanInput(lock, s.drafts.drawer);
    lock.at.forEach(([x, y], i) => {
      out += P(`M${x - 13} ${y - 30}L${x} ${y - 43}L${x + 13} ${y - 30}`, 'none', 'stroke="#1e140a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"');
      out += P(`M${x - 13} ${y + 30}L${x} ${y + 43}L${x + 13} ${y + 30}`, 'none', 'stroke="#1e140a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"');
      out += R(x - 22, y - 22, 44, 44, '#efe5cc', 'stroke="#2a1c10" stroke-width="3" rx="4"') + T(x, y + 1, draft[i], 28, '#2a1c10', NUM_FONT);
    });
    out += R(140, 330, 80, 12, `url(#${u}-brass)`, 'rx="6"');
    return out;
  },
  poster(u) {
    let out = zoomBase(u) + R(40, 34, 280, 374, `url(#${u}-paper)`, 'stroke="#8d7c5a" stroke-width="2"') + C(180, 46, 6, '#9e3b30');
    out += bookIcon(180, 92, 30, '#4a3a26');
    ['triangle', 'square', 'circle', 'diamond'].forEach((kind, i) => { const y = 160 + i * 62; out += T(122, y, i + 1, 40, '#3a2f22', NUM_FONT) + shape(kind, 230, y, 20, '#3a2f22'); });
    return out;
  },
  panel(u, s, is) {
    let out = zoomBase(u);
    if (is('panel-open')) {
      out += R(36, 96, 288, 268, '#0b0d0c', 'stroke="#2a2e2b" stroke-width="3"');
      for (let y = 110; y < 360; y += 22) out += L(40, y, 320, y, '#1d1814', 2);
      if (!is('got:bulb')) out += bulbArt(120, 236, 30, false, u);
      if (!is('got:film-r')) out += filmStrip(u, 202, 238, 100, 46, true, 'left');
      return out;
    }
    out += R(36, 96, 288, 268, `url(#${u}-steel)`, 'rx="8" stroke="#151a18" stroke-width="3"');
    for (let y = 146; y < 326; y += 20) out += R(84, y, 192, 8, '#151a18', 'rx="4"');
    return out + screw(62, 122, 13) + screw(298, 122, 13) + screw(62, 338, 13) + screw(298, 338, 13);
  },
  lamp(u, s, is) {
    let out = zoomBase(u);
    if (is('projected')) {
      out += R(40, 20, 280, 74, '#f2d9a2', 'opacity=".9" rx="4"');
      for (let i = 0; i < 9; i++) out += R(50 + i * 30, 25, 14, 7, '#8a7651', 'opacity=".55"') + R(50 + i * 30, 82, 14, 7, '#8a7651', 'opacity=".55"');
      ['right', 'up', 'right', 'down'].forEach((dir, i) => { out += arrow(dir, 75 + i * 70, 57, 19, '#3a2a19'); });
      out += P('M110 104L40 94H320L250 104Z', '#ffe1a0', 'opacity=".25"');
    }
    const on = is('lamp-on');
    if (on) out += C(180, 296, 150, `url(#${u}-glow)`);
    out += R(176, 344, 8, 72, `url(#${u}-brass)`) + E(180, 418, 80, 14, `url(#${u}-brass)`);
    out += R(156, 240, 48, 26, `url(#${u}-brass)`, 'rx="4"') + R(164, 264, 32, 22, `url(#${u}-brass)`) + [0, 1, 2].map(i => L(164, 268 + i * 6, 196, 268 + i * 6, '#5a4a30', 2)).join('');
    if (on) out += `<g transform="rotate(180 180 318)">${bulbArt(180, 318, 26, true, u)}</g>`;
    // 전구가 없으면 소켓 구멍과 빈 전구 자리(점선)를 보여 줍니다.
    else out += E(180, 287, 16, 6, '#0b0906', 'stroke="#8a7146" stroke-width="2"') + C(180, 318, 24, 'none', 'stroke="#e9eef0" stroke-opacity=".55" stroke-width="2.5" stroke-dasharray="6 6"');
    out += P('M130 110H230L296 236H64Z', `url(#${u}-shade)`, 'stroke="#13241a" stroke-width="3"') + R(60, 232, 240, 12, `url(#${u}-brass)`, 'rx="4"');
    if (is('projected')) out += filmStrip(u, 92, 248, 176, 40, true);
    return out;
  },
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
};
const ARTS = { library };

export function drawView(room, viewId, s, label = '') {
  const u = `a${++seq}`;
  const art = ARTS[room.art] ?? library;
  const state = { ...s, room };
  const is = cond => check(cond, state);
  const body = art[viewId]?.(u, state, is) ?? zoomBase(u);
  const role = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" preserveAspectRatio="xMidYMid meet" ${role} focusable="false">${defs(u)}${body}${R(0, 0, VIEW_W, VIEW_H, `url(#${u}-vig)`, 'pointer-events="none"')}</svg>`;
}
export function drawItem(id, label = '') {
  const u = `i${++seq}`;
  const body = ITEMS[id]?.(u) ?? C(32, 32, 14, '#a9ada1');
  const role = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" ${role} focusable="false">${defs(u)}${body}</svg>`;
}
export const hasArt = (room, viewId) => typeof (ARTS[room.art] ?? library)[viewId] === 'function';
export const hasItemArt = id => typeof ITEMS[id] === 'function';
