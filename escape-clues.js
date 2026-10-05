// 단서 그림 표식(mark)을 그립니다. 생성 방의 확대 화면에 놓이는 숫자판, 계기, 창문, 구슬, 그림자 같은 그림입니다.
// escape-art.js의 kitMark가 먼저 이 함수를 부르고, null이면 기존 표식 그리기로 넘어갑니다.
// h에는 escape-art.js의 도구가 들어옵니다: glyph(name, x, y, s, color), arrow(dir, x, y, s, fill), swatch(u, color, draw), shape(kind, x, y, s, fill, extra), colors.
import { R, C, E, P, L, T, poly, K } from './escape-props.js?v=escape-10';
import { icon, ICONS } from './escape-icons.js?v=escape-10';

const EDGE = 'stroke="#211b15" stroke-width="1.3"';
const round = n => Math.round(n * 100) / 100;
const point = (x, y, r, a) => [round(x + r * Math.cos(a * Math.PI / 180)), round(y + r * Math.sin(a * Math.PI / 180))];
const turn = (body, x, y, a = 0, flip = false) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${flip ? -1 : 1} 1) translate(${-x} ${-y})">${body}</g>`;
const lineStyle = 'stroke-linecap="round" stroke-linejoin="round"';

function card(u, k) {
  const mats = {
    cloth: ['#c0b39a', '#716550', 3], wood: [K(u, 'woodl'), '#392819', 2],
    stone: ['#ada99b', '#5f6058', 4], chalk: ['#28302c', '#716c55', 2],
    screen: ['#142c21', '#0b100e', 15], glass: ['#34474d', '#9aa9a7', 4],
    night: [K(u, 'night'), '#6c7987', 2], metal: ['#535b5a', '#a4aba2', 4],
    snow: ['#dbe3de', '#98a9ad', 10], leather: ['#5b3f30', '#a58b64', 8],
    brass: [K(u, 'brass'), '#705b33', 3], velvet: ['#4d3545', '#8d6a78', 5],
    tile: ['#d8d7c8', '#727c74', 1], parchment: [K(u, 'paper'), '#a8895a', 2],
  };
  const mat = mats[k];
  if (!mat) return null;
  const [fill, edge, rx] = mat;
  // 납작한 판처럼 보이지 않게, 위에서 빛을 받은 결과 안쪽 테두리와 위쪽 고정 집게를 그립니다(그림 판 위에서 물건에 걸린 안내판처럼 보이게).
  const lit = `<defs><linearGradient id="${u}-cardlit" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>`;
  let out = lit + E(180, 352, 150, 10, '#000', 'opacity=".28"') + R(42, 108, 288, 244, '#000', 'opacity=".3"') + R(36, 100, 288, 244, fill, `rx="${rx}" stroke="${edge}" stroke-width="2"`)
    + R(36, 100, 288, 244, K(u, 'cardlit'), `rx="${rx}"`) + R(39.5, 103.5, 281, 237, 'none', `rx="${Math.max(0, rx - 2)}" stroke="#fff" stroke-opacity=".16" stroke-width="1.2"`)
    + [96, 264].map(x => R(x - 1, 90, 2, 12, '#3a3226') + R(x - 12, 94, 24, 11, '#8a7a55', 'rx="2" stroke="#3a3226" stroke-width="1.2"') + L(x - 8, 97.5, x + 8, 97.5, '#d9c89a', 1, 'opacity=".6"')).join('');
  if (k === 'cloth' || k === 'leather') out += R(44, 108, 272, 228, 'none', `rx="${rx}" stroke="${edge}" stroke-width="1" stroke-dasharray="3 4"`) + L(48, 110, 312, 110, '#fff', 1, 'opacity=".12"');
  if (k === 'wood') out += [106, 337].map(y => L(43, y, 317, y, '#23170d', 2)).join('') + [48, 312].flatMap(x => [114, 330].map(y => C(x, y, 2.2, '#5c503b'))).join('');
  if (k === 'stone') out += P('M37 116L51 101M310 101L323 115M37 329L51 343M310 343L323 329', 'none', 'stroke="#d7d5ca" stroke-width="2" opacity=".5"');
  if (k === 'chalk') out += R(40, 104, 280, 236, 'none', 'stroke="#b1a382" stroke-width="4"') + R(282, 335, 23, 4, '#dbd6c5', 'rx="1"');
  if (k === 'screen') out += R(43, 107, 274, 230, 'none', 'rx="12" stroke="#567961" stroke-width="1"') + P('M53 144V127Q53 117 66 117H88', 'none', 'stroke="#c7dfc5" stroke-width="2" opacity=".18"') + C(309, 329, 2, '#9fc29c');
  if (k === 'glass') out += P('M47 157V111H93M267 333H313V287', 'none', 'stroke="#e0ebe5" stroke-width="3" opacity=".35"') + L(48, 331, 312, 111, '#dbe9df', 17, 'opacity=".04"');
  if (k === 'night') out += R(43, 107, 274, 230, 'none', 'stroke="#a4adb9" stroke-width=".7" opacity=".3"');
  if (k === 'metal' || k === 'brass') out += [48, 312].flatMap(x => [112, 332].map(y => C(x, y, 3, '#b6b8a5', EDGE) + L(x - 1.6, y, x + 1.6, y, '#474a42', 1))).join('') + L(55, 105, 305, 105, '#fff', 1, 'opacity=".25"');
  if (k === 'snow') out += P('M37 113Q50 100 63 108T96 106T129 108T165 104T206 107T252 105T289 108T323 104V100H36Z', '#f4f5ec') + E(73, 340, 27, 6, '#edf0e8');
  if (k === 'velvet') out += R(43, 107, 274, 230, 'none', 'rx="3" stroke="#b39a88" stroke-width="1"') + L(48, 111, 48, 333, '#bd9aa6', 3, 'opacity=".13"');
  if (k === 'tile') out += R(41, 105, 278, 234, 'none', 'stroke="#f2efe3" stroke-width="3"') + P('M37 329L51 343H36Z', '#8b9187');
  if (k === 'parchment') out += P('M37 100H55L49 108H37ZM306 344H324V329L317 336Z', '#bba57a') + L(48, 110, 309, 110, '#a88c59', 1, 'opacity=".35"');
  return out;
}

