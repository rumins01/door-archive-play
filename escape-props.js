// 생성 방(art: kit)의 가구와 벽 물건 그림입니다. 18시 기준 그림체처럼 그라데이션, 얇은 선, 평면 그림자만 쓰고 움직임은 없습니다.
// 모든 물건은 사각형(x, y, w, h) 안에 그려서 조사 영역과 그림이 같은 좌표를 씁니다.
export const r = v => Math.round(v * 10) / 10;
export const R = (x, y, w, h, f, e = '') => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" fill="${f}" ${e}/>`;
export const C = (x, y, rad, f, e = '') => `<circle cx="${r(x)}" cy="${r(y)}" r="${r(rad)}" fill="${f}" ${e}/>`;
export const E = (x, y, rx, ry, f, e = '') => `<ellipse cx="${r(x)}" cy="${r(y)}" rx="${r(rx)}" ry="${r(ry)}" fill="${f}" ${e}/>`;
export const P = (d, f, e = '') => `<path d="${d}" fill="${f}" ${e}/>`;
export const L = (x1, y1, x2, y2, s, w = 1, e = '') => `<path d="M${r(x1)} ${r(y1)}L${r(x2)} ${r(y2)}" stroke="${s}" stroke-width="${r(w)}" fill="none" ${e}/>`;
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const T = (x, y, t, size, f, e = '') => `<text x="${r(x)}" y="${r(y)}" font-size="${r(size)}" fill="${f}" text-anchor="middle" dominant-baseline="central" ${e}>${esc(t)}</text>`;
export const poly = (pts, f, e = '') => P('M' + pts.map(([a, b]) => `${r(a)} ${r(b)}`).join('L') + 'Z', f, e);
export const K = (u, n) => `url(#${u}-${n})`;
export const MUTED = { red: '#8e3b30', blue: '#3d5f80', green: '#46704f', yellow: '#b08a3a', white: '#cfc8b4', purple: '#5d4a6a' };
const W = 'stroke="#22170d" stroke-width="2"', S = 'stroke="#1b201e" stroke-width="2"', IN = 'stroke="#22170d" stroke-width="1.5" opacity=".6"';
const sh = (x, y, w, h) => (y + h > 320 ? E(x + w / 2, y + h + 3, w * .55, 6, '#060807', 'opacity=".42"') : '');
const knob = (u, x, y, s = 3) => C(x, y, s, K(u, 'brass'));
const DK = '#0d0a07';
const hollow = (x, y, w, h) => R(x, y, w, h, '#241b13') + R(x + w * .12, y + h * .12, w * .76, h * .76, '#2e2318') + R(x, y, w, h * .3, '#000', 'opacity=".35"') + R(x + 3, y + h * .55, w - 6, 4, '#3a2b1b') + L(x, y + h - 1, x + w, y + h - 1, '#5a442c', 2, 'opacity=".6"');
const swing = (x, y, h, d, fill, st) => poly([[x, y], [x - d, y + 10], [x - d, y + h - 10], [x, y + h]], fill, st);
const frame = (u, x, y, w, h, inner) => R(x + 3, y + 4, w, h, '#000', 'opacity=".3"') + R(x, y, w, h, K(u, 'wood'), W) + R(x + 7, y + 7, w - 14, h - 14, inner);
const hands = (cx, cy, R0, t) => {
  const [hh, mm] = String(t ?? '10:10').split(':').map(Number);
  const ha = ((hh % 12) + mm / 60) * Math.PI / 6, ma = mm * Math.PI / 30;
  return L(cx, cy, cx + Math.sin(ha) * R0 * .45, cy - Math.cos(ha) * R0 * .45, '#1d1812', R0 * .09, 'stroke-linecap="round"') + L(cx, cy, cx + Math.sin(ma) * R0 * .68, cy - Math.cos(ma) * R0 * .68, '#1d1812', R0 * .055, 'stroke-linecap="round"');
};
export function clockFace(u, cx, cy, R0, t, numerals = false) {
  let s = C(cx + 3, cy + 4, R0, '#000', 'opacity=".35"') + C(cx, cy, R0, K(u, 'brass')) + C(cx, cy, R0 * .86, K(u, 'paper'));
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    s += L(cx + Math.sin(a) * R0 * .7, cy - Math.cos(a) * R0 * .7, cx + Math.sin(a) * R0 * .8, cy - Math.cos(a) * R0 * .8, '#3a2f22', R0 * .04);
    if (numerals) s += T(cx + Math.sin(a) * R0 * .56, cy - Math.cos(a) * R0 * .56, i || 12, R0 * .15, '#3a2f22', 'font-family="Georgia, serif"');
  }
  return s + (t === null ? '' : hands(cx, cy, R0, t)) + C(cx, cy, R0 * .06, K(u, 'brass'));
}

