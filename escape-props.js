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
};
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