function clock(u, m) {
  const { x, y, r, k } = m;
  const f = r * (k === 'alarm' || k === 'cuckoo' ? .68 : k === 'pocket' ? .83 : .9);
  let out = E(x, y + r * .95, r * .75, r * .065, '#000', 'opacity=".3"');
  if (k === 'pocket') out += P(`M${x + f * .6} ${y - f * .85}Q${x + r * 1.18} ${y - r * 1.1} ${x + r * .95} ${y - r * .15}Q${x + r * .82} ${y + r * .55} ${x + r * .56} ${y + r * .7}`, 'none', `stroke="#aa915c" stroke-width="3" ${lineStyle}`) + C(x, y - f - r * .1, r * .12, 'none', 'stroke="#b5a077" stroke-width="4"') + R(x - r * .09, y - f - r * .12, r * .18, r * .15, K(u, 'brass'), EDGE);
  if (k === 'alarm') out += [-1, 1].map(d => turn(E(x + d * f * .8, y - f * .9, f * .42, f * .19, K(u, 'steel'), EDGE), x + d * f * .8, y - f * .9, d * 30) + L(x + d * f * .65, y + f * .7, x + d * f * .85, y + f * 1.18, '#66675d', 5, lineStyle)).join('') + L(x, y - f, x, y - f * 1.2, '#9a9d91', 3);
  if (k === 'cuckoo') out += R(x - f * 1.22, y - f * .85, f * 2.44, f * 2.04, K(u, 'wood'), EDGE) + poly([[x - f * 1.48, y - f * .8], [x, y - f * 1.65], [x + f * 1.48, y - f * .8]], K(u, 'woodl'), EDGE) + C(x, y - f * 1.17, f * .14, '#21180e') + L(x, y + f * 1.18, x, y + f * 1.5, '#ae9054', 2) + C(x, y + f * 1.5, f * .15, K(u, 'brass'), EDGE);
  const rim = k === 'tower' ? '#807d70' : k === 'station' ? '#252c29' : k === 'cuckoo' ? K(u, 'woodl') : K(u, 'brass');
  out += C(x, y, f, rim, EDGE);
  if (k === 'tower') out += Array.from({ length: 12 }, (_, i) => { const a = i * 30, p = point(x, y, f * .92, a), q = point(x, y, f, a); return L(...p, ...q, '#494a42', 2); }).join('');
  out += C(x, y, f * .88, '#e9e4d4', 'stroke="#514c40" stroke-width="1"');
  for (let i = 0; i < 60; i++) {
    const p = point(x, y, f * (i % 5 ? .81 : .75), i * 6 - 90), q = point(x, y, f * .84, i * 6 - 90);
    out += L(...p, ...q, '#302d27', i % 5 ? .8 : k === 'station' ? 3 : 1.8);
  }
  const roman = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 12; i++) {
    const p = point(x, y, f * .62, i * 30 - 90);
    out += T(...p, k === 'tower' ? roman[i] : (i || 12), f * (k === 'tower' ? .115 : .145), '#302d27', 'font-family="Georgia, serif"');
  }
  if (m.time != null) {
    const [hh, mm] = m.time.split(':').map(Number);
    const hour = point(x, y, f * .46, ((hh % 12) + mm / 60) * 30 - 90), minute = point(x, y, f * .71, mm * 6 - 90);
    out += L(x, y, ...hour, '#302b24', Math.max(3, f * .05), lineStyle) + L(x, y, ...minute, '#302b24', Math.max(1.8, f * .025), lineStyle) + C(x, y, f * .047, '#b19b64', EDGE);
  } else out += C(x, y, f * .025, '#756c59');
  return out;
}