export const PROPS = {
  cabinet(u, x, y, w, h, o) {
    const s = sh(x, y, w, h) + R(x, y, w, h, K(u, 'wood'), W), m = x + w / 2;
    if (o.on) return s + hollow(x + 6, y + 6, w - 12, h - 12) + swing(x + 6, y + 6, h - 12, w * .2, K(u, 'woodl'), W);
    return s + L(m, y + 5, m, y + h - 5, '#22170d', 2) + R(x + 8, y + 8, w / 2 - 14, h - 16, 'none', IN) + R(m + 6, y + 8, w / 2 - 14, h - 16, 'none', IN) + knob(u, m - 6, y + h / 2) + knob(u, m + 6, y + h / 2);
  },
  safe(u, x, y, w, h, o) {
    const d = Math.min(w, h), s = sh(x, y, w, h) + R(x + 3, y + 4, w, h, '#000', 'opacity=".35" rx="4"') + R(x, y, w, h, K(u, 'steel'), S + ' rx="4"');
    if (o.on) return s + hollow(x + 7, y + 7, w - 14, h - 14) + R(x + 7, y + 7, w - 14, h - 14, 'none', 'stroke="#59625d" stroke-width="1.5"') + swing(x + 7, y + 7, h - 14, w * .22, '#4a5450', S);
    return s + R(x + 7, y + 7, w - 14, h - 14, 'none', S) + C(x + w * .44, y + h / 2, d * .2, '#1f2422', 'stroke="#59625d" stroke-width="2"') + C(x + w * .44, y + h / 2, d * .07, K(u, 'brass')) + R(x + w - 17, y + h / 2 - d * .16, 6, d * .32, K(u, 'brass'), 'rx="3"');
  },
  chest(u, x, y, w, h, o) {
    const lid = h * .32, s = sh(x, y, w, h) + R(x, y + lid, w, h - lid, K(u, 'wood'), W) + [.18, .82].map(k => R(x + w * k - 4, y + lid, 8, h - lid, K(u, 'brass'))).join('');
    if (o.on) return s + R(x + 4, y + lid - 4, w - 8, 10, DK) + poly([[x, y + lid - 4], [x + 8, y], [x + w - 8, y], [x + w, y + lid - 4]], '#3a2a19', W);
    return s + poly([[x, y + lid], [x + 6, y + 4], [x + w - 6, y + 4], [x + w, y + lid]], K(u, 'woodl'), W) + R(x + w / 2 - 8, y + lid - 4, 16, 18, K(u, 'brass'), 'rx="2"') + C(x + w / 2, y + lid + 6, 2.5, '#120d08');
  },
  box(u, x, y, w, h, o) {
    const t = y + h * .35, s = sh(x, y, w, h) + R(x, t, w, h - (t - y), K(u, 'woodl'), W);
    if (o.on) return s + R(x + 4, t - 3, w - 8, 8, DK) + poly([[x + 2, t - 2], [x + 10, y], [x + w - 10, y], [x + w - 2, t - 2]], '#2a1f14', W);
    return s + poly([[x, t], [x + 5, y + h * .12], [x + w - 5, y + h * .12], [x + w, t]], K(u, 'wood'), W) + R(x + w / 2 - 6, t + 6, 12, 10, K(u, 'brass'), 'rx="2"');
  },
  drawers(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + R(x, y, w, h, K(u, 'wood'), W);
    const rh = (h - 16) / 3;
    for (let i = 0; i < 3; i++) {
      const yy = y + 8 + i * rh;
      if (o.on && i === 0) s += R(x + 6, yy, w - 12, rh - 4, DK) + R(x + 2, yy + 8, w - 4, rh - 4, K(u, 'woodl'), W);
      else s += R(x + 6, yy, w - 12, rh - 4, K(u, 'woodl'), W) + R(x + w / 2 - 10, yy + rh / 2 - 4, 20, 4, K(u, 'brass'), 'rx="2"');
    }
    return s;
  },
  locker(u, x, y, w, h, o) {
    const s = sh(x, y, w, h) + R(x, y, w, h, K(u, 'steel'), S + ' rx="3"');
    if (o.on) return s + hollow(x + 5, y + 5, w - 10, h - 10) + swing(x + 5, y + 5, h - 10, w * .25, '#4a5450', S);
    let v = '';
    for (let i = 0; i < 4; i++) v += R(x + w * .25, y + 12 + i * 8, w * .5, 3, '#151a18', 'rx="1.5"');
    return s + v + R(x + w - 14, y + h / 2 - 12, 5, 24, K(u, 'brass'), 'rx="2"');
  },
  panel(u, x, y, w, h, o) {
    const s = R(x + 3, y + 4, w, h, '#000', 'opacity=".3" rx="4"') + R(x, y, w, h, K(u, 'steel'), S + ' rx="4"');
    const sc = (a, b) => C(a, b, 3.5, '#a7a99f', 'stroke="#2a2e2b" stroke-width="1.5"');
    if (o.on) return s + R(x + 6, y + 6, w - 12, h - 12, '#0b0d0c') + ['#7a3a2e', '#3d5f80', '#b08a3a'].map((c, i) => L(x + 12, y + 14 + i * (h - 28) / 2, x + w - 12, y + h - 14 - i * 6, c, 2.5)).join('');
    return s + sc(x + 8, y + 8) + sc(x + w - 8, y + 8) + sc(x + 8, y + h - 8) + sc(x + w - 8, y + h - 8) + P(`M${r(x + w / 2 + 3)} ${r(y + h * .25)}l-8 ${r(h * .26)}h6l-4 ${r(h * .24)}l11 -${r(h * .3)}h-6l4 -${r(h * .2)}Z`, '#b08a3a');
  },
  suitcase(u, x, y, w, h, o) {
    const t = y + 10, s = sh(x, y, w, h) + P(`M${r(x + w * .38)} ${r(t)}V${r(y)}H${r(x + w * .62)}V${r(t)}`, 'none', 'stroke="#2a1c10" stroke-width="3"') + R(x, t, w, h - 10, '#5a3a26', W + ' rx="6"');
    if (o.on) return s + R(x + 5, t + 5, w - 10, h * .35, DK) + poly([[x, t + 4], [x + 6, y - h * .25], [x + w - 6, y - h * .25], [x + w, t + 4]], '#4a2f1f', W);
    return s + [.25, .75].map(k => R(x + w * k - 3, t, 6, h - 10, '#3a2618')).join('') + R(x + w / 2 - 7, t + (h - 10) * .45, 14, 8, K(u, 'brass'), 'rx="2"');
  },
  crate(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + R(x, y, w, h, K(u, 'woodl'), W);
    for (let i = 1; i < 4; i++) s += L(x + 2, y + i * h / 4, x + w - 2, y + i * h / 4, '#5a442c', 2);
    s += L(x + 4, y + h - 4, x + w - 4, y + 4, '#5a442c', 3);
    return o.on ? s + R(x + 4, y + 2, w - 8, h * .22, DK) : s;
  },
  desk(u, x, y, w, h, o) {
    const t = y + h * .15;
    let s = sh(x, y, w, h) + R(x - 4, y, w + 8, h * .15, K(u, 'woodl'), W) + R(x, t, w, h * .55, K(u, 'wood'), W) + R(x + 6, y + h * .7, 8, h * .3, '#3a2b1b') + R(x + w - 14, y + h * .7, 8, h * .3, '#3a2b1b');
    if (o.on) return s + R(x + w * .25, t + 6, w * .5, h * .2, DK) + R(x + w * .22, t + h * .18, w * .56, h * .22, K(u, 'woodl'), W);
    return s + R(x + w * .25, t + 8, w * .5, h * .3, 'none', IN) + R(x + w / 2 - 9, t + h * .2, 18, 4, K(u, 'brass'), 'rx="2"');
  },
  door(u, x, y, w, h, o) {
    const s = R(x - 6, y - 8, w + 12, h + 8, '#3a2a19') + R(x - 2, y - 4, w + 4, h + 4, '#20170f');
    if (o.on) return s + R(x, y, w, h, K(u, 'hall')) + poly([[x, y], [x + w * .24, y + 10], [x + w * .24, y + h - 8], [x, y + h]], K(u, 'wood'), W) + poly([[x, y + h], [x + w, y + h], [x + w + 70, 480], [x - 70, 480]], K(u, 'ray'));
    return s + R(x, y, w, h, K(u, 'wood'), W) + R(x + 12, y + 14, w - 24, h * .4, 'none', 'stroke="#2a1c10" stroke-width="3" opacity=".7"') + R(x + 12, y + h * .5, w - 24, h * .44, 'none', 'stroke="#2a1c10" stroke-width="3" opacity=".7"') + C(x + w - 16, y + h * .5, 7, K(u, 'brass')) + R(x + w - 23, y + h * .55, 14, 24, K(u, 'brass'), 'rx="3"') + C(x + w - 16, y + h * .59, 3, '#120d08');
  },
  paper(u, x, y, w, h, o = {}) {
    let s = R(x + w * .1 + 3, y + 4, w * .8, h, '#000', 'opacity=".3"') + R(x + w * .1, y, w * .8, h, K(u, 'paper'), `stroke="#8d7c5a" stroke-width="1.5" transform="rotate(-1.5 ${r(x + w / 2)} ${r(y + h / 2)})"`) + C(x + w / 2, y + 6, 3.5, '#9e3b30');
    if (!o.blank) for (let i = 0; i < 4; i++) s += R(x + w * .2, y + h * (.25 + i * .17), w * (i % 2 ? .45 : .6), 3, '#6d604a', 'opacity=".55"');
    return s;
  },
  board(u, x, y, w, h, o = {}) {
    if (o.blank) return R(x + 3, y + 4, w, h, '#000', 'opacity=".3"') + R(x, y, w, h, '#6a5136', W) + R(x + 12, y + 12, w - 24, h - 24, K(u, 'paper')) + C(x + w / 2, y + 18, 3.5, '#9e3b30');
    return R(x + 3, y + 4, w, h, '#000', 'opacity=".3"') + R(x, y, w, h, '#6a5136', W) + R(x + 8, y + 10, w * .42, h * .62, K(u, 'paper'), 'transform="rotate(-3 ' + r(x + w * .3) + ' ' + r(y + h * .4) + ')"') + R(x + w * .52, y + h * .28, w * .4, h * .58, '#d6c9a6') + C(x + w * .29, y + 13, 3, '#9e3b30') + C(x + w * .72, y + h * .3, 3, '#9e3b30');
  },
  frame(u, x, y, w, h) {
    return frame(u, x, y, w, h, K(u, 'night')) + poly([[x + 7, y + h * .75], [x + w * .35, y + h * .5], [x + w * .6, y + h * .68], [x + w - 7, y + h * .55], [x + w - 7, y + h - 7], [x + 7, y + h - 7]], '#1b302e') + C(x + w * .7, y + h * .3, Math.min(w, h) * .09, '#b5bba0', 'opacity=".7"');
  },
  portrait(u, x, y, w, h) {
    const cx = x + w / 2;
    return frame(u, x, y, w, h, '#2a2620') + C(cx, y + h * .42, Math.min(w, h) * .16, '#141210') + P(`M${r(x + w * .22)} ${r(y + h - 7)}Q${r(cx)} ${r(y + h * .5)} ${r(x + w * .78)} ${r(y + h - 7)}Z`, '#141210');
  },
  mirror(u, x, y, w, h) {
    return E(x + w / 2 + 3, y + h / 2 + 4, w / 2, h / 2, '#000', 'opacity=".3"') + E(x + w / 2, y + h / 2, w / 2, h / 2, K(u, 'brass')) + E(x + w / 2, y + h / 2, w / 2 - 6, h / 2 - 6, K(u, 'night')) + L(x + w * .3, y + h * .25, x + w * .5, y + h * .15, '#fff', 3, 'opacity=".2" stroke-linecap="round"');
  },
  window(u, x, y, w, h, o) {
    let s = R(x, y, w, h, K(u, 'wood'), W) + R(x + 8, y + 8, w - 16, h - 16, o.tone === 'day' ? '#7c8f96' : K(u, 'night')) + C(x + w * .7, y + h * .3, Math.min(w, h) * .1, '#b5bba0', 'opacity=".7"');
    if (o.tone === 'snow') for (let i = 0; i < 14; i++) s += C(x + 12 + ((i * 37) % (w - 24)), y + 12 + ((i * 53) % (h - 24)), 1.6, '#e6ece8', 'opacity=".7"');
    if (o.tone === 'sea') s += R(x + 8, y + h * .6, w - 16, h * .4 - 8, '#1d3a44');
    s += L(x + w / 2, y + 8, x + w / 2, y + h - 8, '#3a2a19', 5) + L(x + 8, y + h / 2, x + w - 8, y + h / 2, '#3a2a19', 5);
    if (o.frost) s += R(x + 8, y + 8, w - 16, h - 16, '#dfe6e6', 'opacity=".55"');
    return s;
  },
  clock(u, x, y, w, h, o) { return clockFace(u, x + w / 2, y + h / 2, Math.min(w, h) * .46, o.empty ? null : o.time, Math.min(w, h) > 150); },
  map(u, x, y, w, h, o = {}) {
    if (o.blank) return R(x + 3, y + 4, w, h, '#000', 'opacity=".3"') + R(x, y, w, h, '#cdbf9b', 'stroke="#8d7c5a" stroke-width="1.5"');
    return R(x + 3, y + 4, w, h, '#000', 'opacity=".3"') + R(x, y, w, h, '#cdbf9b', 'stroke="#8d7c5a" stroke-width="1.5"') + P(`M${r(x + 10)} ${r(y + h * .7)}Q${r(x + w * .4)} ${r(y + h * .2)} ${r(x + w - 10)} ${r(y + h * .45)}`, 'none', 'stroke="#6d604a" stroke-width="2" stroke-dasharray="4 4"') + C(x + w - 14, y + h * .45, 4, '#9e3b30') + poly([[x + 8, y + h * .9], [x + w * .3, y + h * .55], [x + w * .5, y + h * .9]], '#8d9d7a', 'opacity=".6"');
  },
  calendar(u, x, y, w, h, o = {}) {
    if (o.blank) return R(x + 3, y + 4, w, h, '#000', 'opacity=".3"') + R(x, y, w, h, K(u, 'paper'), 'stroke="#8d7c5a" stroke-width="1.5"') + R(x, y, w, h * .14, '#7a3a2e');
    let s = R(x + 3, y + 4, w, h, '#000', 'opacity=".3"') + R(x, y, w, h, K(u, 'paper'), 'stroke="#8d7c5a" stroke-width="1.5"') + R(x, y, w, h * .2, '#7a3a2e');
    for (let i = 1; i < 4; i++) s += L(x + 4, y + h * .2 + i * h * .2, x + w - 4, y + h * .2 + i * h * .2, '#8d7c5a', 1);
    for (let i = 1; i < 5; i++) s += L(x + i * w / 5, y + h * .22, x + i * w / 5, y + h - 4, '#8d7c5a', 1);
    return s;
  },
  sign(u, x, y, w, h, o = {}) {
    return R(x + 3, y + 4, w, h, '#000', 'opacity=".3" rx="4"') + R(x, y, w, h, K(u, 'brass'), 'rx="4" stroke="#3b2f1a" stroke-width="2"') + R(x + 8, y + 8, w - 16, h - 16, 'none', 'stroke="#3b2f1a" stroke-width="1.5" rx="2"') + [x + 6, x + w - 6].map(a => C(a, y + h / 2, 2.5, '#3b2f1a')).join('');
  },
  radio(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + R(x, y, w, h, K(u, 'wood'), W + ' rx="8"') + C(x + w * .32, y + h * .5, Math.min(w, h) * .28, '#2a2118', 'stroke="#5a442c" stroke-width="2"');
    for (let i = -2; i <= 2; i++) s += L(x + w * .32 - Math.min(w, h) * .2, y + h * .5 + i * 6, x + w * .32 + Math.min(w, h) * .2, y + h * .5 + i * 6, '#5a442c', 1.5);
    s += R(x + w * .6, y + h * .25, w * .3, h * .18, o.on ? '#c9a45a' : '#3a3125', 'rx="2"') + C(x + w * .68, y + h * .7, 7, K(u, 'brass')) + C(x + w * .84, y + h * .7, 7, K(u, 'brass'));
    return o.on ? C(x + w * .75, y + h * .34, 22, K(u, 'glow')) + s : s;
  },
  lamp(u, x, y, w, h, o) {
    const cx = x + w / 2;
    let s = (o.on ? C(cx, y + h * .4, w * .9, K(u, 'glow')) : '') + sh(x, y, w, h) + R(cx - 3, y + h * .4, 6, h * .58, K(u, 'brass')) + E(cx, y + h - 2, w * .3, 5, K(u, 'brass'));
    return s + poly([[cx - w * .2, y], [cx + w * .2, y], [cx + w * .42, y + h * .4], [cx - w * .42, y + h * .4]], K(u, 'shade'), 'stroke="#1a2e20" stroke-width="2"');
  },
  candle(u, x, y, w, h, o) {
    const cx = x + w / 2, b = y + h;
    let s = (o.on ? C(cx, y + h * .2, w * .7, K(u, 'glow')) : '') + R(cx - 6, y + h * .3, 12, h * .55, '#cbbd98', 'rx="2"') + poly([[cx - 4, b - h * .15], [cx + 4, b - h * .15], [cx + 14, b], [cx - 14, b]], K(u, 'brass'));
    return o.on ? s + P(`M${r(cx)} ${r(y + h * .05)}Q${r(cx + 7)} ${r(y + h * .2)} ${r(cx)} ${r(y + h * .28)}Q${r(cx - 6)} ${r(y + h * .2)} ${r(cx)} ${r(y + h * .05)}Z`, '#e5bd71') : s;
  },
  plant(u, x, y, w, h, o) {
    const cx = x + w / 2, py = y + h * .62;
    let s = sh(x, y, w, h) + poly([[cx - w * .28, py], [cx + w * .28, py], [cx + w * .2, y + h], [cx - w * .2, y + h]], '#6b4632', W);
    for (let i = 0; i < 5; i++) { const a = -1.2 + i * .6; s += E(cx + Math.sin(a) * w * .22, py - h * .22 - Math.cos(a) * h * .14, w * .1, h * .2, '#46704f', `transform="rotate(${r(a * 40)} ${r(cx + Math.sin(a) * w * .22)} ${r(py - h * .22)})" opacity=".9"`); }
    if (o.tone) for (let i = 0; i < 3; i++) s += C(cx - w * .16 + i * w * .16, py - h * .48 + (i % 2) * 8, Math.min(w, h) * .07, MUTED[o.tone] ?? o.tone);
    return s;
  },
  shelf(u, x, y, w, h) {
    let s = R(x, y + h - 10, w, 8, K(u, 'woodl'), W);
    const tones = ['#4b5446', '#6b4a33', '#3d4a52', '#77603d'];
    for (let i = 0; i < 5; i++) s += i % 2 ? R(x + 8 + i * w / 5.4, y + h * .35, w / 8, h * .55 - 10, tones[i % 4], 'rx="2"') : poly([[x + 6 + i * w / 5.4, y + h - 10], [x + 6 + i * w / 5.4, y + h * .45], [x + 12 + i * w / 5.4, y + h * .3], [x + 6 + i * w / 5.4 + w / 7, y + h * .45], [x + 6 + i * w / 5.4 + w / 7, y + h - 10]], tones[i % 4]);
    return s;
  },
  bookcase(u, x, y, w, h) {
    let s = sh(x, y, w, h) + R(x, y, w, h, K(u, 'wood'), W) + R(x + 6, y + 6, w - 12, h - 12, '#1b1510');
    const tones = ['#5d4330', '#3f4a3c', '#6b3b2e', '#4a4038', '#2f3a40', '#77603d'];
    for (let row = 0; row < 3; row++) {
      const by = y + 6 + (row + 1) * (h - 12) / 3;
      s += R(x + 4, by - 4, w - 8, 5, K(u, 'woodl'));
      for (let i = 0, bx = x + 8; bx < x + w - 14; i++) { const bw = 7 + ((i * 5 + row * 3) % 6), bh = (h - 12) / 3 - 12 - ((i * 7) % 9); s += R(bx, by - 4 - bh, bw, bh, tones[(i + row) % 6]); bx += bw + 1.5; }
    }
    return s;
  },
  vase(u, x, y, w, h) {
    const cx = x + w / 2;
    return sh(x, y, w, h) + P(`M${r(cx - w * .16)} ${r(y)}H${r(cx + w * .16)}Q${r(cx + w * .1)} ${r(y + h * .2)} ${r(cx + w * .38)} ${r(y + h * .55)}Q${r(cx + w * .3)} ${r(y + h)} ${r(cx)} ${r(y + h)}Q${r(cx - w * .3)} ${r(y + h)} ${r(cx - w * .38)} ${r(y + h * .55)}Q${r(cx - w * .1)} ${r(y + h * .2)} ${r(cx - w * .16)} ${r(y)}Z`, '#4a5a52', 'stroke="#1e2a24" stroke-width="2"') + L(cx - w * .2, y + h * .45, cx - w * .2, y + h * .8, '#fff', 3, 'opacity=".12" stroke-linecap="round"');
  },
  coat(u, x, y, w, h) {
    const cx = x + w / 2;
    return R(cx - 18, y - 2, 36, 7, K(u, 'wood')) + C(cx, y + 5, 3.5, K(u, 'brass')) + P(`M${r(cx - w * .3)} ${r(y + 12)}Q${r(cx)} ${r(y)} ${r(cx + w * .3)} ${r(y + 12)}L${r(cx + w * .38)} ${r(y + h)}Q${r(cx)} ${r(y + h + 8)} ${r(cx - w * .38)} ${r(y + h)}Z`, '#2f4436', 'stroke="#1a261d" stroke-width="2"') + poly([[cx, y + 10], [cx - 5, y + h * .55], [cx, y + h], [cx + 5, y + h * .55]], '#253629');
  },
  pipe(u, x, y, w, h, o) {
    const cx = x + w / 2, cy = y + h / 2, rr = Math.min(w, h) * .3;
    let s = L(x, cy, x + w, cy, '#59624e', 12) + L(cx, y, cx, cy, '#59624e', 12) + L(x, cy - 5, x + w, cy - 5, '#929178', 2, 'opacity=".4"');
    s += C(cx, cy, rr, 'none', `stroke="${o.on ? '#7c6a40' : '#8e3b30'}" stroke-width="5"`) + C(cx, cy, 6, K(u, 'brass'));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4 + (o.on ? .4 : 0); s += L(cx - Math.cos(a) * rr, cy - Math.sin(a) * rr, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, o.on ? '#7c6a40' : '#8e3b30', 3); }
    return s;
  },
  lever(u, x, y, w, h, o) {
    const cx = x + w / 2, cy = y + h * .55;
    const tip = o.on ? [cx + w * .3, y + h - 8] : [cx + w * .3, y + 8];
    return R(x + w * .2, y + h * .2, w * .6, h * .7, K(u, 'steel'), S + ' rx="4"') + L(cx, cy, tip[0], tip[1], '#3a403d', 7, 'stroke-linecap="round"') + C(tip[0], tip[1], 8, '#7a2a1e', 'stroke="#3a120c" stroke-width="2"') + C(cx, cy, 6, K(u, 'brass'));
  },
  globe(u, x, y, w, h) {
    const cx = x + w / 2, rr = Math.min(w, h * .8) * .42, cy = y + rr + 4;
    return sh(x, y, w, h) + P(`M${r(cx - rr - 6)} ${r(cy)}A${r(rr + 6)} ${r(rr + 6)} 0 0 0 ${r(cx + rr + 6)} ${r(cy)}`, 'none', 'stroke="#8c7442" stroke-width="3"') + C(cx, cy, rr, '#3f5a50', 'stroke="#1e2a24" stroke-width="2"') + E(cx, cy, rr * .45, rr, 'none', 'stroke="#a8a27c" opacity=".5"') + L(cx - rr, cy, cx + rr, cy, '#a8a27c', 1, 'opacity=".5"') + R(cx - 3, cy + rr, 6, y + h - cy - rr - 4, K(u, 'brass')) + E(cx, y + h - 3, w * .25, 4, K(u, 'brass'));
  },
  hourglass(u, x, y, w, h) {
    const cx = x + w / 2;
    return sh(x, y, w, h) + R(x + w * .2, y, w * .6, 8, K(u, 'wood')) + R(x + w * .2, y + h - 8, w * .6, 8, K(u, 'wood')) + poly([[cx - w * .22, y + 8], [cx + w * .22, y + 8], [cx + 3, y + h / 2], [cx + w * .22, y + h - 8], [cx - w * .22, y + h - 8], [cx - 3, y + h / 2]], '#c9d6d3', 'opacity=".35" stroke="#8d958f" stroke-width="1.5"') + poly([[cx - w * .16, y + h - 8], [cx + w * .16, y + h - 8], [cx, y + h * .7]], '#b08a3a');
  },
  lantern(u, x, y, w, h, o) {
    const cx = x + w / 2;
    let s = (o.on ? C(cx, y + h * .55, w * .8, K(u, 'glow')) : '') + sh(x, y, w, h) + P(`M${r(cx - 10)} ${r(y + 10)}Q${r(cx)} ${r(y - 6)} ${r(cx + 10)} ${r(y + 10)}`, 'none', 'stroke="#7c6a40" stroke-width="3"');
    s += poly([[cx - w * .28, y + h * .2], [cx + w * .28, y + h * .2], [cx + w * .22, y + h * .3], [cx - w * .22, y + h * .3]], K(u, 'brass')) + R(cx - w * .22, y + h * .3, w * .44, h * .55, o.on ? '#e8c98a' : '#2c3a3a', 'opacity=".75" stroke="#7c6a40" stroke-width="2"') + R(cx - w * .28, y + h * .85, w * .56, h * .12, K(u, 'brass'));
    return s;
  },
  birdcage(u, x, y, w, h) {
    const cx = x + w / 2;
    let s = sh(x, y, w, h) + P(`M${r(x + 6)} ${r(y + h - 10)}V${r(y + h * .4)}Q${r(cx)} ${r(y - 4)} ${r(x + w - 6)} ${r(y + h * .4)}V${r(y + h - 10)}`, 'none', 'stroke="#8c7442" stroke-width="2"');
    for (let i = 1; i < 6; i++) s += L(x + 6 + i * (w - 12) / 6, y + h * .25, x + 6 + i * (w - 12) / 6, y + h - 10, '#8c7442', 1.2);
    return s + R(x, y + h - 10, w, 8, K(u, 'brass')) + L(x + 12, y + h * .62, x + w - 12, y + h * .62, '#6b4a33', 3);
  },
  typewriter(u, x, y, w, h) {
    let s = sh(x, y, w, h) + R(x + w * .2, y, w * .6, h * .35, K(u, 'paper'), 'stroke="#8d7c5a" stroke-width="1"') + poly([[x, y + h], [x + w * .1, y + h * .35], [x + w * .9, y + h * .35], [x + w, y + h]], '#2a2e2b', S) + R(x + w * .05, y + h * .32, w * .9, 8, '#1b1e1d');
    for (let row = 0; row < 3; row++) for (let i = 0; i < 7; i++) s += C(x + w * (.16 + i * .113) + row * 3, y + h * (.55 + row * .14), 3.2, '#c9c2ad');
    return s;
  },
  gramophone(u, x, y, w, h) {
    const b = y + h * .6;
    return sh(x, y, w, h) + R(x, b, w * .7, h * .4, K(u, 'wood'), W) + E(x + w * .35, b, w * .3, 5, '#151515') + L(x + w * .5, b - 4, x + w * .6, y + h * .3, '#8c7442', 4) + poly([[x + w * .6, y + h * .32], [x + w * .78, y], [x + w, y + h * .2], [x + w * .66, y + h * .4]], K(u, 'brass'), 'stroke="#5f4c2c" stroke-width="1.5"');
  },
  fireplace(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + R(x, y, w, h, '#4a4540', 'stroke="#2a2622" stroke-width="2"') + R(x - 6, y, w + 12, 10, '#5d564e') + P(`M${r(x + w * .18)} ${r(y + h)}V${r(y + h * .45)}Q${r(x + w / 2)} ${r(y + h * .18)} ${r(x + w * .82)} ${r(y + h * .45)}V${r(y + h)}Z`, '#120f0c');
    s += R(x + w * .28, y + h - 14, w * .44, 8, '#4a3624', 'rx="4"');
    if (o.on) s = C(x + w / 2, y + h * .75, w * .5, K(u, 'glow')) + s + poly([[x + w * .34, y + h - 12], [x + w * .44, y + h * .55], [x + w * .5, y + h * .7], [x + w * .57, y + h * .5], [x + w * .66, y + h - 12]], '#c9783a', 'opacity=".9"');
    return s;
  },
  tank(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + R(x, y, w, h, '#1b2a2c', S) + R(x + 4, y + (o.on ? h * .7 : h * .15), w - 8, o.on ? h * .3 - 4 : h * .85 - 4, '#1d3a44', 'opacity=".9"');
    for (let i = 0; i < 3; i++) s += P(`M${r(x + 14 + i * w * .3)} ${r(y + h - 4)}q-6 -${r(h * .2)} 2 -${r(h * .35)}`, 'none', 'stroke="#46704f" stroke-width="3"');
    return s + R(x, y, w, 6, K(u, 'steel')) + L(x + 6, y + 10, x + 6, y + h - 6, '#fff', 2, 'opacity=".12"');
  },
  seat(u, x, y, w, h) {
    return sh(x, y, w, h) + R(x, y, w, h * .6, '#3a4a3c', 'stroke="#1e2a20" stroke-width="2" rx="6"') + R(x - 4, y + h * .55, w + 8, h * .25, '#4b5a48', 'stroke="#1e2a20" stroke-width="2" rx="4"') + R(x + 6, y + h * .8, 8, h * .2, '#2a2e2b') + R(x + w - 14, y + h * .8, 8, h * .2, '#2a2e2b');
  },
  vitrine(u, x, y, w, h, o) {
    const t = y + h * .55;
    let s = sh(x, y, w, h) + R(x + w * .1, t, w * .8, h * .45, K(u, 'wood'), W) + R(x, t - 6, w, 8, K(u, 'woodl'));
    s += R(x + 4, y, w - 8, h * .55 - 6, '#c9d6d3', `opacity="${o.on ? .06 : .16}"`) + R(x + 4, y, w - 8, h * .55 - 6, 'none', 'stroke="#a9b3ad" stroke-width="2" opacity=".7"') + R(x + 4, y - 4, w - 8, 6, K(u, 'woodl'));
    for (let i = 1; i < 3; i++) s += R(x + 8, y + i * h * .17, w - 16, 3, '#6a5136', 'opacity=".8"');
    return s + L(x + 12, y + 8, x + 22, y + 30, '#fff', 2, 'opacity=".3"') + L(x + 12, y + 40, x + 18, y + 52, '#fff', 1.5, 'opacity=".2"');
  },
  telescope(u, x, y, w, h) {
    const cx = x + w * .45, cy = y + h * .45;
    return L(cx, cy, x + 6, y + h, '#5a442c', 4) + L(cx, cy, x + w - 6, y + h, '#5a442c', 4) + L(cx, cy, cx, y + h, '#5a442c', 4) + `<g transform="rotate(-28 ${r(cx)} ${r(cy)})">${R(cx - w * .45, cy - 9, w * .9, 18, K(u, 'brass'), 'rx="4" stroke="#5f4c2c" stroke-width="1.5"')}${R(cx + w * .38, cy - 12, 12, 24, '#3b2f1a', 'rx="3"')}</g>`;
  },
  lens(u, x, y, w, h, o) {
    const cx = x + w / 2, cy = y + h / 2, rr = Math.min(w, h) * .46;
    let s = (o.on ? C(cx, cy, rr * 1.6, K(u, 'glow')) : '') + C(cx, cy, rr, K(u, 'brass'));
    for (let i = 1; i < 5; i++) s += C(cx, cy, rr * (1 - i * .18), i % 2 ? '#c9d6d3' : '#9fb0ae', 'opacity=".55"');
    return s;
  },
  spotlight(u, x, y, w, h, o) {
    const cx = x + w / 2;
    let s = o.on ? poly([[cx - 8, y + h * .45], [cx + 8, y + h * .45], [cx + w * .6, y + h + 60], [cx - w * .6, y + h + 60]], K(u, 'ray')) : '';
    return s + L(cx, y, cx, y + 12, '#1b1b1b', 3) + `<g transform="rotate(10 ${r(cx)} ${r(y + h * .3)})">${R(cx - w * .25, y + 12, w * .5, h * .42, '#1b1d1c', S + ' rx="5"')}${E(cx, y + h * .54, w * .2, 5, o.on ? '#f2d9a2' : '#3a3f3c')}</g>`;
  },
  curtain(u, x, y, w, h) {
    let s = R(x, y, w, h, '#5a2a24');
    for (let i = 0; i < 5; i++) s += L(x + 8 + i * (w - 16) / 4, y + 4, x + 6 + i * (w - 16) / 4, y + h - 4, i % 2 ? '#3a1a16' : '#7a3a2e', i % 2 ? 6 : 3, 'opacity=".6"');
    return s + R(x - 4, y - 6, w + 8, 10, K(u, 'brass'));
  },
  piano(u, x, y, w, h) {
    let s = sh(x, y, w, h) + R(x, y, w, h * .7, K(u, 'wood'), W) + R(x - 4, y + h * .55, w + 8, h * .15, '#e6dfcc', W);
    for (let i = 1; i < 14; i++) s += i % 7 === 3 || i % 7 === 0 ? '' : R(x - 4 + i * (w + 8) / 14 - 2, y + h * .55, 4, h * .09, '#1b1b1b');
    return s + R(x + 6, y + h * .7, 8, h * .3, '#3a2b1b') + R(x + w - 14, y + h * .7, 8, h * .3, '#3a2b1b');
  },
  barrel(u, x, y, w, h) {
    return sh(x, y, w, h) + P(`M${r(x + w * .12)} ${r(y)}H${r(x + w * .88)}Q${r(x + w + 4)} ${r(y + h / 2)} ${r(x + w * .88)} ${r(y + h)}H${r(x + w * .12)}Q${r(x - 4)} ${r(y + h / 2)} ${r(x + w * .12)} ${r(y)}Z`, K(u, 'wood'), W) + [.18, .82].map(k => L(x + 2, y + h * k, x + w - 2, y + h * k, '#59624e', 4)).join('') + E(x + w / 2, y + 2, w * .38, 5, '#3a2a19');
  },
  machine(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + R(x, y, w, h, K(u, 'steel'), S + ' rx="4"');
    [.3, .7].forEach(k => { s += C(x + w * k, y + h * .35, Math.min(w, h) * .16, '#e6dfcc', 'stroke="#1b201e" stroke-width="2"') + L(x + w * k, y + h * .35, x + w * k + Math.min(w, h) * .1, y + h * .3, '#7a2a1e', 2); });
    return s + R(x + w * .2, y + h * .65, w * .6, h * .15, o.on ? '#5f7a52' : '#151a18', 'rx="3"');
  },
  bed(u, x, y, w, h) {
    return sh(x, y, w, h) + R(x, y, 10, h, K(u, 'wood')) + R(x, y + h * .45, w, h * .35, '#4a3f52', 'stroke="#2a2430" stroke-width="2" rx="4"') + E(x + w * .2, y + h * .45, w * .14, h * .1, '#d6cfbd') + R(x, y + h * .8, w, h * .1, K(u, 'wood'));
  },
  stool(u, x, y, w, h) {
    return sh(x, y, w, h) + E(x + w / 2, y + h * .2, w * .45, h * .12, K(u, 'woodl'), W) + L(x + w * .2, y + h * .25, x + w * .1, y + h, '#3a2b1b', 4) + L(x + w * .8, y + h * .25, x + w * .9, y + h, '#3a2b1b', 4);
  },
  table(u, x, y, w, h) {
    return sh(x, y, w, h) + R(x, y + h * .35, w, 10, K(u, 'woodl'), W) + R(x + 8, y + h * .35 + 10, 8, h * .65 - 10, '#3a2b1b') + R(x + w - 16, y + h * .35 + 10, 8, h * .65 - 10, '#3a2b1b');
  },
  oven(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + R(x, y, w, h, '#3a3530', 'stroke="#1e1a16" stroke-width="2" rx="4"') + R(x + 8, y + h * .3, w - 16, h * .55, o.on ? '#5a3220' : '#2a241e', 'rx="4" stroke="#4a423a" stroke-width="2"') + L(x + 14, y + h * .55, x + w - 14, y + h * .55, '#5b5650', 2);
    if (o.on) s = C(x + w / 2, y + h * .6, w * .45, K(u, 'glow')) + s;
    return s + R(x + w * .25, y + h * .12, w * .5, 6, K(u, 'brass'), 'rx="3"');
  },

  // ── 장면마다 쓰는 바깥, 탈것, 시설 물건입니다.
  mailbox(u, x, y, w, h, o) {
    const by = y + h * .05, bh = h * .42;
    let s = sh(x, y, w, h) + R(x + w / 2 - 4, by + bh, 8, h - bh - 4, '#2a2e2b') + R(x, by, w, bh, '#5a2a24', 'rx="6" stroke="#2a1412" stroke-width="2"') + R(x + 6, by + bh * .3, w - 12, 5, '#1b0e0c', 'rx="2"');
    s += o.on ? R(x + 4, by + bh * .45, w - 8, bh * .5, '#120a08') + poly([[x + 4, by + bh * .95], [x + w - 4, by + bh * .95], [x + w - 1, by + bh * 1.2], [x + 1, by + bh * 1.2]], '#4a2420') : R(x + w - 7, by + 3, 3, 23, '#ac5a44') + R(x + w - 18, by + 3, 14, 9, '#ac5a44', 'rx="1"');
    s += R(x + 5, by + 7, w - 10, bh - 12, 'none', 'rx="3" stroke="#8a4a3c" stroke-width="1"') + R(x + w / 2 - 5, by + bh - 8, 10, 3, K(u, 'brass'), 'rx="1"');
    return s;
  },
  lamppost(u, x, y, w, h, o) {
    const cx = x + w / 2;
    return (o.on ? C(cx, y + 22, 46, K(u, 'glow')) : '') + sh(x, y, w, h) + R(cx - 3, y + 30, 6, h - 34, '#22262a') + R(cx - 9, y + h - 12, 18, 12, '#22262a') + poly([[cx - 14, y + 10], [cx + 14, y + 10], [cx + 10, y + 34], [cx - 10, y + 34]], o.on ? '#e8c98a' : '#2c3434', 'stroke="#141618" stroke-width="2"') + R(cx - 16, y + 4, 32, 7, '#22262a');
  },
  bench(u, x, y, w, h) {
    return sh(x, y, w, h) + [x + 10, x + w - 16].map(a => R(a, y + 8, 6, h - 8, '#414844') + L(a + 3, y + h * .58, a - 3, y + h, '#414844', 4)).join('') + [0, 12].map(d => R(x, y + d, w, 9, K(u, 'woodl'), W)).join('') + poly([[x, y + h * .5], [x + w - 6, y + h * .5], [x + w, y + h * .65], [x + 4, y + h * .65]], K(u, 'woodl'), W) + R(x + 4, y + h * .65, w - 4, 5, '#5a442c');
  },
  well(u, x, y, w, h, o) {
    const t = y + h * .45;
    let s = sh(x, y, w, h) + L(x + 10, t, x + 10, y, '#3a2b1b', 6) + L(x + w - 10, t, x + w - 10, y, '#3a2b1b', 6) + poly([[x + 2, y + 16], [x + w / 2, y + 1], [x + w - 2, y + 16]], '#62472d', W) + L(x + 10, y + 18, x + w - 10, y + 18, '#5a442c', 4);
    s += L(x + w / 2, y + 18, x + w / 2, o.on ? y + 34 : t + 6, '#8d7350', 1.5) + (o.on ? R(x + w / 2 - 9, y + 34, 18, 16, '#5a442c') : '');
    s += R(x, t, w, h - (t - y), '#4a4540', 'stroke="#2a2622" stroke-width="2"') + E(x + w / 2, t, w / 2, 8, '#15120f', 'stroke="#5d564e" stroke-width="3"');
    for (let i = 0; i < 3; i++) s += L(x, t + 14 + i * 14, x + w, t + 14 + i * 14, '#2a2622', 1.5);
    return s;
  },
  signpost(u, x, y, w, h) {
    const cx = x + w / 2;
    return sh(x, y, w, h) + R(cx - 4, y, 8, h, '#3a2b1d') + poly([[x, y + 14], [x + w - 10, y + 14], [x + w, y + 26], [x + w - 10, y + 38], [x, y + 38]], K(u, 'woodl'), W) + poly([[x + w, y + 50], [x + 10, y + 50], [x, y + 62], [x + 10, y + 74], [x + w, y + 74]], K(u, 'wood'), W);
  },
  noticeboard(u, x, y, w, h) {
    let s = sh(x, y, w, h) + R(x + 8, y + h * .6, 6, h * .4, '#3a2b1b') + R(x + w - 14, y + h * .6, 6, h * .4, '#3a2b1b') + R(x, y, w, h * .66, '#5a4632', W) + poly([[x + 2, y + 8], [x + w / 2, y], [x + w - 2, y + 8]], '#62472d');
    s += R(x + 10, y + 10, w * .38, h * .4, K(u, 'paper'), `transform="rotate(-3 ${x + 30} ${y + 30})"`) + R(x + w * .52, y + 16, w * .36, h * .32, '#d6c9a6') + C(x + w * .29, y + 14, 3, '#9e3b30') + C(x + w * .7, y + 20, 3, '#9e3b30');
    return s;
  },
  tent(u, x, y, w, h, o) {
    const cx = x + w / 2;
    let s = sh(x, y, w, h) + poly([[x, y + h], [cx, y], [x + w, y + h]], '#4a4a36', 'stroke="#262618" stroke-width="2"') + L(cx, y, cx, y + h, '#262618', 1.5);
    s += o.on ? poly([[cx - 22, y + h], [cx, y + h * .35], [cx + 22, y + h]], '#14140c') + poly([[cx, y + h * .35], [cx + 22, y + h], [cx + 38, y + h * .82]], '#5a5a42') : poly([[cx - 22, y + h], [cx, y + h * .35], [cx + 22, y + h]], '#3a3a2a');
    return s + L(x - 10, y + h, x + 6, y + h - 4, '#8d7350', 1.5) + L(x + w + 10, y + h, x + w - 6, y + h - 4, '#8d7350', 1.5);
  },
  campfire(u, x, y, w, h, o) {
    const cx = x + w / 2, b = y + h;
    let s = (o.on ? C(cx, b - h * .5, w * .46, K(u, 'glow')) : '') + [[-1, 1], [1, -1]].map(([a, c]) => L(cx - 26 * a, b - 4, cx + 26 * a, b - 16, '#4a3624', 8, 'stroke-linecap="round"')).join('');
    for (let i = 0; i < 7; i++) s += E(cx + Math.cos(i * .9) * (w * .36), b - 8 + Math.sin(i * .9) * 3, 8, 5, '#4a4540');
    if (o.on) s += poly([[cx - 16, b - 8], [cx - 6, y + h * .1], [cx, b - h * .35], [cx + 8, y], [cx + 16, b - 8]], '#c9783a', 'opacity=".9"');
    return s;
  },
  anchor(u, x, y, w, h) {
    const cx = x + w / 2;
    return sh(x, y, w, h) + C(cx, y + 10, 8, 'none', 'stroke="#777e7c" stroke-width="5"') + R(cx - 4, y + 18, 8, h - 24, '#626967') + R(cx - w * .35, y + 30, w * .7, 7, '#626967') + P(`M${r(x + 7)} ${r(y + h * .68)}Q${r(x + 8)} ${r(y + h)} ${r(cx)} ${r(y + h - 7)}Q${r(x + w - 8)} ${r(y + h)} ${r(x + w - 7)} ${r(y + h * .68)}`, 'none', 'stroke="#626967" stroke-width="7"') + poly([[x + 2, y + h * .6], [x + 20, y + h * .7], [x + 5, y + h * .82]], '#626967') + poly([[x + w - 2, y + h * .6], [x + w - 20, y + h * .7], [x + w - 5, y + h * .82]], '#626967');
  },
  buoy(u, x, y, w, h) {
    const cx = x + w / 2;
    return sh(x, y, w, h) + L(cx, y, cx, y + 16, '#3a3f42', 3) + poly([[cx - 6, y + 16], [cx + 6, y + 16], [x + w, y + h - 10], [x, y + h - 10]], '#7a3a2e', 'stroke="#2a1412" stroke-width="2"') + R(x + w * .18, y + h * .5, w * .64, h * .14, '#cfc8b4', 'opacity=".85"') + R(x - 4, y + h - 12, w + 8, 12, '#2a2e2b', 'rx="4"');
  },
  boat(u, x, y, w, h) {
    return sh(x, y, w, h) + P(`M${x} ${y + h * .2}H${x + w}Q${x + w - 10} ${y + h} ${x + w / 2} ${y + h}Q${x + 10} ${y + h} ${x} ${y + h * .2}Z`, '#4a3624', W) + R(x + 8, y + h * .2, w - 16, 5, '#5a442c') + L(x + w * .3, y + h * .3, x + w * .3, y + h * .8, '#2a1c10', 2) + L(x + w * .7, y + h * .3, x + w * .7, y + h * .8, '#2a1c10', 2) + L(x + 4, y + 5, x + w * .55, y + h * .65, '#8d7350', 3, 'stroke-linecap="round"') + poly([[x + 2, y + 3], [x + 8, y + 1], [x + 24, y + 14], [x + 19, y + 20]], '#a88a59') + E(x + w / 2, y + h * .23, w * .42, h * .14, '#251a11', W) + L(x + w * .32, y + h * .2, x + w * .32, y + h * .43, '#795639', 5) + L(x + w * .68, y + h * .2, x + w * .68, y + h * .43, '#795639', 5);
  },
  ticketmachine(u, x, y, w, h, o) {
    return sh(x, y, w, h) + R(x, y, w, h, '#2b3133', S + ' rx="6"') + R(x + 8, y + 12, w - 16, h * .22, o.on ? '#4f6e52' : '#17201d', 'rx="3"') + R(x + w / 2 - 12, y + 20, 24, 12, '#b9b393', 'rx="2"') + L(x + w / 2 + 5, y + 22, x + w / 2 + 5, y + 30, '#625f4e', 1, 'stroke-dasharray="2 2"') + [0, 1, 2].map(i => C(x + 17 + i * 16, y + h * .43, 4, '#899180', 'stroke="#151b18" stroke-width="1"')).join('') + R(x + w - 16, y + h * .54, 5, 16, '#0b0c0b', 'rx="2"') + R(x + 10, y + h * .75, w - 20, h * .14, '#111815', 'rx="3"') + (o.on ? R(x + w / 2 - 9, y + h * .8, 18, 15, '#d8cfad', 'stroke="#6e6652" stroke-width="1"') : '');
  },
  vending(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + R(x, y, w, h, '#3a2422', S + ' rx="5"') + R(x + 8, y + 10, w * .62, h * .62, o.on ? '#2e3a36' : '#141a1a', 'rx="3"');
    for (let r0 = 0; r0 < 4; r0++) for (let c0 = 0; c0 < 3; c0++) s += R(x + 12 + c0 * (w * .2), y + 16 + r0 * (h * .14), w * .14, h * .09, ['#5a4a30', '#3d4a52', '#4a3a3a'][(r0 + c0) % 3], 'opacity=".85"');
    return s + R(x + w * .74, y + 14, w * .18, h * .3, '#1d2224') + R(x + 10, y + h * .8, w - 20, h * .1, '#0b0c0b', 'rx="2"');
  },
  rock(u, x, y, w, h, o) {
    const rx = x + (o.on ? w * .24 : 0), rw = x + w - rx;
    return sh(x, y, w, h) + (o.on ? E(x + w * .25, y + h - 5, w * .2, 5, '#120f0c') : '') + P(`M${rx} ${y + h}Q${rx + 4} ${y + h * .3} ${rx + rw * .45} ${y + 2}Q${x + w - 2} ${y + h * .1} ${x + w - 2} ${y + h}Z`, '#4a4743', 'stroke="#2a2826" stroke-width="2"') + L(rx + rw * .3, y + h * .4, rx + rw * .5, y + h * .6, '#2a2826', 1.5);
  },  statue(u, x, y, w, h) {
    const cx = x + w / 2, ped = y + h * .55;
    return sh(x, y, w, h) + R(x, ped, w, h - (ped - y), '#4a4743', 'stroke="#2a2826" stroke-width="2"') + R(x - 4, ped, w + 8, 8, '#5d5a54') + C(cx, y + h * .14, w * .2, '#6a665e') + P(`M${r(cx - w * .36)} ${r(ped)}Q${r(cx - w * .3)} ${r(y + h * .26)} ${r(cx)} ${r(y + h * .27)}Q${r(cx + w * .3)} ${r(y + h * .26)} ${r(cx + w * .36)} ${r(ped)}Z`, '#6a665e') + R(x + w * .2, ped + h * .14, w * .6, h * .1, '#8c7442', 'opacity=".6"');
  },
  sarcophagus(u, x, y, w, h, o) {
    const cx = x + w / 2, top = y + 3, cy = top + 20;
    const lid = (dx, ink) => P(`M${cx + dx - 16} ${top + 21}Q${cx + dx - 17} ${top} ${cx + dx} ${top}Q${cx + dx + 17} ${top} ${cx + dx + 16} ${top + 21}L${cx + dx + 23} ${top + 31}L${cx + dx + 15} ${y + h - 5}Q${cx + dx} ${y + h} ${cx + dx - 15} ${y + h - 5}L${cx + dx - 23} ${top + 31}Z`, ink, 'stroke="#3b3020" stroke-width="2"');
    let s = sh(x, y, w, h) + lid(0, '#9a895f');
    if (o.on) s += P(`M${cx - 12} ${top + 22}Q${cx - 13} ${top + 6} ${cx} ${top + 6}Q${cx + 13} ${top + 6} ${cx + 12} ${top + 22}L${cx + 18} ${top + 33}L${cx + 10} ${y + h - 8}H${cx - 10}L${cx - 18} ${top + 33}Z`, '#17130b') + lid(24, '#8a7953');
    const dx = o.on ? 24 : 0;
    s += poly([[cx + dx - 14, cy - 12], [cx + dx + 14, cy - 12], [cx + dx + 15, cy + 13], [cx + dx - 15, cy + 13]], '#4d625b', 'stroke="#b39b67" stroke-width="1.5"') + E(cx + dx, cy, 8, 11, '#c5ac77', 'stroke="#665232" stroke-width="1"') + C(cx + dx - 3, cy - 2, 1.3, '#302717') + C(cx + dx + 3, cy - 2, 1.3, '#302717') + L(cx + dx - 3, cy + 6, cx + dx + 3, cy + 6, '#665232', 1.3);
    s += L(cx + dx - 12, cy + 18, cx + dx + 10, cy + 29, '#c5ac77', 3, 'stroke-linecap="round"') + L(cx + dx + 12, cy + 18, cx + dx - 10, cy + 29, '#c5ac77', 3, 'stroke-linecap="round"');
    for (const yy of [cy + 37, cy + 45, cy + 53]) s += L(cx + dx - 7, yy, cx + dx + 7, yy, '#4d625b', 2);
    return s;
  }, mannequin(u, x, y, w, h) {
    const cx = x + w / 2;
    return sh(x, y, w, h) + R(cx - 2, y + h * .62, 4, h * .36, '#3a2b1b') + E(cx, y + h - 2, w * .3, 4, '#3a2b1b') + C(cx, y + 10, 9, '#8d8676') + P(`M${cx - w * .42} ${y + h * .2}Q${cx} ${y + h * .12} ${cx + w * .42} ${y + h * .2}L${cx + w * .3} ${y + h * .4}Q${cx + w * .46} ${y + h * .55} ${cx + w * .3} ${y + h * .64}H${cx - w * .3}Q${cx - w * .46} ${y + h * .55} ${cx - w * .3} ${y + h * .4}Z`, '#cfc8b4', 'stroke="#6d6658" stroke-width="1.5"') + L(cx, y + h * .2, cx, y + h * .64, '#6d6658', 1, 'stroke-dasharray="3 3"');
  },
  easel(u, x, y, w, h) {
    const cx = x + w / 2;
    return sh(x, y, w, h) + L(cx, y, x + 6, y + h, '#5a442c', 4) + L(cx, y, x + w - 6, y + h, '#5a442c', 4) + L(cx, y + 10, cx + 6, y + h, '#4a3624', 3) + R(x + 4, y + 14, w - 8, h * .48, '#d9cfb3', 'stroke="#5a442c" stroke-width="3"') + R(x - 2, y + h * .62, w + 4, 6, '#5a442c');
  },
  microscope(u, x, y, w, h) {
    const cx = x + w * .45, cy = y + h * .3;
    return sh(x, y, w, h) + E(x + w / 2, y + h - 5, w * .43, 5, '#59625d') + P(`M${x + w * .7} ${y + h - 8}Q${x + w * .95} ${y + h * .42} ${cx + 8} ${cy}`, 'none', 'stroke="#59625d" stroke-width="8"') + `<g transform="rotate(-20 ${r(cx)} ${r(cy)})">${R(cx - 6, y + 6, 12, h * .43, K(u, 'steel'), 'rx="3"')}${R(cx - 8, y + 1, 16, 7, '#1d2421', 'rx="2"')}${R(cx - 4, y + h * .49, 8, 9, '#a4aca4', 'rx="2"')}</g>` + C(x + w * .72, y + h * .4, 7, '#252c28', 'stroke="#8c958b" stroke-width="2"') + R(x + w * .2, y + h * .62, w * .5, 5, '#6e7770') + E(x + w * .43, y + h * .69, 6, 4, '#b6ae8a');
  },
  flasks(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + R(x, y + h - 10, w, 10, K(u, 'woodl'), W);
    [.18, .5, .82].forEach((k, i) => { const cx = x + w * k; s += P(`M${cx - 5} ${y + 6}H${cx + 5}V${y + h * .4}L${cx + 18} ${y + h - 10}H${cx - 18}L${cx - 5} ${y + h * .4}Z`, '#c9d6d3', 'opacity=".4" stroke="#8d958f" stroke-width="1.5"') + P(`M${cx - 12} ${y + h * .76}L${cx + 12} ${y + h * .76}L${cx + 18} ${y + h - 10}H${cx - 18}Z`, ['#46704f', '#8e3b30', '#3d5f80'][i], `opacity="${o.on ? .9 : .55}"`); });
    return s;
  },
  helm(u, x, y, w, h) {
    const cx = x + w / 2, cy = y + w * .5, rr = w * .34;
    let s = sh(x, y, w, h) + R(cx - 8, cy, 16, h - (cy - y), '#3a2b1b') + C(cx, cy, rr, 'none', 'stroke="#6a4524" stroke-width="7"');
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; s += L(cx, cy, cx + Math.cos(a) * (rr + 12), cy + Math.sin(a) * (rr + 12), '#6a4524', 4, 'stroke-linecap="round"'); }
    return s + C(cx, cy, 8, K(u, 'brass'));
  },
  bigbell(u, x, y, w, h, o) {
    const cx = x + w / 2;
    return R(cx - 22, y, 44, 8, K(u, 'wood')) + (o.on ? C(cx, y + h * .6, w * .7, K(u, 'glow')) : '') + P(`M${cx} ${y + 8}Q${x + w - 6} ${y + 12} ${x + w - 8} ${y + h * .7}L${x + w} ${y + h - 6}H${x}L${x + 8} ${y + h * .7}Q${x + 6} ${y + 12} ${cx} ${y + 8}Z`, K(u, 'brass'), 'stroke="#5f4c2c" stroke-width="2"') + C(cx, y + h - 5, 5, '#5f4c2c') + L(x + 14, y + h * .72, x + w - 14, y + h * .72, '#5f4c2c', 1.5, 'opacity=".6"');
  },
  horn(u, x, y, w, h, o) {
    return R(x + 4, y + h * .4, 10, h * .2, '#22262a') + poly([[x + 14, y + h * .36], [x + w, y], [x + w, y + h], [x + 14, y + h * .64]], o.on ? '#5a5f5c' : '#3a3f3c', 'stroke="#1b1e1c" stroke-width="2"') + E(x + w, y + h / 2, 6, h / 2, '#151817');
  },
  dish(u, x, y, w, h, o) {
    const cx = x + w / 2;
    return sh(x, y, w, h) + L(cx, y + h * .5, cx - 16, y + h, '#3a3f42', 5) + L(cx, y + h * .5, cx + 16, y + h, '#3a3f42', 5) + `<g transform="rotate(${o.on ? -30 : -12} ${r(cx)} ${r(y + h * .42)})">${P(`M${x + w * .1} ${y + h * .2}Q${cx} ${y + h * .78} ${x + w * .9} ${y + h * .2}Z`, '#8d938c', 'stroke="#3a3f42" stroke-width="2"')}${L(cx, y + h * .42, cx, y + h * .12, '#3a3f42', 2)}${C(cx, y + h * .1, 4, o.on ? '#9fe0a8' : '#3a3f42')}</g>`;
  },
  rack(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + R(x, y, w, h, '#1d2224', S + ' rx="4"');
    for (let i = 0; i < 7; i++) s += R(x + 6, y + 10 + i * (h - 20) / 7, w - 12, (h - 20) / 7 - 5, '#2b3133', 'rx="2"') + C(x + w - 14, y + 10 + i * (h - 20) / 7 + 6, 2.4, o.on ? '#9fe0a8' : (i % 3 ? '#3a403d' : '#8e3b30'));
    return s;
  },
  projector(u, x, y, w, h, o) {
    const ty = y + h * .3;
    return (o.on ? poly([[x + w, ty + 16], [x + w + 140, ty - 40], [x + w + 140, ty + 80]], K(u, 'ray')) : '') + sh(x, y, w, h) + L(x + w / 2, ty + h * .3, x + 8, y + h, '#2a2e2b', 3) + L(x + w / 2, ty + h * .3, x + w - 8, y + h, '#2a2e2b', 3) + R(x + 6, ty, w - 12, h * .3, '#2b3133', S + ' rx="4"') + C(x + w * .3, ty - 10, 13, 'none', 'stroke="#3c4542" stroke-width="4"') + C(x + w * .62, ty - 10, 13, 'none', 'stroke="#3c4542" stroke-width="4"') + R(x + w - 10, ty + 8, 12, 14, '#59625d') + [x + w * .3, x + w * .62].map(cx => C(cx, ty - 10, 3, '#9ba39a') + [0, 120, 240].map(a => C(cx + Math.cos(a * Math.PI / 180) * 7, ty - 10 + Math.sin(a * Math.PI / 180) * 7, 2.5, '#17201b')).join('')).join('') + L(x + w * .3, ty + 1, x + w * .62, ty + 1, '#8b957f', 1.5) + E(x + w - 2, ty + 15, 3, 7, o.on ? '#cbbd91' : '#1a2420');
  },
  cart(u, x, y, w, h, o) {
    return sh(x, y, w, h) + L(x + 14, y + h * .6, x + 14, y + h - 8, '#59625d', 5) + L(x + w - 14, y + h * .6, x + w - 14, y + h - 8, '#59625d', 5) + L(x + 14, y + h - 10, x + w - 14, y + h - 10, '#59625d', 3) + R(x, y + h * .1, w, h * .55, K(u, 'steel'), S + ' rx="3"') + (o.on ? R(x + 6, y + h * .1, w - 12, 8, '#0b0c0b') : R(x - 2, y + h * .05, w + 4, 8, '#4a5450', 'rx="2"')) + C(x + 14, y + h - 8, 8, '#1b1e1c') + C(x + w - 14, y + h - 8, 8, '#1b1e1c') + L(x + w, y + h * .2, x + w + 16, y, '#3a3f3c', 4);
  },
  fountain(u, x, y, w, h, o) {
    const cx = x + w / 2;
    let s = sh(x, y, w, h) + E(cx, y + h * .58, w / 2, 12, '#4a4743') + R(x, y + h * .58, w, h * .42, '#4a4743', 'stroke="#2a2826" stroke-width="2"') + E(cx, y + h * .58, w / 2 - 8, 8, o.on ? '#2d4a52' : '#1a1d1c') + R(cx - 6, y + h * .2, 12, h * .38, '#5d5a54') + E(cx, y + h * .2, 22, 6, '#5d5a54');
    if (o.on) s += P(`M${cx} ${y + h * .18}Q${cx - 16} ${y} ${cx - 28} ${y + h * .52}`, 'none', 'stroke="#7fa0a8" stroke-width="2" opacity=".7"') + P(`M${cx} ${y + h * .18}Q${cx + 16} ${y} ${cx + 28} ${y + h * .52}`, 'none', 'stroke="#7fa0a8" stroke-width="2" opacity=".7"');
    return s;
  },
  sled(u, x, y, w, h) {
    let s = sh(x, y, w, h);
    for (const dy of [-7, 0]) s += P(`M${x + 3} ${y + h - 6 + dy}H${x + w - 16}Q${x + w - 1} ${y + h - 6 + dy} ${x + w - 3} ${y + h * .38 + dy}`, 'none', 'stroke="#8a9389" stroke-width="3"');
    s += R(x + 6, y + 5, w - 24, h * .32, K(u, 'woodl'), W) + [x + 16, x + w - 32].map(a => L(a, y + h * .4, a, y + h - 6, '#7b5e3a', 4)).join('');
    for (let xx = x + 12; xx < x + w - 20; xx += 16) s += L(xx, y + 7, xx, y + h * .36, '#352719', 1.5);
    return s;
  },
  tombstone(u, x, y, w, h) {
    return sh(x, y, w, h) + P(`M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z`, '#4a4e4c', 'stroke="#262a28" stroke-width="2"') + L(x + w * .3, y + h * .4, x + w * .7, y + h * .4, '#2a2e2c', 2) + L(x + w * .3, y + h * .52, x + w * .6, y + h * .52, '#2a2e2c', 2) + E(x + w / 2, y + h, w * .7, 5, '#26301f');
  },
  organ(u, x, y, w, h) {
    let s = sh(x, y, w, h) + R(x, y + h * .5, w, h * .5, K(u, 'wood'), W);
    for (let i = 0; i < 9; i++) { const ph = h * (.3 + .2 * Math.sin((i / 8) * Math.PI)); s += R(x + 4 + i * (w - 8) / 9, y + h * .5 - ph, (w - 8) / 9 - 3, ph, K(u, 'brass'), 'rx="3"'); }
    for (const ky of [y + h * .62, y + h * .74]) { const kw = (w - 16) / 14; s += R(x + 8, ky, w - 16, 10, '#e6dfcc'); for (let i = 1; i < 14; i++) s += L(x + 8 + i * kw, ky + 5, x + 8 + i * kw, ky + 10, '#625b4e', .7) + ([0, 3].includes(i % 7) ? '' : R(x + 8 + i * kw - 1.5, ky, 3, 6, '#171b18')); }
    return s;
  },
  console(u, x, y, w, h, o) {
    let s = sh(x, y, w, h) + poly([[x, y + h * .3], [x + w, y + h * .3], [x + w - 6, y + h], [x + 6, y + h]], '#2b3133', S) + R(x + 6, y, w - 12, h * .32, '#1b1e1c', 'rx="3"') + R(x + 12, y + 6, w - 24, h * .2, o.on ? '#2f5a44' : '#0f1414');
    for (let i = 0; i < 6; i++) s += C(x + 16 + i * (w - 32) / 5, y + h * .5, 4, i % 2 ? '#7a2a1e' : '#c9a45a', `opacity="${o.on ? 1 : .5}"`);
    return s;
  },
  phonebooth(u, x, y, w, h, o) {
    return sh(x, y, w, h) + R(x, y, w, h, '#4a2420', 'stroke="#2a1412" stroke-width="2" rx="4"') + R(x + 8, y + 22, w - 16, h * .64, '#c9d6d3', 'opacity=".14"') + [.36, .52, .68].map(k => L(x + 8, y + h * k, x + w - 8, y + h * k, '#4a2420', 3)).join('') + R(x + 6, y + 6, w - 12, 10, o.on ? '#e8c98a' : '#2a1412') + R(x + w * .36, y + h * .27, w * .35, h * .25, '#3c4542', 'rx="3" stroke="#778079" stroke-width="1"') + R(x + w * .51, y + h * .29, w * .15, h * .08, '#b1b3a0', 'rx="1"') + P(`M${x + w * .41} ${y + h * .29}q-5 6 -1 20`, 'none', 'stroke="#111815" stroke-width="5" stroke-linecap="round"') + P(`M${x + w * .41} ${y + h * .4}q-5 12 4 20t-2 20`, 'none', 'stroke="#687269" stroke-width="1.2"') + L(x + w * .5, y + 22, x + w * .5, y + h * .87, '#4a2420', 3) + R(x + w * .8, y + h * .53, 3, 18, K(u, 'brass'), 'rx="1.5"');
  },
  scale(u, x, y, w, h, o) {
    const cx = x + w / 2, tilt = o.on ? 0 : 10;
    return sh(x, y, w, h) + R(cx - 4, y + 14, 8, h - 18, K(u, 'brass')) + E(cx, y + h - 4, w * .3, 6, K(u, 'brass')) + L(x + 6, y + 18 + tilt, x + w - 6, y + 18 - tilt, '#8c7442', 4) + [[x + 17, y + 18 + tilt], [x + w - 17, y + 18 - tilt]].map(([a, b]) => L(a, b, a - 10, b + 28, '#8c7442', 1) + L(a, b, a + 10, b + 28, '#8c7442', 1) + E(a, b + 30, 14, 5, K(u, 'brass'))).join('');
  },
  skirack(u, x, y, w, h) {
    let s = sh(x, y, w, h) + R(x, y + h * .2, w, 8, K(u, 'wood')) + R(x, y + h - 14, w, 8, K(u, 'wood'));
    for (let i = 0; i < 5; i++) { const xx = x + 8 + i * (w - 16) / 5, yy = y + (i % 2) * 8; s += R(xx, yy, 9, h - 8 - (i % 2) * 8, ['#795043', '#4d697b', '#68765a'][i % 3], 'rx="4.5"') + L(xx + 2, yy + 12, xx + 7, yy + 7, '#c0b79b', 1.5) + R(xx - 1, y + h * .5, 11, 17, '#262e28', 'rx="2"') + R(xx + 1, y + h * .51, 7, 4, '#a1a696', 'rx="1"'); }
    return s;
  },
  jar(u, x, y, w, h, o) {
    return sh(x, y, w, h) + P(`M${x + w * .25} ${y + 8}H${x + w * .75}Q${x + w + 4} ${y + h * .3} ${x + w * .9} ${y + h}H${x + w * .1}Q${x - 4} ${y + h * .3} ${x + w * .25} ${y + 8}Z`, '#5a4a3a', 'stroke="#2a2016" stroke-width="2"') + (o.on ? E(x + w / 2, y + 9, w * .25, 4, '#120d08') : R(x + w * .2, y, w * .6, 10, '#3a2b1b', 'rx="3"')) + L(x + w * .2, y + h * .5, x + w * .8, y + h * .5, '#2a2016', 1.5, 'opacity=".6"');
  },
  cauldron(u, x, y, w, h, o) {
    const cx = x + w / 2;
    return (o.on ? C(cx, y + h * .3, w * .5, K(u, 'glow')) : '') + sh(x, y, w, h) + P(`M${x} ${y + h * .2}H${x + w}Q${x + w} ${y + h * .9} ${cx} ${y + h * .9}Q${x} ${y + h * .9} ${x} ${y + h * .2}Z`, '#2a2e2b', 'stroke="#141615" stroke-width="2"') + E(cx, y + h * .2, w / 2, 7, o.on ? '#3a5a40' : '#141615') + L(x + 12, y + h * .88, x + 4, y + h, '#2a2e2b', 4) + L(x + w - 12, y + h * .88, x + w - 4, y + h, '#2a2e2b', 4);
  },

  // ── 출구입니다. on이면 열린 모습입니다.
  gate(u, x, y, w, h, o) {
    let s = R(x - 10, y - 10, 12, h + 10, '#2a2e30') + R(x + w - 2, y - 10, 12, h + 10, '#2a2e30') + C(x - 4, y - 14, 7, '#3a3f42') + C(x + w + 4, y - 14, 7, '#3a3f42');
    if (o.on) {
      s += R(x, y, w, h, K(u, 'hall')) + poly([[x, y + h], [x + w, y + h], [x + w + 60, 480], [x - 60, 480]], K(u, 'ray'));
      for (let i = 0; i < 4; i++) s += L(x + 4 + i * 7, y + 4, x + 4 + i * 7, y + h, '#2a2e30', 4) + L(x + w - 4 - i * 7, y + 4, x + w - 4 - i * 7, y + h, '#2a2e30', 4);
      return s;
    }
    s += R(x, y, w, h, '#0e1012', 'opacity=".55"');
    for (let i = 0; i <= 8; i++) s += L(x + 4 + i * (w - 8) / 8, y + 6, x + 4 + i * (w - 8) / 8, y + h, '#2a2e30', 4);
    return s + R(x, y + 18, w, 6, '#2a2e30') + R(x, y + h * .55, w, 6, '#2a2e30') + R(x + w / 2 - 12, y + h * .5, 24, 26, K(u, 'brass'), 'rx="3"') + C(x + w / 2, y + h * .5 + 13, 3, '#120d08');
  },
  hatch(u, x, y, w, h, o) {
    if (o.on) {
      let s = E(x + w / 2, y + h / 2, w / 2, h / 2, '#0b0907', 'stroke="#66553b" stroke-width="3"') + poly([[x + 5, y + h * .18], [x + w * .16, y - h * .85], [x + w * .84, y - h * .85], [x + w - 5, y + h * .18]], K(u, 'woodl'), W) + poly([[x + 18, y + h * .06], [x + w * .23, y - h * .64], [x + w * .77, y - h * .64], [x + w - 18, y + h * .06]], 'none', 'stroke="#3a2b1b" stroke-width="2"');
      for (const side of [-1, 1]) s += L(x + w / 2 + side * w * .19, y + h * .28, x + w / 2 + side * w * .12, y + h * .88, '#8b7654', 3);
      for (const k of [.36, .54, .72]) s += L(x + w / 2 - w * (.22 - k * .1), y + h * k, x + w / 2 + w * (.22 - k * .1), y + h * k, '#a58b60', 3);
      return s;
    }
    return E(x + w / 2, y + h / 2 + 3, w / 2, h / 2, '#000', 'opacity=".4"') + E(x + w / 2, y + h / 2, w / 2, h / 2, K(u, 'woodl'), W) + L(x + 14, y + h / 2, x + w - 14, y + h / 2, '#3a2b1b', 2) + C(x + w / 2, y + h / 2, 6, K(u, 'brass'));
  },
  elevator(u, x, y, w, h, o) {
    let s = R(x - 8, y - 22, w + 16, h + 22, '#3a3f42') + R(x + w / 2 - 22, y - 18, 44, 12, '#0f1414') + T(x + w / 2, y - 12, o.on ? '▲' : '·', 10, '#e0a24a');
    if (o.on) return s + R(x, y, w, h, K(u, 'hall')) + R(x, y, 12, h, '#59625d') + R(x + w - 12, y, 12, h, '#59625d') + poly([[x, y + h], [x + w, y + h], [x + w + 50, 480], [x - 50, 480]], K(u, 'ray'));
    return s + R(x, y, w / 2 - 1, h, K(u, 'steel'), S) + R(x + w / 2 + 1, y, w / 2 - 1, h, K(u, 'steel'), S) + R(x + w + 12, y + h * .45, 10, 22, '#1d2224', 'rx="2"') + C(x + w + 17, y + h * .45 + 11, 3, '#c9a45a');
  },
  ladder(u, x, y, w, h, o) {
    let s = R(x - 30, y - 30, w + 60, 26, '#120e0a') + (o.on ? R(x - 26, y - 28, w + 52, 22, K(u, 'hall')) + C(x + w / 2, y - 10, 40, K(u, 'glow')) : R(x - 26, y - 28, w + 52, 22, K(u, 'woodl'), W) + C(x + w / 2, y - 17, 4, K(u, 'brass')));
    s += R(x, y, 7, h, '#5a442c') + R(x + w - 7, y, 7, h, '#5a442c');
    for (let k = y + 24; k < y + h - 10; k += 34) s += R(x + 5, k, w - 10, 6, '#6a4f33');
    return s;
  },
  stonedoor(u, x, y, w, h, o) {
    const dx = o.on ? w * .78 : 0;
    let s = R(x - 10, y - 12, w + 20, h + 12, '#3e3a33') + R(x, y, w, h, o.on ? K(u, 'hall') : '#120f0c');
    s += R(x + dx, y, w, h, '#57524a', 'stroke="#2a2622" stroke-width="2"') + C(x + dx + w / 2, y + h * .4, w * .24, 'none', 'stroke="#2a2622" stroke-width="3"') + C(x + dx + w / 2, y + h * .4, w * .1, 'none', 'stroke="#2a2622" stroke-width="2"');
    return o.on ? s + poly([[x, y + h], [x + dx, y + h], [x + dx + 40, 480], [x - 40, 480]], K(u, 'ray')) : s;
  },
  sliding(u, x, y, w, h, o) {
    let s = R(x - 8, y - 8, w + 16, h + 8, '#2a2117') + R(x, y, w, h, o.on ? K(u, 'hall') : '#120e0a');
    const px = o.on ? x + w * .62 : x;
    s += R(px, y, w, h, '#d9cfb3', 'opacity=".9" stroke="#2a2117" stroke-width="3"');
    for (let k = 1; k < 4; k++) s += L(px + 3, y + k * h / 4, px + w - 3, y + k * h / 4, '#2a2117', 3);
    s += L(px + w / 2, y + 3, px + w / 2, y + h - 3, '#2a2117', 3) + R(px + w - 14, y + h * .5, 6, 22, '#3a2b1d', 'rx="3"');
    return s;
  },
  curtainexit(u, x, y, w, h, o) {
    const half = o.on ? w * .22 : w / 2;
    let s = R(x - 10, y - 14, w + 20, 14, K(u, 'brass')) + R(x, y, w, h, o.on ? K(u, 'hall') : '#1a0d0c');
    for (const side of [0, 1]) {
      const sx = side ? x + w - half : x;
      s += R(sx, y, half, h, '#5a2a24');
      for (let i = 1; i < 4; i++) s += L(sx + i * half / 4, y + 2, sx + i * half / 4 + (side ? -4 : 4), y + h, '#3a1a16', 4, 'opacity=".6"');
    }
    return o.on ? s + poly([[x + half, y + h], [x + w - half, y + h], [x + w - half + 50, 480], [x + half - 50, 480]], K(u, 'ray')) : s;
  },
};
// 큰 확대 그림에서도 바깥 물건의 폭/높이와 작은 부속품을 함께 확대합니다.
// 설계서의 조사 사각형은 그대로 두고, 원래 크기의 그림을 아래쪽 가운데에 맞춥니다.
const FACILITY_SIZE = { mailbox: [56, 100], lamppost: [52, 210], bench: [104, 62], well: [92, 112], signpost: [84, 132], noticeboard: [100, 120], tent: [112, 100], campfire: [84, 64], anchor: [72, 104], buoy: [62, 92], boat: [108, 60], ticketmachine: [66, 132], vending: [84, 166], rock: [92, 72], statue: [72, 156], sarcophagus: [108, 92], mannequin: [62, 150], easel: [84, 134], microscope: [62, 82], flasks: [100, 72], helm: [92, 116], bigbell: [80, 96], horn: [90, 60], dish: [92, 112], rack: [72, 166], projector: [84, 104], cart: [100, 82], fountain: [108, 112], sled: [104, 62], tombstone: [62, 92], organ: [108, 152], console: [104, 104], phonebooth: [74, 184], scale: [92, 92], skirack: [104, 132], jar: [58, 82], cauldron: [92, 82] };
for (const [kind, [nw, nh]] of Object.entries(FACILITY_SIZE)) {
  const draw = PROPS[kind];
  PROPS[kind] = (u, x, y, w, h, o = {}) => {
    const scale = Math.min(w / nw, h / nh), dx = x + (w - nw * scale) / 2, dy = y + h - nh * scale;
    const id = `${u}-fit-${kind}-${r(x)}-${r(y)}`;
    return `<clipPath id="${id}">${R(x, y, w, h + 8, '#fff')}</clipPath><g clip-path="url(#${id})"><g transform="translate(${r(dx)} ${r(dy)}) scale(${scale})">${draw(u, 0, 0, nw, nh, o)}</g></g>`;
  };
}
export const PROP_KINDS = Object.keys(PROPS);

