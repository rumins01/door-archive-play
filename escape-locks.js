// 자물쇠 모양 등록부입니다. 작동 방식(type)은 엔진의 7가지를 그대로 쓰고, 모양(form)마다 그림과 버튼 배치를 달리합니다.
// 버튼 자리는 layout이 정하고, 엔진의 lockControls가 같은 자리를 읽어 화면 버튼과 검증에 씁니다.
import { R, C, E, P, L, T, poly, K } from './escape-props.js?v=escape-11';

const SERIF = 'font-family="Georgia, \'Times New Roman\', serif"';
const MONO = 'font-family="ui-monospace, SFMono-Regular, Menlo, monospace"';
const n1 = v => Math.round(v * 10) / 10;
const spread = (n, gap, cx = 180) => Array.from({ length: n }, (_, i) => Math.round(cx + (i - (n - 1) / 2) * gap));
const row = (n, gap, y) => spread(n, gap).map(x => [x, y]);
const dialGap = n => (n <= 3 ? 84 : n === 4 ? 72 : 62);
const span = at => [Math.min(...at.map(p => p[0])), Math.max(...at.map(p => p[0]))];
const drop = (x, y, w, h, rx = 10) => R(x + 4, y + 6, w, h, '#000', `opacity=".42" rx="${rx}"`);
const chev = (x, y, up, color = '#e8e2d0', s = 12) => P(`M${n1(x - s)} ${n1(y + (up ? s * .5 : -s * .5))}L${n1(x)} ${n1(y + (up ? -s * .5 : s * .5))}L${n1(x + s)} ${n1(y + (up ? s * .5 : -s * .5))}`, 'none', `stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".85"`);
const ROT = { up: 0, right: 90, down: 180, left: 270 };
const sin = d => Math.sin((d * Math.PI) / 180), cos = d => Math.cos((d * Math.PI) / 180);
// 별자리 자물쇠의 별 자리입니다. 단서 그림도 같은 자리를 줄여 그립니다.
export const STAR_POINTS = [[100, 200], [200, 180], [290, 230], [120, 300], [230, 290], [160, 380], [290, 360]];

// 순서형 자물쇠에서 지금까지 누른 수를 보여 주는 불빛입니다.
function dots(u, lock, d, on = '#f2cf7c') {
  const [lx, ly] = lock.lights, k = lock.answer.length;
  let s = '';
  for (let i = 0; i < k; i++) {
    const cx = lx + (i - (k - 1) / 2) * 26;
    s += (i < d.length ? C(cx, ly, 14, K(u, 'glow')) : '') + C(cx, ly, 7, i < d.length ? on : '#2a2e2b', 'stroke="#151a18" stroke-width="2"');
  }
  return s;
}
function display(lock, d, { bg = '#0b120e', edge = '#3c4a40', fg = '#9fe0a8', off = '#3a4a3e', font = MONO, size = 24 } = {}) {
  const [lx, ly] = lock.lights, k = lock.answer.length;
  let s = R(lx - 17 * k - 12, ly - 20, 34 * k + 24, 40, bg, `rx="6" stroke="${edge}" stroke-width="2"`);
  for (let i = 0; i < k; i++) s += T(lx + (i - (k - 1) / 2) * 34, ly + 1, d[i] ?? '·', size, d[i] !== undefined ? fg : off, font);
  return s;
}
const keyCenters = h => h.controls.map(c => ({ ...c, cx: c.x + c.w / 2, cy: c.y + c.h / 2 }));
// 색/그림별 개수를 묻는 단서의 칸 표시는 모든 숫자 모양에서 남깁니다.
function numericTags(u, lock, h) {
  return (lock.tags ?? []).map((tag, i) => {
    const [x, y] = lock.at[i], ty = y - 98;
    const face = ['red', 'blue', 'green', 'yellow'].includes(tag) ? h.swatch(u, tag, f => C(x, ty, 12, f, 'stroke="#1c201b" stroke-width="1.5"')) : h.glyph(tag, x, ty, 11, '#e0d5b9');
    return R(x - 18, ty - 17, 36, 34, '#242821', 'rx="5" stroke="#77806c" stroke-width="1"') + face;
  }).join('');
}
function gearPath(x, y, r1, r2, teeth) {
  let d = '';
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i * Math.PI) / teeth, a1 = ((i + 1) * Math.PI) / teeth, rr = i % 2 ? r1 : r2;
    d += `${i ? 'L' : 'M'}${n1(x + Math.cos(a0) * rr)} ${n1(y + Math.sin(a0) * rr)}L${n1(x + Math.cos(a1) * rr)} ${n1(y + Math.sin(a1) * rr)}`;
  }
  return d + 'Z';
}