let lastArch = null;

function band(m, paint) {
  const { x, y } = m;
  const body = paint(fill => R(x, y, m.w, m.h, fill, `stroke="#25221c" stroke-width="${m.lead ? 3 : 1}"`)) + (m.lead ? L(x + 1, y + m.h * .46, x + m.w - 1, y + m.h * .46, '#262b29', 2) + L(x + m.w * .22, y + 4, x + m.w * .22, y + m.h - 4, '#fff', 2, 'opacity=".1"') : m.spine ? [y + 12, y + m.h - 14].map(v => R(x + 2, v, m.w - 4, 4, '#c2ab75', 'opacity=".65"')).join('') + L(x + 4, y + 2, x + 4, y + m.h - 2, '#fff', 2, 'opacity=".12"') : L(x + 2, y + m.h - 3, x + m.w - 2, y + m.h - 3, '#211b15', 1, 'opacity=".3"'));
  return body;
}

function trailPoints(m) {
  if (!m.dash || m.pts.length < 3) return m.pts;
  const pts = [m.pts[0]];
  for (let i = 1; i < m.pts.length; i++) {
    const a = m.pts[i - 1], b = m.pts[i], dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy;
    // A long path must not pass through a token visited later in the sequence.
    const collision = len2 && m.pts.some((p, j) => {
      if (j === i - 1 || j === i) return false;
      const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
      return t > .08 && t < .92 && Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy) < 22;
    });
    if (collision) {
      const len = Math.sqrt(len2), sign = Math.abs(dx) >= Math.abs(dy) ? (((a[1] + b[1]) / 2 >= 222) === (dx >= 0) ? 1 : -1) : (((a[0] + b[0]) / 2 >= 180) === (dy < 0) ? 1 : -1);
      const ox = -dy / len * 26 * sign, oy = dx / len * 26 * sign;
      const detour = p => [round(Math.max(48, Math.min(312, p[0] + ox))), round(Math.max(112, Math.min(334, p[1] + oy)))];
      pts.push(detour(a), detour(b));
    }
    pts.push(b);
  }
  return pts;
}