// 가방 물건 그림입니다. 64칸 안에 그리고, tone을 주면 같은 모양을 다른 색으로 칠합니다.
const tn = (t, d) => (t ? MUTED[t] ?? t : d);
const gearD = (cx, cy, r1, r2, n) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a0 = (i * Math.PI) / n, a1 = ((i + 1) * Math.PI) / n, rr = i % 2 ? r1 : r2;
    d += `${i ? 'L' : 'M'}${r(cx + Math.cos(a0) * rr)} ${r(cy + Math.sin(a0) * rr)}L${r(cx + Math.cos(a1) * rr)} ${r(cy + Math.sin(a1) * rr)}`;
  }
  return d + 'Z';
};
const tilt = (deg, body) => `<g transform="rotate(${deg} 32 32)">${body}</g>`;
export const ITEM_ART = {
  key: (u, t) => tilt(-35, C(17, 32, 10, 'none', `stroke="${tn(t, '#c9a45a')}" stroke-width="5"`) + R(26, 29.5, 30, 5, tn(t, '#c9a45a'), 'rx="2"') + R(46, 34, 4, 9, tn(t, '#c9a45a')) + R(52, 34, 4, 6, tn(t, '#c9a45a'))),
  card: (u, t) => tilt(-12, R(9, 18, 46, 30, '#000', 'opacity=".3" rx="4"') + R(8, 16, 46, 30, tn(t, '#3d5f80'), 'rx="4" stroke="#1b2028" stroke-width="1.5"') + R(8, 22, 46, 6, '#1b1d1c') + R(13, 33, 13, 9, K(u, 'brass'), 'rx="1.5"')),
  fuse: (u, t) => tilt(-30, R(22, 14, 20, 36, '#c9d6d3', 'opacity=".55" stroke="#8d958f" stroke-width="1.5"') + L(32, 18, 32, 46, tn(t, '#8e3b30'), 2.5) + R(20, 8, 24, 9, K(u, 'brass'), 'rx="2"') + R(20, 47, 24, 9, K(u, 'brass'), 'rx="2"')),
  gear: (u, t) => P(gearD(32, 32, 16, 21, 9), t ? tn(t) : K(u, 'brass'), 'stroke="#5f4c2c" stroke-width="1.5"') + C(32, 32, 7, '#2a2118') + C(32, 32, 3, K(u, 'brass')),
  battery: (u, t) => tilt(-20, R(12, 22, 38, 20, tn(t, '#46704f'), 'rx="3" stroke="#1e2a20" stroke-width="1.5"') + R(12, 22, 10, 20, '#1d201e', 'rx="3"') + R(50, 27, 4, 10, '#a7a99f', 'rx="1"') + L(36, 28, 36, 36, '#e6dfcc', 2) + L(32, 32, 40, 32, '#e6dfcc', 2)),
  coin: (u, t) => C(33, 34, 17, '#000', 'opacity=".3"') + C(32, 32, 17, t ? tn(t) : K(u, 'brass'), 'stroke="#5f4c2c" stroke-width="1.5"') + C(32, 32, 12, 'none', 'stroke="#5f4c2c" stroke-width="1" opacity=".7"') + poly([[32, 24], [34, 30], [40, 30], [35, 34], [37, 40], [32, 36], [27, 40], [29, 34], [24, 30], [30, 30]], '#5f4c2c'),
  ticket: (u, t) => tilt(-10, R(7, 20, 50, 26, tn(t, '#d9c99a'), 'rx="2" stroke="#8d7c5a" stroke-width="1.5"') + L(42, 22, 42, 44, '#8d7c5a', 1.5, 'stroke-dasharray="3 3"') + R(12, 26, 24, 3, '#6d604a', 'opacity=".6"') + R(12, 33, 18, 3, '#6d604a', 'opacity=".6"') + C(49, 33, 4, '#6d604a', 'opacity=".5"')),
  magnifier: u => C(26, 26, 15, '#c9d6d3', 'opacity=".4"') + C(26, 26, 15, 'none', `stroke="url(#${u}-brass)" stroke-width="4"`) + L(37, 37, 54, 54, '#3a2b1b', 7, 'stroke-linecap="round"') + L(19, 20, 24, 15, '#fff', 2, 'opacity=".5" stroke-linecap="round"'),
  match: () => R(10, 28, 44, 22, '#7a3a2e', 'rx="2" stroke="#3a1a16" stroke-width="1.5"') + R(14, 32, 36, 14, '#d9c99a') + L(18, 22, 46, 12, '#d9c99a', 3, 'stroke-linecap="round"') + C(47, 11.5, 3.5, '#8e3b30'),
  candle: u => E(32, 52, 16, 5, K(u, 'brass')) + R(26, 18, 12, 34, '#cbbd98', 'rx="2"') + L(32, 18, 32, 12, '#2a2118', 1.5),
  tape: () => R(8, 16, 48, 32, '#2a2e2b', 'rx="3" stroke="#151817" stroke-width="1.5"') + R(14, 21, 36, 13, '#d9c99a') + C(24, 27.5, 4.5, '#1b1b1b') + C(40, 27.5, 4.5, '#1b1b1b') + R(20, 38, 24, 7, '#151817', 'rx="1"'),
  letter: (u, t) => R(9, 20, 48, 30, '#000', 'opacity=".3"') + R(8, 18, 48, 30, '#d9cfb3', 'stroke="#8d7c5a" stroke-width="1.5"') + P('M8 18L32 35L56 18', 'none', 'stroke="#8d7c5a" stroke-width="1.5"') + C(32, 35, 5, tn(t, '#8e3b30')),
  pic: () => tilt(-6, R(10, 14, 44, 38, '#e6dfcc', 'stroke="#b9b3a2" stroke-width="1.5"') + R(14, 18, 36, 26, '#3d4a52') + poly([[14, 44], [26, 30], [34, 38], [40, 32], [50, 44]], '#5d6b5a') + C(42, 24, 3, '#d9cfb3')),
  crank: u => L(14, 50, 14, 22, '#3a403d', 6, 'stroke-linecap="round"') + L(14, 22, 44, 22, '#3a403d', 6, 'stroke-linecap="round"') + R(40, 12, 12, 22, '#6a4524', 'rx="5"') + C(14, 50, 6, K(u, 'brass')),
  hammer: () => tilt(-35, R(29, 18, 6, 40, '#6a4524', 'rx="2"') + R(16, 10, 32, 12, '#5b6661', 'rx="2" stroke="#262d2a" stroke-width="1.5"')),
  scissors: () => C(18, 44, 7, 'none', 'stroke="#3a403d" stroke-width="3.5"') + C(30, 52, 7, 'none', 'stroke="#3a403d" stroke-width="3.5"') + L(22, 39, 50, 12, '#a7a99f', 4, 'stroke-linecap="round"') + L(30, 45, 54, 18, '#c9c2ad', 4, 'stroke-linecap="round"'),
  spool: (u, t) => R(18, 12, 28, 6, K(u, 'woodl'), 'rx="2"') + R(18, 46, 28, 6, K(u, 'woodl'), 'rx="2"') + R(22, 18, 20, 28, tn(t, '#8e3b30')) + [24, 30, 36].map(y => L(22, y, 42, y + 4, '#000', 1, 'opacity=".25"')).join(''),
  flower: (u, t) => L(32, 28, 32, 58, '#46704f', 3) + E(25, 46, 7, 3.5, '#46704f', 'transform="rotate(-30 25 46)"') + [0, 72, 144, 216, 288].map(a => { const x = 32 + Math.cos((a * Math.PI) / 180) * 8, y = 22 + Math.sin((a * Math.PI) / 180) * 8; return E(x, y, 7, 5, tn(t, '#b08a3a'), `transform="rotate(${a} ${r(x)} ${r(y)})"`); }).join('') + C(32, 22, 4.5, '#5f4c2c'),
  seeds: (u, t) => R(14, 10, 36, 46, '#cdbf9b', 'stroke="#8d7c5a" stroke-width="1.5"') + R(14, 10, 36, 8, '#8d7c5a') + E(32, 36, 7, 10, tn(t, '#46704f')) + L(32, 28, 32, 44, '#2a3a2c', 1.5),
  loaf: () => E(32, 38, 24, 14, '#b07a42', 'stroke="#6a4524" stroke-width="1.5"') + [22, 32, 42].map(x => L(x - 4, 32, x + 4, 42, '#e0b878', 2.5, 'stroke-linecap="round"')).join(''),
  feather: (u, t) => P('M14 54Q20 20 50 10Q44 36 14 54Z', tn(t, '#cfc8b4'), 'stroke="#8d8676" stroke-width="1"') + L(14, 54, 46, 14, '#8d8676', 1.5),
  shell: () => P('M32 54L12 26Q32 4 52 26Z', '#d6c3a6', 'stroke="#8d7c5a" stroke-width="1.5"') + [18, 25, 32, 39, 46].map(x => L(32, 54, x, 18, '#8d7c5a', 1, 'opacity=".7"')).join(''),
  stamp: (u, t) => R(14, 12, 36, 42, '#e6dfcc', 'stroke="#b9b3a2" stroke-width="2" stroke-dasharray="3 2"') + R(19, 17, 26, 32, tn(t, '#3d5f80')) + C(32, 30, 6, '#e6dfcc', 'opacity=".75"'),
  scroll: () => R(14, 18, 36, 30, '#d9cfb3') + R(10, 14, 6, 38, '#b9a77f', 'rx="3"') + R(48, 14, 6, 38, '#b9a77f', 'rx="3"') + [26, 32, 38].map(y => R(20, y, 24, 2, '#6d604a', 'opacity=".5"')).join(''),
  torch: (u, t) => tilt(-30, R(10, 26, 34, 12, tn(t, '#3a403d'), 'rx="3"') + P('M44 22H54V42H44Z', K(u, 'steel')) + E(54, 32, 3, 10, '#e8d9a8') + R(22, 24, 6, 3, '#8e3b30')),
  rope: () => [16, 11, 6].map((rr, i) => E(32, 34, rr + 6, rr, 'none', `stroke="${i % 2 ? '#8d7350' : '#a8895c'}" stroke-width="4"`)).join('') + L(44, 30, 56, 14, '#a8895c', 4, 'stroke-linecap="round"'),
  gem: (u, t) => poly([[20, 22], [44, 22], [54, 32], [32, 56], [10, 32]], tn(t, '#3d5f80'), 'stroke="#1b1d1c" stroke-width="1.5"') + poly([[20, 22], [26, 32], [10, 32]], '#fff', 'opacity=".2"') + L(10, 32, 54, 32, '#000', 1, 'opacity=".3"'),
  bell: u => P('M32 12Q46 14 46 34L50 44H14L18 34Q18 14 32 12Z', K(u, 'brass'), 'stroke="#5f4c2c" stroke-width="1.5"') + C(32, 48, 4.5, '#5f4c2c') + C(32, 10, 3, '#5f4c2c'),
  compass: u => C(32, 32, 20, K(u, 'brass')) + C(32, 32, 16, '#e6dfcc') + poly([[32, 18], [36, 32], [32, 46], [28, 32]], '#2a2118') + poly([[32, 18], [36, 32], [28, 32]], '#8e3b30'),
  vial: (u, t) => R(26, 10, 12, 8, '#6a4524', 'rx="2"') + P('M27 18H37V26Q48 32 48 42Q48 54 32 54Q16 54 16 42Q16 32 27 26Z', '#c9d6d3', 'opacity=".45" stroke="#8d958f" stroke-width="1.5"') + P('M18 42Q18 52 32 52Q46 52 46 42Z', tn(t, '#46704f'), 'opacity=".85"'),
  ring: (u, t) => E(30, 38, 15, 11, 'none', `stroke="url(#${u}-brass)" stroke-width="5"`) + poly([[30, 16], [37, 22], [30, 28], [23, 22]], tn(t, '#8e3b30'), 'stroke="#3a1a16" stroke-width="1"'),
  watch: u => P('M32 12Q40 2 48 8', 'none', 'stroke="#8c7442" stroke-width="2"') + C(32, 36, 19, K(u, 'brass')) + C(32, 36, 15, '#e6dfcc') + L(32, 36, 32, 26, '#2a2118', 2) + L(32, 36, 39, 39, '#2a2118', 2) + C(32, 15, 3, K(u, 'brass')),
  chalk: () => tilt(-30, R(12, 26, 40, 11, '#e6e2d6', 'rx="3" stroke="#a9a596" stroke-width="1"') + R(12, 26, 8, 11, '#cfc8b4', 'rx="3"')),
  wrench: () => tilt(-40, R(14, 28, 36, 8, '#7d8580', 'rx="3"') + C(14, 32, 9, '#7d8580') + R(4, 29, 9, 6, '#262d2a') + C(50, 32, 7, '#7d8580')),
  plug: () => P('M10 54Q20 40 26 40', 'none', 'stroke="#1b1b1b" stroke-width="3"') + R(26, 30, 18, 20, '#2a2e2b', 'rx="3"') + R(44, 33, 10, 3, '#c9c2ad') + R(44, 43, 10, 3, '#c9c2ad'),
  glasses: () => C(20, 34, 10, '#c9d6d3', 'opacity=".35" stroke="#2a2118" stroke-width="3"') + C(44, 34, 10, '#c9d6d3', 'opacity=".35" stroke="#2a2118" stroke-width="3"') + P('M30 33Q32 29 34 33', 'none', 'stroke="#2a2118" stroke-width="3"'),
  mask: (u, t) => P('M10 24Q32 14 54 24Q54 44 40 44Q34 36 32 36Q30 36 24 44Q10 44 10 24Z', tn(t, '#cfc8b4'), 'stroke="#5d564e" stroke-width="1.5"') + E(23, 29, 5, 3.5, '#1b1b1b') + E(41, 29, 5, 3.5, '#1b1b1b'),
  lens: u => C(32, 32, 20, K(u, 'brass')) + C(32, 32, 15, '#c9d6d3', 'opacity=".55"') + C(26, 26, 5, '#fff', 'opacity=".35"'),
  sheet: () => R(12, 10, 40, 46, '#e6dfcc', 'stroke="#b9b3a2" stroke-width="1.5"') + [20, 28, 36, 44].map(y => L(16, y, 48, y, '#6d604a', 1, 'opacity=".6"')).join('') + [[20, 28], [28, 24], [36, 36], [44, 32]].map(([x, y]) => E(x, y, 3, 2.2, '#2a2118')).join(''),
  brush: () => tilt(-35, R(10, 29, 30, 6, '#6a4524', 'rx="3"') + R(40, 28, 6, 8, '#a7a99f') + P('M46 26Q58 32 46 38Z', '#2a2118')),
  oilcan: u => P('M14 50V34Q14 26 26 26H36V50Z', K(u, 'steel')) + L(36, 32, 54, 16, '#5b6661', 3) + R(22, 20, 8, 6, '#3a403d'),
  keyhead: (u, t) => tilt(-35, C(20, 32, 11, 'none', `stroke="${tn(t, '#c9a45a')}" stroke-width="5"`) + R(30, 29.5, 10, 5, tn(t, '#c9a45a'), 'rx="2"') + P('M40 26L44 32L40 38Z', '#6d604a')),
  keyshaft: (u, t) => tilt(-35, P('M14 26L18 32L14 38Z', '#6d604a') + R(18, 29.5, 30, 5, tn(t, '#c9a45a'), 'rx="2"') + R(40, 34, 4, 9, tn(t, '#c9a45a')) + R(46, 34, 4, 6, tn(t, '#c9a45a'))),
  flame: u => C(32, 18, 14, K(u, 'glow')) + E(32, 52, 16, 5, K(u, 'brass')) + R(26, 24, 12, 28, '#cbbd98', 'rx="2"') + P('M32 8Q38 16 32 22Q27 16 32 8Z', '#e5bd71'),
  torn: (u, t) => tilt(-8, P('M12 12H40L36 20L42 28L36 36L42 44L38 52H12Z', tn(t, '#d9cfb3'), 'stroke="#8d7c5a" stroke-width="1.5"') + [22, 30, 38].map(y => R(16, y, 16, 2, '#6d604a', 'opacity=".5"')).join('')),
  hands: () => tilt(-20, L(32, 32, 32, 12, '#2a2118', 4, 'stroke-linecap="round"') + L(32, 32, 48, 40, '#2a2118', 3, 'stroke-linecap="round"') + C(32, 32, 4, '#8c7442')),
  torchlit: u => tilt(-30, poly([[54, 22], [64, 14], [64, 50], [54, 42]], '#f2d9a2', 'opacity=".45"') + R(10, 26, 34, 12, '#3a403d', 'rx="3"') + P('M44 22H54V42H44Z', K(u, 'steel')) + E(54, 32, 3, 10, '#f2d9a2') + R(22, 24, 6, 3, '#46704f')),
  bone: () => tilt(-30, R(16, 28, 32, 8, '#d6cfbd', 'rx="4"') + C(16, 27, 5, '#d6cfbd') + C(16, 37, 5, '#d6cfbd') + C(48, 27, 5, '#d6cfbd') + C(48, 37, 5, '#d6cfbd')),
};
export const ITEM_BASES = Object.keys(ITEM_ART);