export const LOCK_FORMS = {
  // ── 숫자 다이얼(dial): 위아래를 눌러 칸마다 숫자를 바꿉니다.
  padlock: {
    type: 'dial', name: '맹꽁이자물쇠', layout: n => ({ at: row(n, dialGap(n), 300) }),
    draw(u, lock, d, h) {
      const [a, b] = span(lock.at), y = lock.at[0][1];
      let s = P(`M124 ${y - 74}V${y - 118}a56 56 0 0 1 112 0V${y - 74}`, 'none', 'stroke="#8d938c" stroke-width="16"') + drop(a - 46, y - 76, b - a + 92, 162, 18) + R(a - 46, y - 76, b - a + 92, 162, K(u, 'brass'), 'rx="18" stroke="#5f4c2c" stroke-width="2"');
      lock.at.forEach(([x], i) => { s += chev(x, y - 44, true, '#3b2f1a') + chev(x, y + 44, false, '#3b2f1a') + R(x - 23, y - 24, 46, 48, '#efe5cc', 'stroke="#2a1c10" stroke-width="3" rx="4"') + T(x, y + 1, d[i], 28, '#2a1c10', SERIF); });
      return s + numericTags(u, lock, h);
    },
  },
  drum: {
    type: 'dial', name: '원통 자물쇠', layout: n => ({ at: row(n, dialGap(n), 296) }),
    draw(u, lock, d, h) {
      const [a, b] = span(lock.at), y = lock.at[0][1];
      const edge = Math.min(50, a - 12);
      let s = drop(a - edge, y - 16, b - a + edge * 2, 32, 16) + R(a - edge, y - 16, b - a + edge * 2, 32, K(u, 'steel'), 'rx="16"');
      lock.at.forEach(([x], i) => {
        s += R(x - 27, y - 36, 54, 72, '#1f2321', 'rx="8"') + R(x - 23, y - 32, 46, 64, '#d9d4c4', 'rx="5"');
        for (let k = 0; k < 5; k++) s += L(x - 23, y - 26 + k * 13, x + 23, y - 26 + k * 13, '#000', 1, 'opacity=".08"');
        s += T(x, y + 1, d[i], 28, '#1b1b1b', MONO) + chev(x, y - 48, true, '#c9c2ad') + chev(x, y + 48, false, '#c9c2ad');
      });
      return s + numericTags(u, lock, h);
    },
  },
  abacus: {
    type: 'dial', name: '주판 자물쇠', layout: n => ({ at: row(n, dialGap(n), 292) }),
    draw(u, lock, d, h) {
      const [a, b] = span(lock.at), y = lock.at[0][1];
      let s = drop(a - 46, y - 68, b - a + 92, 136, 8) + R(a - 46, y - 68, b - a + 92, 136, '#1c140d', 'rx="8" stroke="#6a4524" stroke-width="12"');
      lock.at.forEach(([x], i) => {
        s += L(x, y - 52, x, y + 52, '#8c7442', 2) + chev(x, y - 52, true, '#e0c890', 8) + chev(x, y + 52, false, '#e0c890', 8);
        for (let k = 0; k < 9; k++) s += E(x, k < d[i] ? y - 42 + k * 8 : y + 42 - (8 - k) * 8, 15, 3.5, k < d[i] ? '#a8543a' : '#5a4430', 'stroke="#140d08" stroke-width="1"');
        s += R(x - 14, y - 13, 28, 26, '#20180f', 'rx="3"') + T(x, y, d[i], 18, '#e2d1aa', MONO);
      });
      return s + numericTags(u, lock, h);
    },
  },
  slider: {
    type: 'dial', name: '미닫이 눈금', layout: n => ({ at: row(n, dialGap(n), 292) }),
    draw(u, lock, d, h) {
      const [a, b] = span(lock.at), y = lock.at[0][1];
      let s = drop(a - 46, y - 84, b - a + 92, 168, 10) + R(a - 46, y - 84, b - a + 92, 168, K(u, 'steel'), 'rx="10" stroke="#1b201e" stroke-width="2"');
      lock.at.forEach(([x], i) => {
        s += R(x - 5, y - 50, 10, 100, '#0b0c0b', 'rx="5"');
        for (let k = 0; k <= 9; k++) { const yy = y + 45 - k * 10; s += L(x - 17, yy, x - 9, yy, '#c9c2ad', 1.5) + (k % 3 === 0 ? T(x - 25, yy, k, 11, '#ded6c0', MONO) : ''); }
        const ky = y + 40 - d[i] * 80 / 9;
        s += R(x - 15, ky - 7, 30, 14, K(u, 'brass'), 'rx="4" stroke="#3b2f1a" stroke-width="1.5"') + T(x + 21, y, d[i], 16, '#e8e2d0', MONO) + chev(x, y - 52, true) + chev(x, y + 52, false);
      });
      return s + numericTags(u, lock, h);
    },
  },
  odometer: {
    type: 'dial', name: '계수기', layout: n => ({ at: row(n, Math.max(64, dialGap(n) - 12), 296) }),
    draw(u, lock, d, h) {
      const [a, b] = span(lock.at), y = lock.at[0][1];
      let s = drop(a - 50, y - 64, b - a + 100, 128, 10) + R(a - 50, y - 64, b - a + 100, 128, K(u, 'brass'), 'rx="10" stroke="#5f4c2c" stroke-width="2"') + R(a - 36, y - 30, b - a + 72, 60, '#0e0e0d', 'rx="4"');
      lock.at.forEach(([x], i) => { s += R(x - 25, y - 28, 50, 56, '#1d1d1b') + L(x - 25, y - 1, x + 25, y - 1, '#000', 1, 'opacity=".5"') + T(x, y + 1, d[i], 30, '#efe9d8', MONO) + chev(x, y - 46, true, '#3b2f1a') + chev(x, y + 46, false, '#3b2f1a'); });
      return s + numericTags(u, lock, h);
    },
  },
  rounddial: {
    type: 'dial', name: '둥근 손잡이', layout: n => ({ at: row(n, n <= 3 ? 96 : n === 4 ? 76 : 64, 296) }),
    draw(u, lock, d, h) {
      let s = '';
      lock.at.forEach(([x, y], i) => {
        s += C(x + 3, y + 5, 29, '#000', 'opacity=".4"') + C(x, y, 29, K(u, 'steel')) + C(x, y, 27, 'none', 'stroke="#1b201e" stroke-width="1.5"');
        for (let k = 0; k < 10; k++) s += L(x + sin(k * 36) * 23, y - cos(k * 36) * 23, x + sin(k * 36) * 27, y - cos(k * 36) * 27, '#c9c2ad', k ? 1.5 : 3);
        const a = d[i] * 36;
        s += C(x, y, 18, '#24282a', 'stroke="#59625d" stroke-width="2"') + L(x + sin(a) * 11, y - cos(a) * 11, x + sin(a) * 23, y - cos(a) * 23, '#d8b56a', 4, 'stroke-linecap="round"') + T(x, y + 1, d[i], 16, '#e8e4d8', MONO);
        s += chev(x, y - 48, true) + chev(x, y + 48, false);
      });
      return s + numericTags(u, lock, h);
    },
  },

  // ── 숫자판(keypad): 숫자를 차례로 눌러 끝까지 맞으면 열립니다.
  keypad: {
    type: 'keypad', name: '숫자 버튼판', layout: () => ({ at: [[180, 276]], lights: [180, 112] }),
    draw(u, lock, d, h) {
      let s = drop(78, 138, 204, 276, 14) + R(78, 138, 204, 276, '#202524', 'rx="14" stroke="#3c4442" stroke-width="2"');
      for (const c of keyCenters(h)) s += R(c.cx - 26, c.cy - 24, 52, 52, '#000', 'opacity=".45" rx="8"') + R(c.cx - 26, c.cy - 26, 52, 52, '#2b302e', 'rx="8" stroke="#59625d" stroke-width="2"') + T(c.cx, c.cy + 1, c.key === '<' ? '←' : c.key, 22, c.key === 'C' || c.key === '<' ? '#d7b77b' : '#e8e4d8', MONO);
      return s + display(lock, d);
    },
  },
  rotary: {
    type: 'keypad', name: '다이얼 전화', layout: () => ({ at: [[180, 272]], lights: [180, 112], layout: 'ring' }),
    draw(u, lock, d, h) {
      let s = drop(28, 120, 304, 304, 152) + C(180, 272, 152, '#16181a') + C(180, 272, 146, '#24272a', 'stroke="#3a3f42" stroke-width="2"')
        + P('M90 86Q180 54 270 86', 'none', 'stroke="#17191b" stroke-width="15" stroke-linecap="round"') + R(77, 72, 36, 27, '#25292b', 'rx="10" stroke="#454a4c" stroke-width="2"') + R(247, 72, 36, 27, '#25292b', 'rx="10" stroke="#454a4c" stroke-width="2"');
      for (const c of keyCenters(h)) {
        if (c.key === 'C' || c.key === '<') continue;
        s += C(c.cx, c.cy, 25, '#0d0e0f') + C(c.cx, c.cy, 21, '#e6dfcc') + T(c.cx, c.cy + 1, c.key, 20, '#1b1b1b', SERIF);
      }
      s += C(180, 272, 58, '#d9cfb3', 'stroke="#8d7c5a" stroke-width="2"');
      for (const c of keyCenters(h).filter(c => c.key === 'C' || c.key === '<')) s += R(c.cx - 24, c.cy - 24, 48, 48, '#d9cfb3', 'rx="7" stroke="#8d7c5a" stroke-width="1.5"') + T(c.cx, c.cy, c.key === '<' ? '←' : c.key, 18, '#7a3a2e', MONO);
      s += P('M298 340q24 6 30 30', 'none', 'stroke="#a7a99f" stroke-width="6" stroke-linecap="round"');
      return s + display(lock, d, { bg: '#1a1612', edge: '#4a3a28', fg: '#e8d9a8', off: '#4a4034', font: SERIF });
    },
  },
  elevator: {
    type: 'keypad', name: '승강기 버튼', layout: () => ({ at: [[180, 276]], lights: [180, 112] }),
    draw(u, lock, d, h) {
      let s = drop(72, 136, 216, 280, 16) + R(72, 136, 216, 280, K(u, 'brass'), 'rx="16" stroke="#5f4c2c" stroke-width="2"') + R(84, 148, 192, 256, 'none', 'rx="10" stroke="#3b2f1a" stroke-width="1.5" opacity=".6"');
      for (const c of keyCenters(h)) s += C(c.cx, c.cy + 2, 25, '#000', 'opacity=".35"') + C(c.cx, c.cy, 25, '#3b2f1a') + C(c.cx, c.cy, 20, '#e2d3a6') + T(c.cx, c.cy + 1, c.key === '<' ? '←' : c.key, 18, '#2a2118', SERIF);
      return s + P('M120 112a60 60 0 0 1 120 0', 'none', 'stroke="#5f4c2c" stroke-width="3" opacity=".6"') + display(lock, d, { bg: '#1a120b', edge: '#5f4c2c', fg: '#e0a24a', off: '#4a3420' });
    },
  },
  register: {
    type: 'keypad', name: '금전 등록기', layout: () => ({ at: [[180, 276]], lights: [180, 112] }),
    draw(u, lock, d, h) {
      let s = drop(66, 140, 228, 276, 12) + R(66, 140, 228, 276, '#3a3f3b', 'rx="12" stroke="#1b1e1c" stroke-width="2"') + R(66, 140, 228, 16, '#4a504c', 'rx="8"');
      for (const c of keyCenters(h)) s += R(c.cx - 24, c.cy - 20, 48, 46, '#000', 'opacity=".4" rx="6"') + R(c.cx - 24, c.cy - 24, 48, 46, '#e6dfcc', 'rx="6" stroke="#1b1b1b" stroke-width="3"') + T(c.cx, c.cy, c.key === '<' ? '←' : c.key, 20, c.key === 'C' || c.key === '<' ? '#8e3b30' : '#1b1b1b', MONO);
      return s + R(62, 400, 236, 24, '#4a504a', 'rx="4" stroke="#171b17" stroke-width="2"') + R(138, 404, 84, 8, '#b6ac89', 'rx="3"') + R(174, 412, 12, 8, '#282c28', 'rx="2"') + R(172, 126, 16, 14, '#41473f') + display(lock, d, { bg: '#efe9d8', edge: '#8d7c5a', fg: '#1b1b1b', off: '#c9c2ad' });
    },
  },
  typekeys: {
    type: 'keypad', name: '타자 자판', layout: () => ({ at: [[180, 276]], lights: [180, 112] }),
    draw(u, lock, d, h) {
      let s = drop(62, 142, 236, 272, 20) + R(62, 142, 236, 272, '#151617', 'rx="20" stroke="#2a2c2e" stroke-width="2"') + R(108, 76, 144, 64, '#e6dfcc', 'stroke="#a0947c" stroke-width="1.5"') + R(70, 140, 220, 13, '#39403b', 'rx="6"') + R(56, 138, 18, 17, '#565d57', 'rx="4"') + R(286, 138, 18, 17, '#565d57', 'rx="4"') + L(58, 134, 58, 122, '#a3aa9f', 3);
      for (const c of keyCenters(h)) s += C(c.cx, c.cy, 25, '#0b0b0b') + C(c.cx, c.cy, 21, '#1d1e20', 'stroke="#c9c2ad" stroke-width="3"') + T(c.cx, c.cy + 1, c.key === '<' ? '←' : c.key, 18, '#e6dfcc', SERIF);
      return s + display(lock, d, { bg: '#efe9d8', edge: '#b9b3a2', fg: '#1b1b1b', off: '#d0c8b4', font: SERIF });
    },
  },

  // ── 기호 순서(symbol): 기호를 정해진 순서로 누릅니다.
  seal: {
    type: 'symbol', name: '놋쇠 인장', layout: (n, k) => (k <= 4 ? { at: row(k, 76, 310), lights: [180, 200] } : { at: [...row(Math.ceil(k / 2), 80, 250), ...row(k - Math.ceil(k / 2), 80, 334)], lights: [180, 168] }),
    draw(u, lock, d, h) {
      let s = '';
      for (const c of keyCenters(h)) s += C(c.cx, c.cy + 3, 28, '#000', 'opacity=".4"') + C(c.cx, c.cy, 28, K(u, 'brass')) + C(c.cx, c.cy, 22, '#1d1a15') + h.glyph(c.sym, c.cx, c.cy, 11, '#ecd9a8');
      return s + dots(u, lock, d);
    },
  },
  piano: {
    type: 'symbol', name: '건반', layout: (n, k) => ({ at: row(k, 60, 320), lights: [180, 186] }),
    draw(u, lock, d, h) {
      const cs = keyCenters(h), a = cs[0].cx - 30, b = cs[cs.length - 1].cx + 30;
      let s = drop(a - 18, 226, b - a + 36, 184, 10) + R(a - 18, 226, b - a + 36, 184, K(u, 'wood'), 'rx="10" stroke="#22170d" stroke-width="2"') + R(a - 6, 238, b - a + 12, 10, '#7a2a1e');
      for (const c of cs) s += R(c.cx - 28, c.cy - 28, 56, 56, '#e6dfcc', 'rx="4" stroke="#2a2118" stroke-width="2"') + L(c.cx - 27, c.cy + 22, c.cx + 27, c.cy + 22, '#b8ad94', 1) + h.glyph(c.sym, c.cx, c.cy + 7, 10, '#2a2118');
      cs.slice(0, -1).forEach(c => { s += R(c.cx + 21, c.cy - 28, 18, 19, '#141414', 'rx="3"'); });
      s += R(a - 6, 350, b - a + 12, 44, '#291b10', 'rx="3"') + L(a, 358, b, 358, '#795639', 1.5);
      return s + dots(u, lock, d);
    },
  },
  stamps: {
    type: 'symbol', name: '나무 도장', layout: (n, k) => (k <= 4 ? { at: row(k, 76, 312), lights: [180, 200] } : { at: [...row(Math.ceil(k / 2), 80, 252), ...row(k - Math.ceil(k / 2), 80, 336)], lights: [180, 168] }),
    draw(u, lock, d, h) {
      let s = '';
      for (const c of keyCenters(h)) s += R(c.cx - 24, c.cy - 22, 52, 52, '#000', 'opacity=".4" rx="6"') + R(c.cx - 26, c.cy - 26, 52, 52, K(u, 'woodl'), 'rx="6" stroke="#22170d" stroke-width="2"') + R(c.cx - 19, c.cy - 19, 38, 38, '#7a3328', 'rx="3"') + h.glyph(c.sym, c.cx, c.cy, 10, '#ecd9c0');
      return s + dots(u, lock, d, '#d98a6a');
    },
  },
  bells: {
    type: 'symbol', name: '종 줄', layout: (n, k) => ({ at: row(k, 64, 300), lights: [180, 398] }),
    draw(u, lock, d, h) {
      const cs = keyCenters(h);
      let s = R(cs[0].cx - 40, 146, cs[cs.length - 1].cx - cs[0].cx + 80, 10, K(u, 'wood'));
      cs.forEach((c, i) => {
        const w = 20 + (i % 3) * 2;
        s += L(c.cx, 156, c.cx, c.cy - 26, '#8c7442', 2) + P(`M${c.cx} ${c.cy - 28}Q${c.cx + w} ${c.cy - 24} ${c.cx + w} ${c.cy + 10}L${c.cx + w + 5} ${c.cy + 22}H${c.cx - w - 5}L${c.cx - w} ${c.cy + 10}Q${c.cx - w} ${c.cy - 24} ${c.cx} ${c.cy - 28}Z`, K(u, 'brass'), 'stroke="#5f4c2c" stroke-width="1.5"') + C(c.cx, c.cy + 26, 5, '#5f4c2c') + h.glyph(c.sym, c.cx, c.cy - 2, 8, '#3b2f1a');
      });
      return s + dots(u, lock, d);
    },
  },
  stars: {
    type: 'symbol', name: '별자리판', layout: (n, k) => ({ at: STAR_POINTS.slice(0, k), lights: [180, 136] }),
    draw(u, lock, d, h) {
      let s = R(52, 154, 276, 252, '#0b1019', 'rx="22" stroke="#2f3846" stroke-width="3"');
      for (let i = 0; i < 26; i++) s += C(64 + ((i * 97) % 232), 170 + ((i * 59) % 230), 1.2, '#cfd6dc', 'opacity=".35"');
      const pos = Object.fromEntries(keyCenters(h).map(c => [c.sym, [c.cx, c.cy]]));
      for (let i = 1; i < d.length; i++) s += L(...pos[d[i - 1]], ...pos[d[i]], '#d8c78f', 2.5, 'opacity=".8"');
      for (const c of keyCenters(h)) s += (d.includes(c.sym) ? C(c.cx, c.cy, 20, K(u, 'glow')) : '') + C(c.cx, c.cy, 22, '#e8e4d0', 'opacity=".06"') + h.glyph(c.sym, c.cx, c.cy, 11, '#e8e4d0');
      return s + dots(u, lock, d);
    },
  },
  morse: {
    type: 'symbol', name: '전신기', layout: () => ({ at: [[110, 312], [250, 312]], lights: [180, 196] }),
    draw(u, lock, d) {
      let s = drop(40, 252, 280, 120, 12) + R(40, 252, 280, 120, K(u, 'wood'), 'rx="12" stroke="#22170d" stroke-width="2"');
      for (const [x, dash] of [[110, false], [250, true]]) {
        s += R(x - 28, 289, 56, 50, '#252821', 'rx="5" stroke="#8c7442" stroke-width="1.5"') + R(x - 19, 321, 38, 9, K(u, 'brass'), 'rx="3"') + C(x - 15, 299, 6, K(u, 'brass')) + L(x - 15, 299, x + 12, 314, '#9b8554', 6, 'stroke-linecap="round"')
          + (dash ? R(x - 17, 306, 34, 12, '#151711', 'rx="6"') : C(x, 312, 12, '#151711')) + L(x - 18, 331, x + 18, 331, '#a89465', 2);
      }
      const k = lock.answer.length, [lx, ly] = lock.lights;
      s += R(lx - 22 * k - 10, ly - 20, 44 * k + 20, 40, '#e6dfcc', 'stroke="#8d7c5a" stroke-width="1.5"');
      for (let i = 0; i < k; i++) {
        const cx = lx + (i - (k - 1) / 2) * 44;
        s += d[i] === 'dot' ? C(cx, ly, 6, '#2a2118') : d[i] === 'dash' ? R(cx - 14, ly - 4, 28, 8, '#2a2118', 'rx="4"') : C(cx, ly, 2, '#b9b3a2');
      }
      return s;
    },
  },
  coins: {
    type: 'symbol', name: '동전 투입구', layout: (n, k) => (k <= 4 ? { at: row(k, 76, 316), lights: [180, 206] } : { at: [...row(Math.ceil(k / 2), 80, 256), ...row(k - Math.ceil(k / 2), 80, 340)], lights: [180, 172] }),
    draw(u, lock, d, h) {
      let s = '';
      for (const c of keyCenters(h)) s += R(c.cx - 14, c.cy - 40, 28, 6, '#0b0c0b', 'rx="3"') + C(c.cx, c.cy + 3, 27, '#000', 'opacity=".4"') + C(c.cx, c.cy, 27, K(u, 'brass')) + C(c.cx, c.cy, 21, 'none', 'stroke="#5f4c2c" stroke-width="1.5"') + h.glyph(c.sym, c.cx, c.cy, 10, '#4a3a1e');
      return s + dots(u, lock, d);
    },
  },

  // ── 켜고 끄기(switch): 칸마다 켬과 끔을 맞춥니다.
  toggle: {
    type: 'switch', name: '똑딱 스위치', layout: n => ({ at: row(n, n <= 4 ? 70 : 62, 300) }),
    draw(u, lock, d, h) {
      let s = '';
      lock.at.forEach(([x, y], i) => {
        const on = d[i] === 1;
        s += R(x - 24, y - 28, 48, 56, '#1c1f1e', 'rx="8" stroke="#4a524e" stroke-width="2"') + R(x - 8, y - 18, 16, 36, '#0b0c0c', 'rx="6"') + R(x - 11, on ? y - 21 : y - 1, 22, 22, K(u, 'brass'), 'rx="5" stroke="#3b2f1a" stroke-width="1.5"')
          + (on ? C(x, y - 50, 18, K(u, 'glow')) : '') + C(x, y - 50, 13, '#0f1110', 'stroke="#3a403d" stroke-width="1.5"') + h.glyph(on ? 'sun' : 'moon', x, y - 50, 7, on ? '#f2cf7c' : '#8d979c');
      });
      return s;
    },
  },
  levers: {
    type: 'switch', name: '레버 줄', layout: n => ({ at: row(n, 64, 300) }),
    draw(u, lock, d) {
      const [a, b] = span(lock.at);
      let s = drop(a - 42, 214, b - a + 84, 176, 8) + R(a - 42, 214, b - a + 84, 176, '#2a2e2b', 'rx="8" stroke="#1b1e1c" stroke-width="2"');
      lock.at.forEach(([x], i) => {
        const on = d[i] === 1, ty = on ? 283 : 317;
        s += R(x - 6, 232, 12, 136, '#0b0c0b', 'rx="6"') + L(x, 300, x, ty, '#6a6f6c', 8, 'stroke-linecap="round"') + C(x, ty, 14, on ? '#8e3b30' : '#3a3f3c', 'stroke="#151817" stroke-width="2"') + C(x, 300, 6, K(u, 'brass'));
      });
      return s;
    },
  },
  lampgrid: {
    type: 'switch', name: '등불 격자', layout: () => ({ at: [194, 258, 322].flatMap(y => [116, 180, 244].map(x => [x, y])) }),
    draw(u, lock, d) {
      let s = drop(76, 154, 208, 208, 14) + R(76, 154, 208, 208, '#1b1d1c', 'rx="14" stroke="#3a3f3c" stroke-width="2"');
      lock.at.forEach(([x, y], i) => { s += C(x, y, 26, '#0f1110', 'stroke="#59625d" stroke-width="1"') + (d[i] ? C(x, y, 30, K(u, 'glow')) + C(x, y, 18, '#f2cf7c') : C(x, y, 18, '#414944')); });
      return s;
    },
  },
  candles: {
    type: 'switch', name: '촛대 줄', layout: n => ({ at: row(n, 64, 310) }),
    draw(u, lock, d) {
      const [a, b] = span(lock.at);
      let s = R(a - 44, 352, b - a + 88, 12, K(u, 'wood'));
      lock.at.forEach(([x, y], i) => {
        s += E(x, 350, 22, 6, K(u, 'brass')) + R(x - 9, y - 24, 18, 48, '#cbbd98', 'rx="3"') + R(x - 4, y + 24, 8, 17, K(u, 'brass')) + L(x, y - 24, x, y - 30, '#2a2118', 2);
        if (d[i]) s += C(x, y - 42, 26, K(u, 'glow')) + P(`M${x} ${y - 56}Q${x + 8} ${y - 40} ${x} ${y - 30}Q${x - 7} ${y - 40} ${x} ${y - 56}Z`, '#e5bd71');
      });
      return s;
    },
  },
  breakers: {
    type: 'switch', name: '차단기', layout: n => ({ at: row(n, 62, 296) }),
    draw(u, lock, d) {
      const [a, b] = span(lock.at);
      let s = drop(a - 44, 196, b - a + 88, 200, 6) + R(a - 44, 196, b - a + 88, 200, K(u, 'steel'), 'rx="6" stroke="#1b201e" stroke-width="2"');
      lock.at.forEach(([x, y], i) => {
        const on = d[i] === 1;
        s += R(x - 22, y - 28, 44, 56, '#1d201e', 'rx="4" stroke="#535952" stroke-width="1.5"') + R(x - 14, on ? y - 23 : y + 1, 28, 22, on ? '#4f6e52' : '#7a2a1e', 'rx="3" stroke="#0b0c0b" stroke-width="1.5"') + T(x, on ? y - 12 : y + 12, on ? 'I' : 'O', 12, '#e6dfcc', MONO) + C(x, y - 48, 4, on ? '#9fe0a8' : '#3a403d');
      });
      return s;
    },
  },

  // ── 돌리기(rotate): 누를 때마다 시계 방향으로 한 칸씩 돌아갑니다.
  arrowtiles: {
    type: 'rotate', name: '화살표 타일', layout: n => ({ at: row(n, n <= 4 ? 72 : 62, 300) }),
    draw(u, lock, d, h) {
      let s = '';
      lock.at.forEach(([x, y], i) => { s += R(x - 26, y - 24, 52, 52, '#000', 'opacity=".4" rx="8"') + R(x - 26, y - 26, 52, 52, K(u, 'brass'), 'rx="8" stroke="#3b2f1a" stroke-width="2"') + h.arrow(d[i], x, y, 15, '#2a2118'); });
      return s;
    },
  },
  valves: {
    type: 'rotate', name: '밸브 손잡이', layout: n => ({ at: row(n, n <= 3 ? 84 : 66, 300) }),
    draw(u, lock, d) {
      const [a, b] = span(lock.at), y = lock.at[0][1];
      const edge = Math.min(48, a - 12);
      let s = R(a - edge, y - 9, b - a + edge * 2, 18, '#59624e') + L(a - edge, y - 6, b + edge, y - 6, '#929178', 2, 'opacity=".4"');
      lock.at.forEach(([x], i) => {
        const a0 = ROT[d[i]] ?? 0;
        s += C(x, y, 27, 'none', 'stroke="#7a3a2e" stroke-width="6"');
        for (let k = 0; k < 4; k++) { const t = a0 + k * 90 + 45; s += L(x, y, x + sin(t) * 26, y - cos(t) * 26, '#7a3a2e', 4); }
        s += C(x + sin(a0) * 24, y - cos(a0) * 24, 5, '#e2c588', 'stroke="#3b2f1a" stroke-width="1.5"') + C(x, y, 7, K(u, 'brass'));
      });
      return s;
    },
  },
  needles: {
    type: 'rotate', name: '나침반 바늘', layout: n => ({ at: row(n, n <= 3 ? 84 : 66, 300) }),
    draw(u, lock, d) {
      let s = '';
      lock.at.forEach(([x, y], i) => {
        const a = ROT[d[i]] ?? 0;
        s += C(x + 3, y + 5, 29, '#000', 'opacity=".4"') + C(x, y, 29, K(u, 'brass')) + C(x, y, 24, '#e6dfcc') + [0, 90, 180, 270].map(t => L(x + sin(t) * 18, y - cos(t) * 18, x + sin(t) * 23, y - cos(t) * 23, '#5f4c2c', 2)).join('');
        s += poly([[x + sin(a) * 20, y - cos(a) * 20], [x + sin(a + 90) * 5, y - cos(a + 90) * 5], [x - sin(a + 90) * 5, y + cos(a + 90) * 5]], '#8e3b30') + poly([[x - sin(a) * 18, y + cos(a) * 18], [x + sin(a + 90) * 5, y - cos(a + 90) * 5], [x - sin(a + 90) * 5, y + cos(a + 90) * 5]], '#3a3f3c') + C(x, y, 3, K(u, 'brass'));
      });
      return s;
    },
  },
  gears: {
    type: 'rotate', name: '톱니바퀴', layout: n => ({ at: row(n, n <= 3 ? 84 : 66, 300) }),
    draw(u, lock, d, h) {
      let s = '';
      lock.at.forEach(([x, y], i) => { s += P(gearPath(x + 3, y + 5, 22, 29, 10), '#000', 'opacity=".4"') + P(gearPath(x, y, 22, 29, 10), K(u, 'steel'), 'stroke="#747c72" stroke-width="1.5"') + C(x, y, 15, '#1b1d1c') + h.arrow(d[i], x, y, 10, '#d8b56a'); });
      return s;
    },
  },

  // ── 방향 순서(direction): 네 방향 단추를 차례로 누릅니다.
  arrowpad: {
    type: 'direction', name: '방향 단추', layout: () => ({ at: [[180, 290]], lights: [180, 150] }),
    draw(u, lock, d, h) {
      let s = '';
      for (const c of keyCenters(h)) s += R(c.cx - 25, c.cy - 23, 50, 50, '#000', 'opacity=".35" rx="10"') + R(c.cx - 25, c.cy - 25, 50, 50, K(u, 'brass'), 'rx="10" stroke="#3b2f1a" stroke-width="2"') + h.arrow(c.dir, c.cx, c.cy, 13, '#2a2118');
      return s + dots(u, lock, d);
    },
  },
  maze: {
    type: 'direction', name: '구슬 미로', layout: () => ({ at: [[180, 290]], lights: [180, 150] }),
    draw(u, lock, d, h) {
      let s = drop(76, 186, 208, 208, 16) + R(76, 186, 208, 208, K(u, 'woodl'), 'rx="16" stroke="#22170d" stroke-width="2"');
      for (const [x1, y1, x2, y2] of [[100, 214, 160, 214], [200, 214, 260, 214], [100, 214, 100, 260], [260, 214, 260, 270], [148, 250, 148, 330], [212, 250, 212, 330], [100, 366, 160, 366], [200, 366, 260, 366], [100, 320, 100, 366], [260, 310, 260, 366]]) s += L(x1, y1, x2, y2, '#3a2b1d', 6, 'stroke-linecap="round"');
      s += C(180, 290, 10, '#a7a99f', 'stroke="#3a3f3c" stroke-width="1.5"');
      for (const c of keyCenters(h)) s += C(c.cx, c.cy, 17, '#3a2b1d', 'opacity=".55"') + h.arrow(c.dir, c.cx, c.cy, 9, '#e6dfcc');
      return s + dots(u, lock, d);
    },
  },
  compassrose: {
    type: 'direction', name: '나침반 장미', layout: () => ({ at: [[180, 290]], lights: [180, 150] }),
    draw(u, lock, d, h) {
      let s = C(180, 290, 104, '#1d1a15', 'stroke="#8c7442" stroke-width="3"');
      const pts = []; for (let i = 0; i < 16; i++) { const a = i * 22.5, rr = i % 4 === 0 ? 92 : i % 2 ? 26 : 52; pts.push([180 + sin(a) * rr, 290 - cos(a) * rr]); }
      s += poly(pts, '#8c7442', 'opacity=".55"');
      const LET = { up: 'N', right: 'E', down: 'S', left: 'W' };
      for (const c of keyCenters(h)) s += C(c.cx, c.cy, 24, '#2a2118', 'stroke="#c9a45a" stroke-width="2"') + T(c.cx, c.cy + 1, LET[c.dir], 20, '#e6dfcc', SERIF);
      return s + dots(u, lock, d);
    },
  },
  joystick: {
    type: 'direction', name: '조종간', layout: () => ({ at: [[180, 290]], lights: [180, 150] }),
    draw(u, lock, d, h) {
      let s = drop(88, 198, 184, 184, 22) + R(88, 198, 184, 184, '#1d201e', 'rx="22" stroke="#3a403d" stroke-width="2"') + R(172, 214, 16, 152, '#0b0c0b', 'rx="8"') + R(104, 282, 152, 16, '#0b0c0b', 'rx="8"');
      const last = d[d.length - 1], [dx, dy] = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }[last] ?? [0, 0];
      s += L(180, 290, 180 + dx * 22, 290 + dy * 22, '#7c857b', 8, 'stroke-linecap="round"') + C(180 + dx * 22, 290 + dy * 22, 15, '#8e3b30', 'stroke="#3a120c" stroke-width="2"');
      for (const c of keyCenters(h)) s += C(c.cx, c.cy, 22, '#222724', 'stroke="#535b55" stroke-width="1.5"') + h.arrow(c.dir, c.cx, c.cy, 10, '#c9c2ad');
      return s + dots(u, lock, d);
    },
  },

  // ── 색 돌리기(color): 누를 때마다 다음 색이나 기호로 바뀝니다.
  buttons: {
    type: 'color', name: '색 단추', layout: n => ({ at: row(n, n <= 4 ? 72 : 62, 290) }),
    draw(u, lock, d, h) {
      let s = '';
      lock.at.forEach(([x, y], i) => { s += C(x, y + 3, 26, '#000', 'opacity=".4"') + C(x, y, 26, K(u, 'brass')) + h.swatch(u, d[i], f => C(x, y, 20, f)) + C(x - 7, y - 7, 5, '#fff', 'opacity=".25"'); });
      return s;
    },
  },
  wires: {
    type: 'color', name: '전선 꽂기', layout: n => ({ at: row(n, 64, 312) }),
    draw(u, lock, d, h) {
      const [a, b] = span(lock.at);
      let s = R(a - 44, 140, b - a + 88, 26, '#2a2e2b', 'rx="6"') + drop(a - 44, 330, b - a + 88, 56, 6) + R(a - 44, 330, b - a + 88, 56, '#1b1d1c', 'rx="6"');
      lock.at.forEach(([x, y], i) => { s += h.swatch(u, d[i], f => P(`M${x} 166C${x - 20} 220 ${x + 20} 250 ${x} ${y - 18}`, 'none', `stroke="${f}" stroke-width="8" stroke-linecap="round"`)) + R(x - 23, y - 27, 46, 54, '#0b0c0b', 'rx="6" stroke="#59625d" stroke-width="1.5"') + h.swatch(u, d[i], f => R(x - 13, y - 19, 26, 38, f, 'rx="4" stroke="#171b18" stroke-width="2"')) + L(x - 8, y + 12, x + 8, y + 12, '#c9c2ad', 2); });
      return s;
    },
  },
  gems: {
    type: 'color', name: '보석 홈', layout: n => ({ at: row(n, 66, 296) }),
    draw(u, lock, d, h) {
      let s = '';
      lock.at.forEach(([x, y], i) => { s += C(x, y + 4, 28, '#000', 'opacity=".4"') + C(x, y, 28, '#2a2118', 'stroke="#8c7442" stroke-width="3"') + h.swatch(u, d[i], f => poly([[x - 16, y - 6], [x - 8, y - 16], [x + 8, y - 16], [x + 16, y - 6], [x, y + 18]], f, 'stroke="#140d08" stroke-width="1.5"')) + poly([[x - 8, y - 16], [x - 3, y - 6], [x - 16, y - 6]], '#fff', 'opacity=".25"'); });
      return s;
    },
  },
  reels: {
    type: 'color', name: '그림 릴', layout: n => ({ at: row(n, 64, 292) }),
    draw(u, lock, d, h) {
      const [a, b] = span(lock.at), y = lock.at[0][1];
      let s = drop(a - 48, 196, b - a + 96, 190, 16) + R(a - 48, 196, b - a + 96, 190, '#4a2622', 'rx="16" stroke="#2a1412" stroke-width="2"') + R(a - 36, y - 38, b - a + 72, 76, '#e6dfcc', 'rx="6"');
      lock.at.forEach(([x], i) => { s += R(x - 28, y - 38, 56, 12, '#000', 'opacity=".12"') + R(x - 28, y + 26, 56, 12, '#000', 'opacity=".12"') + R(x - 28, y - 28, 56, 56, 'none', 'rx="3" stroke="#b2a587" stroke-width="1"') + h.glyph(d[i], x, y, 15, '#2a2118') + (i ? L(x - 32, y - 38, x - 32, y + 38, '#8d7c5a', 2) : ''); });
      return s + R(Math.min(336, b + 40), 218, 8, 56, '#6a6f6c', 'rx="4"') + C(Math.min(340, b + 44), 216, 8, '#7a2a1e');
    },
  },
  flags: {
    type: 'color', name: '신호 깃발', layout: n => ({ at: row(n, 64, 300) }),
    draw(u, lock, d, h) {
      const [a, b] = span(lock.at);
      let s = R(a - 44, 372, b - a + 88, 8, '#3a3f42');
      lock.at.forEach(([x, y], i) => { s += L(x - 23, 230, x - 23, 372, '#8d938c', 3) + h.swatch(u, d[i], f => P(`M${x - 23} ${y - 21}Q${x + 1} ${y - 29} ${x + 25} ${y - 18}V${y + 24}Q${x + 1} ${y + 13} ${x - 23} ${y + 21}Z`, f, 'stroke="#140d08" stroke-width="1.2"')); });
      return s;
    },
  },
  bottles: {
    type: 'color', name: '약병 진열', layout: n => ({ at: row(n, 62, 298) }),
    draw(u, lock, d, h) {
      const [a, b] = span(lock.at);
      let s = R(a - 40, 324, b - a + 80, 10, K(u, 'woodl'), 'stroke="#22170d" stroke-width="1.5"');
      lock.at.forEach(([x, y], i) => { s += h.swatch(u, d[i], f => P(`M${x - 6} ${y - 25}H${x + 6}Q${x + 20} ${y - 18} ${x + 20} ${y - 4}V${y + 25}H${x - 20}V${y - 4}Q${x - 20} ${y - 18} ${x - 6} ${y - 25}Z`, f, 'stroke="#140d08" stroke-width="1.5"')) + R(x - 6, y - 40, 12, 15, '#81938b', 'opacity=".65" stroke="#2b3831" stroke-width="1"') + R(x - 7, y - 48, 14, 9, '#6a4524', 'rx="2"') + L(x - 12, y - 2, x - 12, y + 18, '#fff', 3, 'opacity=".22" stroke-linecap="round"'); });
      return s;
    },
  },
  lanterns: {
    type: 'color', name: '종이 등', layout: n => ({ at: row(n, 64, 300) }),
    draw(u, lock, d, h) {
      const [a, b] = span(lock.at);
      let s = P(`M${a - 50} 200Q180 236 ${b + 50} 200`, 'none', 'stroke="#3a2b1d" stroke-width="2"');
      lock.at.forEach(([x, y], i) => { s += L(x, 214, x, y - 34, '#3a2b1d', 1.5) + h.swatch(u, d[i], f => E(x, y, 23, 28, f, 'stroke="#140d08" stroke-width="1.5"')) + R(x - 12, y - 36, 24, 7, '#2a1f15') + R(x - 12, y + 29, 24, 7, '#2a1f15') + [-10, 0, 10].map(k => L(x - 22, y + k, x + 22, y + k, '#000', 1, 'opacity=".2"')).join(''); });
      return s;
    },
  },
};
export const FORM_NAMES = Object.keys(LOCK_FORMS);
export const formType = form => LOCK_FORMS[form]?.type;