export function clueMark(u, m, h) {
  const { x, y, s = 16 } = m, ink = m.c ?? '#2a2118';
  const paint = draw => h.swatch(u, ink, draw);
  switch (m.t) {
    case 'card': return !m.k || m.k === 'paper' ? null : card(u, m.k);
    case 'clock': return !m.k || m.k === 'wall' ? null : clock(u, m);
    case 'icon': {
      const picture = paint(fill => icon(m.n, x, y, s, fill));
      // A shadow must contain no cream sails, stems or metallic caps.
      const silhouette = picture.replace(/fill="(?!none")[^"]+"/g, 'fill="#0b0a09"').replace(/stroke="[^"]+"/g, 'stroke="#0b0a09"');
      const token = m.disc ? C(x, y, s * 1.4, '#e5dcc6', 'stroke="#8d8068" stroke-width="1"') : '';
      const pool = m.spot ? E(x, y + s * .25, s * 1.7, s * 1.6, K(u, 'glow'), 'opacity=".5"') : '';
      // Light ink on a night card still needs to be readable inside a light token.
      const discPicture = m.disc && /^#e|^#f/i.test(ink) ? icon(m.n, x, y, s, '#2a2118') : picture;
      return token + pool + turn(m.spot ? silhouette : discPicture, x, y, m.rot ?? 0, m.flip);
    }
    case 'seg': {
      const segments = ['ab cdef'.replace(/ /g, ''), 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
      const paths = {
        a: [[-.42, -.95], [.42, -.95]], b: [[.5, -.83], [.5, -.12]], c: [[.5, .12], [.5, .83]],
        d: [[-.42, .95], [.42, .95]], e: [[-.5, .12], [-.5, .83]], f: [[-.5, -.83], [-.5, -.12]], g: [[-.42, 0], [.42, 0]],
      };
      return Object.entries(paths).map(([key, pts]) => {
        const draw = fill => L(x + pts[0][0] * s, y + pts[0][1] * s, x + pts[1][0] * s, y + pts[1][1] * s, fill, s * .16, 'stroke-linecap="square"');
        return segments[m.v]?.includes(key) ? paint(draw) : draw('#817a68').replace('/>', ' opacity=".13"/>');
      }).join('');
    }
    case 'text': return paint(fill => T(x, y, m.v, s, fill, `font-family="${m.serif ? 'Georgia, serif' : 'system-ui, sans-serif'}"`));
    case 'gauge': {
      const r = m.r;
      let out = C(x + 1, y + 2, r, '#000', 'opacity=".25"') + C(x, y, r, K(u, 'steel'), EDGE) + C(x, y, r * .88, '#e5dfcb', 'stroke="#595a50" stroke-width="1"');
      for (let i = 0; i <= 9; i++) {
        const a = 135 + i * 30, p = point(x, y, r * .78, a), q = point(x, y, r * .87, a), label = point(x, y, r * .6, a);
        out += L(...p, ...q, '#393a32', 1) + T(...label, i, Math.max(7, r * .25), '#3d3b32', 'font-family="system-ui, sans-serif"');
      }
      const tip = point(x, y, r * .76, 135 + Number(m.v) * 30);
      const reading = point(x, y, r * .6, 135 + Number(m.v) * 30);
      return out + L(x, y, ...tip, '#9e4435', Math.max(1.5, r * .055), lineStyle) + C(...reading, r * .16, '#e5dfcb') + T(...reading, m.v, Math.max(7, r * .25), '#3d3b32', 'font-family="system-ui, sans-serif"') + C(x, y, r * .09, '#49493d') + L(x - r * .18, y + r * .76, x + r * .18, y + r * .76, '#78715b', 1);
    }
    case 'tube': {
      const top = y - m.h / 2, bottom = y + m.h / 2, unit = (m.h - 16) / 9, liquid = Math.max(0, Math.min(9, Number(m.v))) * unit;
      let out = R(x - 13, top, 26, m.h, '#b5c2bd', 'rx="9" fill-opacity=".12" stroke="#889c98" stroke-width="1.5"');
      if (liquid) out += paint(fill => R(x - 9, bottom - 8 - liquid, 18, liquid, fill, 'rx="2"')) + E(x, bottom - 8 - liquid, 9, 2, '#d3e0d7', 'opacity=".65"');
      out += L(x - 6, top + 10, x - 6, bottom - 10, '#eef1dc', 2, 'opacity=".4"') + R(x - 14, top - 3, 28, 7, K(u, 'steel'), EDGE) + R(x - 14, bottom - 4, 28, 7, K(u, 'steel'), EDGE);
      for (let i = 0; i <= 9; i++) out += L(x + 10, bottom - 8 - i * unit, x + 17, bottom - 8 - i * unit, '#c4c6af', 1) + T(x + 23, bottom - 8 - i * unit, i, 8, '#39463f', 'font-family="system-ui, sans-serif" stroke="#d6dbca" stroke-width=".5" paint-order="stroke"');
      return out;
    }
    case 'stack': return Array.from({ length: m.k }, (_, i) => paint(fill => icon(m.n, x + (i % 2 ? 1 : -1), y - i * s * 2.25, s, fill))).join('');
    case 'feet': {
      const c = m.cell, color = m.ink ?? ink;
      let out = Array.from({ length: m.rows }, (_, j) => Array.from({ length: m.cols }, (_, i) => C(x + i * c, y + j * c, 2, color, 'opacity=".3"')).join('')).join('');
      let [cx, cy] = m.start;
      out += C(x + cx * c, y + cy * c, c * .19, 'none', `stroke="${color}" stroke-width="2"`);
      for (const d of m.moves) {
        const [dx, dy] = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }[d];
        const px = x + (cx + dx / 2) * c, py = y + (cy + dy / 2) * c;
        out += turn(icon('foot', px, py, c * .2, color), px, py, { up: 0, right: 90, down: 180, left: 270 }[d]);
        cx += dx; cy += dy;
      }
      const ex = x + cx * c, ey = y + cy * c;
      return out + L(ex - 5, ey - 5, ex + 5, ey + 5, color, 2) + L(ex + 5, ey - 5, ex - 5, ey + 5, color, 2);
    }
    case 'needle': return C(x, y, s * .95, 'none', 'stroke="#96856a" stroke-width="1" opacity=".45"') + turn(poly([[x, y - s], [x + s * .2, y], [x - s * .2, y]], '#ac4a3c', EDGE) + poly([[x, y + s * .75], [x + s * .2, y], [x - s * .2, y]], '#363d3b', EDGE), x, y, { up: 0, right: 90, down: 180, left: 270 }[m.d]) + C(x, y, s * .12, K(u, 'brass'), EDGE);
    case 'win': return R(x - m.w / 2 - 3, y - m.h / 2 - 3, m.w + 6, m.h + 6, '#736c58', EDGE) + R(x - m.w / 2, y - m.h / 2, m.w, m.h, m.on ? '#dbc189' : '#121c24', 'stroke="#211b15" stroke-width="1"') + (m.on ? R(x - m.w / 2 + 2, y - m.h / 2 + 2, m.w - 4, m.h * .3, '#eee0b7', 'opacity=".4"') : '') + L(x, y - m.h / 2, x, y + m.h / 2, '#655d4b', 2) + L(x - m.w / 2, y, x + m.w / 2, y, '#655d4b', 2);
    case 'rect': return paint(fill => R(x, y, m.w, m.h, fill));
    case 'roof': return poly([[x, y], [x + m.w / 2, y - m.h], [x + m.w, y]], '#4c4336', EDGE) + L(x, y, x + m.w, y, '#736957', 2);
    case 'taper': return (m.on ? E(x, y - s * 1.3, s * 1.5, s * 1.8, K(u, 'glow'), 'opacity=".32"') : '') + E(x, y + s * 2.35, s * .9, s * .16, '#28241d') + R(x - s * .3, y - s * .4, s * .6, s * 2.7, '#d4c8a5', EDGE) + L(x - s * .12, y - s * .3, x - s * .12, y + s * 2.2, '#eee5cb', 1.5) + L(x, y - s * .4, x, y - s * .65, '#2a2118', 1.5) + (m.on ? P(`M${x} ${y - s * 1.65}Q${x + s * .6} ${y - s * .9} ${x} ${y - s * .65}Q${x - s * .5} ${y - s * .95} ${x} ${y - s * 1.65}Z`, '#e2b669') : P(`M${x} ${y - s * .8}q${-s * .35} ${-s * .35} 0 ${-s * .7}t0 ${-s * .6}`, 'none', 'stroke="#9b9f97" stroke-width="1.3" opacity=".65"'));
    case 'moon': return C(x, y, s, m.on ? '#dedbc2' : '#151d25', `stroke="${m.on ? '#adaf9e' : '#767e82'}" stroke-width="${m.on ? 1 : 1.5}"`) + (m.on ? E(x - s * .22, y - s * .23, s * .65, s * .65, '#f3eed7', 'opacity=".22"') : '');
    case 'band': {
      const body = band(m, paint);
      return m.lead && lastArch?.u === u ? `<g clip-path="url(#${lastArch.id})">${body}</g>` : body;
    }
    case 'bead': return E(x + 1, y + s * .95, s * .75, s * .2, '#000', 'opacity=".23"') + paint(fill => C(x, y, s, fill, EDGE)) + C(x - s * .3, y - s * .35, s * .22, '#f6ecd5', 'opacity=".48"') + P(`M${x + s * .5} ${y - s * .6}A${s * .8} ${s * .8} 0 0 1 ${x + s * .5} ${y + s * .6}`, 'none', 'stroke="#211b15" stroke-width="1.2" opacity=".35"');
    case 'arch': {
      const d = `M${x} ${y + m.h}V${y + m.w / 2}A${m.w / 2} ${m.w / 2} 0 0 1 ${x + m.w} ${y + m.w / 2}V${y + m.h}Z`;
      const inset = `M${x + 4} ${y + m.h - 4}V${y + m.w / 2}A${m.w / 2 - 4} ${m.w / 2 - 4} 0 0 1 ${x + m.w - 4} ${y + m.w / 2}V${y + m.h - 4}Z`;
      lastArch = { u, id: `${u}-arch-${x}-${y}` };
      return `<defs><clipPath id="${lastArch.id}">${P(inset, '#fff')}</clipPath></defs>` + P(d, '#283a3e', 'stroke="#8b897b" stroke-width="8"') + P(`M${x + 5} ${y + m.w / 2}Q${x + m.w / 2} ${y + 12} ${x + m.w - 5} ${y + m.w / 2}`, 'none', 'stroke="#bcc0a5" stroke-width="1" opacity=".45"');
    }
    case 'poly': return paint(fill => `<polyline points="${trailPoints(m).map(p => p.join(',')).join(' ')}" fill="none" stroke="${fill}" stroke-width="${m.w ?? 1}" ${lineStyle}${m.dash ? ` stroke-dasharray="${m.dash}"` : ''}${m.op != null ? ` opacity="${m.op}"` : ''}/>`);
    case 'ring': return paint(fill => C(x, y, m.r, 'none', `stroke="${fill}" stroke-width="2"`));
    case 'star': return paint(fill => poly([[x, y - s], [x + s * .28, y - s * .28], [x + s, y], [x + s * .28, y + s * .28], [x, y + s], [x - s * .28, y + s * .28], [x - s, y], [x - s * .28, y - s * .28]], fill));
    case 'flash': return E(x, y, m.k === 'dash' ? 20 : 12, 15, K(u, 'glow'), 'opacity=".32"') + (m.k === 'dash' ? R(x - 15, y - 4, 30, 8, '#e1c38b', 'rx="4" stroke="#8c7044" stroke-width="1.3"') : C(x, y, 4.5, '#e1c38b', 'stroke="#8c7044" stroke-width="1.3"'));
    // The note HEAD, not the icon's bounding-box centre, must sit on the encoded staff line.
    case 'note': return paint(fill => E(x, y, 8, 5.5, fill, `transform="rotate(-18 ${x} ${y})"`) + L(x + 7, y - 1, x + 7, y - 24, fill, 1.6));
    default: return null;
  }
}
